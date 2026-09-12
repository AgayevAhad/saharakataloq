import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { executeDualDatabaseMigration } from '../backend/pimV2Migration.mjs';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';

describe('Media Poster, Alt Text, Crop and Expression Index Suite', () => {
  let tempDir: string;
  let publicDbPath: string;
  let draftDbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-media-test-'));
    publicDbPath = join(tempDir, 'catalog.sqlite');
    draftDbPath = join(tempDir, 'catalog-draft.sqlite');

    const db = createCatalogDatabase(publicDbPath);
    db.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'Italy' }],
      categories: [{ id: 'hood', name: 'Hoods', slug: 'hood', sortOrder: 1 }],
      products: [
        {
          id: 'p-video-1',
          code: 'H-300',
          title: 'ARDO Aspirator Video',
          brandId: 'ardo',
          category: 'hood',
          media: [
            {
              id: 'med-vid-1',
              type: 'video',
              url: '/media/ardo/h-300.mp4',
              poster: '/media/ardo/h-300-poster.jpg',
              alt: 'ARDO H-300 Video Preview',
              objectPosition: 'center 30%',
              fitMode: 'cover',
            },
          ],
        },
      ],
    });
    db.close();

    const draftDb = createCatalogDatabase(draftDbPath);
    draftDb.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'Italy' }],
      categories: [{ id: 'hood', name: 'Hoods', slug: 'hood', sortOrder: 1 }],
      products: [
        {
          id: 'p-video-1',
          code: 'H-300',
          title: 'ARDO Aspirator Video',
          brandId: 'ardo',
          category: 'hood',
          media: [
            {
              id: 'med-vid-1',
              type: 'video',
              url: '/media/ardo/h-300.mp4',
              poster: '/media/ardo/h-300-poster.jpg',
              alt: 'ARDO H-300 Video Preview',
              objectPosition: 'center 30%',
              fitMode: 'cover',
            },
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

  it('1. Preserves video poster, alt text, object position and fit mode in product_media_variants', () => {
    const res = executeDualDatabaseMigration(tempDir);
    expect(res.success).toBe(true);

    const db = new DatabaseSync(publicDbPath);
    try {
      const row = db
        .prepare('SELECT * FROM product_media_variants WHERE product_id = ?')
        .get('p-video-1') as any;
      expect(row).toBeDefined();
      expect(row.legacy_media_id).toBe('med-vid-1');
      expect(row.media_id).toMatch(/^asset_/);
      expect(row.alt_text).toBe('ARDO H-300 Video Preview');
      expect(row.poster_url).toBe('/media/ardo/h-300-poster.jpg');
      expect(row.object_position).toBe('center 30%');
      expect(row.fit_mode).toBe('cover');
    } finally {
      db.close();
    }
  });

  it('2. SQLite expression unique index enforces unicity per product, variant, and media', () => {
    executeDualDatabaseMigration(tempDir);

    const db = new DatabaseSync(publicDbPath);
    try {
      const existing = db
        .prepare('SELECT media_id FROM product_media_variants WHERE product_id = ?')
        .get('p-video-1') as any;
      const mediaId = existing.media_id;

      // Trying to insert duplicate with same product_id, variant_id ('var_p-video-1_def'), media_id should fail specifically on UNIQUE constraint
      expect(() => {
        db.prepare(
          `
          INSERT INTO product_media_variants (
            id, product_id, variant_id, media_id, is_primary, sort_order, fit_mode, object_position, alt_text, poster_url
          ) VALUES (
            'dup-1', 'p-video-1', 'var_p-video-1_def', ?, 0, 1, 'cover', 'center', 'Alt', 'Poster'
          )
        `
        ).run(mediaId);
      }).toThrow(/UNIQUE constraint failed/i);
    } finally {
      db.close();
    }
  });
});
