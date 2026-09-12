import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ScheduledPublicationWorker } from '../backend/scheduledPublicationJob.mjs';
import { executeDualDatabaseMigration } from '../backend/pimV2Migration.mjs';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';

describe('Scheduled Publication Outbox Pattern & Worker Suite', () => {
  let tempDir: string;
  let publicDbPath: string;
  let draftDbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-outbox-test-'));
    publicDbPath = join(tempDir, 'catalog.sqlite');
    draftDbPath = join(tempDir, 'catalog-draft.sqlite');

    const db = createCatalogDatabase(publicDbPath);
    db.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'Italy' }],
      categories: [{ id: 'oven', name: 'Ovens', slug: 'oven', sortOrder: 1 }],
      products: [],
    });
    db.close();

    const draftDb = createCatalogDatabase(draftDbPath);
    draftDb.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'Italy' }],
      categories: [{ id: 'oven', name: 'Ovens', slug: 'oven', sortOrder: 1 }],
      products: [
        {
          id: 'p-scheduled-1',
          code: 'OV-500',
          title: 'ARDO Scheduled Oven',
          brandId: 'ardo',
          category: 'oven',
          price: 900,
          image: '/media/ov500.jpg',
          shortDesc: 'Premium built-in oven with convection and timer.',
          description:
            'High quality built-in oven with enamel interior, multi-function cooking modes, and energy class A.',
          status: 'draft',
          publicationStatus: 'scheduled',
          scheduledAt: new Date(Date.now() - 1000).toISOString(), // Past date -> ready to publish
        },
      ],
    });
    draftDb.close();

    // Run migration on both
    executeDualDatabaseMigration(tempDir);
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('1. Schedules publication job and worker promotes draft product to public database', () => {
    const draftDb = new DatabaseSync(draftDbPath);
    const pubDb = new DatabaseSync(publicDbPath);

    try {
      const worker = new ScheduledPublicationWorker({ draftDb, publicDb: pubDb });

      // Create outbox publication job
      const jobId = worker.schedulePublication({
        productId: 'p-scheduled-1',
        scheduledAt: new Date(Date.now() - 1000).toISOString(),
        actor: 'admin-tester',
      });

      expect(jobId).toBeDefined();

      // Check job in outbox table
      const job = draftDb.prepare('SELECT * FROM publication_jobs WHERE id = ?').get(jobId) as any;
      expect(job.state).toBe('scheduled');
      expect(job.product_id).toBe('p-scheduled-1');

      // Process pending jobs
      const result = worker.processPendingJobs();
      expect(result.processed).toBe(1);
      expect(result.published).toBe(1);
      expect(result.failed).toBe(0);

      // Verify job is now marked 'published'
      const updatedJob = draftDb
        .prepare('SELECT * FROM publication_jobs WHERE id = ?')
        .get(jobId) as any;
      expect(updatedJob.state).toBe('published');

      // Verify product is now published in public database
      const publishedProd = pubDb
        .prepare('SELECT * FROM products WHERE id = ?')
        .get('p-scheduled-1') as any;
      expect(publishedProd).toBeDefined();
      expect(publishedProd.code).toBe('OV-500');
      expect(publishedProd.publication_status).toBe('published');
      expect(publishedProd.status).toBe('published');
    } finally {
      draftDb.close();
      pubDb.close();
    }
  });

  it('2. Retry mechanism transitions to retry_pending and respects max retries', () => {
    const draftDb = new DatabaseSync(draftDbPath);
    const pubDb = new DatabaseSync(publicDbPath);

    try {
      const worker = new ScheduledPublicationWorker({ draftDb, publicDb: pubDb });

      // Create a job for existing product, then delete product to simulate processing failure
      const jobId = worker.schedulePublication({
        productId: 'p-scheduled-1',
        scheduledAt: new Date(Date.now() - 1000).toISOString(),
        actor: 'admin-tester',
      });

      draftDb.exec(
        "PRAGMA foreign_keys = OFF; DELETE FROM products WHERE id = 'p-scheduled-1'; PRAGMA foreign_keys = ON;"
      );

      // 1st attempt: fails -> state becomes 'retry_pending', retry_count = 1
      const res1 = worker.processPendingJobs();
      expect(res1.failed).toBe(1);

      const job1 = draftDb.prepare('SELECT * FROM publication_jobs WHERE id = ?').get(jobId) as any;
      expect(job1.state).toBe('retry_pending');
      expect(job1.retry_count).toBe(1);

      // 2nd attempt: fails -> retry_count = 2
      worker.processPendingJobs();
      const job2 = draftDb.prepare('SELECT * FROM publication_jobs WHERE id = ?').get(jobId) as any;
      expect(job2.retry_count).toBe(2);

      // 3rd attempt: reaches max_retries (3) -> state becomes 'failed'
      worker.processPendingJobs();
      const job3 = draftDb.prepare('SELECT * FROM publication_jobs WHERE id = ?').get(jobId) as any;
      expect(job3.state).toBe('failed');
      expect(job3.retry_count).toBe(3);
    } finally {
      draftDb.close();
      pubDb.close();
    }
  });
});
