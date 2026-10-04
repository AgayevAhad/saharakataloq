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

const sampleLotusAirfryer: Product = {
  id: 'lotus-55-black',
  code: '5.5 Black',
  title: 'Airfryer Lotus 5.5 Black',
  brandId: 'lotus',
  category: 'airfryer',
  categoryName: 'Fritözlər & Airfryer',
  image: '/media/products/LOTUS/LOTUS_ARFIYER/Airfryer Lotus 5.5 Black/Airfryer Lotus 5.5 Black (2)_light.webp',
  darkImage: '/media/products/LOTUS/LOTUS_ARFIYER/Airfryer Lotus 5.5 Black/Airfryer Lotus 5.5 Black (2)_dark.webp',
  gallery: [
    '/media/products/LOTUS/LOTUS_ARFIYER/Airfryer Lotus 5.5 Black/Airfryer Lotus 5.5 Black (2)_light.webp',
    '/media/products/LOTUS/LOTUS_ARFIYER/Airfryer Lotus 5.5 Black/Airfryer Lotus 5.5 Black_light.webp',
  ],
  media: [
    {
      id: 'media-lotus-55-black-1',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_ARFIYER/Airfryer Lotus 5.5 Black/Airfryer Lotus 5.5 Black (2)_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_ARFIYER/Airfryer Lotus 5.5 Black/Airfryer Lotus 5.5 Black (2)_dark.webp',
      alt: 'Airfryer Lotus 5.5 Black - 1',
      objectPosition: 'center',
      fitMode: 'contain',
    },
    {
      id: 'media-lotus-55-black-2',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_ARFIYER/Airfryer Lotus 5.5 Black/Airfryer Lotus 5.5 Black_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_ARFIYER/Airfryer Lotus 5.5 Black/Airfryer Lotus 5.5 Black_dark.webp',
      alt: 'Airfryer Lotus 5.5 Black - 2',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Həcm', value: '5.5 L', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Güc', value: '1700 Vt', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'Lotus 5.5 L 1700 Vt Sensor İdarəetməli Airfryer',
  highlights: ['5.5 L həcm', '1700 Vt güc', '8 proqram'],
};

describe('LOTUS Airfryer (Arfiyer / Fritöz) Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_ARFIYER/Airfryer Lotus 5.5 Black/Airfryer Lotus 5.5 Black (2)_light.webp';
    const darkUrl = '/media/products/LOTUS/LOTUS_ARFIYER/Airfryer Lotus 5.5 Black/Airfryer Lotus 5.5 Black (2)_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_ARFIYER/Airfryer Lotus 5.5 Black/Airfryer Lotus 5.5 Black (2)_light.webp';
    const expectedDark = '/media/products/LOTUS/LOTUS_ARFIYER/Airfryer Lotus 5.5 Black/Airfryer Lotus 5.5 Black (2)_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for Lotus Airfryer assets', () => {
    const lightUrl = sampleLotusAirfryer.image!;
    const darkUrl = sampleLotusAirfryer.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Lotus Airfryer" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Lotus Airfryer" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for Lotus Airfryer', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleLotusAirfryer} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusAirfryer.image);

    rerender(<ProductCard product={sampleLotusAirfryer} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusAirfryer.darkImage);
  });
});
