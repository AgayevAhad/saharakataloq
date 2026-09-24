import { useCallback, useMemo, useState } from 'react';
import { Product } from '../types/product';

export const COMPARE_KEY = 'sahara_compare_items';

export const getInitialCompare = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(COMPARE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

interface UseCompareOptions {
  showToast?: (message: string, type?: 'success' | 'warning') => void;
}

export function useCompare(products: Product[] = [], options: UseCompareOptions = {}) {
  const { showToast } = options;
  const [comparisonIds, setComparisonIds] = useState<string[]>(getInitialCompare);

  const toggleCompare = useCallback(
    (product: Product) => {
      setComparisonIds((prev) => {
        let next: string[];
        if (prev.includes(product.id)) {
          next = prev.filter((id) => id !== product.id);
          if (showToast) showToast(`${product.code} müqayisədən çıxarıldı.`);
        } else {
          if (prev.length >= 4) {
            if (showToast) showToast('Maksimum 4 məhsul müqayisə edilə bilər.', 'warning');
            return prev;
          }
          next = [...prev, product.id];
          if (showToast) showToast(`${product.code} müqayisəyə əlavə edildi.`);
        }
        try {
          localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [showToast]
  );

  const addToCompare = useCallback(
    (productId: string) => {
      setComparisonIds((prev) => {
        if (prev.includes(productId) || prev.length >= 4) return prev;
        const next = [...prev, productId];
        try {
          localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const removeFromCompare = useCallback((productId: string) => {
    setComparisonIds((prev) => {
      const next = prev.filter((id) => id !== productId);
      try {
        localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setComparisonIds([]);
    try {
      localStorage.removeItem(COMPARE_KEY);
    } catch {}
    if (showToast) showToast('Müqayisə siyahısı təmizləndi.');
  }, [showToast]);

  const comparisonProducts = useMemo(() => {
    return comparisonIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [comparisonIds, products]);

  return {
    comparisonIds,
    setComparisonIds,
    comparisonProducts,
    toggleCompare,
    addToCompare,
    removeFromCompare,
    clearCompare,
  };
}
