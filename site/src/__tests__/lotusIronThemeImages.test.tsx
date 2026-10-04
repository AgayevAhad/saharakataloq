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

const sampleLotusIron: Product = {
  id: 'lotus-lt-8800',
  code: 'LT-8800',
  title: 'Utu Lotus LT-8800',
  brandId: 'lotus',
  category: 'iron',
  categoryName: 'Ütülər',
  image: '/media/products/LOTUS/LOTUS_UTU/Utu Lotus LT-8800/Utu Lotus LT-8800_light.webp',
  darkImage: '/media/products/LOTUS/LOTUS_UTU/Utu Lotus LT-8800/Utu Lotus LT-8800_dark.webp',
  gallery: [
    '/media/products/LOTUS/LOTUS_UTU/Utu Lotus LT-8800/Utu Lotus LT-8800_light.webp',
    '/media/products/LOTUS/LOTUS_UTU/Utu Lotus LT-8800/Utu Lotus LT-8800 (2)_light.webp',
    '/media/products/LOTUS/LOTUS_UTU/Utu Lotus LT-8800/Utu Lotus LT-8800 (3)_light.webp',
  ],
  media: [
    {
      id: 'media-lotus-lt-8800-1',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_UTU/Utu Lotus LT-8800/Utu Lotus LT-8800_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_UTU/Utu Lotus LT-8800/Utu Lotus LT-8800_dark.webp',
      alt: 'Utu Lotus LT-8800 - 1',
      objectPosition: '63% 63%',
      fitMode: 'contain',
    },
    {
      id: 'media-lotus-lt-8800-2',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_UTU/Utu Lotus LT-8800/Utu Lotus LT-8800 (2)_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_UTU/Utu Lotus LT-8800/Utu Lotus LT-8800 (2)_dark.webp',
      alt: 'Utu Lotus LT-8800 - 2',
      objectPosition: '65% 63%',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Növ', value: 'Buxarlı ütü', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Güc', value: '2400 Vt', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'Lotus 2400 Vt buxarlı ütü',
  highlights: ['2400 Vt güc', 'Keramik altlıq'],
};

describe('LOTUS Iron (Ütü) Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_UTU/Utu Lotus LT-8800/Utu Lotus LT-8800_light.webp';
    const darkUrl = '/media/products/LOTUS/LOTUS_UTU/Utu Lotus LT-8800/Utu Lotus LT-8800_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_UTU/Utu Lotus LT-8800/Utu Lotus LT-8800_light.webp';
    const expectedDark = '/media/products/LOTUS/LOTUS_UTU/Utu Lotus LT-8800/Utu Lotus LT-8800_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for Lotus Iron assets', () => {
    const lightUrl = sampleLotusIron.image!;
    const darkUrl = sampleLotusIron.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Lotus Iron" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Lotus Iron" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for Lotus Iron', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleLotusIron} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusIron.image);

    rerender(<ProductCard product={sampleLotusIron} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusIron.darkImage);
  });
});
