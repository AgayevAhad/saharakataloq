import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useFavorites } from '../hooks/useFavorites';

describe('useFavorites', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('başlanğıcda boş siyahı qaytarır', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toHaveLength(0);
  });

  it('toggleFavorite məhsulu favorilərə əlavə edir', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.toggleFavorite('p1');
    });
    expect(result.current.favorites).toContain('p1');
  });

  it('toggleFavorite eyni məhsulu favorilərdən çıxarır (toggle)', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.toggleFavorite('p1');
    });
    act(() => {
      result.current.toggleFavorite('p1');
    });
    expect(result.current.favorites).not.toContain('p1');
  });

  it('isFavorite true qaytarır əlavə edilmiş məhsul üçün', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.toggleFavorite('p1');
    });
    expect(result.current.isFavorite('p1')).toBe(true);
  });

  it('isFavorite false qaytarır əlavə edilməmiş məhsul üçün', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.isFavorite('p99')).toBe(false);
  });

  it('favoritləri localStorage-da saxlayır', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.toggleFavorite('p1');
    });
    const saved = JSON.parse(localStorage.getItem('sahara_favorite_items') || '[]');
    expect(saved).toContain('p1');
  });

  it('başlanğıcda localStorage-dan oxuyur', () => {
    localStorage.setItem('sahara_favorite_items', JSON.stringify(['p3', 'p4']));
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual(['p3', 'p4']);
  });

  it('birdən çox məhsulu saxlayır', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.toggleFavorite('p1');
      result.current.toggleFavorite('p2');
      result.current.toggleFavorite('p3');
    });
    expect(result.current.favorites).toHaveLength(3);
  });
});
