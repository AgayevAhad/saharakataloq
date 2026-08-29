import { describe, it, expect } from 'vitest';
import { normalizeProduct } from '../src/data/catalog';
import { filterCatalogProducts } from '../src/utils/filter';
import { Product } from '../src/types/product';

const makeProduct = (overrides: Partial<Product>): Product =>
  normalizeProduct({
    id: 'p-default',
    code: 'DEFAULT',
    title: 'Default Məhsul',
    category: 'hood',
    categoryName: 'Aspiratorlar',
    image: '',
    shortDesc: '',
    specs: [],
    highlights: [],
    status: 'published',
    ...overrides,
  });

const aspirator = makeProduct({ id: 'asp-1', code: 'A500', title: 'ARDO A500 Aspirator', category: 'hood', categoryName: 'Aspiratorlar', brandId: 'ardo' });
const kondisioner = makeProduct({ id: 'kon-1', code: 'K200', title: 'ARDO K200 Kondisioner', category: 'air_conditioner', categoryName: 'Kondisionerlər', brandId: 'ardo' });
const lotusMikro = makeProduct({ id: 'lot-1', code: 'LM100', title: 'LOTUS Mikrodalğa', category: 'microwave', categoryName: 'Mikrodalğalı sobalar', brandId: 'lotus', status: 'published' });
const draftMehsul = makeProduct({ id: 'drft-1', code: 'D999', title: 'Qaralama Məhsul', category: 'hood', categoryName: 'Aspiratorlar', status: 'draft' });
const specMehsul = makeProduct({
  id: 'spec-1', code: 'S100', title: 'Spec Məhsulu', category: 'oven', categoryName: 'Sobalar', brandId: 'ardo',
  specs: [{ id: 'sp1', name: 'Həcm', value: '65 Litr', group: 'Əsas' }],
  highlights: ['Enerji qənaəti', 'Sürətli bişirmə'],
  manufacturingCountry: 'Türkiyə',
});

const allProducts = [aspirator, kondisioner, lotusMikro, draftMehsul, specMehsul];

describe('Məhsul filtrləmə məntiqi (filterCatalogProducts)', () => {

  describe('draft məhsul gizlədilməsi', () => {
    it('draft statuslu məhsulları həmişə gizlədir', () => {
      const result = filterCatalogProducts(allProducts, 'all', 'all', '');
      expect(result.find((p) => p.id === 'drft-1')).toBeUndefined();
    });

    it('draft olmayan bütün published məhsulları göstərir', () => {
      const result = filterCatalogProducts(allProducts, 'all', 'all', '');
      expect(result.length).toBe(4);
    });
  });

  describe('kateqoriya filtri', () => {
    it('"all" seçildikdə bütün published məhsullar qayıdır', () => {
      const result = filterCatalogProducts(allProducts, 'all', 'all', '');
      expect(result.length).toBe(4);
    });

    it('hood kateqoriyası yalnız aspiratoru qaytarır', () => {
      const result = filterCatalogProducts(allProducts, 'hood', 'all', '');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('asp-1');
    });

    it('air_conditioner kateqoriyası yalnız kondisioneri qaytarır', () => {
      const result = filterCatalogProducts(allProducts, 'air_conditioner', 'all', '');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('kon-1');
    });

    it('uyğun olmayan kateqoriyada heç nə qayıtmır', () => {
      const result = filterCatalogProducts(allProducts, 'refrigerator', 'all', '');
      expect(result.length).toBe(0);
    });
  });

  describe('brend filtri', () => {
    it('ardo brendini seçdikdə lotus məhsulları çıxır', () => {
      const result = filterCatalogProducts(allProducts, 'all', 'ardo', '');
      expect(result.find((p) => p.brandId === 'lotus')).toBeUndefined();
    });

    it('lotus brendini seçdikdə yalnız lotus məhsulları qayıdır', () => {
      const result = filterCatalogProducts(allProducts, 'all', 'lotus', '');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('lot-1');
    });

    it('kateqoriya + brend kombinasiyası düzgün işləyir', () => {
      const result = filterCatalogProducts(allProducts, 'hood', 'ardo', '');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('asp-1');
    });

    it('kateqoriya brend uyğunsuzluğunda nəticə boş qayıdır', () => {
      const result = filterCatalogProducts(allProducts, 'hood', 'lotus', '');
      expect(result.length).toBe(0);
    });
  });

  describe('axtarış məntiqi', () => {
    it('məhsul koduna görə axtarış işləyir', () => {
      const result = filterCatalogProducts(allProducts, 'all', 'all', 'A500');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('asp-1');
    });

    it('məhsul adına görə axtarış işləyir', () => {
      const result = filterCatalogProducts(allProducts, 'all', 'all', 'Kondisioner');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('kon-1');
    });

    it('axtarış böyük/kiçik hərfə həssas deyil (az lokal)', () => {
      const result = filterCatalogProducts(allProducts, 'all', 'all', 'ardo a500');
      expect(result.length).toBe(1);
    });

    it('spec dəyərlərinə görə axtarış işləyir', () => {
      const result = filterCatalogProducts(allProducts, 'all', 'all', '65 litr');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('spec-1');
    });

    it('highlights içinə görə axtarış işləyir', () => {
      const result = filterCatalogProducts(allProducts, 'all', 'all', 'enerji qənaəti');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('spec-1');
    });

    it('istehsal ölkəsinə görə axtarış işləyir', () => {
      const result = filterCatalogProducts(allProducts, 'all', 'all', 'türkiyə');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('spec-1');
    });

    it('kateqoriya adına görə axtarış işləyir', () => {
      const result = filterCatalogProducts(allProducts, 'all', 'all', 'Aspiratorlar');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('asp-1');
    });

    it('boş axtarış bütün published məhsulları qaytarır', () => {
      const result = filterCatalogProducts(allProducts, 'all', 'all', '   ');
      expect(result.length).toBe(4);
    });

    it('uyğunsuz axtarışda nəticə boş qayıdır', () => {
      const result = filterCatalogProducts(allProducts, 'all', 'all', 'xyznotexist999');
      expect(result.length).toBe(0);
    });

    it('axtarış + kateqoriya + brend üçlü filtri düzgün işləyir', () => {
      const result = filterCatalogProducts(allProducts, 'oven', 'ardo', 'türkiyə');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('spec-1');
    });

    it('highlights və ya specs undefined olduqda belə xətasız işləyir', () => {
      const brokenProduct = { ...aspirator, highlights: undefined as any, specs: undefined as any };
      expect(() => filterCatalogProducts([brokenProduct], 'all', 'all', 'ardo')).not.toThrow();
    });
  });
});
