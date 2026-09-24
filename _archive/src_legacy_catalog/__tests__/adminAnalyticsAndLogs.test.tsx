// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CatalogAdmin, LogManager } from '../components/CatalogAdmin';
import { DEFAULT_ARTICLES, DEFAULT_BRANDS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../data/catalog';
import { lightTheme } from '../types/theme';
import { AdminPayload, catalogApi } from '../services/catalogApi';
import { TEST_PRODUCT } from './fixtures';
import { AuditLog, CatalogAnalytics } from '../types/product';
import { App } from '../App';

beforeEach(() => {
  vi.spyOn(catalogApi, 'track').mockImplementation(() => Promise.resolve());
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
  vi.restoreAllMocks();
});

const mockAdminData = (): AdminPayload => ({
  brands: DEFAULT_BRANDS,
  categories: DEFAULT_CATEGORIES,
  products: [
    {
      ...TEST_PRODUCT,
      id: 'prod-101',
      code: 'ARDO-TEST-1',
      title: 'ARDO Aspirator Test',
      category: 'aspirator',
      categoryName: 'Aspiratorlar',
      brandId: 'ardo',
      status: 'published',
      stockStatus: 'in_stock',
    },
  ],
  articles: DEFAULT_ARTICLES,
  settings: {
    ...DEFAULT_SETTINGS,
    whatsappNumber: '994501234567',
    phoneNumber: '994121234567',
    catalogActive: true,
    maintenanceMessage: 'Kataloqda profilaktik yenilənmə aparılır.',
  },
  analytics: {
    catalogViews: 120,
    productViews: { 'prod-101': 45 },
    contactActions: { whatsapp: 12, call: 4 },
    contactActionsByProduct: {
      'prod-101': { whatsapp: 8, call: 2 },
    },
  },
  csrfToken: 'mock-csrf-token',
});

const sampleLogs: AuditLog[] = [
  {
    id: 1,
    category: 'auth',
    action: 'admin_login_success',
    title: 'Uğurlu Giriş',
    details: 'Admin panelə uğurla daxil olundu',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    status: 'success',
    createdAt: '2026-08-30 10:00:00',
  },
  {
    id: 2,
    category: 'product',
    action: 'product_save',
    title: 'Məhsul Qeydiyyatı',
    details: 'Yeni model əlavə edildi: ARDO-TEST-1',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    status: 'success',
    createdAt: '2026-08-30 10:05:00',
  },
  {
    id: 3,
    category: 'catalog_status',
    action: 'catalog_status_change',
    title: 'Kataloq Dayandırıldı',
    details: 'Profilaktik yenilənmə səbəbilə kataloq yayımı dayandırıldı',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    status: 'warning',
    createdAt: '2026-08-30 10:10:00',
  },
];

describe('Admin Analytics Period Filtering', () => {
  it('renders period filter pills on Dashboard and handles selection', async () => {
    const filterSpy = vi.spyOn(catalogApi, 'getFilteredAnalytics').mockResolvedValue({
      catalogViews: 42,
      productViews: { 'prod-101': 15 },
      contactActions: { whatsapp: 5, call: 2 },
      contactActionsByProduct: { 'prod-101': { whatsapp: 3, call: 1 } },
    });

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

    // Verify dashboard period filter pills exist
    expect(screen.getByText('Statistika Dövrü')).toBeTruthy();
    expect(screen.getByText('Bu gün')).toBeTruthy();
    expect(screen.getByText('Dünən')).toBeTruthy();
    expect(screen.getByText('Bu həftə')).toBeTruthy();
    expect(screen.getByText('Bu ay')).toBeTruthy();
    expect(screen.getByText('Son 30 gün')).toBeTruthy();
    expect(screen.getByText('Bütün vaxtlar')).toBeTruthy();
    expect(screen.getByText('📅 Fərdi Aralıq / Gün')).toBeTruthy();

    // Click 'Bu gün'
    fireEvent.click(screen.getByText('Bu gün'));
    await waitFor(() => {
      expect(filterSpy).toHaveBeenCalledWith('today', undefined, undefined);
    });

    // Click '📅 Fərdi Aralıq / Gün' to show direct modern interactive calendar
    fireEvent.click(screen.getByText('📅 Fərdi Aralıq / Gün'));
    expect(screen.getByText('Təqvim ilə Aralıq Seçin')).toBeTruthy();
    expect(screen.getByText('Sürətli Seçimlər')).toBeTruthy();
    expect(screen.getByText('Son 7 gün')).toBeTruthy();
    expect(screen.getByText('Son 14 gün')).toBeTruthy();
    expect(screen.getByText('Tətbiq et və Göstər')).toBeTruthy();

    // Click 'Son 7 gün' preset and apply
    fireEvent.click(screen.getByText('Son 7 gün'));
    fireEvent.click(screen.getByText('Tətbiq et və Göstər'));
    await waitFor(() => {
      expect(filterSpy).toHaveBeenCalledWith('custom', expect.any(String), expect.any(String));
    });
  });
});

describe('Catalog Status Switch and Maintenance Mode', () => {
  it('opens status toggle modal and triggers catalog status change', async () => {
    const toggleSpy = vi.spyOn(catalogApi, 'toggleCatalogStatus').mockResolvedValue({
      ok: true,
      active: false,
      message: 'Kataloqda profilaktik yenilənmə aparılır.',
    });

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

    // Status button in toolbar
    const statusBtn = screen.getByTitle('Kataloqun fəaliyyət statusunu dəyiş');
    expect(statusBtn.textContent).toContain('Kataloq: Yayımda');

    // Click to open status modal
    fireEvent.click(statusBtn);
    expect(screen.getByText('Kataloq Fəaliyyət Statusu')).toBeTruthy();
    expect(screen.getByText('🟡 Dayandırılıb (Profilaktika)')).toBeTruthy();

    // Click paused choice card
    fireEvent.click(screen.getByText('🟡 Dayandırılıb (Profilaktika)'));
    await waitFor(() => {
      expect(toggleSpy).toHaveBeenCalledWith(false, expect.any(String), 'mock-csrf-token');
    });
  });

  it('renders sleek maintenance screen in customer App when catalogActive is false', async () => {
    vi.spyOn(catalogApi, 'getCatalog').mockResolvedValue({
      brands: DEFAULT_BRANDS,
      categories: DEFAULT_CATEGORIES,
      products: [],
      articles: DEFAULT_ARTICLES,
      settings: {
        ...DEFAULT_SETTINGS,
        catalogActive: false,
        maintenanceMessage: 'Kataloq hazırda yenilənir.',
        whatsappNumber: '994501234567',
        phoneNumber: '994121234567',
      },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Kataloqda Profilaktik Yenilənmə')).toBeTruthy();
      expect(screen.getByText('Tezliklə Xidmətinizdəyik')).toBeTruthy();
      expect(screen.getByText('Kataloq hazırda yenilənir.')).toBeTruthy();
      expect(screen.getByText('WhatsApp ilə Əlaqə')).toBeTruthy();
      expect(screen.getByText('Admin Girişi')).toBeTruthy();
    });
  });
});

describe('Audit Logging System', () => {
  it('renders LogManager table with category filtering and detail inspection', async () => {
    const onSelectCategory = vi.fn();
    const onSearchChange = vi.fn();
    const onRefresh = vi.fn();
    const onInspectLog = vi.fn();

    render(
      <LogManager
        theme={lightTheme}
        logs={sampleLogs}
        total={sampleLogs.length}
        loading={false}
        category="all"
        search=""
        onSelectCategory={onSelectCategory}
        onSearchChange={onSearchChange}
        onRefresh={onRefresh}
        onOpenClearModal={vi.fn()}
        onInspectLog={onInspectLog}
      />
    );

    // Verify header and counts
    expect(screen.getByText('Audit və Sistem Logları')).toBeTruthy();
    expect(screen.getByText(/3 qeyd/)).toBeTruthy();

    // Verify categories
    expect(screen.getByText('Bütün Loglar')).toBeTruthy();
    expect(screen.getByText('🔐 Giriş & Təhlükəsizlik')).toBeTruthy();
    expect(screen.getByText('📦 Məhsul Hadisələri')).toBeTruthy();
    expect(screen.getByText('⏸ Kataloq Statusu')).toBeTruthy();

    // Verify rows rendered
    expect(screen.getByText('Uğurlu Giriş')).toBeTruthy();
    expect(screen.getByText('Məhsul Qeydiyyatı')).toBeTruthy();
    expect(screen.getByText('Kataloq Dayandırıldı')).toBeTruthy();

    // Inspect log click
    fireEvent.click(screen.getByText('Uğurlu Giriş'));
    expect(onInspectLog).toHaveBeenCalledWith(sampleLogs[0]);

    // Select category click
    fireEvent.click(screen.getByText('🔐 Giriş & Təhlükəsizlik'));
    expect(onSelectCategory).toHaveBeenCalledWith('auth');
  });
});
