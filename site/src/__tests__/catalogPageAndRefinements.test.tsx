import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BannerHero } from '../components/BannerHero';
import { SiteHeader } from '../components/site/SiteHeader';
import { CatalogPage } from '../pages/CatalogPage';
import { lightTheme } from '../types/theme';
import { CatalogCategory, Brand, Product, CatalogSettings } from '../types/product';

afterEach(cleanup);

const mockCategories: CatalogCategory[] = [
  { id: 'washing_machine', name: 'Paltaryuyanlar', active: true, sortOrder: 1 },
  { id: 'refrigerator', name: 'Soyuducular', active: true, sortOrder: 2 },
  { id: 'built_in_oven', name: 'Quraşdırılan Sobalar', active: true, sortOrder: 3 },
  { id: 'airfryer', name: 'Airfryer', active: true, sortOrder: 4 },
];

const mockBrands: Brand[] = [
  { id: 'ardo', name: 'ARDO', active: true, originCountry: 'İtaliya', logo: '/media/brands/ardo-logo.png' },
  { id: 'lotus', name: 'Lotus', active: true, originCountry: 'Türkiyə', logo: '/media/brands/lotus-logo.png' },
  { id: 'artel', name: 'Artel', active: true, originCountry: 'Özbəkistan', logo: '/media/brands/artel-logo.svg' },
];

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    modelCode: 'ARDO-WM-01',
    title: 'ARDO 9kq Paltaryuyan İnverter',
    category: 'washing_machine',
    brandId: 'ardo',
    price: 1100,
    oldPrice: 1300,
    status: 'published',
    images: ['/media/ardo-wm.jpg'],
    specifications: { 'Enerji sinfi': 'A+++', 'Mühərrik': 'İnverter' },
  },
  {
    id: 'prod-2',
    modelCode: 'LOTUS-AF-01',
    title: 'Lotus Dual Zone Airfryer',
    category: 'airfryer',
    brandId: 'lotus',
    price: 350,
    status: 'published',
    images: ['/media/lotus-af.jpg'],
    videoUrl: '/media/lotus-af.mp4',
    specifications: { 'Rəng': 'Qara' },
  },
  {
    id: 'prod-3',
    modelCode: 'ARTEL-REF-01',
    title: 'Artel NoFrost Soyuducu',
    category: 'refrigerator',
    brandId: 'artel',
    price: 850,
    status: 'published',
    images: ['/media/artel-ref.jpg'],
    specifications: { 'Enerji sinfi': 'A+' },
  },
];

const mockSettings: CatalogSettings = {
  companyName: 'Sahara Electronics',
  heroBannerTitle: 'Sahara Keyfiyyəti',
  heroBannerSubtitle: 'Müasir Məişət Texnikası',
};

describe('BannerHero Edge Dissolve & Boundary-Free Masking', () => {
  it('renders video element with borderless styling and edge dissolve masks', () => {
    const { container } = render(
      <BannerHero
        theme={lightTheme}
        articles={[]}
        onOpenArticle={vi.fn()}
        onNavigateCatalog={vi.fn()}
      />
    );

    const videoEl = container.querySelector('video');
    expect(videoEl).toBeTruthy();
    expect(videoEl?.getAttribute('src')).toBe('/media/Videosahara.mp4');

    const heroCard = container.querySelector('.banner-hero-card') as HTMLElement;
    expect(heroCard).toBeTruthy();
    expect(heroCard.style.border).toMatch(/none/);
    expect(heroCard.style.boxShadow).toBe('none');
  });
});

describe('SiteHeader Kataloq Mega Preview', () => {
  it('renders Kataloq navigation and displays brand logos on interaction', () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <SiteHeader
        currentRoute="home"
        onNavigate={onNavigate}
        categories={mockCategories}
        brands={mockBrands}
        products={mockProducts}
        settings={mockSettings}
        theme={lightTheme}
        themeMode="light"
        onToggleTheme={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenSearchModal={vi.fn()}
        comparisonCount={0}
        favoritesCount={0}
        onOpenSaharaMatch={vi.fn()}
        onOpenDrawer={vi.fn()}
      />
    );

    const catalogNavBtn = container.querySelector('.mega-menu-trigger-btn') as HTMLElement;
    expect(catalogNavBtn).toBeTruthy();

    // Hover over Kataloq to trigger mega menu
    fireEvent.mouseEnter(catalogNavBtn);
    expect(screen.getAllByText(/Böyük Məişət/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Rəsmi Brendlər/i)).toBeTruthy();
  });
});

describe('CatalogPage Rich Filters & Navigation', () => {
  it('renders products and filters by category when clicked', () => {
    const onSelectProduct = vi.fn();
    render(
      <CatalogPage
        products={mockProducts}
        categories={mockCategories}
        brands={mockBrands}
        settings={mockSettings}
        theme={lightTheme}
        themeMode="light"
        onSelectProduct={onSelectProduct}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onShare={vi.fn()}
        onCopyLink={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    // Initial load: 3 products
    expect(screen.getAllByText(/ARDO 9kq Paltaryuyan İnverter/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Lotus Dual Zone Airfryer/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Artel NoFrost Soyuducu/i).length).toBeGreaterThan(0);

    // Click on Airfryer quick pill
    const airfryerPills = screen.getAllByRole('button', { name: /Airfryer/i });
    fireEvent.click(airfryerPills[0]);

    // Only Airfryer should remain
    expect(screen.getAllByText(/Lotus Dual Zone Airfryer/i).length).toBeGreaterThan(0);
    expect(screen.queryByText('ARDO 9kq Paltaryuyan İnverter')).toBeNull();
  });

  it('filters by brand checkboxes correctly', () => {
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

    // Expand collapsed Rəsmi Brendlər section then check ARDO checkbox in sidebar
    const brandsHeader = screen.getByText(/Rəsmi Brendlər/i);
    fireEvent.click(brandsHeader);

    const ardoCheckboxes = screen.getAllByLabelText(/ARDO brendini seç/i);
    fireEvent.click(ardoCheckboxes[0]);

    expect(screen.getAllByText(/ARDO 9kq Paltaryuyan İnverter/i).length).toBeGreaterThan(0);
    expect(screen.queryByText('Lotus Dual Zone Airfryer')).toBeNull();
  });

  it('filters by discount switch correctly', () => {
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

    const discountCheckboxes = screen.getAllByLabelText(/Yalnız endirimli modellər/i);
    fireEvent.click(discountCheckboxes[0]);

    // Only ARDO has oldPrice > price
    expect(screen.getAllByText(/ARDO 9kq Paltaryuyan İnverter/i).length).toBeGreaterThan(0);
    expect(screen.queryByText('Artel NoFrost Soyuducu')).toBeNull();
  });
});
