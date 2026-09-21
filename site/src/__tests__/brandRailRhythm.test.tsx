import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { AnimatedBrandRail, buildRhythmicBrandRailTrack } from '../components/AnimatedBrandRail';
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
  it('interleaves ARDO, LOTUS and ARTEL with a real partner between every featured brand', () => {
    const items: BrandRailItem[] = [
      {
        id: '1',
        brandId: 'ardo',
        brandSlug: 'ardo',
        brandName: 'ARDO',
        enabled: true,
        sortOrder: 1,
      },
      {
        id: '2',
        brandId: 'samsung',
        brandSlug: 'samsung',
        brandName: 'Samsung',
        enabled: true,
        sortOrder: 2,
      },
      {
        id: '3',
        brandId: 'bosch',
        brandSlug: 'bosch',
        brandName: 'Bosch',
        enabled: true,
        sortOrder: 3,
      },
      {
        id: '4',
        brandId: 'lotus',
        brandSlug: 'lotus',
        brandName: 'LOTUS',
        enabled: true,
        sortOrder: 4,
      },
      { id: '5', brandId: 'lg', brandSlug: 'lg', brandName: 'LG', enabled: true, sortOrder: 5 },
      {
        id: '6',
        brandId: 'beko',
        brandSlug: 'beko',
        brandName: 'Beko',
        enabled: true,
        sortOrder: 6,
      },
      {
        id: '7',
        brandId: 'artel',
        brandSlug: 'artel',
        brandName: 'ARTEL',
        enabled: true,
        sortOrder: 7,
      },
      {
        id: '8',
        brandId: 'midea',
        brandSlug: 'midea',
        brandName: 'Midea',
        enabled: true,
        sortOrder: 8,
      },
    ].map((item) => ({
      ...item,
      brandLogo: '',
      linkEnabled: true,
      publishedProductCount: 1,
      hasPublishedProducts: true,
    }));

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

    // All eligible brands render; the primary track never places two featured brands together.
    const ardoCards = document.querySelectorAll('[data-brand="ardo"]');
    const lotusCards = document.querySelectorAll('[data-brand="lotus"]');
    const artelCards = document.querySelectorAll('[data-brand="artel"]');
    const mideaCards = document.querySelectorAll('[data-brand="midea"]');

    expect(ardoCards.length).toBeGreaterThan(0);
    expect(lotusCards.length).toBeGreaterThan(0);
    expect(artelCards.length).toBeGreaterThan(0);
    expect(mideaCards.length).toBeGreaterThan(0);

    const track = buildRhythmicBrandRailTrack(items);
    const featured = new Set(['ardo', 'lotus', 'artel']);
    for (let index = 1; index < track.length; index += 1) {
      const previous = track[index - 1].brandSlug;
      const current = track[index].brandSlug;
      expect(featured.has(previous) && featured.has(current)).toBe(false);
      expect(previous).not.toBe(current);
    }
  });

  it('does not invent absent brands and removes brands without published products automatically', () => {
    const eligibleArdo = {
      id: 'ardo-item',
      brandId: 'ardo',
      brandSlug: 'ardo',
      brandName: 'ARDO',
      brandLogo: '',
      enabled: true,
      sortOrder: 1,
      linkEnabled: true,
      publishedProductCount: 3,
      hasPublishedProducts: true,
    } satisfies BrandRailItem;
    const emptyLotus = {
      ...eligibleArdo,
      id: 'lotus-item',
      brandId: 'lotus',
      brandSlug: 'lotus',
      brandName: 'LOTUS',
      publishedProductCount: 0,
      hasPublishedProducts: false,
    } satisfies BrandRailItem;
    const samsung = {
      ...eligibleArdo,
      id: 'samsung-item',
      brandId: 'samsung',
      brandSlug: 'samsung',
      brandName: 'Samsung',
      sortOrder: 2,
    } satisfies BrandRailItem;

    const track = buildRhythmicBrandRailTrack([eligibleArdo, emptyLotus, samsung]);
    expect(track.some((item) => item.brandSlug === 'ardo')).toBe(true);
    expect(track.some((item) => item.brandSlug === 'samsung')).toBe(true);
    expect(track.some((item) => item.brandSlug === 'lotus')).toBe(false);
    expect(track.some((item) => item.brandSlug === 'artel')).toBe(false);
  });

  it('resolves official vector SVGs for all core and partner brands', () => {
    const items: BrandRailItem[] = [
      {
        id: '1',
        brandId: 'ardo',
        brandSlug: 'ardo',
        brandName: 'ARDO',
        enabled: true,
        sortOrder: 1,
      },
      {
        id: '2',
        brandId: 'lotus',
        brandSlug: 'lotus',
        brandName: 'LOTUS',
        enabled: true,
        sortOrder: 2,
      },
      {
        id: '3',
        brandId: 'artel',
        brandSlug: 'artel',
        brandName: 'ARTEL',
        enabled: true,
        sortOrder: 3,
      },
      {
        id: '4',
        brandId: 'midea',
        brandSlug: 'midea',
        brandName: 'Midea',
        enabled: true,
        sortOrder: 4,
      },
      {
        id: '5',
        brandId: 'samsung',
        brandSlug: 'samsung',
        brandName: 'Samsung',
        enabled: true,
        sortOrder: 5,
      },
      {
        id: '6',
        brandId: 'bosch',
        brandSlug: 'bosch',
        brandName: 'Bosch',
        enabled: true,
        sortOrder: 6,
      },
    ].map((item) => ({
      ...item,
      brandLogo: '',
      linkEnabled: true,
      publishedProductCount: 1,
      hasPublishedProducts: true,
    }));

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
