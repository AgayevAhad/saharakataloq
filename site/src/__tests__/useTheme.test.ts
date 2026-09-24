import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTheme } from '../hooks/useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.className = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('başlanğıcda light tema qaytarır (localStorage boş)', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.themeMode).toBe('light');
  });

  it('localStorage-dakı tema dəyərini oxuyur', () => {
    localStorage.setItem('sahara_theme_mode', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.themeMode).toBe('dark');
  });

  it('toggleTheme light-dan dark-a keçirir', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.themeMode).toBe('dark');
  });

  it('toggleTheme dark-dan light-a keçirir', () => {
    localStorage.setItem('sahara_theme_mode', 'dark');
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.themeMode).toBe('light');
  });

  it('toggleTheme nəticəsini localStorage-da saxlayır', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme();
    });
    expect(localStorage.getItem('sahara_theme_mode')).toBe('dark');
  });

  it('data-theme atributunu DOM-da yeniləyir', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme();
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('primaryColor verilsə activeTheme.primary dəyişir', () => {
    const { result } = renderHook(() => useTheme('#ff0000'));
    expect(result.current.activeTheme.primary).toBe('#ff0000');
  });

  it('activeTheme obyekti qaytarır', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.activeTheme).toBeDefined();
    expect(typeof result.current.activeTheme).toBe('object');
  });
});
