import { describe, expect, it } from 'vitest';
import { Product } from '../types/product';
import { verifiedManufacturingCountry } from '../utils/manufacturingCountry';

const product = (specs: Product['specs']): Product => ({
  id: 'model-1',
  code: 'MODEL-1',
  title: 'Real product',
  category: 'oven',
  categoryName: 'Soba',
  image: '',
  shortDesc: '',
  highlights: [],
  manufacturingCountry: 'İtaliya',
  specs,
});

describe('public manufacturing country evidence', () => {
  it('uses the model-specific spec instead of a conflicting brand-origin fallback', () => {
    expect(
      verifiedManufacturingCountry(
        product([{ id: 'country', name: 'İstehsalçı ölkə', value: 'Çin' }])
      )
    ).toBe('Çin');
  });

  it('does not claim an unverified or conflicting country', () => {
    expect(verifiedManufacturingCountry(product([]))).toBe('');
    expect(
      verifiedManufacturingCountry(
        product([
          { id: 'a', name: 'İstehsalçı ölkə', value: 'Çin' },
          { id: 'b', name: 'İstehsal ölkəsi', value: 'Türkiyə' },
        ])
      )
    ).toBe('');
  });
});
