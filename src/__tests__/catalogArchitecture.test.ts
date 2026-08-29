import { describe, expect, it } from 'vitest';
import { DEFAULT_CATALOG, normalizeCatalog } from '../data/catalog';

describe('Real kataloq arxitekturası', () => {
  it('məhsulları brend, yayım statusu və media siyahısı ilə normallaşdırır', () => {
    for (const product of DEFAULT_CATALOG.products) {
      expect(product.brandId).toBe('ardo');
      expect(product.status).toBe('published');
      expect(product.media?.length).toBeGreaterThan(0);
      expect(product.media?.[0].type).toBe('image');
    }
  });

  it('İtaliya brendi ilə istehsal ölkəsi iddiasını bir-birindən ayırır', () => {
    const content = JSON.stringify(DEFAULT_CATALOG);
    expect(content).toContain('İtalyan brendi');
    expect(content).not.toContain('Orijinal İtaliya istehsalı');
    expect(DEFAULT_CATALOG.brands[0].manufacturingCountries).toEqual(['Türkiyə', 'Çin']);
  });

  it('serverdən gələn əlavə brend və kateqoriyaları itirmir', () => {
    const catalog = normalizeCatalog({
      brands: [...DEFAULT_CATALOG.brands, { id: 'samsung', name: 'Samsung', slug: 'samsung', originCountry: 'Cənubi Koreya', manufacturingCountries: ['Vyetnam'], active: true }],
      categories: [...DEFAULT_CATALOG.categories, { id: 'washer', name: 'Paltaryuyanlar', slug: 'washer', active: true }],
      products: [],
    });
    expect(catalog.brands.some((brand) => brand.id === 'samsung')).toBe(true);
    expect(catalog.categories.some((category) => category.id === 'washer')).toBe(true);
  });
});
