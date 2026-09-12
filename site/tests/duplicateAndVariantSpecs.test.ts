import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { executeDualDatabaseMigration } from '../backend/pimV2Migration.mjs';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';

describe('Duplicate Specs & Partial Unique Index Suite', () => {
  let tempDir: string;
  let publicDbPath: string;
  let draftDbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-spec-test-'));
    publicDbPath = join(tempDir, 'catalog.sqlite');
    draftDbPath = join(tempDir, 'catalog-draft.sqlite');

    const db = createCatalogDatabase(publicDbPath);
    db.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'Italy' }],
      categories: [{ id: 'cooktop', name: 'Cooktops', slug: 'cooktop', sortOrder: 1 }],
      products: [
        {
          id: 'p-1',
          code: 'M-101',
          title: 'ARDO Cooktop',
          brandId: 'ardo',
          category: 'cooktop',
          specs: [
            { id: 'spec-1', name: 'Güc', value: '2000 W' },
            { id: 'spec-2', name: 'Güc', value: '2000 W' }, // Duplicate name in legacy
            { id: 'spec-3', name: 'Ölçü', value: '60 sm' },
          ],
        },
      ],
    });
    db.close();

    const draftDb = createCatalogDatabase(draftDbPath);
    draftDb.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'Italy' }],
      categories: [{ id: 'cooktop', name: 'Cooktops', slug: 'cooktop', sortOrder: 1 }],
      products: [
        {
          id: 'p-1',
          code: 'M-101',
          title: 'ARDO Cooktop',
          brandId: 'ardo',
          category: 'cooktop',
          specs: [
            { id: 'spec-1', name: 'Güc', value: '2000 W' },
            { id: 'spec-2', name: 'Güc', value: '2000 W' },
            { id: 'spec-3', name: 'Ölçü', value: '60 sm' },
          ],
        },
      ],
    });
    draftDb.close();
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('1. Partial unique index allows all legacy specs with unique legacy_spec_id', () => {
    const res = executeDualDatabaseMigration(tempDir);
    expect(res.success).toBe(true);

    const db = new DatabaseSync(publicDbPath);
    try {
      const rows = db
        .prepare('SELECT * FROM product_spec_values WHERE product_id = ?')
        .all('p-1') as any[];
      expect(rows).toHaveLength(3);

      const legacyIds = rows.map((r) => r.legacy_spec_id);
      expect(legacyIds).toContain('spec-1');
      expect(legacyIds).toContain('spec-2');
      expect(legacyIds).toContain('spec-3');
    } finally {
      db.close();
    }
  });

  it('2. Multiple variant-level manual specs with legacy_spec_id = NULL can coexist without constraint violations', () => {
    executeDualDatabaseMigration(tempDir);

    const db = new DatabaseSync(publicDbPath);
    try {
      const existing = db
        .prepare(
          'SELECT spec_definition_id, variant_id FROM product_spec_values WHERE product_id = ?'
        )
        .get('p-1') as any;

      // Insert manual variant overrides where legacy_spec_id is NULL
      db.prepare(
        `
        INSERT INTO product_spec_values (
          id, product_id, variant_id, spec_definition_id, raw_name, raw_value, legacy_spec_id, normalization_status, created_at
        ) VALUES (
          'manual-1', 'p-1', ?, ?, 'Güc', '3000 W', NULL, 'valid', CURRENT_TIMESTAMP
        ), (
          'manual-2', 'p-1', ?, ?, 'Güc', '3500 W', NULL, 'valid', CURRENT_TIMESTAMP
        )
      `
      ).run(
        existing.variant_id,
        existing.spec_definition_id,
        existing.variant_id,
        existing.spec_definition_id
      );

      const manualRows = db
        .prepare('SELECT * FROM product_spec_values WHERE legacy_spec_id IS NULL')
        .all() as any[];
      expect(manualRows).toHaveLength(2);
    } finally {
      db.close();
    }
  });
});
