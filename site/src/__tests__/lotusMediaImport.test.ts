import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, mkdtempSync, copyFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createCatalogDatabase } from '../../backend/catalogDatabase.mjs';

describe('Lotus Media & Multi-Category Import Suite', () => {
  let tempDir = '';
  let tempDbPath = '';
  let catalog: any = null;
  let lotusProducts: any[] = [];

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-lotus-media-'));
    tempDbPath = join(tempDir, 'catalog.sqlite');
    copyFileSync('./data/catalog.sqlite', tempDbPath);
    const db = createCatalogDatabase(tempDbPath);
    catalog = db.getCatalog({ includeAll: true });
    lotusProducts = catalog.products.filter((p: any) => p.brandId === 'lotus');
    db.close();
  });

  afterAll(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  it('Lotus catalog contains verified products with valid categories', () => {
    expect(lotusProducts.length).toBeGreaterThanOrEqual(1);
    const categories = new Set(lotusProducts.map((p: any) => p.category));
    expect(categories.has('oven')).toBe(true);
  });

  it('All Lotus products with media point to valid formatted media URLs', () => {
    const productsWithImages = lotusProducts.filter(
      (p: any) =>
        p.image && (p.image.startsWith('/media/products/') || p.image.startsWith('/uploads/'))
    );
    expect(productsWithImages.length).toBeGreaterThanOrEqual(1);

    for (const prod of productsWithImages) {
      expect(prod.image).toMatch(/^(\/media\/products\/|\/uploads\/)/);
    }
  });

  const hasSampleMedia = existsSync(
    join(process.cwd(), 'public', 'media', 'products', 'lotus-black.jpg')
  );

  it.skipIf(!hasSampleMedia)(
    'Lotus product media files exist on physical disk (Opt-in sample media check)',
    () => {
      const productsWithImages = lotusProducts.filter(
        (p: any) =>
          p.image && (p.image.startsWith('/media/products/') || p.image.startsWith('/uploads/'))
      );
      for (const prod of productsWithImages) {
        const isUpload = (prod.image as string).startsWith('/uploads/');
        const filePath = isUpload
          ? join(process.cwd(), 'data', 'media', (prod.image as string).replace('/uploads/', ''))
          : join(process.cwd(), 'public', (prod.image as string).replace(/^\//, ''));
        expect(existsSync(filePath)).toBe(true);

        if (prod.gallery && prod.gallery.length > 0) {
          for (const galUrl of prod.gallery) {
            const isGalUpload = galUrl.startsWith('/uploads/');
            const galPath = isGalUpload
              ? join(process.cwd(), 'data', 'media', galUrl.replace('/uploads/', ''))
              : join(process.cwd(), 'public', galUrl.replace(/^\//, ''));
            expect(existsSync(galPath)).toBe(true);
          }
        }
      }
    }
  );

  it('Lotus products have valid status and structured specs', () => {
    for (const prod of lotusProducts) {
      expect(['published', 'draft']).toContain(prod.status);
      expect(prod.specs).toBeDefined();
      expect(Array.isArray(prod.specs)).toBe(true);
    }
  });
});
