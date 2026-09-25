import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Header } from '../components/Header';
import { lightTheme } from '../types/theme';
import { DEFAULT_CATALOG } from '../data/catalog';

afterEach(() => {
  cleanup();
});

describe('Header Simple Search in Catalog Mode', () => {
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

  it('renders a simple and clean instant search input with result counter', () => {
    const { container } = render(<Header {...mockProps} />);
    const input = screen.getByLabelText('Məhsul axtarışı');
    expect(input).toBeTruthy();

    const searchBox = container.querySelector('.catalog-search');
    expect(searchBox).toBeTruthy();

    const resultCount = container.querySelector('.result-count');
    expect(resultCount?.textContent).toContain(String(DEFAULT_CATALOG.products.length));
  });

  it('triggers onSearchChange immediately when typing in the search bar', () => {
    const onSearchChange = vi.fn();
    render(<Header {...mockProps} onSearchChange={onSearchChange} />);
    const input = screen.getByLabelText('Məhsul axtarışı');

    fireEvent.change(input, { target: { value: 'SABAF' } });
    expect(onSearchChange).toHaveBeenCalledWith('SABAF');
  });

  it('shows clear button and clears search query when clicked', () => {
    const onSearchChange = vi.fn();
    render(<Header {...mockProps} searchQuery="ardo" onSearchChange={onSearchChange} />);

    const clearBtn = screen.getByLabelText('Axtarışı təmizlə');
    expect(clearBtn).toBeTruthy();

    fireEvent.click(clearBtn);
    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('toggles focus style on input focus and blur', () => {
    const { container } = render(<Header {...mockProps} />);
    const input = screen.getByLabelText('Məhsul axtarışı');
    const searchBox = container.querySelector('.catalog-search');

    fireEvent.focus(input);
    expect(searchBox?.classList.contains('is-focused')).toBe(true);

    fireEvent.blur(input);
    expect(searchBox?.classList.contains('is-focused')).toBe(false);
  });
});
