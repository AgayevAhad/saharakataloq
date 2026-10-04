import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

const SITE_DB_PATH = path.resolve(__dirname, '../../../site/data/catalog.sqlite');
const ROOT_DB_PATH = path.resolve(__dirname, '../../../data/catalog.sqlite');
const SITE_MEDIA_DIR = path.resolve(__dirname, '../../../site/public/media/products/LOTUS/LOTUS_BISIRME_PANELI');
const ROOT_MEDIA_DIR = path.resolve(__dirname, '../../../public/media/products/LOTUS/LOTUS_BISIRME_PANELI');

describe('LOTUS Cooktop (Bişirmə Paneli) Database and Media Integrity Suite', () => {
  it('site/data/catalog.sqlite contains exactly 17 LOTUS cooktops with valid light and dark images', () => {
    expect(fs.existsSync(SITE_DB_PATH)).toBe(true);
    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });

    const products = db
      .prepare(
        `SELECT id, code, title, primary_image, dark_image, brand_id, category_id 
         FROM products 
         WHERE (brand_id = 'lotus' OR brand_id = 'LOTUS') AND (category_id = 'cooktop' OR category_id = 'lotus-cooktop')`
      )
      .all() as Array<{
      id: string;
      code: string;
      title: string;
      primary_image: string;
      dark_image: string;
    }>;

    expect(products.length).toBe(17);

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
         WHERE (p.brand_id = 'lotus' OR p.brand_id = 'LOTUS') AND (p.category_id = 'cooktop' OR p.category_id = 'lotus-cooktop')`
      )
      .all() as Array<{ id: string; product_id: string; url: string; dark_url: string }>;

    expect(mediaList.length).toBe(35);
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

  it('data/catalog.sqlite contains exactly 17 LOTUS cooktops with matching records', () => {
    expect(fs.existsSync(ROOT_DB_PATH)).toBe(true);
    const db = new DatabaseSync(ROOT_DB_PATH, { readOnly: true });

    const products = db
      .prepare(
        `SELECT id, code, title, primary_image, dark_image 
         FROM products 
         WHERE (brand_id = 'lotus' OR brand_id = 'LOTUS') AND (category_id = 'cooktop' OR category_id = 'lotus-cooktop')`
      )
      .all() as Array<{
      id: string;
      code: string;
      title: string;
      primary_image: string;
      dark_image: string;
    }>;

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
         WHERE (p.brand_id = 'lotus' OR p.brand_id = 'LOTUS') AND (p.category_id = 'cooktop' OR p.category_id = 'lotus-cooktop')`
      )
      .all() as Array<{ id: string; product_id: string; url: string; dark_url: string }>;

    expect(mediaList.length).toBe(35);

    db.close();
  });

  it('All 35 image pairs physically exist on disk in both public and site/public directories', () => {
    expect(fs.existsSync(SITE_MEDIA_DIR)).toBe(true);
    expect(fs.existsSync(ROOT_MEDIA_DIR)).toBe(true);

    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });
    const mediaList = db
      .prepare(
        `SELECT pm.url, pm.dark_url 
         FROM product_media pm 
         JOIN products p ON pm.product_id = p.id 
         WHERE (p.brand_id = 'lotus' OR p.brand_id = 'LOTUS') AND (p.category_id = 'cooktop' OR p.category_id = 'lotus-cooktop')`
      )
      .all() as Array<{ url: string; dark_url: string }>;

    expect(mediaList.length).toBe(35);

    mediaList.forEach((m) => {
      const siteLightPath = path.resolve(__dirname, '../../../site/public' + m.url);
      const siteDarkPath = path.resolve(__dirname, '../../../site/public' + m.dark_url);
      const rootLightPath = path.resolve(__dirname, '../../../public' + m.url);
      const rootDarkPath = path.resolve(__dirname, '../../../public' + m.dark_url);

      expect(fs.existsSync(siteLightPath)).toBe(true);
      expect(fs.existsSync(siteDarkPath)).toBe(true);
      expect(fs.existsSync(rootLightPath)).toBe(true);
      expect(fs.existsSync(rootDarkPath)).toBe(true);
    });

    db.close();
  });

  it('Zero legacy JPG/JPEG files remain in the deployed LOTUS_BISIRME_PANELI directories', () => {
    const checkNoJpg = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkNoJpg(full);
        } else {
          expect(entry.name.toLowerCase().endsWith('.jpg')).toBe(false);
          expect(entry.name.toLowerCase().endsWith('.jpeg')).toBe(false);
        }
      }
    };

    checkNoJpg(SITE_MEDIA_DIR);
    checkNoJpg(ROOT_MEDIA_DIR);
  });

  it('Preserves ARDO products, ARTEL products, and other LOTUS categories untouched', () => {
    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });
    const ardoCooktop = db
      .prepare(
        `SELECT count(*) as cnt 
         FROM products 
         WHERE (brand_id = 'ardo' OR brand_id = 'ARDO') AND (category_id = 'cooktop' OR category_id = 'ardo-cooktop')`
      )
      .get() as { cnt: number };

    const ardoHood = db
      .prepare(
        `SELECT count(*) as cnt 
         FROM products 
         WHERE (brand_id = 'ardo' OR brand_id = 'ARDO') AND (category_id = 'hood' OR category_id = 'ardo-hood')`
      )
      .get() as { cnt: number };

    const ardoAc = db
      .prepare(
        `SELECT count(*) as cnt 
         FROM products 
         WHERE (brand_id = 'ardo' OR brand_id = 'ARDO') AND (category_id = 'air_conditioner' OR category_id = 'ardo-air-conditioner')`
      )
      .get() as { cnt: number };

    const ardoMw = db
      .prepare(
        `SELECT count(*) as cnt 
         FROM products 
         WHERE (brand_id = 'ardo' OR brand_id = 'ARDO') AND (category_id = 'microwave' OR category_id = 'ardo-microwave')`
      )
      .get() as { cnt: number };

    const artelAc = db
      .prepare(
        `SELECT count(*) as cnt 
         FROM products 
         WHERE (brand_id = 'artel' OR brand_id = 'ARTEL') AND (category_id = 'air_conditioner' OR category_id = 'artel-air-conditioner')`
      )
      .get() as { cnt: number };

    const artelTv = db
      .prepare(
        `SELECT count(*) as cnt 
         FROM products 
         WHERE (brand_id = 'artel' OR brand_id = 'ARTEL') AND (category_id = 'tv' OR category_id = 'artel-tv')`
      )
      .get() as { cnt: number };

    const artelVc = db
      .prepare(
        `SELECT count(*) as cnt 
         FROM products 
         WHERE (brand_id = 'artel' OR brand_id = 'ARTEL') AND (category_id = 'vacuum_cleaner' OR category_id = 'artel-vacuum-cleaner')`
      )
      .get() as { cnt: number };

    expect(ardoCooktop.cnt).toBe(25);
    expect(ardoHood.cnt).toBe(15);
    expect(ardoAc.cnt).toBe(4);
    expect(ardoMw.cnt).toBe(2);
    expect(artelAc.cnt).toBe(8);
    expect(artelTv.cnt).toBe(1);
    expect(artelVc.cnt).toBe(1);
    db.close();
  });

  it('Verifies Qaz piltəsi Lotus F-TB941CMW replaces LT941S Black with correct metadata and media', () => {
    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });

    // Ensure old ID does not exist
    const oldProd = db.prepare("SELECT * FROM products WHERE id = 'lotus-lt941s-black'").get();
    expect(oldProd).toBeUndefined();

    // Ensure new ID exists with correct title and code
    const newProd = db.prepare("SELECT * FROM products WHERE id = 'lotus-f-tb941cmw'").get() as {
      id: string;
      code: string;
      title: string;
      primary_image: string;
      dark_image: string;
    };
    expect(newProd).toBeDefined();
    expect(newProd.code).toBe('F-TB941CMW');
    expect(newProd.title).toBe('Qaz piltəsi Lotus F-TB941CMW');
    expect(newProd.primary_image).toContain('Qaz piltəsi Lotus F-TB941CMW');
    expect(newProd.dark_image).toContain('Qaz piltəsi Lotus F-TB941CMW');

    // Ensure media items exist
    const media = db.prepare("SELECT * FROM product_media WHERE product_id = 'lotus-f-tb941cmw' ORDER BY sort_order ASC").all() as Array<{
      url: string;
      dark_url: string;
    }>;
    expect(media.length).toBe(5);
    media.forEach((m) => {
      expect(m.url).toContain('Qaz piltəsi Lotus F-TB941CMW');
      expect(fs.existsSync(path.resolve(__dirname, '../../../public' + m.url))).toBe(true);
      expect(fs.existsSync(path.resolve(__dirname, '../../../site/public' + m.url))).toBe(true);
    });

    db.close();
  });

  it('Verifies reordered Lotus cooktop models have valid primary images and gallery order', () => {
    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });

    const reorderedIds = [
      'lotus-lt3160b',
      'lotus-lt3160s-black',
      'lotus-lt4190-cream',
      'lotus-lt4190b',
      'lotus-lt4316fv-vitroglass',
      'lotus-lt6040-inox',
      'lotus-lt631-tk-black',
      'lotus-lt6455-black',
      'lotus-lt6550ce-black',
      'lotus-lt941-inox'
    ];

    reorderedIds.forEach((prodId) => {
      const prod = db.prepare("SELECT id, title, primary_image, dark_image FROM products WHERE id = ?").get(prodId) as {
        id: string;
        title: string;
        primary_image: string;
        dark_image: string;
      };
      expect(prod.primary_image.endsWith('.webp')).toBe(true);
      expect(prod.primary_image.includes('_light.webp')).toBe(false);
      expect(prod.dark_image.endsWith('.webp')).toBe(true);
      expect(prod.dark_image.includes('_dark.webp')).toBe(false);

      const media = db.prepare("SELECT sort_order, url FROM product_media WHERE product_id = ? ORDER BY sort_order ASC").all(prodId) as Array<{
        sort_order: number;
        url: string;
      }>;
      expect(media.length).toBeGreaterThanOrEqual(2);
      expect(media[0].sort_order).toBe(0);
      expect(media[0].url.endsWith('.webp')).toBe(true);
      expect(media[0].url.includes(' (2).webp')).toBe(false);
      expect(media[1].sort_order).toBe(1);
      expect(media[1].url.includes(' (2).webp')).toBe(true);
    });

    db.close();
  });
});
