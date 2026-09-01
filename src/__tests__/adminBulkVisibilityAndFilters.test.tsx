// @vitest-environment happy-dom
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CatalogAdmin } from '../components/CatalogAdmin';
import { AdminPayload } from '../services/catalogApi';
import { lightTheme } from '../types/theme';
import { Product } from '../types/product';

const originalFetch = global.fetch;

beforeEach(() => {
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
});

describe('Admin Bulk Visibility Actions & Enhanced Filter Suite', () => {
  const sampleProducts: Product[] = [
    {
      id: 'p-1',
      code: 'AR-HAS-IMG',
      title: 'Məhsul Şəkilli və Parametrli',
      category: 'cooktop',
      categoryName: 'Bişirmə Panelləri',
      brandId: 'ardo',
      image: '/media/products/1.jpg',
      media: [
        { id: 'm1', type: 'image', url: '/media/products/1.jpg', fitMode: 'contain', objectPosition: 'center' },
        { id: 'm2', type: 'image', url: '/media/products/2.jpg', fitMode: 'contain', objectPosition: 'center' },
      ],
      specs: [{ id: 's1', name: 'Göz', value: '4', group: 'Əsas' }],
      price: 650,
      stockStatus: 'in_stock',
      status: 'published',
      shortDesc: '',
      highlights: [],
    },
    {
      id: 'p-2',
      code: 'AR-NO-IMG',
      title: 'Məhsul Şəkilsiz və Parametrsiz',
      category: 'cooktop',
      categoryName: 'Bişirmə Panelləri',
      brandId: 'ardo',
      image: '',
      media: [],
      specs: [],
      price: 0,
      stockStatus: 'out_of_stock',
      status: 'published', // initially published to test unpublishing
      shortDesc: '',
      highlights: [],
    },
    {
      id: 'p-3',
      code: 'LT-SINGLE-IMG',
      title: 'Lotus Tək Şəkilli Parametrsiz',
      category: 'oven',
      categoryName: 'Sobalar',
      brandId: 'lotus',
      image: '/media/products/3.jpg',
      media: [{ id: 'm3', type: 'image', url: '/media/products/3.jpg', fitMode: 'contain', objectPosition: 'center' }],
      specs: [],
      price: 450,
      stockStatus: 'preorder',
      status: 'draft',
      shortDesc: '',
      highlights: [],
    },
  ];

  const initialPayload: AdminPayload = {
    brands: [
      { id: 'ardo', name: 'ARDO', slug: 'ardo', active: true, originCountry: 'İtaliya', manufacturingCountries: ['İtaliya'] },
      { id: 'lotus', name: 'LOTUS', slug: 'lotus', active: true, originCountry: 'Türkiyə', manufacturingCountries: ['Türkiyə'] },
    ],
    categories: [
      { id: 'cooktop', name: 'Bişirmə Panelləri', slug: 'cooktop', active: true },
      { id: 'oven', name: 'Sobalar', slug: 'oven', active: true },
    ],
    products: sampleProducts,
    settings: {
      companyName: 'Sahara',
      whatsappNumber: '+994500000000',
      phoneNumbers: ['+994120000000'],
      addresses: [{ id: 'a1', title: 'Əsas Salon', address: 'Bakı', city: 'Bakı', isMain: true }],
      bannerSlides: [],
      promoFeatures: [],
      brands: [],
      categories: [],
      brandShowcases: [],
      brandBanners: [],
    } as any,
    countries: [],
    articles: [],
    analytics: {
      catalogViews: 100,
      productViews: {},
      contactActions: { whatsapp: 5, call: 2 },
      contactActionsByProduct: {},
    },
    csrfToken: 'test-token',
  };

  it('renders all filter selects including price, stock, multi-media, and bulk action buttons', () => {
    render(
      <CatalogAdmin
        initial={initialPayload}
        theme={lightTheme}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onUpload={vi.fn()}
        onLogout={vi.fn()}
        showToast={vi.fn()}
      />
    );

    // Switch to products tab
    const productsTabBtn = screen.getByRole('button', { name: /Məhsullar/i });
    fireEvent.click(productsTabBtn);

    // Verify filter dropdowns exist
    expect(screen.getByTitle(/Şəkilli və ya şəkilsiz məhsullara görə süzgəc/i)).toBeDefined();
    expect(screen.getByTitle(/Texniki göstəricilərə görə süzgəc/i)).toBeDefined();
    expect(screen.getByTitle(/Qiymətə görə süzgəc/i)).toBeDefined();
    expect(screen.getByTitle(/Stok vəziyyətinə görə süzgəc/i)).toBeDefined();

    // Verify Bulk Action Buttons exist
    expect(screen.getByText(/Şəkilsizləri Dərcdən Çıxar/i)).toBeDefined();
    expect(screen.getByText(/Şəkilliləri Dərc Et/i)).toBeDefined();
    expect(screen.getByText(/Parametrliləri Dərc Et/i)).toBeDefined();
    expect(screen.getByText(/Parametrsizləri Dərcdən Çıxar/i)).toBeDefined();
    expect(screen.getByText(/Süzgəcdəkiləri Dərc Et/i)).toBeDefined();
    expect(screen.getByText(/Süzgəcdəkiləri Gizlə/i)).toBeDefined();
  });

  it('filters accurately by multi-media (>1 image) and single-media (=1 image)', () => {
    render(
      <CatalogAdmin
        initial={initialPayload}
        theme={lightTheme}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onUpload={vi.fn()}
        onLogout={vi.fn()}
        showToast={vi.fn()}
      />
    );

    // Switch to products tab
    fireEvent.click(screen.getByRole('button', { name: /Məhsullar/i }));

    const mediaSelect = screen.getByTitle(/Şəkilli və ya şəkilsiz məhsullara görə süzgəc/i);

    // 1. Select Multi-media
    fireEvent.change(mediaSelect, { target: { value: 'multi-media' } });
    expect(screen.getByText('AR-HAS-IMG')).toBeDefined();
    expect(screen.queryByText('LT-SINGLE-IMG')).toBeNull();
    expect(screen.queryByText('AR-NO-IMG')).toBeNull();

    // 2. Select Single-media
    fireEvent.change(mediaSelect, { target: { value: 'single-media' } });
    expect(screen.getByText('LT-SINGLE-IMG')).toBeDefined();
    expect(screen.queryByText('AR-HAS-IMG')).toBeNull();
  });

  it('triggers bulk action "Şəkilsizləri Dərcdən Çıxar" to unpublish imageless products', () => {
    const showToast = vi.fn();
    render(
      <CatalogAdmin
        initial={initialPayload}
        theme={lightTheme}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onUpload={vi.fn()}
        onLogout={vi.fn()}
        showToast={showToast}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Məhsullar/i }));

    const unpublishNoMediaBtn = screen.getByText(/Şəkilsizləri Dərcdən Çıxar/i);
    fireEvent.click(unpublishNoMediaBtn);

    // Toast and updated status summary
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/şəkilsiz məhsul dərcdən çıxarıldı/i));
  });

  it('triggers bulk action "Şəkilliləri Dərc Et" to publish all products with images', () => {
    const showToast = vi.fn();
    render(
      <CatalogAdmin
        initial={initialPayload}
        theme={lightTheme}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onUpload={vi.fn()}
        onLogout={vi.fn()}
        showToast={showToast}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Məhsullar/i }));

    const publishHasMediaBtn = screen.getByText(/Şəkilliləri Dərc Et/i);
    fireEvent.click(publishHasMediaBtn);

    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/şəkilli məhsul canlı yayıma buraxıldı/i));
  });
});
