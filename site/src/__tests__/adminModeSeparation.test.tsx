// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AdminShell } from '../components/admin/AdminShell';
import { DEFAULT_CATALOG } from '../data/catalog';
import { lightTheme } from '../types/theme';

afterEach(cleanup);

const mockAdminPayload = {
  ...DEFAULT_CATALOG,
  analytics: {
    catalogViews: 10,
    productViews: {},
    contactActions: { whatsapp: 2, call: 1 },
    contactActionsByProduct: {},
  },
  csrfToken: 'mock-csrf-token',
};

describe('Admin Panel Mode Separation (Site CMS vs Catalog PIM)', () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onPublish = vi.fn().mockResolvedValue(undefined);
  const onUpload = vi.fn().mockResolvedValue({ id: 'm1', type: 'image', url: '/test.jpg' });
  const onLogout = vi.fn().mockResolvedValue(undefined);
  const showToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Site CMS mode by default with only website management tabs', () => {
    render(
      <AdminShell
        initial={mockAdminPayload}
        theme={lightTheme}
        mode="site"
        onSave={onSave}
        onPublish={onPublish}
        onUpload={onUpload}
        onLogout={onLogout}
        showToast={showToast}
      />
    );

    // Site tabs should be present (including Products and Sayt Statistikası)
    expect(screen.getByRole('button', { name: /Sayt Statistikası/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Məhsullar \(Modellər\)/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Naviqasiya \(CMS\)/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Görünüş & Mətnlər/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Əlaqə & Filiallar/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Müştəri Çatı/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Loglama \(Audit\)/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Təhlükəsizlik & Şifrə/i })).toBeDefined();

    // Catalog-only tabs should NOT be in the site sidebar navigation
    expect(screen.queryByRole('button', { name: /Brend Lenti/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Bərpa & Nüsxələr/i })).toBeNull();

    // Live preview action
    expect(screen.getByText('Canlı Sayta Bax')).toBeDefined();
  });

  it('renders Catalog PIM mode with only product catalog management tabs', () => {
    render(
      <AdminShell
        initial={mockAdminPayload}
        theme={lightTheme}
        mode="catalog"
        onSave={onSave}
        onPublish={onPublish}
        onUpload={onUpload}
        onLogout={onLogout}
        showToast={showToast}
      />
    );

    // Catalog tabs should be present (including Statistika, Products, unified Brands, Appearance, Contact, Logs, Security)
    expect(screen.getByRole('button', { name: /^Statistika$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Məhsullar \(Modellər\)/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Kateqoriyalar/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Brendlər/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Görünüş & Mətnlər/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Texnologiyalar \(i\)/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Əlaqə & Filiallar/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Bərpa & Nüsxələr/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Loglama \(Audit\)/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Təhlükəsizlik & Şifrə/i })).toBeDefined();

    // Site-exclusive tabs should NOT be in catalog navigation
    expect(screen.queryByRole('button', { name: /Naviqasiya \(CMS\)/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Müştəri Çatı/i })).toBeNull();

    // Live preview action
    expect(screen.getByText('Kataloq Önbaxış')).toBeDefined();
  });

  it('smoothly switches between Site CMS and Catalog PIM via the segmented mode switcher', () => {
    render(
      <AdminShell
        initial={mockAdminPayload}
        theme={lightTheme}
        mode="site"
        onSave={onSave}
        onPublish={onPublish}
        onUpload={onUpload}
        onLogout={onLogout}
        showToast={showToast}
      />
    );

    // Initially in Site mode
    expect(screen.getByRole('button', { name: /Naviqasiya \(CMS\)/i })).toBeDefined();

    // Switch to Catalog mode
    const catalogModeBtn = screen.getByRole('button', { name: /Kataloq \(PIM\)/i });
    fireEvent.click(catalogModeBtn);

    // Now in Catalog mode
    expect(screen.getByRole('button', { name: /Məhsullar \(Modellər\)/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Naviqasiya \(CMS\)/i })).toBeNull();

    // Switch back to Site mode
    const siteModeBtn = screen.getByRole('button', { name: /Sayt \(CMS\)/i });
    fireEvent.click(siteModeBtn);

    // Back in Site mode
    expect(screen.getByRole('button', { name: /Naviqasiya \(CMS\)/i })).toBeDefined();
  });

  it('correctly resolves getAppMode for various URL query formats including ?mode=catalog/AdministratorNT', async () => {
    const { getAppMode } = await import('../App');

    // Scenario 1: ?mode=catalog/AdministratorNT
    delete (window as any).location;
    window.location = new URL('http://localhost:5174/?mode=catalog/AdministratorNT') as any;
    expect(getAppMode()).toBe('catalog');

    // Scenario 2: /AdministratorNT?mode=catalog
    window.location = new URL('http://localhost:5174/AdministratorNT?mode=catalog') as any;
    expect(getAppMode()).toBe('catalog');

    // Scenario 3: /AdministratorNT (Site mode)
    window.location = new URL('http://localhost:5174/AdministratorNT') as any;
    expect(getAppMode()).toBe('site');
  });

  it('filters out site products and isolates catalog brands (ARDO, ARTEL, LOTUS) in Catalog mode', () => {
    const mixedPayload = {
      ...mockAdminPayload,
      brands: [
        {
          id: 'ardo',
          name: 'ARDO',
          slug: 'ardo',
          originCountry: 'İtaliya',
          manufacturingCountries: ['İtaliya'],
          active: true,
        },
        {
          id: 'artel',
          name: 'ARTEL',
          slug: 'artel',
          originCountry: 'Özbəkistan',
          manufacturingCountries: ['Özbəkistan'],
          active: true,
        },
        {
          id: 'bosch',
          name: 'Bosch',
          slug: 'bosch',
          originCountry: 'Almaniya',
          manufacturingCountries: ['Almaniya'],
          active: true,
        },
        {
          id: 'samsung',
          name: 'Samsung',
          slug: 'samsung',
          originCountry: 'Cənubi Koreya',
          manufacturingCountries: ['Cənubi Koreya'],
          active: true,
        },
      ],
      products: [
        {
          id: 'p-ardo-1',
          code: 'ARDO-100',
          title: 'ARDO Soyuducu',
          brandId: 'ardo',
          category: 'fridge',
          categoryName: 'Soyuducular',
          image: '/test-ardo.jpg',
          shortDesc: '',
          specs: [],
          highlights: [],
          status: 'published' as const,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'p-bosch-1',
          code: 'BOSCH-900',
          title: 'Bosch Paltaryuyan',
          brandId: 'bosch',
          category: 'washing',
          categoryName: 'Paltaryuyanlar',
          image: '/test-bosch.jpg',
          shortDesc: '',
          specs: [],
          highlights: [],
          status: 'published' as const,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    };

    render(
      <AdminShell
        initial={mixedPayload}
        theme={lightTheme}
        mode="catalog"
        onSave={onSave}
        onPublish={onPublish}
        onUpload={onUpload}
        onLogout={onLogout}
        showToast={showToast}
      />
    );

    // Click on products tab
    fireEvent.click(screen.getByRole('button', { name: /Məhsullar \(Modellər\)/i }));

    // ARDO product must be present
    expect(screen.getByText('ARDO Soyuducu')).toBeDefined();
    expect(screen.getByText('ARDO-100')).toBeDefined();

    // Bosch site product must NOT be present in Catalog mode
    expect(screen.queryByText('Bosch Paltaryuyan')).toBeNull();
    expect(screen.queryByText('BOSCH-900')).toBeNull();
  });

  it('isolates analytics and statistics strictly to catalog brands and products in Catalog mode', () => {
    const mixedAnalyticsPayload = {
      ...mockAdminPayload,
      brands: [
        {
          id: 'ardo',
          name: 'ARDO',
          slug: 'ardo',
          originCountry: 'İtaliya',
          manufacturingCountries: ['İtaliya'],
          active: true,
        },
        {
          id: 'artel',
          name: 'ARTEL',
          slug: 'artel',
          originCountry: 'Özbəkistan',
          manufacturingCountries: ['Özbəkistan'],
          active: true,
        },
        {
          id: 'lotus',
          name: 'LOTUS',
          slug: 'lotus',
          originCountry: 'Türkiyə',
          manufacturingCountries: ['Türkiyə'],
          active: true,
        },
        {
          id: 'bosch',
          name: 'Bosch',
          slug: 'bosch',
          originCountry: 'Almaniya',
          manufacturingCountries: ['Almaniya'],
          active: true,
        },
      ],
      products: [
        {
          id: 'p-ardo-1',
          code: 'ARDO-100',
          title: 'ARDO Soyuducu 100',
          brandId: 'ardo',
          category: 'fridge',
          categoryName: 'Soyuducular',
          image: '/test-ardo.jpg',
          shortDesc: '',
          specs: [],
          highlights: [],
          status: 'published' as const,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'p-bosch-1',
          code: 'BOSCH-900',
          title: 'Bosch Paltaryuyan 900',
          brandId: 'bosch',
          category: 'washing',
          categoryName: 'Paltaryuyanlar',
          image: '/test-bosch.jpg',
          shortDesc: '',
          specs: [],
          highlights: [],
          status: 'published' as const,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      analytics: {
        catalogViews: 100,
        productViews: {
          'p-ardo-1': 45,
          'p-bosch-1': 999, // Should NOT leak into catalog stats
        },
        contactActions: { whatsapp: 50, call: 20 },
        contactActionsByProduct: {
          'p-ardo-1': { whatsapp: 10, call: 5 },
          'p-bosch-1': { whatsapp: 100, call: 80 },
        },
      },
    };

    render(
      <AdminShell
        initial={mixedAnalyticsPayload}
        theme={lightTheme}
        mode="catalog"
        onSave={onSave}
        onPublish={onPublish}
        onUpload={onUpload}
        onLogout={onLogout}
        showToast={showToast}
      />
    );

    // Switch to Dashboard / Statistics
    fireEvent.click(screen.getByRole('button', { name: /^Statistika$/i }));

    // Verify ARDO is shown in Brand Distribution
    expect(screen.getByText('Brendlər və Əlaqə Kanalları')).toBeDefined();
    expect(screen.getByText('ARDO')).toBeDefined();

    // Verify Bosch does NOT appear in Brand Distribution or Top products in Catalog mode
    expect(screen.queryByText('Bosch')).toBeNull();
    expect(screen.queryByText('Bosch Paltaryuyan 900')).toBeNull();
  });

  it('isolates BrandsRegistry and BrandRail to catalog brands in Catalog mode', async () => {
    const mockBrandsList = [
      {
        id: 'ardo',
        name: 'ARDO',
        slug: 'ardo',
        active: true,
        verificationStatus: 'verified',
        sortOrder: 1,
      },
      {
        id: 'artel',
        name: 'ARTEL',
        slug: 'artel',
        active: true,
        verificationStatus: 'verified',
        sortOrder: 2,
      },
      {
        id: 'lotus',
        name: 'LOTUS',
        slug: 'lotus',
        active: true,
        verificationStatus: 'verified',
        sortOrder: 3,
      },
      {
        id: 'bosch',
        name: 'Bosch',
        slug: 'bosch',
        active: true,
        verificationStatus: 'verified',
        sortOrder: 4,
      },
    ];

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/admin/brands')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ brands: mockBrandsList }),
        } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });

    try {
      render(
        <AdminShell
          initial={mockAdminPayload}
          theme={lightTheme}
          mode="catalog"
          onSave={onSave}
          onPublish={onPublish}
          onUpload={onUpload}
          onLogout={onLogout}
          showToast={showToast}
        />
      );

      // Click on Brands tab
      fireEvent.click(screen.getByRole('button', { name: /Brendlər/i }));

      // Wait for async brand render
      expect(await screen.findByText('ARDO')).toBeDefined();
      expect(await screen.findByText('ARTEL')).toBeDefined();
      expect(await screen.findByText('LOTUS')).toBeDefined();

      // Bosch is filtered out
      expect(screen.queryByText('Bosch')).toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
