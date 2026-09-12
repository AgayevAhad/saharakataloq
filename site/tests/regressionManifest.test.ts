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

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-regression-clone-'));
    tempPublicDb = join(tempDir, 'catalog.sqlite');
    tempDraftDb = join(tempDir, 'catalog-draft.sqlite');

    // Clone live database safely using VACUUM INTO
    const livePubDb = new DatabaseSync(LIVE_SITE_DB, { readOnly: true });
    try {
      livePubDb.exec(`VACUUM INTO '${tempPublicDb}';`);
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

  it('1. Baseline clone contains exact expected counts before migration', () => {
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

      expect(prodCount).toBe(350);
      expect(pubCount).toBe(25);
      expect(specCount).toBe(4532);
      expect(mediaCount).toBe(174);
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
      expect(prodCount).toBe(350);
      expect(publishedCount).toBe(25);

      // Specs preservation in both product_specs and product_spec_values
      const legacySpecs = (pubDb.prepare('SELECT COUNT(*) as cnt FROM product_specs').get() as any)
        .cnt;
      const v2SpecValues = (
        pubDb.prepare('SELECT COUNT(*) as cnt FROM product_spec_values').get() as any
      ).cnt;
      expect(legacySpecs).toBe(4532);
      expect(v2SpecValues).toBe(4532);

      // Media variants preservation
      const legacyMedia = (pubDb.prepare('SELECT COUNT(*) as cnt FROM product_media').get() as any)
        .cnt;
      const v2MediaVariants = (
        pubDb.prepare('SELECT COUNT(*) as cnt FROM product_media_variants').get() as any
      ).cnt;
      expect(legacyMedia).toBe(174);
      expect(v2MediaVariants).toBe(174);

      // Variants generated (350 default primary variants)
      const variantCount = (
        pubDb.prepare('SELECT COUNT(*) as cnt FROM product_variants').get() as any
      ).cnt;
      expect(variantCount).toBe(350);

      // Initial revisions created
      const revCount = (pubDb.prepare('SELECT COUNT(*) as cnt FROM product_revisions').get() as any)
        .cnt;
      expect(revCount).toBe(350);

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
