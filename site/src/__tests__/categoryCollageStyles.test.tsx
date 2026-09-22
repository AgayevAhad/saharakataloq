// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { VisualCategoryCards } from '../components/VisualCategoryCards';
import { VisualCategoryCardsSkeleton } from '../components/Skeletons';
import { lightTheme, darkTheme } from '../types/theme';
import { CatalogCategory, Product } from '../types/product';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const mockCategories: CatalogCategory[] = [
  {
    id: 'refrigerator',
    name: 'Soyuducular',
    slug: 'refrigerators',
    active: true,
    icon: 'refrigerator',
  },
  { id: 'oven', name: 'Sobalar', slug: 'ovens', active: true, icon: 'soba' },
  { id: 'cooktop', name: 'Bişirmə Panelləri', slug: 'cooktops', active: true, icon: 'flame' },
  { id: 'hood', name: 'Aspiratorlar', slug: 'hoods', active: true, icon: 'wind' },
  { id: 'washer', name: 'Paltaryuyanlar', slug: 'washers', active: true, icon: 'washer' },
];

const mockProducts: Product[] = mockCategories.map((cat, idx) => ({
  id: `prod-${idx + 1}`,
  code: `CODE-${idx + 1}`,
  title: `${cat.name} Məhsulu`,
  category: cat.id,
  categoryName: cat.name,
  brandId: 'ardo',
  image: `/media/products/img${idx + 1}.jpg`,
  status: 'published' as const,
  specs: [],
  highlights: [],
  shortDesc: '',
}));

describe('Continuous Dual-Layer Category Carousel Suite', () => {
  it('1. Removes old subtitle and renders clear clean heading', () => {
    render(
      <VisualCategoryCards
        categories={mockCategories}
        products={mockProducts}
        theme={lightTheme}
        onSelectCategory={vi.fn()}
      />
    );

    expect(screen.getByText('Məhsul Kateqoriyaları')).toBeDefined();
    expect(screen.queryByText(/Ən çox seçim olan/i)).toBeNull();
  });

  it('2. Renders infinite marquee track with 2-card category units', () => {
    const { container } = render(
      <VisualCategoryCards
        categories={mockCategories}
        products={mockProducts}
        theme={lightTheme}
        onSelectCategory={vi.fn()}
      />
    );

    expect(container.querySelector('.category-master-marquee-container')).toBeTruthy();
    expect(container.querySelector('.category-master-marquee-track')).toBeTruthy();

    const categoryUnits = container.querySelectorAll('.category-unit-card');
    expect(categoryUnits.length).toBeGreaterThan(0);
  });

  it('3. Invokes onSelectCategory with exact category id when a category unit header or view all is clicked', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <VisualCategoryCards
        categories={mockCategories}
        products={mockProducts}
        theme={lightTheme}
        onSelectCategory={onSelect}
      />
    );

    const refBtn = container.querySelector('[data-category-id="refrigerator"]') as HTMLElement;
    expect(refBtn).toBeDefined();
    fireEvent.click(refBtn!);

    expect(onSelect).toHaveBeenCalledWith('refrigerator');
  });

  it('4. Invokes onSelectProduct when a product card inside the unit carousel is clicked', () => {
    const onSelectCategory = vi.fn();
    const onSelectProduct = vi.fn();
    const { container } = render(
      <VisualCategoryCards
        categories={mockCategories}
        products={mockProducts}
        theme={lightTheme}
        onSelectCategory={onSelectCategory}
        onSelectProduct={onSelectProduct}
      />
    );

    const prodCard = container.querySelector('.category-carousel-product-card') as HTMLElement;
    expect(prodCard).toBeDefined();
    fireEvent.click(prodCard!);

    expect(onSelectProduct).toHaveBeenCalled();
  });

  it('5. VisualCategoryCardsSkeleton matches header and maintains 1:1 skeleton placeholders', () => {
    const { container } = render(<VisualCategoryCardsSkeleton theme={darkTheme} />);
    expect(container.querySelector('.visual-categories-section')).toBeDefined();
    expect(container.querySelector('.visual-categories-header')).toBeDefined();
    expect(container.querySelectorAll('.visual-category-reveal')).toHaveLength(5);
  });
});
