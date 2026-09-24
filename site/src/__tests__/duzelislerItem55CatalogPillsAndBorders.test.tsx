import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CatalogPage } from '../pages/CatalogPage';
import { CustomerChatWidget } from '../components/site/CustomerChatWidget';
import { lightTheme, darkTheme } from '../types/theme';
import { Category, Brand, Product, CatalogSettings } from '../types/product';

const mockCategories: Category[] = [
  { id: 'aspirator', name: 'Aspiratorlar', icon: 'fan', slug: 'aspiratorlar', active: true },
  { id: 'soba', name: 'Sobalar', icon: 'flame', slug: 'sobalar', active: true },
];

const mockBrands: Brand[] = [
  { id: 'ardo', name: 'ARDO', logo: '/media/brands/ardo.svg', slug: 'ardo', active: true },
  { id: 'lotus', name: 'LOTUS', logo: '/media/brands/lotus.svg', slug: 'lotus', active: true },
];

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    title: 'ARDO Aspirator Elite',
    category: 'aspirator',
    brandId: 'ardo',
    price: 350,
    published: true,
  },
  {
    id: 'prod-2',
    title: 'LOTUS Soba Pro',
    category: 'soba',
    brandId: 'lotus',
    price: 650,
    published: true,
  },
];

const mockSettings: CatalogSettings = {
  currency: 'AZN',
  storeName: 'Sahara Electronics',
};

describe('Item 55 Catalog Pills, Compare Box & Border Removals Verification', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders quick category pills without borders and with soft translucent red active styling', () => {
    const { container } = render(
      <CatalogPage
        categories={mockCategories}
        brands={mockBrands}
        products={mockProducts}
        settings={mockSettings}
        theme={lightTheme}
        themeMode="light"
        searchQuery=""
        onSearchChange={vi.fn()}
      />
    );

    const quickPills = container.querySelectorAll('.catalog-quick-pill');
    expect(quickPills.length).toBeGreaterThanOrEqual(2);

    const allPill = quickPills[0] as HTMLElement;
    expect(allPill.textContent).toContain('Bütün Məhsullar');
    expect(allPill.classList.contains('active')).toBe(true);
    // Active pill should have border none and soft translucent red background
    expect(allPill.style.border).toMatch(/^(none|none none|)$/);
    expect(allPill.style.color).toBe('#dc2626');
    expect(allPill.style.backgroundColor).toBe('rgba(220, 38, 38, 0.12)');

    const aspiratorPill = quickPills[1] as HTMLElement;
    expect(aspiratorPill.textContent).toContain('Aspiratorlar');
    // Inactive pill should also have border none
    expect(aspiratorPill.style.border).toMatch(/^(none|none none|)$/);

    // Click aspirator pill to make it active
    fireEvent.click(aspiratorPill);
    expect(aspiratorPill.style.border).toMatch(/^(none|none none|)$/);
    expect(aspiratorPill.style.color).toBe('#dc2626');
  });

  it('renders model count badge without border and with soft translucent red styling', () => {
    const { container } = render(
      <CatalogPage
        categories={mockCategories}
        brands={mockBrands}
        products={mockProducts}
        settings={mockSettings}
        theme={darkTheme}
        themeMode="dark"
        searchQuery=""
        onSearchChange={vi.fn()}
      />
    );

    const modelBadge = container.querySelector('h1 span:nth-child(2)') as HTMLElement;
    expect(modelBadge).toBeDefined();
    expect(modelBadge.textContent).toContain('model');
    expect(modelBadge.style.border).toMatch(/^(none|none none|)$/);
    expect(modelBadge.style.color).toBe('#ef4444');
  });

  it('renders top controls toolbar, sort button, and view mode switch without borders', () => {
    const { container } = render(
      <CatalogPage
        categories={mockCategories}
        brands={mockBrands}
        products={mockProducts}
        settings={mockSettings}
        theme={lightTheme}
        themeMode="light"
        searchQuery=""
        onSearchChange={vi.fn()}
      />
    );

    const topControls = container.querySelector('.catalog-top-controls') as HTMLElement;
    expect(topControls).toBeDefined();
    expect(topControls.style.border).toMatch(/^(none|none none|)$/);

    const sortBtn = container.querySelector('.catalog-sort-custom-btn') as HTMLElement;
    expect(sortBtn).toBeDefined();
    expect(sortBtn.style.border).toMatch(/^(none|none none|)$/);
  });

  it('renders CustomerChatWidget trigger button with 0 border class and active pulse animation', () => {
    const { container } = render(
      <CustomerChatWidget user={null} onOpenAccount={vi.fn()} />
    );

    const trigger = container.querySelector('.customer-chat-trigger') as HTMLElement;
    expect(trigger).toBeDefined();
    expect(trigger.classList.contains('customer-chat-trigger')).toBe(true);
  });
});
