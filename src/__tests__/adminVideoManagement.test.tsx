// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { ProductEditor, CatalogAdmin, getProductVideoCount, getProductImageCount } from '../components/CatalogAdmin';
import { DEFAULT_SETTINGS } from '../data/catalog';
import { AdminPayload } from '../services/catalogApi';
import { lightTheme } from '../types/theme';
import { Product, Brand, CatalogCategory } from '../types/product';

afterEach(cleanup);

describe('Admin Video Media Management & Video First Placement', () => {
  const mockBrands: Brand[] = [
    { id: 'lotus', name: 'LOTUS', slug: 'lotus', originCountry: 'Türkiyə', manufacturingCountries: [], description: '', logo: '', active: true, comingSoon: false },
    { id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'İtaliya', manufacturingCountries: [], description: '', logo: '', active: true, comingSoon: false },
  ];
  const mockCategories: CatalogCategory[] = [
    { id: 'hood', name: 'Aspiratorlar', slug: 'hood', icon: 'Wind', active: true, sortOrder: 1 },
    { id: 'cooktop', name: 'Bişirmə Panelləri', slug: 'cooktop', icon: 'Flame', active: true, sortOrder: 2 },
  ];

  const productWithVideo: Product = {
    id: 'lotus-asp-2752',
    code: 'LT-2752',
    title: 'Lotus Aspirator LT-2752 İnox',
    category: 'hood',
    categoryName: 'Aspiratorlar',
    shortDesc: 'Güclü turbo motorlu Lotus aspirator',
    brandId: 'lotus',
    image: '/media/products/lotus-aspirator-2752.jpg',
    gallery: ['/media/products/lotus-aspirator-2752.jpg'],
    media: [
      { id: 'm1', type: 'image', url: '/media/products/lotus-aspirator-2752.jpg', alt: 'Lotus Aspirator Şəkili' },
      { id: 'm2', type: 'video', url: '/media/products/videos/lotus-aspirator-2752.mp4', poster: '/media/products/lotus-aspirator-2752.jpg', alt: 'Lotus Aspirator Video Çarxı' },
    ],
    highlights: [],
    specs: [],
    status: 'published',
  };

  const productWithoutVideo: Product = {
    id: 'ardo-cook-60',
    code: 'AR-604B',
    title: 'ARDO Qaz Paneli 604B',
    category: 'cooktop',
    categoryName: 'Bişirmə Panelləri',
    shortDesc: 'SABAF ocaqlı qaz paneli',
    brandId: 'ardo',
    image: '/media/products/ardo-604b.jpg',
    gallery: ['/media/products/ardo-604b.jpg'],
    media: [
      { id: 'm1', type: 'image', url: '/media/products/ardo-604b.jpg', alt: 'ARDO Qaz Paneli' },
    ],
    highlights: [],
    specs: [],
    status: 'published',
  };

  it('correctly calculates video and image counts helper functions', () => {
    expect(getProductVideoCount(productWithVideo)).toBe(1);
    expect(getProductImageCount(productWithVideo)).toBe(1);
    expect(getProductVideoCount(productWithoutVideo)).toBe(0);
    expect(getProductImageCount(productWithoutVideo)).toBe(1);
  });

  it('allows moving video to position 1 (making video the cover item) and updates product.image with poster', () => {
    const handleSave = vi.fn();
    render(
      <ProductEditor
        product={productWithVideo}
        brands={mockBrands}
        categories={mockCategories}
        availableCountries={['Türkiyə', 'İtaliya']}
        theme={lightTheme}
        onUpload={vi.fn()}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    // Should find the "🎬 1-ci / Qapaq et" button on the video item
    const makeCoverBtn = screen.getByTitle(/Kataloq Qapaq Videosu et/i);
    expect(makeCoverBtn).toBeDefined();

    // Click to make video 1st/cover
    fireEvent.click(makeCoverBtn);

    // Now index 0 is video, should show the primary video badge
    expect(screen.getByText(/🎬 #1 Əsas Video \(Qapaq\)/i)).toBeDefined();

    // Click Save
    const saveBtn = screen.getByRole('button', { name: /Yadda saxla/i });
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledTimes(1);
    const savedProduct = handleSave.mock.calls[0][0] as Product;
    expect(savedProduct.media?.[0]?.type).toBe('video');
    expect(savedProduct.media?.[0]?.url).toBe('/media/products/videos/lotus-aspirator-2752.mp4');
    expect(savedProduct.image).toBe('/media/products/lotus-aspirator-2752.jpg');
  });

  it('renders video filter in CatalogAdmin and filters products by video presence', () => {
    const mockCatalog: AdminPayload = {
      brands: mockBrands,
      categories: mockCategories,
      products: [productWithVideo, productWithoutVideo],
      settings: DEFAULT_SETTINGS,
      articles: [],
      analytics: {
        catalogViews: 10,
        productViews: {},
        contactActions: { whatsapp: 2, call: 1 },
        contactActionsByProduct: {},
      },
      csrfToken: 'test-token',
    };

    render(
      <CatalogAdmin
        initial={mockCatalog}
        theme={lightTheme}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onUpload={vi.fn()}
        onLogout={vi.fn()}
        showToast={vi.fn()}
      />
    );

    // Switch from dashboard to Məhsullar tab
    const productsTabBtn = screen.getByRole('button', { name: /Məhsullar/i });
    fireEvent.click(productsTabBtn);

    // Table view: Should show video badge on the row with video
    const videoBadges = screen.getAllByText(/🎬 Video/i);
    expect(videoBadges.length).toBeGreaterThan(0);

    // Switch media filter to 'has-video'
    const mediaFilterSelect = screen.getByTitle(/Şəkilli və ya şəkilsiz məhsullara görə süzgəc/i) as HTMLSelectElement;
    fireEvent.change(mediaFilterSelect, { target: { value: 'has-video' } });

    // Only product with video should be in the list
    expect(screen.getByText('LT-2752')).toBeDefined();
    expect(screen.queryByText('AR-604B')).toBeNull();

    // Switch media filter to 'no-video'
    fireEvent.change(mediaFilterSelect, { target: { value: 'no-video' } });
    expect(screen.getByText('AR-604B')).toBeDefined();
    expect(screen.queryByText('LT-2752')).toBeNull();
  });
});
