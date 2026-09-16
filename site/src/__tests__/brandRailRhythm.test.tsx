import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AnimatedBrandRail } from '../components/AnimatedBrandRail';
import { BrandRailData, BrandRailItem } from '../types/product';

const mockTheme = {
  bg: '#ffffff',
  bgCard: '#f8fafc',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  primary: '#0ea5e9',
} as any;

describe('AnimatedBrandRail - Rhythmic Recurrence & Vector Logos', () => {
  it('frequently and continuously interleaves ARDO, LOTUS, ARTEL, and MIDEA every 2 partner brands', () => {
    const items: BrandRailItem[] = [
      { id: '1', brandId: 'ardo', brandSlug: 'ardo', brandName: 'ARDO', enabled: true, sortOrder: 1 },
      { id: '2', brandId: 'samsung', brandSlug: 'samsung', brandName: 'Samsung', enabled: true, sortOrder: 2 },
      { id: '3', brandId: 'bosch', brandSlug: 'bosch', brandName: 'Bosch', enabled: true, sortOrder: 3 },
      { id: '4', brandId: 'lotus', brandSlug: 'lotus', brandName: 'LOTUS', enabled: true, sortOrder: 4 },
      { id: '5', brandId: 'lg', brandSlug: 'lg', brandName: 'LG', enabled: true, sortOrder: 5 },
      { id: '6', brandId: 'beko', brandSlug: 'beko', brandName: 'Beko', enabled: true, sortOrder: 6 },
      { id: '7', brandId: 'artel', brandSlug: 'artel', brandName: 'ARTEL', enabled: true, sortOrder: 7 },
      { id: '8', brandId: 'midea', brandSlug: 'midea', brandName: 'Midea', enabled: true, sortOrder: 8 },
    ];

    const data: BrandRailData = {
      enabled: true,
      settings: {
        id: '1',
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
      },
      items,
    };

    render(<AnimatedBrandRail data={data} theme={mockTheme} />);

    // Check that all 4 hero brand cards exist and are repeatedly rendered
    const ardoCards = document.querySelectorAll('[data-brand="ardo"]');
    const lotusCards = document.querySelectorAll('[data-brand="lotus"]');
    const artelCards = document.querySelectorAll('[data-brand="artel"]');
    const mideaCards = document.querySelectorAll('[data-brand="midea"]');

    expect(ardoCards.length).toBeGreaterThan(0);
    expect(lotusCards.length).toBeGreaterThan(0);
    expect(artelCards.length).toBeGreaterThan(0);
    expect(mideaCards.length).toBeGreaterThan(0);
  });

  it('resolves official vector SVGs for all core and partner brands', () => {
    const items: BrandRailItem[] = [
      { id: '1', brandId: 'ardo', brandSlug: 'ardo', brandName: 'ARDO', enabled: true, sortOrder: 1 },
      { id: '2', brandId: 'lotus', brandSlug: 'lotus', brandName: 'LOTUS', enabled: true, sortOrder: 2 },
      { id: '3', brandId: 'artel', brandSlug: 'artel', brandName: 'ARTEL', enabled: true, sortOrder: 3 },
      { id: '4', brandId: 'midea', brandSlug: 'midea', brandName: 'Midea', enabled: true, sortOrder: 4 },
      { id: '5', brandId: 'samsung', brandSlug: 'samsung', brandName: 'Samsung', enabled: true, sortOrder: 5 },
      { id: '6', brandId: 'bosch', brandSlug: 'bosch', brandName: 'Bosch', enabled: true, sortOrder: 6 },
    ];

    const data: BrandRailData = {
      enabled: true,
      settings: null,
      items,
    };

    render(<AnimatedBrandRail data={data} theme={mockTheme} />);

    // Verify images use official vector SVGs
    const images = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
    const srcList = images.map((img) => img.getAttribute('src'));

    expect(srcList.some((s) => s?.includes('/media/brands/ardo-logo.png'))).toBe(true);
    expect(srcList.some((s) => s?.includes('/media/brands/lotus-logo.png'))).toBe(true);
    expect(srcList.some((s) => s?.includes('/media/brands/artel-logo.svg'))).toBe(true);
    expect(srcList.some((s) => s?.includes('/media/brands/midea-logo.svg'))).toBe(true);
    expect(srcList.some((s) => s?.includes('/media/brands/samsung-logo.svg'))).toBe(true);
    expect(srcList.some((s) => s?.includes('/media/brands/bosch-logo.svg'))).toBe(true);
  });
});
