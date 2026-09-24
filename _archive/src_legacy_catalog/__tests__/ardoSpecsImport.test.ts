import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseMultilineSpecs, inferCategoryFromName, importProductsFromExcel } from '../utils/excel';
import { CatalogCategory, Brand } from '../types/product';

describe('Ardo xüsusiyyətlər_yoxlanılıb Excel Import & Specs Parser', () => {
  const categories: CatalogCategory[] = [
    { id: 'aspirator', name: 'Aspiratorlar', slug: 'aspiratorlar', active: true },
    { id: 'plite', name: 'Bişirmə Panelləri (Plitələr)', slug: 'plite', active: true },
    { id: 'soba', name: 'Quraşdırılan Sobalar', slug: 'sobalar', active: true },
    { id: 'qabyuyan', name: 'Qabyuyan Maşınlar', slug: 'qabyuyan', active: true },
    { id: 'soyuducu', name: 'Soyuducular', slug: 'soyuducular', active: true },
  ];

  const brands: Brand[] = [
    { id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'İtaliya', manufacturingCountries: ['İtaliya'], active: true },
  ];

  it('correctly parses multiline specs strings with various dashes and colons', () => {
    const rawSpecs = `Növ - Aspirator
İş rejmi -Skoruslu
Məhsuldarlıq – 1200 m³/saat
Səs səviyyəsi - 49dsb
Ölçülər - 52x27
Rəng – Qara
İdarəetmə növü : Sensor
Qaz nəzarəti: Var`;

    const specs = parseMultilineSpecs(rawSpecs);
    expect(specs.length).toBeGreaterThanOrEqual(7);

    const nov = specs.find((s) => s.name === 'Növ');
    expect(nov).toBeDefined();
    expect(nov?.value).toBe('Aspirator');

    const mehsul = specs.find((s) => s.name === 'Məhsuldarlıq');
    expect(mehsul).toBeDefined();
    expect(mehsul?.value).toBe('1200 m³/saat');

    const ses = specs.find((s) => s.name === 'Səs səviyyəsi');
    expect(ses).toBeDefined();
    expect(ses?.value).toBe('49dsb');

    const reng = specs.find((s) => s.name === 'Rəng');
    expect(reng).toBeDefined();
    expect(reng?.value).toBe('Qara');

    const idare = specs.find((s) => s.name === 'İdarəetmə növü');
    expect(idare).toBeDefined();
    expect(idare?.value).toBe('Sensor');
  });

  it('infers correct category from product title and spec cues', () => {
    expect(inferCategoryFromName('ARDO 60 sm İnox Aspirator', categories).categoryId).toBe('aspirator');
    expect(inferCategoryFromName('ARDO 4 gözlü Qaz Plitəsi', categories).categoryId).toBe('plite');
    expect(inferCategoryFromName('ARDO Elektrikli Daxili Soba 65L', categories).categoryId).toBe('soba');
    expect(inferCategoryFromName('ARDO Tam İnteqrasiya Edilən Qabyuyan', categories).categoryId).toBe('qabyuyan');
    expect(inferCategoryFromName('ARDO İkikameralı Soyuducu No-Frost', categories).categoryId).toBe('soyuducu');
  });

  it('reads and parses the actual "Ardo xüsusiyyətlər_yoxlanılıb.xlsx" file if present on disk', () => {
    const filePath = path.resolve(__dirname, '../../File/Ardo xüsusiyyətlər_yoxlanılıb.xlsx');
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const result = importProductsFromExcel(buffer, categories, brands);

      expect(result.errors.length).toBe(0);
      expect(result.products.length).toBeGreaterThan(0);

      // Verify each imported product has essential fields
      result.products.forEach((p) => {
        expect(p.id).toBeDefined();
        expect(p.code).toBeDefined();
        expect(p.title).toBeDefined();
        expect(p.specs).toBeInstanceOf(Array);
        expect(p.status).toBe('published');
      });

      // Verify at least some products have parsed specs
      const productsWithSpecs = result.products.filter((p) => p.specs.length > 0);
      expect(productsWithSpecs.length).toBeGreaterThan(0);
    }
  });
});
