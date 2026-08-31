// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { BannerHero } from '../components/BannerHero';
import { lightTheme } from '../types/theme';
import { DEFAULT_BRANDS } from '../data/catalog';

afterEach(() => {
  cleanup();
});

describe('Multi-Brand Animated Dynamic Hero Banner Suite', () => {
  it('renders multi-brand navigation tabs and switches between ARDO and LOTUS slides dynamically', () => {
    const onSelectBrand = vi.fn();
    const onOpenArticle = vi.fn();

    render(
      <BannerHero
        theme={lightTheme}
        brands={DEFAULT_BRANDS}
        onOpenArticle={onOpenArticle}
        onSelectBrand={onSelectBrand}
      />
    );

    // Assert initial ARDO slide is active
    expect(screen.getByRole('heading', { name: /Premium İtalyan ARDO & Məişət Texnikası/i })).toBeDefined();

    // Click on the LOTUS slide tab
    const lotusTab = screen.getByRole('button', { name: /LOTUS/i });
    fireEvent.click(lotusTab);

    // Assert that LOTUS slide is now displayed with its badges and title
    expect(screen.getByRole('heading', { name: /Müasir Lotus Məişət Texnikası/i })).toBeDefined();
    expect(screen.getByText(/190\+ Model Çeşidi/i)).toBeDefined();

    // Click CTA button on Lotus slide
    const ctaBtn = screen.getByRole('button', { name: /Lotus Məhsullarına Bax/i });
    fireEvent.click(ctaBtn);
    expect(onSelectBrand).toHaveBeenCalledWith('lotus');
  });

  it('renders technology articles bar and allows opening article modal', () => {
    const onOpenArticle = vi.fn();
    const mockArticles = [
      {
        id: 'art-sabaf',
        title: 'İtalyan SABAF Qaz Forsunkaları',
        subtitle: 'Təhlükəsiz və qənaətcil yanma sistemi.',
        badge: 'SABAF',
        active: true,
        advantages: [
          { title: 'Qaz Nəzarət', desc: 'Alov sönəndə qaz avtomatik kəsilir.' },
        ],
      },
    ];

    render(
      <BannerHero
        theme={lightTheme}
        brands={DEFAULT_BRANDS}
        articles={mockArticles}
        onOpenArticle={onOpenArticle}
      />
    );

    expect(screen.getByText('İtalyan SABAF Qaz Forsunkaları')).toBeDefined();
    const articleBar = screen.getByText('İtalyan SABAF Qaz Forsunkaları').closest('div');
    fireEvent.click(articleBar!);
    expect(onOpenArticle).toHaveBeenCalledWith(expect.objectContaining({ id: 'art-sabaf' }));
  });
});
