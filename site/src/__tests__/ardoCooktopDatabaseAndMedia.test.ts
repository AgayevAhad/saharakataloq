import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

const SITE_DB_PATH = path.resolve(__dirname, '../../../site/data/catalog.sqlite');
const ROOT_DB_PATH = path.resolve(__dirname, '../../../data/catalog.sqlite');
const SITE_MEDIA_DIR = path.resolve(__dirname, '../../../site/public/media/products/ARDO/ARDO_BISIRME_PANELI');
const ROOT_MEDIA_DIR = path.resolve(__dirname, '../../../public/media/products/ARDO/ARDO_BISIRME_PANELI');

describe('ARDO Cooktop Database and Media Integrity Suite', () => {
  it('site/data/catalog.sqlite contains exactly 25 ARDO cooktops with valid light and dark images', () => {
    expect(fs.existsSync(SITE_DB_PATH)).toBe(true);
    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });

    const products = db
      .prepare(
        `SELECT id, code, title, primary_image, dark_image, brand_id, category_id 
         FROM products 
         WHERE (brand_id = 'ardo' OR brand_id = 'ARDO') AND (category_id = 'cooktop' OR category_id = 'ardo-cooktop')`
      )
      .all() as Array<{
      id: string;
      code: string;
      title: string;
      primary_image: string;
      dark_image: string;
    }>;

    expect(products.length).toBe(25);

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
         WHERE (p.brand_id = 'ardo' OR p.brand_id = 'ARDO') AND (p.category_id = 'cooktop' OR p.category_id = 'ardo-cooktop')`
      )
      .all() as Array<{ id: string; product_id: string; url: string; dark_url: string }>;

    expect(mediaList.length).toBe(65);
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

  it('data/catalog.sqlite contains exactly 25 ARDO cooktops with matching records', () => {
    expect(fs.existsSync(ROOT_DB_PATH)).toBe(true);
    const db = new DatabaseSync(ROOT_DB_PATH, { readOnly: true });

    const products = db
      .prepare(
        `SELECT id, code, title, primary_image, dark_image 
         FROM products 
         WHERE (brand_id = 'ardo' OR brand_id = 'ARDO') AND (category_id = 'cooktop' OR category_id = 'ardo-cooktop')`
      )
      .all() as Array<{
      id: string;
      code: string;
      title: string;
      primary_image: string;
      dark_image: string;
    }>;

    expect(products.length).toBe(25);
    products.forEach((p) => {
      expect(p.primary_image.endsWith('.webp')).toBe(true);
      expect(p.primary_image.includes('_light.webp')).toBe(false);
      expect(p.dark_image.endsWith('.webp')).toBe(true);
      expect(p.dark_image.includes('_dark.webp')).toBe(false);
    });

    db.close();
  });

  it('All 65 image pairs physically exist on disk in both public and site/public directories', () => {
    expect(fs.existsSync(SITE_MEDIA_DIR)).toBe(true);
    expect(fs.existsSync(ROOT_MEDIA_DIR)).toBe(true);

    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });
    const mediaList = db
      .prepare(
        `SELECT pm.url, pm.dark_url 
         FROM product_media pm 
         JOIN products p ON pm.product_id = p.id 
         WHERE (p.brand_id = 'ardo' OR p.brand_id = 'ARDO') AND (p.category_id = 'cooktop' OR p.category_id = 'ardo-cooktop')`
      )
      .all() as Array<{ url: string; dark_url: string }>;

    expect(mediaList.length).toBe(65);

    mediaList.forEach((m) => {
      const relLight = m.url.replace(/^\/media\//, '');
      const relDark = m.dark_url.replace(/^\/media\//, '');

      // Check site public
      const siteLightPath = path.resolve(__dirname, '../../../site/public/media', relLight);
      const siteDarkPath = path.resolve(__dirname, '../../../site/public/media', relDark);
      expect(fs.existsSync(siteLightPath)).toBe(true);
      expect(fs.existsSync(siteDarkPath)).toBe(true);

      // Check root public
      const rootLightPath = path.resolve(__dirname, '../../../public/media', relLight);
      const rootDarkPath = path.resolve(__dirname, '../../../public/media', relDark);
      expect(fs.existsSync(rootLightPath)).toBe(true);
      expect(fs.existsSync(rootDarkPath)).toBe(true);
    });

    db.close();
  });

  it('No legacy non-webp or residual files exist in ARDO_BISIRME_PANELI directories', () => {
    const checkDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else {
          expect(entry.name.endsWith('.webp')).toBe(true);
          expect(entry.name.endsWith('.jpg')).toBe(false);
          expect(entry.name.endsWith('.png')).toBe(false);
        }
      }
    };

    checkDir(SITE_MEDIA_DIR);
    checkDir(ROOT_MEDIA_DIR);
  });
});
