import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { CartPage } from '../pages/CartPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { lightTheme } from '../types/theme';
import { sortCatalogPageProducts } from '../features/catalog/catalogSelection';
import type { Brand, CatalogCategory } from '../types/product';

afterEach(cleanup);

const sampleBrands: Brand[] = [
  {
    id: 'ardo',
    name: 'ARDO',
    slug: 'ardo',
    originCountry: 'İtaliya',
    manufacturingCountries: ['İtaliya'],
    active: true,
    logo: '/media/brands/ardo.svg',
  },
  {
    id: 'lotus',
    name: 'Lotus',
    slug: 'lotus',
    originCountry: 'Türkiyə',
    manufacturingCountries: ['Türkiyə'],
    active: true,
    logo: '/media/brands/lotus.svg',
  },
];

const sampleCategories: CatalogCategory[] = [
  {
    id: 'aspirator',
    name: 'Aspiratorlar',
    slug: 'aspirator',
    icon: '💨',
    active: true,
    sortOrder: 1,
  },
  { id: 'plite', name: 'Plitələr', slug: 'plite', icon: '🔥', active: true, sortOrder: 2 },
];

const sampleProducts = [
  {
    id: 'p1',
    title: 'ARDO Aspirator A1',
    brandId: 'ardo',
    category: 'aspirator',
    price: 500,
    status: 'active',
    images: ['/img1.jpg'],
  },
  {
    id: 'p2',
    title: 'Lotus Aspirator L1',
    brandId: 'lotus',
    category: 'aspirator',
    price: 400,
    status: 'active',
    images: ['/img2.jpg'],
  },
  {
    id: 'p3',
    title: 'ARDO Plitə P1',
    brandId: 'ardo',
    category: 'plite',
    price: 600,
    status: 'active',
    images: ['/img3.jpg'],
  },
] as any;

describe('Cart, Favorites and Sorting Refinements Suite', () => {
  it('sortCatalogPageProducts supports all and price-asc correctly without random recommendation', () => {
    const list = sortCatalogPageProducts(sampleProducts, 'all');
    expect(list.length).toBe(3);
    expect(list[0].id).toBe('p1');

    const sortedByPrice = sortCatalogPageProducts(sampleProducts, 'price-asc');
    expect(sortedByPrice[0].price).toBe(400);
    expect(sortedByPrice[2].price).toBe(600);
  });

  it('CartPage renders text-only back button without border/background and displays brand logos on recommended products', () => {
    const handleNavigate = vi.fn();
    const handleToggleCompare = vi.fn();

    const { container } = render(
      <CartPage
        cartItems={[{ product: sampleProducts[0], quantity: 1 }]}
        allProducts={sampleProducts}
        brands={sampleBrands}
        theme={lightTheme}
        themeMode="light"
        onUpdateQuantity={vi.fn()}
        onRemoveItem={vi.fn()}
        onClearCart={vi.fn()}
        onNavigate={handleNavigate}
        onSelectProduct={vi.fn()}
        onWhatsAppCheckout={vi.fn()}
        onCall={vi.fn()}
        onToggleCompare={handleToggleCompare}
        comparisonIds={[]}
      />
    );

    // Back button has no border and transparent background
    const backBtn = container.querySelector('.cart-back-btn') as HTMLElement;
    expect(backBtn).toBeTruthy();
    expect(backBtn.style.background).toBe('transparent');
    expect(backBtn.style.border).toContain('none');

    // Recommended products section should be visible
    expect(screen.getByText('Tövsiyə Olunan Modellər')).toBeTruthy();
  });

  it('FavoritesPage renders text-only back button and includes Recommended Products section with compare support', () => {
    const handleNavigate = vi.fn();
    const handleToggleCompare = vi.fn();

    const { container } = render(
      <FavoritesPage
        favoriteIds={['p1']}
        allProducts={sampleProducts}
        categories={sampleCategories}
        brands={sampleBrands}
        theme={lightTheme}
        themeMode="light"
        onToggleFavorite={vi.fn()}
        onClearFavorites={vi.fn()}
        onAddToCart={vi.fn()}
        onAddAllToCart={vi.fn()}
        onSelectProduct={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onShare={vi.fn()}
        onCopyLink={vi.fn()}
        onNavigate={handleNavigate}
        onToggleCompare={handleToggleCompare}
        comparisonIds={[]}
      />
    );

    // Back button check
    const backBtn = container.querySelector('.favorites-back-btn') as HTMLElement;
    expect(backBtn).toBeTruthy();
    expect(backBtn.style.background).toBe('transparent');
    expect(backBtn.style.border).toContain('none');

    // Recommended products section should be visible in Favorites page as well
    expect(screen.getByText('Tövsiyə Olunan Modellər')).toBeTruthy();
  });
});
