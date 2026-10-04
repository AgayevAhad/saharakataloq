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

const sampleLotusAC: Product = {
  id: 'lotus-lt09bl-invertor',
  code: 'LT09BL Invertor',
  title: 'Kondisioner Lotus LT09BL Invertor',
  brandId: 'lotus',
  category: 'air_conditioner',
  categoryName: 'Kondisionerlər',
  image: '/media/products/LOTUS/LOTUS_KONDISONER/Kondisioner Lotus LT09BL Invertor/Kondisioner Lotus LT09BL Invertor_light.webp',
  darkImage: '/media/products/LOTUS/LOTUS_KONDISONER/Kondisioner Lotus LT09BL Invertor/Kondisioner Lotus LT09BL Invertor_dark.webp',
  gallery: [
    '/media/products/LOTUS/LOTUS_KONDISONER/Kondisioner Lotus LT09BL Invertor/Kondisioner Lotus LT09BL Invertor_light.webp',
    '/media/products/LOTUS/LOTUS_KONDISONER/Kondisioner Lotus LT09BL Invertor/Kondisioner Lotus LT09BL Invertor (2)_light.webp',
  ],
  media: [
    {
      id: 'media-lotus-lt09bl-invertor-1',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_KONDISONER/Kondisioner Lotus LT09BL Invertor/Kondisioner Lotus LT09BL Invertor_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_KONDISONER/Kondisioner Lotus LT09BL Invertor/Kondisioner Lotus LT09BL Invertor_dark.webp',
      alt: 'Kondisioner Lotus LT09BL Invertor - 1',
      objectPosition: 'center',
      fitMode: 'contain',
    },
    {
      id: 'media-lotus-lt09bl-invertor-2',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_KONDISONER/Kondisioner Lotus LT09BL Invertor/Kondisioner Lotus LT09BL Invertor (2)_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_KONDISONER/Kondisioner Lotus LT09BL Invertor/Kondisioner Lotus LT09BL Invertor (2)_dark.webp',
      alt: 'Kondisioner Lotus LT09BL Invertor - 2',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Növ', value: 'Split-sistem', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'İnvertor', value: 'Var', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'Lotus 9000 BTU Invertor Kondisioner',
  highlights: ['Invertor mühərrik', 'A++ enerji sinfi'],
};

describe('LOTUS Air Conditioner (Kondisioner) Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_KONDISONER/Kondisioner Lotus LT09BL Invertor/Kondisioner Lotus LT09BL Invertor_light.webp';
    const darkUrl = '/media/products/LOTUS/LOTUS_KONDISONER/Kondisioner Lotus LT09BL Invertor/Kondisioner Lotus LT09BL Invertor_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_KONDISONER/Kondisioner Lotus LT09BL Invertor/Kondisioner Lotus LT09BL Invertor_light.webp';
    const expectedDark = '/media/products/LOTUS/LOTUS_KONDISONER/Kondisioner Lotus LT09BL Invertor/Kondisioner Lotus LT09BL Invertor_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for Lotus AC assets', () => {
    const lightUrl = sampleLotusAC.image!;
    const darkUrl = sampleLotusAC.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Lotus AC" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Lotus AC" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for Lotus AC', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleLotusAC} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusAC.image);

    rerender(<ProductCard product={sampleLotusAC} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusAC.darkImage);
  });
});
