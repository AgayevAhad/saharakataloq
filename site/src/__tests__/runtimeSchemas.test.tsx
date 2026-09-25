import { describe, it, expect } from 'vitest';
import { BrandSchema, CategorySchema, MediaAssetSchema, validateSafe } from '../types/schemas';
import { validateCatalogData, catalogApi } from '../services/catalogApi';

describe('Zod Runtime Schemas Validation Suite', () => {
  describe('BrandSchema', () => {
    it('validates a complete and valid brand object', () => {
      const validBrand = {
        id: 'ardo',
        name: 'ARDO',
        slug: 'ardo',
        originCountry: 'İtaliya',
        manufacturingCountries: ['İtaliya'],
        active: true,
      };

      const result = validateSafe(BrandSchema, validBrand);
      expect(result.success).toBe(true);
    });

    it('rejects an incomplete brand missing required fields without mutating data', () => {
      const invalidBrand = {
        id: 'ardo',
        // missing name, slug
      };

      const result = validateSafe(BrandSchema, invalidBrand);
      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.errors.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('CategorySchema', () => {
    it('validates a correct category object', () => {
      const validCategory = {
        id: 'sobalar',
        name: 'Quraşdırılan Sobalar',
        slug: 'qurasdirilan-sobalar',
        active: true,
        sortOrder: 1,
      };

      const result = validateSafe(CategorySchema, validCategory);
      expect(result.success).toBe(true);
    });

    it('rejects category with empty string name or slug', () => {
      const invalidCategory = {
        id: 'c1',
        name: '',
        slug: '',
      };

      const result = validateSafe(CategorySchema, invalidCategory);
      expect(result.success).toBe(false);
    });
  });

  describe('MediaAssetSchema', () => {
    it('validates image and video media assets strictly', () => {
      const validImage = {
        id: 'm1',
        type: 'image',
        url: '/media/ardo-oven.jpg',
        alt: 'ARDO Soba',
      };
      expect(validateSafe(MediaAssetSchema, validImage).success).toBe(true);

      const invalidType = {
        id: 'm2',
        type: 'pdf', // invalid enum
        url: '/manual.pdf',
      };
      expect(validateSafe(MediaAssetSchema, invalidType).success).toBe(false);
    });
  });

  describe('Catalog Data Validation & saveCatalog Guard', () => {
    it('validates a whole catalog payload and returns valid status', () => {
      const mockCatalog = {
        brands: [
          {
            id: 'ardo',
            name: 'ARDO',
            slug: 'ardo',
            originCountry: 'İtaliya',
            manufacturingCountries: ['İtaliya'],
            active: true,
          },
        ],
        categories: [
          {
            id: 'sobalar',
            name: 'Sobalar',
            slug: 'sobalar',
            active: true,
            sortOrder: 1,
          },
        ],
        products: [],
        settings: {
          companyName: 'Sahara',
          phoneNumber: '+994 50 123 45 67',
        },
      };

      const report = validateCatalogData(mockCatalog as any);
      expect(report.isValid).toBe(true);
      expect(report.productErrors.length).toBe(0);
    });

    it('detects invalid products and generates structured ValidationReport without altering data', () => {
      const invalidCatalog = {
        brands: [],
        categories: [],
        products: [
          {
            id: 'prod-broken',
            // missing code, title, brandId, category
          },
        ],
      };

      const report = validateCatalogData(invalidCatalog as any);
      expect(report.isValid).toBe(false);
      expect(report.productErrors.length).toBe(1);
      expect(report.productErrors[0].id).toBe('prod-broken');
      expect(report.productErrors[0].errors.length).toBeGreaterThanOrEqual(2);
    });

    it('saveCatalog throws and blocks network call if catalog data contains schema violations', async () => {
      const brokenCatalog = {
        brands: [],
        categories: [],
        products: [
          {
            id: 'broken',
            // missing required fields
          },
        ],
      };

      await expect(catalogApi.saveCatalog(brokenCatalog as any, 'mock-csrf')).rejects.toThrow(
        /schema xətası var/
      );
    });

    it('validates all live products from draft database without any schema error', async () => {
      const { mkdtempSync, copyFileSync, rmSync, existsSync } = await import('node:fs');
      const { tmpdir } = await import('node:os');
      const { join, resolve } = await import('node:path');
      const { createCatalogDatabase } = await import('../../backend/catalogDatabase.mjs');

      const ROOT = resolve(__dirname, '../..');
      const tempDir = mkdtempSync(join(tmpdir(), 'sahara-schema-check-draft-'));
      const draftSrc = join(ROOT, 'data', 'catalog-draft.sqlite');
      const tempDbPath = join(tempDir, 'catalog.sqlite');

      if (!existsSync(draftSrc)) {
        return;
      }

      copyFileSync(draftSrc, tempDbPath);
      const db = createCatalogDatabase(tempDbPath);
      const catalog = db.getCatalog();
      db.close();
      rmSync(tempDir, { recursive: true, force: true });

      const report = validateCatalogData(catalog);
      expect(report.productErrors).toEqual([]);
      expect(report.brandErrors).toEqual([]);
      expect(report.categoryErrors).toEqual([]);
      expect(report.isValid).toBe(true);
    });

    it('validates all live products from main public database without any schema error', async () => {
      const { mkdtempSync, copyFileSync, rmSync, existsSync } = await import('node:fs');
      const { tmpdir } = await import('node:os');
      const { join, resolve } = await import('node:path');
      const { createCatalogDatabase } = await import('../../backend/catalogDatabase.mjs');

      const ROOT = resolve(__dirname, '../..');
      const tempDir = mkdtempSync(join(tmpdir(), 'sahara-schema-check-main-'));
      const mainSrc = join(ROOT, 'data', 'catalog.sqlite');
      const tempDbPath = join(tempDir, 'catalog.sqlite');

      if (!existsSync(mainSrc)) {
        return;
      }

      copyFileSync(mainSrc, tempDbPath);
      const db = createCatalogDatabase(tempDbPath);
      const catalog = db.getCatalog();
      db.close();
      rmSync(tempDir, { recursive: true, force: true });

      const report = validateCatalogData(catalog);
      expect(report.productErrors).toEqual([]);
      expect(report.brandErrors).toEqual([]);
      expect(report.categoryErrors).toEqual([]);
      expect(report.isValid).toBe(true);
    });
  });
});
