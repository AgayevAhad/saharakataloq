import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CatalogLocalSearch } from '../features/catalog/CatalogLocalSearch';
import { CatalogPage } from '../pages/CatalogPage';
import { lightTheme } from '../types/theme';
import { Brand, CatalogCategory, Product } from '../types/product';

const brands = [
  { id: 'ardo', slug: 'ardo', name: 'ARDO', active: true },
  { id: 'bosch', slug: 'bosch', name: 'Bosch', active: true },
] as Brand[];
const categories = [
  { id: 'washer', slug: 'washer', name: 'Paltaryuyanlar', active: true },
  { id: 'oven', slug: 'oven', name: 'Sobalar', active: true },
] as CatalogCategory[];
const products = [
  {
    id: 'ardo-1',
    code: 'AR-1',
    title: 'ARDO İnverter Paltaryuyan',
    brandId: 'ardo',
    category: 'washer',
    categoryName: 'Paltaryuyanlar',
    image: '',
    status: 'published',
    specs: [],
    highlights: [],
    shortDesc: '',
    price: 1000,
  },
  {
    id: 'bosch-1',
    code: 'BO-1',
    title: 'Bosch Elektrik Soba',
    brandId: 'bosch',
    category: 'oven',
    categoryName: 'Sobalar',
    image: '',
    status: 'published',
    specs: [],
    highlights: [],
    shortDesc: '',
    price: 1200,
  },
] as Product[];

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const SearchHarness = () => {
  const [query, setQuery] = useState('');
  return (
    <CatalogLocalSearch
      value={query}
      onChange={setQuery}
      products={products}
      categories={categories}
      brands={brands}
      theme={lightTheme}
    />
  );
};

describe('catalog local search', () => {
  it('suggests real products and persists selected query history without saving every keystroke', () => {
    render(<SearchHarness />);
    const input = screen.getByRole('searchbox', { name: 'Kataloq daxilində axtarış' });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'bosch' } });
    expect(screen.getByRole('option', { name: /Bosch Elektrik Soba/ })).toBeTruthy();
    expect(localStorage.getItem('sahara_catalog_search_history_v1')).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: /Bosch Elektrik Soba/ }));
    expect((input as HTMLInputElement).value).toBe('Bosch Elektrik Soba');
    expect(JSON.parse(localStorage.getItem('sahara_catalog_search_history_v1') || '[]')).toEqual([
      'Bosch Elektrik Soba',
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Kataloq axtarışını təmizlə' }));
    fireEvent.focus(input);
    expect(screen.getByRole('option', { name: /Bosch Elektrik Soba/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Axtarış tarixçəsini sil' }));
    expect(localStorage.getItem('sahara_catalog_search_history_v1')).toBeNull();
  });

  it('keeps catalog search independent from header state and restores all products on clear', () => {
    const onHeaderSearchChange = vi.fn();
    const { container } = render(
      <CatalogPage
        products={products}
        categories={categories}
        brands={brands}
        theme={lightTheme}
        themeMode="light"
        searchQuery=""
        onSearchChange={onHeaderSearchChange}
        onSelectProduct={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onShare={vi.fn()}
        onCopyLink={vi.fn()}
        onNavigate={vi.fn()}
      />
    );
    const input = screen.getByRole('searchbox', { name: 'Kataloq daxilində axtarış' });
    expect(container.querySelectorAll('[data-catalog-product-reveal]')).toHaveLength(2);
    fireEvent.change(input, { target: { value: 'Bosch' } });
    expect(container.querySelectorAll('[data-catalog-product-reveal]')).toHaveLength(1);
    expect(onHeaderSearchChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Kataloq axtarışını təmizlə' }));
    expect(container.querySelectorAll('[data-catalog-product-reveal]')).toHaveLength(2);
  });
});
