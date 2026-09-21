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

describe('featured products responsive eight-row window', () => {
  it('renders exactly eight desktop rows and expands another eight in place', () => {
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
    expect(grid.dataset.visibleRows).toBe('8');
    expect(screen.getAllByTestId('featured-test-card')).toHaveLength(24);
    fireEvent.click(screen.getByTestId('featured-load-more'));
    expect(grid.dataset.visibleRows).toBe('16');
    expect(screen.getAllByTestId('featured-test-card')).toHaveLength(48);
  });

  it('keeps eight rows on mobile and never renders draft products', () => {
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
    expect(screen.getAllByTestId('featured-test-card')).toHaveLength(8);
    expect(screen.queryByText('P-0')).toBeNull();
    fireEvent.click(screen.getByTestId('featured-load-more'));
    expect(screen.getAllByTestId('featured-test-card')).toHaveLength(16);
  });

  it('resets to eight rows and changes product content when a category tab is selected', () => {
    const fridgeProducts = makeProducts(12).map((product, index) => ({
      ...product,
      id: `fridge-${index}`,
      code: `F-${index}`,
      category: 'fridge',
      categoryName: 'Soyuducu',
    }));
    const { container } = renderSection(
      [...makeProducts(70), ...fridgeProducts],
      [
        { id: 'washer', slug: 'washer', name: 'Paltaryuyan', active: true },
        { id: 'fridge', slug: 'fridge', name: 'Soyuducu', active: true },
      ]
    );
    const grid = container.querySelector('.featured-products-grid') as HTMLDivElement;
    fireEvent.click(screen.getByTestId('featured-load-more'));
    expect(grid.dataset.visibleRows).toBe('16');

    const fridgeTab = screen.getByRole('button', { name: 'Soyuducu' });
    fireEvent.click(fridgeTab);
    expect(fridgeTab.getAttribute('aria-pressed')).toBe('true');
    expect(grid.dataset.visibleRows).toBe('8');
    expect(screen.getAllByTestId('featured-test-card')).toHaveLength(12);
    expect(screen.getByText('F-0')).toBeDefined();
    expect(screen.queryByText('P-0')).toBeNull();
  });
});
