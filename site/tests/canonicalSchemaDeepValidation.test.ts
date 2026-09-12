import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  validateCanonicalSchemaManifest,
  applyPimV2Schema,
  migrateDataToPimV2,
} from '../backend/pimV2Migration.mjs';

describe('Canonical Schema Deep Validation & Manifest Rule Enforcement', () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-deep-schema-'));
    dbPath = join(tempDir, 'catalog.sqlite');
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function setupBaselineValidDb(db: DatabaseSync) {
    db.exec(`
      CREATE TABLE brands (
        id TEXT PRIMARY KEY,
        name TEXT,
        slug TEXT,
        logo_url TEXT,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        country TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT,
        slug TEXT,
        icon TEXT,
        sort_order INTEGER DEFAULT 0
      );
      CREATE TABLE products (
        id TEXT PRIMARY KEY,
        code TEXT,
        title TEXT,
        category TEXT,
        brand_id TEXT,
        price REAL,
        status TEXT,
        created_at TEXT,
        updated_at TEXT
      );
    `);
    applyPimV2Schema(db);
    migrateDataToPimV2(db);
  }

  it('1. Passes cleanly on a fully migrated database', () => {
    const db = new DatabaseSync(dbPath);
    try {
      setupBaselineValidDb(db);
      const manifest = validateCanonicalSchemaManifest(db);
      expect(manifest.isValid).toBe(true);
      expect(manifest.missingTables).toHaveLength(0);
      expect(manifest.columnMismatches).toHaveLength(0);
      expect(manifest.foreignKeyMismatches).toHaveLength(0);
      expect(manifest.missingIndices).toHaveLength(0);
      expect(manifest.missingChecks).toHaveLength(0);
      expect(manifest.foreignKeysIntegrity).toBe(true);
    } finally {
      db.close();
    }
  });

  it('2. Detects Column Type mismatch (e.g. TEXT instead of INTEGER for product_variants.sort_order)', () => {
    const db = new DatabaseSync(dbPath);
    try {
      setupBaselineValidDb(db);

      // Recreate product_variants with wrong type for sort_order (TEXT instead of INTEGER)
      db.exec(`
        DROP TABLE product_variants;
        CREATE TABLE product_variants (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          model_name TEXT NOT NULL,
          sku TEXT,
          barcode TEXT,
          is_default INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'active',
          sort_order TEXT DEFAULT '0',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          CHECK (status IN ('active', 'inactive', 'draft', 'archived')),
          CHECK (is_default IN (0, 1))
        );
      `);

      const manifest = validateCanonicalSchemaManifest(db);
      expect(manifest.isValid).toBe(false);
      expect(
        manifest.columnMismatches.some((m: string) =>
          m.includes('product_variants.sort_order: expected type INTEGER')
        )
      ).toBe(true);
    } finally {
      db.close();
    }
  });

  it('3. Detects Missing NOT NULL constraint on required column (e.g. spec_definitions.unit_family)', () => {
    const db = new DatabaseSync(dbPath);
    try {
      setupBaselineValidDb(db);

      // Recreate spec_definitions where unit_family is nullable instead of NOT NULL
      db.exec(`
        DROP TABLE spec_definitions;
        CREATE TABLE spec_definitions (
          id TEXT PRIMARY KEY,
          key TEXT NOT NULL,
          name_az TEXT NOT NULL,
          data_type TEXT NOT NULL,
          unit_family TEXT,
          filterable INTEGER NOT NULL DEFAULT 0,
          comparable INTEGER NOT NULL DEFAULT 1,
          required INTEGER NOT NULL DEFAULT 0,
          sort_order INTEGER NOT NULL DEFAULT 0,
          CHECK (data_type IN ('text', 'number', 'boolean')),
          CHECK (filterable IN (0, 1)),
          CHECK (comparable IN (0, 1)),
          CHECK (required IN (0, 1))
        );
      `);

      const manifest = validateCanonicalSchemaManifest(db);
      expect(manifest.isValid).toBe(false);
      expect(
        manifest.columnMismatches.some((m: string) =>
          m.includes('spec_definitions.unit_family: expected NOT NULL')
        )
      ).toBe(true);
    } finally {
      db.close();
    }
  });

  it('4. Detects Missing Foreign Key constraint via PRAGMA foreign_key_list (e.g. product_revisions without FK to products)', () => {
    const db = new DatabaseSync(dbPath);
    try {
      setupBaselineValidDb(db);

      // Recreate product_revisions without the FOREIGN KEY constraint
      db.exec(`
        DROP TABLE product_revisions;
        CREATE TABLE product_revisions (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          version INTEGER NOT NULL,
          snapshot_json TEXT NOT NULL,
          diff_summary TEXT,
          checksum TEXT NOT NULL,
          created_by TEXT NOT NULL,
          change_reason TEXT,
          created_at TEXT NOT NULL
        );
      `);

      const manifest = validateCanonicalSchemaManifest(db);
      expect(manifest.isValid).toBe(false);
      expect(
        manifest.foreignKeyMismatches.some((m: string) =>
          m.includes('product_revisions: missing FK references products(id) from product_id')
        )
      ).toBe(true);
    } finally {
      db.close();
    }
  });

  it('5. Detects Missing Required Index in sqlite_master', () => {
    const db = new DatabaseSync(dbPath);
    try {
      setupBaselineValidDb(db);

      // Drop one of the canonical indices
      db.exec('DROP INDEX IF EXISTS pub_jobs_state_idx;');

      const manifest = validateCanonicalSchemaManifest(db);
      expect(manifest.isValid).toBe(false);
      expect(manifest.missingIndices).toContain('pub_jobs_state_idx');
    } finally {
      db.close();
    }
  });

  it('6. Detects Missing CHECK constraint in table definition (e.g. publication_jobs state CHECK)', () => {
    const db = new DatabaseSync(dbPath);
    try {
      setupBaselineValidDb(db);

      // Recreate publication_jobs without CHECK constraint on state
      db.exec(`
        DROP TABLE publication_jobs;
        CREATE TABLE publication_jobs (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          scheduled_at TEXT NOT NULL,
          state TEXT NOT NULL,
          payload_hash TEXT NOT NULL,
          product_version INTEGER NOT NULL,
          idempotency_key TEXT NOT NULL,
          retry_count INTEGER NOT NULL DEFAULT 0,
          max_retries INTEGER NOT NULL DEFAULT 3,
          last_error TEXT,
          locked_by_worker TEXT,
          locked_at TEXT,
          created_at TEXT NOT NULL,
          published_at TEXT,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
      `);

      const manifest = validateCanonicalSchemaManifest(db);
      expect(manifest.isValid).toBe(false);
      expect(
        manifest.missingChecks.some((m: string) =>
          m.includes('publication_jobs: missing CHECK constraint')
        )
      ).toBe(true);
    } finally {
      db.close();
    }
  });

  it('7. Detects Default Value mismatch (e.g. product_variants.status DEFAULT "draft" instead of "active")', () => {
    const db = new DatabaseSync(dbPath);
    try {
      setupBaselineValidDb(db);

      // Recreate product_variants with wrong default value for status ('draft' instead of 'active')
      db.exec(`
        DROP TABLE product_variants;
        CREATE TABLE product_variants (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          model_code TEXT NOT NULL,
          sku TEXT,
          gtin TEXT,
          mpn TEXT,
          color_name TEXT,
          color_hex TEXT,
          finish TEXT,
          energy_class TEXT,
          price REAL,
          old_price REAL,
          status TEXT NOT NULL DEFAULT 'draft',
          is_default INTEGER NOT NULL DEFAULT 0 CHECK(is_default IN (0, 1)),
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        );
      `);

      const manifest = validateCanonicalSchemaManifest(db);
      expect(manifest.isValid).toBe(false);
      expect(
        manifest.columnMismatches.some((m: string) =>
          m.includes('product_variants.status: expected default "active"')
        )
      ).toBe(true);
    } finally {
      db.close();
    }
  });

  it('8. Detects Composite Primary Key ordering mismatch (e.g. category_translations with reversed PK order)', () => {
    const db = new DatabaseSync(dbPath);
    try {
      setupBaselineValidDb(db);

      // Recreate category_translations with inverted PK (locale, category_id) instead of (category_id, locale)
      db.exec(`
        DROP TABLE category_translations;
        CREATE TABLE category_translations (
          category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          locale TEXT NOT NULL DEFAULT 'az',
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          seo_title TEXT NOT NULL DEFAULT '',
          seo_description TEXT NOT NULL DEFAULT '',
          PRIMARY KEY (locale, category_id)
        );
      `);

      const manifest = validateCanonicalSchemaManifest(db);
      expect(manifest.isValid).toBe(false);
      expect(
        manifest.columnMismatches.some(
          (m: string) =>
            m.includes('category_translations.category_id: expected PK position 1, got 2') ||
            m.includes('category_translations.locale: expected PK position 2, got 1')
        )
      ).toBe(true);
    } finally {
      db.close();
    }
  });

  it('9. Detects Nullability Mismatch when nullable column lacks required NOT NULL or vice-versa', () => {
    const db = new DatabaseSync(dbPath);
    try {
      setupBaselineValidDb(db);

      // Recreate product_variants with model_code nullable instead of NOT NULL
      db.exec(`
        DROP TABLE product_variants;
        CREATE TABLE product_variants (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          model_code TEXT,
          sku TEXT,
          gtin TEXT,
          mpn TEXT,
          color_name TEXT,
          color_hex TEXT,
          finish TEXT,
          energy_class TEXT,
          price REAL,
          old_price REAL,
          status TEXT NOT NULL DEFAULT 'active',
          is_default INTEGER NOT NULL DEFAULT 0 CHECK(is_default IN (0, 1)),
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        );
      `);

      const manifest = validateCanonicalSchemaManifest(db);
      expect(manifest.isValid).toBe(false);
      expect(
        manifest.columnMismatches.some((m: string) =>
          m.includes('product_variants.model_code: expected NOT NULL')
        )
      ).toBe(true);
    } finally {
      db.close();
    }
  });

  it('10. Detects Unexpected Default Value on a column that canonical schema defines with dflt_value: null (e.g. model_code with DEFAULT "N/A")', () => {
    const db = new DatabaseSync(dbPath);
    try {
      setupBaselineValidDb(db);

      // Recreate product_variants with an unexpected default value on model_code (which should have dflt_value: null)
      db.exec(`
        DROP TABLE product_variants;
        CREATE TABLE product_variants (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          model_code TEXT NOT NULL DEFAULT 'N/A',
          sku TEXT,
          gtin TEXT,
          mpn TEXT,
          color_name TEXT,
          color_hex TEXT,
          finish TEXT,
          energy_class TEXT,
          price REAL,
          old_price REAL,
          status TEXT NOT NULL DEFAULT 'active',
          is_default INTEGER NOT NULL DEFAULT 0 CHECK(is_default IN (0, 1)),
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        );
      `);

      const manifest = validateCanonicalSchemaManifest(db);
      expect(manifest.isValid).toBe(false);
      expect(
        manifest.columnMismatches.some(
          (m: string) =>
            m.includes('product_variants.model_code: expected default "null"') ||
            m.includes('product_variants.model_code: expected default "undefined"') ||
            m.includes('got "N/A"')
        )
      ).toBe(true);
    } finally {
      db.close();
    }
  });
});
