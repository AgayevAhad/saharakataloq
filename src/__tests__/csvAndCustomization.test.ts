import { describe, expect, it } from 'vitest';
import { exportProductsToCsv, generateCsvTemplate, importProductsFromCsv, parseCsvText } from '../utils/csv';
import { DEFAULT_BRANDS, DEFAULT_CATEGORIES, normalizeCatalog, normalizeProduct } from '../data/catalog';
import { Product } from '../types/product';

const sampleTestProduct: Product = {
  id: 'prod-test-1',
  code: 'ARDO-EX-100',
  title: 'ARDO İtalyan Qaz Sobası',
  brandId: 'ardo',
  category: 'oven',
  categoryName: 'Sobalar',
  image: '/media/products/ardo-oven.png',
  gallery: ['/media/products/ardo-oven-side.png'],
  price: 899,
  oldPrice: 1050,
  currency: '₼',
  badgeText: 'Xüsusi Endirim',
  badgeColor: 'green',
  stockStatus: 'in_stock',
  shortDesc: 'İtalyan SABAF forsunkaları ilə premium soba.',
  highlights: ['SABAF yanma sistemi', '3D Konveksiya', 'A++ Enerji'],
  specs: [
    { id: 'sp-1', name: 'Həcm', value: '65 L', group: 'Əsas' },
    { id: 'sp-2', name: 'Zəmanət', value: '3 il', group: 'Əsas' },
  ],
  manufacturingCountry: 'İtaliya',
  status: 'published',
};

describe('CSV Toplu İdxal və İxrac Funksionallığı', () => {
  it('məhsulları CSV formatına UTF-8 BOM ilə düzgün ixrac edir', () => {
    const csv = exportProductsToCsv([sampleTestProduct], DEFAULT_CATEGORIES, DEFAULT_BRANDS);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('ARDO-EX-100');
    expect(csv).toContain('ARDO İtalyan Qaz Sobası');
    expect(csv).toContain('899');
    expect(csv).toContain('1050');
    expect(csv).toContain('Xüsusi Endirim');
    expect(csv).toContain('green');
    expect(csv).toContain('SABAF yanma sistemi; 3D Konveksiya; A++ Enerji');
  });

  it('standart və dırnaqlı CSV mətnlərini dəqiq parse edir', () => {
    const raw = 'Kod,Ad,"Təsvir, vergüllü",Qiymət\r\nARDO-1,"ARDO Soba, 60sm",Məlumat,450';
    const rows = parseCsvText(raw);
    expect(rows.length).toBe(2);
    expect(rows[0]).toEqual(['Kod', 'Ad', 'Təsvir, vergüllü', 'Qiymət']);
    expect(rows[1]).toEqual(['ARDO-1', 'ARDO Soba, 60sm', 'Məlumat', '450']);
  });

  it('CSV-dən məhsulları parametr, qiymət və kateqoriyalarla idxal edir', () => {
    const sampleCsv = exportProductsToCsv([sampleTestProduct], DEFAULT_CATEGORIES, DEFAULT_BRANDS);
    const { products, errors } = importProductsFromCsv(sampleCsv, DEFAULT_CATEGORIES, DEFAULT_BRANDS);

    expect(errors.length).toBe(0);
    expect(products.length).toBe(1);
    expect(products[0].code).toBe('ARDO-EX-100');
    expect(products[0].price).toBe(899);
    expect(products[0].oldPrice).toBe(1050);
    expect(products[0].badgeText).toBe('Xüsusi Endirim');
    expect(products[0].badgeColor).toBe('green');
    expect(products[0].highlights).toEqual(['SABAF yanma sistemi', '3D Konveksiya', 'A++ Enerji']);
    expect(products[0].specs.length).toBe(2);
    expect(products[0].specs[0].name).toBe('Həcm');
    expect(products[0].specs[0].value).toBe('65 L');
  });

  it('nümunə CSV şablonunu uğurla yaradır', () => {
    const template = generateCsvTemplate();
    expect(template).toContain('Model Kodu');
    expect(template).toContain('ARDO-HD60-S');
  });
});

describe('Məhsul və Kataloq Dinamik Tənzimləmələri', () => {
  it('məhsulun qiymət, köhnə qiymət və nişan məlumatlarını qoruyur', () => {
    const normalized = normalizeProduct(sampleTestProduct);
    expect(normalized.price).toBe(899);
    expect(normalized.oldPrice).toBe(1050);
    expect(normalized.badgeText).toBe('Xüsusi Endirim');
    expect(normalized.badgeColor).toBe('green');
  });

  it('kataloq parametrlərində xüsusi rəng, başlıq və düymə mətnlərini saxlayır', () => {
    const normalized = normalizeCatalog({
      brands: DEFAULT_BRANDS,
      categories: DEFAULT_CATEGORIES,
      products: [sampleTestProduct],
      settings: {
        companyName: 'Sahara Electronics',
        siteTitle: 'Sahara Premium Məişət Texnikası',
        primaryColor: '#2563eb',
        whatsappButtonText: 'Sifariş et',
        callButtonText: 'Əlaqə saxla',
        scrollTopButtonText: 'Başa qayıt',
      },
    });

    expect(normalized.settings.siteTitle).toBe('Sahara Premium Məişət Texnikası');
    expect(normalized.settings.primaryColor).toBe('#2563eb');
    expect(normalized.settings.whatsappButtonText).toBe('Sifariş et');
    expect(normalized.settings.callButtonText).toBe('Əlaqə saxla');
    expect(normalized.settings.scrollTopButtonText).toBe('Başa qayıt');
  });
});
