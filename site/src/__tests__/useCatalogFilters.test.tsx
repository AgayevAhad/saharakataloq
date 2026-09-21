import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCatalogFilters } from '../features/catalog/useCatalogFilters';
import type { Product } from '../types/product';

const product = (id: string, price?: number): Product => ({
  id,
  code: id,
  title: id,
  category: 'washer',
  categoryName: 'Paltaryuyan',
  brandId: 'ardo',
  image: '',
  shortDesc: '',
  specs: [],
  highlights: [],
  price,
  status: 'published',
});

const categories = [{ id: 'washer', name: 'Paltaryuyan', slug: 'washer', active: true }];
const brands = [
  {
    id: 'ardo',
    name: 'ARDO',
    slug: 'ardo',
    active: true,
    originCountry: '',
    manufacturingCountries: [],
  },
];

describe('catalog filter controller extraction', () => {
  it('keeps late-arriving expensive and unpriced products when price is untouched', () => {
    const { result, rerender } = renderHook(
      ({ products }) => useCatalogFilters({ products, categories, brands }),
      { initialProps: { products: [] as Product[] } }
    );
    expect(result.current.sortedProducts).toHaveLength(0);
    rerender({
      products: [product('cheap', 500), product('expensive', 9000), product('unpriced')],
    });
    expect(result.current.sortedProducts.map((item) => item.id)).toEqual([
      'cheap',
      'expensive',
      'unpriced',
    ]);
    expect(result.current.maxAvailablePrice).toBe(9000);
  });

  it('counts active filters and resets all selections without changing the source catalog', () => {
    const input = [product('first', 500), product('second', 900)];
    const { result } = renderHook(() => useCatalogFilters({ products: input, categories, brands }));
    act(() => {
      result.current.toggleBrand('ardo');
      result.current.setSelectedCategory('washer');
      result.current.setMaxPrice(600);
    });
    expect(result.current.activeFiltersCount).toBe(3);
    expect(result.current.sortedProducts.map((item) => item.id)).toEqual(['first']);
    act(() => result.current.resetFilters());
    expect(result.current.activeFiltersCount).toBe(0);
    expect(result.current.sortedProducts).toHaveLength(2);
    expect(input).toHaveLength(2);
  });
});
