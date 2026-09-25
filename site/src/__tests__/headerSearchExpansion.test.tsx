import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Header } from '../components/Header';
import { lightTheme } from '../types/theme';
import { DEFAULT_CATALOG } from '../data/catalog';

afterEach(() => {
  cleanup();
});

describe('Header Search Expansion in Catalog Mode', () => {
  const mockProps = {
    theme: lightTheme,
    isDarkMode: false,
    onToggleTheme: vi.fn(),
    selectedCategory: 'all' as any,
    onSelectCategory: vi.fn(),
    selectedBrand: 'all',
    onSelectBrand: vi.fn(),
    brands: DEFAULT_CATALOG.brands,
    categories: DEFAULT_CATALOG.categories,
    products: DEFAULT_CATALOG.products,
    settings: DEFAULT_CATALOG.settings,
    searchQuery: '',
    onSearchChange: vi.fn(),
    onOpenInverterInfo: vi.fn(),
    onOpenCatalogShare: vi.fn(),
    totalCount: DEFAULT_CATALOG.products.length,
    filteredCount: DEFAULT_CATALOG.products.length,
    favoritesCount: 2,
    cartCount: 3,
    onOpenFavorites: vi.fn(),
    onOpenCart: vi.fn(),
    currentView: 'catalog' as const,
  };

  it('initially does not render the expanded search wrap or backdrop', () => {
    const { container } = render(<Header {...mockProps} />);
    const expandedWrap = container.querySelector('.catalog-header-search-expand-wrap');
    const backdrop = container.querySelector('.header-search-clickaway');
    expect(expandedWrap).toBeNull();
    expect(backdrop).toBeNull();
  });

  it('expands search panel smoothly when search input is focused or clicked', () => {
    const { container } = render(<Header {...mockProps} />);
    const input = screen.getByLabelText('Məhsul axtarışı');

    fireEvent.focus(input);

    const expandedWrap = container.querySelector('.catalog-header-search-expand-wrap');
    const backdrop = container.querySelector('.header-search-clickaway');
    const header = container.querySelector('.catalog-header');

    expect(expandedWrap).toBeTruthy();
    expect(backdrop).toBeTruthy();
    expect(header?.classList.contains('has-search-expanded')).toBe(true);
    expect(screen.getByRole('dialog', { name: 'Ağıllı axtarış paneli' })).toBeTruthy();
  });

  it('closes expanded search panel when backdrop is clicked', () => {
    const { container } = render(<Header {...mockProps} />);
    const input = screen.getByLabelText('Məhsul axtarışı');

    fireEvent.focus(input);
    expect(container.querySelector('.catalog-header-search-expand-wrap')).toBeTruthy();

    const backdrop = container.querySelector('.header-search-clickaway') as HTMLElement;
    fireEvent.click(backdrop);

    expect(container.querySelector('.catalog-header-search-expand-wrap')).toBeNull();
    expect(container.querySelector('.header-search-clickaway')).toBeNull();
  });

  it('closes expanded search panel when Escape key is pressed', () => {
    const { container } = render(<Header {...mockProps} />);
    const input = screen.getByLabelText('Məhsul axtarışı');

    fireEvent.focus(input);
    expect(container.querySelector('.catalog-header-search-expand-wrap')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(container.querySelector('.catalog-header-search-expand-wrap')).toBeNull();
  });

  it('opens search panel when Ctrl+K / Cmd+K is pressed', () => {
    const { container } = render(<Header {...mockProps} />);
    expect(container.querySelector('.catalog-header-search-expand-wrap')).toBeNull();

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    expect(container.querySelector('.catalog-header-search-expand-wrap')).toBeTruthy();
  });
});
