import { describe, expect, it } from 'vitest';
import { Product } from '../types/product';
import {
  CatalogSelection,
  filterCatalogPageProducts,
  sortCatalogPageProducts,
} from '../features/catalog/catalogSelection';

const product = (id: string, extra: Partial<Product> = {}): Product => ({
  id,
  code: id,
  title: id,
  category: 'oven',
  categoryName: 'Soba',
  brandId: 'ardo',
  image: '',
  shortDesc: '',
  status: 'published',
  specs: [],
  highlights: [],
  ...extra,
});
const base: CatalogSelection = {
  query: '',
  category: 'all',
  brands: [],
  minPrice: 0,
  maxPrice: 5000,
  priceActive: false,
  onlyDiscounted: false,
  onlyWithVideo: false,
  energyClass: 'all',
  motorType: 'all',
  color: 'all',
};

describe('catalog page selection on the current product schema', () => {
  const oven = product('ARDO-SOBA', {
    price: 1000,
    oldPrice: 1200,
    createdAt: '2026-09-10T00:00:00Z',
    specs: [
      { id: 'energy', name: 'Enerji sinfi', value: 'A++' },
      { id: 'motor', name: 'Mühərrik növü', value: 'İnverter' },
      { id: 'color', name: 'Rəng', value: 'Qara' },
    ],
    media: [{ id: 'video', type: 'video', url: '/media/real.webm' }],
  });
  const washer = product('ARTEL-WASHER', {
    brandId: 'artel',
    category: 'washer',
    price: 700,
    createdAt: '2026-09-18T00:00:00Z',
    specs: [{ id: 'energy2', name: 'Enerji sinfi', value: 'A+' }],
  });
  const unknownPrice = product('NO-PRICE', { price: undefined });

  it('finds media[] videos and real specs without relying on obsolete aliases', () => {
    const products = [oven, washer, unknownPrice];
    expect(
      filterCatalogPageProducts(products, { ...base, onlyWithVideo: true }).map((p) => p.id)
    ).toEqual(['ARDO-SOBA']);
    expect(
      filterCatalogPageProducts(products, { ...base, energyClass: 'A+' }).map((p) => p.id)
    ).toEqual(['ARTEL-WASHER']);
    expect(
      filterCatalogPageProducts(products, { ...base, motorType: 'İnverter', color: 'Qara' }).map(
        (p) => p.id
      )
    ).toEqual(['ARDO-SOBA']);
  });

  it('removes no-price products only when price filtering is active and restores them on reset', () => {
    const products = [oven, washer, unknownPrice];
    expect(
      filterCatalogPageProducts(products, { ...base, minPrice: 800, priceActive: true }).map(
        (p) => p.id
      )
    ).toEqual(['ARDO-SOBA']);
    expect(filterCatalogPageProducts(products, base)).toHaveLength(3);
  });

  it('sorts by real timestamp and keeps unknown prices last', () => {
    const products = [oven, washer, unknownPrice];
    expect(
      sortCatalogPageProducts(products, 'newest')
        .slice(0, 2)
        .map((p) => p.id)
    ).toEqual(['ARTEL-WASHER', 'ARDO-SOBA']);
    expect(sortCatalogPageProducts(products, 'price-asc').map((p) => p.id)).toEqual([
      'ARTEL-WASHER',
      'ARDO-SOBA',
      'NO-PRICE',
    ]);
    expect(sortCatalogPageProducts(products, 'price-desc').map((p) => p.id)).toEqual([
      'ARDO-SOBA',
      'ARTEL-WASHER',
      'NO-PRICE',
    ]);
  });
});
