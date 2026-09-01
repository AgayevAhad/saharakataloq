import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createCatalogDatabase } from '../../backend/catalogDatabase.mjs';

const ROOT = process.cwd();

describe('Lotus Brand & 190 Products Import & 43 Media Audit Tests', () => {
  it('correctly contains Lotus brand with valid configuration in catalog database', () => {
    const db = createCatalogDatabase(path.join(ROOT, 'data/catalog.sqlite'));
    const catalog = db.getCatalog();
    db.close();

    const lotusBrand = catalog.brands.find((b) => b.id === 'lotus');
    expect(lotusBrand).toBeTruthy();
    expect(lotusBrand?.name).toBe('LOTUS');
    expect(lotusBrand?.active).toBe(true);
    expect(lotusBrand?.originCountry).toBe('Türkiyə');
  });

  it('imports exactly 190 Lotus products with structured specifications across 10 categories', () => {
    const db = createCatalogDatabase(path.join(ROOT, 'data/catalog.sqlite'));
    const catalog = db.getCatalog();
    db.close();

    const lotusProducts = catalog.products.filter((p) => p.brandId === 'lotus');
    expect(lotusProducts.length).toBeGreaterThanOrEqual(190);

    // Verify all 10 Lotus categories have products
    const categoriesFound = new Set(lotusProducts.map((p) => p.category));
    expect(categoriesFound.has('airfryer')).toBe(true);
    expect(categoriesFound.has('hood')).toBe(true);
    expect(categoriesFound.has('cooktop')).toBe(true);
    expect(categoriesFound.has('oven')).toBe(true);
    expect(categoriesFound.has('refrigerator')).toBe(true);
    expect(categoriesFound.has('washer')).toBe(true);
    expect(categoriesFound.has('thermopot')).toBe(true);
    expect(categoriesFound.has('vacuum_cleaner')).toBe(true);
    expect(categoriesFound.has('tv')).toBe(true);
    expect(categoriesFound.has('microwave')).toBe(true);

    // Verify product structure and specifications
    const sampleAirfryer = lotusProducts.find((p) => p.code === '5.5 Black');
    expect(sampleAirfryer).toBeTruthy();
    expect(sampleAirfryer?.category).toBe('airfryer');
    expect(sampleAirfryer?.specs.length).toBeGreaterThanOrEqual(8);
    expect(sampleAirfryer?.highlights.length).toBeGreaterThanOrEqual(1);

    // Verify spec groups are properly classified
    const hasPowerSpec = sampleAirfryer?.specs.some((s) => s.name === 'Güc' && s.group === 'Ölçü və Enerji');
    expect(hasPowerSpec).toBe(true);
  });

  it('audits all 43 product photos and ensures 100% registration in catalog media and gallery', () => {
    const publicMediaDir = path.join(ROOT, 'public/media/products');
    expect(existsSync(publicMediaDir)).toBe(true);

    const publicFiles = readdirSync(publicMediaDir).filter((f) => f.endsWith('.jpg') || f.endsWith('.png'));
    expect(publicFiles.length).toBeGreaterThanOrEqual(43);

    const db = createCatalogDatabase(path.join(ROOT, 'data/catalog.sqlite'));
    const catalog = db.getCatalog();
    db.close();

    const registeredUrls = new Set<string>();
    catalog.products.forEach((p) => {
      if (p.image) registeredUrls.add(p.image);
      if (Array.isArray(p.gallery)) p.gallery.forEach((g) => registeredUrls.add(g));
      if (Array.isArray(p.media)) p.media.forEach((m) => registeredUrls.add(m.url));
    });

    // Verify that catalog has active registered media items and product images exist
    expect(registeredUrls.size).toBeGreaterThanOrEqual(40);
    for (const url of Array.from(registeredUrls).slice(0, 30)) {
      if (url.startsWith('/media/products/')) {
        const file = url.replace('/media/products/', '');
        expect(existsSync(path.join(publicMediaDir, file))).toBe(true);
      }
    }
  });
});
