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

const sampleHood: Product = {
  id: 'ardo-604b',
  code: '604B',
  title: 'Aspirator Ardo 604B',
  brandId: 'ardo',
  category: 'hood',
  categoryName: 'Aspiratorlar',
  image: '/media/products/ARDO/ARDO_HAVACEKEN/Aspirator Ardo 604B/Aspirator Ardo 604B_light.webp',
  darkImage: '/media/products/ARDO/ARDO_HAVACEKEN/Aspirator Ardo 604B/Aspirator Ardo 604B_dark.webp',
  gallery: [
    '/media/products/ARDO/ARDO_HAVACEKEN/Aspirator Ardo 604B/Aspirator Ardo 604B_light.webp',
    '/media/products/ARDO/ARDO_HAVACEKEN/Aspirator Ardo 604B/Aspirator Ardo 604B (2)_light.webp',
    '/media/products/ARDO/ARDO_HAVACEKEN/Aspirator Ardo 604B/Aspirator Ardo 604B (3)_light.webp',
  ],
  media: [
    {
      id: 'media-ardo-604b-1',
      type: 'image',
      url: '/media/products/ARDO/ARDO_HAVACEKEN/Aspirator Ardo 604B/Aspirator Ardo 604B_light.webp',
      darkUrl: '/media/products/ARDO/ARDO_HAVACEKEN/Aspirator Ardo 604B/Aspirator Ardo 604B_dark.webp',
      alt: 'Aspirator Ardo 604B - 1',
      objectPosition: 'center',
      fitMode: 'contain',
    },
    {
      id: 'media-ardo-604b-2',
      type: 'image',
      url: '/media/products/ARDO/ARDO_HAVACEKEN/Aspirator Ardo 604B/Aspirator Ardo 604B (2)_light.webp',
      darkUrl: '/media/products/ARDO/ARDO_HAVACEKEN/Aspirator Ardo 604B/Aspirator Ardo 604B (2)_dark.webp',
      alt: 'Aspirator Ardo 604B - 2',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Brend', value: 'ARDO', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Növ', value: 'Quraşdırılan', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'ARDO aspirator',
  highlights: ['Quraşdırılan'],
};

describe('ARDO Hood (Aspirator) Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/ARDO/ARDO_HAVACEKEN/Aspirator Ardo 604B/Aspirator Ardo 604B_light.webp';
    const darkUrl = '/media/products/ARDO/ARDO_HAVACEKEN/Aspirator Ardo 604B/Aspirator Ardo 604B_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/ARDO/ARDO_HAVACEKEN/Aspirator Ardo 602 white/Aspirator Ardo 602 white_light.webp';
    const expectedDark = '/media/products/ARDO/ARDO_HAVACEKEN/Aspirator Ardo 602 white/Aspirator Ardo 602 white_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for hood assets', () => {
    const lightUrl = sampleHood.image!;
    const darkUrl = sampleHood.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Hood" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Hood" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for hood', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleHood} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleHood.image);

    rerender(<ProductCard product={sampleHood} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleHood.darkImage);
  });
});
