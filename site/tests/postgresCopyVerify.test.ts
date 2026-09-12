import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';
import { applyPimV2Schema, migrateDataToPimV2 } from '../backend/pimV2Migration.mjs';
import {
  generatePostgresPimV2Schema,
  computeSqliteVerificationManifest,
  verifyPostgresCopyTooling,
} from '../backend/postgresCopyVerify.mjs';
import { DatabaseSync } from 'node:sqlite';

describe('PIM v2 PostgreSQL Copy / Verify Tooling Suite', () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-pg-tooling-'));
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
          id: 'p-1',
          code: 'M-101',
          title: 'ARDO Qaz Paneli',
          brandId: 'ardo',
          category: 'cooktop',
          image: '/media/ardo/m-101.jpg',
          status: 'published',
          specs: [],
          media: [],
        },
      ],
    });
    db.close();

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

  it('1. Generates valid PostgreSQL DDL with correct data types and constraints', () => {
    const ddl = generatePostgresPimV2Schema();
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS products');
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS product_variants');
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS product_spec_values');
    expect(ddl).toContain('TIMESTAMPTZ');
    expect(ddl).toContain('NUMERIC(12, 2)');
  });

  it('2. Computes SQLite verification manifest with row-counts and deterministic hashes', () => {
    const manifest = computeSqliteVerificationManifest(dbPath);
    expect(manifest.tables.products.rowCount).toBe(1);
    expect(manifest.tables.product_variants.rowCount).toBe(1);
    expect(manifest.tables.products.contentHash).toBeDefined();
  });

  it('3. Reports explicit DEFERRED status when PostgreSQL host is not configured', () => {
    const result = verifyPostgresCopyTooling(dbPath, { host: '', database: '' });
    expect(result.status).toBe('DEFERRED');
    expect(result.reason).toContain('PostgreSQL environment not configured');
    expect(result.ddlGenerated).toBe(true);
  });
});
