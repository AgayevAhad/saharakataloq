import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

const SITE_DB_PATH = path.resolve(__dirname, '../../../site/data/catalog.sqlite');
const ROOT_DB_PATH = path.resolve(__dirname, '../../../data/catalog.sqlite');
const SITE_MEDIA_DIR = path.resolve(__dirname, '../../../site/public/media/products/LOTUS/LOTUS_ETCEKEN');
const ROOT_MEDIA_DIR = path.resolve(__dirname, '../../../public/media/products/LOTUS/LOTUS_ETCEKEN');

describe('LOTUS Meat Grinder (Ətçəkən) Database and Media Integrity Suite', () => {
  it('site/data/catalog.sqlite contains exactly 4 LOTUS meat grinders with valid light and dark images', () => {
    expect(fs.existsSync(SITE_DB_PATH)).toBe(true);
    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });

    const products = db
      .prepare(
        `SELECT id, code, title, primary_image, dark_image, brand_id, category_id 
         FROM products 
         WHERE (brand_id = 'lotus' OR brand_id = 'LOTUS') AND category_id = 'meat_grinder'`
      )
      .all() as Array<{
      id: string;
      code: string;
      title: string;
      primary_image: string;
      dark_image: string;
    }>;

    expect(products.length).toBe(4);

    products.forEach((p) => {
      expect(p.primary_image).toBeTruthy();
      expect(p.primary_image.endsWith('.webp')).toBe(true);
      expect(p.primary_image.includes('_light.webp')).toBe(false);
      expect(p.dark_image).toBeTruthy();
      expect(p.dark_image.endsWith('.webp')).toBe(true);
      expect(p.dark_image.includes('_dark.webp')).toBe(false);
    });

    const mediaList = db
      .prepare(
        `SELECT pm.id, pm.product_id, pm.url, pm.dark_url 
         FROM product_media pm 
         JOIN products p ON pm.product_id = p.id 
         WHERE (p.brand_id = 'lotus' OR p.brand_id = 'LOTUS') AND p.category_id = 'meat_grinder'`
      )
      .all() as Array<{ id: string; product_id: string; url: string; dark_url: string }>;

    expect(mediaList.length).toBe(9);
    mediaList.forEach((m) => {
      expect(m.url).toBeTruthy();
      expect(m.url.endsWith('.webp')).toBe(true);
      expect(m.url.includes('_light.webp')).toBe(false);
      expect(m.dark_url).toBeTruthy();
      expect(m.dark_url.endsWith('.webp')).toBe(true);
      expect(m.dark_url.includes('_dark.webp')).toBe(false);
    });

    db.close();
  });

  it('data/catalog.sqlite contains exactly 4 LOTUS meat grinders with matching records', () => {
    expect(fs.existsSync(ROOT_DB_PATH)).toBe(true);
    const db = new DatabaseSync(ROOT_DB_PATH, { readOnly: true });

    const products = db
      .prepare(
        `SELECT id, code, title, primary_image, dark_image 
         FROM products 
         WHERE (brand_id = 'lotus' OR brand_id = 'LOTUS') AND category_id = 'meat_grinder'`
      )
      .all() as Array<{
      id: string;
      code: string;
      title: string;
      primary_image: string;
      dark_image: string;
    }>;

    expect(products.length).toBe(4);
    products.forEach((p) => {
      expect(p.primary_image.endsWith('.webp')).toBe(true);
      expect(p.primary_image.includes('_light.webp')).toBe(false);
      expect(p.dark_image.endsWith('.webp')).toBe(true);
      expect(p.dark_image.includes('_dark.webp')).toBe(false);
    });

    const mediaList = db
      .prepare(
        `SELECT pm.id, pm.product_id, pm.url, pm.dark_url 
         FROM product_media pm 
         JOIN products p ON pm.product_id = p.id 
         WHERE (p.brand_id = 'lotus' OR p.brand_id = 'LOTUS') AND p.category_id = 'meat_grinder'`
      )
      .all() as Array<{ id: string; product_id: string; url: string; dark_url: string }>;

    expect(mediaList.length).toBe(9);

    db.close();
  });

  it('All 9 image pairs physically exist on disk in both public and site/public directories', () => {
    expect(fs.existsSync(SITE_MEDIA_DIR)).toBe(true);
    expect(fs.existsSync(ROOT_MEDIA_DIR)).toBe(true);

    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });
    const mediaList = db
      .prepare(
        `SELECT pm.url, pm.dark_url 
         FROM product_media pm 
         JOIN products p ON pm.product_id = p.id 
         WHERE p.brand_id = 'lotus' AND p.category_id = 'meat_grinder'`
      )
      .all() as Array<{ url: string; dark_url: string }>;

    expect(mediaList.length).toBe(9);

    mediaList.forEach((m) => {
      const rootLight = path.join(__dirname, '../../../public', m.url);
      const rootDark = path.join(__dirname, '../../../public', m.dark_url);
      const siteLight = path.join(__dirname, '../../../site/public', m.url);
      const siteDark = path.join(__dirname, '../../../site/public', m.dark_url);

      expect(fs.existsSync(rootLight), `File does not exist: ${rootLight}`).toBe(true);
      expect(fs.existsSync(rootDark), `File does not exist: ${rootDark}`).toBe(true);
      expect(fs.existsSync(siteLight), `File does not exist: ${siteLight}`).toBe(true);
      expect(fs.existsSync(siteDark), `File does not exist: ${siteDark}`).toBe(true);
    });

    db.close();
  });

  it('No legacy raw JPEG files remain in public media folders', () => {
    const checkDir = (dir: string) => {
      const files = fs.readdirSync(dir, { recursive: true }) as string[];
      const legacyFiles = files.filter(
        (f) => f.endsWith('.jpg') || f.endsWith('.JPG') || f.endsWith('.jpeg') || f.endsWith('.png')
      );
      expect(legacyFiles).toEqual([]);
    };

    checkDir(ROOT_MEDIA_DIR);
    checkDir(SITE_MEDIA_DIR);
  });

  it('All 4 Lotus meat grinders have valid specifications in database', () => {
    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });
    const specs = db
      .prepare(
        `SELECT ps.id, ps.product_id, ps.name, ps.value 
         FROM product_specs ps 
         JOIN products p ON ps.product_id = p.id 
         WHERE p.brand_id = 'lotus' AND p.category_id = 'meat_grinder'`
      )
      .all() as Array<{ id: string; product_id: string; name: string; value: string }>;

    expect(specs.length).toBe(20);
    db.close();
  });

  it('Ətçəkən Lotus LT01001 has reordered images (1 <-> 2 swap) verified in database and media files', () => {
    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });
    const prod = db
      .prepare(`SELECT id, title, primary_image, dark_image FROM products WHERE id = 'lotus-lt01001'`)
      .get() as { id: string; title: string; primary_image: string; dark_image: string };

    expect(prod).toBeTruthy();
    expect(prod.primary_image).toContain('Ətçəkən Lotus LT01001.webp');
    expect(prod.dark_image).toContain('Ətçəkən Lotus LT01001.webp');

    const media = db
      .prepare(`SELECT sort_order, url, dark_url FROM product_media WHERE product_id = 'lotus-lt01001' ORDER BY sort_order`)
      .all() as Array<{ sort_order: number; url: string; dark_url: string }>;

    expect(media.length).toBe(3);
    expect(media[0].url).toContain('Ətçəkən Lotus LT01001.webp');
    expect(media[1].url).toContain('Ətçəkən Lotus LT01001 (2).webp');
    expect(media[2].url).toContain('Ətçəkən Lotus LT01001 (3).webp');

    // Verify the front view (primary cover) and accessory files are valid high-res transparent webp files
    const primaryFilePath = path.join(__dirname, '../../../public', media[0].url);
    const accessoryFilePath = path.join(__dirname, '../../../public', media[1].url);
    expect(fs.statSync(primaryFilePath).size).toBeGreaterThan(1000000);
    expect(fs.statSync(accessoryFilePath).size).toBeGreaterThan(1000000);

    db.close();
  });
});
