import { describe, expect, it } from 'vitest';
import { DEFAULT_BRANDS, DEFAULT_CATEGORIES, DEFAULT_CATALOG } from '../data/catalog';

describe('Public kataloq başlanğıc modeli', () => {
  it('fake məhsulları frontend fallback daxilində saxlamır', () => {
    expect(DEFAULT_CATALOG.products).toEqual([]);
  });

  it('təsdiqlənmiş kataloq kateqoriya adlarını saxlayır', () => {
    expect(DEFAULT_CATEGORIES.map((item) => item.name)).toEqual([
      'Aspiratorlar', 'Kondisionerlər', 'Mikrodalğalı sobalar',
      'Bişirmə panelləri', 'Sobalar', 'Soyuducular',
      'Fritözlər & Airfryer', 'Paltaryuyanlar', 'Termopotlar',
      'Tozsoranlar', 'Televizorlar', 'Ətçəkənlər', 'Ütülər',
    ]);
  });

  it('Lotus və ARDO brendlərini aktiv statusda saxlayır, Artel isə Tezliklə statusundadır', () => {
    expect(DEFAULT_BRANDS.find((item) => item.id === 'lotus')?.comingSoon).toBe(false);
    expect(DEFAULT_BRANDS.find((item) => item.id === 'artel')?.comingSoon).toBe(true);
    expect(DEFAULT_BRANDS.find((item) => item.id === 'ardo')?.comingSoon).toBe(false);
  });
});
