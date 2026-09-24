import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCatalog } from '../hooks/useCatalog';
import { catalogApi } from '../services/catalogApi';
import { DEFAULT_CATALOG } from '../data/catalog';

const mockCatalogData = {
  ...DEFAULT_CATALOG,
  products: [
    {
      id: 'p1',
      code: 'TEST-100',
      title: 'Test Məhsul',
      brandId: 'ardo',
      category: 'paltaryuyan',
    } as any,
  ],
  brands: [
    {
      id: 'ardo',
      name: 'ARDO',
      slug: 'ardo',
    } as any,
  ],
};

describe('useCatalog', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('başlanğıcda initialCatalog verildikdə dərhal hazır olur', () => {
    const { result } = renderHook(() =>
      useCatalog({ initialCatalog: mockCatalogData, isSsr: false })
    );
    expect(result.current.isLoadingCatalog).toBe(false);
    expect(result.current.catalog.products.length).toBeGreaterThan(0);
  });

  it('catalogApi.getCatalog uğurla məlumatları yükləyir və onLoaded çağırır', async () => {
    const onLoaded = vi.fn();
    vi.spyOn(catalogApi, 'getCatalog').mockResolvedValueOnce(mockCatalogData);

    const { result } = renderHook(() =>
      useCatalog({ isSsr: false, onLoaded })
    );

    await waitFor(() => {
      expect(result.current.isLoadingCatalog).toBe(false);
    });

    expect(result.current.catalog.brands.length).toBeGreaterThan(0);
    expect(onLoaded).toHaveBeenCalledWith(expect.any(Array));
  });

  it('API xətası baş verdikdə fallback DEFAULT_CATALOG istifadə edir', async () => {
    vi.spyOn(catalogApi, 'getCatalog').mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() =>
      useCatalog({ isSsr: false })
    );

    await waitFor(() => {
      expect(result.current.isLoadingCatalog).toBe(false);
    });

    expect(result.current.catalog.products.length).toBe(DEFAULT_CATALOG.products.length);
  });

  it('setCatalog ilə kataloqu yeniləmək mümkündür', () => {
    const { result } = renderHook(() =>
      useCatalog({ initialCatalog: mockCatalogData })
    );
    const custom = { ...mockCatalogData, products: [] };
    act(() => {
      result.current.setCatalog(custom);
    });
    expect(result.current.catalog.products).toHaveLength(0);
  });
});
