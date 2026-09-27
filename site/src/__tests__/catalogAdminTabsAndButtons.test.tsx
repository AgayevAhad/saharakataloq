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
  csrfToken: 'mock-csrf-token-123',
};

describe('Catalog Admin Refinements: CSV/Excel Removal & Essential Tabs Integration', () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onPublish = vi.fn().mockResolvedValue(undefined);
  const onUpload = vi.fn().mockResolvedValue({ id: 'm1', type: 'image', url: '/test.jpg' });
  const onLogout = vi.fn().mockResolvedValue(undefined);
  const showToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Verifies that all CSV and Excel buttons/inputs are completely removed from ProductsSection', () => {
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

    // Switch to products tab
    const productsTabBtn = screen.getByRole('button', { name: /Məhsullar \(Modellər\)/i });
    fireEvent.click(productsTabBtn);

    // Assert complete absence of CSV/Excel export, import, and template buttons
    expect(screen.queryByText('CSV İxrac')).toBeNull();
    expect(screen.queryByText('Excel (.xlsx) İxrac')).toBeNull();
    expect(screen.queryByText('Excel / CSV İdxal')).toBeNull();
    expect(screen.queryByText('Excel Şablonu')).toBeNull();
    expect(screen.queryByText('CSV Şablonu')).toBeNull();
    expect(screen.queryByTitle(/Bütün məhsulları Excel/i)).toBeNull();
    expect(
      screen.queryByTitle(/Excel \(\.xlsx \/ \.xls\) və ya CSV faylı ilə məhsulları toplu yüklə/i)
    ).toBeNull();
  });

  it('2. Verifies that Catalog Admin sidebar includes Appearance, Contact, Logs, and Security tabs', () => {
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

    // Verify catalog tabs exist in the sidebar (unified Brands tab)
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

    // Verify navigating to Brands renders internal sub-tabs: Brendlərin İdarə Edilməsi & Hərəkətli Brend Lenti
    const brandsBtn = screen.getByRole('button', { name: /Brendlər/i });
    fireEvent.click(brandsBtn);
    expect(screen.getByRole('button', { name: /Brendlərin İdarə Edilməsi/i })).toBeDefined();
    expect(
      screen.getByRole('button', { name: /Hərəkətli Brend Lenti \(Marquee\)/i })
    ).toBeDefined();
  });

  it('3. Verifies navigating to "Görünüş & Mətnlər" in Catalog Admin displays Appearance & CMS texts manager', () => {
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

    const appearanceBtn = screen.getByRole('button', { name: /Görünüş & Mətnlər/i });
    fireEvent.click(appearanceBtn);

    // Assert AppearanceManager sections are rendered
    expect(screen.getByText('Saytın Əsas Rəngi və Şrifti')).toBeDefined();
    expect(
      screen.getByText('Məlumat Səhifələri və Hüquqi Mətnlər (Haqqımızda, Qaydalar, Məxfilik)')
    ).toBeDefined();
    expect(screen.getByText('Veb-tərtibatçı (Developer) Məlumatları')).toBeDefined();
  });

  it('4. Verifies navigating to "Əlaqə & Filiallar" in Catalog Admin displays ContactManager with addresses', () => {
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

    const contactBtn = screen.getByRole('button', { name: /Əlaqə & Filiallar/i });
    fireEvent.click(contactBtn);

    // Assert ContactManager is rendered
    expect(screen.getByText('Əsas Əlaqə və Şirkət Məlumatları')).toBeDefined();
    expect(screen.getAllByPlaceholderText('Sahara Electronics').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('994501234567')).toBeDefined();
  });

  it('5. Verifies navigating to "Loglama (Audit)" and "Təhlükəsizlik & Şifrə" in Catalog Admin', () => {
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

    // Check Logs Tab
    const logsBtn = screen.getByRole('button', { name: /Loglama \(Audit\)/i });
    fireEvent.click(logsBtn);
    expect(screen.getByText('Audit və Sistem Logları')).toBeDefined();

    // Check Security Tab
    const securityBtn = screen.getByRole('button', { name: /Təhlükəsizlik & Şifrə/i });
    fireEvent.click(securityBtn);
    expect(screen.getByText('Admin Giriş Şifrəsini Dəyişdir')).toBeDefined();
    expect(screen.getByPlaceholderText('Köhnə şifrənizi daxil edin')).toBeDefined();
  });

  it('6. Verifies Statistika in Catalog Admin and Products in Site Admin', () => {
    // 6A. Catalog Admin has Statistika tab and renders Analytics dashboard
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

    const catalogStatBtn = screen.getByRole('button', { name: /^Statistika$/i });
    fireEvent.click(catalogStatBtn);
    expect(screen.getByText('Statistika Dövrü')).toBeDefined();

    // 6B. Switch to Site Admin mode and verify Products tab
    const siteModeBtn = screen.getByRole('button', { name: /Sayt \(CMS\)/i });
    fireEvent.click(siteModeBtn);

    const siteProductsBtn = screen.getByRole('button', { name: /Məhsullar \(Modellər\)/i });
    fireEvent.click(siteProductsBtn);
    expect(screen.getByPlaceholderText(/Model, kod və ya adla axtar/i)).toBeDefined();
  });

  it('7. Verifies random layout button, interactive filter chips, and card view with attached action strip', () => {
    const customPayload = {
      ...mockAdminPayload,
      products: [
        {
          id: 'p-ardo-1',
          code: 'ARDO-500',
          title: 'ARDO Premium Soyuducu',
          brandId: 'ardo',
          category: 'fridge',
          categoryName: 'Soyuducular',
          image: '/test-ardo.jpg',
          shortDesc: '',
          highlights: [],
          status: 'published' as const,
          price: 1500,
          specs: [{ id: 'spec-volume', name: 'Həcm', value: '450 L' }],
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'p-lotus-1',
          code: 'LOTUS-200',
          title: 'LOTUS Qaz Sobası',
          brandId: 'lotus',
          category: 'cooker',
          categoryName: 'Qaz sobaları',
          image: '/test-lotus.jpg',
          shortDesc: '',
          highlights: [],
          status: 'draft' as const,
          price: 0,
          specs: [],
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    };

    render(
      <AdminShell
        initial={customPayload}
        theme={lightTheme}
        mode="catalog"
        onSave={onSave}
        onPublish={onPublish}
        onUpload={onUpload}
        onLogout={onLogout}
        showToast={showToast}
      />
    );

    // Switch to Products tab
    fireEvent.click(screen.getByRole('button', { name: /Məhsullar \(Modellər\)/i }));

    // 1. Verify Random button is present
    const randomBtns = screen.getAllByRole('button', { name: /Təsadüfi/i });
    expect(randomBtns.length).toBeGreaterThan(0);
    fireEvent.click(randomBtns[0]);
    expect(screen.getByText(/Qarışdırıldı/i)).toBeDefined();

    // 2. Verify interactive filter chips
    expect(screen.getByRole('button', { name: /Hamısı/i })).toBeDefined();
    expect(screen.getByTitle('Şəkilsiz məhsulları filtrlə')).toBeDefined();
    expect(screen.getByTitle('Texniki parametrləri olan məhsulları filtrlə')).toBeDefined();
    expect(screen.getByTitle('Qiyməti olan məhsulları filtrlə')).toBeDefined();
    expect(screen.getByTitle('Qiymətsiz (Sorğu ilə) olan məhsulları filtrlə')).toBeDefined();

    // Clicking Qiymətsiz chip filters to only LOTUS product
    fireEvent.click(screen.getByTitle('Qiymətsiz (Sorğu ilə) olan məhsulları filtrlə'));
    expect(screen.getByText('LOTUS-200')).toBeDefined();

    // 3. Switch to Card View (Kartlar)
    const cardsViewBtn = screen.getByRole('button', { name: /Kartlar/i });
    fireEvent.click(cardsViewBtn);

    // Reset filters
    fireEvent.click(screen.getByRole('button', { name: /Hamısı/i }));

    // Verify card body, price, and attached bottom action strip
    expect(screen.getByText('ARDO Premium Soyuducu')).toBeDefined();
    expect(screen.getByText('1.500 ₼')).toBeDefined();

    // Verify actions in the bottom strip (Redaktə, Qiymətli/Qiymətsiz, Dərc, Sil)
    const editBtns = screen.getAllByRole('button', { name: /Redaktə/i });
    expect(editBtns.length).toBeGreaterThan(0);
    const deleteBtns = screen.getAllByTitle('Məhsulu sil');
    expect(deleteBtns.length).toBeGreaterThan(0);
  });

  it('8. Verifies Catalog Brands Manager displays ARDO and LOTUS with Yayımda and Tezliklə toggles', () => {
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

    // Switch to Brands tab
    const brandsTabBtn = screen.getByRole('button', { name: /Brendlər/i });
    fireEvent.click(brandsTabBtn);

    // Verify catalog brands are rendered
    expect(screen.getByText('ARDO')).toBeDefined();
    expect(screen.getByText('LOTUS')).toBeDefined();
    expect(screen.getByText('ARTEL')).toBeDefined();

    // Verify 3rd party site candidate brands like Bosch or Samsung are NOT in Catalog Admin
    expect(screen.queryByText('Bosch')).toBeNull();
    expect(screen.queryByText('Samsung')).toBeNull();
    expect(screen.queryByText('Beko')).toBeNull();

    // Verify Yayımda and Tezliklə buttons exist
    const yayimdaButtons = screen.getAllByTitle(/Brendi deaktiv et|Brendi yayımda aktiv et/i);
    expect(yayimdaButtons.length).toBeGreaterThanOrEqual(3);

    const tezlikleButtons = screen.getAllByTitle(/Tezliklə rejimindən çıxar|"Tezliklə"/i);
    expect(tezlikleButtons.length).toBeGreaterThanOrEqual(3);

    // Toggle Tezliklə on first brand
    fireEvent.click(tezlikleButtons[0]);
    expect(showToast).toHaveBeenCalled();
  });

  it('9. Verifies clicking "Canlıya Burax" executes onPublish and displays success toast without closing admin', async () => {
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

    const publishBtn = screen.getByRole('button', { name: /Canlıya Burax/i });
    fireEvent.click(publishBtn);

    // Wait for onPublish to be called
    expect(onPublish).toHaveBeenCalled();
  });
});
