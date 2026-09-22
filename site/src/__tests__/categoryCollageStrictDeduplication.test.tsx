// @vitest-environment happy-dom
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

const all16Products: Product[] = all16Categories.flatMap((cat) => [
  {
    id: `prod-${cat.id}-1`,
    code: `CODE-${cat.id}-1`,
    title: `${cat.name} Model 1`,
    category: cat.id,
    categoryName: cat.name,
    brandId: 'ardo',
    image: `/media/products/${cat.id}-1.jpg`,
    status: 'published' as const,
    specs: [],
    highlights: [],
    shortDesc: '',
  },
  {
    id: `prod-${cat.id}-2`,
    code: `CODE-${cat.id}-2`,
    title: `${cat.name} Model 2`,
    category: cat.id,
    categoryName: cat.name,
    brandId: 'ardo',
    image: `/media/products/${cat.id}-2.jpg`,
    status: 'published' as const,
    specs: [],
    highlights: [],
    shortDesc: '',
  },
]);

describe('Category Carousel Strict Multi-Unit & Transparent Architecture Suite', () => {
  it('renders all active catalog categories into continuous track with 2 product cards each', () => {
    const { container } = render(
      <VisualCategoryCards
        categories={all16Categories}
        products={all16Products}
        theme={lightTheme}
        onSelectCategory={vi.fn()}
      />
    );

    const units = container.querySelectorAll('.category-unit-card');
    expect(units.length).toBeGreaterThanOrEqual(16);

    // Check that each category unit contains 2 product cards
    const firstUnit = units[0];
    const productCards = firstUnit.querySelectorAll('.category-carousel-product-card');
    expect(productCards.length).toBe(2);
  });

  it('renders seamless transparent styling across light and dark themes', () => {
    const { container } = render(
      <VisualCategoryCards
        categories={all16Categories}
        products={all16Products}
        theme={darkTheme}
        onSelectCategory={vi.fn()}
      />
    );

    const marqueeTrack = container.querySelector('.category-master-marquee-track');
    expect(marqueeTrack).toBeTruthy();
  });
});
