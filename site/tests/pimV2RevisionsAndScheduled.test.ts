import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';
import { applyPimV2Schema, migrateDataToPimV2 } from '../backend/pimV2Migration.mjs';
import { processScheduledPublications } from '../backend/scheduledPublicationJob.mjs';

describe('PIM v2 Optimistic Concurrency, Revisions & Scheduled Job Suite', () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-pim-rev-'));
    dbPath = join(tempDir, 'catalog.sqlite');

    const db = createCatalogDatabase(dbPath);
    db.saveCatalog({
      brands: [
        {
          id: 'ardo',
          name: 'ARDO',
          slug: 'ardo',
          originCountry: 'İtaliya',
          manufacturingCountries: ['İtaliya'],
          comingSoon: false,
          active: true,
        },
      ],
      categories: [
        {
          id: 'cooktop',
          name: 'Qaz Panelləri',
          slug: 'cooktop',
          icon: 'flame',
          active: true,
          sortOrder: 1,
        },
      ],
      products: [
        {
          id: 'p-100',
          code: 'M-100',
          title: 'ARDO Qaz Paneli',
          brandId: 'ardo',
          category: 'cooktop',
          image: '/media/ardo/m-100.jpg',
          status: 'published',
          price: 500,
          shortDesc: 'İtalyan paneli',
          specs: [],
          media: [],
        },
      ],
    });
    db.close();

    // Apply PIM v2 schema and migration
    const pimDb = new DatabaseSync(dbPath);
    applyPimV2Schema(pimDb);
    migrateDataToPimV2(pimDb);
    pimDb.close();
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('1. Version increment and revision creation on update', () => {
    const db = new DatabaseSync(dbPath);
    try {
      const initialProduct = db.prepare('SELECT * FROM products WHERE id = ?').get('p-100') as any;
      expect(initialProduct.version).toBe(1);

      // Perform an update with version check
      const currentVersion = initialProduct.version;
      const newTitle = 'ARDO Qaz Paneli Yenilənmiş';

      db.exec('BEGIN IMMEDIATE;');
      const updateStmt = db.prepare(`
        UPDATE products
        SET title = ?, version = version + 1, updated_at = datetime('now')
        WHERE id = ? AND version = ?
      `);
      const updateResult = updateStmt.run(newTitle, 'p-100', currentVersion);
      expect(updateResult.changes).toBe(1);

      // Save revision
      const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get('p-100') as any;
      db.prepare(
        `
        INSERT INTO product_revisions(id, product_id, version, action, payload_json, diff_json, actor_id, created_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `
      ).run(
        `rev-p-100-${updatedProduct.version}`,
        'p-100',
        updatedProduct.version,
        'update',
        JSON.stringify(updatedProduct),
        JSON.stringify({ title: { from: initialProduct.title, to: newTitle } }),
        'admin_user'
      );
      db.exec('COMMIT;');

      expect(updatedProduct.version).toBe(2);
      expect(updatedProduct.title).toBe(newTitle);

      const revs = db
        .prepare('SELECT * FROM product_revisions WHERE product_id = ? ORDER BY version ASC')
        .all('p-100') as any[];
      expect(revs).toHaveLength(2); // Initial migration + 1 update
      expect(revs[1].version).toBe(2);
    } finally {
      db.close();
    }
  });

  it('2. Optimistic concurrency conflict: rejects update with stale version', () => {
    const db = new DatabaseSync(dbPath);
    try {
      // Simulate stale version = 0 while current = 1
      const updateStmt = db.prepare(`
        UPDATE products
        SET title = 'Should Fail', version = version + 1
        WHERE id = ? AND version = ?
      `);
      const result = updateStmt.run('p-100', 0); // Stale version
      expect(result.changes).toBe(0); // 0 rows affected -> conflict
    } finally {
      db.close();
    }
  });

  it('3. Revert revision creates a brand new revision without deleting historical revisions', () => {
    const db = new DatabaseSync(dbPath);
    try {
      // Create version 2
      db.exec(
        "UPDATE products SET title = 'Dəyişdirilmiş Başlıq', version = 2 WHERE id = 'p-100';"
      );
      db.prepare(
        `
        INSERT INTO product_revisions(id, product_id, version, action, payload_json, diff_json, actor_id, created_at)
        VALUES(?, ?, 2, ?, ?, ?, ?, datetime('now'))
      `
      ).run(
        'rev-p-100-2',
        'p-100',
        'update',
        JSON.stringify({ id: 'p-100', title: 'Dəyişdirilmiş Başlıq' }),
        '{}',
        'admin'
      );

      // Revert back to revision 1 (Initial title)
      const rev1 = db
        .prepare("SELECT * FROM product_revisions WHERE product_id = 'p-100' AND version = 1")
        .get() as any;
      const initialPayload = JSON.parse(rev1.payload_json);

      db.exec('BEGIN IMMEDIATE;');
      db.prepare(
        `
        UPDATE products SET title = ?, version = 3, updated_at = datetime('now') WHERE id = ?
      `
      ).run(initialPayload.title, 'p-100');

      db.prepare(
        `
        INSERT INTO product_revisions(id, product_id, version, action, payload_json, diff_json, actor_id, created_at)
        VALUES(?, ?, 3, ?, ?, ?, ?, datetime('now'))
      `
      ).run(
        'rev-p-100-3',
        'p-100',
        'rollback',
        JSON.stringify(initialPayload),
        '{"action":"revert_to_v1"}',
        'admin'
      );
      db.exec('COMMIT;');

      const allRevs = db
        .prepare(
          "SELECT version FROM product_revisions WHERE product_id = 'p-100' ORDER BY version ASC"
        )
        .all() as any[];
      expect(allRevs.map((r) => r.version)).toEqual([1, 2, 3]); // None deleted, v3 created

      const currentProd = db.prepare("SELECT * FROM products WHERE id = 'p-100'").get() as any;
      expect(currentProd.version).toBe(3);
      expect(currentProd.title).toBe('ARDO Qaz Paneli');
    } finally {
      db.close();
    }
  });

  it('4. Server-Side Scheduled Publication Job publishes overdue products safely and idempotently', () => {
    const db = new DatabaseSync(dbPath);
    try {
      // Set product to scheduled with past UTC timestamp
      const pastUtc = new Date(Date.now() - 60000).toISOString();
      db.prepare(
        `
        UPDATE products
        SET publication_status = 'scheduled', scheduled_at = ?
        WHERE id = 'p-100'
      `
      ).run(pastUtc);
    } finally {
      db.close();
    }

    // Run scheduled job
    const runResult1 = processScheduledPublications(dbPath);
    expect(runResult1.processedCount).toBe(1);
    expect(runResult1.products[0].id).toBe('p-100');

    // Verify DB state
    const verifyDb = new DatabaseSync(dbPath);
    const prod = verifyDb.prepare("SELECT * FROM products WHERE id = 'p-100'").get() as any;
    expect(prod.publication_status).toBe('published');
    expect(prod.scheduled_at).toBeNull();
    verifyDb.close();

    // Idempotent re-run: 0 products overdue
    const runResult2 = processScheduledPublications(dbPath);
    expect(runResult2.processedCount).toBe(0);
  });
});
