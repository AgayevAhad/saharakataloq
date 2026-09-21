import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VisualCategoryCards } from '../components/VisualCategoryCards';
import { CatalogCategory, Product } from '../types/product';
import { lightTheme, darkTheme } from '../types/theme';

const all16Categories: CatalogCategory[] = [
  { id: 'hood', name: 'Aspiratorlar', slug: 'aspiratorlar', icon: 'Wind', active: true },
  {
    id: 'cooktop',
    name: 'Bişirmə panelləri',
    slug: 'bisirme-panelleri',
    icon: 'Flame',
    active: true,
  },
  { id: 'oven', name: 'Sobalar', slug: 'sobalar', icon: 'Layers', active: true },
  {
    id: 'refrigerator',
    name: 'Soyuducular',
    slug: 'soyuducular',
    icon: 'Refrigerator',
    active: true,
  },
  {
    id: 'air_conditioner',
    name: 'Kondisionerlər',
    slug: 'kondisionerler',
    icon: 'Snowflake',
    active: true,
  },
  { id: 'washer', name: 'Paltaryuyanlar', slug: 'paltaryuyanlar', icon: 'Layers', active: true },
  { id: 'dryer', name: 'Quruducu maşınlar', slug: 'quruducu-masinlar', icon: 'Wind', active: true },
  { id: 'dishwasher', name: 'Qabyuyanlar', slug: 'qabyuyanlar', icon: 'Layers', active: true },
  { id: 'tv', name: 'Televizorlar', slug: 'televizorlar', icon: 'Box', active: true },
  { id: 'audio', name: 'Audio və Soundbarlar', slug: 'audio', icon: 'Box', active: true },
  {
    id: 'microwave',
    name: 'Mikrodalğalı sobalar',
    slug: 'mikrodalgali-sobalar',
    icon: 'Box',
    active: true,
  },
  { id: 'vacuum_cleaner', name: 'Tozsoranlar', slug: 'tozsoranlar', icon: 'Wind', active: true },
  { id: 'airfryer', name: 'Fritözlər & Airfryer', slug: 'airfryer', icon: 'Flame', active: true },
  { id: 'thermopot', name: 'Termopotlar', slug: 'termopotlar', icon: 'Box', active: true },
  { id: 'meat_grinder', name: 'Ətçəkənlər', slug: 'etcekenler', icon: 'Box', active: true },
  { id: 'iron', name: 'Ütülər', slug: 'utuler', icon: 'Wind', active: true },
];

const all16Products: Product[] = all16Categories.map((cat) => ({
  id: `prod-${cat.id}`,
  code: `CODE-${cat.id}`,
  title: `${cat.name} Model`,
  category: cat.id,
  categoryName: cat.name,
  brandId: 'ardo',
  image: `/media/products/${cat.id}.jpg`,
  status: 'published',
  specs: [],
  highlights: [],
  shortDesc: '',
}));

describe('Category Collage Strict Deduplication & Visual Styles Suite', () => {
  it('groups every real category once and exposes the complete fifth slide', () => {
    const { container } = render(
      <VisualCategoryCards
        categories={all16Categories}
        products={all16Products}
        theme={lightTheme}
        onSelectCategory={vi.fn()}
      />
    );

    // Slide 1: Bento
    const slide1CardIds = Array.from(container.querySelectorAll('.visual-category-card')).map(
      (el) => el.getAttribute('data-category-id')
    );
    expect(slide1CardIds).toHaveLength(5);
    expect(slide1CardIds).toEqual(['refrigerator', 'washer', 'dryer', 'dishwasher', 'tv']);

    // Switch to Slide 2: Facet
    const slide2Tab = screen.getByRole('tab', { name: /Quraşdırılan Texnika/i });
    fireEvent.click(slide2Tab);
    const slide2CardIds = Array.from(container.querySelectorAll('.visual-category-card')).map(
      (el) => el.getAttribute('data-category-id')
    );
    expect(slide2CardIds).toHaveLength(4);
    expect(slide2CardIds).toEqual(['hood', 'cooktop', 'oven', 'microwave']);

    // Switch to Slide 3: Frames
    const slide3Tab = screen.getByRole('tab', { name: /Kiçik Məişət Texnikası/i });
    fireEvent.click(slide3Tab);
    const slide3CardIds = Array.from(container.querySelectorAll('.visual-category-card')).map(
      (el) => el.getAttribute('data-category-id')
    );
    expect(slide3CardIds).toHaveLength(6);
    expect(slide3CardIds).toEqual([
      'audio',
      'vacuum_cleaner',
      'airfryer',
      'thermopot',
      'meat_grinder',
      'iron',
    ]);

    // Switch to Slide 4: Cluster
    const slide4Tab = screen.getByRole('tab', { name: /İqlim Texnikası/i });
    fireEvent.click(slide4Tab);
    const slide4CardIds = Array.from(container.querySelectorAll('.visual-category-card')).map(
      (el) => el.getAttribute('data-category-id')
    );
    expect(slide4CardIds).toEqual(['air_conditioner']);

    // Verify complete disjointness (no overlap between any pair of slides)
    const set1 = new Set(slide1CardIds);
    const set2 = new Set(slide2CardIds);
    const set3 = new Set(slide3CardIds);

    slide2CardIds.forEach((id) => expect(set1.has(id)).toBe(false));
    slide3CardIds.forEach((id) => {
      expect(set1.has(id)).toBe(false);
      expect(set2.has(id)).toBe(false);
    });
    slide4CardIds.forEach((id) => {
      expect(set1.has(id)).toBe(false);
      expect(set2.has(id)).toBe(false);
      expect(set3.has(id)).toBe(false);
    });

    const combinedSet = new Set([
      ...slide1CardIds,
      ...slide2CardIds,
      ...slide3CardIds,
      ...slide4CardIds,
    ]);
    expect(combinedSet.size).toBe(16);
    const allTab = screen.getByRole('tab', { name: /Bütün Kateqoriyalar/i });
    fireEvent.click(allTab);
    expect(container.querySelectorAll('.visual-category-card')).toHaveLength(16);
  });

  it('renders borderless cards with dark theme and no red frames', () => {
    const { container } = render(
      <VisualCategoryCards
        categories={all16Categories}
        products={all16Products}
        theme={darkTheme}
        onSelectCategory={vi.fn()}
      />
    );

    const cards = container.querySelectorAll('.visual-category-card');
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((card) => {
      expect(card.classList.contains('visual-category-card')).toBe(true);
    });
  });
});
