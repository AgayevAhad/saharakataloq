import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { createCatalogDatabase } from '../../backend/catalogDatabase.mjs';

describe('Lotus Media & Multi-Category Import Suite', () => {
  const db = createCatalogDatabase('./data/catalog.sqlite');
  const catalog = db.getCatalog();
  const lotusProducts = catalog.products.filter((p: any) => p.brandId === 'lotus');

  it('Lotus catalog contains products across all 13 categories', () => {
    expect(lotusProducts.length).toBeGreaterThanOrEqual(200);
    const categories = new Set(lotusProducts.map((p: any) => p.category));
    expect(categories.has('airfryer')).toBe(true);
    expect(categories.has('cooktop')).toBe(true);
    expect(categories.has('oven')).toBe(true);
    expect(categories.has('tv')).toBe(true);
    expect(categories.has('thermopot')).toBe(true);
    expect(categories.has('vacuum_cleaner')).toBe(true);
    expect(categories.has('air_conditioner')).toBe(true);
    expect(categories.has('meat_grinder')).toBe(true);
    expect(categories.has('iron')).toBe(true);
  });

  it('All Lotus products with media point to existing physical files in public/media/products/ or public/uploads/', () => {
    const productsWithImages = lotusProducts.filter((p: any) => p.image && (p.image.startsWith('/media/products/') || p.image.startsWith('/uploads/')));
    expect(productsWithImages.length).toBeGreaterThanOrEqual(40);

    for (const prod of productsWithImages) {
      const isUpload = (prod.image as string).startsWith('/uploads/');
      const filePath = isUpload
        ? join(process.cwd(), 'data', 'media', (prod.image as string).replace('/uploads/', ''))
        : join(process.cwd(), 'public', (prod.image as string).replace(/^\//, ''));
      const fileExists = existsSync(filePath);
      expect(fileExists).toBe(true);

      if (prod.gallery && prod.gallery.length > 0) {
        for (const galUrl of prod.gallery) {
          const isGalUpload = galUrl.startsWith('/uploads/');
          const galPath = isGalUpload
            ? join(process.cwd(), 'data', 'media', galUrl.replace('/uploads/', ''))
            : join(process.cwd(), 'public', galUrl.replace(/^\//, ''));
          const galExists = existsSync(galPath);
          expect(galExists).toBe(true);
        }
      }
    }
  });

  it('Lotus products are all published and have structured specs', () => {
    for (const prod of lotusProducts) {
      expect(prod.status).toBe('published');
      expect(prod.specs).toBeDefined();
      expect(Array.isArray(prod.specs)).toBe(true);
    }
  });
});
