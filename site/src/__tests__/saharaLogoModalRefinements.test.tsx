// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { SaharaLogo } from '../components/SaharaLogo';
import { Header } from '../components/Header';
import { lightTheme } from '../types/theme';
import { DEFAULT_BRANDS, DEFAULT_CATEGORIES } from '../data/catalog';
import { TEST_PRODUCT } from './fixtures';

afterEach(cleanup);

describe('SaharaLogo and Header Logo Modal Refinements', () => {
  it('1. SaharaLogo modal opens, does NOT show "Kataloq Loqosu" pill, and closes cleanly', () => {
    render(<SaharaLogo enableModal={true} isDark={false} />);
    const logoTrigger = screen.getByTitle('Böyütmək üçün toxunun / klikləyin');
    expect(logoTrigger).toBeDefined();

    fireEvent.click(logoTrigger);

    // Modal title and subtitle should be present
    expect(screen.getByText('Sahara Electronics')).toBeDefined();
    expect(screen.getByText('Məişət Texnikası')).toBeDefined();
    expect(screen.queryByText(/İqlim Sistemləri/i)).toBeNull();

    // The blue "Kataloq Loqosu" tag must be completely absent
    expect(screen.queryByText('Kataloq Loqosu')).toBeNull();

    // Close using close button
    const closeBtn = screen.getByLabelText('Bağla');
    expect(closeBtn).toBeDefined();
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Sahara Electronics')).toBeNull();
  });

  it('2. SaharaLogo modal closes on backdrop click without propagation', () => {
    render(<SaharaLogo enableModal={true} isDark={true} />);
    const logoTrigger = screen.getByTitle('Böyütmək üçün toxunun / klikləyin');
    fireEvent.click(logoTrigger);

    const backdrop = document.querySelector('.modal-backdrop-anim') as HTMLElement;
    expect(backdrop).toBeDefined();

    fireEvent.click(backdrop);
    expect(screen.queryByText('Sahara Electronics')).toBeNull();
  });

  it('3. Header renders brand-lockup as a container without anchor redirection', () => {
    const { container } = render(
      <Header
        theme={lightTheme}
        isDarkMode={false}
        onToggleTheme={vi.fn()}
        selectedCategory="all"
        onSelectCategory={vi.fn()}
        selectedBrand="all"
        onSelectBrand={vi.fn()}
        brands={DEFAULT_BRANDS}
        categories={DEFAULT_CATEGORIES}
        products={[TEST_PRODUCT]}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenInverterInfo={vi.fn()}
        onOpenCatalogShare={vi.fn()}
        totalCount={1}
        filteredCount={1}
      />
    );

    const lockup = container.querySelector('.brand-lockup');
    expect(lockup).toBeDefined();
    // It should not be an <a> element with href="/"
    expect(lockup?.tagName.toLowerCase()).not.toBe('a');
    expect(lockup?.getAttribute('href')).toBeNull();
  });
});
