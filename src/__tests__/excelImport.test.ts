import { describe, expect, it } from 'vitest';
import { DEFAULT_BRANDS, DEFAULT_CATEGORIES } from '../data/catalog';
import { Product } from '../types/product';
import {
  exportProductsToExcel,
  generateExcelTemplate,
  importProductsFromExcel,
} from '../utils/excel';

describe('Excel (.xlsx) İdxal və İxrac Funksionallığı Testləri', () => {
  const sampleProducts: Product[] = [
    {
      id: 'prod-1',
      code: 'ARDO-TEST-1',
      title: 'ARDO Test Ankastre Qaz Paneli',
      brandId: 'ardo',
      category: 'gas_hob',
      categoryName: 'Qaz Panelləri',
      price: 380,
      oldPrice: 450,
      currency: '₼',
      badgeText: 'Xüsusi Təklif',
      badgeColor: 'green',
      stockStatus: 'in_stock',
      status: 'published',
      manufacturingCountry: 'İtaliya',
      shortDesc: 'SABAF forsunkalı və qaz nəzarətli.',
      highlights: ['SABAF Sistemi', 'Qaz Nəzarəti'],
      specs: [
        { id: 's1', name: 'Göz sayı', value: '4', group: 'Əsas' },
        { id: 's2', name: 'Səth növü', value: 'İnox', group: 'Əsas' },
      ],
      image: '/media/test-hob.png',
      gallery: ['/media/test-hob-1.png'],
      media: [],
    },
  ];

  it('məhsulları Excel (.xlsx) formatında generasiya edir və düzgün oxuyur', () => {
    const excelBuffer = exportProductsToExcel(sampleProducts, DEFAULT_CATEGORIES, DEFAULT_BRANDS);
    expect(excelBuffer).toBeDefined();
    expect(excelBuffer.length).toBeGreaterThan(100);

    const { products, errors } = importProductsFromExcel(
      excelBuffer,
      DEFAULT_CATEGORIES,
      DEFAULT_BRANDS
    );

    expect(errors.length).toBe(0);
    expect(products.length).toBe(1);
    expect(products[0].code).toBe('ARDO-TEST-1');
    expect(products[0].title).toBe('ARDO Test Ankastre Qaz Paneli');
    expect(products[0].price).toBe(380);
    expect(products[0].oldPrice).toBe(450);
    expect(products[0].badgeText).toBe('Xüsusi Təklif');
    expect(products[0].badgeColor).toBe('green');
    expect(products[0].highlights).toContain('SABAF Sistemi');
    expect(products[0].specs.length).toBe(2);
    expect(products[0].specs[0].name).toBe('Göz sayı');
    expect(products[0].specs[0].value).toBe('4');
  });

  it('Excel şablonunu generasiya edir və şablon məhsullarını uğurla import edir', () => {
    const templateBuffer = generateExcelTemplate();
    expect(templateBuffer).toBeDefined();
    expect(templateBuffer.length).toBeGreaterThan(100);

    const { products, errors } = importProductsFromExcel(
      templateBuffer,
      DEFAULT_CATEGORIES,
      DEFAULT_BRANDS
    );

    expect(errors.length).toBe(0);
    expect(products.length).toBeGreaterThanOrEqual(1);
    expect(products[0].code).toBeDefined();
    expect(products[0].title).toBeDefined();
  });

  it('boş və ya zədəli fayl zamanı müvafiq xəta qaytarır', () => {
    const emptyBuffer = new Uint8Array(10);
    const { products, errors } = importProductsFromExcel(
      emptyBuffer,
      DEFAULT_CATEGORIES,
      DEFAULT_BRANDS
    );

    expect(products.length).toBe(0);
    expect(errors.length).toBeGreaterThan(0);
  });
});
