import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VisualCategoryCards } from '../components/VisualCategoryCards';
import { ThematicShowcase } from '../components/ThematicShowcase';
import { TrustHighlights } from '../components/TrustHighlights';
import { CatalogCategory, Product } from '../types/product';
import { lightTheme } from '../types/theme';

const mockCategories: CatalogCategory[] = [
  {
    id: 'cat-ovens',
    name: 'Quraşdırılan Sobalar',
    slug: 'qurasdirilan-sobalar',
    icon: 'flame',
    active: true,
  },
  {
    id: 'cat-hobs',
    name: 'Bişirmə Panelləri',
    slug: 'bisirme-panelleri',
    icon: 'flame',
    active: true,
  },
  {
    id: 'cat-empty',
    name: 'Boş Kateqoriya 0 Model',
    slug: 'bos-kateqoriya',
    icon: 'box',
    active: true,
  },
];

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    code: 'ARDO 201GC',
    title: 'ARDO 201GC Soba',
    category: 'cat-ovens',
    categoryName: 'Quraşdırılan Sobalar',
    image: '/media/ardo-oven.png',
    shortDesc: 'Quraşdırılan soba',
    specs: [],
    highlights: ['SABAF', 'A+ Enerji'],
    status: 'published',
  },
  {
    id: 'prod-2',
    code: 'LOTUS 100',
    title: 'Lotus Qaz Paneli',
    category: 'cat-hobs',
    categoryName: 'Bişirmə Panelləri',
    image: '',
    gallery: ['/media/lotus-hob.png'],
    shortDesc: 'Bişirmə paneli',
    specs: [],
    highlights: ['Qaz nəzarəti'],
    status: 'published',
  },
  {
    id: 'prod-3',
    code: 'DRAFT 001',
    title: 'Draft Model',
    category: 'cat-empty',
    categoryName: 'Boş Kateqoriya 0 Model',
    image: '',
    shortDesc: 'Draft məhsul',
    specs: [],
    highlights: [],
    status: 'draft', // Not published
  },
];

describe('VisualCategoryCards', () => {
  it('strictly hides categories that have 0 published models (AC-2)', () => {
    const onSelect = vi.fn();
    render(
      <VisualCategoryCards
        categories={mockCategories}
        products={mockProducts}
        theme={lightTheme}
        onSelectCategory={onSelect}
      />
    );

    // Quraşdırılan Sobalar (1 model) and Bişirmə Panelləri (1 model) must be visible
    expect(screen.getAllByText('Quraşdırılan Sobalar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bişirmə Panelləri').length).toBeGreaterThan(0);

    // Boş Kateqoriya 0 Model must be hidden
    expect(screen.queryByText('Boş Kateqoriya 0 Model')).toBeNull();
  });

  it('triggers onSelectCategory callback on click', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <VisualCategoryCards
        categories={mockCategories}
        products={mockProducts}
        theme={lightTheme}
        onSelectCategory={onSelect}
      />
    );

    const ovenButton = container.querySelector('.visual-category-card') as HTMLButtonElement;
    expect(ovenButton).not.toBeNull();
    fireEvent.click(ovenButton);
    expect(onSelect).toHaveBeenCalledWith('cat-ovens');
  });

  it('returns null if all categories have 0 models', () => {
    const { container } = render(
      <VisualCategoryCards
        categories={[{ id: 'empty', name: 'Empty', slug: 'empty', active: true }]}
        products={[]}
        theme={lightTheme}
        onSelectCategory={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('ThematicShowcase Fail-Closed Behavior', () => {
  it('returns null when no valid thematic items exist (AC-3)', () => {
    const { container } = render(
      <ThematicShowcase
        items={[]}
        categories={mockCategories}
        theme={lightTheme}
        onNavigateCategory={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders verified items when properly configured with real category and image', () => {
    const onNav = vi.fn();
    render(
      <ThematicShowcase
        items={[
          {
            id: 't1',
            title: 'Mətbəx Həlləri',
            description: 'Müasir texnika',
            categoryId: 'cat-ovens',
            imageUrl: '/media/kitchen.jpg',
            active: true,
          },
        ]}
        categories={mockCategories}
        theme={lightTheme}
        onNavigateCategory={onNav}
      />
    );

    expect(screen.getByText('Mətbəx Həlləri')).toBeDefined();
    expect(screen.getByText('Müasir texnika')).toBeDefined();
  });
});

describe('TrustHighlights Fail-Closed Behavior', () => {
  it('returns null when no items are provided (AC-3 & Rule 6)', () => {
    const { container } = render(<TrustHighlights items={[]} theme={lightTheme} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders verified trust items when provided from DB/admin', () => {
    render(
      <TrustHighlights
        items={[
          {
            id: 'tr-1',
            title: 'Dəqiq Parametrlər',
            description: 'İstehsalçı təlimatına uyğun',
            icon: 'shield',
            active: true,
          },
        ]}
        theme={lightTheme}
      />
    );

    expect(screen.getByText('Dəqiq Parametrlər')).toBeDefined();
    expect(screen.getByText('İstehsalçı təlimatına uyğun')).toBeDefined();
  });
});
