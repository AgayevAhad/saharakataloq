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

const sampleLotusThermopot: Product = {
  id: 'lotus-lt-50-eb-1111-black',
  code: 'LT-50-EB-1111 Black',
  title: 'Termopot Lotus LT-50-EB-1111 Black',
  brandId: 'lotus',
  category: 'thermopot',
  categoryName: 'Termopotlar',
  image: '/media/products/LOTUS/LOTUS_TERMOPOT/Termopot Lotus LT-50-EB-1111 Black/Termopot Lotus LT-50-EB-1111 Black_light.webp',
  darkImage: '/media/products/LOTUS/LOTUS_TERMOPOT/Termopot Lotus LT-50-EB-1111 Black/Termopot Lotus LT-50-EB-1111 Black_dark.webp',
  gallery: [
    '/media/products/LOTUS/LOTUS_TERMOPOT/Termopot Lotus LT-50-EB-1111 Black/Termopot Lotus LT-50-EB-1111 Black_light.webp',
  ],
  media: [
    {
      id: 'media-lotus-lt-50-eb-1111-black-1',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_TERMOPOT/Termopot Lotus LT-50-EB-1111 Black/Termopot Lotus LT-50-EB-1111 Black_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_TERMOPOT/Termopot Lotus LT-50-EB-1111 Black/Termopot Lotus LT-50-EB-1111 Black_dark.webp',
      alt: 'Termopot Lotus LT-50-EB-1111 Black - 1',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Həcm', value: '5.0 L', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Güc', value: '750 Vt', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'Lotus 5.0 L elektrikli termopot',
  highlights: ['5.0 L həcm', 'Temperatur saxlama'],
};

describe('LOTUS Thermopot Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_TERMOPOT/Termopot Lotus LT-50-EB-1111 Black/Termopot Lotus LT-50-EB-1111 Black_light.webp';
    const darkUrl = '/media/products/LOTUS/LOTUS_TERMOPOT/Termopot Lotus LT-50-EB-1111 Black/Termopot Lotus LT-50-EB-1111 Black_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_TERMOPOT/Termopot Lotus LT-50-EB-1111 Black/Termopot Lotus LT-50-EB-1111 Black_light.webp';
    const expectedDark = '/media/products/LOTUS/LOTUS_TERMOPOT/Termopot Lotus LT-50-EB-1111 Black/Termopot Lotus LT-50-EB-1111 Black_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for Lotus Thermopot assets', () => {
    const lightUrl = sampleLotusThermopot.image!;
    const darkUrl = sampleLotusThermopot.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Lotus Thermopot" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Lotus Thermopot" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for Lotus Thermopot', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleLotusThermopot} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusThermopot.image);

    rerender(<ProductCard product={sampleLotusThermopot} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusThermopot.darkImage);
  });
});
