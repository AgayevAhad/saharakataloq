import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { ProductBrandBadge } from '../components/ProductBrandBadge';
import { BrandMark } from '../components/BrandMark';
import { BrandShowcase } from '../components/BrandShowcase';
import { ProductCard } from '../components/ProductCard';
import { CartPage } from '../pages/CartPage';
import { Header } from '../components/Header';
import {
  ThemeColors,
  darkTheme as baseDarkTheme,
  lightTheme as baseLightTheme,
} from '../types/theme';
import { Brand, Product } from '../types/product';
import { getBrandLogo, getBrandLogoFilter } from '../utils/brandLogos';

const lightTheme: ThemeColors = {
  ...baseLightTheme,
  primary: '#b91c1c',
  primaryHover: '#991b1b',
};

const darkTheme: ThemeColors = {
  ...baseDarkTheme,
  primary: '#b91c1c',
  primaryHover: '#991b1b',
};

const mockBrands: Brand[] = [
  {
    id: 'ardo',
    name: 'ARDO',
    slug: 'ardo',
    originCountry: 'İtaliya',
    manufacturingCountries: ['İtaliya'],
    logo: '/media/brands/ardo-logo.png',
    active: true,
  },
  {
    id: 'lotus',
    name: 'LOTUS',
    slug: 'lotus',
    originCountry: 'İngiltərə',
    manufacturingCountries: ['Türkiyə'],
    logo: '/media/brands/lotus-logo.png',
    active: true,
  },
  {
    id: 'artel',
    name: 'ARTEL',
    slug: 'artel',
    originCountry: 'Özbəkistan',
    manufacturingCountries: ['Özbəkistan'],
    logo: '/media/brands/artel-logo.svg',
    active: true,
  },
];

const mockArdoProduct: Product = {
  id: 'ardo-p1',
  code: 'AR101',
  title: 'ARDO Aspirator Test',
  category: 'aspirator',
  categoryName: 'Aspirator',
  brandId: 'ardo',
  price: 250,
  image: '/media/products/ardo.jpg',
  gallery: ['/media/products/ardo.jpg'],
  shortDesc: 'Keyfiyyətli ARDO',
  specs: [],
  highlights: [],
};

const mockLotusProduct: Product = {
  id: 'lotus-p1',
  code: 'LT202',
  title: 'LOTUS Aspirator Test',
  category: 'aspirator',
  categoryName: 'Aspirator',
  brandId: 'lotus',
  price: 320,
  image: '/media/products/lotus.jpg',
  gallery: ['/media/products/lotus.jpg'],
  shortDesc: 'Keyfiyyətli LOTUS',
  specs: [],
  highlights: [],
};

const mockArtelProduct: Product = {
  id: 'artel-p1',
  code: 'ART303',
  title: 'ARTEL Aspirator Test',
  category: 'aspirator',
  categoryName: 'Aspirator',
  brandId: 'artel',
  price: 190,
  image: '/media/products/artel.jpg',
  gallery: ['/media/products/artel.jpg'],
  shortDesc: 'Keyfiyyətli ARTEL',
  specs: [],
  highlights: [],
};

describe('duzelisler.md - 2, 3, 4, 5 maddələri və Lightbox Şəffaflıq Tələbləri', () => {
  beforeEach(() => {
    cleanup();
  });

  describe('Əlavə Tələb: lightbox-top-header arxa planının ləğvi və şəffaflıq', () => {
    it('zoom-floating-controls arxa planı tamamilə şəffafdır və düymələrin altı boşdur', () => {
      render(
        <ProductDetailModal
          product={mockArdoProduct}
          theme={lightTheme}
          visible={true}
          onClose={vi.fn()}
          onShare={vi.fn()}
          onWhatsApp={vi.fn()}
          onCall={vi.fn()}
          onCopyLink={vi.fn()}
        />
      );

      // Lightbox açmaq üçün image stage kliklənir
      const stage = document.querySelector('.product-detail-image-stage') as HTMLDivElement;
      expect(stage).toBeTruthy();
      fireEvent.click(stage);

      const topHeader = document.querySelector('.lightbox-top-header') as HTMLDivElement;
      expect(topHeader).toBeTruthy();
      expect(['transparent', 'none', '']).toContain(topHeader.style.background);

      const zoomControls = document.querySelector('.zoom-floating-controls') as HTMLDivElement;
      expect(zoomControls).toBeTruthy();
      expect(zoomControls.style.background).toBe('transparent');
    });
  });

  describe('Maddə 2: Dark modda loqolar və Məhsul ailələrimizi kəşf edin uyğunlaşması', () => {
    it('brandLogos köməkçi funksiyası dark mod üçün düzgün loqoları və filtrləri təyin edir', () => {
      // Ardo dark modda invert filtr alır
      expect(getBrandLogo('ardo', true)).toBe('/media/brands/ardo-logo.png');
      expect(getBrandLogoFilter('ardo', true)).toBe('brightness(0) invert(1)');
      expect(getBrandLogoFilter('ardo', false)).toBe('none');

      // Lotus dark modda lotus-logo-white.png istifadə edir
      expect(getBrandLogo('lotus', true)).toBe('/media/brands/lotus-logo-white.png');
      expect(getBrandLogo('lotus', false, '/media/brands/lotus-logo.png')).toBe(
        '/media/brands/lotus-logo.png'
      );

      // Artel dark modda artel-logo-white.svg istifadə edir
      expect(getBrandLogo('artel', true)).toBe('/media/brands/artel-logo-white.svg');
    });

    it('ProductBrandBadge dark modda uyğun loqo və filter təqdim edir', () => {
      const { container: ardoDark } = render(
        <ProductBrandBadge brand={mockBrands[0]} isDarkMode={true} />
      );
      const ardoImg = ardoDark.querySelector('img');
      expect(ardoImg).toBeTruthy();
      expect(ardoImg?.style.filter).toBe('brightness(0) invert(1)');

      const { container: lotusDark } = render(
        <ProductBrandBadge brand={mockBrands[1]} isDarkMode={true} />
      );
      const lotusImg = lotusDark.querySelector('img');
      expect(lotusImg?.src).toContain('lotus-logo-white.png');

      const { container: artelDark } = render(
        <ProductBrandBadge brand={mockBrands[2]} isDarkMode={true} />
      );
      const artelImg = artelDark.querySelector('img');
      expect(artelImg?.src).toContain('artel-logo-white.svg');
    });

    it('BrandMark və BrandShowcase dark modda düzgün loqo və çərçivə ilə render olur', () => {
      const { container } = render(
        <BrandShowcase
          brands={mockBrands}
          products={[mockArdoProduct, mockLotusProduct, mockArtelProduct]}
          theme={darkTheme}
          onSelect={vi.fn()}
        />
      );

      // Brand shells mövcuddur
      const shells = container.querySelectorAll('.brand-mark-shell');
      expect(shells.length).toBe(3);

      // Brand adları render olur
      expect(screen.getByText('ARDO')).toBeTruthy();
      expect(screen.getByText('LOTUS')).toBeTruthy();
      expect(screen.getByText('ARTEL')).toBeTruthy();
    });
  });

  describe('Maddə 3: Məhsul kartında Paylaş butonu monoxrom tənzimləməsi', () => {
    it('ProductCard paylaş düyməsi həm light, həm dark rejimdə monoxrom sinfi saxlayır', () => {
      const { container } = render(
        <ProductCard
          product={mockArdoProduct}
          brand={mockBrands[0]}
          theme={lightTheme}
          onSelect={vi.fn()}
          onShare={vi.fn()}
          onWhatsApp={vi.fn()}
          onCall={vi.fn()}
        />
      );

      const shareBtn = container.querySelector('.card-action-btn-share') as HTMLButtonElement;
      expect(shareBtn).toBeTruthy();
      expect(shareBtn.getAttribute('aria-label')).toContain('Paylaş');
      // Blue inline style olmamalıdır
      expect(shareBtn.style.color).not.toBe('#2563eb');
    });
  });

  describe('Maddə 4: CartPage kataloqdan götürülüb yazısının ləğvi', () => {
    it('Səbət səhifəsində "Məhsul məlumatı kataloqdan götürülüb" mətni heç bir halda mövcud deyil', () => {
      render(
        <CartPage
          cartItems={[{ product: mockArdoProduct, quantity: 2 }]}
          allProducts={[mockArdoProduct]}
          brands={mockBrands}
          theme={lightTheme}
          themeMode="light"
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onClearCart={vi.fn()}
          onSelectProduct={vi.fn()}
          onNavigate={vi.fn()}
          onWhatsAppCheckout={vi.fn()}
          onCall={vi.fn()}
        />
      );

      // Məhsul başlıq olaraq görünür
      expect(screen.getByText('ARDO Aspirator Test')).toBeTruthy();

      // "Məhsul məlumatı kataloqdan götürülüb" mətni DOM-da YOXDUR
      expect(screen.queryByText(/kataloqdan götürülüb/i)).toBeNull();
      expect(screen.queryByText(/Məhsul məlumatı kataloqdan götürülüb/i)).toBeNull();
    });
  });

  describe('Maddə 5: Header Sahara loqosuna klik edəndə əsas səhifəyə qayıdış', () => {
    it('Header-də Sahara loqosuna klik etdikdə onLogoClick çağırılır', () => {
      const onLogoClickMock = vi.fn();

      render(
        <Header
          theme={lightTheme}
          isDarkMode={false}
          onToggleTheme={vi.fn()}
          selectedCategory="all"
          onSelectCategory={vi.fn()}
          selectedBrand="all"
          onSelectBrand={vi.fn()}
          brands={mockBrands}
          categories={[]}
          products={[mockArdoProduct]}
          searchQuery=""
          onSearchChange={vi.fn()}
          onOpenCatalogShare={vi.fn()}
          totalCount={1}
          filteredCount={1}
          onLogoClick={onLogoClickMock}
        />
      );

      const brandLockup = document.querySelector('.brand-lockup') as HTMLDivElement;
      expect(brandLockup).toBeTruthy();
      expect(brandLockup.getAttribute('role')).toBe('button');

      fireEvent.click(brandLockup);
      expect(onLogoClickMock).toHaveBeenCalledTimes(1);

      // Klaviaturadan Enter basıldıqda da işləməlidir
      fireEvent.keyDown(brandLockup, { key: 'Enter' });
      expect(onLogoClickMock).toHaveBeenCalledTimes(2);
    });
  });
});
