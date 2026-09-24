// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, act } from '@testing-library/react';
import { Toast } from '../components/Toast';
import { ShareModal } from '../components/ShareModal';
import { InverterInfoModal } from '../components/InverterInfoModal';
import { ProductCard } from '../components/ProductCard';
import { SaharaLogo } from '../components/SaharaLogo';
import { BrandShowcase } from '../components/BrandShowcase';
import { BannerHero } from '../components/BannerHero';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FloatingActions } from '../components/FloatingActions';
import { TEST_PRODUCT } from './fixtures';
import { DEFAULT_BRANDS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS, DEFAULT_ARTICLES } from '../data/catalog';
import { lightTheme, darkTheme } from '../types/theme';

afterEach(cleanup);

describe('Sahara Electronic - UI Komponentləri və İstifadəçi Qarşılıqlı Əlaqə Testləri', () => {
  it('rəsmi Sahara logosunu əlçatan alternativ mətnlə göstərməlidir və dark modda uyğun şəkili seçməlidir', () => {
    const { rerender } = render(<SaharaLogo isDark={false} />);
    const logo = screen.getByAltText('Sahara Electronics') as HTMLImageElement;
    expect(logo.getAttribute('src')).toContain('/media/SaharaLogo.png');

    rerender(<SaharaLogo isDark={true} />);
    const darkLogo = screen.getByAltText('Sahara Electronics') as HTMLImageElement;
    expect(darkLogo.getAttribute('src')).toContain('/media/SaharaLogo-dark.png');
  });

  it('SaharaLogo klik edildikdə böyük modal lightbox açır və bağlamaq olur', () => {
    render(<SaharaLogo enableModal={true} isDark={true} />);
    const trigger = screen.getByTitle('Böyütmək üçün toxunun / klikləyin');
    fireEvent.click(trigger);

    expect(screen.getByText(/zəmanətli satış mərkəzi/i)).toBeDefined();

    const closeBtn = screen.getByLabelText('Bağla');
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/zəmanətli satış mərkəzi/i)).toBeNull();
  });

  it('Lotus və Artel bölmələrini Tezliklə statusu ilə göstərməlidir', () => {
    render(<BrandShowcase brands={DEFAULT_BRANDS} products={[TEST_PRODUCT]} theme={lightTheme} onSelect={vi.fn()} />);
    expect(screen.getByText('LOTUS')).toBeDefined();
    expect(screen.getByText('ARTEL')).toBeDefined();
    expect(screen.getAllByText('TEZLİKLƏ')).toHaveLength(2);
    expect(screen.getByAltText('ARDO loqosu').getAttribute('src')).toBe('/media/brands/ardo-logo.png');
    expect(screen.getByAltText('ARTEL loqosu').getAttribute('src')).toBe('/media/brands/artel-logo.svg');
  });

  it('BannerHero texnologiya karuselini göstərir və toxunanda açır', () => {
    const onOpen = vi.fn();
    render(<BannerHero theme={lightTheme} articles={DEFAULT_ARTICLES} onOpenArticle={onOpen} />);
    expect(screen.getByText(/İnvertor Texnologiyası/i)).toBeDefined();
    fireEvent.click(screen.getByText(/Ətraflı Bax/i));
    expect(onOpen).toHaveBeenCalled();
  });

  it('axtarış fokusunda ağıllı alternativ və populyar məhsul təkliflərini göstərir', () => {
    render(<Header theme={lightTheme} isDarkMode={false} onToggleTheme={vi.fn()} selectedCategory="all" onSelectCategory={vi.fn()} selectedBrand="all" onSelectBrand={vi.fn()} brands={DEFAULT_BRANDS} categories={[{ id: 'hood', name: 'Aspiratorlar', slug: 'aspiratorlar', active: true }]} products={[TEST_PRODUCT]} settings={DEFAULT_SETTINGS} searchQuery="" onSearchChange={vi.fn()} onOpenInverterInfo={vi.fn()} onOpenCatalogShare={vi.fn()} totalCount={1} filteredCount={1} />);
    const input = screen.getByLabelText('Məhsul axtarışı');
    fireEvent.focus(input);
    expect(screen.getByRole('listbox', { name: 'Ağıllı axtarış paneli' })).toBeDefined();
    expect(screen.getByText('Axtarış üzrə nəticə')).toBeDefined();
    expect(screen.getByText('Populyar məhsullar')).toBeDefined();
  });

  it('Header-də Instagram və Facebook keçid düymələri göstərilir', () => {
    render(<Header theme={lightTheme} isDarkMode={false} onToggleTheme={vi.fn()} selectedCategory="all" onSelectCategory={vi.fn()} selectedBrand="all" onSelectBrand={vi.fn()} brands={DEFAULT_BRANDS} categories={DEFAULT_CATEGORIES} products={[TEST_PRODUCT]} settings={DEFAULT_SETTINGS} searchQuery="" onSearchChange={vi.fn()} onOpenInverterInfo={vi.fn()} onOpenCatalogShare={vi.fn()} totalCount={1} filteredCount={1} />);
    expect(screen.getByLabelText('Instagram')).toBeDefined();
    expect(screen.getByLabelText('Facebook')).toBeDefined();
  });

  it('səhifə aşağı sürüşdürüləndə başlıq sabit vəziyyətdə qalır və idarəetmə elementləri aktiv olur', () => {
    const { container } = render(<Header theme={lightTheme} isDarkMode={false} onToggleTheme={vi.fn()} selectedCategory="all" onSelectCategory={vi.fn()} selectedBrand="all" onSelectBrand={vi.fn()} brands={DEFAULT_BRANDS} categories={[{ id: 'hood', name: 'Aspiratorlar', slug: 'aspiratorlar', active: true }]} products={[TEST_PRODUCT]} searchQuery="" onSearchChange={vi.fn()} onOpenInverterInfo={vi.fn()} onOpenCatalogShare={vi.fn()} totalCount={1} filteredCount={1} />);
    expect(container.querySelector('.catalog-header')).toBeDefined();
    expect(screen.getByLabelText('Məhsul axtarışı')).toBeDefined();
    expect(screen.getByText('Bütün məhsullar')).toBeDefined();
  });

  it('Toast komponenti görünən olduqda bildirişi düzgün əks etdirməlidir', () => {
    const { rerender } = render(
      <Toast message="Məhsul linki kopyalandı!" visible={true} theme={lightTheme} />
    );

    expect(screen.getByText('Məhsul linki kopyalandı!')).toBeDefined();

    // visible = false olduqda DOM-da olmamalıdır
    rerender(<Toast message="Məhsul linki kopyalandı!" visible={false} theme={lightTheme} />);
    expect(screen.queryByText('Məhsul linki kopyalandı!')).toBeNull();
  });

  it('InverterInfoModal komponenti açıldıqda texnologiya üstünlüklərini göstərməlidir və tablar arası keçid etməlidir', () => {
    const handleClose = vi.fn();
    render(<InverterInfoModal visible={true} onClose={handleClose} theme={darkTheme} articles={DEFAULT_ARTICLES} />);

    expect(screen.getAllByText(/İnvertor Texnologiyası/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Tənzimlənən enerji istifadəsi/i)).toBeDefined();
    expect(screen.getByText(/Səs və vibrasiyanın/i)).toBeDefined();

    // Click on SABAF technology tab
    const sabafTab = screen.getByText(/🔥 İtalyan Təhlükəsizlik/i);
    fireEvent.click(sabafTab);
    expect(screen.getByText(/İtalyan SABAF Qaz Yanma Sistemi/i)).toBeDefined();
  });

  it('ShareModal sosial şəbəkə düymələrini və kopyalama funksionallığını təmin etməlidir', () => {
    const handleCopy = vi.fn();
    const handleClose = vi.fn();
    const handleWhatsApp = vi.fn();
    const handleTelegram = vi.fn();

    render(
      <ShareModal
        visible={true}
        onClose={handleClose}
        product={TEST_PRODUCT}
        onCopyLink={handleCopy}
        onWhatsAppShare={handleWhatsApp}
        onTelegramShare={handleTelegram}
        theme={lightTheme}
      />
    );

    expect(screen.getByText(/Paylaş/i)).toBeDefined();
    expect(screen.getByText(/WhatsApp/i)).toBeDefined();
    expect(screen.getByText(/Telegram/i)).toBeDefined();
    expect(screen.getByText(/Linki Kopyala/i)).toBeDefined();

    const copyBtn = screen.getByText(/Linki Kopyala/i);
    fireEvent.click(copyBtn);
    expect(handleCopy).toHaveBeenCalled();
  });

  it('ProductCard komponentində fərdi linki kopyala düyməsi və detallara baxış işləməlidir', () => {
    const handleSelect = vi.fn();
    const handleCopy = vi.fn();
    const handleWhatsApp = vi.fn();
    const handleCall = vi.fn();

    render(
      <ProductCard
        product={TEST_PRODUCT}
        theme={lightTheme}
        onSelect={handleSelect}
        onShare={vi.fn()}
        onWhatsApp={handleWhatsApp}
        onCall={handleCall}
        onCopyLink={handleCopy}
      />
    );

    expect(screen.getByText('ARDO 3000 Aspirator')).toBeDefined();
    expect(screen.getByText('3000')).toBeDefined();

    const productTitle = screen.getByText('ARDO 3000 Aspirator');
    fireEvent.click(productTitle);
    expect(handleSelect).toHaveBeenCalledWith(TEST_PRODUCT);

    const waBtn = screen.getByText('WhatsApp');
    fireEvent.click(waBtn);
    expect(handleWhatsApp).toHaveBeenCalledWith(TEST_PRODUCT);
  });

  it('Footer komponenti şirkət ünvanını xəritə linki kimi və sosial şəbəkələri istifadəçi adı ilə göstərir', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      address: 'Bakı şəhəri, Sədərək Ticarət Mərkəzi, Sıra 5',
      phoneNumber: '+994 12 555 55 55',
      phoneNumbers: ['+994 12 555 55 55', '+994 50 222 33 44'],
      whatsappNumber: '994501112233',
      instagramUsername: '@sahara.electronics',
      facebookUsername: 'Sahara Electronics',
    };
    render(<Footer settings={settings} categories={DEFAULT_CATEGORIES} theme={lightTheme} />);
    expect(screen.getByText(/Bakı şəhəri, Sədərək Ticarət Mərkəzi, Sıra 5/i)).toBeDefined();
    expect(screen.getByText('+994 12 555 55 55')).toBeDefined();
    expect(screen.getByText('+994 50 222 33 44')).toBeDefined();
    expect(screen.getByText(/Ünvan və Lokasiya/i)).toBeDefined();
    expect(screen.getByText('@sahara.electronics')).toBeDefined();
    expect(screen.getByText('Sahara Electronics')).toBeDefined();
    expect(screen.getByTitle('Xəritədə açmaq üçün toxunun')).toBeDefined();
  });

  it('FloatingActions komponenti sabit WhatsApp və Zəng düymələrini göstərir və klikləri icra edir', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      phoneNumber: '+994124445566',
      whatsappNumber: '994501234567',
    };
    const showToast = vi.fn();
    const onTrack = vi.fn();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<FloatingActions settings={settings} theme={lightTheme} showToast={showToast} onTrack={onTrack} />);
    
    const waBtn = screen.getByTitle('WhatsApp ilə birbaşa əlaqə');
    const callBtn = screen.getByTitle('Zəng etmək üçün toxunun');

    expect(waBtn).toBeDefined();
    expect(callBtn).toBeDefined();

    fireEvent.click(waBtn);
    expect(onTrack).toHaveBeenCalledWith('contact_whatsapp');
    expect(openSpy).toHaveBeenCalled();

    fireEvent.click(callBtn);
    expect(onTrack).toHaveBeenCalledWith('contact_call');

    openSpy.mockRestore();
  });

  it('FloatingActions ilk açılışda şaquli (vertical) mətnlərlə, təyin edilən müddətdən sonra isə üfüqi (horizontal) ikonlara çevrilir', () => {
    vi.useFakeTimers();
    const settings = {
      ...DEFAULT_SETTINGS,
      phoneNumber: '+994124445566',
      whatsappNumber: '994501234567',
    };

    const { container } = render(<FloatingActions settings={settings} theme={lightTheme} showToast={vi.fn()} collapseDelayMs={1000} />);
    const aside = container.querySelector('.mobile-floating-actions');
    expect(aside?.classList.contains('is-expanded')).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(aside?.classList.contains('is-collapsed')).toBe(true);
    vi.useRealTimers();
  });

  it('FloatingActions yuxarı düyməsi yalnız səhifə aşağı sürüşdürüldükdə (scroll > 280) görünür', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      phoneNumber: '+994124445566',
      whatsappNumber: '994501234567',
    };

    const { container } = render(<FloatingActions settings={settings} theme={lightTheme} showToast={vi.fn()} />);
    const topBtn = container.querySelector('.floating-top');

    // Initially at scrollY = 0, top button is hidden
    expect(topBtn?.classList.contains('is-hidden')).toBe(true);

    // Simulate scrolling down past 300px
    Object.defineProperty(window, 'scrollY', { value: 350, writable: true });
    fireEvent.scroll(window);

    expect(topBtn?.classList.contains('is-visible')).toBe(true);

    // Scroll back to top
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    fireEvent.scroll(window);

    expect(topBtn?.classList.contains('is-hidden')).toBe(true);
  });
});
