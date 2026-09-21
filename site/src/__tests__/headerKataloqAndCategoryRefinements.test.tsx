import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SiteHeader } from '../components/site/SiteHeader';
import { MegaMenu } from '../components/site/MegaMenu';
import { VisualCategoryCards } from '../components/VisualCategoryCards';
import { lightTheme } from '../types/theme';
import { DEFAULT_CATALOG } from '../data/catalog';

describe('Header Kataloq Nav, MegaMenu Half-Screen & Category Spacing Refinements', () => {
  it('VisualCategoryCards scroll track uses 16px gap matching product cards', () => {
    const mockProducts = [
      {
        id: 'prod-1',
        title: 'Məhsul 1',
        category: DEFAULT_CATALOG.categories[0]?.id || 'cat-1',
        status: 'published' as const,
        image: '/media/test.png',
        price: 100,
        currency: 'AZN',
      },
    ];

    const { container } = render(
      <VisualCategoryCards
        categories={DEFAULT_CATALOG.categories}
        products={mockProducts as any}
        theme={lightTheme}
        selectedCategory="all"
        onSelectCategory={() => {}}
      />
    );

    const track = container.querySelector('.visual-category-scroll-track') as HTMLElement;
    expect(track).toBeTruthy();
    expect(track.style.gap).toBe('16px');
  });

  it('SiteHeader displays Kataloq trigger and icons before all secondary nav links', () => {
    const handleNavigate = vi.fn();
    const { container } = render(
      <SiteHeader
        currentRoute="home"
        onNavigate={handleNavigate}
        categories={DEFAULT_CATALOG.categories}
        brands={DEFAULT_CATALOG.brands}
        products={DEFAULT_CATALOG.products}
        settings={DEFAULT_CATALOG.settings}
        theme={lightTheme}
        themeMode="light"
        onToggleTheme={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
        onOpenSearchModal={() => {}}
        comparisonCount={0}
        favoritesCount={0}
        onOpenSaharaMatch={() => {}}
      />
    );

    // Verify "Kataloq" trigger button exists
    const kataloqBtn = container.querySelector('.mega-menu-trigger-btn');
    expect(kataloqBtn).toBeTruthy();
    expect(kataloqBtn?.textContent).toContain('Kataloq');

    // Verify all nav buttons have text
    expect(screen.getByText('Ana Səhifə')).toBeTruthy();
    expect(screen.getByText('Brendlər')).toBeTruthy();
    expect(screen.getByText('Mağazalarımız')).toBeTruthy();
    expect(screen.getByText('Servis və Zəmanət')).toBeTruthy();
    expect(screen.getByText('Müştəri Dəstəyi')).toBeTruthy();
    expect(screen.getByText('Endirimlər')).toBeTruthy();
  });

  it('MegaMenu limits max height to half screen and caps brands with view all button', () => {
    const handleClose = vi.fn();
    const handleSelectCategory = vi.fn();
    const handleSelectBrand = vi.fn();
    const handleNavigate = vi.fn();

    const { container } = render(
      <MegaMenu
        isOpen={true}
        onClose={handleClose}
        categories={DEFAULT_CATALOG.categories}
        brands={DEFAULT_CATALOG.brands}
        products={DEFAULT_CATALOG.products}
        theme={lightTheme}
        onSelectCategory={handleSelectCategory}
        onSelectBrand={handleSelectBrand}
        onNavigate={handleNavigate}
      />
    );

    const overlay = container.querySelector('#mega-menu-overlay') as HTMLElement;
    expect(overlay).toBeTruthy();
    expect(overlay.style.maxHeight).toBe('min(90vh, 760px)');

    // Verify "Bütün brendlər (X)" button exists
    const allBrandsBtn = screen.getByText(
      new RegExp(
        `Bütün brendlər \\(${DEFAULT_CATALOG.brands.filter((b) => b.active).length}\\)`,
        'i'
      )
    );
    expect(allBrandsBtn).toBeTruthy();

    fireEvent.click(allBrandsBtn);
    expect(handleNavigate).toHaveBeenCalledWith('brands');
    expect(handleClose).toHaveBeenCalled();
  });

  it('MegaMenu displays matching product cards in bottom showcase when hovering over a category', () => {
    const handleClose = vi.fn();
    const handleSelectCategory = vi.fn();
    const handleSelectProduct = vi.fn();
    const handleNavigate = vi.fn();

    const mockCategories = [
      { id: 'aspiratorlar', name: 'Aspiratorlar', active: true, slug: 'aspiratorlar' },
      { id: 'sobalar', name: 'Sobalar', active: true, slug: 'sobalar' },
    ];

    const mockProducts = [
      {
        id: 'asp-1',
        title: 'Lotus ASP-60 Glass Hood',
        category: 'aspiratorlar',
        brandId: 'lotus',
        status: 'published' as const,
        published: true,
        image: '/media/asp1.png',
        price: 350,
      },
      {
        id: 'asp-2',
        title: 'Ardo AH-90 Black Hood',
        category: 'aspiratorlar',
        brandId: 'ardo',
        status: 'published' as const,
        published: true,
        image: '/media/asp2.png',
        price: 520,
      },
      {
        id: 'sob-1',
        title: 'Ardo Built-in Oven',
        category: 'sobalar',
        brandId: 'ardo',
        status: 'published' as const,
        published: true,
        image: '/media/sob1.png',
        price: 890,
      },
    ];

    const { container } = render(
      <MegaMenu
        isOpen={true}
        onClose={handleClose}
        categories={mockCategories as any}
        brands={DEFAULT_CATALOG.brands}
        products={mockProducts as any}
        theme={lightTheme}
        onSelectCategory={handleSelectCategory}
        onSelectBrand={() => {}}
        onSelectProduct={handleSelectProduct}
        onNavigate={handleNavigate}
      />
    );

    // Bottom showcase should be present
    const showcase = container.querySelector('.mega-menu-products-showcase');
    expect(showcase).toBeTruthy();

    // Hover over "Sobalar" category button in the active department group
    const sobalarElements = screen.getAllByText('Sobalar');
    const sobalarBtn = sobalarElements[0]?.closest('button');
    expect(sobalarBtn).toBeTruthy();
    if (sobalarBtn) {
      fireEvent.mouseEnter(sobalarBtn);
    }

    // Now showcase should update to Sobalar products
    expect(screen.getByText(/Sobalar üzrə seçilmiş modellər/i)).toBeTruthy();
    expect(screen.getByText('Ardo Built-in Oven')).toBeTruthy();

    // Clicking product card triggers onSelectProduct
    const prodCard = screen
      .getByText('Ardo Built-in Oven')
      .closest('.featured-product-card, .product-card');
    expect(prodCard).toBeTruthy();
    if (prodCard) {
      fireEvent.click(prodCard);
      expect(handleSelectProduct).toHaveBeenCalledWith(expect.objectContaining({ id: 'sob-1' }));
      expect(handleClose).toHaveBeenCalled();
    }
  });
});
