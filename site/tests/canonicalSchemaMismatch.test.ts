import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateCanonicalSchemaManifest } from '../backend/pimV2Migration.mjs';

describe('Canonical Schema Mismatch & Fail-Closed Detection Suite', () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-schema-test-'));
    dbPath = join(tempDir, 'catalog.sqlite');
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('1. Returns invalid with missing tables on empty or incomplete database', () => {
    const db = new DatabaseSync(dbPath);
    try {
      db.exec('CREATE TABLE products (id TEXT PRIMARY KEY);');

      const manifest = validateCanonicalSchemaManifest(db);
      expect(manifest.isValid).toBe(false);
      expect(manifest.missingTables).toContain('product_variants');
      expect(manifest.missingTables).toContain('product_spec_values');
      expect(manifest.missingTables).toContain('product_media_variants');
      expect(manifest.missingTables).toContain('product_revisions');
      expect(manifest.missingTables).toContain('publication_jobs');
    } finally {
      db.close();
    }
  });

  it('2. Detects missing required column on existing table', () => {
    const db = new DatabaseSync(dbPath);
    try {
      // Create products table without 'publication_status'
      db.exec(`
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
        CREATE TABLE product_variants (id TEXT PRIMARY KEY);
        CREATE TABLE product_spec_values (id TEXT PRIMARY KEY);
        CREATE TABLE product_media_variants (id TEXT PRIMARY KEY);
        CREATE TABLE product_revisions (id TEXT PRIMARY KEY);
        CREATE TABLE publication_jobs (id TEXT PRIMARY KEY);
        CREATE TABLE spec_definitions (id TEXT PRIMARY KEY);
        CREATE TABLE brand_sources (id TEXT PRIMARY KEY);
        CREATE TABLE brand_aliases (id TEXT PRIMARY KEY);
      `);

      const manifest = validateCanonicalSchemaManifest(db);
      expect(manifest.isValid).toBe(false);
      expect(manifest.missingColumns).toContain('products.publication_status');
    } finally {
      db.close();
    }
  });
});
