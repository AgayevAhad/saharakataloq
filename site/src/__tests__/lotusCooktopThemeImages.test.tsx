// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { resolveThemeImage } from '../utils/themeImage';
import { ShimmerImage } from '../components/ShimmerImage';
import { ProductCard } from '../components/ProductCard';
import { lightTheme, darkTheme } from '../types/theme';
import { Product } from '../types/product';

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
  document.body.className = '';
});

const sampleLotusCooktop: Product = {
  id: 'lotus-lt3160b',
  code: 'LT3160B',
  title: 'Bişirmə paneli Lotus LT3160B',
  brandId: 'lotus',
  category: 'cooktop',
  categoryName: 'Bişirmə panelləri',
  image: '/media/products/LOTUS/LOTUS_BISIRME_PANELI/Plite Lotus LT3160B/Plite Lotus LT3160B_light.webp',
  darkImage: '/media/products/LOTUS/LOTUS_BISIRME_PANELI/Plite Lotus LT3160B/Plite Lotus LT3160B_dark.webp',
  gallery: [
    '/media/products/LOTUS/LOTUS_BISIRME_PANELI/Plite Lotus LT3160B/Plite Lotus LT3160B_light.webp',
    '/media/products/LOTUS/LOTUS_BISIRME_PANELI/Plite Lotus LT3160B/Plite Lotus LT3160B (2)_light.webp',
    '/media/products/LOTUS/LOTUS_BISIRME_PANELI/Plite Lotus LT3160B/Plite Lotus LT3160B (3)_light.webp',
  ],
  media: [
    {
      id: 'media-lotus-lt3160b-1',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_BISIRME_PANELI/Plite Lotus LT3160B/Plite Lotus LT3160B_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_BISIRME_PANELI/Plite Lotus LT3160B/Plite Lotus LT3160B_dark.webp',
      alt: 'Bişirmə paneli Lotus LT3160B - 1',
      objectPosition: 'center',
      fitMode: 'contain',
    },
    {
      id: 'media-lotus-lt3160b-2',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_BISIRME_PANELI/Plite Lotus LT3160B/Plite Lotus LT3160B (2)_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_BISIRME_PANELI/Plite Lotus LT3160B/Plite Lotus LT3160B (2)_dark.webp',
      alt: 'Bişirmə paneli Lotus LT3160B - 2',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Brend', value: 'Lotus', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Növü', value: 'Qaz', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'Lotus qaz bişirmə paneli',
  highlights: ['Qaz nəzarəti', 'Avtomatik alışdırma'],
};

describe('LOTUS Cooktop (Bişirmə paneli) Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_BISIRME_PANELI/Plite Lotus LT3160B/Plite Lotus LT3160B_light.webp';
    const darkUrl = '/media/products/LOTUS/LOTUS_BISIRME_PANELI/Plite Lotus LT3160B/Plite Lotus LT3160B_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_BISIRME_PANELI/Plite Lotus LT3160B/Plite Lotus LT3160B_light.webp';
    const expectedDark = '/media/products/LOTUS/LOTUS_BISIRME_PANELI/Plite Lotus LT3160B/Plite Lotus LT3160B_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for Lotus cooktop assets', () => {
    const lightUrl = sampleLotusCooktop.image!;
    const darkUrl = sampleLotusCooktop.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Lotus Cooktop" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Lotus Cooktop" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for Lotus cooktop', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleLotusCooktop} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusCooktop.image);

    rerender(<ProductCard product={sampleLotusCooktop} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusCooktop.darkImage);
  });
});
