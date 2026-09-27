import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '../components/Header';
import { BrandCategoryFilter } from '../components/BrandCategoryFilter';
import { lightTheme } from '../types/theme';
import type { Brand, CatalogCategory } from '../types/product';

const sampleCategories: CatalogCategory[] = [
  {
    id: 'aspirator',
    name: 'Aspiratorlar',
    slug: 'aspirator',
    icon: '💨',
    active: true,
    sortOrder: 1,
  },
  { id: 'plite', name: 'Plitələr', slug: 'plite', icon: '🔥', active: true, sortOrder: 2 },
];

const sampleBrands: Brand[] = [
  {
    id: 'ardo',
    name: 'ARDO',
    slug: 'ardo',
    originCountry: 'İtaliya',
    manufacturingCountries: ['İtaliya'],
    active: true,
    logo: '/media/brands/ardo.svg',
  },
  {
    id: 'lotus',
    name: 'Lotus',
    slug: 'lotus',
    originCountry: 'Türkiyə',
    manufacturingCountries: ['Türkiyə'],
    active: true,
    logo: '/media/brands/lotus.svg',
  },
];

const sampleProducts = [
  {
    id: '1',
    name: 'ARDO Aspirator A1',
    brandId: 'ardo',
    category: 'aspirator',
    price: 500,
    status: 'active',
  },
  {
    id: '2',
    name: 'Lotus Aspirator L1',
    brandId: 'lotus',
    category: 'aspirator',
    price: 400,
    status: 'active',
  },
  {
    id: '3',
    name: 'ARDO Plitə P1',
    brandId: 'ardo',
    category: 'plite',
    price: 600,
    status: 'active',
  },
] as any;

describe('Header and Brand Category Selection Decoupling & Soft Red Aesthetics', () => {
  it('Header category pills render with soft red container and primary color text when active', () => {
    render(
      <Header
        categories={sampleCategories}
        brands={sampleBrands}
        products={sampleProducts}
        selectedCategory="aspirator"
        selectedBrand="all"
        searchQuery=""
        filteredCount={2}
        totalCount={3}
        favoritesCount={0}
        cartCount={0}
        theme={lightTheme}
        isDarkMode={false}
        onToggleTheme={() => {}}
        onSelectCategory={() => {}}
        onSelectBrand={() => {}}
        onSearchChange={() => {}}
        onOpenInverterInfo={() => {}}
        onOpenCatalogShare={() => {}}
      />
    );

    const activePill = screen.getByRole('button', { name: /Aspiratorlar/i });
    expect(activePill).toBeTruthy();
    expect(activePill.className).toContain('active');
    // Verify soft red background and primary text color
    expect(activePill.style.backgroundColor).toBe('rgba(220, 38, 38, 0.12)');
    expect(activePill.style.color).toBe(lightTheme.primary);
  });

  it('BrandCategoryFilter renders with soft red container and primary color text when active', () => {
    render(
      <BrandCategoryFilter
        brand={sampleBrands[0]}
        categories={sampleCategories}
        products={sampleProducts}
        selectedCategory="aspirator"
        onSelectCategory={() => {}}
        onBackToBrands={() => {}}
        theme={lightTheme}
      />
    );

    const activePill = screen.getByRole('tab', { name: /Aspiratorlar/i });
    expect(activePill).toBeTruthy();
    expect(activePill.className).toContain('active');
    expect(activePill.style.backgroundColor).toBe(`${lightTheme.primary}18`);
    expect(activePill.style.color).toBe(lightTheme.primary);
  });

  it('BrandCategoryFilter renders brand logo container with white background in dark mode', () => {
    const { container } = render(
      <BrandCategoryFilter
        brand={sampleBrands[0]}
        categories={sampleCategories}
        products={sampleProducts}
        selectedCategory="all"
        onSelectCategory={() => {}}
        onBackToBrands={() => {}}
        theme={lightTheme}
      />
    );

    const logo = container.querySelector('.brand-filter-logo');
    expect(logo).toBeTruthy();
    const logoWrapper = logo?.parentElement?.parentElement;
    expect(logoWrapper?.style.backgroundColor).toBe('#ffffff');
  });
});
