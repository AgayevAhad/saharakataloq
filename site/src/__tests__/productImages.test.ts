import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createCatalogDatabase } from '../../backend/catalogDatabase.mjs';

const ROOT = resolve(__dirname, '../..');

describe('Product Images and Media Integration', () => {
  const mediaDir = join(ROOT, 'public', 'media', 'products');
  const hasSampleMedia =
    existsSync(mediaDir) && readdirSync(mediaDir).filter((f) => !f.startsWith('.')).length >= 4;

  it.skipIf(!hasSampleMedia)(
    'has valid media files in public/media/products for matched models (Opt-in sample media check)',
    () => {
      const files = readdirSync(mediaDir);
      expect(files).toContain('ardo-ar12ws.jpg');
      expect(files).toContain('ardo-ar6120-black.jpg');
      expect(files).toContain('ardo-6331-gb.jpg');
      expect(files).toContain('ardo-6032-b.jpg');
    }
  );

  it('populates product image, gallery, and media arrays in the database', () => {
    const { mkdtempSync, copyFileSync, rmSync } = require('node:fs');
    const { tmpdir } = require('node:os');
    const tempDir = mkdtempSync(join(tmpdir(), 'sahara-product-images-'));
    const tempDbPath = join(tempDir, 'catalog.sqlite');

    try {
      copyFileSync(join(ROOT, 'data', 'catalog.sqlite'), tempDbPath);
      const db = createCatalogDatabase(tempDbPath);
      const catalog = db.getCatalog();
      db.close();

      const ar12ws = catalog.products.find((p) => p.code === 'AR12WS');
      expect(ar12ws).toBeDefined();
      expect(ar12ws?.image).toMatch(/^(\/media\/products\/(ardo\/)?ardo-ar12ws\.jpg|\/uploads\/)/);
      expect(ar12ws?.gallery.length).toBeGreaterThanOrEqual(1);

      const p6331 = catalog.products.find((p) => p.code === '6331 GB');
      expect(p6331).toBeDefined();
      expect(p6331?.image).toMatch(/^(\/media\/products\/(ardo\/)?ardo-6331-gb\.jpg|\/uploads\/)/);
      expect(p6331?.gallery.length).toBeGreaterThanOrEqual(1);

      const p604b = catalog.products.find((p) => p.code === '604B');
      expect(p604b).toBeDefined();
      expect(p604b?.image).toMatch(/^(\/media\/products\/(ardo\/)?ardo-604b\.jpg|\/uploads\/)/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
