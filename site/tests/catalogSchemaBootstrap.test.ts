import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';
import { ensureCatalogPublishSchema } from '../backend/catalogSchemaBootstrap.mjs';
import { isPhase3SchemaReady } from '../backend/phase3Migration.mjs';

describe('catalog publish schema bootstrap', () => {
  const tempDirectories: string[] = [];

  afterEach(() => {
    for (const directory of tempDirectories.splice(0)) {
      if (existsSync(directory)) rmSync(directory, { recursive: true, force: true });
    }
  });

  it('upgrades a legacy catalog additively without losing crop metadata or products', () => {
    const directory = mkdtempSync(join(tmpdir(), 'sahara-schema-bootstrap-'));
    tempDirectories.push(directory);
    const database = createCatalogDatabase(join(directory, 'catalog.sqlite'));
    const cropRect = { x: 0.08, y: 0.2, w: 0.84, h: 0.68 };

    database.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', active: true }],
      categories: [{ id: 'cooktop', name: 'Bişirmə panelləri', slug: 'cooktop', active: true }],
      products: [
        {
          id: 'ardo-201gc',
          code: '201GC',
          title: 'Plite Ardo 201GC',
          brandId: 'ardo',
          category: 'cooktop',
          image: '/media/products/ardo/ardo-201gc.jpg',
          cropRect,
          media: [
            {
              id: 'media-ardo-201gc-1',
              type: 'image',
              url: '/media/products/ardo/ardo-201gc.jpg',
              originalUrl: '/media/products/ardo/ardo-201gc.jpg',
              cropRect,
            },
          ],
        },
      ],
    });

    const before = database.db.prepare('SELECT COUNT(*) AS count FROM products').get().count;
    ensureCatalogPublishSchema(database.db);
    ensureCatalogPublishSchema(database.db);

    expect(isPhase3SchemaReady(database.db)).toBe(true);
    expect(database.db.prepare('SELECT COUNT(*) AS count FROM products').get().count).toBe(before);
    expect(
      JSON.parse(
        database.db
          .prepare('SELECT crop_rect FROM product_media WHERE id = ?')
          .get('media-ardo-201gc-1').crop_rect
      )
    ).toEqual(cropRect);
    expect(
      JSON.parse(
        database.db
          .prepare('SELECT crop_rect FROM product_media_variants WHERE legacy_media_id = ?')
          .get('media-ardo-201gc-1').crop_rect
      )
    ).toEqual(cropRect);

    database.close();
  });
});
