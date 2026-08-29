import { describe, it, expect } from 'vitest';
import { normalizeCatalog, normalizeProduct, DEFAULT_CATALOG, DEFAULT_BRANDS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS, DEFAULT_ARTICLES } from '../src/data/catalog';
import { Product } from '../src/types/product';

// ─── normalizeProduct ──────────────────────────────────────────────────────

describe('normalizeProduct — məhsul normallaşdırması', () => {
  const base: Product = {
    id: 'test-1',
    code: 'T001',
    title: 'Test Məhsulu',
    category: 'hood',
    categoryName: 'Aspiratorlar',
    image: '/foto/test.jpg',
    shortDesc: 'Qısa izah',
    specs: [],
    highlights: [],
  };

  it('highlights və specs boş massiv kimi qayıdır, undefined olduqda', () => {
    const result = normalizeProduct({ ...base, highlights: undefined as any, specs: undefined as any });
    expect(result.highlights).toEqual([]);
    expect(result.specs).toEqual([]);
  });

  it('brandId verilmədikdə default ardo təyin edir', () => {
    const result = normalizeProduct({ ...base, brandId: undefined });
    expect(result.brandId).toBe('ardo');
  });

  it('status verilmədikdə default published qayıdır', () => {
    const result = normalizeProduct({ ...base, status: undefined });
    expect(result.status).toBe('published');
  });

  it('gallery şəkilləri deduplication edir — dublikatları silir', () => {
    const result = normalizeProduct({
      ...base,
      image: '/foto/a.jpg',
      gallery: ['/foto/a.jpg', '/foto/b.jpg', '/foto/b.jpg'],
    });
    expect(result.gallery).toEqual(['/foto/a.jpg', '/foto/b.jpg']);
  });

  it('media boş olduqda gallery-dən avtomatik yaradır', () => {
    const result = normalizeProduct({
      ...base,
      image: '/foto/main.jpg',
      gallery: ['/foto/main.jpg', '/foto/extra.jpg'],
      media: [],
    });
    expect(result.media?.length).toBe(2);
    expect(result.media?.[0].type).toBe('image');
    expect(result.media?.[0].url).toBe('/foto/main.jpg');
    expect(result.media?.[1].url).toBe('/foto/extra.jpg');
  });

  it('media mövcud olduqda gallery-dən yeni media yaratmır', () => {
    const existingMedia = [{ id: 'med-1', type: 'image' as const, url: '/foto/custom.jpg' }];
    const result = normalizeProduct({ ...base, media: existingMedia });
    expect(result.media).toEqual(existingMedia);
  });

  it('manufacturingCountry verilmədikdə boş sətir olaraq qayıdır', () => {
    const result = normalizeProduct({ ...base, manufacturingCountry: undefined });
    expect(result.manufacturingCountry).toBe('');
  });
});

// ─── normalizeCatalog ──────────────────────────────────────────────────────

describe('normalizeCatalog — kataloq normallaşdırması', () => {
  it('null və ya undefined girişdə tam default kataloq qaytarır', () => {
    const result = normalizeCatalog(null);
    expect(result.brands).toEqual(DEFAULT_BRANDS);
    expect(result.categories).toEqual(DEFAULT_CATEGORIES);
    expect(result.products).toEqual([]);
    expect(result.settings.companyName).toBe('Sahara Electronics');
  });

  it('boş brendlər massivi olduqda DEFAULT_BRANDS istifadə edir', () => {
    const result = normalizeCatalog({ brands: [] });
    expect(result.brands).toEqual(DEFAULT_BRANDS);
  });

  it('boş kateqoriyalar olduqda DEFAULT_CATEGORIES istifadə edir', () => {
    const result = normalizeCatalog({ categories: [] });
    expect(result.categories).toEqual(DEFAULT_CATEGORIES);
  });

  it('boş articles olduqda DEFAULT_ARTICLES istifadə edir', () => {
    const result = normalizeCatalog({ articles: [] });
    expect(result.articles).toEqual(DEFAULT_ARTICLES);
  });

  it('settings.countries dolu olduqda onu saxlayır', () => {
    const result = normalizeCatalog({
      settings: { ...DEFAULT_SETTINGS, countries: ['Fransa', 'Yaponiya'] },
    });
    expect(result.settings.countries).toEqual(['Fransa', 'Yaponiya']);
    expect(result.countries).toEqual(['Fransa', 'Yaponiya']);
  });

  it('phoneNumber tək olaraq verilsə phoneNumbers massivini qurur', () => {
    const result = normalizeCatalog({
      settings: { ...DEFAULT_SETTINGS, phoneNumber: '994501234567', phoneNumbers: [] },
    });
    expect(result.settings.phoneNumbers).toContain('994501234567');
    expect(result.settings.phoneNumber).toBe('994501234567');
  });

  it('phoneNumbers mövcud olduqda boş sətirləri süzür', () => {
    const result = normalizeCatalog({
      settings: { ...DEFAULT_SETTINGS, phoneNumbers: ['994501111111', '', '994121234567'] },
    });
    expect(result.settings.phoneNumbers).toEqual(['994501111111', '994121234567']);
  });

  it('companyName verilmədikdə Sahara Electronics qalır', () => {
    const result = normalizeCatalog({ settings: { whatsappNumber: '', phoneNumber: '', phoneNumbers: [] } });
    expect(result.settings.companyName).toBe('Sahara Electronics');
  });

  it('draft məhsullar kataloqa normallaşdırılır amma status qalır', () => {
    const result = normalizeCatalog({
      products: [{
        id: 'draft-1', code: 'D001', title: 'Qaralama', category: 'oven', categoryName: 'Sobalar',
        image: '', shortDesc: '', specs: [], highlights: [], status: 'draft',
      }],
    });
    expect(result.products[0].status).toBe('draft');
  });

  it('instagramUsername və facebookUsername fallback dəyərlərini qoruyur', () => {
    const result = normalizeCatalog({});
    expect(result.settings.instagramUsername).toBe('@sahara.electronics');
    expect(result.settings.facebookUsername).toBe('Sahara Electronics');
  });
});
