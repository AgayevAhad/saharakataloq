// @vitest-environment happy-dom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeaturedProductsSection } from '../features/home/FeaturedProductsSection';
import { CatalogCategory, Product } from '../types/product';
import { lightTheme } from '../types/theme';

vi.mock('../components/FeaturedProductCard', () => ({
  FeaturedProductCard: ({ product }: { product: Product }) => (
    <article className="featured-product-card" data-testid="featured-test-card">
      {product.code}
    </article>
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const makeProducts = (count: number): Product[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `product-${index}`,
    code: `P-${index}`,
    title: `Məhsul ${index}`,
    brandId: index % 2 === 0 ? 'ardo' : 'artel',
    category: 'washer',
    categoryName: 'Paltaryuyan',
    image: `/media/products/${index}.jpg`,
    shortDesc: '',
    specs: [],
    highlights: [],
    status: 'published',
  }));

const renderSection = (
  products: Product[],
  categories: CatalogCategory[] = [
    { id: 'washer', slug: 'washer', name: 'Paltaryuyan', active: true },
  ]
) =>
  render(
    <FeaturedProductsSection
      brands={[]}
      categories={categories}
      products={products}
      theme={lightTheme}
      onNavigateCatalog={vi.fn()}
      onSelectProduct={vi.fn()}
      onWhatsApp={vi.fn()}
      onCall={vi.fn()}
    />
  );

describe('featured products responsive four-row window', () => {
  it('renders exactly four desktop rows and expands another four in place', () => {
    let resize: (() => void) | undefined;
    class ResizeObserverStub {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    const { container } = renderSection(makeProducts(70));
    const grid = container.querySelector('.featured-products-grid') as HTMLDivElement;
    Object.defineProperty(grid, 'clientWidth', { configurable: true, value: 1334 });
    act(() => resize?.());

    expect(grid.dataset.columnCount).toBe('3');
    expect(grid.dataset.visibleRows).toBe('4');
    expect(screen.getAllByTestId('featured-test-card')).toHaveLength(12);
    fireEvent.click(screen.getByTestId('featured-load-more'));
    expect(grid.dataset.visibleRows).toBe('8');
    expect(screen.getAllByTestId('featured-test-card')).toHaveLength(24);
  });

  it('keeps four rows on mobile and never renders draft products', () => {
    let resize: (() => void) | undefined;
    class ResizeObserverStub {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    const products = makeProducts(25);
    products[0].status = 'draft';
    const { container } = renderSection(products);
    const grid = container.querySelector('.featured-products-grid') as HTMLDivElement;
    Object.defineProperty(grid, 'clientWidth', { configurable: true, value: 390 });
    act(() => resize?.());

    expect(grid.dataset.columnCount).toBe('1');
    expect(screen.getAllByTestId('featured-test-card')).toHaveLength(4);
    expect(screen.queryByText('P-0')).toBeNull();
    fireEvent.click(screen.getByTestId('featured-load-more'));
    expect(screen.getAllByTestId('featured-test-card')).toHaveLength(8);
  });

  it('resets to four rows and changes product content when a curated tab is selected', () => {
    const products = makeProducts(30);
    products[0].isBestSeller = true;
    products[0].title = 'Bestseller Item 1';
    products[0].code = 'BS-1';

    const { container } = renderSection(products);
    const grid = container.querySelector('.featured-products-grid') as HTMLDivElement;
    fireEvent.click(screen.getByTestId('featured-load-more'));
    expect(grid.dataset.visibleRows).toBe('8');

    const bestsellerTab = screen.getByRole('tab', { name: /Çox satılan məhsullar/i });
    fireEvent.click(bestsellerTab);
    expect(bestsellerTab.getAttribute('aria-selected')).toBe('true');
    const updatedGrid = container.querySelector('.featured-products-grid') as HTMLDivElement;
    expect(updatedGrid.dataset.visibleRows).toBe('4');
    expect(screen.getByText('BS-1')).toBeDefined();
  });
});
