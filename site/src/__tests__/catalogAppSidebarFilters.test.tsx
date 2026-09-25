// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CatalogSidebarFilter } from '../components/CatalogSidebarFilter';
import { DEFAULT_CATALOG } from '../data/catalog';
import { lightTheme } from '../types/theme';

describe('CatalogSidebarFilter Component Suite', () => {
  it('renders all filter sections properly (bölmələr, qiymət, xüsusi, texniki xüsusiyyətlər)', () => {
    const onSelectCategory = vi.fn();
    const onMinPriceChange = vi.fn();
    const onMaxPriceChange = vi.fn();
    const onToggleDiscounted = vi.fn();
    const onToggleWithVideo = vi.fn();
    const onSelectEnergyClass = vi.fn();
    const onSelectMotorType = vi.fn();
    const onSelectColor = vi.fn();
    const onResetFilters = vi.fn();

    const onToggleBrand = vi.fn();

    const { getByText, getAllByText } = render(
      <CatalogSidebarFilter
        categories={DEFAULT_CATALOG.categories}
        brands={DEFAULT_CATALOG.brands}
        activeProducts={DEFAULT_CATALOG.products}
        selectedCategory="all"
        onSelectCategory={onSelectCategory}
        selectedBrands={['ardo']}
        onToggleBrand={onToggleBrand}
        showBrandSection={true}
        minPrice={100}
        maxPrice={2000}
        minAvailablePrice={50}
        maxAvailablePrice={3500}
        onMinPriceChange={onMinPriceChange}
        onMaxPriceChange={onMaxPriceChange}
        onlyDiscounted={false}
        onToggleDiscounted={onToggleDiscounted}
        onlyWithVideo={false}
        onToggleWithVideo={onToggleWithVideo}
        selectedEnergyClass="all"
        onSelectEnergyClass={onSelectEnergyClass}
        selectedMotorType="all"
        onSelectMotorType={onSelectMotorType}
        selectedColor="all"
        onSelectColor={onSelectColor}
        hasActiveFilters={false}
        onResetFilters={onResetFilters}
        theme={lightTheme}
        isDarkMode={false}
      />
    );

    // Verify filter section headings
    expect(getByText('Bölmələr')).toBeDefined();
    expect(getByText('Brendlər')).toBeDefined();
    expect(getByText('Qiymət Aralığı (₼)')).toBeDefined();
    expect(getByText('Funksiya & Xüsusiyyətlər')).toBeDefined();

    // Verify category selection
    const allCatBtn = getByText('Bütün Bölmələr');
    expect(allCatBtn).toBeDefined();

    // Click on preset price chip
    const preset500to1000 = getByText('500 - 1000 ₼');
    fireEvent.click(preset500to1000);
    expect(onMinPriceChange).toHaveBeenCalledWith(500);
    expect(onMaxPriceChange).toHaveBeenCalledWith(1000);

    // Toggle brand
    const ardoBrand = getByText('ARDO');
    fireEvent.click(ardoBrand);
    expect(onToggleBrand).toHaveBeenCalledWith('ardo');

    // Select inverter motor
    const inverterBtn = getByText('İnverter');
    fireEvent.click(inverterBtn);
    expect(onSelectMotorType).toHaveBeenCalledWith('inverter');
  });

  it('renders reset button when active filters exist', () => {
    const onResetFilters = vi.fn();

    const { getByText } = render(
      <CatalogSidebarFilter
        categories={DEFAULT_CATALOG.categories}
        activeProducts={DEFAULT_CATALOG.products}
        selectedCategory="soba"
        onSelectCategory={vi.fn()}
        minPrice={500}
        maxPrice={1500}
        minAvailablePrice={50}
        maxAvailablePrice={3500}
        onMinPriceChange={vi.fn()}
        onMaxPriceChange={vi.fn()}
        onlyDiscounted={true}
        onToggleDiscounted={vi.fn()}
        onlyWithVideo={false}
        onToggleWithVideo={vi.fn()}
        selectedEnergyClass="A+++"
        onSelectEnergyClass={vi.fn()}
        selectedMotorType="all"
        onSelectMotorType={vi.fn()}
        selectedColor="all"
        onSelectColor={vi.fn()}
        hasActiveFilters={true}
        onResetFilters={onResetFilters}
        theme={lightTheme}
        isDarkMode={false}
      />
    );

    const resetBtn = getByText('Sıfırla');
    expect(resetBtn).toBeDefined();
    fireEvent.click(resetBtn);
    expect(onResetFilters).toHaveBeenCalled();
  });

  it('renders brand checkboxes without border boxes and supports multiple brand logos in BrandCategoryFilter', () => {
    const onToggleBrand = vi.fn();
    const brands: Brand[] = [
      { id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'İtaliya', manufacturingCountries: [], logo: '/media/brands/ardo-logo.png', active: true },
      { id: 'lotus', name: 'LOTUS', slug: 'lotus', originCountry: 'İngiltərə', manufacturingCountries: [], logo: '/media/brands/lotus-logo.png', active: true },
    ];

    const { container, getAllByRole } = render(
      <CatalogSidebarFilter
        categories={DEFAULT_CATALOG.categories}
        brands={brands}
        selectedBrands={['ardo', 'lotus']}
        onToggleBrand={onToggleBrand}
        showBrandSection={true}
        activeProducts={DEFAULT_CATALOG.products}
        selectedCategory="all"
        onSelectCategory={vi.fn()}
        minPrice={null}
        maxPrice={null}
        minAvailablePrice={100}
        maxAvailablePrice={2000}
        onMinPriceChange={vi.fn()}
        onMaxPriceChange={vi.fn()}
        onlyDiscounted={false}
        onToggleDiscounted={vi.fn()}
        onlyWithVideo={false}
        onToggleWithVideo={vi.fn()}
        selectedEnergyClass="all"
        onSelectEnergyClass={vi.fn()}
        selectedMotorType="all"
        onSelectMotorType={vi.fn()}
        selectedColor="all"
        onSelectColor={vi.fn()}
        hasActiveFilters={false}
        onResetFilters={vi.fn()}
        theme={lightTheme}
        isDarkMode={false}
      />
    );

    const checkboxes = getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(2);
    checkboxes.forEach((cb) => {
      // Must not have an explicit 1px solid card box border
      expect(cb.style.border).toMatch(/none/);
    });
  });
});

