// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Header } from '../components/Header';
import { BrandsSection } from '../components/admin/sections/BrandsSection';
import { CartPage } from '../pages/CartPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { DEFAULT_CATALOG } from '../data/catalog';
import { lightTheme } from '../types/theme';
import type { Product } from '../types/product';

afterEach(cleanup);

const products = Array.from({ length: 5 }, (_, index) => ({
  id: `requested-product-${index + 1}`,
  code: `REQ-${index + 1}`,
  title: `Tövsiyə modeli ${index + 1}`,
  brandId: 'ardo',
  category: 'cooktop',
  price: 100 + index,
  status: 'active',
  images: [`/recommended-${index + 1}.jpg`],
})) as unknown as Product[];

const headerProps = {
  categories: DEFAULT_CATALOG.categories,
  brands: DEFAULT_CATALOG.brands,
  products: DEFAULT_CATALOG.products,
  selectedCategory: 'all' as const,
  onSelectCategory: vi.fn(),
  selectedBrand: 'all',
  onSelectBrand: vi.fn(),
  searchQuery: '',
  onSearchChange: vi.fn(),
  onOpenCatalogShare: vi.fn(),
  onOpenDrawer: vi.fn(),
  totalCount: DEFAULT_CATALOG.products.length,
  filteredCount: DEFAULT_CATALOG.products.length,
  favoritesCount: 2,
  cartCount: 3,
  onOpenFavorites: vi.fn(),
  onOpenCart: vi.fn(),
  theme: lightTheme,
  isDarkMode: false,
  onToggleTheme: vi.fn(),
};

describe('Header collection state, recommendations and editable countries', () => {
  it('keeps counted icons neutral, uses red outline only for the active page, and removes info action', () => {
    const { container, rerender } = render(<Header {...headerProps} currentView="catalog" />);
    const favoriteButton = container.querySelector('.favorite-header-btn') as HTMLButtonElement;
    const cartButton = container.querySelector('.cart-header-btn') as HTMLButtonElement;
    const favoriteIcon = favoriteButton.querySelector('svg') as SVGElement;

    expect(favoriteButton.style.color).not.toBe('#ef4444');
    expect(cartButton.style.color).not.toBe('#dc2626');
    expect(favoriteIcon.getAttribute('fill')).toBe('none');
    expect(container.querySelector('.header-info-btn')).toBeNull();

    rerender(<Header {...headerProps} currentView="favorites" />);
    expect((container.querySelector('.favorite-header-btn') as HTMLButtonElement).style.color).toBe(
      '#ef4444'
    );
    expect(container.querySelector('.favorite-header-btn svg')?.getAttribute('fill')).toBe('none');
    expect((container.querySelector('.cart-header-btn') as HTMLButtonElement).style.color).not.toBe(
      '#dc2626'
    );

    rerender(<Header {...headerProps} currentView="cart" />);
    expect((container.querySelector('.cart-header-btn') as HTMLButtonElement).style.color).toBe(
      '#dc2626'
    );
  });

  it('shows exactly three recommendations in cart and favorites and uses the outline heart icon in empty copy', () => {
    const shared = {
      allProducts: products,
      brands: DEFAULT_CATALOG.brands,
      theme: lightTheme,
      themeMode: 'light' as const,
      onNavigate: vi.fn(),
      onSelectProduct: vi.fn(),
      onCall: vi.fn(),
    };

    const cartRender = render(
      <CartPage
        {...shared}
        cartItems={[]}
        onUpdateQuantity={vi.fn()}
        onRemoveItem={vi.fn()}
        onClearCart={vi.fn()}
        onWhatsAppCheckout={vi.fn()}
        onAddToCart={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );
    expect(
      cartRender.container.querySelectorAll('.product-grid-container .product-card')
    ).toHaveLength(3);
    cartRender.unmount();

    const favoriteRender = render(
      <FavoritesPage
        {...shared}
        favoriteIds={[]}
        categories={DEFAULT_CATALOG.categories}
        onToggleFavorite={vi.fn()}
        onClearFavorites={vi.fn()}
        onAddToCart={vi.fn()}
        onAddAllToCart={vi.fn()}
        onWhatsApp={vi.fn()}
        onShare={vi.fn()}
        onCopyLink={vi.fn()}
      />
    );
    expect(
      favoriteRender.container.querySelectorAll('.product-grid-container .product-card')
    ).toHaveLength(3);
    expect(favoriteRender.container.textContent).not.toContain('❤️');
    expect(favoriteRender.container.querySelector('.empty-favorites-inline-heart')).toBeTruthy();
  });

  it('accepts a manually typed brand origin country instead of limiting the admin to preset options', () => {
    const onUpdateBrands = vi.fn();
    render(
      <BrandsSection
        theme={lightTheme}
        csrfToken="test-token"
        catalog={DEFAULT_CATALOG}
        onUpdateBrands={onUpdateBrands}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: /Redaktə/i })[0]);
    const originInput = screen.getByLabelText('Mənşə ölkəsi') as HTMLInputElement;
    expect(originInput.tagName).toBe('INPUT');
    expect(originInput.getAttribute('list')).toBe('brand-origin-country-options');

    fireEvent.change(originInput, { target: { value: 'Portuqaliya' } });
    fireEvent.click(screen.getByRole('button', { name: /Yadda saxla/i }));

    expect(onUpdateBrands).toHaveBeenCalledTimes(1);
    const updater = onUpdateBrands.mock.calls[0][0] as (
      previous: typeof DEFAULT_CATALOG.brands
    ) => typeof DEFAULT_CATALOG.brands;
    const updated = updater(DEFAULT_CATALOG.brands);
    expect(updated.find((brand) => brand.id === DEFAULT_CATALOG.brands[0].id)?.originCountry).toBe(
      'Portuqaliya'
    );
  });
});
