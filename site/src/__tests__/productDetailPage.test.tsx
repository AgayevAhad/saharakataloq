import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { Product, Brand, CatalogCategory, CatalogSettings } from '../types/product';
import { ThemeColors } from '../types/theme';

const lightTheme: ThemeColors = {
  primary: '#dc2626',
  primaryHover: '#b91c1c',
  bg: '#ffffff',
  bgSecondary: '#f8fafc',
  cardBg: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  mode: 'light',
};

const mockBrands: Brand[] = [
  { id: 'ardo', name: 'ARDO', originCountry: 'İtaliya', active: true, logo: '/media/ardo-logo.png' },
  { id: 'lotus', name: 'Lotus', originCountry: 'Almaniya', active: true, logo: '/media/lotus-logo.png' },
];

const mockCategories: CatalogCategory[] = [
  { id: 'paltaryuyan', name: 'Paltaryuyan', active: true, sortOrder: 1 },
  { id: 'soyuducu', name: 'Soyuducu', active: true, sortOrder: 2 },
];

const mockProduct: Product = {
  id: 'ardo-washer-1',
  code: 'FLN 128 LW',
  title: 'ARDO 8kq Paltaryuyan İnverter',
  category: 'paltaryuyan',
  categoryName: 'Paltaryuyan',
  brandId: 'ardo',
  price: 999,
  priceCash: 999,
  oldPrice: 1199,
  status: 'published',
  badgeText: 'İnverter Motor',
  description: 'İtaliya istehsalı, yüksək enerji səmərəliliyinə malik premium paltaryuyan maşın.',
  media: [
    { id: 'm-1', url: '/media/washer-front.jpg', type: 'image', alt: 'Front view' },
    { id: 'm-2', url: '/media/washer-side.jpg', type: 'image', alt: 'Side view' },
  ],
  specs: [
    { name: 'Mühərrik', value: 'İnverter', group: 'Mühərrik və Güc' },
    { name: 'Tutum', value: '8 kq', group: 'Mühərrik və Güc' },
    { name: 'Sıxma sürəti', value: '1200 dövr/dəq', group: 'Funksiyalar' },
  ],
  highlights: ['İnverter Mühərrik', 'A+++ Enerji Sinfi', 'EcoSilence Səssiz Texnologiya'],
};

const mockAllProducts: Product[] = [
  mockProduct,
  {
    id: 'ardo-washer-2',
    code: 'FLN 149 LW',
    title: 'ARDO 9kq Paltaryuyan İnverter',
    category: 'paltaryuyan',
    categoryName: 'Paltaryuyan',
    brandId: 'ardo',
    price: 1199,
    priceCash: 1199,
    status: 'published',
    specs: [{ name: 'Tutum', value: '9 kq' }],
  },
  {
    id: 'lotus-fridge-1',
    code: 'LT-RF500',
    title: 'Lotus No-Frost Soyuducu',
    category: 'soyuducu',
    categoryName: 'Soyuducu',
    brandId: 'lotus',
    price: 1499,
    priceCash: 1499,
    status: 'published',
    specs: [{ name: 'Həcm', value: '500 L' }],
  },
];

const mockSettings: CatalogSettings = {
  headerTitle: 'Sahara Electronics',
  headerSubtitle: 'Premium Məişət Texnikası',
  contactPhone: '+994 50 123 45 67',
  whatsappNumber: '994501234567',
  whatsappButtonText: 'WhatsApp ilə Sifariş et',
  callButtonText: 'Zəng et',
  shareButtonText: 'Paylaş',
  addresses: ['Sədərək TM, Sıra 5, Mağaza 40'],
};

describe('ProductDetailPage Tests', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('1. Renders product title, code, brand tag, pricing, and description', () => {
    render(
      <ProductDetailPage
        product={mockProduct}
        allProducts={mockAllProducts}
        categories={mockCategories}
        brands={mockBrands}
        settings={mockSettings}
        theme={lightTheme}
        themeMode="light"
        onNavigate={vi.fn()}
        onSelectProduct={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
      />
    );

    expect(screen.getAllByText('FLN 128 LW').length).toBeGreaterThan(0);
    expect(screen.getByText('ARDO 8kq Paltaryuyan İnverter')).toBeDefined();
    expect(screen.getAllByText(/999/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1.*199/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/İtaliya/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Rəsmi Anbarda mövcuddur/i)).toBeDefined();
  });

  it('2. Triggers WhatsApp, Call, Cart, Favorite, and Compare callbacks', () => {
    const handleWhatsApp = vi.fn();
    const handleCall = vi.fn();
    const handleAddToCart = vi.fn();
    const handleFavorite = vi.fn();
    const handleCompare = vi.fn();

    render(
      <ProductDetailPage
        product={mockProduct}
        allProducts={mockAllProducts}
        categories={mockCategories}
        brands={mockBrands}
        settings={mockSettings}
        theme={lightTheme}
        themeMode="light"
        onNavigate={vi.fn()}
        onSelectProduct={vi.fn()}
        onWhatsApp={handleWhatsApp}
        onCall={handleCall}
        onAddToCart={handleAddToCart}
        onToggleFavorite={handleFavorite}
        onToggleCompare={handleCompare}
      />
    );

    const waBtn = screen.getAllByText(/WhatsApp ilə Sifariş et/i)[0];
    fireEvent.click(waBtn);
    expect(handleWhatsApp).toHaveBeenCalledWith(mockProduct);

    const callBtn = screen.getAllByText('Zəng et')[0];
    fireEvent.click(callBtn);
    expect(handleCall).toHaveBeenCalledWith(mockProduct);

    const cartBtn = screen.getAllByText('Səbətə əlavə et')[0];
    fireEvent.click(cartBtn);
    expect(handleAddToCart).toHaveBeenCalledWith(mockProduct);

    const favBtn = screen.getAllByText(/Seçilmişlərə at/i)[0];
    fireEvent.click(favBtn);
    expect(handleFavorite).toHaveBeenCalledWith(mockProduct);

    const compareBtn = screen.getAllByText('Müqayisə et')[0];
    fireEvent.click(compareBtn);
    expect(handleCompare).toHaveBeenCalledWith(mockProduct);
  });

  it('3. Switches between specifications, technologies, and delivery tabs', () => {
    render(
      <ProductDetailPage
        product={mockProduct}
        allProducts={mockAllProducts}
        categories={mockCategories}
        brands={mockBrands}
        settings={mockSettings}
        theme={lightTheme}
        themeMode="light"
        onNavigate={vi.fn()}
        onSelectProduct={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
      />
    );

    // Default tab: Specs
    expect(screen.getByText('Mühərrik və Güc')).toBeDefined();
    expect(screen.getByText('1200 dövr/dəq')).toBeDefined();

    // Click Tech tab
    const techTab = screen.getByRole('button', { name: /Üstünlüklər & Texnologiyalar/i });
    fireEvent.click(techTab);
    expect(screen.getByText(/Rəsmi İtaliya & Avropa Texnologiyası/i)).toBeDefined();

    // Click Delivery tab
    const deliveryTab = screen.getByRole('button', { name: /Çatdırılma & Zəmanət/i });
    fireEvent.click(deliveryTab);
    expect(screen.getByText(/Çatdırılma Şərtləri/i)).toBeDefined();
    expect(screen.getByText(/Sədərək TM, Sıra 5, Mağaza 40/i)).toBeDefined();
  });

  it('4. Renders recommended products section below', () => {
    const handleSelectProduct = vi.fn();
    render(
      <ProductDetailPage
        product={mockProduct}
        allProducts={mockAllProducts}
        categories={mockCategories}
        brands={mockBrands}
        settings={mockSettings}
        theme={lightTheme}
        themeMode="light"
        onNavigate={vi.fn()}
        onSelectProduct={handleSelectProduct}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
      />
    );

    expect(screen.getAllByText(/Tövsiyə Olunan Modellər/i).length).toBeGreaterThan(0);
    expect(screen.getByText('ARDO 9kq Paltaryuyan İnverter')).toBeDefined();
  });
});
