import { describe, expect, it } from 'vitest';
import { DEFAULT_BRANDS, DEFAULT_CATEGORIES, DEFAULT_CATALOG } from '../data/catalog';

describe('Public kataloq başlanğıc modeli', () => {
  it('fake məhsulları frontend fallback daxilində saxlamır', () => {
    expect(DEFAULT_CATALOG.products).toEqual([]);
  });

  it('yalnız təsdiqlənmiş kateqoriya adlarını saxlayır', () => {
    expect(DEFAULT_CATEGORIES.map((item) => item.name)).toEqual([
      'Aspiratorlar', 'Kondisionerlər', 'Mikrodalğalı sobalar',
      'Bişirmə panelləri', 'Sobalar', 'Soyuducular',
    ]);
  });

  it('Lotus və Artel brendlərini Tezliklə statusunda saxlayır', () => {
    expect(DEFAULT_BRANDS.find((item) => item.id === 'lotus')?.comingSoon).toBe(true);
    expect(DEFAULT_BRANDS.find((item) => item.id === 'artel')?.comingSoon).toBe(true);
    expect(DEFAULT_BRANDS.find((item) => item.id === 'ardo')?.comingSoon).toBe(false);
  });
});
