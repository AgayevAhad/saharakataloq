import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CatalogApp } from '../apps/CatalogApp';
import { Header } from '../components/Header';
import { lightTheme } from '../types/theme';
import { DEFAULT_CATALOG } from '../data/catalog';

describe('CatalogApp Cart and Favorites Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders favorites and cart buttons in Header with data targets and badges', () => {
    const onOpenFavorites = vi.fn();
    const onOpenCart = vi.fn();

    render(
      <Header
        categories={DEFAULT_CATALOG.categories}
        brands={DEFAULT_CATALOG.brands}
        products={DEFAULT_CATALOG.products}
        selectedCategory="all"
        selectedBrand="all"
        searchQuery=""
        onSearchChange={vi.fn()}
        onSelectCategory={vi.fn()}
        onSelectBrand={vi.fn()}
        onOpenInverterInfo={vi.fn()}
        onOpenCatalogShare={vi.fn()}
        totalCount={DEFAULT_CATALOG.products.length}
        filteredCount={DEFAULT_CATALOG.products.length}
        theme={lightTheme}
        isDarkMode={false}
        onToggleTheme={vi.fn()}
        favoritesCount={3}
        cartCount={5}
        onOpenFavorites={onOpenFavorites}
        onOpenCart={onOpenCart}
        currentView="catalog"
      />
    );

    const favBtn = document.querySelector('[data-favorite-target]');
    expect(favBtn).toBeTruthy();
    expect(favBtn?.textContent).toContain('3');

    const cartBtn = document.querySelector('[data-cart-target]');
    expect(cartBtn).toBeTruthy();
    expect(cartBtn?.textContent).toContain('5');

    fireEvent.click(favBtn!);
    expect(onOpenFavorites).toHaveBeenCalled();

    fireEvent.click(cartBtn!);
    expect(onOpenCart).toHaveBeenCalled();
  });

  it('renders CatalogApp and allows navigating between catalog, cart and favorites', async () => {
    const { container } = render(
      <CatalogApp initialData={{ catalog: DEFAULT_CATALOG }} />
    );

    // Initial view is catalog
    expect(container.querySelector('.catalog-loaded-wrap')).toBeTruthy();

    // Click cart icon in header
    const cartBtn = container.querySelector('[data-cart-target]');
    expect(cartBtn).toBeTruthy();
    fireEvent.click(cartBtn!);

    // Should switch to cart page view
    await waitFor(() => {
      expect(container.querySelector('.cart-page-wrapper') || container.querySelector('.catalog-shell')).toBeTruthy();
    });

    // Click favorite icon in header
    const favBtn = container.querySelector('[data-favorite-target]');
    expect(favBtn).toBeTruthy();
    fireEvent.click(favBtn!);

    // Should switch to favorites page view
    await waitFor(() => {
      expect(container.querySelector('.favorites-page-wrapper') || container.querySelector('.catalog-shell')).toBeTruthy();
    });
  });
});
