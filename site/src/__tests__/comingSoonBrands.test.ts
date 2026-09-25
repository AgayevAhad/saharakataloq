// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { DEFAULT_CATALOG, normalizeCatalog } from '../data/catalog';
import { createCatalogDatabase } from '../../backend/catalogDatabase.mjs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, copyFileSync, rmSync } from 'node:fs';

describe('Public Coming Soon Brands & Draft Preservation Isolation Suite', () => {
  it('marks Artel brand with comingSoon=true and Lotus/Ardo as active in default and normalized catalog', () => {
    const catalog = normalizeCatalog(DEFAULT_CATALOG);

    const lotusBrand = catalog.brands.find((b) => b.id === 'lotus');
    expect(lotusBrand).toBeDefined();
    expect(lotusBrand?.comingSoon).toBe(false);

    const artelBrand = catalog.brands.find((b) => b.id === 'artel');
    expect(artelBrand).toBeDefined();
    expect(artelBrand?.comingSoon).toBe(true);

    const ardoBrand = catalog.brands.find((b) => b.id === 'ardo');
    expect(ardoBrand).toBeDefined();
    expect(ardoBrand?.comingSoon).toBe(false);
  });

  it('filters out coming-soon products from public catalog database query while preserving draft products', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'sahara-coming-soon-'));
    const tempDbPath = join(tempDir, 'catalog.sqlite');
    copyFileSync(join(__dirname, '..', '..', 'data', 'catalog.sqlite'), tempDbPath);

    try {
      const prevEnv = process.env.NODE_ENV;
      const prevAllow = process.env.ALLOW_TEMP_DATA_DIR;
      process.env.NODE_ENV = 'test';
      process.env.ALLOW_TEMP_DATA_DIR = '1';

      const db = createCatalogDatabase(tempDbPath);
      const publicCatalog = db.getCatalog();
      db.close();

      process.env.NODE_ENV = prevEnv;
      process.env.ALLOW_TEMP_DATA_DIR = prevAllow;

      // In public catalog:
      // Artel brand is comingSoon=true, Lotus is active
      const pubLotus = publicCatalog.brands.find((b: any) => b.id === 'lotus');
      expect(pubLotus?.comingSoon).toBe(false);

      const pubArtel = publicCatalog.brands.find((b: any) => b.id === 'artel');
      expect(pubArtel?.comingSoon).toBe(true);

      const publicArtelProducts = publicCatalog.products.filter(
        (p: any) => p.brandId === 'artel' || p.brand === 'artel'
      );
      expect(publicArtelProducts.length).toBe(0);
      expect(publicArtelProducts.length).toBe(0);

      const publicArdoProducts = publicCatalog.products.filter(
        (p: any) => p.brandId === 'ardo' || p.brand === 'ardo'
      );
      expect(publicArdoProducts.length).toBeGreaterThan(0);

      // In database table, all products (including Lotus draft items) are preserved!
      const { DatabaseSync } = await import('node:sqlite');
      const directDb = new DatabaseSync(tempDbPath, { readOnly: true });
      const lotusDraftRows = directDb
        .prepare("SELECT id, brand_id, title FROM products WHERE brand_id = 'lotus'")
        .all();
      directDb.close();
      expect(lotusDraftRows.length).toBeGreaterThan(0);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
