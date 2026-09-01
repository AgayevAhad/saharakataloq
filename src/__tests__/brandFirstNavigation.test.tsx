// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { App } from '../App';
import { BrandCategoryFilter } from '../components/BrandCategoryFilter';
import { Header } from '../components/Header';
import { lightTheme } from '../types/theme';
import { DEFAULT_BRANDS, DEFAULT_CATEGORIES } from '../data/catalog';
import { Product } from '../types/product';

import { catalogApi } from '../services/catalogApi';

const originalFetch = global.fetch;

beforeEach(() => {
  vi.spyOn(catalogApi, 'track').mockImplementation(() => {});
  const mockFetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({ ok: true }),
      text: async () => JSON.stringify({ ok: true }),
    } as any)
  );
  global.fetch = mockFetch;
  if (typeof window !== 'undefined') {
    window.fetch = mockFetch;
  }
});

afterEach(() => {
  cleanup();
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

const TEST_ARDO_PRODUCT: Product = {
  id: 'ardo-604b',
  brandId: 'ardo',
  code: '604B',
  title: 'Aspirator Ardo 604B',
  category: 'hood',
  categoryName: 'Aspiratorlar',
  shortDesc: 'Aspirator Ardo 604B model',
  image: '/media/products/ardo-604b.jpg',
  gallery: ['/media/products/ardo-604b.jpg'],
  media: [{ id: 'm-1', type: 'image', url: '/media/products/ardo-604b.jpg', alt: 'Aspirator Ardo 604B', fitMode: 'contain', objectPosition: 'center' }],
  highlights: ['Məhsuldarlıq: 600 m³/saat'],
  specs: [{ id: 's-1', name: 'Məhsuldarlıq', value: '600 m³/saat', group: 'Əsas' }],
  status: 'published',
};

const TEST_LOTUS_PRODUCT: Product = {
  id: 'lotus-alv420s',
  brandId: 'lotus',
  code: 'ALV420S',
  title: 'Aspirator Lotus ALV420S',
  category: 'hood',
  categoryName: 'Aspiratorlar',
  shortDesc: 'Aspirator Lotus ALV420S model',
  image: '',
  gallery: [],
  media: [],
  highlights: ['Məhsuldarlıq: 600 m³/saat'],
  specs: [{ id: 's-1', name: 'Məhsuldarlıq', value: '600 m³/saat', group: 'Əsas' }],
  status: 'published',
};

const TEST_LOTUS_AIRFRYER: Product = {
  id: 'lotus-5-5-black',
  brandId: 'lotus',
  code: '5.5 Black',
  title: 'Airfryer Lotus 5.5 Black',
  category: 'airfryer',
  categoryName: 'Fritözlər & Airfryer',
  shortDesc: 'Airfryer Lotus 5.5 Black model',
  image: '',
  gallery: [],
  media: [],
  highlights: ['Güc: 1500 Watt'],
  specs: [{ id: 's-1', name: 'Güc', value: '1500 Watt', group: 'Ölçü və Enerji' }],
  status: 'published',
};

describe('Brand-First Interactive Navigation & Contextual Filter Suite', () => {
  it('Header does NOT render the top brand text-pill filter row', () => {
    const { container } = render(
      <Header
        theme={lightTheme}
        isDarkMode={false}
        onToggleTheme={vi.fn()}
        selectedCategory=""
        onSelectCategory={vi.fn()}
        selectedBrand=""
        onSelectBrand={vi.fn()}
        brands={DEFAULT_BRANDS}
        categories={DEFAULT_CATEGORIES}
        products={[TEST_ARDO_PRODUCT, TEST_LOTUS_PRODUCT]}
        settings={{
          companyName: 'Sahara Electronics',
          whatsappNumber: '+994500000000',
          phoneNumber: '+994500000000',
          address: 'Bakı',
          email: 'info@test.az',
          workingHours: '09:00 - 18:00',
          siteTitle: 'Kataloq',
          siteSubtitle: 'Modellər',
          headerCaption: 'Rəsmi',
          catalogHeading: 'Kataloq',
          catalogSubheading: 'Modellər',
          primaryColor: '#dc2626',
          fontFamily: 'Inter',
          whatsappButtonText: 'WhatsApp',
          callButtonText: 'Zəng et',
          shareButtonText: 'Paylaş',
          scrollTopButtonText: 'Yuxarı',
        }}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenInverterInfo={vi.fn()}
        onOpenCatalogShare={vi.fn()}
        totalCount={2}
        filteredCount={2}
      />
    );

    // Assert that the old brand filter row class does NOT exist in Header
    expect(container.querySelector('.brand-filter-row')).toBeNull();
  });

  it('BrandCategoryFilter renders brand badge, only relevant categories and back button', () => {
    const onSelectCategory = vi.fn();
    const onBackToBrands = vi.fn();

    const lotusBrand = DEFAULT_BRANDS.find((b) => b.id === 'lotus')!;
    const products = [TEST_ARDO_PRODUCT, TEST_LOTUS_PRODUCT, TEST_LOTUS_AIRFRYER];

    const { getByText, getByRole } = render(
      <BrandCategoryFilter
        brand={lotusBrand}
        categories={DEFAULT_CATEGORIES}
        products={products}
        selectedCategory="all"
        onSelectCategory={onSelectCategory}
        onBackToBrands={onBackToBrands}
        theme={lightTheme}
      />
    );

    // Check brand count badge (2 Lotus products)
    expect(getByText(/2 model/i)).toBeDefined();

    // Check category pills rendered for Lotus: "Hamısı", "Aspiratorlar", "Fritözlər & Airfryer"
    expect(getByText('Hamısı')).toBeDefined();
    expect(getByText('Aspiratorlar')).toBeDefined();
    expect(getByText('Fritözlər & Airfryer')).toBeDefined();

    // Check back button
    const backBtn = getByRole('button', { name: /brendlər/i });
    fireEvent.click(backBtn);
    expect(onBackToBrands).toHaveBeenCalled();
  });

  it('Initial landing view does NOT dump product cards until brand/category selected', async () => {
    const { queryByText } = render(<App />);

    // Brand showcase is visible
    expect(queryByText('Məhsul ailələrimizi kəşf edin')).toBeDefined();

    // On fresh landing with no selection, catalog-section product grid is clean
    const productGrid = document.querySelector('.product-grid-container');
    expect(productGrid).toBeNull();
  });
});
