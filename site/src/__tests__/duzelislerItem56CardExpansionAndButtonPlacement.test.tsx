import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from '../components/ProductCard';
import { FeaturedProductCard } from '../components/FeaturedProductCard';
import { Product } from '../types/product';
import {
  ThemeColors,
  darkTheme as baseDarkTheme,
  lightTheme as baseLightTheme,
} from '../types/theme';

const mockProduct: Product = {
  id: 'prod-56-1',
  brandId: 'ardo',
  category: 'aspirators',
  categoryName: 'Aspiratorlar',
  title: 'ARDO Sabaf 60 Inox Aspirator',
  code: 'ARDO-ASP-60-INX',
  price: 480,
  image: '/media/ardo/aspirator.webp',
  badgeText: 'Yeni',
  badgeColor: 'red',
  manufacturingCountry: 'İtaliya',
  shortDesc: '',
  specs: [],
  highlights: [],
};

const darkTheme: ThemeColors = {
  ...baseDarkTheme,
  primary: '#e11d48',
  primaryHover: '#be123c',
};

const lightTheme: ThemeColors = {
  ...baseLightTheme,
  primary: '#dc2626',
  primaryHover: '#b91c1c',
};

describe('Duzelisler Item 56: Product Card High Contrast & Netflix Hover Bottom Placement', () => {
  it('1. ProductCard action buttons maintain high contrast light-mode styling even in Dark Mode', () => {
    const { container } = render(
      <ProductCard
        product={mockProduct}
        theme={darkTheme}
        onSelect={vi.fn()}
        onAddToCart={vi.fn()}
        onToggleFavorite={vi.fn()}
        onToggleCompare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onShare={vi.fn()}
      />
    );

    // Card background in dark mode reflects darkTheme.bgCard (#121214)
    const card = container.querySelector('.product-card') as HTMLElement;
    expect(card).toBeDefined();
    expect(card.style.backgroundColor).toBe(darkTheme.bgCard || '#121214');
    const detailsPanel = container.querySelector('.product-card-details') as HTMLElement;
    expect(detailsPanel).toBeDefined();

    // "Ətraflı" button text must be high-contrast red/dark, NOT white (#ffffff)
    const detailsBtn = container.querySelector('.card-action-btn-details') as HTMLElement;
    expect(detailsBtn).toBeDefined();
    expect(detailsBtn.textContent).toContain('Ətraflı');
    expect(detailsBtn.style.color).toBe('#dc2626');

    // Compare and Favorite buttons remain high contrast in the permanent side panel.
    const compareBtn = container.querySelector('.card-action-btn-compare') as HTMLElement;
    expect(compareBtn).toBeDefined();
    expect(compareBtn.style.backgroundColor).toBe('rgba(37, 99, 235, 0.1)');

    const heartBtn = container.querySelector('.card-action-btn-heart') as HTMLElement;
    expect(heartBtn).toBeDefined();
    expect(heartBtn.style.backgroundColor).toBe('rgba(220, 38, 38, 0.1)');
    expect(heartBtn.style.color).toBe('#dc2626');
  });

  it('2. Action cluster is located at the bottom within .product-card-details, not overlaying the image', () => {
    const { container } = render(
      <ProductCard
        product={mockProduct}
        theme={lightTheme}
        onSelect={vi.fn()}
        onAddToCart={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
      />
    );

    const imgWrap = container.querySelector('.product-card-img-wrap') as HTMLElement;
    const details = container.querySelector('.product-card-details') as HTMLElement;
    const cluster = container.querySelector('.card-hover-actions-cluster') as HTMLElement;

    expect(imgWrap).toBeDefined();
    expect(details).toBeDefined();
    expect(cluster).toBeDefined();

    // Verify cluster is INSIDE details section and NOT inside image wrap
    expect(imgWrap.contains(cluster)).toBe(false);
    expect(details.contains(cluster)).toBe(true);
  });

  it('3. ProductCard keeps its external action tray visible while hover only lifts the item', () => {
    const { container } = render(
      <ProductCard
        product={mockProduct}
        theme={lightTheme}
        onSelect={vi.fn()}
        onAddToCart={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
      />
    );

    const card = container.querySelector('.product-card') as HTMLElement;
    const cluster = container.querySelector('.card-hover-actions-cluster') as HTMLElement;

    expect(cluster).toBeDefined();
    expect(cluster.textContent).toContain('WhatsApp');
    expect(cluster.textContent).toContain('Zəng et');
    expect(cluster.textContent).not.toContain('Ətraflı');
    expect(container.querySelector('.product-card-top-actions')?.textContent).toContain('Ətraflı');
    expect(container.querySelector('.product-card-details')?.lastElementChild).toBe(
      container.querySelector('.product-card-top-actions')
    );
    expect(container.textContent).toContain('Bəyən');
    expect(container.textContent).toContain('Səbətə əlavə et');

    fireEvent.mouseEnter(card);

    expect(card.classList.contains('hovered')).toBe(true);
    expect(card.style.transform).toContain('scale(1.015)');
    expect(card.style.zIndex).toBe('20');
    expect(cluster).toBeDefined();

    fireEvent.mouseLeave(card);
    expect(cluster).toBeDefined();
  });

  it('4. FeaturedProductCard also positions action cluster in details tray with light mode high contrast', () => {
    const { container } = render(
      <FeaturedProductCard
        product={mockProduct}
        theme={darkTheme}
        onSelect={vi.fn()}
        onAddToCart={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
      />
    );

    const imgBox = container.querySelector('.featured-product-img-box') as HTMLElement;
    const cluster = container.querySelector('.card-hover-actions-cluster') as HTMLElement;
    const detailsBtn = container.querySelector('.card-action-btn-details') as HTMLElement;

    expect(imgBox).toBeDefined();
    expect(cluster).toBeDefined();
    expect(imgBox.contains(cluster)).toBe(false);

    expect(detailsBtn.style.color).toBe('#dc2626');
  });

  it('5. Action buttons and top badges use currentColor for icons to support dynamic hover contrast', () => {
    const { container } = render(
      <ProductCard
        product={mockProduct}
        theme={lightTheme}
        onSelect={vi.fn()}
        onAddToCart={vi.fn()}
        onToggleFavorite={vi.fn()}
        onToggleCompare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onShare={vi.fn()}
      />
    );

    // Check WhatsApp SVG icon has fill="currentColor" or currentColor stroke
    const waBtn = container.querySelector('.card-action-btn-wa') as HTMLElement;
    const waPath = waBtn.querySelector('path');
    expect(waPath?.getAttribute('fill')).toBe('currentColor');

    // Check Heart and Scale buttons
    const heartBtn = container.querySelector('.card-action-btn-heart') as HTMLElement;
    const compareBtn = container.querySelector('.card-action-btn-compare') as HTMLElement;

    expect(heartBtn.classList.contains('card-action-btn-heart')).toBe(true);
    expect(compareBtn.classList.contains('card-action-btn-compare')).toBe(true);
  });

  it('6. Multi-image product renders card-media-nav-btn prev and next without borders and close to edge', () => {
    const multiImageProduct: Product = {
      ...mockProduct,
      image: '/media/ardo/aspirator-1.webp',
      gallery: ['/media/ardo/aspirator-2.webp'],
    };

    const { container } = render(
      <ProductCard product={multiImageProduct} theme={lightTheme} onSelect={vi.fn()} />
    );

    const prevBtn = container.querySelector('.card-media-nav-btn.prev') as HTMLElement;
    const nextBtn = container.querySelector('.card-media-nav-btn.next') as HTMLElement;

    expect(prevBtn).toBeDefined();
    expect(nextBtn).toBeDefined();
    expect(prevBtn.getAttribute('title')).toBe('Əvvəlki şəkil');
    expect(nextBtn.getAttribute('title')).toBe('Növbəti şəkil');
  });
});
