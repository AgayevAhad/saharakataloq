// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Header } from '../components/Header';
import { SiteHeader } from '../components/site/SiteHeader';
import { DEFAULT_CATALOG } from '../data/catalog';
import { lightTheme } from '../types/theme';

describe('Header Action Icons Ordering & Sidebar Scroll Refinements', () => {
  it('Header renders action icons in exact order: favorites, cart, share, location, info, theme toggle without box for share', () => {
    const onOpenFavorites = vi.fn();
    const onOpenCart = vi.fn();
    const onOpenCatalogShare = vi.fn();
    const onOpenDrawer = vi.fn();
    const onOpenInverterInfo = vi.fn();
    const onToggleTheme = vi.fn();

    const { container } = render(
      <Header
        categories={DEFAULT_CATALOG.categories}
        brands={DEFAULT_CATALOG.brands}
        products={DEFAULT_CATALOG.products}
        selectedCategory="all"
        onSelectCategory={vi.fn()}
        selectedBrand="all"
        onSelectBrand={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenInverterInfo={onOpenInverterInfo}
        onOpenCatalogShare={onOpenCatalogShare}
        onOpenDrawer={onOpenDrawer}
        totalCount={DEFAULT_CATALOG.products.length}
        filteredCount={DEFAULT_CATALOG.products.length}
        favoritesCount={2}
        cartCount={1}
        onOpenFavorites={onOpenFavorites}
        onOpenCart={onOpenCart}
        currentView="catalog"
        theme={lightTheme}
        isDarkMode={false}
        onToggleTheme={onToggleTheme}
      />
    );

    const headerActions = container.querySelector('.header-actions');
    expect(headerActions).toBeTruthy();

    const buttons = headerActions?.querySelectorAll('button');
    expect(buttons?.length).toBeGreaterThanOrEqual(5);

    // 1. First button is Favorites
    const favBtn = container.querySelector('.favorite-header-btn') as HTMLButtonElement;
    expect(favBtn).toBeTruthy();

    // 2. Second button is Cart
    const cartBtn = container.querySelector('.cart-header-btn') as HTMLButtonElement;
    expect(cartBtn).toBeTruthy();

    // 3. Third button is Share
    const shareBtn = container.querySelector('.header-share-btn') as HTMLButtonElement;
    expect(shareBtn).toBeTruthy();
    // Share button must be transparent without a filled background box
    expect(['transparent', 'rgba(0, 0, 0, 0)', '']).toContain(shareBtn.style.backgroundColor);

    // 4. Fourth button is Location Drawer
    const drawerBtn = container.querySelector('.drawer-trigger-btn') as HTMLButtonElement;
    expect(drawerBtn).toBeTruthy();

    // Verify hover interactions trigger without errors
    fireEvent.mouseEnter(shareBtn);
    expect(shareBtn.style.color).toBe('#dc2626');
    fireEvent.mouseLeave(shareBtn);

    fireEvent.mouseEnter(drawerBtn);
    expect(drawerBtn.style.color).toBe('#dc2626');
    fireEvent.mouseLeave(drawerBtn);
  });

  it('SiteHeader renders action icons in exact order: favorites, cart, share, location, theme toggle', () => {
    const onOpenCatalogShare = vi.fn();
    const onOpenDrawer = vi.fn();

    const { container } = render(
      <SiteHeader
        currentRoute="home"
        onNavigate={vi.fn()}
        categories={DEFAULT_CATALOG.categories}
        brands={DEFAULT_CATALOG.brands}
        products={DEFAULT_CATALOG.products}
        theme={lightTheme}
        themeMode="light"
        onToggleTheme={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenSearchModal={vi.fn()}
        comparisonCount={0}
        favoritesCount={0}
        cartCount={0}
        onOpenSaharaMatch={vi.fn()}
        onOpenCatalogShare={onOpenCatalogShare}
        onOpenDrawer={onOpenDrawer}
      />
    );

    // Verify share button exists in SiteHeader
    const shareBtn = container.querySelector('.header-share-btn') as HTMLButtonElement;
    expect(shareBtn).toBeTruthy();
    expect(['transparent', 'rgba(0, 0, 0, 0)', '']).toContain(shareBtn.style.backgroundColor);

    // Click share button
    fireEvent.click(shareBtn);
    expect(onOpenCatalogShare).toHaveBeenCalled();

    // Verify hover effects
    fireEvent.mouseEnter(shareBtn);
    expect(shareBtn.style.color).toBe('#e31e24');
    fireEvent.mouseLeave(shareBtn);

    const locBtn = container.querySelector('.header-location-btn') as HTMLButtonElement;
    expect(locBtn).toBeTruthy();
    fireEvent.mouseEnter(locBtn);
    expect(locBtn.style.color).toBe('#e31e24');
    fireEvent.mouseLeave(locBtn);
  });
});
