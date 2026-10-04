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

const sampleAC: Product = {
  id: 'ardo-ar12ws',
  code: 'AR12WS',
  title: 'Kondisioner Ardo AR12WS',
  brandId: 'ardo',
  category: 'air_conditioner',
  categoryName: 'Kondisionerlər',
  image: '/media/products/ARDO/ARDO_KONDISONER/Kondisioner Ardo AR12WS/Kondisioner Ardo AR12WS_light.webp',
  darkImage: '/media/products/ARDO/ARDO_KONDISONER/Kondisioner Ardo AR12WS/Kondisioner Ardo AR12WS_dark.webp',
  gallery: [
    '/media/products/ARDO/ARDO_KONDISONER/Kondisioner Ardo AR12WS/Kondisioner Ardo AR12WS_light.webp',
    '/media/products/ARDO/ARDO_KONDISONER/Kondisioner Ardo AR12WS/Kondisioner Ardo AR12WS (2)_light.webp',
    '/media/products/ARDO/ARDO_KONDISONER/Kondisioner Ardo AR12WS/Kondisioner Ardo AR12WS (3)_light.webp',
  ],
  media: [
    {
      id: 'media-ardo-ar12ws-1',
      type: 'image',
      url: '/media/products/ARDO/ARDO_KONDISONER/Kondisioner Ardo AR12WS/Kondisioner Ardo AR12WS_light.webp',
      darkUrl: '/media/products/ARDO/ARDO_KONDISONER/Kondisioner Ardo AR12WS/Kondisioner Ardo AR12WS_dark.webp',
      alt: 'Kondisioner Ardo AR12WS - 1',
      objectPosition: 'center',
      fitMode: 'contain',
    },
    {
      id: 'media-ardo-ar12ws-2',
      type: 'image',
      url: '/media/products/ARDO/ARDO_KONDISONER/Kondisioner Ardo AR12WS/Kondisioner Ardo AR12WS (2)_light.webp',
      darkUrl: '/media/products/ARDO/ARDO_KONDISONER/Kondisioner Ardo AR12WS/Kondisioner Ardo AR12WS (2)_dark.webp',
      alt: 'Kondisioner Ardo AR12WS - 2',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Brend', value: 'ARDO', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Tövsiyə olunan sahə', value: '35-40 m²', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'ARDO inverter kondisioner',
  highlights: ['İnverter kompressor'],
};

describe('ARDO Air Conditioner (Kondisioner) Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/ARDO/ARDO_KONDISONER/Kondisioner Ardo AR12WS/Kondisioner Ardo AR12WS_light.webp';
    const darkUrl = '/media/products/ARDO/ARDO_KONDISONER/Kondisioner Ardo AR12WS/Kondisioner Ardo AR12WS_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/ARDO/ARDO_KONDISONER/Kondisioner Ardo AR09WS/Kondisioner Ardo AR09WS_light.webp';
    const expectedDark = '/media/products/ARDO/ARDO_KONDISONER/Kondisioner Ardo AR09WS/Kondisioner Ardo AR09WS_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for air conditioner assets', () => {
    const lightUrl = sampleAC.image!;
    const darkUrl = sampleAC.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Air Conditioner" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Air Conditioner" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for air conditioner', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleAC} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleAC.image);

    rerender(<ProductCard product={sampleAC} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleAC.darkImage);
  });
});
