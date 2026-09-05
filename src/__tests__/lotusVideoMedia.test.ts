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

  it('catalog database contains strictly 1:1 exact matching media and videos', () => {
    const publicDb = join(process.cwd(), 'data', 'catalog.sqlite');
    if (!existsSync(publicDb)) return;

    const db = createCatalogDatabase(publicDb);
    const catalog = db.getCatalog();

    // 1. Cooktop F-TB941CM(W) exact match
    const cooktopCmw = catalog.products.find((p) => p.code === 'LT-941-CMW' || p.id === 'lotus-cooktop-lt-941-cmw');
    expect(cooktopCmw).toBeDefined();
    expect(cooktopCmw?.media?.some((m) => m.type === 'video' && m.url.includes('lotus-cooktop-ftb941cmw.mp4'))).toBe(true);

    // Cooktop Inox and Black variants must NOT have White video
    const cooktopInox = catalog.products.find((p) => p.id === 'lotus-cooktop-lt-941-i-nox' || p.id === 'lotus-lt941-inox');
    expect(cooktopInox?.media?.some((m) => m.type === 'video')).toBe(false);

    const cooktopBlack = catalog.products.find((p) => p.id === 'lotus-lt941s-black' || p.id === 'lotus-tb941gcw');
    expect(cooktopBlack?.media?.some((m) => m.type === 'video')).toBe(false);

    // 2. Soba 6450 exact match
    const soba6450 = catalog.products.find((p) => p.code === 'LT645O' || p.id === 'lotus-lt645o');
    expect(soba6450).toBeDefined();
    expect(soba6450?.media?.some((m) => m.type === 'video' && m.url.includes('lotus-soba-6450.mp4'))).toBe(true);

    // Other oven models (LT645V 8 Program, LT6470) must NOT have 6450 video
    const soba645v = catalog.products.find((p) => p.code === 'LT645V 8 Program' || p.id === 'lotus-lt645v-8-program');
    expect(soba645v?.media?.some((m) => m.type === 'video')).toBe(false);

    const soba6470 = catalog.products.find((p) => p.code === 'LT6470 8 Program' || p.id === 'lotus-lt6470-8-program');
    expect(soba6470?.media?.some((m) => m.type === 'video')).toBe(false);

    // 3. Non-1:1 Aspirator 2752 (no variant specified) must NOT be attached to CTB2752B/I/K
    const aspiratorB = catalog.products.find((p) => p.code === 'CTB2752B' || p.id === 'lotus-ctb2752b');
    expect(aspiratorB?.media?.some((m) => m.type === 'video')).toBe(false);

    // 4. Ardo D980B must NOT have any video attached
    const ardoD980 = catalog.products.find((p) => p.code === 'D980B' || p.id === 'ardo-d980b');
    expect(ardoD980?.media?.some((m) => m.type === 'video')).toBe(false);

    // 5. Lotus Irons exact 1:1 image sets
    const iron8800 = catalog.products.find((p) => p.code === 'LT-8800' || p.id === 'lotus-iron-lt-8800');
    expect(iron8800?.gallery).toHaveLength(3);
    expect(iron8800?.gallery).toEqual([
      '/media/products/lotus-iron-lt-8800.jpg',
      '/media/products/lotus-iron-lt-8800-on.jpg',
      '/media/products/lotus-iron-lt-8800-arxa.jpg',
    ]);

    const iron8801 = catalog.products.find((p) => p.code === 'LT-8801' || p.id === 'lotus-iron-lt-8801');
    expect(iron8801?.gallery).toHaveLength(3);
    expect(iron8801?.gallery).toEqual([
      '/media/products/lotus-iron-lt-8801.jpg',
      '/media/products/lotus-iron-lt-8801-on.jpg',
      '/media/products/lotus-iron-lt-8801-arxa.jpg',
    ]);

    const iron8802 = catalog.products.find((p) => p.code === 'LT-8802' || p.id === 'lotus-iron-lt-8802');
    expect(iron8802?.gallery).toHaveLength(3);
    expect(iron8802?.gallery).toEqual([
      '/media/products/lotus-iron-lt-8802.jpg',
      '/media/products/lotus-iron-lt-8802-on.jpg',
      '/media/products/lotus-iron-lt-8802-arxa.jpg',
    ]);

    const iron8803 = catalog.products.find((p) => p.code === 'LT-8803' || p.id === 'lotus-iron-lt-8803');
    expect(iron8803?.gallery).toHaveLength(2);
    expect(iron8803?.gallery).toEqual([
      '/media/products/lotus-iron-lt-8803.jpg',
      '/media/products/lotus-iron-lt-8803-2.jpg',
    ]);

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
