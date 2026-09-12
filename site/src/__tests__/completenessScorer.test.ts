import { describe, it, expect } from 'vitest';
import { calculateCompletenessScore } from '../utils/completenessScorer';

describe('PIM v2 Content Completeness Scorer', () => {
  it('calculates 100% for complete product', () => {
    const product = {
      id: 'p-1',
      brandId: 'ardo',
      code: 'M-100',
      title: 'ARDO Qaz Paneli',
      category: 'cooktop',
      image: '/media/ardo/m-100.jpg',
      shortDesc: 'İtalyan keyfiyyətli qaz paneli',
      specs: [
        { id: 's1', name: 'Gözlərin sayı', value: '4', group: 'Əsas' },
        { id: 's2', name: 'Səth', value: 'Şüşəkeramika', group: 'Əsas' },
      ],
      highlights: ['SABAF ocaqları', 'Qaz-kontrol'],
    };

    const result = calculateCompletenessScore(product);
    expect(result.score).toBe(100);
    expect(result.isPublishable).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  it('identifies missing fields on incomplete product', () => {
    const product = {
      id: 'p-2',
      title: 'Naməlum Məhsul',
    };

    const result = calculateCompletenessScore(product);
    expect(result.score).toBeLessThan(80);
    expect(result.isPublishable).toBe(false);
    expect(result.missingFields).toContain('Brend (Marka)');
    expect(result.missingFields).toContain('Model kodu');
    expect(result.missingFields).toContain('Ən azı 1 şəkil və ya video');
    expect(result.missingFields).toContain('Kateqoriya');
  });

  it('checks category-specific warranty only when specified', () => {
    const productWithoutWarranty = {
      id: 'p-3',
      brandId: 'lotus',
      code: 'LT-200',
      title: 'Lotus Blender',
      category: 'small_appliances',
      image: '/media/lotus/lt-200.jpg',
      shortDesc: 'Güclü motor',
      specs: [{ id: 's1', name: 'Güc', value: '1000 W', group: 'Əsas' }],
    };

    const defaultResult = calculateCompletenessScore(productWithoutWarranty);
    expect(defaultResult.missingFields).not.toContain('Zəmanət müddəti (ay)');

    const strictResult = calculateCompletenessScore(productWithoutWarranty, {
      isWarrantyRequired: true,
    });
    expect(strictResult.missingFields).toContain('Zəmanət müddəti (ay)');
  });
});
