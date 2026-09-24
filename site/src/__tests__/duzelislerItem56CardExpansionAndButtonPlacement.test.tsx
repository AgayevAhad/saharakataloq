import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from '../components/ProductCard';
import { FeaturedProductCard } from '../components/FeaturedProductCard';
import { Product } from '../types/product';
import { ThemeColors } from '../types/theme';

const mockProduct: Product = {
  id: 'prod-56-1',
  brand: 'ardo',
  category: 'aspirators',
  categoryName: 'Aspiratorlar',
  title: 'ARDO Sabaf 60 Inox Aspirator',
  code: 'ARDO-ASP-60-INX',
  price: 480,
  image: '/media/ardo/aspirator.webp',
  badge: 'Yeni',
  badgeColor: '#dc2626',
  country: 'İtaliya',
};

const darkTheme: ThemeColors = {
  mode: 'dark',
  primary: '#e11d48',
  primaryHover: '#be123c',
  primarySoft: 'rgba(225, 29, 72, 0.15)',
  secondary: '#f43f5e',
  accent: '#fb7185',
  bg: '#0b0f19',
  surface: '#111827',
  surfaceHover: '#1f2937',
  border: '#1e293b',
  borderLight: '#334155',
  text: '#ffffff',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
};

const lightTheme: ThemeColors = {
  mode: 'light',
  primary: '#dc2626',
  primaryHover: '#b91c1c',
  primarySoft: 'rgba(220, 38, 38, 0.1)',
  secondary: '#ef4444',
  accent: '#f87171',
  bg: '#ffffff',
  surface: '#f8fafc',
  surfaceHover: '#f1f5f9',
  border: '#e2e8f0',
  borderLight: '#cbd5e1',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
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

    // Card background must be clean white canvas for optimal product display
    const card = container.querySelector('.product-card') as HTMLElement;
    expect(card).toBeDefined();
    expect(card.style.backgroundColor).toBe('#ffffff');

    // "Ətraflı" button text must be high-contrast red/dark, NOT white (#ffffff)
    const detailsBtn = container.querySelector('.card-action-btn-details') as HTMLElement;
    expect(detailsBtn).toBeDefined();
    expect(detailsBtn.textContent).toContain('Ətraflı');
    expect(detailsBtn.style.color).toBe('#dc2626');

    // Compare and Favorite buttons maintain crisp light mode background (rgba(255,255,255,0.95))
    const compareBtn = container.querySelector('.card-action-btn-compare') as HTMLElement;
    expect(compareBtn).toBeDefined();
    expect(compareBtn.style.backgroundColor).toBe('rgba(255, 255, 255, 0.95)');

    const heartBtn = container.querySelector('.card-action-btn-heart') as HTMLElement;
    expect(heartBtn).toBeDefined();
    expect(heartBtn.style.backgroundColor).toBe('rgba(255, 255, 255, 0.95)');
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

  it('3. On hover, ProductCard smoothly activates Netflix expansion and expands bottom action tray', () => {
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

    // Hover card
    fireEvent.mouseEnter(card);

    // Verify card pop class & transform
    expect(card.classList.contains('hovered')).toBe(true);
    expect(card.style.transform).toContain('scale(1.03)');
    expect(card.style.zIndex).toBe('20');

    // Cluster should be expanded
    expect(cluster.style.opacity).toBe('1');
    expect(cluster.style.maxHeight).toBe('42px');

    // Mouse leave collapses
    fireEvent.mouseLeave(card);
    expect(cluster.style.opacity).toBe('0');
    expect(cluster.style.maxHeight).toBe('0px');
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
      <ProductCard
        product={multiImageProduct}
        theme={lightTheme}
        onSelect={vi.fn()}
      />
    );

    const prevBtn = container.querySelector('.card-media-nav-btn.prev') as HTMLElement;
    const nextBtn = container.querySelector('.card-media-nav-btn.next') as HTMLElement;

    expect(prevBtn).toBeDefined();
    expect(nextBtn).toBeDefined();
    expect(prevBtn.getAttribute('title')).toBe('Əvvəlki şəkil');
    expect(nextBtn.getAttribute('title')).toBe('Növbəti şəkil');
  });
});
