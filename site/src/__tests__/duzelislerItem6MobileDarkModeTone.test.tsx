import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { darkTheme, lightTheme } from '../types/theme';
import { MobileCategoryDrawer } from '../components/site/MobileCategoryDrawer';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import type { Brand, CatalogCategory, Product } from '../types/product';

const mockProduct: Product = {
  id: 'prod-item-6',
  brandId: 'ardo',
  category: 'washing-machines',
  categoryName: 'Paltaryuyanlar',
  title: 'ARDO Sabaf Premium Paltaryuyan',
  code: 'ARDO-WM-100',
  price: 999,
  image: '/media/ardo/washing-machine.webp',
  badgeText: 'Yeni',
  badgeColor: 'red',
  manufacturingCountry: 'İtaliya',
  status: 'published',
  shortDesc: '',
  specs: [],
  highlights: [],
};

const mockCategories: CatalogCategory[] = [
  { id: 'all', slug: 'all', name: 'Bütün məhsullar', icon: 'Grid', count: 12, active: true },
  { id: 'washing-machines', slug: 'washing-machines', name: 'Paltaryuyanlar', icon: 'WashingMachine', count: 6, active: true },
  { id: 'refrigerators', slug: 'refrigerators', name: 'Soyuducular', icon: 'Refrigerator', count: 6, active: true },
];

const mockBrands: Brand[] = [
  { id: 'ardo', slug: 'ardo', name: 'ARDO', description: 'İtalyan texnologiyası', originCountry: 'İtaliya', manufacturingCountries: ['İtaliya'], active: true },
  { id: 'lotus', slug: 'lotus', name: 'Lotus', description: 'Müasir mətbəx avadanlıqları', originCountry: 'Türkiyə', manufacturingCountries: ['Türkiyə'], active: true },
  { id: 'artel', slug: 'artel', name: 'Artel', description: 'Məişət texnikası', originCountry: 'Özbəkistan', manufacturingCountries: ['Özbəkistan'], active: true },
];

describe('Duzelisler Item 6: Mobile and Desktop Dark Mode Tone Equalization', () => {
  it('1. darkTheme tokens in theme.ts match deep neutral desktop slate (#09090b, #121214, #18181b, #27272a)', () => {
    // darkTheme background must be neutral deep black/slate, not dark blue/navy (#17202e)
    expect(darkTheme.bg).toBe('#09090b');
    expect(darkTheme.bgSecondary).toBe('#121214');
    expect(darkTheme.bgCard).toBe('#121214');
    expect(darkTheme.border).toBe('#27272a');
    expect(darkTheme.borderHover).toBe('#3f3f46');
    expect(darkTheme.surface).toBe('#121214');

    // Ensure no old bluish tones remain in primary dark tokens
    expect(darkTheme.bg).not.toBe('#17202e');
    expect(darkTheme.bgSecondary).not.toBe('#1c2737');
    expect(darkTheme.bgCard).not.toBe('#253247');
    expect(darkTheme.border).not.toBe('#35465c');
  });

  it('2. tokens.css defines neutral deep black palette for dark mode without bluish tones', () => {
    const tokensCssPath = path.resolve(__dirname, '../styles/tokens.css');
    const tokensCss = fs.readFileSync(tokensCssPath, 'utf8');

    expect(tokensCss).toContain('--bg: #09090b;');
    expect(tokensCss).toContain('--bg-rgb: 9, 9, 11;');
    expect(tokensCss).toContain('--bg-secondary: #121214;');
    expect(tokensCss).toContain('--bg-card: #121214;');
    expect(tokensCss).toContain('--bg-card-hover: #1f1f22;');
    expect(tokensCss).toContain('--border: #27272a;');
    expect(tokensCss).toContain('--border-hover: #3f3f46;');

    // Verify dark mode does not use old navy tones
    expect(tokensCss).not.toContain('--bg: #17202e;');
    expect(tokensCss).not.toContain('--bg-card: #253247;');
  });

  it('3. MobileCategoryDrawer renders deep black/charcoal backgrounds in dark mode instead of navy blue', () => {
    const { container } = render(
      <MobileCategoryDrawer
        isOpen={true}
        onClose={vi.fn()}
        theme={darkTheme}
        themeMode="dark"
        categories={mockCategories}
        brands={mockBrands}
        products={[mockProduct]}
        onSelectCategory={vi.fn()}
        onSelectBrand={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    const drawerPanel = container.querySelector('.mobile-category-drawer') as HTMLElement;
    expect(drawerPanel).toBeTruthy();
    expect(drawerPanel.style.backgroundColor).toBe('#09090b');

    const header = container.querySelector('.mobile-category-drawer-header') as HTMLElement;
    expect(header).toBeTruthy();
    expect(header.style.backgroundColor).toBe('#121214');

    const footer = container.querySelector('.mobile-category-drawer-footer') as HTMLElement;
    expect(footer).toBeTruthy();
    expect(footer.style.backgroundColor).toBe('#121214');
  });

  it('4. Header category filter pills use #18181b in dark mode matching desktop neutral palette', () => {
    const { container } = render(
      <Header
        selectedCategory="all"
        onSelectCategory={vi.fn()}
        selectedBrand="all"
        onSelectBrand={vi.fn()}
        brands={mockBrands}
        searchQuery=""
        onSearchChange={vi.fn()}
        categories={mockCategories}
        products={[mockProduct]}
        isDarkMode={true}
        onToggleTheme={vi.fn()}
        theme={darkTheme}
        totalCount={1}
        filteredCount={1}
        onOpenCatalogShare={vi.fn()}
      />
    );

    // Find category buttons (.filter-pill)
    const pills = container.querySelectorAll('.filter-pill');
    expect(pills.length).toBeGreaterThan(1);

    // Unselected pill (second pill) should have backgroundColor #18181b in dark mode
    const unselectedPill = pills[1] as HTMLElement;
    expect(unselectedPill.style.backgroundColor).toBe('#18181b');
  });

  it('5. ProductCard reflects darkTheme.bgCard (#121214) and border in dark mode', () => {
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

    const card = container.querySelector('.product-card') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.style.backgroundColor).toBe('#121214');
    expect(card.style.border).toBe('1px solid #27272a');
  });

  it('6. index.html splash screen and theme-color meta tag use #09090b matching desktop dark mode', () => {
    const indexHtmlPath = path.resolve(__dirname, '../../index.html');
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

    // Theme color meta tag
    expect(indexHtml).toContain('content="#09090b"');

    // Splash screen dark mode CSS tokens
    expect(indexHtml).toContain('--splash-bg: radial-gradient(circle at 50% 40%, #121214 0%, #09090b 100%);');
    expect(indexHtml).toContain('--splash-body-bg: #09090b');
    expect(indexHtml).toContain('--scrollbar-thumb: #27272a');

    // Ensure old navy theme colors are removed
    expect(indexHtml).not.toContain('content="#17202e"');
    expect(indexHtml).not.toContain('--splash-body-bg: #17202e');
  });
});
