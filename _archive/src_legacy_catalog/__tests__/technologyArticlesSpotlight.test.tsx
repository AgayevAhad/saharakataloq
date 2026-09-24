// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { BannerHero } from '../components/BannerHero';
import { InverterInfoModal } from '../components/InverterInfoModal';
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

  it('InverterInfoModal seamlessly switches between multi-brand technology tabs and updates content dynamically', () => {
    const handleClose = vi.fn();

    render(
      <InverterInfoModal
        visible={true}
        onClose={handleClose}
        theme={lightTheme}
        articles={DEFAULT_ARTICLES}
        initialArticleId="art-inverter"
      />
    );

    // Verify initial article (Inverter) is displayed
    expect(screen.getByRole('heading', { level: 3, name: /Məişət Texnikasında İnvertor Texnologiyası/i })).toBeDefined();
    expect(screen.getByText(/Tənzimlənən enerji istifadəsi/i)).toBeDefined();

    // Click on the SABAF tab button
    const sabafTab = screen.getByText(/🔥 İtalyan Təhlükəsizlik/i);
    fireEvent.click(sabafTab);

    // Verify content dynamically updated to SABAF and stayed selected
    expect(screen.getByRole('heading', { level: 3, name: /İtalyan SABAF Qaz Yanma Sistemi/i })).toBeDefined();
    expect(screen.getByText(/Qaz Nəzarət Sistemi \(Gas Control\)/i)).toBeDefined();
    expect(screen.getByText(/Mavi alov texnologiyası ilə maksimum istilik/i)).toBeDefined();

    // Click on the Lotus Rapid Air tab button
    const lotusAirfryerTab = screen.getByText(/🪷 Lotus Airfryer/i);
    fireEvent.click(lotusAirfryerTab);

    // Verify content dynamically updated to Lotus Rapid Air
    expect(screen.getByRole('heading', { level: 3, name: /Lotus 360° Rapid Air & Sağlam Qızartma/i })).toBeDefined();
    expect(screen.getByText(/360° İntensiv İsti Hava/i)).toBeDefined();

    // Click on 3D Convection tab button
    const convectionTab = screen.getByText(/🌪️ 3D Konveksiya/i);
    fireEvent.click(convectionTab);

    // Verify content dynamically updated to 3D Convection
    expect(screen.getByRole('heading', { level: 3, name: /3D Dairəvi Konveksiya və Bərabər Bişirmə/i })).toBeDefined();
    expect(screen.getByText(/Bərabər İstilik Sirkulyasiyası/i)).toBeDefined();

    // Test close button
    const closeBtn = screen.getByTitle('Bağla');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();

    // Test Escape key closes modal
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
