import { describe, expect, it } from 'vitest';
import { readCatalogUrlState, writeCatalogUrlState } from '../features/catalog/catalogUrlState';

describe('catalog URL state', () => {
  it('restores brand, category, filters, sorting, comparison and view state', () => {
    const state = readCatalogUrlState(
      '?mode=catalog&brand=ardo,lotus&category=hobs&q=black&min=100&max=900&discount=1&video=1&energy=A%2B&motor=inverter&color=black&sort=price-desc&compare=p1,p2&view=favorites'
    );

    expect(state).toEqual({
      brands: ['ardo', 'lotus'],
      category: 'hobs',
      query: 'black',
      minPrice: 100,
      maxPrice: 900,
      onlyDiscounted: true,
      onlyWithVideo: true,
      energyClass: 'A+',
      motorType: 'inverter',
      color: 'black',
      sortBy: 'price-desc',
      comparisonIds: ['p1', 'p2'],
      view: 'favorites',
    });
  });

  it('writes catalog state while preserving mode, product and unrelated parameters', () => {
    const url = writeCatalogUrlState(
      new URL('https://example.test/?mode=catalog&product=p9&campaign=fall'),
      {
        brands: ['ardo'],
        category: 'hobs',
        query: '',
        minPrice: null,
        maxPrice: null,
        onlyDiscounted: false,
        onlyWithVideo: false,
        energyClass: 'all',
        motorType: 'all',
        color: 'all',
        sortBy: 'newest',
        comparisonIds: [],
        view: 'catalog',
      }
    );

    expect(url.searchParams.get('mode')).toBe('catalog');
    expect(url.searchParams.get('product')).toBe('p9');
    expect(url.searchParams.get('campaign')).toBe('fall');
    expect(url.searchParams.get('brand')).toBe('ardo');
    expect(url.searchParams.get('category')).toBe('hobs');
    expect(url.searchParams.get('sort')).toBe('newest');
    expect(url.searchParams.has('q')).toBe(false);
    expect(url.searchParams.has('view')).toBe(false);
  });

  it('falls back safely for invalid numbers, sorting and view values', () => {
    const state = readCatalogUrlState('?min=-5&max=nope&sort=broken&view=unknown');

    expect(state.minPrice).toBeNull();
    expect(state.maxPrice).toBeNull();
    expect(state.sortBy).toBe('all');
    expect(state.view).toBe('catalog');
  });
});
