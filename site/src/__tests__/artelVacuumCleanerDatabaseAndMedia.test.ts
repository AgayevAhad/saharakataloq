import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

const SITE_DB_PATH = path.resolve(__dirname, '../../../site/data/catalog.sqlite');
const ROOT_DB_PATH = path.resolve(__dirname, '../../../data/catalog.sqlite');
const SITE_MEDIA_DIR = path.resolve(__dirname, '../../../site/public/media/products/ARTEL/ARTEL_TOZSORAN');
const ROOT_MEDIA_DIR = path.resolve(__dirname, '../../../public/media/products/ARTEL/ARTEL_TOZSORAN');

describe('ARTEL Vacuum Cleaner (Tozsoran) Database and Media Integrity Suite', () => {
  it('site/data/catalog.sqlite contains exactly 1 ARTEL vacuum cleaner with valid light and dark images', () => {
    expect(fs.existsSync(SITE_DB_PATH)).toBe(true);
    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });

    const products = db
      .prepare(
        `SELECT id, code, title, primary_image, dark_image, brand_id, category_id 
         FROM products 
         WHERE (brand_id = 'artel' OR brand_id = 'ARTEL') AND (category_id = 'vacuum_cleaner' OR category_id = 'artel-vacuum-cleaner')`
      )
      .all() as Array<{
      id: string;
      code: string;
      title: string;
      primary_image: string;
      dark_image: string;
    }>;

    expect(products.length).toBe(1);

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
         WHERE (p.brand_id = 'artel' OR p.brand_id = 'ARTEL') AND (p.category_id = 'vacuum_cleaner' OR p.category_id = 'artel-vacuum-cleaner')`
      )
      .all() as Array<{ id: string; product_id: string; url: string; dark_url: string }>;

    expect(mediaList.length).toBe(3);
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

  it('data/catalog.sqlite contains exactly 1 ARTEL vacuum cleaner with matching records', () => {
    expect(fs.existsSync(ROOT_DB_PATH)).toBe(true);
    const db = new DatabaseSync(ROOT_DB_PATH, { readOnly: true });

    const products = db
      .prepare(
        `SELECT id, code, title, primary_image, dark_image 
         FROM products 
         WHERE (brand_id = 'artel' OR brand_id = 'ARTEL') AND (category_id = 'vacuum_cleaner' OR category_id = 'artel-vacuum-cleaner')`
      )
      .all() as Array<{
      id: string;
      code: string;
      title: string;
      primary_image: string;
      dark_image: string;
    }>;

    expect(products.length).toBe(1);
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
         WHERE (p.brand_id = 'artel' OR p.brand_id = 'ARTEL') AND (p.category_id = 'vacuum_cleaner' OR p.category_id = 'artel-vacuum-cleaner')`
      )
      .all() as Array<{ id: string; product_id: string; url: string; dark_url: string }>;

    expect(mediaList.length).toBe(3);

    db.close();
  });

  it('All 3 image pairs physically exist on disk in both public and site/public directories', () => {
    expect(fs.existsSync(SITE_MEDIA_DIR)).toBe(true);
    expect(fs.existsSync(ROOT_MEDIA_DIR)).toBe(true);

    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });
    const mediaList = db
      .prepare(
        `SELECT pm.url, pm.dark_url 
         FROM product_media pm 
         JOIN products p ON pm.product_id = p.id 
         WHERE (p.brand_id = 'artel' OR p.brand_id = 'ARTEL') AND (p.category_id = 'vacuum_cleaner' OR p.category_id = 'artel-vacuum-cleaner')`
      )
      .all() as Array<{ url: string; dark_url: string }>;

    expect(mediaList.length).toBe(3);

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

  it('Zero legacy JPG/JPEG files remain in the deployed ARTEL_TOZSORAN directories', () => {
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

  it('Preserves ARDO products and ARTEL other categories (8 ACs, 1 TV) untouched', () => {
    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });
    const cooktopCount = db
      .prepare(
        `SELECT count(*) as cnt 
         FROM products 
         WHERE (brand_id = 'ardo' OR brand_id = 'ARDO') AND (category_id = 'cooktop' OR category_id = 'ardo-cooktop')`
      )
      .get() as { cnt: number };

    const hoodCount = db
      .prepare(
        `SELECT count(*) as cnt 
         FROM products 
         WHERE (brand_id = 'ardo' OR brand_id = 'ARDO') AND (category_id = 'hood' OR category_id = 'ardo-hood')`
      )
      .get() as { cnt: number };

    const acCount = db
      .prepare(
        `SELECT count(*) as cnt 
         FROM products 
         WHERE (brand_id = 'ardo' OR brand_id = 'ARDO') AND (category_id = 'air_conditioner' OR category_id = 'ardo-air-conditioner')`
      )
      .get() as { cnt: number };

    const mwCount = db
      .prepare(
        `SELECT count(*) as cnt 
         FROM products 
         WHERE (brand_id = 'ardo' OR brand_id = 'ARDO') AND (category_id = 'microwave' OR category_id = 'ardo-microwave')`
      )
      .get() as { cnt: number };

    const artelAcCount = db
      .prepare(
        `SELECT count(*) as cnt 
         FROM products 
         WHERE (brand_id = 'artel' OR brand_id = 'ARTEL') AND (category_id = 'air_conditioner' OR category_id = 'artel-air-conditioner')`
      )
      .get() as { cnt: number };

    const artelTvCount = db
      .prepare(
        `SELECT count(*) as cnt 
         FROM products 
         WHERE (brand_id = 'artel' OR brand_id = 'ARTEL') AND (category_id = 'tv' OR category_id = 'artel-tv')`
      )
      .get() as { cnt: number };

    expect(cooktopCount.cnt).toBe(25);
    expect(hoodCount.cnt).toBe(15);
    expect(acCount.cnt).toBe(4);
    expect(mwCount.cnt).toBe(2);
    expect(artelAcCount.cnt).toBe(8);
    expect(artelTvCount.cnt).toBe(1);
    db.close();
  });
});
