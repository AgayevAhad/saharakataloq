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

const sampleArtelAC: Product = {
  id: 'artel-aurora-artsim3bw12he',
  code: 'Aurora ARTSIM3BW12HE',
  title: 'Kondisioner Artel Aurora ARTSIM3BW12HE',
  brandId: 'artel',
  category: 'air_conditioner',
  categoryName: 'Kondisionerlər',
  image: '/media/products/ARTEL/ARTEL_KONDISONER/Kondisioner Artel Aurora ARTSIM3BW12HE/Kondisioner Artel Aurora ARTSIM3BW12HE_light.webp',
  darkImage: '/media/products/ARTEL/ARTEL_KONDISONER/Kondisioner Artel Aurora ARTSIM3BW12HE/Kondisioner Artel Aurora ARTSIM3BW12HE_dark.webp',
  gallery: [
    '/media/products/ARTEL/ARTEL_KONDISONER/Kondisioner Artel Aurora ARTSIM3BW12HE/Kondisioner Artel Aurora ARTSIM3BW12HE_light.webp',
  ],
  media: [
    {
      id: 'media-artel-aurora-artsim3bw12he-1',
      type: 'image',
      url: '/media/products/ARTEL/ARTEL_KONDISONER/Kondisioner Artel Aurora ARTSIM3BW12HE/Kondisioner Artel Aurora ARTSIM3BW12HE_light.webp',
      darkUrl: '/media/products/ARTEL/ARTEL_KONDISONER/Kondisioner Artel Aurora ARTSIM3BW12HE/Kondisioner Artel Aurora ARTSIM3BW12HE_dark.webp',
      alt: 'Kondisioner Artel Aurora ARTSIM3BW12HE - 1',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Brend', value: 'ARTEL', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Növ', value: 'Split sistem', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'ARTEL kondisioner',
  highlights: ['Split sistem', '12000 BTU'],
};

describe('ARTEL Air Conditioner (Kondisioner) Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/ARTEL/ARTEL_KONDISONER/Kondisioner Artel Aurora ARTSIM3BW12HE/Kondisioner Artel Aurora ARTSIM3BW12HE_light.webp';
    const darkUrl = '/media/products/ARTEL/ARTEL_KONDISONER/Kondisioner Artel Aurora ARTSIM3BW12HE/Kondisioner Artel Aurora ARTSIM3BW12HE_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/ARTEL/ARTEL_KONDISONER/Kondisioner Artel Gloria ARTSIM2AW12BE/Kondisioner Artel Gloria ARTSIM2AW12BE_light.webp';
    const expectedDark = '/media/products/ARTEL/ARTEL_KONDISONER/Kondisioner Artel Gloria ARTSIM2AW12BE/Kondisioner Artel Gloria ARTSIM2AW12BE_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for Artel AC assets', () => {
    const lightUrl = sampleArtelAC.image!;
    const darkUrl = sampleArtelAC.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Artel AC" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Artel AC" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for Artel AC', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleArtelAC} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleArtelAC.image);

    rerender(<ProductCard product={sampleArtelAC} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleArtelAC.darkImage);
  });
});
