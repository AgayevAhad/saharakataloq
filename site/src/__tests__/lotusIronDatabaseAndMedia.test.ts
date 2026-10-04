import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

const SITE_DB_PATH = path.resolve(__dirname, '../../../site/data/catalog.sqlite');
const ROOT_DB_PATH = path.resolve(__dirname, '../../../data/catalog.sqlite');
const SITE_MEDIA_DIR = path.resolve(__dirname, '../../../site/public/media/products/LOTUS/LOTUS_UTU');
const ROOT_MEDIA_DIR = path.resolve(__dirname, '../../../public/media/products/LOTUS/LOTUS_UTU');

describe('LOTUS Iron (Ütü) Database and Media Integrity Suite', () => {
  it('site/data/catalog.sqlite contains exactly 4 LOTUS irons with valid light and dark images', () => {
    expect(fs.existsSync(SITE_DB_PATH)).toBe(true);
    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });

    const products = db
      .prepare(
        `SELECT id, code, title, primary_image, dark_image, brand_id, category_id 
         FROM products 
         WHERE (brand_id = 'lotus' OR brand_id = 'LOTUS') AND category_id = 'iron'`
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
        `SELECT pm.id, pm.product_id, pm.url, pm.dark_url, pm.crop_rect, pm.object_position 
         FROM product_media pm 
         JOIN products p ON pm.product_id = p.id 
         WHERE (p.brand_id = 'lotus' OR p.brand_id = 'LOTUS') AND p.category_id = 'iron'`
      )
      .all() as Array<{ id: string; product_id: string; url: string; dark_url: string; crop_rect: string; object_position: string }>;

    expect(mediaList.length).toBe(11);
    mediaList.forEach((m) => {
      expect(m.url).toBeTruthy();
      if (m.product_id === 'lotus-lt-8803') {
        expect(m.url.endsWith('.webp')).toBe(true);
        expect(m.url.includes('_light.webp')).toBe(false);
        expect(m.dark_url.endsWith('.webp')).toBe(true);
        expect(m.dark_url.includes('_dark.webp')).toBe(false);
      } else {
        expect(m.url.endsWith('.webp')).toBe(true);
      expect(m.url.includes('_light.webp')).toBe(false);
        expect(m.dark_url.endsWith('.webp')).toBe(true);
      expect(m.dark_url.includes('_dark.webp')).toBe(false);
      }
      // Ensure pre-rendered webp images are perfectly centered without legacy crop distortion
      expect(m.object_position).toBe('center');
      expect(m.crop_rect).toBeNull();
    });

    db.close();
  });

  it('data/catalog.sqlite contains exactly 4 LOTUS irons with matching records', () => {
    expect(fs.existsSync(ROOT_DB_PATH)).toBe(true);
    const db = new DatabaseSync(ROOT_DB_PATH, { readOnly: true });

    const products = db
      .prepare(
        `SELECT id, code, title, primary_image, dark_image, image_position, crop_rect 
         FROM products 
         WHERE (brand_id = 'lotus' OR brand_id = 'LOTUS') AND category_id = 'iron'`
      )
      .all() as Array<{
      id: string;
      code: string;
      title: string;
      primary_image: string;
      dark_image: string;
      image_position: string;
      crop_rect: string | null;
    }>;

    expect(products.length).toBe(4);
    products.forEach((p) => {
      expect(p.primary_image.endsWith('.webp')).toBe(true);
      expect(p.primary_image.includes('_light.webp')).toBe(false);
      expect(p.dark_image.endsWith('.webp')).toBe(true);
      expect(p.dark_image.includes('_dark.webp')).toBe(false);
      expect(p.image_position).toBe('center');
      expect(p.crop_rect).toBeNull();
    });

    const mediaList = db
      .prepare(
        `SELECT pm.id, pm.product_id, pm.url, pm.dark_url, pm.object_position, pm.crop_rect 
         FROM product_media pm 
         JOIN products p ON pm.product_id = p.id 
         WHERE (p.brand_id = 'lotus' OR p.brand_id = 'LOTUS') AND p.category_id = 'iron'`
      )
      .all() as Array<{ id: string; product_id: string; url: string; dark_url: string; object_position: string; crop_rect: string | null }>;

    expect(mediaList.length).toBe(11);
    mediaList.forEach((m) => {
      expect(m.object_position).toBe('center');
      expect(m.crop_rect).toBeNull();
    });

    db.close();
  });

  it('All 11 image pairs physically exist on disk in both public and site/public directories', () => {
    expect(fs.existsSync(SITE_MEDIA_DIR)).toBe(true);
    expect(fs.existsSync(ROOT_MEDIA_DIR)).toBe(true);

    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });
    const mediaList = db
      .prepare(
        `SELECT pm.url, pm.dark_url 
         FROM product_media pm 
         JOIN products p ON pm.product_id = p.id 
         WHERE p.brand_id = 'lotus' AND p.category_id = 'iron'`
      )
      .all() as Array<{ url: string; dark_url: string }>;

    expect(mediaList.length).toBe(11);

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

  it('No legacy raw JPEG files remain in LOTUS_UTU public media folders', () => {
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

  it('All 4 Lotus irons have valid specifications in database', () => {
    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });
    const specs = db
      .prepare(
        `SELECT ps.id, ps.product_id, ps.name, ps.value 
         FROM product_specs ps 
         JOIN products p ON ps.product_id = p.id 
         WHERE p.brand_id = 'lotus' AND p.category_id = 'iron'`
      )
      .all() as Array<{ id: string; product_id: string; name: string; value: string }>;

    expect(specs.length).toBe(24);
    db.close();
  });
});
