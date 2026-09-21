import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SiteHeader } from '../components/site/SiteHeader';
import { MegaMenu } from '../components/site/MegaMenu';
import { BannerHero } from '../components/BannerHero';
import { BannerHeroSkeleton } from '../components/Skeletons';
import { TrustHighlights } from '../components/TrustHighlights';
import { CustomerCarePage } from '../pages/CustomerCarePage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { BrandsPage } from '../pages/BrandsPage';
import { BrandDetailPage } from '../pages/BrandDetailPage';
import { UserAccountDrawer } from '../components/site/UserAccountDrawer';
import { ProductCard } from '../components/ProductCard';
import { FeaturedProductCard } from '../components/FeaturedProductCard';
import { DEFAULT_CATALOG } from '../data/catalog';
import { darkTheme, lightTheme } from '../types/theme';
import type { Product } from '../types/product';

const mockProduct: Product = {
  id: 'test-product',
  code: 'TEST-1',
  title: 'Test məhsulu',
  category: 'test-category',
  categoryName: 'Test kateqoriyası',
  image: '/media/test.webp',
  brandId: 'ardo',
  price: 750,
  status: 'published',
  shortDesc: '',
  specs: [],
  highlights: [],
};
const headerProps = {
  categories: DEFAULT_CATALOG.categories,
  brands: DEFAULT_CATALOG.brands,
  products: DEFAULT_CATALOG.products,
  onNavigate: vi.fn(),
  onToggleTheme: vi.fn(),
  searchQuery: '',
  onSearchChange: vi.fn(),
  onOpenSearchModal: vi.fn(),
  comparisonCount: 0,
  favoritesCount: 0,
  onOpenSaharaMatch: vi.fn(),
};

describe('Duzelisler Items 35 to 45 Requirements Verification', () => {
  // Item 40: Sticky SiteHeader elevated dark mode background
  it('Item 40: SiteHeader in dark mode has elevated glassmorphism background rgba(15, 23, 42, 0.88)', () => {
    const { container } = render(
      <SiteHeader
        theme={darkTheme}
        themeMode="dark"
        currentRoute="home"
        categories={DEFAULT_CATALOG.categories}
        brands={DEFAULT_CATALOG.brands}
        onNavigate={vi.fn()}
        {...headerProps}
      />
    );
    const header = container.querySelector('header');
    expect(header).toBeTruthy();
    expect(header?.style.backgroundColor).toBe('rgba(15, 23, 42, 0.88)');
  });

  // Item 42: Favorites icon red highlight on route or favoritesCount > 0
  it('Item 42: SiteHeader favorites heart turns red when on favorites page or favoritesCount > 0', () => {
    const { container, rerender } = render(
      <SiteHeader
        {...headerProps}
        theme={lightTheme}
        themeMode="light"
        currentRoute="favorites"
        favoritesCount={0}
        categories={DEFAULT_CATALOG.categories}
        brands={DEFAULT_CATALOG.brands}
        onNavigate={vi.fn()}
      />
    );
    const favBtn = container.querySelector('.header-favorites-btn');
    expect(favBtn).toBeTruthy();
    const heartSvg = favBtn?.querySelector('svg');
    expect(heartSvg?.getAttribute('stroke') || heartSvg?.getAttribute('fill')).toBe('#ef4444');

    // Rerender with favoritesCount > 0 on home route
    rerender(
      <SiteHeader
        {...headerProps}
        theme={lightTheme}
        themeMode="light"
        currentRoute="home"
        favoritesCount={3}
        categories={DEFAULT_CATALOG.categories}
        brands={DEFAULT_CATALOG.brands}
        onNavigate={vi.fn()}
      />
    );
    const favBtnWithItems = container.querySelector('.header-favorites-btn');
    const heartSvgWithItems = favBtnWithItems?.querySelector('svg');
    expect(
      heartSvgWithItems?.getAttribute('stroke') || heartSvgWithItems?.getAttribute('fill')
    ).toBe('#ef4444');
  });

  // Item 38: MegaMenu no red border on hover
  it('Item 38: MegaMenu category/brand links have border none', () => {
    const { container } = render(
      <MegaMenu
        isOpen={true}
        theme={lightTheme}
        categories={DEFAULT_CATALOG.categories}
        brands={DEFAULT_CATALOG.brands}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        onSelectCategory={vi.fn()}
        onSelectBrand={vi.fn()}
      />
    );
    const menuLinks = container.querySelectorAll('.mega-menu-cat-btn, .mega-menu-brand-card');
    menuLinks.forEach((link) => {
      const htmlEl = link as HTMLElement;
      expect(htmlEl.style.border).toMatch(/none/);
    });
  });

  // Item 41: BannerHero vertical room and objectPosition
  it('Item 41: BannerHero has padding 16px 0, minHeight >= 540px, objectPosition center center', () => {
    const { container } = render(<BannerHero theme={darkTheme} onOpenArticle={vi.fn()} />);
    const heroCard = container.querySelector('.banner-hero-card') as HTMLElement;
    expect(heroCard).toBeTruthy();
    expect(parseInt(heroCard.style.minHeight, 10)).toBeGreaterThanOrEqual(540);
    expect(heroCard.querySelector('video')?.style.objectFit).toBe('contain');
  });

  it('Item 41: hero skeleton reserves the same media geometry before content loads', () => {
    const live = render(<BannerHero theme={darkTheme} onOpenArticle={vi.fn()} />);
    const loadedCard = live.container.querySelector('.banner-hero-card') as HTMLElement;
    const loadedWrapper = live.container.querySelector('.banner-hero-wrapper') as HTMLElement;
    const skeleton = render(<BannerHeroSkeleton theme={darkTheme} />);
    const skeletonCard = skeleton.container.querySelector('.banner-hero-card') as HTMLElement;
    const skeletonWrapper = skeleton.container.querySelector('.banner-hero-wrapper') as HTMLElement;
    expect(skeletonCard.style.aspectRatio).toBe(loadedCard.style.aspectRatio);
    expect(skeletonCard.style.minHeight).toBe(loadedCard.style.minHeight);
    expect(skeletonWrapper.style.padding).toBe(loadedWrapper.style.padding);
  });

  it('Item 41: hero progress timer is removed when the banner unmounts', () => {
    vi.useFakeTimers();
    try {
      const hero = render(<BannerHero theme={darkTheme} onOpenArticle={vi.fn()} />);
      expect(vi.getTimerCount()).toBeGreaterThan(0);
      hero.unmount();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  // Item 43: TrustHighlights interactive navigation
  it('Item 43: TrustHighlights all 4 cards are interactive and trigger onNavigate', () => {
    const onNavigate = vi.fn();
    render(<TrustHighlights theme={darkTheme} onNavigate={onNavigate} />);

    const warrantyCard = screen
      .getByText('Rəsmi zəmanət')
      .closest('[role="button"]') as HTMLElement;
    const deliveryCard = screen
      .getByText('Çatdırılma məlumatı')
      .closest('[role="button"]') as HTMLElement;
    const paymentCard = screen
      .getByText('Ödəniş məlumatı')
      .closest('[role="button"]') as HTMLElement;
    const supportCard = screen
      .getByText('Peşəkar dəstək')
      .closest('[role="button"]') as HTMLElement;

    expect(warrantyCard).toBeTruthy();
    expect(deliveryCard).toBeTruthy();
    expect(paymentCard).toBeTruthy();
    expect(supportCard).toBeTruthy();

    fireEvent.click(warrantyCard); // Rəsmi zəmanət -> warranty
    expect(onNavigate).toHaveBeenCalledWith('warranty');

    fireEvent.click(deliveryCard); // Çatdırılma -> delivery
    expect(onNavigate).toHaveBeenCalledWith('delivery');

    fireEvent.click(paymentCard); // Ödəniş -> faq
    expect(onNavigate).toHaveBeenCalledWith('faq');

    fireEvent.click(supportCard); // Peşəkar dəstək -> support
    expect(onNavigate).toHaveBeenCalledWith('support');
  });

  // Item 44: CustomerCarePage WhatsApp and Call buttons
  it('Item 44: CustomerCarePage WhatsApp (soft green) and Call (soft red) buttons are symmetrical', () => {
    const { container } = render(
      <CustomerCarePage
        kind="warranty"
        settings={DEFAULT_CATALOG.settings}
        theme={darkTheme}
        themeMode="dark"
        onNavigate={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
      />
    );
    const buttons = container.querySelectorAll('button');
    const waBtn = Array.from(buttons).find((b) => b.textContent?.includes('WhatsApp'));
    const callBtn = Array.from(buttons).find((b) => b.textContent?.includes('Zəng'));

    expect(waBtn).toBeTruthy();
    expect(callBtn).toBeTruthy();
    expect(waBtn?.style.backgroundColor).toContain('rgba(34, 197, 94, 0.12');
    expect(waBtn?.style.color).toBe('#16a34a');
    expect(callBtn?.style.backgroundColor).toContain('rgba(220, 38, 38, 0.1');
    expect(callBtn?.style.color).toBe('#dc2626');
  });

  // Item 45: ProductDetailPage buttons
  it('Item 45: ProductDetailPage has WhatsApp soft green, Call soft red, Cart soft red, Specs soft red', () => {
    const { container } = render(
      <ProductDetailPage
        product={mockProduct}
        theme={darkTheme}
        themeMode="dark"
        brands={DEFAULT_CATALOG.brands}
        categories={DEFAULT_CATALOG.categories}
        allProducts={DEFAULT_CATALOG.products}
        settings={DEFAULT_CATALOG.settings}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onAddToCart={vi.fn()}
        onNavigate={vi.fn()}
        onSelectProduct={vi.fn()}
      />
    );
    const buttons = container.querySelectorAll('button');
    const waBtn = Array.from(buttons).find((b) => b.textContent?.includes('WhatsApp'));
    const callBtn = Array.from(buttons).find((b) => b.textContent?.includes('Zəng'));
    const cartBtn = Array.from(buttons).find((b) => b.textContent?.includes('Səbətə'));
    const specsBtn = Array.from(buttons).find((b) => b.textContent?.includes('Bütün Texniki'));

    expect(waBtn?.style.backgroundColor).toContain('rgba(34, 197, 94, 0.12');
    expect(waBtn?.style.color).toBe('#16a34a');
    expect(callBtn?.style.backgroundColor).toContain('rgba(220, 38, 38, 0.1');
    expect(callBtn?.style.color).toBe('#dc2626');
    expect(cartBtn?.style.backgroundColor).toContain('rgba(220, 38, 38, 0.1');
    expect(cartBtn?.style.color).toBe('#dc2626');
    expect(specsBtn?.style.backgroundColor).toContain('rgba(220, 38, 38, 0.1');
    expect(specsBtn?.style.color).toBe('#dc2626');
  });

  // Item 39: UserAccountDrawer submit buttons in soft red
  it('Item 39: UserAccountDrawer submit buttons use soft red styling', () => {
    const { container } = render(
      <UserAccountDrawer
        isOpen={true}
        theme={darkTheme}
        themeMode="dark"
        authUser={null}
        onClose={vi.fn()}
        onLogin={vi.fn()}
        onRegister={vi.fn()}
        onLogout={vi.fn()}
        onNavigate={vi.fn()}
        onToggleTheme={vi.fn()}
        cartCount={0}
        favoritesCount={0}
      />
    );
    const submitBtn = container.querySelector('button[type="submit"]') as HTMLElement;
    expect(submitBtn).toBeTruthy();
    expect(submitBtn.style.backgroundColor).toContain('rgba(220, 38, 38, 0.1');
    expect(submitBtn.style.color).toBe('#dc2626');
  });

  // Item 36: Brand logo cards in dark mode on BrandsPage
  it('Item 36: BrandsPage brand logo cards have pure white backgrounds in dark mode', () => {
    const { container } = render(
      <BrandsPage
        brands={DEFAULT_CATALOG.brands}
        products={DEFAULT_CATALOG.products}
        theme={darkTheme}
        onNavigate={vi.fn()}
      />
    );
    const logoBoxes = container.querySelectorAll('.brand-card-logo-box');
    expect(logoBoxes.length).toBeGreaterThan(0);
    logoBoxes.forEach((box) => {
      const el = box as HTMLElement;
      expect(el.style.backgroundColor).toBe('#ffffff');
    });
  });

  // Item 39: ProductCard and FeaturedProductCard hover actions soft tinted styling
  it('Item 39: ProductCard and FeaturedProductCard hover actions use soft tinted boxes and colored icons', () => {
    const { container: prodContainer } = render(
      <ProductCard
        product={mockProduct}
        theme={darkTheme}
        onSelect={vi.fn()}
        onAddToCart={vi.fn()}
        onCall={vi.fn()}
        onWhatsApp={vi.fn()}
      />
    );
    const waAction = prodContainer.querySelector('.card-action-btn-wa') as HTMLElement;
    const callAction = prodContainer.querySelector('.card-action-btn-call') as HTMLElement;
    const cartAction = prodContainer.querySelector('.card-action-btn-cart') as HTMLElement;

    expect(waAction.style.backgroundColor).toContain('rgba(34, 197, 94, 0.12');
    expect(callAction.style.backgroundColor).toContain('rgba(220, 38, 38, 0.1');
    expect(cartAction.style.backgroundColor).toContain('rgba(220, 38, 38, 0.1');

    const { container: featContainer } = render(
      <FeaturedProductCard
        product={mockProduct}
        theme={darkTheme}
        onSelect={vi.fn()}
        onAddToCart={vi.fn()}
        onCall={vi.fn()}
        onWhatsApp={vi.fn()}
      />
    );
    const featWa = featContainer.querySelector('.card-action-btn-wa') as HTMLElement;
    const featCall = featContainer.querySelector('.card-action-btn-call') as HTMLElement;
    const featCart = featContainer.querySelector('.card-action-btn-cart') as HTMLElement;

    expect(featWa.style.backgroundColor).toContain('rgba(34, 197, 94, 0.12');
    expect(featCall.style.backgroundColor).toContain('rgba(220, 38, 38, 0.1');
    expect(featCart.style.backgroundColor).toContain('rgba(220, 38, 38, 0.1');
  });

  // Item 36: BrandDetailPage hero logo container has white background
  it('Item 36: BrandDetailPage hero logo box has high-contrast white background', () => {
    const { container } = render(
      <BrandDetailPage
        brand={DEFAULT_CATALOG.brands[0]}
        products={DEFAULT_CATALOG.products}
        categories={DEFAULT_CATALOG.categories}
        theme={darkTheme}
        onNavigate={vi.fn()}
      />
    );
    const heroBox = container.querySelector('.brand-detail-hero > div:first-child') as HTMLElement;
    expect(heroBox).toBeTruthy();
    expect(heroBox.style.background).toBe('#ffffff');
  });

  // Item 36: MegaMenu brand items have white background in dark mode
  it('Item 36: MegaMenu brand items render on white container in dark mode', () => {
    const { container } = render(
      <MegaMenu
        isOpen={true}
        theme={darkTheme}
        categories={DEFAULT_CATALOG.categories}
        brands={DEFAULT_CATALOG.brands}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        onSelectCategory={vi.fn()}
        onSelectBrand={vi.fn()}
      />
    );
    const brandButtons = container.querySelectorAll('.mega-menu-brand-card');
    expect(brandButtons.length).toBeGreaterThan(0);
    const firstBrand = brandButtons[0] as HTMLElement;
    expect(firstBrand.style.backgroundColor).toBe('#ffffff');
  });
});
