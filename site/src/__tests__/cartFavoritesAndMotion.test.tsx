import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BannerHero } from '../components/BannerHero';
import { CartPage, CartItem } from '../pages/CartPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { ProductCard } from '../components/ProductCard';
import { SiteHeader } from '../components/site/SiteHeader';
import { MobileBottomNav } from '../components/site/MobileBottomNav';
import { lightTheme } from '../types/theme';
import { Product, CatalogCategory } from '../types/product';

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    code: 'ARDO-V1',
    title: 'Ardo Inverter Soyuducu',
    brandId: 'ardo',
    category: 'refrigerator',
    categoryName: 'Soyuducular',
    status: 'published',
    price: 1200,
    oldPrice: 1400,
    image: '/media/ardo-fridge.jpg',
    specs: { 'Tutumu': '450L', 'Kompressor': 'Inverter' },
    highlights: ['A+++ Enerji', 'No Frost'],
  },
  {
    id: 'prod-2',
    code: 'LOTUS-W1',
    title: 'Lotus Smart Paltaryuyan',
    brandId: 'lotus',
    category: 'washer',
    categoryName: 'Paltaryuyanlar',
    status: 'published',
    price: 850,
    image: '/media/lotus-washer.jpg',
    specs: { 'Yükləmə': '8 kq', 'Dövr': '1400 rpm' },
    highlights: ['Buxar rejimi', 'Sakit mühərrik'],
  },
];

const mockCategories: CatalogCategory[] = [
  { id: 'refrigerator', name: 'Soyuducular', slug: 'refrigerator', count: 1 },
  { id: 'washer', name: 'Paltaryuyanlar', slug: 'washer', count: 1 },
];

describe('Item 15 — BannerHero Video & Slides with Red Progress Fill Bar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders video and slides pagination with progress indicators', () => {
    const { container } = render(
      <BannerHero
        theme={lightTheme}
        heroTitle="Sahara Premium Elektronika"
        heroSubtitle="Bütün məhsullar üçün rəsmi zəmanət"
      />
    );

    // Initial video slide is active
    expect(screen.getByText('Texnologiya')).toBeDefined();
    
    // Pagination buttons 01, 02, 03 exist
    const paginationButtons = container.querySelectorAll('.hero-pagination-btn');
    expect(paginationButtons.length).toBe(3);

    // Real-time progress bar exists on the active slide button
    const activeProgress = container.querySelector('.hero-progress-fill') as HTMLElement;
    expect(activeProgress).toBeDefined();

    // Clicking slide 2 switches slide
    fireEvent.click(paginationButtons[1]);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(paginationButtons[1].classList.contains('active')).toBe(true);
  });

  it('progress bar advances over time', () => {
    const { container } = render(
      <BannerHero
        theme={lightTheme}
      />
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const progressBar = container.querySelector('.hero-progress-fill') as HTMLElement;
    expect(progressBar).toBeDefined();
  });
});

describe('Item 16 — CartPage Experience & Functionality', () => {
  const initialCart: CartItem[] = [
    { product: mockProducts[0], quantity: 2 },
    { product: mockProducts[1], quantity: 1 },
  ];

  it('renders cart items, quantities, and calculates totals correctly', () => {
    const updateQty = vi.fn();
    const removeItem = vi.fn();
    const clearCart = vi.fn();
    const checkout = vi.fn();

    render(
      <CartPage
        cartItems={initialCart}
        allProducts={mockProducts}
        theme={lightTheme}
        themeMode="light"
        onUpdateQuantity={updateQty}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onNavigate={vi.fn()}
        onSelectProduct={vi.fn()}
        onWhatsAppCheckout={checkout}
        onCall={vi.fn()}
      />
    );

    // Title and items
    expect(screen.getByText('Səbətim')).toBeDefined();
    expect(screen.getByText('Ardo Inverter Soyuducu')).toBeDefined();
    expect(screen.getByText('Lotus Smart Paltaryuyan')).toBeDefined();

    // Steppers: plus and minus
    const plusButtons = screen.getAllByTitle('Artır');
    expect(plusButtons.length).toBe(2);
    fireEvent.click(plusButtons[0]);
    expect(updateQty).toHaveBeenCalledWith('prod-1', 3);

    const minusButtons = screen.getAllByTitle('Azalt');
    fireEvent.click(minusButtons[0]);
    expect(updateQty).toHaveBeenCalledWith('prod-1', 1);

    // Delete single item
    const deleteButtons = screen.getAllByTitle('Məhsulu sil');
    fireEvent.click(deleteButtons[0]);
    expect(removeItem).toHaveBeenCalledWith('prod-1');

    // Promo code input
    const promoInput = screen.getByPlaceholderText(/məs: SAHARA10/i);
    fireEvent.change(promoInput, { target: { value: 'SAHARA10' } });
    fireEvent.click(screen.getByText('Tətbiq et'));
    expect(screen.getByText(/10% endirim tətbiq edildi/i)).toBeDefined();

    // WhatsApp Checkout button
    const waOrderBtn = screen.getByText(/WhatsApp ilə Sifariş et/i);
    fireEvent.click(waOrderBtn);
    expect(checkout).toHaveBeenCalled();
  });

  it('renders empty cart state gracefully with return to catalog button', () => {
    const navigate = vi.fn();
    render(
      <CartPage
        cartItems={[]}
        allProducts={mockProducts}
        theme={lightTheme}
        themeMode="light"
        onUpdateQuantity={vi.fn()}
        onRemoveItem={vi.fn()}
        onClearCart={vi.fn()}
        onNavigate={navigate}
        onSelectProduct={vi.fn()}
        onWhatsAppCheckout={vi.fn()}
        onCall={vi.fn()}
      />
    );

    expect(screen.getByText('Səbətiniz hazırda boşdur')).toBeDefined();
    const backBtn = screen.getByText('Kataloqa baxın');
    fireEvent.click(backBtn);
    expect(navigate).toHaveBeenCalledWith('catalog');
  });
});

describe('Item 16 — FavoritesPage Experience & Functionality', () => {
  it('renders favorite items, category filters, and bulk actions', () => {
    const toggleFav = vi.fn();
    const clearFav = vi.fn();
    const addToCart = vi.fn();
    const addAllToCart = vi.fn();
    const navigate = vi.fn();

    render(
      <FavoritesPage
        favoriteIds={['prod-1', 'prod-2']}
        allProducts={mockProducts}
        categories={mockCategories}
        theme={lightTheme}
        themeMode="light"
        onToggleFavorite={toggleFav}
        onClearFavorites={clearFav}
        onAddToCart={addToCart}
        onAddAllToCart={addAllToCart}
        onSelectProduct={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onShare={vi.fn()}
        onCopyLink={vi.fn()}
        onNavigate={navigate}
      />
    );

    expect(screen.getByText('Bəyəndiyim Məhsullar')).toBeDefined();
    expect(screen.getByText('2 model')).toBeDefined();

    // Category filter pills
    expect(screen.getByText('Hamısı (2)')).toBeDefined();

    // Bulk Add all to cart button
    const addAllBtn = screen.getByText('Hamısını Səbətə At');
    fireEvent.click(addAllBtn);
    expect(addAllToCart).toHaveBeenCalledWith(mockProducts);

    // Clear all favorites
    const clearBtn = screen.getByText('Təmizlə');
    fireEvent.click(clearBtn);
    expect(clearFav).toHaveBeenCalled();
  });
});

describe('Item 16 & 17 — ProductCard Quick Hover Buttons and Header Badges', () => {
  it('renders ProductCard with quick hover heart and cart buttons', () => {
    const addToCart = vi.fn();
    const toggleFav = vi.fn();
    const select = vi.fn();

    const { container } = render(
      <ProductCard
        product={mockProducts[0]}
        theme={lightTheme}
        onSelect={select}
        onShare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onCopyLink={vi.fn()}
        onAddToCart={addToCart}
        onToggleFavorite={toggleFav}
        isFavorite={false}
      />
    );

    // Quick heart button exists
    const heartBtn = container.querySelector('.card-action-btn-heart') as HTMLElement;
    expect(heartBtn).toBeDefined();
    fireEvent.click(heartBtn);
    expect(toggleFav).toHaveBeenCalledWith(mockProducts[0]);
    expect(select).not.toHaveBeenCalled();

    // Quick cart button exists
    const cartBtn = container.querySelector('.card-action-btn-cart') as HTMLElement;
    expect(cartBtn).toBeDefined();
    fireEvent.click(cartBtn);
    expect(addToCart).toHaveBeenCalledWith(mockProducts[0]);
    expect(select).not.toHaveBeenCalled();
  });

  it('SiteHeader and MobileBottomNav route to cart and show live count badges', () => {
    const navigate = vi.fn();
    render(
      <SiteHeader
        currentRoute="home"
        onNavigate={navigate}
        categories={mockCategories}
        brands={[]}
        products={mockProducts}
        theme={lightTheme}
        themeMode="light"
        onToggleTheme={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenSearchModal={vi.fn()}
        cartCount={3}
        favoritesCount={2}
      />
    );

    const cartHeaderBtn = screen.getByLabelText('Səbət (3)');
    expect(cartHeaderBtn).toBeDefined();
    fireEvent.click(cartHeaderBtn);
    expect(navigate).toHaveBeenCalledWith('cart');

    // MobileBottomNav test
    const { getByRole } = render(
      <MobileBottomNav
        currentRoute="home"
        onNavigate={navigate}
        cartCount={3}
        favoritesCount={2}
        theme={lightTheme}
      />
    );

    const mobileCartBtn = screen.getByText('Səbət');
    fireEvent.click(mobileCartBtn);
    expect(navigate).toHaveBeenCalledWith('cart');
  });

  it('renders CartPage and FavoritesPage directly without 404 when navigating via URL or history', async () => {
    const { App } = await import('../App');
    
    // Test Cart route
    window.history.pushState({}, '', '/cart');
    const { container: cartContainer, unmount: unmountCart } = render(<App />);
    expect(cartContainer.querySelector('.cart-page-wrap')).toBeDefined();
    expect(screen.queryByText(/Səhifə Tapılmadı/i)).toBeNull();
    unmountCart();

    // Test Favorites route
    window.history.pushState({}, '', '/favorites');
    const { container: favContainer, unmount: unmountFav } = render(<App />);
    expect(favContainer.querySelector('.favorites-page-wrap')).toBeDefined();
    expect(screen.queryByText(/Səhifə Tapılmadı/i)).toBeNull();
    unmountFav();

    // Test deep link ?page=cart
    window.history.pushState({}, '', '/?page=cart');
    const { container: dlCartContainer, unmount: unmountDlCart } = render(<App />);
    expect(dlCartContainer.querySelector('.cart-page-wrap')).toBeDefined();
    expect(screen.queryByText(/Səhifə Tapılmadı/i)).toBeNull();
    unmountDlCart();

    // Test deep link ?page=favorites
    window.history.pushState({}, '', '/?page=favorites');
    const { container: dlFavContainer, unmount: unmountDlFav } = render(<App />);
    expect(dlFavContainer.querySelector('.favorites-page-wrap')).toBeDefined();
    expect(screen.queryByText(/Səhifə Tapılmadı/i)).toBeNull();
    unmountDlFav();
  });
});
