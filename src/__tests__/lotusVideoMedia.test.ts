// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { createCatalogDatabase } from '../../backend/catalogDatabase.mjs';
import { normalizeProduct } from '../data/catalog';

describe('Lotus Video Media Integration Suite', () => {
  const videoFiles = [
    { file: 'lotus-aspirator-2752.mp4', poster: 'lotus-aspirator-2752-poster.jpg' },
    { file: 'lotus-cooktop-ftb941cmw.mp4', poster: 'lotus-cooktop-ftb941cmw-poster.jpg' },
    { file: 'lotus-soba-6450.mp4', poster: 'lotus-soba-6450-poster.jpg' },
    { file: 'lotus-airfry.mp4', poster: 'lotus-airfry-poster.jpg' },
    { file: 'lotus-mikrodalga.mp4', poster: 'lotus-mikrodalga-poster.jpg' },
  ];

  it('all optimized video MP4s and poster JPEGs exist and are non-empty in public/media', () => {
    const videoDir = join(process.cwd(), 'public', 'media', 'products', 'videos');
    for (const v of videoFiles) {
      const mp4Path = join(videoDir, v.file);
      const posterPath = join(videoDir, v.poster);

      expect(existsSync(mp4Path)).toBe(true);
      expect(statSync(mp4Path).size).toBeGreaterThan(100000);

      expect(existsSync(posterPath)).toBe(true);
      expect(statSync(posterPath).size).toBeGreaterThan(10000);
    }
  });

  it('catalog database contains attached video media records for Lotus models', () => {
    const publicDb = join(process.cwd(), 'data', 'catalog.sqlite');
    if (!existsSync(publicDb)) return;

    const db = createCatalogDatabase(publicDb);
    const catalog = db.getCatalog();

    const videoProducts = catalog.products.filter(
      (p) => p.brandId === 'lotus' && p.media && p.media.some((m) => m.type === 'video')
    );

    expect(videoProducts.length).toBeGreaterThanOrEqual(5);

    // Verify Aspirator CTB2752 has video attached
    const aspirator = catalog.products.find((p) => p.code === 'CTB2752B' || p.id === 'lotus-ctb2752b');
    expect(aspirator).toBeDefined();
    expect(aspirator?.media?.some((m) => m.type === 'video' && m.url.includes('lotus-aspirator-2752.mp4'))).toBe(true);

    // Verify Cooktop F-TB941 has video attached
    const cooktop = catalog.products.find((p) => p.code === 'LT-941-CMW' || p.id === 'lotus-cooktop-lt-941-cmw');
    expect(cooktop).toBeDefined();
    expect(cooktop?.media?.some((m) => m.type === 'video' && m.url.includes('lotus-cooktop-ftb941cmw.mp4'))).toBe(true);

    // Verify Soba 6450 has video attached
    const soba = catalog.products.find((p) => p.code === 'LT645O' || p.id === 'lotus-lt645o');
    expect(soba).toBeDefined();
    expect(soba?.media?.some((m) => m.type === 'video' && m.url.includes('lotus-soba-6450.mp4'))).toBe(true);

    // Verify Airfryer Soba has video attached
    const airfry = catalog.products.find((p) => p.code === 'LT4545 Airfry BL' || p.id === 'lotus-lt4545-airfry-bl');
    expect(airfry).toBeDefined();
    expect(airfry?.media?.some((m) => m.type === 'video' && m.url.includes('lotus-airfry.mp4'))).toBe(true);

    // Verify Mikrodalga has video attached
    const microwave = catalog.products.find((p) => p.code === 'LTS25LMWSS' || p.id === 'lotus-lts25lmwss');
    expect(microwave).toBeDefined();
    expect(microwave?.media?.some((m) => m.type === 'video' && m.url.includes('lotus-mikrodalga.mp4'))).toBe(true);

    db.close();
  });

  it('normalizeProduct preserves video media items with proper metadata', () => {
    const rawProduct = {
      id: 'lotus-test-video',
      code: 'LT-TEST-V',
      title: 'Lotus Test Video Model',
      category: 'oven',
      categoryName: 'Sobalar',
      brandId: 'lotus',
      image: '/media/products/videos/lotus-soba-6450-poster.jpg',
      shortDesc: 'Test desc',
      specs: [],
      highlights: [],
      media: [
        {
          id: 'lotus-test-video-m1',
          type: 'video' as const,
          url: '/media/products/videos/lotus-soba-6450.mp4',
          poster: '/media/products/videos/lotus-soba-6450-poster.jpg',
          originalName: 'LOTUS SOBA 6450.mp4',
          alt: 'Lotus Soba Video',
        },
      ],
    };

    const normalized = normalizeProduct(rawProduct as any);
    expect(normalized.media).toHaveLength(1);
    expect(normalized.media?.[0].type).toBe('video');
    expect(normalized.media?.[0].url).toContain('lotus-soba-6450.mp4');
    expect(normalized.media?.[0].poster).toContain('lotus-soba-6450-poster.jpg');
  });
});
