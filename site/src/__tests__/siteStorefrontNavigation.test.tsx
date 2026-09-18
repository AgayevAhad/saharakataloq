// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { App } from '../App';
import { DEFAULT_CATALOG } from '../data/catalog';
import { Product } from '../types/product';
import { lightTheme } from '../types/theme';
import { TopServiceBar } from '../components/site/TopServiceBar';
import { MegaMenu } from '../components/site/MegaMenu';
import { SaharaMatchModal } from '../components/site/SaharaMatchModal';
import { MobileBottomNav } from '../components/site/MobileBottomNav';
import { UserAccountDrawer } from '../components/site/UserAccountDrawer';
import { BrandsPage } from '../pages/BrandsPage';
import { ServicesPage } from '../pages/ServicesPage';
import { StoresPage } from '../pages/StoresPage';
import { ComparePage } from '../pages/ComparePage';
import { SupportPage } from '../pages/SupportPage';
import { featureFlags } from '../utils/featureFlags';

const mockProducts: Product[] = [
  {
    id: 'ardo-cooktop-1',
    code: 'HA-60',
    title: 'ARDO Qaz Paneli HA-60',
    category: 'cooktop',
    categoryName: 'Bişirmə paneli',
    brandId: 'ardo',
    image: '/media/ardo.png',
    shortDesc: 'Qaz plitəsi',
    price: 350,
    currency: 'AZN',
    status: 'published',
    highlights: ['4 qaz gözü', 'Sabaf brülör'],
    specs: [{ id: '1', name: 'Göz sayı', value: '4' }],
    media: [{ id: 'm1', type: 'image', url: '/media/ardo.png' }],
    badgeText: 'Yeni',
  },
  {
    id: 'ardo-oven-1',
    code: 'OV-60',
    title: 'ARDO Quraşdırılan Soba OV-60',
    category: 'oven',
    categoryName: 'Soba',
    brandId: 'ardo',
    image: '/media/oven.png',
    shortDesc: 'Elektrik soba',
    price: 550,
    currency: 'AZN',
    status: 'published',
    highlights: ['65L həcm', 'A sinfi'],
    specs: [{ id: '1', name: 'Həcm', value: '65L' }],
    media: [{ id: 'm2', type: 'image', url: '/media/oven.png' }],
  },
];

const mockCatalog = {
  ...DEFAULT_CATALOG,
  products: mockProducts,
};

// Mock catalogApi
vi.mock('../services/catalogApi', () => ({
  catalogApi: {
    getCatalog: vi.fn().mockImplementation(() => Promise.resolve(mockCatalog)),
    getAdminData: vi.fn().mockResolvedValue(null),
    track: vi.fn(),
  },
}));

describe('Sahara Electronics Site Storefront Navigation & Components', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
  });

  describe('TopServiceBar', () => {
    it('renders contact numbers and showroom link correctly', () => {
      const handleNavigate = vi.fn();
      render(
        <TopServiceBar
          settings={DEFAULT_CATALOG.settings}
          theme={lightTheme}
          onNavigate={handleNavigate}
        />
      );

      expect(screen.getByText(/Müştəri Dəstəyi & Əlaqə/i)).toBeDefined();

      fireEvent.click(screen.getByText(/Müştəri Dəstəyi & Əlaqə/i));
      expect(handleNavigate).toHaveBeenCalledWith('support');
    });
  });

  describe('MegaMenu', () => {
    it('renders categories and brand lists when open', () => {
      const handleSelectCategory = vi.fn();
      const handleSelectBrand = vi.fn();
      const handleNavigate = vi.fn();
      const handleClose = vi.fn();

      render(
        <MegaMenu
          isOpen={true}
          onClose={handleClose}
          categories={DEFAULT_CATALOG.categories}
          brands={DEFAULT_CATALOG.brands}
          theme={lightTheme}
          onSelectCategory={handleSelectCategory}
          onSelectBrand={handleSelectBrand}
          onNavigate={handleNavigate}
        />
      );

      expect(screen.getAllByText(/Böyük Məişət Texnikası/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Aspiratorlar/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Brendlər/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/ARDO/i)).toBeDefined();
    });
  });

  describe('MobileBottomNav', () => {
    it('renders 4 primary navigation tabs and triggers callbacks', () => {
      const handleNavigate = vi.fn();
      const handleOpenUserDrawer = vi.fn();

      render(
        <MobileBottomNav
          currentRoute="home"
          onNavigate={handleNavigate}
          onOpenUserDrawer={handleOpenUserDrawer}
          theme={lightTheme}
        />
      );

      expect(screen.getByText('Ana Səhifə')).toBeDefined();
      expect(screen.getByText('Kateqoriyalar')).toBeDefined();
      expect(screen.getByText('Səbət')).toBeDefined();
      expect(screen.getByText('Profil')).toBeDefined();

      fireEvent.click(screen.getByText('Kateqoriyalar'));
      expect(handleNavigate).toHaveBeenCalledWith('catalog');

      fireEvent.click(screen.getByText('Profil'));
      expect(handleOpenUserDrawer).toHaveBeenCalled();
    });
  });


  describe('SaharaMatchModal', () => {
    it('allows completing step questions to find matching products', () => {
      const handleSelectProduct = vi.fn();
      const handleClose = vi.fn();

      render(
        <SaharaMatchModal
          isOpen={true}
          onClose={handleClose}
          products={mockProducts}
          theme={lightTheme}
          onSelectProduct={handleSelectProduct}
        />
      );

      expect(screen.getByText(/Sahara Match — Ağıllı Seçim Köməkçisi/i)).toBeDefined();
      expect(screen.getByText(/Hansı kateqoriyada texnika axtarırsınız\?/i)).toBeDefined();

      // Step 1: Select category option
      const categoryOption = screen.getByText(/Qaz & Elektrik Plitəsi/i);
      fireEvent.click(categoryOption);

      // Verify question changed to step 2
      expect(screen.getByText(/İstifadə intensivliyi və ailə üzvlərinin sayı/i)).toBeDefined();
    });
  });

  describe('Pages Rendering', () => {
    it('BrandsPage renders brand cards and origin information', () => {
      const handleNavigate = vi.fn();
      render(
        <BrandsPage
          brands={DEFAULT_CATALOG.brands}
          products={mockProducts}
          theme={lightTheme}
          onNavigate={handleNavigate}
        />
      );

      expect(screen.getByText(/Elektronika və Məişət Texnikası Brendləri/i)).toBeDefined();
      expect(screen.getByText('ARDO')).toBeDefined();
      expect(screen.getByText('LOTUS')).toBeDefined();
      expect(screen.getByText('ARTEL')).toBeDefined();
    });

    it('ServicesPage renders service benefits and warranty support cleanly', () => {
      const handleWhatsApp = vi.fn();
      const handleCall = vi.fn();

      render(
        <ServicesPage
          settings={DEFAULT_CATALOG.settings}
          theme={lightTheme}
          onWhatsApp={handleWhatsApp}
          onCall={handleCall}
        />
      );

      expect(screen.getByText(/Zəmanət və Servis Dəstəyi/i)).toBeDefined();
      expect(screen.getByText(/Zəmanət Xidməti/i)).toBeDefined();
    });

    it('StoresPage renders showroom locations and working hours', () => {
      const handleWhatsApp = vi.fn();
      const handleCall = vi.fn();

      render(
        <StoresPage
          settings={DEFAULT_CATALOG.settings}
          theme={lightTheme}
          onWhatsApp={handleWhatsApp}
          onCall={handleCall}
        />
      );

      expect(screen.getByText(/Satış Salonları, Filiallar və Əlaqə/i)).toBeDefined();
    });

    it('ComparePage renders comparison table when products are passed', () => {
      const handleRemove = vi.fn();
      const handleClear = vi.fn();
      const handleSelect = vi.fn();
      const handleNavigate = vi.fn();

      render(
        <ComparePage
          comparisonProducts={mockProducts}
          theme={lightTheme}
          onRemoveFromCompare={handleRemove}
          onClearCompare={handleClear}
          onSelectProduct={handleSelect}
          onNavigate={handleNavigate}
        />
      );

      expect(screen.getByText(/Məhsul Müqayisəsi/i)).toBeDefined();
      expect(screen.getByText(/Yalnız Fərqləri Göstər/i)).toBeDefined();
    });

    it('ComparePage renders empty state when no products selected', () => {
      const handleNavigate = vi.fn();
      render(
        <ComparePage
          comparisonProducts={[]}
          theme={lightTheme}
          onRemoveFromCompare={vi.fn()}
          onClearCompare={vi.fn()}
          onSelectProduct={vi.fn()}
          onNavigate={handleNavigate}
        />
      );

      expect(screen.getByText(/Müqayisə Siyahısı Boşdur/i)).toBeDefined();
      fireEvent.click(screen.getByText(/Məhsullara Bax/i));
      expect(handleNavigate).toHaveBeenCalledWith('catalog');
    });

    it('SupportPage renders FAQs and contact inquiry channels', () => {
      render(
        <SupportPage
          settings={DEFAULT_CATALOG.settings}
          theme={lightTheme}
          onWhatsApp={vi.fn()}
          onCall={vi.fn()}
        />
      );

      expect(screen.getByText(/Müştəri Dəstəyi və Əlaqə/i)).toBeDefined();
      expect(screen.getByText(/Tez-Tez Verilən Suallar/i)).toBeDefined();
    });
  });

  describe('UserAccountDrawer', () => {
    it('renders UserAccountDrawer with quick stats, navigation rows, auth tabs, and interactive features', () => {
      const handleClose = vi.fn();
      const handleToggleTheme = vi.fn();
      const handleNavigate = vi.fn();
      const handleWhatsApp = vi.fn();

      render(
        <UserAccountDrawer
          isOpen={true}
          onClose={handleClose}
          theme={lightTheme}
          themeMode="light"
          onToggleTheme={handleToggleTheme}
          onNavigate={handleNavigate}
          cartCount={3}
          favoritesCount={5}
          onWhatsAppSupport={handleWhatsApp}
        />
      );

      // Verify user greeting
      expect(screen.getByText(/İstifadəçi Kabineti/i)).toBeDefined();
      expect(screen.getByText(/Xoş gəlmisiniz!/i)).toBeDefined();

      // Verify quick stats badges
      expect(screen.getByText('3')).toBeDefined(); // cartCount
      expect(screen.getByText('5')).toBeDefined(); // favoritesCount

      // Verify navigation links
      expect(screen.getByText('Səbətim və Sifariş')).toBeDefined();
      expect(screen.getByText('Bəyəndiyim Məhsullar')).toBeDefined();
      expect(screen.getByText('Mağazalar & Sərgi Salonları')).toBeDefined();
      expect(screen.getByText('Rəsmi Servis və Zəmanət')).toBeDefined();
      expect(screen.getByText('Müştəri Dəstəyi və FAQ')).toBeDefined();

      // Verify order tracking input
      expect(screen.getByPlaceholderText(/SHR-9021/i)).toBeDefined();

      // Test navigating to cart
      fireEvent.click(screen.getByText('Səbətim və Sifariş'));
      expect(handleNavigate).toHaveBeenCalledWith('cart');
      expect(handleClose).toHaveBeenCalled();

      // Test WhatsApp button
      const whatsappBtn = screen.getByText(/WhatsApp ilə Canlı Əlaqə/i);
      expect(whatsappBtn).toBeDefined();
      fireEvent.click(whatsappBtn);
      expect(handleWhatsApp).toHaveBeenCalled();

      // Test theme toggle button
      const themeBtn = screen.getByText('Dəyişdir');
      expect(themeBtn).toBeDefined();
      fireEvent.click(themeBtn);
      expect(handleToggleTheme).toHaveBeenCalled();
    });
  });

  describe('Full App Integration', () => {
    it('renders app shell cleanly in site mode without throwing', async () => {
      render(<App />);
      await waitFor(() => {
        expect(document.querySelector('#catalog-top-anchor')).toBeDefined();
      });
    });
  });
});
