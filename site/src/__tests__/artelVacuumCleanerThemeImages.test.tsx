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

const sampleArtelVC: Product = {
  id: 'artel-vcc-0220-blue',
  code: 'VCC 0220 blue',
  title: 'Tozsoran Artel VCC 0220 blue',
  brandId: 'artel',
  category: 'vacuum_cleaner',
  categoryName: 'Tozsoranlar',
  image: '/media/products/ARTEL/ARTEL_TOZSORAN/Tozsoran Artel VCC 0220 blue/Tozsoran Artel VCC 0220 blue_light.webp',
  darkImage: '/media/products/ARTEL/ARTEL_TOZSORAN/Tozsoran Artel VCC 0220 blue/Tozsoran Artel VCC 0220 blue_dark.webp',
  gallery: [
    '/media/products/ARTEL/ARTEL_TOZSORAN/Tozsoran Artel VCC 0220 blue/Tozsoran Artel VCC 0220 blue_light.webp',
  ],
  media: [
    {
      id: 'media-artel-vcc-0220-blue-1',
      type: 'image',
      url: '/media/products/ARTEL/ARTEL_TOZSORAN/Tozsoran Artel VCC 0220 blue/Tozsoran Artel VCC 0220 blue_light.webp',
      darkUrl: '/media/products/ARTEL/ARTEL_TOZSORAN/Tozsoran Artel VCC 0220 blue/Tozsoran Artel VCC 0220 blue_dark.webp',
      alt: 'Tozsoran Artel VCC 0220 blue - 1',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Brend', value: 'ARTEL', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Güc', value: '2200 Vt', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'ARTEL 2200 Vt tozsoran',
  highlights: ['2200 Vt', 'HEPA filtr'],
};

describe('ARTEL Vacuum Cleaner (Tozsoran) Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/ARTEL/ARTEL_TOZSORAN/Tozsoran Artel VCC 0220 blue/Tozsoran Artel VCC 0220 blue_light.webp';
    const darkUrl = '/media/products/ARTEL/ARTEL_TOZSORAN/Tozsoran Artel VCC 0220 blue/Tozsoran Artel VCC 0220 blue_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/ARTEL/ARTEL_TOZSORAN/Tozsoran Artel VCC 0220 blue/Tozsoran Artel VCC 0220 blue_light.webp';
    const expectedDark = '/media/products/ARTEL/ARTEL_TOZSORAN/Tozsoran Artel VCC 0220 blue/Tozsoran Artel VCC 0220 blue_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop for Artel VC assets', () => {
    const lightUrl = sampleArtelVC.image!;
    const darkUrl = sampleArtelVC.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Artel VC" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Artel VC" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode for Artel VC', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleArtelVC} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleArtelVC.image);

    rerender(<ProductCard product={sampleArtelVC} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(sampleArtelVC.darkImage);
  });
});
