import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types/product';
import {
  ThemeColors,
  darkTheme as baseDarkTheme,
  lightTheme as baseLightTheme,
} from '../types/theme';

const mockProduct: Product = {
  id: 'prod-title-test-1',
  brandId: 'ardo',
  category: 'cooktops',
  categoryName: 'Bişirmə panelləri',
  title: 'ARDO C 604 R VGG Inox Qaz Paneli',
  code: 'ARDO-C604-INX',
  price: 650,
  image: '/media/ardo/cooktop.webp',
  badgeText: 'Topdan',
  badgeColor: 'blue',
  manufacturingCountry: 'İtaliya',
  shortDesc: 'İtalyan istehsalı qaz paneli',
  specs: [],
  highlights: [],
};

const lightTheme: ThemeColors = {
  ...baseLightTheme,
  primary: '#dc2626',
  primaryHover: '#b91c1c',
};

const darkTheme: ThemeColors = {
  ...baseDarkTheme,
  primary: '#e11d48',
  primaryHover: '#be123c',
};

describe('Product Card Desktop Title Flow & Share Button Border Refinements', () => {
  it('1. Brand badge and category container is in normal flow before title, preventing overlap', () => {
    const { container } = render(
      <ProductCard
        product={mockProduct}
        brand={{ id: 'ardo', name: 'ARDO' }}
        theme={lightTheme}
        onSelect={vi.fn()}
        onShare={vi.fn()}
        onAddToCart={vi.fn()}
        onToggleFavorite={vi.fn()}
        onToggleCompare={vi.fn()}
      />
    );

    const details = container.querySelector('.product-card-details') as HTMLElement;
    expect(details).toBeTruthy();

    const identityTop = details.querySelector('.product-card-identity-top') as HTMLElement;
    const title = details.querySelector('.product-card-full-title') as HTMLElement;

    expect(identityTop).toBeTruthy();
    expect(title).toBeTruthy();

    // Verify DOM order: identityTop is rendered before title inside details
    const children = Array.from(details.children);
    const identityIndex = children.indexOf(identityTop);
    const titleIndex = children.indexOf(title);

    expect(identityIndex).toBeGreaterThanOrEqual(0);
    expect(titleIndex).toBeGreaterThan(identityIndex);

    // Verify identity contains both brand badge and category
    expect(identityTop.querySelector('.product-brand-badge')).toBeTruthy();
    expect(identityTop.querySelector('.product-card-category-top')).toBeTruthy();
    expect(title.textContent).toBe('ARDO C 604 R VGG Inox Qaz Paneli');
  });

  it('2. Share button has border removed (no thin box frame) in both light and dark themes', () => {
    const { container: lightContainer } = render(
      <ProductCard
        product={mockProduct}
        brand={{ id: 'ardo', name: 'ARDO' }}
        theme={lightTheme}
        onSelect={vi.fn()}
        onShare={vi.fn()}
      />
    );

    const lightShareBtn = lightContainer.querySelector('.card-action-btn-share') as HTMLButtonElement;
    expect(lightShareBtn).toBeTruthy();
    expect(lightShareBtn.style.border).toContain('none');

    const { container: darkContainer } = render(
      <ProductCard
        product={mockProduct}
        brand={{ id: 'ardo', name: 'ARDO' }}
        theme={darkTheme}
        onSelect={vi.fn()}
        onShare={vi.fn()}
      />
    );

    const darkShareBtn = darkContainer.querySelector('.card-action-btn-share') as HTMLButtonElement;
    expect(darkShareBtn).toBeTruthy();
    expect(darkShareBtn.style.border).toContain('none');
  });

  it('3. CSS file rules verify desktop static positioning, downward button shift, and borderless share button', () => {
    const cssPath = path.resolve(__dirname, '../styles/components/product-card.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    // Desktop .product-card-identity-top must be static, not absolute
    expect(cssContent).toMatch(/\.product-card-identity-top\s*\{[^}]*position:\s*static/);
    expect(cssContent).toMatch(/\.product-card-identity-top\s*\{[^}]*order:\s*0/);

    // .product-card-details must justify-content: flex-start to prevent center gap
    expect(cssContent).toMatch(/\.product-card-details\s*\{[^}]*justify-content:\s*flex-start/);

    // .product-card-contact-actions must have margin-top: auto to shift buttons down
    expect(cssContent).toMatch(/\.product-card-contact-actions\s*\{[^}]*margin-top:\s*auto/);

    // .card-action-btn-share must have border: none !important
    expect(cssContent).toMatch(/\.card-action-btn-share\s*\{[^}]*border:\s*none\s*!important/);

    // Mobile catalog styles protect mobile layout with margin-top: 0
    const mobileCssPath = path.resolve(__dirname, '../styles/components/mobile-catalog.css');
    const mobileCssContent = fs.readFileSync(mobileCssPath, 'utf-8');
    expect(mobileCssContent).toMatch(/margin-top:\s*0\s*!important/);
  });
});
