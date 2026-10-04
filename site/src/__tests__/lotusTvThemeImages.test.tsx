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

const sampleLotusTv: Product = {
  id: 'lotus-43lt2025',
  code: '43LT2025',
  title: 'TV Lotus 43LT2025',
  brandId: 'lotus',
  category: 'tv',
  categoryName: 'Televizorlar',
  image: '/media/products/LOTUS/LOTUS_TELEVIZOR/TV Lotus 43LT2025/TV Lotus 43LT2025_light.webp',
  darkImage: '/media/products/LOTUS/LOTUS_TELEVIZOR/TV Lotus 43LT2025/TV Lotus 43LT2025_dark.webp',
  gallery: [
    '/media/products/LOTUS/LOTUS_TELEVIZOR/TV Lotus 43LT2025/TV Lotus 43LT2025_light.webp',
  ],
  media: [
    {
      id: 'media-lotus-43lt2025-1',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_TELEVIZOR/TV Lotus 43LT2025/TV Lotus 43LT2025_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_TELEVIZOR/TV Lotus 43LT2025/TV Lotus 43LT2025_dark.webp',
      alt: 'TV Lotus 43LT2025 - 1',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Brend', value: 'Lotus', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Ekran ölçüsü', value: '43 düym', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'Lotus 43 düym Smart TV',
  highlights: ['43 düym', 'Smart TV'],
};

describe('LOTUS Television (Televizor) Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_TELEVIZOR/TV Lotus 43LT2025/TV Lotus 43LT2025_light.webp';
    const darkUrl = '/media/products/LOTUS/LOTUS_TELEVIZOR/TV Lotus 43LT2025/TV Lotus 43LT2025_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_TELEVIZOR/TV Lotus 43LT2025/TV Lotus 43LT2025_light.webp';
    const expectedDark = '/media/products/LOTUS/LOTUS_TELEVIZOR/TV Lotus 43LT2025/TV Lotus 43LT2025_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for Lotus TV assets', () => {
    const lightUrl = sampleLotusTv.image!;
    const darkUrl = sampleLotusTv.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Lotus TV" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Lotus TV" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for Lotus TV', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleLotusTv} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusTv.image);

    rerender(<ProductCard product={sampleLotusTv} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusTv.darkImage);
  });
});
