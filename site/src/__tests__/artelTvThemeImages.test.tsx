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

const sampleArtelTv: Product = {
  id: 'artel-a43puch010-black-google-tv-4k',
  code: 'A43PUCH010 Black Google TV 4K',
  title: 'TV Artel A43PUCH010 Black Google TV 4K',
  brandId: 'artel',
  category: 'tv',
  categoryName: 'Televizorlar',
  image: '/media/products/ARTEL/ARTEL_TELEVIZOR/TV Artel A43PUCH010 Black Google TV 4K/TV Artel A43PUCH010 Black Google TV 4K_light.webp',
  darkImage: '/media/products/ARTEL/ARTEL_TELEVIZOR/TV Artel A43PUCH010 Black Google TV 4K/TV Artel A43PUCH010 Black Google TV 4K_dark.webp',
  gallery: [
    '/media/products/ARTEL/ARTEL_TELEVIZOR/TV Artel A43PUCH010 Black Google TV 4K/TV Artel A43PUCH010 Black Google TV 4K_light.webp',
  ],
  media: [
    {
      id: 'media-artel-a43puch010-black-google-tv-4k-1',
      type: 'image',
      url: '/media/products/ARTEL/ARTEL_TELEVIZOR/TV Artel A43PUCH010 Black Google TV 4K/TV Artel A43PUCH010 Black Google TV 4K_light.webp',
      darkUrl: '/media/products/ARTEL/ARTEL_TELEVIZOR/TV Artel A43PUCH010 Black Google TV 4K/TV Artel A43PUCH010 Black Google TV 4K_dark.webp',
      alt: 'TV Artel A43PUCH010 Black Google TV 4K - 1',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Brend', value: 'ARTEL', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Ekran ölçüsü', value: '43 düym', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'ARTEL 43 düym Google TV 4K',
  highlights: ['43 düym', 'Google TV 4K'],
};

describe('ARTEL Television (Televizor) Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/ARTEL/ARTEL_TELEVIZOR/TV Artel A43PUCH010 Black Google TV 4K/TV Artel A43PUCH010 Black Google TV 4K_light.webp';
    const darkUrl = '/media/products/ARTEL/ARTEL_TELEVIZOR/TV Artel A43PUCH010 Black Google TV 4K/TV Artel A43PUCH010 Black Google TV 4K_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/ARTEL/ARTEL_TELEVIZOR/TV Artel A43PUCH010 Black Google TV 4K/TV Artel A43PUCH010 Black Google TV 4K_light.webp';
    const expectedDark = '/media/products/ARTEL/ARTEL_TELEVIZOR/TV Artel A43PUCH010 Black Google TV 4K/TV Artel A43PUCH010 Black Google TV 4K_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for Artel TV assets', () => {
    const lightUrl = sampleArtelTv.image!;
    const darkUrl = sampleArtelTv.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Artel TV" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Artel TV" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for Artel TV', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleArtelTv} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleArtelTv.image);

    rerender(<ProductCard product={sampleArtelTv} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleArtelTv.darkImage);
  });
});
