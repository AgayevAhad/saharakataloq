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

const sampleLotusMeatGrinder: Product = {
  id: 'lotus-1800w',
  code: '1800W',
  title: 'Ətçəkən Lotus 1800W',
  brandId: 'lotus',
  category: 'meat_grinder',
  categoryName: 'Ətçəkənlər',
  image: '/media/products/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus 1800W/Ətçəkən Lotus 1800W_light.webp',
  darkImage: '/media/products/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus 1800W/Ətçəkən Lotus 1800W_dark.webp',
  gallery: [
    '/media/products/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus 1800W/Ətçəkən Lotus 1800W_light.webp',
    '/media/products/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus 1800W/Ətçəkən Lotus 1800W (2)_light.webp',
    '/media/products/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus 1800W/Ətçəkən Lotus 1800W (3)_light.webp',
  ],
  media: [
    {
      id: 'media-lotus-1800w-1',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus 1800W/Ətçəkən Lotus 1800W_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus 1800W/Ətçəkən Lotus 1800W_dark.webp',
      alt: 'Ətçəkən Lotus 1800W - 1',
      objectPosition: 'center',
      fitMode: 'contain',
    },
    {
      id: 'media-lotus-1800w-2',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus 1800W/Ətçəkən Lotus 1800W (2)_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus 1800W/Ətçəkən Lotus 1800W (2)_dark.webp',
      alt: 'Ətçəkən Lotus 1800W - 2',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Maksimal güc', value: '1800 Vt', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Məhsuldarlıq', value: '2 kq/dəq', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'Lotus elektrik ətçəkən',
  highlights: ['1800 Vt güc', 'Revers funksiyası'],
};

describe('LOTUS Meat Grinder (Ətçəkən) Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus 1800W/Ətçəkən Lotus 1800W_light.webp';
    const darkUrl = '/media/products/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus 1800W/Ətçəkən Lotus 1800W_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus 1800W/Ətçəkən Lotus 1800W_light.webp';
    const expectedDark = '/media/products/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus 1800W/Ətçəkən Lotus 1800W_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for Lotus meat grinder assets', () => {
    const lightUrl = sampleLotusMeatGrinder.image!;
    const darkUrl = sampleLotusMeatGrinder.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Lotus Meat Grinder" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Lotus Meat Grinder" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for Lotus meat grinder', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleLotusMeatGrinder} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusMeatGrinder.image);

    rerender(<ProductCard product={sampleLotusMeatGrinder} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusMeatGrinder.darkImage);
  });
});
