// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { resolveThemeImage } from '../utils/themeImage';
import { ShimmerImage } from '../components/ShimmerImage';

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
  document.body.className = '';
});

const SITE_DB_PATH = path.resolve(__dirname, '../../../site/data/catalog.sqlite');
const ROOT_DB_PATH = path.resolve(__dirname, '../../../data/catalog.sqlite');

const PILOT_PRODUCTS = [
  {
    id: 'lotus-f-tb941cmw',
    code: 'F-TB941CMW',
    brand: 'LOTUS',
    catFolder: 'LOTUS_BISIRME_PANELI',
    prodFolder: 'Qaz piltəsi Lotus F-TB941CMW',
    mediaCount: 5,
  },
  {
    id: 'lotus-lt-18-orange',
    code: 'LT 18 Orange',
    brand: 'LOTUS',
    catFolder: 'LOTUS_TOZSORAN',
    prodFolder: 'Tozsoran Lotus LT 18 Orange',
    mediaCount: 3,
  },
  {
    id: 'lotus-lt-20-blue',
    code: 'LT 20 Blue',
    brand: 'LOTUS',
    catFolder: 'LOTUS_TOZSORAN',
    prodFolder: 'Tozsoran Lotus LT 20 Blue',
    mediaCount: 3,
  },
  {
    id: 'lotus-lt-8803',
    code: 'LT-8803',
    brand: 'LOTUS',
    catFolder: 'LOTUS_UTU',
    prodFolder: 'Utu Buxarli Lotus LT-8803',
    mediaCount: 2,
  },
  {
    id: 'lotus-lt6455-black',
    code: 'LT6455 Black',
    brand: 'LOTUS',
    catFolder: 'LOTUS_BISIRME_PANELI',
    prodFolder: 'Plite Lotus LT6455 Black',
    mediaCount: 2,
  },
  {
    id: 'ardo-6331-gb',
    code: '6331 GB',
    brand: 'ARDO',
    catFolder: 'ARDO_BISIRME_PANELI',
    prodFolder: 'Plitə Ardo 6331 GB',
    mediaCount: 2,
  },
];

describe('Transparent 3D Product Media and Database Suite', () => {
  it('All 6 pilot products in both databases point to transparent .webp assets (no _light or _dark)', () => {
    for (const dbPath of [SITE_DB_PATH, ROOT_DB_PATH]) {
      const db = new DatabaseSync(dbPath, { readOnly: true });

      for (const prod of PILOT_PRODUCTS) {
        const row = db
          .prepare('SELECT id, code, primary_image, dark_image, original_image FROM products WHERE id = ?')
          .get(prod.id) as {
          id: string;
          code: string;
          primary_image: string;
          dark_image: string;
          original_image: string;
        };

        expect(row).toBeDefined();
        expect(row.primary_image.endsWith('.webp')).toBe(true);
        expect(row.primary_image.includes('_light.webp')).toBe(false);
        expect(row.primary_image.includes('_dark.webp')).toBe(false);

        expect(row.dark_image.endsWith('.webp')).toBe(true);
        expect(row.dark_image.includes('_light.webp')).toBe(false);
        expect(row.dark_image.includes('_dark.webp')).toBe(false);

        const media = db
          .prepare('SELECT id, sort_order, url, dark_url FROM product_media WHERE product_id = ? ORDER BY sort_order')
          .all(prod.id) as Array<{ id: string; sort_order: number; url: string; dark_url: string }>;

        expect(media.length).toBe(prod.mediaCount);
        media.forEach((m) => {
          expect(m.url.endsWith('.webp')).toBe(true);
          expect(m.url.includes('_light.webp')).toBe(false);
          expect(m.url.includes('_dark.webp')).toBe(false);
          expect(m.dark_url.endsWith('.webp')).toBe(true);
          expect(m.dark_url.includes('_light.webp')).toBe(false);
          expect(m.dark_url.includes('_dark.webp')).toBe(false);
        });
      }

      db.close();
    }
  });

  it('All transparent .webp files physically exist on disk in public and site/public', () => {
    const db = new DatabaseSync(SITE_DB_PATH, { readOnly: true });

    for (const prod of PILOT_PRODUCTS) {
      const media = db
        .prepare('SELECT url FROM product_media WHERE product_id = ?')
        .all(prod.id) as Array<{ url: string }>;

      media.forEach((m) => {
        const rootPath = path.resolve(__dirname, '../../../public' + m.url);
        const sitePath = path.resolve(__dirname, '../../../site/public' + m.url);

        expect(fs.existsSync(rootPath), `Missing root file: ${rootPath}`).toBe(true);
        expect(fs.existsSync(sitePath), `Missing site file: ${sitePath}`).toBe(true);

        const rootStat = fs.statSync(rootPath);
        const siteStat = fs.statSync(sitePath);
        expect(rootStat.size).toBeGreaterThan(1000);
        expect(siteStat.size).toBeGreaterThan(1000);
      });
    }

    db.close();
  });

  it('Output directories are promoted to root and yenilənmiş_v2 folders are removed', () => {
    for (const prod of PILOT_PRODUCTS) {
      const brandOut = path.resolve(
        __dirname,
        `../../../Media/BRENDS/${prod.brand}/${prod.catFolder}/${prod.prodFolder}_output`
      );
      const scriptOut = path.resolve(
        __dirname,
        `../../../Media/ScriptŞəkilMod/Məhsul/${prod.brand}/${prod.catFolder}/${prod.prodFolder}_output`
      );

      for (const outDir of [brandOut, scriptOut]) {
        expect(fs.existsSync(outDir)).toBe(true);
        const v2Dir = path.join(outDir, 'yenilənmiş_v2');
        expect(fs.existsSync(v2Dir), `Temporary folder ${v2Dir} should have been removed`).toBe(false);

        const transDir = path.join(outDir, '02_transparent');
        expect(fs.existsSync(transDir)).toBe(true);
        const transFiles = fs.readdirSync(transDir).filter((f) => f.endsWith('.webp'));
        expect(transFiles.length).toBe(prod.mediaCount);
      }
    }
  });

  it('resolveThemeImage preserves transparent image URLs unchanged across light and dark modes', () => {
    const transparentUrl =
      '/media/products/LOTUS/LOTUS_BISIRME_PANELI/Qaz piltəsi Lotus F-TB941CMW/Qaz piltəsi Lotus F-TB941CMW.webp';

    expect(resolveThemeImage(transparentUrl, false)).toBe(transparentUrl);
    expect(resolveThemeImage(transparentUrl, true)).toBe(transparentUrl);
    expect(resolveThemeImage(transparentUrl, false, transparentUrl)).toBe(transparentUrl);
    expect(resolveThemeImage(transparentUrl, true, transparentUrl)).toBe(transparentUrl);
  });

  it('ShimmerImage adds has-transparent-product and is-transparent-product classes', () => {
    const transparentUrl =
      '/media/products/LOTUS/LOTUS_TOZSORAN/Tozsoran Lotus LT 18 Orange/Tozsoran Lotus LT 18 Orange.webp';

    const { container } = render(
      <ShimmerImage src={transparentUrl} alt="Tozsoran Lotus LT 18 Orange" isDarkMode={false} />
    );

    const wrap = container.querySelector('.img-shimmer-container');
    expect(wrap).not.toBeNull();
    expect(wrap?.classList.contains('has-transparent-product')).toBe(true);

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.classList.contains('is-transparent-product')).toBe(true);
  });

  it('CSS files contain 3D dynamic stage backdrop and contour drop shadow rules', () => {
    const cardCss = fs.readFileSync(
      path.resolve(__dirname, '../styles/components/product-card.css'),
      'utf-8'
    );
    const modalCss = fs.readFileSync(
      path.resolve(__dirname, '../styles/components/modal.css'),
      'utf-8'
    );
    const mediaCss = fs.readFileSync(
      path.resolve(__dirname, '../styles/components/website-product-media.css'),
      'utf-8'
    );

    // Verify product-card.css has 3D stage and drop-shadow
    expect(cardCss).toContain('.product-card-img-wrap:has(.has-transparent-product)');
    expect(cardCss).toContain('is-transparent-product');
    expect(cardCss).toContain('drop-shadow(0 14px 22px rgba(15, 23, 42, 0.16))');
    expect(cardCss).toContain('radial-gradient(ellipse 78% 66% at 50% 36%');
    expect(cardCss).not.toContain('#181d26');

    // Verify modal.css has 3D stage and drop-shadow
    expect(modalCss).toContain('.product-detail-image-stage:has(.has-transparent-product)');
    expect(modalCss).toContain('is-transparent-product');
    expect(modalCss).toContain('drop-shadow(0 14px 22px rgba(15, 23, 42, 0.16))');
    expect(modalCss).not.toContain('#181d26');

    // Verify website-product-media.css has 3D stage and drop-shadow
    expect(mediaCss).toContain('.site-product-media:has(.has-transparent-product)');
    expect(mediaCss).toContain('is-transparent-product');
    expect(mediaCss).toContain('drop-shadow(0 14px 22px rgba(15, 23, 42, 0.16))');
    expect(mediaCss).not.toContain('#181d26');
  });

  it('Global catalog audit: Exactly ZERO products or media rows retain _light or _dark across databases', () => {
    for (const dbPath of [SITE_DB_PATH, ROOT_DB_PATH]) {
      const db = new DatabaseSync(dbPath, { readOnly: true });

      const prodLight = db
        .prepare(
          "SELECT count(*) as count FROM products WHERE primary_image LIKE '%_light%' OR primary_image LIKE '%_dark%' OR dark_image LIKE '%_dark%'"
        )
        .get() as { count: number };
      expect(prodLight.count).toBe(0);

      const mediaLight = db
        .prepare(
          "SELECT count(*) as count FROM product_media WHERE url LIKE '%_light%' OR url LIKE '%_dark%' OR dark_url LIKE '%_dark%'"
        )
        .get() as { count: number };
      expect(mediaLight.count).toBe(0);

      db.close();
    }
  });
});

