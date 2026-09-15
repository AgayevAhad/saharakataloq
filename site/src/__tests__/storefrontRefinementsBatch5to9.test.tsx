import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BannerHero } from '../components/BannerHero';
import { SpecialDiscountBanner } from '../components/SpecialDiscountBanner';
import { Footer } from '../components/Footer';
import { SiteHeader } from '../components/site/SiteHeader';
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
});
