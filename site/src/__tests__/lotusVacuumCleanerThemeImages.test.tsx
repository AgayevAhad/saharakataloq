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

const sampleLotusVacuum: Product = {
  id: 'lotus-lt-18-orange',
  code: 'LT 18 Orange',
  title: 'Tozsoran Lotus LT 18 Orange',
  brandId: 'lotus',
  category: 'vacuum_cleaner',
  categoryName: 'Tozsoranlar',
  image: '/media/products/LOTUS/LOTUS_TOZSORAN/Tozsoran Lotus LT 18 Orange/Tozsoran Lotus LT 18 Orange_light.webp',
  darkImage: '/media/products/LOTUS/LOTUS_TOZSORAN/Tozsoran Lotus LT 18 Orange/Tozsoran Lotus LT 18 Orange_dark.webp',
  gallery: [
    '/media/products/LOTUS/LOTUS_TOZSORAN/Tozsoran Lotus LT 18 Orange/Tozsoran Lotus LT 18 Orange_light.webp',
    '/media/products/LOTUS/LOTUS_TOZSORAN/Tozsoran Lotus LT 18 Orange/Tozsoran Lotus LT 18 Orange (2)_light.webp',
    '/media/products/LOTUS/LOTUS_TOZSORAN/Tozsoran Lotus LT 18 Orange/Tozsoran Lotus LT 18 Orange (3)_light.webp',
  ],
  media: [
    {
      id: 'media-lotus-lt-18-orange-1',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_TOZSORAN/Tozsoran Lotus LT 18 Orange/Tozsoran Lotus LT 18 Orange_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_TOZSORAN/Tozsoran Lotus LT 18 Orange/Tozsoran Lotus LT 18 Orange_dark.webp',
      alt: 'Tozsoran Lotus LT 18 Orange - 1',
      objectPosition: 'center',
      fitMode: 'contain',
    },
    {
      id: 'media-lotus-lt-18-orange-2',
      type: 'image',
      url: '/media/products/LOTUS/LOTUS_TOZSORAN/Tozsoran Lotus LT 18 Orange/Tozsoran Lotus LT 18 Orange (2)_light.webp',
      darkUrl: '/media/products/LOTUS/LOTUS_TOZSORAN/Tozsoran Lotus LT 18 Orange/Tozsoran Lotus LT 18 Orange (2)_dark.webp',
      alt: 'Tozsoran Lotus LT 18 Orange - 2',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Növ', value: 'Konteynerli tozsoran', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Güc', value: '2200 Vt', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'Lotus 2200 Vt konteynerli tozsoran',
  highlights: ['2200 Vt güc', 'HEPA filtr'],
};

describe('LOTUS Vacuum Cleaner (Tozsoran) Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_TOZSORAN/Tozsoran Lotus LT 18 Orange/Tozsoran Lotus LT 18 Orange_light.webp';
    const darkUrl = '/media/products/LOTUS/LOTUS_TOZSORAN/Tozsoran Lotus LT 18 Orange/Tozsoran Lotus LT 18 Orange_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/LOTUS/LOTUS_TOZSORAN/Tozsoran Lotus LT 18 Orange/Tozsoran Lotus LT 18 Orange_light.webp';
    const expectedDark = '/media/products/LOTUS/LOTUS_TOZSORAN/Tozsoran Lotus LT 18 Orange/Tozsoran Lotus LT 18 Orange_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for Lotus Vacuum Cleaner assets', () => {
    const lightUrl = sampleLotusVacuum.image!;
    const darkUrl = sampleLotusVacuum.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Lotus Vacuum Cleaner" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Lotus Vacuum Cleaner" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for Lotus Vacuum Cleaner', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleLotusVacuum} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusVacuum.image);

    rerender(<ProductCard product={sampleLotusVacuum} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleLotusVacuum.darkImage);
  });
});
