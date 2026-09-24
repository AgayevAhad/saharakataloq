/**
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types/product';
import { lightTheme } from '../types/theme';

const mockProduct: Product = {
  id: 'ardo-201gc',
  brandId: 'ardo',
  code: '201 GC',
  title: 'ARDO Qaz Plitəsi 201 GC',
  category: 'cooktop',
  categoryName: 'Qaz Plitəsi',
  image: '/media/products/ardo-201gc.jpg',
  gallery: ['/media/products/ardo-201gc.jpg', '/media/products/ardo-201gc-2.jpg'],
  media: [
    {
      id: 'm1',
      type: 'image',
      url: '/media/products/ardo-201gc.jpg',
      alt: 'ARDO 201 GC',
      fitMode: 'contain',
      objectPosition: 'center',
    },
    {
      id: 'm2',
      type: 'image',
      url: '/media/products/ardo-201gc-2.jpg',
      alt: 'ARDO 201 GC Bucaq',
      fitMode: 'contain',
      objectPosition: 'center',
    },
  ],
  price: 480,
  oldPrice: 550,
  stockStatus: 'in_stock',
  isNew: true,
  isFeatured: true,
  manufacturingCountry: 'İtaliya',
  highlights: ['4 Qaz ocağı', 'İtaliya istehsalı', 'Qaz-kontrol'],
  shortDesc: 'ARDO Qaz Plitəsi',
  specs: [],
};

describe('Responsive Layout & Visual Integrity Tests (Desktop & Mobile)', () => {
  it('preserves essential responsive CSS classes (.netflix-card-pop & .product-card-img-wrap)', () => {
    const { container } = render(
      <ProductCard
        product={mockProduct}
        theme={lightTheme}
        onSelect={vi.fn()}
        onShare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onCopyLink={vi.fn()}
      />
    );

    // 1. Outer card container must have netflix-card-pop for grid/flex compatibility
    const cardEl = container.querySelector('.netflix-card-pop.product-card') as HTMLElement;
    expect(cardEl).toBeTruthy();
    expect(cardEl.style.display).toBe('flex');
    expect(cardEl.style.flexDirection).toBe('column');
    expect(cardEl.style.height).toBe('100%');

    // 2. Image container must have product-card-img-wrap for responsive height constraints
    const imgWrap = container.querySelector('.product-card-img-wrap.product-card-media') as HTMLElement;
    expect(imgWrap).toBeTruthy();
    expect(imgWrap.style.position).toBe('relative');

    // 3. Action buttons must have responsive flex layout
    const waBtn = container.querySelector('.card-action-btn-wa') as HTMLElement;
    const callBtn = container.querySelector('.card-action-btn-call') as HTMLElement;
    const shareBtn = container.querySelector('.card-action-btn-share') as HTMLElement;
    expect(waBtn).toBeTruthy();
    expect(callBtn).toBeTruthy();
    expect(shareBtn).toBeTruthy();
  });

  it('renders interactive touch swipe and navigation buttons on mobile and desktop without breaking layout', () => {
    const { container } = render(
      <ProductCard
        product={mockProduct}
        theme={lightTheme}
        onSelect={vi.fn()}
        onShare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onCopyLink={vi.fn()}
      />
    );

    // Navigation buttons exist for multi-image products
    const prevBtn = container.querySelector('.card-media-nav-btn.prev');
    const nextBtn = container.querySelector('.card-media-nav-btn.next');
    expect(prevBtn).toBeTruthy();
    expect(nextBtn).toBeTruthy();

    // Data-attribute for single central mobile focus exists
    const card = container.querySelector('[data-product-card-id="ardo-201gc"]');
    expect(card).toBeTruthy();
  });
});
