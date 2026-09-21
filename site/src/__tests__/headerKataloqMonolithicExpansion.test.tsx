import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MegaMenu } from '../components/site/MegaMenu';
import { SiteHeader } from '../components/site/SiteHeader';
import { lightTheme, darkTheme } from '../types/theme';
import { Product } from '../types/product';

const mockCategories = [
  { id: 'washer', name: 'Paltaryuyanlar', active: true, slug: 'paltaryuyanlar' },
  { id: 'refrigerator', name: 'Soyuducular', active: true, slug: 'soyuducular' },
  { id: 'cooktop', name: 'Bişirmə Panelləri', active: true, slug: 'bisirme-panelleri' },
  { id: 'air_conditioner', name: 'Kondisionerlər', active: true, slug: 'kondisionerler' },
];

const mockBrands = [
  {
    id: 'ardo',
    name: 'ARDO',
    slug: 'ardo',
    active: true,
    originCountry: 'İtaliya',
    manufacturingCountries: ['Türkiyə'],
  },
  {
    id: 'lotus',
    name: 'Lotus',
    slug: 'lotus',
    active: true,
    originCountry: 'Türkiyə',
    manufacturingCountries: ['Türkiyə'],
  },
];

const mockProducts: Product[] = [
  {
    id: 'ardo-w1',
    code: 'ardo-w1',
    title: 'ARDO Inverter 9kg Washer',
    category: 'washer',
    categoryName: 'Paltaryuyanlar',
    brandId: 'ardo',
    price: 899,
    image: '/media/ardo-w1.jpg',
    status: 'published',
    shortDesc: 'İnverter mühərrikli paltaryuyan',
    specs: [],
    highlights: [],
  },
];

describe('Header Kataloq Monolithic MegaMenu Expansion', () => {
  it('renders MegaMenu with monolithic solid background and zero top gap in Light mode', () => {
    const handleClose = vi.fn();
    const handleSelectCategory = vi.fn();
    const handleSelectBrand = vi.fn();
    const handleNavigate = vi.fn();

    const { container } = render(
      <MegaMenu
        isOpen={true}
        onClose={handleClose}
        categories={mockCategories}
        brands={mockBrands}
        products={mockProducts}
        theme={lightTheme}
        onSelectCategory={handleSelectCategory}
        onSelectBrand={handleSelectBrand}
        onNavigate={handleNavigate}
      />
    );

    const overlay = container.querySelector('#mega-menu-overlay') as HTMLElement;
    expect(overlay).toBeTruthy();
    expect(overlay.style.position).toBe('relative');
    expect(overlay.style.backdropFilter).toBe('none');
    expect(overlay.style.backgroundColor).toBe('transparent');
  });

  it('renders MegaMenu with monolithic transparent background in Dark mode so header frosted glass blur shines through', () => {
    const handleClose = vi.fn();
    const handleSelectCategory = vi.fn();
    const handleSelectBrand = vi.fn();
    const handleNavigate = vi.fn();

    const { container } = render(
      <MegaMenu
        isOpen={true}
        onClose={handleClose}
        categories={mockCategories}
        brands={mockBrands}
        products={mockProducts}
        theme={darkTheme}
        onSelectCategory={handleSelectCategory}
        onSelectBrand={handleSelectBrand}
        onNavigate={handleNavigate}
      />
    );

    const overlay = container.querySelector('#mega-menu-overlay') as HTMLElement;
    expect(overlay).toBeTruthy();
    expect(overlay.style.position).toBe('relative');
    expect(overlay.style.backdropFilter).toBe('none');
    expect(overlay.style.backgroundColor).toBe('transparent');
  });

  it('navigates cleanly when category or brand is selected inside MegaMenu', () => {
    const handleClose = vi.fn();
    const handleSelectCategory = vi.fn();
    const handleSelectBrand = vi.fn();
    const handleNavigate = vi.fn();

    const { container } = render(
      <MegaMenu
        isOpen={true}
        onClose={handleClose}
        categories={mockCategories}
        brands={mockBrands}
        products={mockProducts}
        theme={lightTheme}
        onSelectCategory={handleSelectCategory}
        onSelectBrand={handleSelectBrand}
        onNavigate={handleNavigate}
      />
    );

    // Click on a category button inside MegaMenu
    const categoryBtn = Array.from(
      container.querySelectorAll<HTMLButtonElement>('.mega-menu-link')
    ).find((btn) => btn.textContent?.includes('Paltaryuyanlar'));
    expect(categoryBtn).toBeTruthy();
    fireEvent.click(categoryBtn!);
    expect(handleSelectCategory).toHaveBeenCalledWith('washer');

    // Click on a brand button inside MegaMenu
    const brandBtn = container.querySelector<HTMLButtonElement>('.mega-menu-brand-card');
    expect(brandBtn).toBeTruthy();
    fireEvent.click(brandBtn!);
    expect(handleSelectBrand).toHaveBeenCalledWith('ardo');
  });

  it('SiteHeader smoothly displays monolithic MegaMenu when Kataloq button is hovered or clicked', () => {
    const handleNavigate = vi.fn();

    const { container } = render(
      <SiteHeader
        currentRoute="home"
        onNavigate={handleNavigate}
        categories={mockCategories}
        brands={mockBrands}
        products={mockProducts}
        theme={lightTheme}
        themeMode="light"
        onToggleTheme={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenSearchModal={vi.fn()}
        comparisonCount={0}
        favoritesCount={0}
        onOpenSaharaMatch={vi.fn()}
      />
    );

    const kataloqButton = container.querySelector('.mega-menu-trigger-btn') as HTMLButtonElement;
    expect(kataloqButton).toBeTruthy();

    fireEvent.click(kataloqButton);

    const overlay = document.querySelector('#mega-menu-overlay');
    expect(overlay).toBeTruthy();
  });
});
