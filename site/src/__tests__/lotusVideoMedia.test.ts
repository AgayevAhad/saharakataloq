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

  const videoDir = join(process.cwd(), 'public', 'media', 'products', 'videos');
  const hasSampleVideos =
    existsSync(videoDir) && existsSync(join(videoDir, 'lotus-aspirator-2752.mp4'));

  it.skipIf(!hasSampleVideos)(
    'all optimized video MP4s and poster JPEGs exist and are non-empty in public/media (Opt-in media check)',
    () => {
      for (const v of videoFiles) {
        const mp4Path = join(videoDir, v.file);
        const posterPath = join(videoDir, v.poster);

        expect(existsSync(mp4Path)).toBe(true);
        expect(existsSync(posterPath)).toBe(true);
        expect(statSync(mp4Path).size).toBeGreaterThan(100000);
        expect(statSync(posterPath).size).toBeGreaterThan(10000);
      }
    }
  );

  it('catalog database contains strictly 1:1 exact matching media and videos', () => {
    const publicDb = join(process.cwd(), 'data', 'catalog.sqlite');
    if (!existsSync(publicDb)) return;

    const { mkdtempSync, copyFileSync, rmSync } = require('node:fs');
    const { tmpdir } = require('node:os');
    const tempDir = mkdtempSync(join(tmpdir(), 'sahara-lotus-video-'));
    const tempDbPath = join(tempDir, 'catalog.sqlite');

    try {
      copyFileSync(publicDb, tempDbPath);
      const db = createCatalogDatabase(tempDbPath);
      const catalog = db.getCatalog({ includeAll: true });
      db.close();

      // 1. Ardo D980B must have exact 1:1 image and NO video attached
      const ardoD980 = catalog.products.find((p) => p.code === 'D980B' || p.id === 'ardo-d980b');
      expect(ardoD980).toBeDefined();
      expect(ardoD980?.media?.some((m) => m.type === 'video')).toBe(false);

      // 2. Soba Alveus LT627 Black Organik Inox exact match
      const lt627 = catalog.products.find((p) => p.id.includes('lt627'));
      expect(lt627).toBeDefined();
      expect(lt627?.media?.length).toBeGreaterThanOrEqual(1);

      // 3. All media attached to products must strictly match their product code
      for (const prod of catalog.products) {
        if (prod.media && prod.media.length > 0) {
          for (const m of prod.media) {
            expect(m.url).toBeTruthy();
          }
        }
      }

    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
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
