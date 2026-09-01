// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { CatalogAdmin } from '../components/CatalogAdmin';
import { DEFAULT_BRANDS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS, DEFAULT_ARTICLES } from '../data/catalog';
import { lightTheme } from '../types/theme';
import { AdminPayload } from '../services/catalogApi';
import { Product } from '../types/product';

afterEach(() => {
  cleanup();
});

const sampleProducts: Product[] = [
  {
    id: 'p-ardo-1',
    brandId: 'ardo',
    code: 'ARDO-604B',
    title: 'Aspirator Ardo 604B',
    category: 'hood',
    categoryName: 'Aspiratorlar',
    shortDesc: 'Aspirator Ardo',
    image: '/media/products/ardo-604b.jpg',
    gallery: ['/media/products/ardo-604b.jpg'],
    media: [],
    highlights: [],
    specs: [{ id: 's1', group: 'Əsas', name: 'Mühərrik', value: '180W' }],
    status: 'published',
  },
  {
    id: 'p-ardo-2',
    brandId: 'ardo',
    code: 'ARDO-C640',
    title: 'Qaz Paneli Ardo C640',
    category: 'cooktop',
    categoryName: 'Qaz Panelləri',
    shortDesc: 'Qaz paneli',
    image: '',
    gallery: [],
    media: [],
    highlights: [],
    specs: [],
    status: 'draft',
  },
  {
    id: 'p-lotus-1',
    brandId: 'lotus',
    code: 'LT-AIR-55',
    title: 'Airfryer Lotus 5.5 Black',
    category: 'airfryer',
    categoryName: 'Fritözlər & Airfryer',
    shortDesc: 'Airfryer Lotus',
    image: '/media/products/lotus-5-5.jpg',
    gallery: [],
    media: [],
    highlights: [],
    specs: [{ id: 's2', group: 'Ölçü və Enerji', name: 'Güc', value: '1800W' }],
    status: 'published',
  },
  {
    id: 'p-lotus-2',
    brandId: 'lotus',
    code: 'LT-IRON-88',
    title: 'Ütü Lotus LT-8800',
    category: 'iron',
    categoryName: 'Ütülər',
    shortDesc: 'Lotus Ütü',
    image: '',
    gallery: [],
    media: [],
    highlights: [],
    specs: [],
    status: 'published',
  },
];

const mockAdminData = (): AdminPayload => ({
  brands: DEFAULT_BRANDS,
  categories: DEFAULT_CATEGORIES,
  products: sampleProducts,
  articles: DEFAULT_ARTICLES,
  settings: {
    ...DEFAULT_SETTINGS,
    whatsappNumber: '+994501234567',
    phoneNumber: '+994501234567',
    phoneNumbers: ['+994501234567'],
    address: 'Bakı',
  },
  analytics: {
    catalogViews: 10,
    productViews: {},
    contactActions: { whatsapp: 2, call: 1 },
    contactActionsByProduct: {},
  },
  csrfToken: 'test-token',
});

describe('Admin Panel Brand, Media, Specs Filters and View Mode Suite', () => {
  it('filters products accurately by brand (ARDO vs LOTUS)', () => {
    render(
      <CatalogAdmin
        initial={mockAdminData()}
        theme={lightTheme}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onUpload={vi.fn()}
        onLogout={vi.fn()}
        showToast={vi.fn()}
      />
    );

    // Switch to Products tab
    fireEvent.click(screen.getByRole('button', { name: /Məhsullar/i }));

    const brandSelect = screen.getByTitle('Brendə görə süzgəc') as HTMLSelectElement;
    expect(brandSelect).toBeDefined();

    // Initially all 4 products are displayed
    expect(screen.getByText('ARDO-604B')).toBeDefined();
    expect(screen.getByText('LT-AIR-55')).toBeDefined();

    // Filter by ARDO
    fireEvent.change(brandSelect, { target: { value: 'ardo' } });
    expect(screen.getByText('ARDO-604B')).toBeDefined();
    expect(screen.getByText('ARDO-C640')).toBeDefined();
    expect(screen.queryByText('LT-AIR-55')).toBeNull();
    expect(screen.queryByText('LT-IRON-88')).toBeNull();

    // Filter by LOTUS
    fireEvent.change(brandSelect, { target: { value: 'lotus' } });
    expect(screen.getByText('LT-AIR-55')).toBeDefined();
    expect(screen.getByText('LT-IRON-88')).toBeDefined();
    expect(screen.queryByText('ARDO-604B')).toBeNull();
    expect(screen.queryByText('ARDO-C640')).toBeNull();
  });

  it('filters products by media status (has image vs without image)', () => {
    render(
      <CatalogAdmin
        initial={mockAdminData()}
        theme={lightTheme}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onUpload={vi.fn()}
        onLogout={vi.fn()}
        showToast={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Məhsullar/i }));

    const mediaSelect = screen.getByTitle('Şəkilli və ya şəkilsiz məhsullara görə süzgəc') as HTMLSelectElement;

    // Filter by with media only
    fireEvent.change(mediaSelect, { target: { value: 'has-media' } });
    expect(screen.getByText('ARDO-604B')).toBeDefined();
    expect(screen.getByText('LT-AIR-55')).toBeDefined();
    expect(screen.queryByText('ARDO-C640')).toBeNull();
    expect(screen.queryByText('LT-IRON-88')).toBeNull();

    // Filter by without media
    fireEvent.change(mediaSelect, { target: { value: 'no-media' } });
    expect(screen.getByText('ARDO-C640')).toBeDefined();
    expect(screen.getByText('LT-IRON-88')).toBeDefined();
    expect(screen.queryByText('ARDO-604B')).toBeNull();
    expect(screen.queryByText('LT-AIR-55')).toBeNull();
  });

  it('filters products by technical specs completeness (has specs vs empty specs)', () => {
    render(
      <CatalogAdmin
        initial={mockAdminData()}
        theme={lightTheme}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onUpload={vi.fn()}
        onLogout={vi.fn()}
        showToast={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Məhsullar/i }));

    const specsSelect = screen.getByTitle('Texniki göstəricilərə görə süzgəc') as HTMLSelectElement;

    // Filter by has specs
    fireEvent.change(specsSelect, { target: { value: 'has-specs' } });
    expect(screen.getByText('ARDO-604B')).toBeDefined();
    expect(screen.getByText('LT-AIR-55')).toBeDefined();
    expect(screen.queryByText('ARDO-C640')).toBeNull();
    expect(screen.queryByText('LT-IRON-88')).toBeNull();

    // Filter by no specs
    fireEvent.change(specsSelect, { target: { value: 'no-specs' } });
    expect(screen.getByText('ARDO-C640')).toBeDefined();
    expect(screen.getByText('LT-IRON-88')).toBeDefined();
    expect(screen.queryByText('ARDO-604B')).toBeNull();
    expect(screen.queryByText('LT-AIR-55')).toBeNull();
  });

  it('toggles between Table (List) view and Card Grid view seamlessly', () => {
    render(
      <CatalogAdmin
        initial={mockAdminData()}
        theme={lightTheme}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onUpload={vi.fn()}
        onLogout={vi.fn()}
        showToast={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Məhsullar/i }));

    // Switch to Card Grid view
    const cardsViewBtn = screen.getByTitle('Kart / Vitrin görünüşü');
    fireEvent.click(cardsViewBtn);

    // Cards should be rendered with param and action buttons
    expect(screen.getByText('Airfryer Lotus 5.5 Black')).toBeDefined();
    expect(screen.getAllByText(/Model:/i).length).toBeGreaterThan(0);

    // Switch back to Table view
    const tableViewBtn = screen.getByTitle('Sıra / Cədvəl görünüşü');
    fireEvent.click(tableViewBtn);

    // Table headers should exist
    expect(screen.getByText('Model Kodu')).toBeDefined();
    expect(screen.getByText('Sıra (№)')).toBeDefined();
  });
});
