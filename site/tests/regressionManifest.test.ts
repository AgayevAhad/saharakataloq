import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeDualDatabaseMigration } from '../backend/pimV2Migration.mjs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');
const LIVE_SITE_DB = join(ROOT, 'data', 'catalog.sqlite');
const LIVE_DRAFT_DB = join(ROOT, 'data', 'catalog-draft.sqlite');

describe('Full Real-Data Regression Manifest Suite (VACUUM INTO /tmp Clones)', () => {
  let tempDir: string;
  let tempPublicDb: string;
  let tempDraftDb: string;
  let baseline: { products: number; published: number; specs: number; media: number };

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-regression-clone-'));
    tempPublicDb = join(tempDir, 'catalog.sqlite');
    tempDraftDb = join(tempDir, 'catalog-draft.sqlite');

    // Clone live database safely using VACUUM INTO
    const livePubDb = new DatabaseSync(LIVE_SITE_DB, { readOnly: true });
    try {
      livePubDb.exec(`VACUUM INTO '${tempPublicDb}';`);
      baseline = {
        products: (livePubDb.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number })
          .n,
        published: (
          livePubDb
            .prepare("SELECT COUNT(*) AS n FROM products WHERE status = 'published'")
            .get() as { n: number }
        ).n,
        specs: (livePubDb.prepare('SELECT COUNT(*) AS n FROM product_specs').get() as { n: number })
          .n,
        media: (livePubDb.prepare('SELECT COUNT(*) AS n FROM product_media').get() as { n: number })
          .n,
      };
    } finally {
      livePubDb.close();
    }

    const liveDraftDb = new DatabaseSync(LIVE_DRAFT_DB, { readOnly: true });
    try {
      liveDraftDb.exec(`VACUUM INTO '${tempDraftDb}';`);
    } finally {
      liveDraftDb.close();
    }
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('1. Baseline clone matches the current source and has no orphan specs', () => {
    const pubDb = new DatabaseSync(tempPublicDb, { readOnly: true });
    try {
      const prodCount = (pubDb.prepare('SELECT COUNT(*) as cnt FROM products').get() as any).cnt;
      const pubCount = (
        pubDb
          .prepare("SELECT COUNT(*) as cnt FROM products WHERE status = 'published'")
          .get() as any
      ).cnt;
      const specCount = (pubDb.prepare('SELECT COUNT(*) as cnt FROM product_specs').get() as any)
        .cnt;
      const mediaCount = (pubDb.prepare('SELECT COUNT(*) as cnt FROM product_media').get() as any)
        .cnt;

      expect(prodCount).toBe(baseline.products);
      expect(pubCount).toBe(baseline.published);
      expect(specCount).toBe(baseline.specs);
      expect(mediaCount).toBe(baseline.media);
      expect(prodCount).toBeGreaterThan(0);
      expect(pubCount).toBeGreaterThan(0);
      expect(pubDb.prepare('PRAGMA foreign_key_check').all()).toEqual([]);

      const duplicateTitles = (
        pubDb
          .prepare(
            `SELECT COUNT(*) AS cnt FROM (
              SELECT brand_id, lower(trim(title)), COUNT(*) AS row_count
              FROM products
              GROUP BY brand_id, lower(trim(title))
              HAVING row_count > 1
            )`
          )
          .get() as any
      ).cnt;
      const invalidProducts = (
        pubDb
          .prepare(
            "SELECT COUNT(*) AS cnt FROM products WHERE lower(title) = '503 service unavailable'"
          )
          .get() as any
      ).cnt;
      const repairedPrice = (
        pubDb.prepare("SELECT price FROM products WHERE code = '00312324'").get() as any
      ).price;
      const exactRawMedia = (
        pubDb
          .prepare("SELECT COUNT(*) AS cnt FROM product_media WHERE url LIKE '%_raw_%'")
          .get() as any
      ).cnt;
      expect(duplicateTitles).toBe(0);
      expect(invalidProducts).toBe(0);
      expect(repairedPrice).toBe(29.99);
      expect(exactRawMedia).toBeGreaterThan(0);
    } finally {
      pubDb.close();
    }
  });

  it('2. Version 8 migration executes cleanly on full real-data clone with 0 data loss', () => {
    const migrationResult = executeDualDatabaseMigration(tempDir);
    expect(migrationResult.success).toBe(true);

    const pubDb = new DatabaseSync(tempPublicDb, { readOnly: true });
    try {
      // PRAGMA checks
      const integrity = pubDb.prepare('PRAGMA integrity_check').get() as any;
      const fkCheck = pubDb.prepare('PRAGMA foreign_key_check').all();
      expect(integrity.integrity_check).toBe('ok');
      expect(fkCheck).toEqual([]);

      // Product count preservation
      const prodCount = (pubDb.prepare('SELECT COUNT(*) as cnt FROM products').get() as any).cnt;
      const publishedCount = (
        pubDb
          .prepare("SELECT COUNT(*) as cnt FROM products WHERE publication_status = 'published'")
          .get() as any
      ).cnt;
      expect(prodCount).toBe(baseline.products);
      expect(publishedCount).toBe(baseline.published);

      // Specs preservation in both product_specs and product_spec_values
      const legacySpecs = (pubDb.prepare('SELECT COUNT(*) as cnt FROM product_specs').get() as any)
        .cnt;
      const v2SpecValues = (
        pubDb.prepare('SELECT COUNT(*) as cnt FROM product_spec_values').get() as any
      ).cnt;
      expect(legacySpecs).toBe(baseline.specs);
      expect(v2SpecValues).toBe(baseline.specs);

      // Media variants preservation
      const legacyMedia = (pubDb.prepare('SELECT COUNT(*) as cnt FROM product_media').get() as any)
        .cnt;
      const v2MediaVariants = (
        pubDb.prepare('SELECT COUNT(*) as cnt FROM product_media_variants').get() as any
      ).cnt;
      expect(legacyMedia).toBe(baseline.media);
      expect(v2MediaVariants).toBe(baseline.media);

      // One default primary variant for every current product.
      const variantCount = (
        pubDb.prepare('SELECT COUNT(*) as cnt FROM product_variants').get() as any
      ).cnt;
      expect(variantCount).toBe(baseline.products);

      // Initial revisions created
      const revCount = (pubDb.prepare('SELECT COUNT(*) as cnt FROM product_revisions').get() as any)
        .cnt;
      expect(revCount).toBe(baseline.products);

      // Migration record in schema_migrations table
      const mig = pubDb.prepare('SELECT * FROM schema_migrations WHERE version = 8').get() as any;
      expect(mig).toBeDefined();
      expect(mig.version).toBe(8);
      expect(mig.name).toBe('0008_pim_v2_additive_architecture');
      expect(mig.status).toBe('success');
    } finally {
      pubDb.close();
    }
  });
});
