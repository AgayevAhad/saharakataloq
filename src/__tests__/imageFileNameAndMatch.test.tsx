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

describe('Image File Name Display and Match Verification Suite', () => {
  const sampleProduct: Product = {
    id: 'prod-604b',
    code: '604B',
    title: 'Aspirator 604B',
    category: 'hood',
    categoryName: 'Aspiratorlar',
    brandId: 'ardo',
    image: '/media/products/ardo-604b.jpg',
    media: [
      {
        id: 'm-1',
        type: 'image',
        url: '/media/products/ardo-604b.jpg',
        originalName: '604B_inox.jpg',
        alt: 'Aspirator 604B',
        fitMode: 'contain',
        objectPosition: 'center',
      },
      {
        id: 'm-2',
        type: 'image',
        url: '/uploads/3872910-xyz.webp',
        alt: 'Əlavə görünüş',
        fitMode: 'contain',
        objectPosition: 'center',
      },
    ],
    specs: [],
    price: 300,
    stockStatus: 'in_stock',
    status: 'published',
    shortDesc: '',
    highlights: [],
  };

  const payload: AdminPayload = {
    brands: [
      { id: 'ardo', name: 'ARDO', slug: 'ardo', active: true, originCountry: 'İtaliya', manufacturingCountries: ['İtaliya'] },
    ],
    categories: [
      { id: 'hood', name: 'Aspiratorlar', slug: 'hood', active: true },
    ],
    products: [sampleProduct],
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
      catalogViews: 50,
      productViews: {},
      contactActions: { whatsapp: 1, call: 0 },
      contactActionsByProduct: {},
    },
    csrfToken: 'test-token',
  };

  it('displays original file name, extracted url file name, and code match badge in edit modal', () => {
    render(
      <CatalogAdmin
        initial={payload}
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

    // Click Edit Product button
    const editBtn = screen.getByTitle('Redaktə et');
    fireEvent.click(editBtn);

    // Verify modal is open
    expect(screen.getByText('604B redaktəsi')).toBeDefined();

    // Verify the original file name is displayed
    expect(screen.getByText('604B_inox.jpg')).toBeDefined();

    // Verify the clean human-readable name is generated for uploaded hash without originalName
    expect(screen.getByText('604B (2).jpg')).toBeDefined();

    // Verify the code match indicator is rendered for matching names
    expect(screen.getAllByText('✓ Kodla uyğundur').length).toBe(2);

    // Verify originalName input field is editable
    const origInputs = screen.getAllByPlaceholderText(/Orijinal fayl adı/i);
    expect(origInputs.length).toBe(2);
    expect((origInputs[0] as HTMLInputElement).value).toBe('604B_inox.jpg');

    // Change originalName for second image
    fireEvent.change(origInputs[1], { target: { value: '604B_side_view.jpg' } });
    expect((origInputs[1] as HTMLInputElement).value).toBe('604B_side_view.jpg');
  });
});
