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

const sampleLotusOven: Product = {
  id: 'lotus-lt4545-airfry-inox',
  code: 'LT4545 Airfry Inox',
  title: 'Soba Lotus LT4545 Airfry Inox',
  brandId: 'lotus',
  category: 'oven',
  categoryName: 'Sobalar',
  image: '/media/products/LOTUS/LOTUS_SOBALAR/Soba Lotus LT4545 Airfry Inox/Soba Lotus LT4545 Airfry Inox (2)_light.webp',
  darkImage: '/media/products/LOTUS/LOTUS_SOBALAR/Soba Lotus LT4545 Airfry Inox/Soba Lotus LT4545 Airfry Inox (2)_dark.webp',
  gallery: [
    '/media/products/LOTUS/LOTUS_SOBALAR/Soba Lotus LT4545 Airfry Inox/Soba Lotus LT4545 Airfry Inox (2)_light.webp',
    '/media/products/LOTUS/LOTUS_SOBALAR/Soba Lotus LT4545 Airfry Inox/Soba Lotus LT4545 Airfry Inox_light.webp',
  ],
  media: [
    {
      id: 'media-lotus-lt4545-airfry-inox-1',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_SOBALAR/Soba Lotus LT4545 Airfry Inox/Soba Lotus LT4545 Airfry Inox (2)_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_SOBALAR/Soba Lotus LT4545 Airfry Inox/Soba Lotus LT4545 Airfry Inox (2)_dark.webp',
      alt: 'Soba Lotus LT4545 Airfry Inox - 1',
      objectPosition: 'center',
      fitMode: 'contain',
    },
    {
      id: 'media-lotus-lt4545-airfry-inox-2',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_SOBALAR/Soba Lotus LT4545 Airfry Inox/Soba Lotus LT4545 Airfry Inox_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_SOBALAR/Soba Lotus LT4545 Airfry Inox/Soba Lotus LT4545 Airfry Inox_dark.webp',
      alt: 'Soba Lotus LT4545 Airfry Inox - 2',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Növ', value: 'Quraşdırılan soba', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Həcm', value: '70 L', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'Lotus 70 L Airfry Inox quraşdırılan soba',
  highlights: ['Airfry funksiyası', 'Katalitik təmizləmə'],
};

describe('LOTUS Oven (Soba) Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_SOBALAR/Soba Lotus LT4545 Airfry Inox/Soba Lotus LT4545 Airfry Inox (2)_light.webp';
    const darkUrl = '/media/products/LOTUS/LOTUS_SOBALAR/Soba Lotus LT4545 Airfry Inox/Soba Lotus LT4545 Airfry Inox (2)_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_SOBALAR/Soba Lotus LT4545 Airfry Inox/Soba Lotus LT4545 Airfry Inox (2)_light.webp';
    const expectedDark = '/media/products/LOTUS/LOTUS_SOBALAR/Soba Lotus LT4545 Airfry Inox/Soba Lotus LT4545 Airfry Inox (2)_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for Lotus Oven assets', () => {
    const lightUrl = sampleLotusOven.image!;
    const darkUrl = sampleLotusOven.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Lotus Oven" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Lotus Oven" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for Lotus Oven', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleLotusOven} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusOven.image);

    rerender(<ProductCard product={sampleLotusOven} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusOven.darkImage);
  });
});
