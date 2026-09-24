import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCompare } from '../hooks/useCompare';
import type { Product } from '../types/product';

const makeProduct = (id: string): Product =>
  ({ id, code: id, title: `Məhsul ${id}`, brandId: 'test', category: 'test' } as Product);

const products = [
  makeProduct('p1'),
  makeProduct('p2'),
  makeProduct('p3'),
  makeProduct('p4'),
  makeProduct('p5'),
];

describe('useCompare', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('başlanğıcda boş siyahı qaytarır', () => {
    const { result } = renderHook(() => useCompare(products));
    expect(result.current.comparisonIds).toHaveLength(0);
  });

  it('addToCompare məhsul əlavə edir', () => {
    const { result } = renderHook(() => useCompare(products));
    act(() => {
      result.current.addToCompare('p1');
    });
    expect(result.current.comparisonIds).toContain('p1');
  });

  it('eyni məhsulu iki dəfə əlavə etmir', () => {
    const { result } = renderHook(() => useCompare(products));
    act(() => {
      result.current.addToCompare('p1');
      result.current.addToCompare('p1');
    });
    expect(result.current.comparisonIds).toHaveLength(1);
  });

  it('maksimum 4 məhsul müqayisəyə alınır', () => {
    const { result } = renderHook(() => useCompare(products));
    act(() => {
      result.current.addToCompare('p1');
      result.current.addToCompare('p2');
      result.current.addToCompare('p3');
      result.current.addToCompare('p4');
      result.current.addToCompare('p5'); // 5-ci əlavə edilməməlidir
    });
    expect(result.current.comparisonIds).toHaveLength(4);
    expect(result.current.comparisonIds).not.toContain('p5');
  });

  it('removeFromCompare məhsulu çıxarır', () => {
    const { result } = renderHook(() => useCompare(products));
    act(() => {
      result.current.addToCompare('p1');
      result.current.addToCompare('p2');
    });
    act(() => {
      result.current.removeFromCompare('p1');
    });
    expect(result.current.comparisonIds).not.toContain('p1');
    expect(result.current.comparisonIds).toContain('p2');
  });

  it('clearCompare bütün siyahını təmizləyir', () => {
    const { result } = renderHook(() => useCompare(products));
    act(() => {
      result.current.addToCompare('p1');
      result.current.addToCompare('p2');
    });
    act(() => {
      result.current.clearCompare();
    });
    expect(result.current.comparisonIds).toHaveLength(0);
  });

  it('comparisonProducts ID-lərə görə Product obyektlərini qaytarır', () => {
    const { result } = renderHook(() => useCompare(products));
    act(() => {
      result.current.addToCompare('p1');
    });
    expect(result.current.comparisonProducts).toHaveLength(1);
    expect(result.current.comparisonProducts[0].id).toBe('p1');
  });

  it('siyahını localStorage-da saxlayır', () => {
    const { result } = renderHook(() => useCompare(products));
    act(() => {
      result.current.addToCompare('p1');
    });
    const saved = JSON.parse(localStorage.getItem('sahara_compare_items') || '[]');
    expect(saved).toContain('p1');
  });

  it('başlanğıcda localStorage-dan oxuyur', () => {
    localStorage.setItem('sahara_compare_items', JSON.stringify(['p2', 'p3']));
    const { result } = renderHook(() => useCompare(products));
    expect(result.current.comparisonIds).toEqual(['p2', 'p3']);
  });
});
