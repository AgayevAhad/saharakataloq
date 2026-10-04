// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { resolveThemeImage } from '../utils/themeImage';
import { ShimmerImage } from '../components/ShimmerImage';
import { ProductCard } from '../components/ProductCard';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { lightTheme, darkTheme } from '../types/theme';
import { Product } from '../types/product';

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
  document.body.className = '';
});

const sampleCooktop: Product = {
  id: 'ardo-201gc',
  code: '201GC',
  title: 'Plite Ardo 201GC',
  brandId: 'ardo',
  category: 'cooktop',
  categoryName: 'Bişirmə panelləri',
  image: '/media/products/ARDO/ARDO_BISIRME_PANELI/Plite Ardo 201GC/Plite Ardo 201GC_light.webp',
  darkImage: '/media/products/ARDO/ARDO_BISIRME_PANELI/Plite Ardo 201GC/Plite Ardo 201GC_dark.webp',
  gallery: [
    '/media/products/ARDO/ARDO_BISIRME_PANELI/Plite Ardo 201GC/Plite Ardo 201GC_light.webp',
    '/media/products/ARDO/ARDO_BISIRME_PANELI/Plite Ardo 201GC/Plite Ardo 201GC (2)_light.webp',
  ],
  media: [
    {
      id: 'media-ardo-201gc-1',
      type: 'image',
      url: '/media/products/ARDO/ARDO_BISIRME_PANELI/Plite Ardo 201GC/Plite Ardo 201GC_light.webp',
      darkUrl: '/media/products/ARDO/ARDO_BISIRME_PANELI/Plite Ardo 201GC/Plite Ardo 201GC_dark.webp',
      alt: 'Plite Ardo 201GC',
      objectPosition: 'center',
      fitMode: 'contain',
    },
    {
      id: 'media-ardo-201gc-2',
      type: 'image',
      url: '/media/products/ARDO/ARDO_BISIRME_PANELI/Plite Ardo 201GC/Plite Ardo 201GC (2)_light.webp',
      darkUrl: '/media/products/ARDO/ARDO_BISIRME_PANELI/Plite Ardo 201GC/Plite Ardo 201GC (2)_dark.webp',
      alt: 'Plite Ardo 201GC 2',
      objectPosition: 'center',
      fitMode: 'contain',
    },
  ],
  price: 499,
  currency: '₼',
  stockStatus: 'in_stock',
  specs: [
    { id: 'spec-1', name: 'Brend', value: 'ARDO', icon: 'Check', group: 'Əsas' },
    { id: 'spec-2', name: 'Qaz təhlükəsizliyi', value: 'Var', icon: 'Check', group: 'Əsas' },
  ],
  shortDesc: 'ARDO bişirmə paneli',
  highlights: ['Qaz təhlükəsizliyi'],
};

describe('ARDO Cooktop Light and Dark Theme Image Resolution', () => {
  it('resolveThemeImage resolves light image for light mode and dark image for dark mode', () => {
    const lightUrl = '/media/products/ARDO/ARDO_BISIRME_PANELI/Plite Ardo 201GC/Plite Ardo 201GC_light.webp';
    const darkUrl = '/media/products/ARDO/ARDO_BISIRME_PANELI/Plite Ardo 201GC/Plite Ardo 201GC_dark.webp';

    expect(resolveThemeImage(lightUrl, false, darkUrl)).toBe(lightUrl);
    expect(resolveThemeImage(lightUrl, true, darkUrl)).toBe(darkUrl);
  });

  it('resolveThemeImage automatically derives dark image if darkUrl is not provided', () => {
    const lightUrl = '/media/products/ARDO/ARDO_BISIRME_PANELI/Plite Ardo 3166/Plite Ardo 3166_light.webp';
    const expectedDark = '/media/products/ARDO/ARDO_BISIRME_PANELI/Plite Ardo 3166/Plite Ardo 3166_dark.webp';

    expect(resolveThemeImage(lightUrl, true)).toBe(expectedDark);
    expect(resolveThemeImage(expectedDark, false)).toBe(lightUrl);
  });

  it('ShimmerImage swaps src based on isDarkMode prop', () => {
    const lightUrl = sampleCooktop.image!;
    const darkUrl = sampleCooktop.darkImage!;

    const { rerender, container } = render(
      <ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={false} alt="Cooktop" />
    );

    let img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(lightUrl);

    rerender(<ShimmerImage src={lightUrl} darkUrl={darkUrl} isDarkMode={true} alt="Cooktop" />);
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(darkUrl);
  });

  it('ProductCard displays light image in light mode and dark image in dark mode', () => {
    const { rerender, container } = render(
      <ProductCard product={sampleCooktop} theme={lightTheme} onSelect={() => {}} />
    );

    let img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toContain('_light.webp');

    rerender(<ProductCard product={sampleCooktop} theme={darkTheme} onSelect={() => {}} />);
    img = container.querySelector('.product-card-img-wrap img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toContain('_dark.webp');
  });

  it('ProductDetailModal displays light images in light mode and dark images in dark mode', () => {
    const { rerender, container } = render(
      <ProductDetailModal
        product={sampleCooktop}
        theme={lightTheme}
        visible={true}
        onClose={() => {}}
        onShare={() => {}}
        onWhatsApp={() => {}}
        onCall={() => {}}
        onCopyLink={() => {}}
      />
    );

    // Main media image in stage
    const mainImg = container.querySelector('.product-detail-image-stage img') as HTMLImageElement;
    expect(mainImg).toBeTruthy();
    expect(mainImg.getAttribute('src')).toContain('_light.webp');

    // Thumbnails in media strip
    const thumbs = container.querySelectorAll('.product-media-strip img');
    expect(thumbs.length).toBeGreaterThanOrEqual(1);
    thumbs.forEach((thumb) => {
      expect((thumb as HTMLImageElement).getAttribute('src')).toContain('_light.webp');
    });

    // Re-render in Dark Mode
    rerender(
      <ProductDetailModal
        product={sampleCooktop}
        theme={darkTheme}
        visible={true}
        onClose={() => {}}
        onShare={() => {}}
        onWhatsApp={() => {}}
        onCall={() => {}}
        onCopyLink={() => {}}
      />
    );

    const darkMainImg = container.querySelector('.product-detail-image-stage img') as HTMLImageElement;
    expect(darkMainImg).toBeTruthy();
    expect(darkMainImg.getAttribute('src')).toContain('_dark.webp');

    const darkThumbs = container.querySelectorAll('.product-media-strip img');
    darkThumbs.forEach((thumb) => {
      expect((thumb as HTMLImageElement).getAttribute('src')).toContain('_dark.webp');
    });
  });
});
