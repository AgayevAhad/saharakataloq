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

const sampleLotusHood: Product = {
  id: 'lotus-lt6016-black',
  code: 'LT6016 Black',
  title: 'Aspirator Lotus LT6016 Black',
  brandId: 'lotus',
  category: 'hood',
  categoryName: 'Aspiratorlar',
  image: '/media/products/LOTUS/LOTUS_HAVACEKEN/Aspirator Lotus LT6016 Black/Aspirator Lotus LT6016 Black_light.webp',
  darkImage: '/media/products/LOTUS/LOTUS_HAVACEKEN/Aspirator Lotus LT6016 Black/Aspirator Lotus LT6016 Black_dark.webp',
  gallery: [
    '/media/products/LOTUS/LOTUS_HAVACEKEN/Aspirator Lotus LT6016 Black/Aspirator Lotus LT6016 Black_light.webp',
  ],
  media: [
    {
      id: 'media-lotus-lt6016-black-1',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_HAVACEKEN/Aspirator Lotus LT6016 Black/Aspirator Lotus LT6016 Black_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_HAVACEKEN/Aspirator Lotus LT6016 Black/Aspirator Lotus LT6016 Black_dark.webp',
      alt: 'Aspirator Lotus LT6016 Black - 1',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Növ', value: 'Sürməli aspirator', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Məhsuldarlıq', value: '650 m³/saat', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'Lotus 60 sm sürməli qara aspirator',
  highlights: ['650 m³/saat', 'LED işıqlandırma'],
};

describe('LOTUS Hood (Havaçəkən / Aspirator) Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_HAVACEKEN/Aspirator Lotus LT6016 Black/Aspirator Lotus LT6016 Black_light.webp';
    const darkUrl = '/media/products/LOTUS/LOTUS_HAVACEKEN/Aspirator Lotus LT6016 Black/Aspirator Lotus LT6016 Black_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_HAVACEKEN/Aspirator Lotus LT6016 Black/Aspirator Lotus LT6016 Black_light.webp';
    const expectedDark = '/media/products/LOTUS/LOTUS_HAVACEKEN/Aspirator Lotus LT6016 Black/Aspirator Lotus LT6016 Black_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for Lotus Hood assets', () => {
    const lightUrl = sampleLotusHood.image!;
    const darkUrl = sampleLotusHood.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Lotus Hood" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Lotus Hood" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for Lotus Hood', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleLotusHood} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusHood.image);

    rerender(<ProductCard product={sampleLotusHood} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusHood.darkImage);
  });
});
