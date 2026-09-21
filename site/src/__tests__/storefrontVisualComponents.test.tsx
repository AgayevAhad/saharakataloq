import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VisualCategoryCards } from '../components/VisualCategoryCards';
import { VisualCategoryCardsSkeleton } from '../components/Skeletons';
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
  it('keeps five bento skeleton shells with the same media and metadata anatomy', () => {
    const { container } = render(<VisualCategoryCardsSkeleton theme={lightTheme} />);
    expect(container.querySelectorAll('.visual-category-reveal')).toHaveLength(5);
    expect(container.querySelectorAll('.visual-category-img-box')).toHaveLength(5);
    expect(container.querySelectorAll('.visual-category-meta')).toHaveLength(5);
  });

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
    expect(screen.queryByText(/Ən çox seçim olan/i)).toBeNull(); // Subtitle removed
    expect(screen.getByText('Böyük Məişət Texnikası')).toBeDefined();
    // Two published categories fit on one slide; do not fabricate duplicate slides.
    expect(screen.queryByText(/Quraşdırılan Texnika/i)).toBeNull();
    expect(screen.queryByText(/Kiçik Məişət Texnikası/i)).toBeNull();
    expect(screen.queryByText(/İqlim Texnikası/i)).toBeNull();
    expect(screen.getByText(/Sürüşdürərək digər kateqoriyalara baxın/i)).toBeDefined();

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

  it('keeps the admin-selected cover and falls back to media of the same product on load error', () => {
    const products: Product[] = [
      {
        ...mockProducts[0],
        image: '/uploads/admin-selected-cover.jpg',
        gallery: ['/media/products/ardo-201gc.jpg'],
      },
    ];
    const { container } = render(
      <VisualCategoryCards
        categories={[mockCategories[0]]}
        products={products}
        theme={lightTheme}
        onSelectCategory={vi.fn()}
      />
    );

    const cover = container.querySelector('.visual-category-img-inner img') as HTMLImageElement;
    expect(cover.getAttribute('src')).toBe('/uploads/admin-selected-cover.jpg');
    fireEvent.error(cover);
    expect(cover.getAttribute('src')).toBe('/media/products/ardo-201gc.jpg');
  });

  it('builds a category collage from distinct product covers, preserving the admin-selected first image', () => {
    const products: Product[] = Array.from({ length: 4 }, (_, index) => ({
      ...mockProducts[0],
      id: `oven-${index}`,
      image: index === 0 ? '/uploads/admin-oven-cover.jpg' : `/media/products/oven-${index}.jpg`,
    }));
    const { container } = render(
      <VisualCategoryCards
        categories={[mockCategories[0]]}
        products={products}
        theme={lightTheme}
        onSelectCategory={vi.fn()}
      />
    );
    const sources = Array.from(container.querySelectorAll('.category-cover-collage img')).map(
      (image) => image.getAttribute('src')
    );
    expect(sources).toHaveLength(4);
    expect(sources[0]).toBe('/uploads/admin-oven-cover.jpg');
    expect(new Set(sources).size).toBe(4);
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
