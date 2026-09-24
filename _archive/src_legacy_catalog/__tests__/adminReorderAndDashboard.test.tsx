// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CatalogAdmin } from '../components/CatalogAdmin';
import { DEFAULT_BRANDS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS, DEFAULT_ARTICLES } from '../data/catalog';
import { lightTheme } from '../types/theme';
import { AdminPayload } from '../services/catalogApi';
import { TEST_PRODUCT } from './fixtures';
import { Product } from '../types/product';

afterEach(cleanup);

const prod1: Product = {
  ...TEST_PRODUCT,
  id: 'prod-1',
  code: 'ARDO-01',
  title: 'ARDO Aspirator 60',
  category: 'aspirator',
  categoryName: 'Aspiratorlar',
  brandId: 'ardo',
  status: 'published',
  stockStatus: 'in_stock',
  specs: [{ id: 's1', name: 'Növ', value: 'Quraşdırılan' }],
  media: [{ id: 'm1', type: 'image', url: '/media/products/ardo-1.jpg' }],
};

const prod2: Product = {
  ...TEST_PRODUCT,
  id: 'prod-2',
  code: 'ARDO-02',
  title: 'ARDO Soba 65L',
  category: 'soba',
  categoryName: 'Sobalar',
  brandId: 'ardo',
  status: 'published',
  stockStatus: 'in_stock',
  specs: [{ id: 's2', name: 'Həcm', value: '65L' }],
  media: [{ id: 'm2', type: 'video', url: '/media/video1.mp4' }],
};

const mockAdminData = (): AdminPayload => ({
  brands: DEFAULT_BRANDS,
  categories: DEFAULT_CATEGORIES,
  products: [prod1, prod2],
  articles: DEFAULT_ARTICLES,
  settings: {
    ...DEFAULT_SETTINGS,
    whatsappNumber: '994501234567',
    phoneNumber: '994121234567',
    phoneNumbers: ['994121234567'],
    address: 'Bakı şəhəri',
  },
  analytics: {
    catalogViews: 100,
    productViews: { 'prod-1': 40, 'prod-2': 25 },
    contactActions: { whatsapp: 15, call: 5 },
    contactActionsByProduct: {
      'prod-1': { whatsapp: 10, call: 3 },
      'prod-2': { whatsapp: 5, call: 2 },
    },
  },
  csrfToken: 'test-csrf-token',
});

describe('Executive Dashboard & Drag-Drop & Quick Create', () => {
  it('renders Executive Dashboard KPI cards and Top 10 rankings', () => {
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

    // KPI Cards check
    expect(screen.getByText('Kataloq Baxışları')).toBeDefined();
    expect(screen.getByText('100')).toBeDefined();
    expect(screen.getByText('WhatsApp Müraciəti')).toBeDefined();
    expect(screen.getByText('15')).toBeDefined();
    expect(screen.getByText('Birbaşa Zənglər')).toBeDefined();
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    expect(screen.getByText('Müraciət Konversiyası')).toBeDefined();

    // Visual Charts breakdown check
    expect(screen.getByText('Kateqoriyalar üzrə Paylanma')).toBeDefined();
    expect(screen.getByText('Brendlər və Əlaqə Kanalları')).toBeDefined();

    // Top Ranked table check
    expect(screen.getByText(/Ən Populyar və Sifariş Lideri Məhsullar/)).toBeDefined();
    expect(screen.getByText('ARDO-01')).toBeDefined();
    expect(screen.getByText('#1')).toBeDefined();
  });

  it('allows manual product sequence number change and inline selects', () => {
    const showToast = vi.fn();
    render(
      <CatalogAdmin
        initial={mockAdminData()}
        theme={lightTheme}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onUpload={vi.fn()}
        onLogout={vi.fn()}
        showToast={showToast}
      />
    );

    // Switch to products tab
    fireEvent.click(screen.getByRole('button', { name: /Məhsullar/ }));

    // Verify sequence inputs rendered
    const seqInputs = screen.getAllByTitle(/Sıra nömrəsini daxil edib Enter basın/);
    expect(seqInputs.length).toBe(2);
    expect((seqInputs[0] as HTMLInputElement).value).toBe('1');
    expect((seqInputs[1] as HTMLInputElement).value).toBe('2');

    // Move product #1 to position #2
    fireEvent.change(seqInputs[0], { target: { value: '2' } });
    fireEvent.keyDown(seqInputs[0], { key: 'Enter' });
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('sırasına keçirildi'));
  });

  it('opens Lightbox zoom modal when thumbnail is clicked', () => {
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

    // In Dashboard or Products table, click thumbnail
    const thumbs = screen.getAllByTitle(/Böyütmək və baxmaq üçün klikləyin/);
    fireEvent.click(thumbs[0]);

    // Lightbox modal should be open
    expect(screen.getAllByText('ARDO Aspirator 60').length).toBeGreaterThan(0);
    expect(screen.getByTitle('Bağla')).toBeDefined();

    // Close lightbox
    fireEvent.click(screen.getByTitle('Bağla'));
  });

  it('opens Quick Category modal and creates a new category on the fly', () => {
    const showToast = vi.fn();
    render(
      <CatalogAdmin
        initial={mockAdminData()}
        theme={lightTheme}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onUpload={vi.fn()}
        onLogout={vi.fn()}
        showToast={showToast}
      />
    );

    // Switch to Products tab
    fireEvent.click(screen.getByRole('button', { name: /Məhsullar/ }));

    // Find table category selects
    const catSelects = screen.getAllByDisplayValue('Aspiratorlar');
    fireEvent.change(catSelects[0], { target: { value: '__new_category__' } });

    // Quick create modal should appear
    expect(screen.getByText('Yeni Kateqoriya Yarat')).toBeDefined();

    const nameInput = screen.getByPlaceholderText(/Məs: Qabyuyan Maşınlar/);
    fireEvent.change(nameInput, { target: { value: 'Qurutma Maşınları' } });

    fireEvent.click(screen.getByRole('button', { name: /Yarat və Təyin et/ }));
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Qurutma Maşınları'));
  });
});
