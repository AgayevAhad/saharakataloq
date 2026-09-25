// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest';
import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
import { SmartSearchOverlay } from '../components/SmartSearchOverlay';
import { SiteHeader } from '../components/site/SiteHeader';
import { lightTheme } from '../types/theme';
import { Brand, CatalogCategory, Product } from '../types/product';

const mockBrands: Brand[] = [
  {
    id: 'ardo',
    name: 'ARDO',
    slug: 'ardo',
    originCountry: 'İtaliya',
    manufacturingCountries: ['İtaliya'],
    active: true,
  },
  {
    id: 'lotus',
    name: 'Lotus',
    slug: 'lotus',
    originCountry: 'Türkiyə',
    manufacturingCountries: ['Türkiyə'],
    active: true,
  },
];

const mockCategories: CatalogCategory[] = [
  { id: 'oven', name: 'Sobalar', slug: 'sobalar', active: true },
  { id: 'airfryer', name: 'Fritözlər (Airfryer)', slug: 'fritozler', active: true },
  { id: 'hood', name: 'Aspiratorlar', slug: 'aspiratorlar', active: true },
  { id: 'hob', name: 'Bişirmə panelləri', slug: 'bisirme-panelleri', active: true },
];

const mockProducts: Product[] = [
  {
    id: 'ardo-1',
    code: 'M604B',
    title: 'ARDO M604B Quraşdırılan Soba',
    brandId: 'ardo',
    category: 'oven',
    categoryName: 'Sobalar',
    image: '/media/ardo-oven.png',
    price: 450,
    currency: '₼',
    shortDesc: 'Quraşdırılan soba',
    specs: [{ id: 's1', name: 'Növ', value: 'Quraşdırılan soba', group: 'Əsas' }],
    highlights: ['Sabaf'],
    status: 'published',
  },
  {
    id: 'lotus-1',
    code: 'AF-802',
    title: 'Lotus AF-802 Sensorlu Airfryer',
    brandId: 'lotus',
    category: 'airfryer',
    categoryName: 'Fritözlər (Airfryer)',
    image: '/media/lotus-airfryer.png',
    price: 180,
    oldPrice: 220,
    currency: '₼',
    shortDesc: 'Sensorlu airfryer',
    specs: [{ id: 's2', name: 'Növ', value: 'Sensorlu hava qızdırıcı', group: 'Əsas' }],
    highlights: ['Rapid Air'],
    status: 'published',
  },
  {
    id: 'ardo-2',
    code: 'H60V4X',
    title: 'ARDO H60V4X Sabaf Qaz Paneli',
    brandId: 'ardo',
    category: 'hob',
    categoryName: 'Bişirmə panelləri',
    image: '/media/ardo-hob.png',
    price: 320,
    currency: '₼',
    shortDesc: 'Qaz paneli',
    specs: [{ id: 's3', name: 'Odluq', value: 'Sabaf', group: 'Əsas' }],
    highlights: ['Sabaf'],
    status: 'published',
  },
  {
    id: 'lotus-2',
    code: 'LT-300',
    title: 'Lotus LT-300 Mətbəx Kombaynı',
    brandId: 'lotus',
    category: 'hood',
    categoryName: 'Aspiratorlar',
    image: '/media/lotus-hood.png',
    price: 95,
    currency: '₼',
    shortDesc: 'Aspirator',
    specs: [{ id: 's4', name: 'Güc', value: '300W', group: 'Əsas' }],
    highlights: ['Turbo'],
    status: 'published',
  },
];

describe('SmartSearchOverlay & Multi-Brand Search Tests', () => {
  it('renders smart search suggestions, generic multi-brand cards without prices, and categories when visible', () => {
    const onSearchChange = vi.fn();
    const onClose = vi.fn();
    const onSelectCategory = vi.fn();
    const onSelectBrand = vi.fn();
    const onSelectProduct = vi.fn();

    render(
      <SmartSearchOverlay
        visible={true}
        searchQuery=""
        onSearchChange={onSearchChange}
        onClose={onClose}
        products={mockProducts}
        categories={mockCategories}
        brands={mockBrands}
        theme={lightTheme}
        isDarkMode={false}
        onSelectCategory={onSelectCategory}
        onSelectBrand={onSelectBrand}
        onSelectProduct={onSelectProduct}
      />
    );

    // Section headers
    expect(screen.getByText('Axtarış üzrə nəticə')).toBeDefined();
    expect(screen.getByText('Populyar məhsullar')).toBeDefined();
    expect(screen.getByText('Kateqoriyalar')).toBeDefined();
    expect(screen.getByText('Hamısını göstər')).toBeDefined();

    // Multi-brand product suggestions & popular items
    expect(screen.getAllByText(/Lotus/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ARDO/).length).toBeGreaterThan(0);

    // Detail action rendered
    expect(screen.getAllByText(/Ətraflı bax/).length).toBeGreaterThan(0);

    // Prices and "Qiymət üçün əlaqə" must NOT be rendered in public search cards
    expect(screen.queryByText(/450 ₼/)).toBeNull();
    expect(screen.queryByText(/180 ₼/)).toBeNull();
    expect(screen.queryByText(/Qiymət üçün əlaqə/)).toBeNull();

    // Category pills
    expect(screen.getAllByText('Sobalar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fritözlər (Airfryer)').length).toBeGreaterThan(0);
  });

  it('filters suggestions dynamically across ARDO and LOTUS brands when typing query', () => {
    const onSearchChange = vi.fn();
    const onSelectProduct = vi.fn();

    const { rerender } = render(
      <SmartSearchOverlay
        visible={true}
        searchQuery="lotus"
        onSearchChange={onSearchChange}
        onClose={vi.fn()}
        products={mockProducts}
        categories={mockCategories}
        brands={mockBrands}
        theme={lightTheme}
        isDarkMode={false}
        onSelectCategory={vi.fn()}
        onSelectBrand={vi.fn()}
        onSelectProduct={onSelectProduct}
      />
    );

    // Should find Lotus Airfryer
    expect(screen.getAllByText(/AF-802/).length).toBeGreaterThan(0);

    // Now search for "ardo"
    rerender(
      <SmartSearchOverlay
        visible={true}
        searchQuery="ardo"
        onSearchChange={onSearchChange}
        onClose={vi.fn()}
        products={mockProducts}
        categories={mockCategories}
        brands={mockBrands}
        theme={lightTheme}
        isDarkMode={false}
        onSelectCategory={vi.fn()}
        onSelectBrand={vi.fn()}
        onSelectProduct={onSelectProduct}
      />
    );

    expect(screen.getAllByText(/M604B/).length).toBeGreaterThan(0);
  });

  it('clicking a category pill in the search overlay selects category and navigates', () => {
    const onSelectCategory = vi.fn();
    const onSelectBrand = vi.fn();
    const onClose = vi.fn();

    const { container } = render(
      <SmartSearchOverlay
        visible={true}
        searchQuery=""
        onSearchChange={vi.fn()}
        onClose={onClose}
        products={mockProducts}
        categories={mockCategories}
        brands={mockBrands}
        theme={lightTheme}
        isDarkMode={false}
        onSelectCategory={onSelectCategory}
        onSelectBrand={onSelectBrand}
      />
    );

    const ovenPill = container.querySelector('.smart-search-category-pill') as HTMLElement;
    fireEvent.click(ovenPill);

    expect(onSelectCategory).toHaveBeenCalledWith('oven');
    expect(onSelectBrand).toHaveBeenCalledWith('all');
    expect(onClose).toHaveBeenCalled();
  });

  it('clicking a popular product card triggers product selection', () => {
    const onSelectProduct = vi.fn();
    const onClose = vi.fn();

    render(
      <SmartSearchOverlay
        visible={true}
        searchQuery=""
        onSearchChange={vi.fn()}
        onClose={onClose}
        products={mockProducts}
        categories={mockCategories}
        brands={mockBrands}
        theme={lightTheme}
        isDarkMode={false}
        onSelectCategory={vi.fn()}
        onSelectBrand={vi.fn()}
        onSelectProduct={onSelectProduct}
      />
    );

    const lotusCard = screen.getAllByText(/Lotus AF-802 Sensorlu Airfryer/)[0];
    fireEvent.click(lotusCard);

    expect(onSelectProduct).toHaveBeenCalledWith(expect.objectContaining({ id: 'lotus-1' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('SiteHeader component renders and opens SmartSearchOverlay on input focus', () => {
    const onSearchChange = vi.fn();

    render(
      <SiteHeader
        currentRoute="home"
        onNavigate={vi.fn()}
        theme={lightTheme}
        themeMode="light"
        onToggleTheme={vi.fn()}
        brands={mockBrands}
        categories={mockCategories}
        products={mockProducts}
        searchQuery=""
        onSearchChange={onSearchChange}
        onOpenSearchModal={vi.fn()}
        comparisonCount={0}
        favoritesCount={0}
      />
    );

    const searchInput = screen.getByTestId('header-search-input');
    fireEvent.focus(searchInput);

    // SmartSearchOverlay should appear with its section titles
    expect(screen.getAllByText('Axtarış üzrə nəticə')[0]).toBeDefined();
    expect(screen.getAllByText('Populyar məhsullar')[0]).toBeDefined();
  });

  it('updates the right preview images and title dynamically when hovering with mouse over suggestions or categories', () => {
    const { container } = render(
      <SmartSearchOverlay
        visible={true}
        searchQuery=""
        onSearchChange={vi.fn()}
        onClose={vi.fn()}
        products={mockProducts}
        categories={mockCategories}
        brands={mockBrands}
        theme={lightTheme}
        isDarkMode={false}
        onSelectCategory={vi.fn()}
        onSelectBrand={vi.fn()}
      />
    );

    // Initial right title is "Populyar məhsullar"
    expect(screen.getByText('Populyar məhsullar')).toBeDefined();

    // Hover over an ARDO suggestion item
    const ardoSuggestion = screen.getAllByText(/ARDO M604B/)[0];
    fireEvent.mouseEnter(ardoSuggestion.closest('button')!);

    // Right header and product card update to show the hovered item
    expect(screen.getAllByText('ARDO M604B Quraşdırılan Soba').length).toBeGreaterThan(1);

    // Mouse leave restores back
    fireEvent.mouseLeave(ardoSuggestion.closest('button')!);
    expect(screen.getByText('Populyar məhsullar')).toBeDefined();

    // Hover over a category pill (airfryer pill)
    const categoryPills = container.querySelectorAll('.smart-search-category-pill');
    const airfryerPill = categoryPills[1] as HTMLElement;
    fireEvent.mouseEnter(airfryerPill);

    expect(screen.getByText('Fritözlər (Airfryer) məhsulları')).toBeDefined();
  });

  it('handles Escape key press and backdrop clicks to close overlay', () => {
    const onClose = vi.fn();

    const { container } = render(
      <SmartSearchOverlay
        visible={true}
        searchQuery=""
        onSearchChange={vi.fn()}
        onClose={onClose}
        products={mockProducts}
        categories={mockCategories}
        brands={mockBrands}
        theme={lightTheme}
        isDarkMode={false}
        onSelectCategory={vi.fn()}
        onSelectBrand={vi.fn()}
      />
    );

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();

    // Click backdrop
    const backdrop = container.querySelector('.smart-search-backdrop') as HTMLElement;
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(2);
    }
  });

  it('renders CategoryGlyph icons in front of category names and renders more button in the same row', () => {
    // 10 categories to trigger more button
    const tenCategories: CatalogCategory[] = [
      ...mockCategories,
      { id: 'refrigerator', name: 'Soyuducular', slug: 'soyuducular', active: true },
      { id: 'dishwasher', name: 'Qabyuyanlar', slug: 'qabyuyanlar', active: true },
      { id: 'washingmachine', name: 'Paltaryuyanlar', slug: 'paltaryuyanlar', active: true },
      { id: 'microwave', name: 'Mikrodalğalı sobalar', slug: 'mikrodalgali-sobalar', active: true },
      { id: 'vacuum', name: 'Tozsoranlar', slug: 'tozsoranlar', active: true },
      { id: 'ac', name: 'Kondisionerlər', slug: 'kondisionerler', active: true },
    ];
    const matchingProducts: Product[] = tenCategories.map((c, i) => ({
      id: `p-${i}`,
      code: `CODE-${i}`,
      title: `${c.name} Model ${i}`,
      brandId: 'ardo',
      category: c.id,
      categoryName: c.name,
      image: '',
      shortDesc: '',
      specs: [],
      highlights: [],
      status: 'published',
    }));

    const { container } = render(
      <SmartSearchOverlay
        visible={true}
        searchQuery=""
        onSearchChange={vi.fn()}
        onClose={vi.fn()}
        products={matchingProducts}
        categories={tenCategories}
        brands={mockBrands}
        theme={lightTheme}
        isDarkMode={false}
        onSelectCategory={vi.fn()}
        onSelectBrand={vi.fn()}
      />
    );

    // Verify category pills have CategoryGlyph icons
    const categoryPills = container.querySelectorAll('.smart-search-category-pill');
    expect(categoryPills.length).toBeGreaterThan(0);
    categoryPills.forEach((pill) => {
      const glyph = pill.querySelector('.category-glyph');
      expect(glyph).toBeTruthy();
    });

    // Verify more button is inside .smart-search-categories-row alongside the category pills
    const categoriesRow = container.querySelector('.smart-search-categories-row');
    const moreBtn = container.querySelector('.smart-search-categories-more');
    expect(categoriesRow).toBeTruthy();
    expect(moreBtn).toBeTruthy();
    expect(moreBtn?.parentElement).toBe(categoriesRow);
  });
});
