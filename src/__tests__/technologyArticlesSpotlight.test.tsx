// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { BannerHero } from '../components/BannerHero';
import { lightTheme } from '../types/theme';
import { DEFAULT_ARTICLES } from '../data/catalog';

afterEach(() => {
  cleanup();
});

describe('Multi-Brand Technology & Promotional Spotlight Suite', () => {
  it('DEFAULT_ARTICLES contains multi-brand technologies including ARDO (SABAF) and LOTUS (Rapid Air)', () => {
    const sabafArticle = DEFAULT_ARTICLES.find((a) => a.id === 'art-sabaf');
    const lotusAirfryerArticle = DEFAULT_ARTICLES.find((a) => a.id === 'art-lotus-rapidair');
    const lotusTouchArticle = DEFAULT_ARTICLES.find((a) => a.id === 'art-lotus-touch');

    expect(sabafArticle).toBeDefined();
    expect(sabafArticle?.title).toContain('SABAF');

    expect(lotusAirfryerArticle).toBeDefined();
    expect(lotusAirfryerArticle?.title).toContain('Lotus 360° Rapid Air');

    expect(lotusTouchArticle).toBeDefined();
    expect(lotusTouchArticle?.title).toContain('Lotus Ağıllı Sensor');
  });

  it('BannerHero renders the technology spotlight and smoothly cycles between multi-brand articles', () => {
    const onOpenArticle = vi.fn();

    render(
      <BannerHero
        theme={lightTheme}
        articles={DEFAULT_ARTICLES}
        onOpenArticle={onOpenArticle}
      />
    );

    // Initial article is rendered
    expect(screen.getByText('Məişət Texnikasında İnvertor Texnologiyası')).toBeDefined();

    // Click next button to navigate to SABAF
    const nextBtn = screen.getByTitle('Növbəti texnologiya');
    fireEvent.click(nextBtn);

    // Click next again to navigate to Lotus Rapid Air
    fireEvent.click(nextBtn);

    // Click on the technology bar to open modal
    const spotlightBar = screen.getByRole('button', { name: /Texnologiya:/i });
    fireEvent.click(spotlightBar);

    expect(onOpenArticle).toHaveBeenCalled();
  });
});
