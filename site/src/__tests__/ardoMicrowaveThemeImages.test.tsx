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

const sampleMicrowave: Product = {
  id: 'ardo-ar20ss',
  code: 'AR20SS',
  title: 'Mikrodalga Ardo AR20SS',
  brandId: 'ardo',
  category: 'microwave',
  categoryName: 'Mikrodalğalı sobalar',
  image: '/media/products/ARDO/ARDO_MIKRODALGALI_SOBA/Mikrodalga Ardo AR20SS/Mikrodalga Ardo AR20SS_light.webp',
  darkImage: '/media/products/ARDO/ARDO_MIKRODALGALI_SOBA/Mikrodalga Ardo AR20SS/Mikrodalga Ardo AR20SS_dark.webp',
  gallery: [
    '/media/products/ARDO/ARDO_MIKRODALGALI_SOBA/Mikrodalga Ardo AR20SS/Mikrodalga Ardo AR20SS_light.webp',
  ],
  media: [
    {
      id: 'media-ardo-ar20ss-1',
      type: 'image',
      url: '/media/products/ARDO/ARDO_MIKRODALGALI_SOBA/Mikrodalga Ardo AR20SS/Mikrodalga Ardo AR20SS_light.webp',
      darkUrl: '/media/products/ARDO/ARDO_MIKRODALGALI_SOBA/Mikrodalga Ardo AR20SS/Mikrodalga Ardo AR20SS_dark.webp',
      alt: 'Mikrodalga Ardo AR20SS - 1',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Brend', value: 'ARDO', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Həcm', value: '20 L', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'ARDO mikrodalğalı soba',
  highlights: ['20 L həcm'],
};

describe('ARDO Microwave (Mikrodalğalı Soba) Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/ARDO/ARDO_MIKRODALGALI_SOBA/Mikrodalga Ardo AR20SS/Mikrodalga Ardo AR20SS_light.webp';
    const darkUrl = '/media/products/ARDO/ARDO_MIKRODALGALI_SOBA/Mikrodalga Ardo AR20SS/Mikrodalga Ardo AR20SS_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/ARDO/ARDO_MIKRODALGALI_SOBA/Mikrodalga Ardo AR25LB/Mikrodalga Ardo AR25LB_light.webp';
    const expectedDark = '/media/products/ARDO/ARDO_MIKRODALGALI_SOBA/Mikrodalga Ardo AR25LB/Mikrodalga Ardo AR25LB_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for microwave assets', () => {
    const lightUrl = sampleMicrowave.image!;
    const darkUrl = sampleMicrowave.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Microwave" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Microwave" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for microwave', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleMicrowave} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleMicrowave.image);

    rerender(<ProductCard product={sampleMicrowave} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleMicrowave.darkImage);
  });
});
