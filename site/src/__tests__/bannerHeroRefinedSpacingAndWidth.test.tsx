import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { BannerHero } from '../components/BannerHero';
import { BannerHeroSkeleton, SiteHomePageSkeleton } from '../components/Skeletons';
import { HomePage } from '../pages/HomePage';
import { lightTheme, darkTheme } from '../types/theme';

describe('BannerHero Refined Spacing & Expanded Carousel Width', () => {
  it('BannerHero wrapper uses expanded maxWidth (1560px) and minimal vertical padding (8px)', () => {
    const { container } = render(<BannerHero theme={lightTheme} onOpenArticle={vi.fn()} />);

    const wrapper = container.querySelector('.banner-hero-wrapper') as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.style.maxWidth).toBe('1560px');
    expect(wrapper.style.paddingTop).toBe('8px');
    expect(wrapper.style.paddingBottom).toBe('8px');
  });

  it('BannerHeroSkeleton matches 1:1 pixel-perfect geometry with live BannerHero', () => {
    const live = render(<BannerHero theme={darkTheme} onOpenArticle={vi.fn()} />);
    const skeleton = render(<BannerHeroSkeleton theme={darkTheme} />);

    const liveWrapper = live.container.querySelector('.banner-hero-wrapper') as HTMLElement;
    const skelWrapper = skeleton.container.querySelector('.banner-hero-wrapper') as HTMLElement;
    const liveCard = live.container.querySelector('.banner-hero-card') as HTMLElement;
    const skelCard = skeleton.container.querySelector('.banner-hero-card') as HTMLElement;

    expect(skelWrapper.style.maxWidth).toBe(liveWrapper.style.maxWidth);
    expect(skelWrapper.style.padding).toBe(liveWrapper.style.padding);
    expect(skelCard.style.aspectRatio).toBe(liveCard.style.aspectRatio);
    expect(skelCard.style.minHeight).toBe(liveCard.style.minHeight);
  });

  it('HomePage container uses compact paddingTop (6px) and gap (24px) to prevent empty space', () => {
    const { container } = render(
      <HomePage
        brands={[]}
        categories={[]}
        products={[]}
        articles={[]}
        settings={{} as any}
        brandRail={{
          enabled: true,
          settings: {
            id: 's1',
            enabled: true,
            title: 'Brendlər',
            animationEnabled: true,
            speedSeconds: 30,
            direction: 'left',
            pauseOnHover: true,
            edgeFade: true,
            cardSize: 'md',
            sectionOrder: 1,
            themeVariant: 'neutral',
            version: 1,
            createdAt: '',
            updatedAt: '',
          },
          items: [],
        }}
        isLoadingRail={false}
        theme={lightTheme}
        onNavigate={vi.fn()}
        onSelectProduct={vi.fn()}
        onOpenSaharaMatch={vi.fn()}
        onOpenArticle={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onShare={vi.fn()}
        onCopyLink={vi.fn()}
        onAddToCart={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );

    const homeContainer = container.querySelector('.home-page-container') as HTMLElement;
    expect(homeContainer).toBeTruthy();
    expect(homeContainer.style.paddingTop).toBe('6px');
    expect(homeContainer.style.gap).toBe('24px');
  });

  it('SiteHomePageSkeleton synchronizes compact layout with HomePage', () => {
    const { container } = render(<SiteHomePageSkeleton theme={lightTheme} />);
    const skelContainer = container.querySelector('.home-page-container') as HTMLElement;
    expect(skelContainer).toBeTruthy();
    expect(skelContainer.style.paddingTop).toBe('6px');
    expect(skelContainer.style.gap).toBe('24px');
  });

  it('BannerHero renders hero-main-video and companion visual aside on mobile layout', () => {
    const { container } = render(<BannerHero theme={lightTheme} onOpenArticle={vi.fn()} />);
    const video = container.querySelector('video.hero-main-video');
    expect(video).toBeTruthy();
    const companionAside = container.querySelector('aside.banner-hero-companion');
    expect(companionAside).toBeTruthy();
  });

  it('BannerHero renders frosted blurred hero-primary-btn and triggers onNavigateCatalog', () => {
    const onNavigateCatalog = vi.fn();
    const { container } = render(
      <BannerHero
        theme={lightTheme}
        onOpenArticle={vi.fn()}
        onNavigateCatalog={onNavigateCatalog}
      />
    );
    const heroBtn = container.querySelector('.hero-primary-btn') as HTMLButtonElement;
    expect(heroBtn).toBeTruthy();
    expect(heroBtn.textContent).toContain('Məhsullara bax');
    heroBtn.click();
    expect(onNavigateCatalog).toHaveBeenCalledTimes(1);
  });

  it('BannerHero renders YouTube-style animated red progress bars for companion carousel', () => {
    const { container } = render(<BannerHero theme={lightTheme} onOpenArticle={vi.fn()} />);
    const companionButtons = container.querySelectorAll('.companion-progress-btn');
    expect(companionButtons.length).toBe(3);

    const companionTracks = container.querySelectorAll('.companion-progress-track');
    expect(companionTracks.length).toBe(3);

    const companionFills = container.querySelectorAll('.companion-progress-fill');
    expect(companionFills.length).toBe(3);

    // First companion slide is active by default
    expect(companionButtons[0].classList.contains('active')).toBe(true);

    // Clicking second companion progress button activates second slide
    fireEvent.click(companionButtons[1]);
    expect(companionButtons[1].classList.contains('active')).toBe(true);
  });
});
