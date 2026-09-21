import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCatalogPagination } from '../features/catalog/useCatalogPagination';

describe('useCatalogPagination', () => {
  it('reveals eight grid rows at a time and reacts to viewport columns', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1366 });
    const { result } = renderHook(() => useCatalogPagination({ resetKey: '' }));
    expect(result.current.visibleProductCount).toBe(24);
    act(() => result.current.showMore());
    expect(result.current.visibleProductCount).toBe(48);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 700 });
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.visibleProductCount).toBe(32);
  });

  it('uses row count in list mode and resets when filters change', () => {
    const { result, rerender } = renderHook(
      ({ category }) => useCatalogPagination({ resetKey: category }),
      { initialProps: { category: 'all' } }
    );
    act(() => result.current.setViewMode('list'));
    act(() => result.current.showMore());
    expect(result.current.visibleProductCount).toBe(16);
    rerender({ category: 'oven' });
    expect(result.current.visibleProductCount).toBe(8);
  });
});
