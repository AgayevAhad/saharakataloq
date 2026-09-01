import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCatalogDatabase } from '../../backend/catalogDatabase.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

describe('Product Images and Media Integration', () => {
  it('has valid media files in public/media/products for matched models', () => {
    const mediaDir = join(ROOT, 'public', 'media', 'products');
    expect(existsSync(mediaDir)).toBe(true);

    const files = readdirSync(mediaDir);
    expect(files.length).toBeGreaterThanOrEqual(25);

    // Verify specific model photos exist
    expect(files).toContain('ardo-ar12ws.jpg');
    expect(files).toContain('ardo-ar6120-black.jpg');
    expect(files).toContain('ardo-6331-gb.jpg');
    expect(files).toContain('ardo-6032-b.jpg');
  });

  it('populates product image, gallery, and media arrays in the database', () => {
    const db = createCatalogDatabase(join(ROOT, 'data', 'catalog.sqlite'));
    const catalog = db.getCatalog();

    const ar12ws = catalog.products.find((p) => p.code === 'AR12WS');
    expect(ar12ws).toBeDefined();
    expect(ar12ws?.image).toMatch(/^(\/media\/products\/ardo-ar12ws\.jpg|\/uploads\/)/);
    expect(ar12ws?.gallery.length).toBeGreaterThanOrEqual(1);

    const p6331 = catalog.products.find((p) => p.code === '6331 GB');
    expect(p6331).toBeDefined();
    expect(p6331?.image).toMatch(/^(\/media\/products\/ardo-6331-gb\.jpg|\/uploads\/)/);
    expect(p6331?.gallery.length).toBeGreaterThanOrEqual(1);

    const p604b = catalog.products.find((p) => p.code === '604B');
    expect(p604b).toBeDefined();
    expect(p604b?.image).toMatch(/^(\/media\/products\/ardo-604b\.jpg|\/uploads\/)/);
  });
});
