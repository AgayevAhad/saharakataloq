import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrandDetailPage } from '../pages/BrandDetailPage';
import { lightTheme } from '../types/theme';
import type { Brand, CatalogCategory, Product } from '../types/product';

const mockBrand: Brand = {
  id: 'ardo',
  name: 'Ardo',
  slug: 'ardo',
  logo: '/media/ardo-logo.png',
  description: 'İtalyan keyfiyyətli məişət texnikası',
  originCountry: 'İtaliya',
  manufacturingCountries: ['İtaliya'],
  active: true,
  sortOrder: 1,
};

const mockCategories: CatalogCategory[] = [
  { id: 'soba', name: 'Quraşdırılan Sobalar', slug: 'soba', active: true, sortOrder: 1 },
  { id: 'panel', name: 'Bişirmə Panelləri', slug: 'panel', active: true, sortOrder: 2 },
  { id: 'aspirator', name: 'Aspiratorlar', slug: 'aspirator', active: true, sortOrder: 3 },
];

const mockProducts: Product[] = [
  { id: 'p1', code: 'SOBA-1', title: 'Soba 1 Model', category: 'soba', categoryName: 'Quraşdırılan Sobalar', brandId: 'ardo', price: 500, status: 'published', image: '', shortDesc: '', specs: [], highlights: [] },
  { id: 'p2', code: 'SOBA-2', title: 'Soba 2 Model', category: 'soba', categoryName: 'Quraşdırılan Sobalar', brandId: 'ardo', price: 600, status: 'published', image: '', shortDesc: '', specs: [], highlights: [] },
  { id: 'p3', code: 'PANEL-1', title: 'Panel 1 Model', category: 'panel', categoryName: 'Bişirmə Panelləri', brandId: 'ardo', price: 400, status: 'published', image: '', shortDesc: '', specs: [], highlights: [] },
  { id: 'p4', code: 'PANEL-2', title: 'Panel 2 Model', category: 'panel', categoryName: 'Bişirmə Panelləri', brandId: 'ardo', price: 450, status: 'published', image: '', shortDesc: '', specs: [], highlights: [] },
  { id: 'p5', code: 'ASP-1', title: 'Aspirator 1 Model', category: 'aspirator', categoryName: 'Aspiratorlar', brandId: 'ardo', price: 300, status: 'published', image: '', shortDesc: '', specs: [], highlights: [] },
];

describe('BrandDetailPage In-Place Category Filtering & Mixed Order', () => {
  it('renders "Hamısı" as the 1st pill with full count and active by default', () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <BrandDetailPage
        brand={mockBrand}
        products={mockProducts}
        categories={mockCategories}
        theme={lightTheme}
        onNavigate={onNavigate}
      />
    );

    const summary = container.querySelector('.brand-category-summary');
    expect(summary).toBeTruthy();
    const buttons = summary?.querySelectorAll('button');
    expect(buttons?.length).toBe(4); // Hamısı + 3 categories

    const hamisiBtn = buttons?.[0];
    expect(hamisiBtn?.textContent).toContain('Hamısı');
    expect(hamisiBtn?.textContent).toContain('5');
    // Active styling check
    expect(hamisiBtn?.style.backgroundColor).toMatch(/(#e31e24|rgb\(227, 30, 36\))/);
  });

  it('interleaves / mixes products across categories when "Hamısı" is selected', () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <BrandDetailPage
        brand={mockBrand}
        products={mockProducts}
        categories={mockCategories}
        theme={lightTheme}
        onNavigate={onNavigate}
      />
    );

    const productCards = container.querySelectorAll('.featured-product-reveal');
    expect(productCards.length).toBe(5);

    // Interleaved order: Soba 1 (p1), Panel 1 (p3), Aspirator 1 (p5), Soba 2 (p2), Panel 2 (p4)
    const productIds = Array.from(productCards).map(
      (card) =>
        card.querySelector('[data-featured-product-card-id]')?.getAttribute('data-featured-product-card-id') ||
        card.getAttribute('data-featured-product-card-id') ||
        ''
    );
    expect(productIds).toEqual(['p1', 'p3', 'p5', 'p2', 'p4']);
  });

  it('filters products in-place upon clicking a category without navigating away', () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <BrandDetailPage
        brand={mockBrand}
        products={mockProducts}
        categories={mockCategories}
        theme={lightTheme}
        onNavigate={onNavigate}
      />
    );

    const summary = container.querySelector('.brand-category-summary');
    const buttons = Array.from(summary?.querySelectorAll('button') || []);
    const panelBtn = buttons.find((b) => b.textContent?.includes('Bişirmə Panelləri'));
    expect(panelBtn).toBeTruthy();

    fireEvent.click(panelBtn!);

    // Should NOT navigate away to catalog
    expect(onNavigate).not.toHaveBeenCalled();

    // Active pill should now be Bişirmə Panelləri
    expect(panelBtn!.style.backgroundColor).toMatch(/(#e31e24|rgb\(227, 30, 36\))/);

    // Rendered products should now only be the 2 panels (p3, p4)
    const productCards = container.querySelectorAll('.featured-product-reveal');
    expect(productCards.length).toBe(2);

    const productIds = Array.from(productCards).map(
      (card) =>
        card.querySelector('[data-featured-product-card-id]')?.getAttribute('data-featured-product-card-id') ||
        card.getAttribute('data-featured-product-card-id') ||
        ''
    );
    expect(productIds).toEqual(['p3', 'p4']);

    // Clicking "Hamısı" restores all 5 products in mixed order
    const hamisiBtn = buttons.find((b) => b.textContent?.includes('Hamısı'));
    fireEvent.click(hamisiBtn!);
    const restoredCards = container.querySelectorAll('.featured-product-reveal');
    expect(restoredCards.length).toBe(5);
  });

  it('renders "Kataloqa keçid et" button and triggers navigation to catalog', () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <BrandDetailPage
        brand={mockBrand}
        products={mockProducts}
        categories={mockCategories}
        theme={lightTheme}
        onNavigate={onNavigate}
      />
    );

    const buttons = Array.from(container.querySelectorAll('button'));
    const catalogNavBtn = buttons.find((b) => b.textContent?.includes('Kataloqa keçid et'));
    expect(catalogNavBtn).toBeTruthy();

    fireEvent.click(catalogNavBtn!);
    expect(onNavigate).toHaveBeenCalledWith('catalog', 'ardo');
  });

  it('shows 12 products (4 rows) initially and loads next 12 on "Daha çox göstər" click', () => {
    const onNavigate = vi.fn();
    // Create 16 mock products (more than 12/4 rows)
    const manyProducts: Product[] = Array.from({ length: 16 }, (_, i) => ({
      id: `p-${i + 1}`,
      code: `CODE-${i + 1}`,
      title: `Product ${i + 1}`,
      category: 'soba',
      categoryName: 'Quraşdırılan Sobalar',
      brandId: 'ardo',
      price: 500 + i * 10,
      status: 'published',
      image: '',
      shortDesc: '',
      specs: [],
      highlights: [],
    }));

    const { container } = render(
      <BrandDetailPage
        brand={mockBrand}
        products={manyProducts}
        categories={mockCategories}
        theme={lightTheme}
        onNavigate={onNavigate}
      />
    );

    // Initial batch must be 12 (4 rows x 3 columns)
    const initialCards = container.querySelectorAll('.featured-product-reveal');
    expect(initialCards.length).toBe(12);

    // "Daha çox göstər" button must be visible
    const buttons = Array.from(container.querySelectorAll('button'));
    const loadMoreBtn = buttons.find((b) => b.textContent?.includes('Daha çox göstər'));
    expect(loadMoreBtn).toBeTruthy();

    // Click load more -> next 4 rows (+12), showing all 16
    fireEvent.click(loadMoreBtn!);
    const updatedCards = container.querySelectorAll('.featured-product-reveal');
    expect(updatedCards.length).toBe(16);

    // Load more button should now disappear since all 16 are visible
    const buttonsAfter = Array.from(container.querySelectorAll('button'));
    const loadMoreBtnAfter = buttonsAfter.find((b) => b.textContent?.includes('Daha çox göstər'));
    expect(loadMoreBtnAfter).toBeFalsy();
  });
});
