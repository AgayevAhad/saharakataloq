import { useCallback, useState } from 'react';
import { Product } from '../types/product';

export const FAVORITES_KEY = 'sahara_favorite_items';

export const getInitialFavorites = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

interface UseFavoritesOptions {
  showToast?: (message: string, type?: 'success' | 'warning') => void;
}

export function useFavorites(options: UseFavoritesOptions = {}) {
  const { showToast } = options;
  const [favoriteIds, setFavoriteIds] = useState<string[]>(getInitialFavorites);

  const toggleFavorite = useCallback(
    (productOrId: Product | string) => {
      const id = typeof productOrId === 'string' ? productOrId : productOrId.id;
      setFavoriteIds((prev) => {
        const exists = prev.includes(id);
        const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
        try {
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
        } catch {}
        if (showToast) {
          showToast(exists ? 'Seçilmişlərdən çıxarıldı' : 'Seçilmişlərə əlavə edildi!');
        }
        return next;
      });
    },
    [showToast]
  );

  const clearFavorites = useCallback(() => {
    setFavoriteIds([]);
    try {
      localStorage.removeItem(FAVORITES_KEY);
    } catch {}
    if (showToast) {
      showToast('Bütün seçilmişlər silindi.');
    }
  }, [showToast]);

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.includes(productId),
    [favoriteIds]
  );

  return {
    favoriteIds,
    favorites: favoriteIds,
    setFavoriteIds,
    toggleFavorite,
    clearFavorites,
    isFavorite,
  };
}
