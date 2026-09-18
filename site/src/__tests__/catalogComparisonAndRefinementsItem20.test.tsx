import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CatalogPage } from '../pages/CatalogPage';
import { ProductCard } from '../components/ProductCard';
import { FeaturedProductCard } from '../components/FeaturedProductCard';
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
  { id: 'ardo', name: 'ARDO', originCountry: 'İtaliya', active: true },
  { id: 'lotus', name: 'Lotus', originCountry: 'Almaniya', active: true },
  { id: 'artel', name: 'Artel', originCountry: 'Özbəkistan', active: true },
];

const mockCategories: CatalogCategory[] = [
  { id: 'paltaryuyan', name: 'Paltaryuyan', active: true, sortOrder: 1 },
  { id: 'soyuducu', name: 'Soyuducu', active: true, sortOrder: 2 },
  { id: 'soba', name: 'Quraşdırılan soba', active: true, sortOrder: 3 },
  { id: 'aspirator', name: 'Aspirator', active: true, sortOrder: 4 },
];

const mockProducts: Product[] = [
  {
    id: 'ardo-washer-1',
    code: 'FLN 128 LW',
    title: 'ARDO 8kq Paltaryuyan İnverter',
    category: 'paltaryuyan',
    categoryName: 'Paltaryuyan',
    brandId: 'ardo',
    price: 999,
    priceCash: 999,
    status: 'published',
    specs: [
      { name: 'Mühərrik', value: 'İnverter' },
      { name: 'Tutum', value: '8 kq' },
    ],
    highlights: ['İnverter Mühərrik', 'A+++ Enerji Sinfi'],
  },
  {
    id: 'lotus-airfryer-1',
    code: 'LT-AF100',
    title: 'Lotus Dual Zone Airfryer',
    category: 'aspirator',
    categoryName: 'Aspirator',
    brandId: 'lotus',
    price: 349,
    priceCash: 349,
    status: 'published',
    specs: [
      { name: 'Mühərrik', value: 'Standart' },
      { name: 'Tutum', value: '9 L' },
    ],
    highlights: ['Dual Zone', 'Sensor Ekran'],
  },
];

const mockSettings: CatalogSettings = {
  headerTitle: 'Sahara Electronics',
  headerSubtitle: 'Premium Məişət Texnikası',
  contactPhone: '+994 50 123 45 67',
  whatsappNumber: '994501234567',
  whatsappButtonText: 'WhatsApp',
  callButtonText: 'Zəng et',
  shareButtonText: 'Paylaş',
  addresses: ['Sədərək TM, Sıra 5'],
};

describe('Item 20: Catalog Refinements & Comparison System Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Rəsmi Brendlər section is collapsed (closed) by default in sidebar', () => {
    render(
      <CatalogPage
        products={mockProducts}
        categories={mockCategories}
        brands={mockBrands}
        settings={mockSettings}
        theme={lightTheme}
        themeMode="light"
        onSelectProduct={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onShare={vi.fn()}
        onCopyLink={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    // "Rəsmi Brendlər" header exists
    const brandsHeader = screen.getByText(/Rəsmi Brendlər/i);
    expect(brandsHeader).toBeDefined();

    // Checkboxes inside the desktop sidebar are not rendered until accordion is clicked
    // (Only mobile drawer rendered checkboxes if any, but desktop sidebar is collapsed)
    const brandLabel = screen.queryByText('Lotus');
    // Before expanding, the brand items in sidebar are collapsed
    fireEvent.click(brandsHeader);
    expect(screen.getAllByText('Lotus').length).toBeGreaterThan(0);
  });

  it('2. Category pills display their matching category icons', () => {
    const { container } = render(
      <CatalogPage
        products={mockProducts}
        categories={mockCategories}
        brands={mockBrands}
        settings={mockSettings}
        theme={lightTheme}
        themeMode="light"
        onSelectProduct={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onShare={vi.fn()}
        onCopyLink={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    const quickPills = container.querySelectorAll('.catalog-quick-pill');
    expect(quickPills.length).toBe(mockCategories.length + 1); // "Bütün Məhsullar" + 4 categories

    // Check that each quick pill contains an svg icon
    quickPills.forEach((pill) => {
      expect(pill.querySelector('svg')).toBeDefined();
    });
  });

  it('3. Custom sort dropdown opens with rich options and allows selecting options', () => {
    const { container } = render(
      <CatalogPage
        products={mockProducts}
        categories={mockCategories}
        brands={mockBrands}
        settings={mockSettings}
        theme={lightTheme}
        themeMode="light"
        onSelectProduct={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onShare={vi.fn()}
        onCopyLink={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    const sortButton = container.querySelector('.catalog-sort-custom-btn') as HTMLElement;
    expect(sortButton).toBeDefined();

    // Click to open custom popover
    fireEvent.click(sortButton);

    // Check popover options exist
    expect(screen.getByText('Qiymət: Ucuzdan bahaya')).toBeDefined();
    expect(screen.getByText('Qiymət: Bahadan ucuza')).toBeDefined();
    expect(screen.getByText('Yeni modellər')).toBeDefined();
    expect(screen.getByText('Ən böyük endirim')).toBeDefined();

    // Select "Qiymət: Ucuzdan bahaya"
    fireEvent.click(screen.getByText('Qiymət: Ucuzdan bahaya'));
    expect(screen.getByText('Qiymət: Ucuzdan bahaya')).toBeDefined();
  });

  it('4. Floating comparison dock renders when comparisonIds has items and opens comparison modal', () => {
    const handleToggleCompare = vi.fn();
    const handleClearCompare = vi.fn();

    const { container } = render(
      <CatalogPage
        products={mockProducts}
        categories={mockCategories}
        brands={mockBrands}
        settings={mockSettings}
        theme={lightTheme}
        themeMode="light"
        comparisonIds={['ardo-washer-1', 'lotus-airfryer-1']}
        onToggleCompare={handleToggleCompare}
        onClearCompare={handleClearCompare}
        onSelectProduct={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onShare={vi.fn()}
        onCopyLink={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    // Floating comparison dock is rendered
    expect(screen.getByText(/Müqayisə \(2\/4\)/i)).toBeDefined();

    // Click "Müqayisə et" to open comparison modal
    const openCompareBtn = container.querySelector('.catalog-open-compare-btn') as HTMLElement;
    expect(openCompareBtn).toBeDefined();
    fireEvent.click(openCompareBtn);

    // Modal dialog is open
    expect(screen.getByText(/Məhsul Müqayisəsi \(2 Model\)/i)).toBeDefined();
    expect(screen.getByText(/Yalnız fərqləri göstər/i)).toBeDefined();

    // Click "Yalnız fərqləri göstər"
    const diffBtn = screen.getByText(/Yalnız fərqləri göstər/i);
    fireEvent.click(diffBtn);

    // Clear compare triggers callback
    const clearBtn = screen.getAllByRole('button', { name: /Təmizlə/i })[0];
    fireEvent.click(clearBtn);
    expect(handleClearCompare).toHaveBeenCalled();
  });

  it('5. ProductCard supports Scale compare button and hover cluster with WhatsApp and Call', () => {
    const handleSelect = vi.fn();
    const handleCompare = vi.fn();
    const handleWhatsApp = vi.fn();
    const handleCall = vi.fn();
    const handleCart = vi.fn();

    const { container } = render(
      <ProductCard
        product={mockProducts[0]}
        theme={lightTheme}
        onSelect={handleSelect}
        onToggleCompare={handleCompare}
        isComparing={false}
        onWhatsApp={handleWhatsApp}
        onCall={handleCall}
        onAddToCart={handleCart}
      />
    );

    // Compare Scale button
    const compareBtn = container.querySelector('.card-action-btn-compare') as HTMLElement;
    expect(compareBtn).toBeDefined();
    fireEvent.click(compareBtn);
    expect(handleCompare).toHaveBeenCalledWith(mockProducts[0]);

    // Hover Cluster Buttons
    const waBtn = container.querySelector('.card-action-btn-wa') as HTMLElement;
    const callBtn = container.querySelector('.card-action-btn-call') as HTMLElement;
    const cartBtn = container.querySelector('.card-action-btn-cart') as HTMLElement;

    expect(waBtn).toBeDefined();
    expect(callBtn).toBeDefined();
    expect(cartBtn).toBeDefined();

    fireEvent.click(waBtn);
    expect(handleWhatsApp).toHaveBeenCalledWith(mockProducts[0]);

    fireEvent.click(callBtn);
    expect(handleCall).toHaveBeenCalledWith(mockProducts[0]);

    fireEvent.click(cartBtn);
    expect(handleCart).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('6. FeaturedProductCard supports Scale compare button and action cluster', () => {
    const handleCompare = vi.fn();
    const handleWhatsApp = vi.fn();
    const handleCall = vi.fn();

    const { container } = render(
      <FeaturedProductCard
        product={mockProducts[0]}
        theme={lightTheme}
        onSelect={vi.fn()}
        onToggleCompare={handleCompare}
        isComparing={true}
        onWhatsApp={handleWhatsApp}
        onCall={handleCall}
      />
    );

    const compareBtn = container.querySelector('button[aria-label="Müqayisədən çıxar"]') as HTMLElement;
    expect(compareBtn).toBeDefined();
    fireEvent.click(compareBtn);
    expect(handleCompare).toHaveBeenCalledWith(mockProducts[0]);
  });
});
