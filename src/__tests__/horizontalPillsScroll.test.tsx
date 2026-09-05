// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, renderHook, act } from '@testing-library/react';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';
import { Header } from '../components/Header';
import { DEFAULT_CATALOG, DEFAULT_SETTINGS } from '../data/catalog';
import { lightTheme } from '../types/theme';

describe('Universal Horizontal Pill/Chip Touch & Drag Scrolling Suite', () => {
  it('useHorizontalScroll initializes correctly and provides drag props', () => {
    const { result } = renderHook(() => useHorizontalScroll());

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.dragProps).toBeDefined();
    expect(typeof result.current.dragProps.onMouseDown).toBe('function');
    expect(typeof result.current.dragProps.onMouseMove).toBe('function');
    expect(typeof result.current.dragProps.onMouseUp).toBe('function');
    expect(typeof result.current.dragProps.onMouseLeave).toBe('function');
    expect(typeof result.current.scrollItemIntoView).toBe('function');
  });

  it('scrollItemIntoView triggers smooth scrollTo on the container', () => {
    const { result } = renderHook(() => useHorizontalScroll());

    const fakeContainer = document.createElement('div');
    const scrollToMock = vi.fn();
    fakeContainer.scrollTo = scrollToMock;
    Object.defineProperty(fakeContainer, 'clientWidth', { value: 400 });

    (result.current.containerRef as any).current = fakeContainer;

    const fakePill = document.createElement('button');
    Object.defineProperty(fakePill, 'offsetLeft', { value: 600 });
    Object.defineProperty(fakePill, 'clientWidth', { value: 100 });

    act(() => {
      result.current.scrollItemIntoView(fakePill);
    });

    // targetScrollLeft = 600 - (400/2) + (100/2) = 600 - 200 + 50 = 450
    expect(scrollToMock).toHaveBeenCalledWith({
      left: 450,
      behavior: 'smooth',
    });
  });

  it('Header category filter row auto-scrolls clicked pill into center view', () => {
    const onSelectCategory = vi.fn();
    const scrollToMock = vi.fn();

    const { container } = render(
      <Header
        theme={lightTheme}
        isDarkMode={false}
        onToggleTheme={vi.fn()}
        selectedCategory="all"
        onSelectCategory={onSelectCategory}
        selectedBrand="all"
        onSelectBrand={vi.fn()}
        brands={DEFAULT_CATALOG.brands}
        categories={DEFAULT_CATALOG.categories}
        products={DEFAULT_CATALOG.products}
        settings={DEFAULT_SETTINGS}
        searchQuery=""
        onSearchChange={vi.fn()}
        onOpenInverterInfo={vi.fn()}
        onOpenCatalogShare={vi.fn()}
        totalCount={DEFAULT_CATALOG.products.length}
        filteredCount={DEFAULT_CATALOG.products.length}
      />
    );

    const filterRow = container.querySelector('.category-filter-row') as HTMLDivElement;
    expect(filterRow).toBeTruthy();
    filterRow.scrollTo = scrollToMock;

    const pills = container.querySelectorAll('.filter-pill');
    expect(pills.length).toBeGreaterThan(1);

    fireEvent.click(pills[1]);

    expect(onSelectCategory).toHaveBeenCalled();
  });
});
