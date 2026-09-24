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

    fireEvent.mouseEnter(kataloqButton);

    const overlay = document.querySelector('#mega-menu-overlay');
    expect(overlay).toBeTruthy();

    fireEvent.click(kataloqButton);
    expect(handleNavigate).toHaveBeenCalledWith('catalog');
  });

  it('renders up to 4 product cards in showcase and single-column brand list', () => {
    const fourProducts: Product[] = [
      {
        id: 'w-1',
        code: 'w-1',
        title: 'Washer 1',
        category: 'washer',
        categoryName: 'Paltaryuyanlar',
        image: '/media/w1.jpg',
        shortDesc: 'Washer 1 description',
        brandId: 'ardo',
        price: 500,
        status: 'published',
        specs: [],
        highlights: [],
      },
      {
        id: 'w-2',
        code: 'w-2',
        title: 'Washer 2',
        category: 'washer',
        categoryName: 'Paltaryuyanlar',
        image: '/media/w2.jpg',
        shortDesc: 'Washer 2 description',
        brandId: 'ardo',
        price: 600,
        status: 'published',
        specs: [],
        highlights: [],
      },
      {
        id: 'w-3',
        code: 'w-3',
        title: 'Washer 3',
        category: 'washer',
        categoryName: 'Paltaryuyanlar',
        image: '/media/w3.jpg',
        shortDesc: 'Washer 3 description',
        brandId: 'ardo',
        price: 700,
        status: 'published',
        specs: [],
        highlights: [],
      },
      {
        id: 'w-4',
        code: 'w-4',
        title: 'Washer 4',
        category: 'washer',
        categoryName: 'Paltaryuyanlar',
        image: '/media/w4.jpg',
        shortDesc: 'Washer 4 description',
        brandId: 'ardo',
        price: 800,
        status: 'published',
        specs: [],
        highlights: [],
      },
    ];

    const { container } = render(
      <MegaMenu
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        brands={mockBrands}
        products={fourProducts}
        theme={lightTheme}
        onSelectCategory={vi.fn()}
        onSelectBrand={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    const productCards = container.querySelectorAll('.mega-menu-product-card-wrap');
    expect(productCards.length).toBe(4);

    const showcase = container.querySelector('.mega-menu-products-showcase');
    expect(showcase).toBeTruthy();
    expect(showcase?.parentElement?.classList.contains('catalog-container')).toBe(true);

    const brandsList = container.querySelectorAll('.mega-menu-brand-card');
    expect(brandsList.length).toBeGreaterThanOrEqual(2);
  });
});
