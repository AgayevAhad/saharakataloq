import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useTheme,
  useToast,
  useFavorites,
  useCompare,
  useCatalog,
  useContact,
  THEME_KEY,
  FAVORITES_KEY,
  COMPARE_KEY,
} from '../hooks';
import { catalogApi } from '../services/catalogApi';
import { DEFAULT_CATALOG } from '../data/catalog';
import type { Product, CatalogSettings } from '../types/product';

const mockProduct: Product = {
  id: 'prod-1',
  code: 'ARDO-501',
  title: 'ARDO Soba Test',
  category: 'soba',
  categoryName: 'Sobalar',
  image: '/media/ardo-soba.jpg',
  shortDesc: 'Test sobasi',
  price: 599,
  status: 'published',
  brandId: 'ardo',
  specs: [],
  highlights: [],
};

const mockProduct2: Product = {
  id: 'prod-2',
  code: 'LOTUS-102',
  title: 'Lotus Aspirator',
  category: 'aspirator',
  categoryName: 'Aspiratorlar',
  image: '/media/lotus-asp.jpg',
  shortDesc: 'Test aspirator',
  price: 299,
  status: 'published',
  brandId: 'lotus',
  specs: [],
  highlights: [],
};

describe('PROMPT 01 — App.tsx Custom Hooks Test Suite', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {}
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useTheme Hook', () => {
    it('initializes with default light theme and toggles to dark', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.themeMode).toBe('light');
      expect(result.current.activeTheme.primary).toBeDefined();

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.themeMode).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);

      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.themeMode).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('applies custom primaryColor override if supplied', () => {
      const { result } = renderHook(() => useTheme('#0055ff'));
      expect(result.current.activeTheme.primary).toBe('#0055ff');
    });
  });

  describe('useToast Hook', () => {
    it('shows toast with message and type, then hides', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useToast(1000));

      expect(result.current.toast.visible).toBe(false);

      act(() => {
        result.current.showToast('Əməliyyat uğurludur!', 'success');
      });

      expect(result.current.toast.visible).toBe(true);
      expect(result.current.toast.message).toBe('Əməliyyat uğurludur!');
      expect(result.current.toast.type).toBe('success');

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(result.current.toast.visible).toBe(false);
      vi.useRealTimers();
    });

    it('supports manual hideToast', () => {
      const { result } = renderHook(() => useToast());
      act(() => {
        result.current.showToast('Test message');
      });
      expect(result.current.toast.visible).toBe(true);

      act(() => {
        result.current.hideToast();
      });
      expect(result.current.toast.visible).toBe(false);
    });
  });

  describe('useFavorites Hook', () => {
    it('toggles favorites and notifies via showToast', () => {
      const showToast = vi.fn();
      const { result } = renderHook(() => useFavorites({ showToast }));

      expect(result.current.favoriteIds).toEqual([]);
      expect(result.current.isFavorite(mockProduct.id)).toBe(false);

      // Add
      act(() => {
        result.current.toggleFavorite(mockProduct);
      });

      expect(result.current.favoriteIds).toContain(mockProduct.id);
      expect(result.current.isFavorite(mockProduct.id)).toBe(true);
      expect(showToast).toHaveBeenCalledWith('Seçilmişlərə əlavə edildi!');

      // Remove
      act(() => {
        result.current.toggleFavorite(mockProduct.id);
      });

      expect(result.current.favoriteIds).not.toContain(mockProduct.id);
      expect(result.current.isFavorite(mockProduct.id)).toBe(false);
      expect(showToast).toHaveBeenCalledWith('Seçilmişlərdən çıxarıldı');
    });

    it('clears all favorites', () => {
      const showToast = vi.fn();
      const { result } = renderHook(() => useFavorites({ showToast }));

      act(() => {
        result.current.toggleFavorite(mockProduct);
        result.current.toggleFavorite(mockProduct2);
      });
      expect(result.current.favoriteIds.length).toBe(2);

      act(() => {
        result.current.clearFavorites();
      });
      expect(result.current.favoriteIds).toEqual([]);
      expect(showToast).toHaveBeenCalledWith('Bütün seçilmişlər silindi.');
    });
  });

  describe('useCompare Hook', () => {
    const products = [mockProduct, mockProduct2];

    it('adds and removes products from comparison and enforces max 4 limit', () => {
      const showToast = vi.fn();
      const { result } = renderHook(() => useCompare(products, { showToast }));

      expect(result.current.comparisonIds).toEqual([]);

      // Add 1st
      act(() => {
        result.current.toggleCompare(mockProduct);
      });
      expect(result.current.comparisonIds).toContain(mockProduct.id);
      expect(result.current.comparisonProducts).toEqual([mockProduct]);
      expect(showToast).toHaveBeenCalledWith(`${mockProduct.code} müqayisəyə əlavə edildi.`);

      // Remove
      act(() => {
        result.current.toggleCompare(mockProduct);
      });
      expect(result.current.comparisonIds).not.toContain(mockProduct.id);
      expect(showToast).toHaveBeenCalledWith(`${mockProduct.code} müqayisədən çıxarıldı.`);

      // Fill with 4 items
      const p3: Product = { ...mockProduct, id: 'p3', code: 'C-3' };
      const p4: Product = { ...mockProduct, id: 'p4', code: 'C-4' };
      const p5: Product = { ...mockProduct, id: 'p5', code: 'C-5' };
      const manyProds = [mockProduct, mockProduct2, p3, p4, p5];

      const { result: compareLimitResult } = renderHook(() =>
        useCompare(manyProds, { showToast })
      );

      act(() => {
        compareLimitResult.current.toggleCompare(mockProduct);
        compareLimitResult.current.toggleCompare(mockProduct2);
        compareLimitResult.current.toggleCompare(p3);
        compareLimitResult.current.toggleCompare(p4);
      });
      expect(compareLimitResult.current.comparisonIds.length).toBe(4);

      // Attempt 5th
      act(() => {
        compareLimitResult.current.toggleCompare(p5);
      });
      expect(compareLimitResult.current.comparisonIds.length).toBe(4);
      expect(showToast).toHaveBeenCalledWith(
        'Maksimum 4 məhsul müqayisə edilə bilər.',
        'warning'
      );
    });

    it('clears compare list', () => {
      const showToast = vi.fn();
      const { result } = renderHook(() => useCompare(products, { showToast }));

      act(() => {
        result.current.toggleCompare(mockProduct);
      });
      expect(result.current.comparisonIds.length).toBe(1);

      act(() => {
        result.current.clearCompare();
      });
      expect(result.current.comparisonIds).toEqual([]);
      expect(showToast).toHaveBeenCalledWith('Müqayisə siyahısı təmizləndi.');
    });
  });

  describe('useCatalog Hook', () => {
    it('loads catalog and calls onLoaded callback', async () => {
      const onLoaded = vi.fn();
      const getCatalogSpy = vi
        .spyOn(catalogApi, 'getCatalog')
        .mockResolvedValue(DEFAULT_CATALOG);
      const trackSpy = vi.spyOn(catalogApi, 'track').mockImplementation(() => {});

      const { result } = renderHook(() => useCatalog({ onLoaded }));

      await vi.waitFor(() => {
        expect(result.current.isLoadingCatalog).toBe(false);
      });

      expect(getCatalogSpy).toHaveBeenCalled();
      expect(trackSpy).toHaveBeenCalledWith('catalog_view');
      expect(onLoaded).toHaveBeenCalledWith(DEFAULT_CATALOG.products);
    });
  });

  describe('useContact Hook', () => {
    const settings: CatalogSettings = {
      phoneNumber: '+994501234567',
      whatsappNumber: '994501234567',
    };
    const showToast = vi.fn();
    const getProductUrl = (p: Product) => `https://sahara.az/product/${p.id}`;

    it('opens whatsapp with product info and tracks action', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const trackSpy = vi.spyOn(catalogApi, 'track').mockImplementation(() => {});

      const { result } = renderHook(() =>
        useContact({ settings, getProductUrl, showToast })
      );

      act(() => {
        result.current.openWhatsApp(mockProduct);
      });

      expect(trackSpy).toHaveBeenCalledWith('contact_whatsapp', mockProduct.id);
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/994501234567?text='),
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('opens call and tracks action', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const trackSpy = vi.spyOn(catalogApi, 'track').mockImplementation(() => {});

      const { result } = renderHook(() =>
        useContact({ settings, getProductUrl, showToast })
      );

      act(() => {
        result.current.openCall(mockProduct);
      });

      expect(trackSpy).toHaveBeenCalledWith('contact_call', mockProduct.id);
      expect(openSpy).toHaveBeenCalledWith('tel:+994501234567', '_self');
    });

    it('copies product link to clipboard', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
        writable: true,
      });

      const { result } = renderHook(() =>
        useContact({ settings, getProductUrl, showToast })
      );

      await act(async () => {
        await result.current.copyLink(mockProduct);
      });

      expect(writeText).toHaveBeenCalledWith('https://sahara.az/product/prod-1');
      expect(showToast).toHaveBeenCalledWith('Link kopyalandı!');
    });
  });
});
