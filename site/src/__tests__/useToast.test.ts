import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useToast } from '../hooks/useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('başlanğıcda toast görünmür', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toast.visible).toBe(false);
    expect(result.current.toast.message).toBe('');
  });

  it('showToast çağrıldıqda toast görünür', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast('Test mesajı');
    });
    expect(result.current.toast.visible).toBe(true);
    expect(result.current.toast.message).toBe('Test mesajı');
  });

  it('müəyyən vaxtdan sonra toast avtomatik gizlənir', () => {
    const { result } = renderHook(() => useToast(1000));
    act(() => {
      result.current.showToast('Test');
    });
    expect(result.current.toast.visible).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.toast.visible).toBe(false);
  });

  it('fərqli mesajla yenidən showToast çağrılırsa mesaj yenilənir', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast('Birinci');
    });
    act(() => {
      result.current.showToast('İkinci');
    });
    expect(result.current.toast.message).toBe('İkinci');
  });

  it('hideToast çağrıldıqda dərhal gizlənir', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.showToast('Mesaj');
    });
    expect(result.current.toast.visible).toBe(true);
    act(() => {
      result.current.hideToast();
    });
    expect(result.current.toast.visible).toBe(false);
  });
});
