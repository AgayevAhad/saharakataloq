import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  ScheduledPublicationWorker,
  processScheduledPublications,
} from '../backend/scheduledPublicationJob.mjs';
import { executeDualDatabaseMigration } from '../backend/pimV2Migration.mjs';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';

describe('Scheduled Publication Negative Scenarios & FK Integrity Suite', () => {
  let tempDir: string;
  let publicDbPath: string;
  let draftDbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-pub-neg-test-'));
    publicDbPath = join(tempDir, 'catalog.sqlite');
    draftDbPath = join(tempDir, 'catalog-draft.sqlite');

    const db = createCatalogDatabase(publicDbPath);
    db.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'Italy' }],
      categories: [{ id: 'hood', name: 'Hoods', slug: 'hood', sortOrder: 1 }],
      products: [],
    });
    db.close();

    const draftDb = createCatalogDatabase(draftDbPath);
    draftDb.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'Italy' }],
      categories: [{ id: 'hood', name: 'Hoods', slug: 'hood', sortOrder: 1 }],
      products: [
        {
          id: 'prod-test-1',
          code: 'HD-100',
          title: 'ARDO Test Hood',
          brandId: 'ardo',
          category: 'hood',
          price: 500,
          status: 'draft',
          publicationStatus: 'scheduled',
          completenessScore: 85,
        },
      ],
    });
    draftDb.close();

    executeDualDatabaseMigration(tempDir);
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('1. Rejects publication when job.product_version does not match current draft product version', () => {
    const draftDb = new DatabaseSync(draftDbPath);
    const pubDb = new DatabaseSync(publicDbPath);

    try {
      const worker = new ScheduledPublicationWorker({ draftDb, publicDb: pubDb });

      // Draft product has version 1; schedule with stale version 99
      const scheduledAt = new Date(Date.now() - 1000).toISOString();
      const payloadHash = createHash('sha256')
        .update(`prod-test-1:99:${scheduledAt}`)
        .digest('hex');

      draftDb
        .prepare(
          `
        INSERT INTO publication_jobs (id, product_id, scheduled_at, state, payload_hash, product_version, idempotency_key, created_at)
        VALUES ('job-ver-mismatch', 'prod-test-1', ?, 'scheduled', ?, 99, 'key-ver-1', ?)
      `
        )
        .run(scheduledAt, payloadHash, new Date().toISOString());

      const res = worker.processPendingJobs();
      expect(res.processed).toBe(0);

      // Check job failed / retry with error
      const job = draftDb
        .prepare("SELECT * FROM publication_jobs WHERE id = 'job-ver-mismatch'")
        .get() as any;
      expect(job.state).toBe('retry_pending');
      expect(job.last_error).toContain('PRODUCT_VERSION_MISMATCH');

      // Check public database was NOT modified
      const pubProd = pubDb.prepare("SELECT * FROM products WHERE id = 'prod-test-1'").get();
      expect(pubProd).toBeUndefined();
    } finally {
      draftDb.close();
      pubDb.close();
    }
  });

  it('2. Rejects publication when canonical payload_hash does not match job parameters', () => {
    const draftDb = new DatabaseSync(draftDbPath);
    const pubDb = new DatabaseSync(publicDbPath);

    try {
      const worker = new ScheduledPublicationWorker({ draftDb, publicDb: pubDb });

      const scheduledAt = new Date(Date.now() - 1000).toISOString();
      const corruptedHash = '0000000000000000000000000000000000000000000000000000000000000000';

      draftDb
        .prepare(
          `
        INSERT INTO publication_jobs (id, product_id, scheduled_at, state, payload_hash, product_version, idempotency_key, created_at)
        VALUES ('job-hash-mismatch', 'prod-test-1', ?, 'scheduled', ?, 1, 'key-hash-1', ?)
      `
        )
        .run(scheduledAt, corruptedHash, new Date().toISOString());

      const res = worker.processPendingJobs();
      expect(res.processed).toBe(0);

      const job = draftDb
        .prepare("SELECT * FROM publication_jobs WHERE id = 'job-hash-mismatch'")
        .get() as any;
      expect(job.state).toBe('retry_pending');
      expect(job.last_error).toContain('PAYLOAD_HASH_MISMATCH');

      const pubProd = pubDb.prepare("SELECT * FROM products WHERE id = 'prod-test-1'").get();
      expect(pubProd).toBeUndefined();
    } finally {
      draftDb.close();
      pubDb.close();
    }
  });

  it('3. Rejects publication when completeness score is below configured threshold', () => {
    const draftDb = new DatabaseSync(draftDbPath);
    const pubDb = new DatabaseSync(publicDbPath);

    try {
      // Set product completeness to 30%
      draftDb.prepare("UPDATE products SET completeness_score = 30 WHERE id = 'prod-test-1'").run();

      // Configure worker with minimum completeness threshold of 70%
      const worker = new ScheduledPublicationWorker({
        draftDb,
        publicDb: pubDb,
        minCompletenessScore: 70,
      });

      const scheduledAt = new Date(Date.now() - 1000).toISOString();
      const payloadHash = createHash('sha256').update(`prod-test-1:1:${scheduledAt}`).digest('hex');

      draftDb
        .prepare(
          `
        INSERT INTO publication_jobs (id, product_id, scheduled_at, state, payload_hash, product_version, idempotency_key, created_at)
        VALUES ('job-score-low', 'prod-test-1', ?, 'scheduled', ?, 1, 'key-score-1', ?)
      `
        )
        .run(scheduledAt, payloadHash, new Date().toISOString());

      const res = worker.processPendingJobs();
      expect(res.processed).toBe(0);

      const job = draftDb
        .prepare("SELECT * FROM publication_jobs WHERE id = 'job-score-low'")
        .get() as any;
      expect(job.state).toBe('retry_pending');
      expect(job.last_error).toContain('COMPLETENESS_SCORE_TOO_LOW');

      const pubProd = pubDb.prepare("SELECT * FROM products WHERE id = 'prod-test-1'").get();
      expect(pubProd).toBeUndefined();
    } finally {
      draftDb.close();
      pubDb.close();
    }
  });

  it('4. Idempotently copies draft-only FK dependencies (variants, spec definitions, media assets) before promoting product', () => {
    const draftDb = new DatabaseSync(draftDbPath);
    const pubDb = new DatabaseSync(publicDbPath);

    try {
      // Create draft-only brand, spec definition, media asset, and variant
      draftDb
        .prepare(
          `
        INSERT INTO brands (id, name, slug, origin_country, active)
        VALUES ('new-draft-brand', 'New Draft Brand', 'new-draft-brand', 'Italy', 1)
      `
        )
        .run();

      draftDb
        .prepare(
          `
        INSERT INTO spec_definitions (id, key, name_az, data_type, unit_family, filterable, comparable, required, sort_order)
        VALUES ('sdef-draft-only', 'draft_motor_power', 'Mühərrik Gücü', 'number', 'W', 1, 1, 0, 1)
      `
        )
        .run();

      draftDb
        .prepare(
          `
        INSERT INTO media_assets (id, type, url, original_name, byte_size, created_at)
        VALUES ('asset-draft-only', 'image', '/media/draft/pic1.jpg', 'pic1.jpg', 12345, ?)
      `
        )
        .run(new Date().toISOString());

      draftDb
        .prepare(
          `
        UPDATE products
        SET brand_id = 'new-draft-brand', completeness_score = 90
        WHERE id = 'prod-test-1'
      `
        )
        .run();

      draftDb
        .prepare(
          `
        INSERT INTO product_variants (id, product_id, model_code, is_default, sort_order, created_at)
        VALUES ('var-draft-1', 'prod-test-1', 'HD-100-VAR', 1, 0, ?)
      `
        )
        .run(new Date().toISOString());

      draftDb
        .prepare(
          `
        INSERT INTO product_spec_values (
          id, product_id, variant_id, spec_definition_id, raw_name, raw_value, normalized_value_number, unit, created_at
        ) VALUES ('psv-draft-1', 'prod-test-1', 'var-draft-1', 'sdef-draft-only', 'Mühərrik Gücü', '250 W', 250, 'W', ?)
      `
        )
        .run(new Date().toISOString());

      draftDb
        .prepare(
          `
        INSERT INTO product_media_variants (id, product_id, variant_id, media_id, is_primary, sort_order, alt_text)
        VALUES ('pmv-draft-1', 'prod-test-1', 'var-draft-1', 'asset-draft-only', 1, 0, 'Test photo')
      `
        )
        .run();

      // Ensure public database does NOT yet have these FK records
      expect(
        pubDb.prepare("SELECT * FROM brands WHERE id = 'new-draft-brand'").get()
      ).toBeUndefined();
      expect(
        pubDb.prepare("SELECT * FROM spec_definitions WHERE id = 'sdef-draft-only'").get()
      ).toBeUndefined();
      expect(
        pubDb.prepare("SELECT * FROM media_assets WHERE id = 'asset-draft-only'").get()
      ).toBeUndefined();

      const worker = new ScheduledPublicationWorker({
        draftDb,
        publicDb: pubDb,
        minCompletenessScore: 50,
      });
      const scheduledAt = new Date(Date.now() - 1000).toISOString();
      const payloadHash = createHash('sha256').update(`prod-test-1:1:${scheduledAt}`).digest('hex');

      draftDb
        .prepare(
          `
        INSERT INTO publication_jobs (id, product_id, scheduled_at, state, payload_hash, product_version, idempotency_key, created_at)
        VALUES ('job-fk-success', 'prod-test-1', ?, 'scheduled', ?, 1, 'key-fk-1', ?)
      `
        )
        .run(scheduledAt, payloadHash, new Date().toISOString());

      const res = worker.processPendingJobs();
      expect(res.processed).toBe(1);

      // Verify FK records were idempotently created in publicDb and product promoted with clean foreign keys
      const pubBrand = pubDb
        .prepare("SELECT * FROM brands WHERE id = 'new-draft-brand'")
        .get() as any;
      expect(pubBrand).toBeDefined();
      expect(pubBrand.name).toBe('New Draft Brand');

      const pubSpecDef = pubDb
        .prepare("SELECT * FROM spec_definitions WHERE id = 'sdef-draft-only'")
        .get() as any;
      expect(pubSpecDef).toBeDefined();
      expect(pubSpecDef.key).toBe('draft_motor_power');

      const pubAsset = pubDb
        .prepare("SELECT * FROM media_assets WHERE id = 'asset-draft-only'")
        .get() as any;
      expect(pubAsset).toBeDefined();
      expect(pubAsset.url).toBe('/media/draft/pic1.jpg');

      const pubVariant = pubDb
        .prepare("SELECT * FROM product_variants WHERE id = 'var-draft-1'")
        .get() as any;
      expect(pubVariant).toBeDefined();

      const pubSpecVal = pubDb
        .prepare("SELECT * FROM product_spec_values WHERE id = 'psv-draft-1'")
        .get() as any;
      expect(pubSpecVal).toBeDefined();
      expect(pubSpecVal.normalized_value_number).toBe(250);

      const pubMediaVar = pubDb
        .prepare("SELECT * FROM product_media_variants WHERE id = 'pmv-draft-1'")
        .get() as any;
      expect(pubMediaVar).toBeDefined();

      // Check foreign keys integrity on publicDb
      const fkErrors = pubDb.prepare('PRAGMA foreign_key_check').all();
      expect(fkErrors).toHaveLength(0);
    } finally {
      draftDb.close();
      pubDb.close();
    }
  });

  it('5. processScheduledPublications fails closed with PIM_V2_OUTBOX_REQUIRED when publication_jobs table is missing', () => {
    // Create pre-migration DB without publication_jobs
    const legacyDbPath = join(tempDir, 'legacy.sqlite');
    const legacyDb = new DatabaseSync(legacyDbPath);
    legacyDb.exec(`
      CREATE TABLE products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        publication_status TEXT NOT NULL DEFAULT 'scheduled',
        status TEXT NOT NULL DEFAULT 'draft',
        scheduled_at TEXT
      );
      INSERT INTO products (id, title, publication_status, status, scheduled_at)
      VALUES ('p-leg-1', 'Legacy Item', 'scheduled', 'draft', datetime('now', '-1 day'));
    `);
    legacyDb.close();

    const result = processScheduledPublications(legacyDbPath);
    expect(result.error).toBe('PIM_V2_OUTBOX_REQUIRED');
    expect(result.processedCount).toBe(0);

    // Verify product was NOT published directly
    const verifyDb = new DatabaseSync(legacyDbPath);
    const prod = verifyDb.prepare("SELECT * FROM products WHERE id = 'p-leg-1'").get() as any;
    expect(prod.status).toBe('draft');
    expect(prod.publication_status).toBe('scheduled');
    verifyDb.close();
  });
});
