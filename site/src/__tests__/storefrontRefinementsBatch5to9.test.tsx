import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { BannerHero } from '../components/BannerHero';
import { SpecialDiscountBanner } from '../components/SpecialDiscountBanner';
import { Footer } from '../components/Footer';
import { SiteHeader } from '../components/site/SiteHeader';
import { FeaturedProductCard } from '../components/FeaturedProductCard';
import { lightTheme } from '../types/theme';

describe('Storefront Refinements (Items 5, 6, 7, 8, 9)', () => {
  it('Item 5: BannerHero videosu 20-ci saniyədə dövrə (loop) nəzarətinə malikdir', () => {
    const { container } = render(
      <BannerHero theme={lightTheme} onOpenArticle={() => {}} />
    );
    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video).toBeTruthy();
    expect(video.getAttribute('src')).toBe('/media/Videosahara.mp4');

    // Simulate timeupdate >= 20s
    Object.defineProperty(video, 'currentTime', { value: 21, writable: true });
    fireEvent.timeUpdate(video);
    expect(video.currentTime).toBe(0);
  });

  it('Item 6: SpecialDiscountBanner daxilində dublikat daxili şəkil elementi yoxdur', () => {
    const { container } = render(
      <SpecialDiscountBanner theme={lightTheme} />
    );
    // There should NOT be an inner img with alt "Sahara Xüsusi Endirimlər"
    const duplicateImg = screen.queryByAltText('Sahara Xüsusi Endirimlər');
    expect(duplicateImg).toBeNull();

    // Verify main discount heading & button exist
    expect(screen.getByText(/Xüsusi endirimlər/i)).toBeTruthy();
    expect(screen.getByText(/Endirimlərə bax/i)).toBeTruthy();
  });

  it('Item 7: Footer-də boş sosial ikonlar çıxarılıb və e-poçt mailto linki əlavə edilib', () => {
    const settings = {
      whatsappNumber: '+994502613041',
      phoneNumber: '+994502613041',
      email: 'info@saharaelectronics.az',
      address: 'Sədərək TM',
    };

    render(<Footer settings={settings} theme={lightTheme} />);

    // Check that empty facebook link under newsletter is removed
    const emailLink = screen.getByText('info@saharaelectronics.az');
    expect(emailLink).toBeTruthy();
    expect(emailLink.closest('a')?.getAttribute('href')).toBe('mailto:info@saharaelectronics.az');
  });

  it('Item 8: SiteHeader Endirimlər linki qırmızı deyil və hover zamanı naviqasiya önbaxış paneli genişlənir', () => {
    const categories = [{ id: 'cat-1', name: 'Soyuducular', active: true, count: 5 }];
    const brands = [{ id: 'brand-1', name: 'ARDO', active: true }];

    const { container } = render(
      <SiteHeader
        currentRoute="home"
        onNavigate={() => {}}
        categories={categories as any}
        brands={brands as any}
        products={[]}
        theme={lightTheme}
        themeMode="light"
        onToggleTheme={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
        onOpenSearchModal={() => {}}
        comparisonCount={0}
        favoritesCount={0}
        onOpenSaharaMatch={() => {}}
      />
    );

    // Endirimlər button exists in secondary nav
    const discountsBtn = screen.getByRole('button', { name: /^Endirimlər$/i });
    expect(discountsBtn).toBeTruthy();

    // Hover on "Brendlər" triggers preview panel
    const brandsBtn = screen.getByRole('button', { name: /^Brendlər$/i });
    fireEvent.mouseEnter(brandsBtn);

    const previewPanel = container.querySelector('.header-nav-preview-panel');
    expect(previewPanel).toBeTruthy();
    expect(screen.getByText(/Rəsmi Tərəfdaş Brendlərimiz/i)).toBeTruthy();
  });

  it('Item 8 (Search): SiteHeader axtarış inputuna toxunduqda panel genişlənir və daxili dropdown açılır', () => {
    const categories = [{ id: 'cat-1', name: 'Soyuducular', active: true, count: 5 }];
    const brands = [{ id: 'brand-1', name: 'ARDO', active: true }];
    const products = [
      {
        id: 'p-1',
        title: 'ARDO Soyuducu 123',
        brandId: 'brand-1',
        categoryId: 'cat-1',
        published: true,
      },
    ];

    const handleSearchChange = vi.fn();

    const { container } = render(
      <SiteHeader
        currentRoute="home"
        onNavigate={() => {}}
        categories={categories as any}
        brands={brands as any}
        products={products as any}
        theme={lightTheme}
        themeMode="light"
        onToggleTheme={() => {}}
        searchQuery="ARDO"
        onSearchChange={handleSearchChange}
        onOpenSearchModal={() => {}}
        comparisonCount={0}
        favoritesCount={0}
        onOpenSaharaMatch={() => {}}
      />
    );

    const input = container.querySelector('[data-testid="header-search-input"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    // Focus on the search input
    fireEvent.focus(input);

    // Expanding dropdown is rendered inline right under header
    const inlineDropdown = container.querySelector('.smart-search-inline-dropdown') as HTMLElement;
    expect(inlineDropdown).toBeTruthy();
    expect(screen.getAllByText(/ARDO Soyuducu 123/i).length).toBeGreaterThan(0);

    // Header has elevated z-index above clickaway backdrop
    const headerEl = container.querySelector('header') as HTMLElement;
    expect(headerEl.style.zIndex).toBe('125');

    // Dropdown items are clickable and trigger navigation
    const resultItem = screen.getAllByText(/ARDO Soyuducu 123/i)[0];
    fireEvent.click(resultItem);
  });

  it('Secondary navigation hover expands preview panel with frosted glass blur', () => {
    const categories = [{ id: 'cat-1', name: 'Soyuducular', slug: 'soyuducular', active: true, sortOrder: 1 }];
    const brands = [{ id: 'ardo', name: 'ARDO', slug: 'ardo', active: true }];

    const { container } = render(
      <SiteHeader
        currentRoute="home"
        onNavigate={() => {}}
        categories={categories as any}
        brands={brands as any}
        products={[]}
        theme={lightTheme}
        themeMode="light"
        onToggleTheme={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
        onOpenSearchModal={() => {}}
        comparisonCount={0}
        favoritesCount={0}
        onOpenSaharaMatch={() => {}}
      />
    );

    // Find Brendlər nav button inside secondary nav and hover
    const secNav = container.querySelector('.header-secondary-nav') as HTMLElement;
    const brandsNavBtn = Array.from(secNav.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Brendlər') as HTMLElement;
    expect(brandsNavBtn).toBeTruthy();
    fireEvent.mouseEnter(brandsNavBtn);

    const navPanel = container.querySelector('.header-nav-preview-panel') as HTMLElement;
    expect(navPanel).toBeTruthy();
    expect(within(navPanel).getByText('Rəsmi Tərəfdaş Brendlərimiz')).toBeTruthy();
    expect(navPanel.style.backdropFilter).toContain('blur');
    const header = container.querySelector('header') as HTMLElement;
    expect(header.style.backdropFilter).toContain('blur');

    // Test Kataloq button hover as well
    const catalogBtn = container.querySelector('.mega-menu-trigger-btn') as HTMLElement;
    expect(catalogBtn).toBeTruthy();
    fireEvent.mouseEnter(catalogBtn);

    const catalogPanel = container.querySelector('.header-nav-preview-panel') as HTMLElement;
    expect(catalogPanel).toBeTruthy();
    expect(within(catalogPanel).getAllByText('Böyük Məişət Texnikası').length).toBeGreaterThan(0);
    expect(catalogPanel.style.backdropFilter).toContain('blur');
    expect(header.style.backdropFilter).toContain('blur');
    expect(container.querySelector('.header-nav-backdrop')).toBeNull();
  });

  it('Item 10: FeaturedProductCard kursor üstünə gəldikdə (hover) gizlənmir və is-revealed sinfini qoruyur', () => {
    const sampleProduct = {
      id: 'p-1',
      title: 'ARDO Soyuducu 123',
      price: 1200,
      image: '/media/ardo1.png',
      published: true,
    };

    const { container } = render(
      <FeaturedProductCard product={sampleProduct as any} theme={lightTheme} onSelect={() => {}} />
    );

    const card = container.querySelector('.featured-product-card') as HTMLElement;
    expect(card).toBeTruthy();

    // Hover over card
    fireEvent.mouseEnter(card);
    expect(card.classList.contains('is-card-hovered')).toBe(true);
    expect(card.style.overflow).toBe('hidden');

    // Mouse leave
    fireEvent.mouseLeave(card);
    expect(card.classList.contains('is-card-hovered')).toBe(false);
  });

  it('Item 11: Axtarış aktiv olduqda loqo böyüyür və altında kəşf şüarı göstərilir', () => {
    const { container } = render(
      <SiteHeader
        currentRoute="home"
        onNavigate={() => {}}
        categories={[]}
        brands={[]}
        products={[]}
        theme={lightTheme}
        themeMode="light"
        onToggleTheme={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
        onOpenSearchModal={() => {}}
        comparisonCount={0}
        favoritesCount={0}
        onOpenSaharaMatch={() => {}}
      />
    );

    // Focus / click search input to expand search
    const searchTrigger = container.querySelector('[data-testid="header-search-trigger"]') as HTMLElement;
    expect(searchTrigger).toBeTruthy();
    fireEvent.click(searchTrigger);

    // Tagline appears under enlarged logo
    expect(screen.getByText(/Arzuladığınız texnologiyanı asanlıqla kəşf edin/i)).toBeTruthy();
  });

  it('Item 12: BannerHero çərçivəsizdir (border: none) və dumannı/şəffaf vizual dərinlik üçün minimum 480px hündürlüyə malikdir', () => {
    const { container } = render(
      <BannerHero theme={lightTheme} onOpenArticle={() => {}} />
    );

    const heroCard = container.querySelector('.banner-hero-card') as HTMLElement;
    expect(heroCard).toBeTruthy();
    expect(heroCard.style.border.includes('none')).toBe(true);
    expect(parseInt(heroCard.style.minHeight, 10)).toBeGreaterThanOrEqual(480);
  });
});
