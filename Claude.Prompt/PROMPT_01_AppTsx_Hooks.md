# PROMPT 01 — `App.tsx` State-lərini Hook-lara Köçür

> **Tətbiq yeri:** `site/src/`  
> **Risk:** Orta — davranış dəyişmir, yalnız yenidən strukturlaşdırılır  
> **Ön şərt:** PROMPT_00 tamamlanmış olmalıdır  
> **Nəticə:** `App.tsx` 2029 sətirdən ~400 sətirə enər; 6 yeni hook faylı yaranır

---

## Kontekst

`site/src/App.tsx` hazırda **25 `useState`** çağırışı, **22 `isSiteMode/appMode`** şərti yoxlaması içərir. Bu faylın 2029 sətiri var. Bir komponent içərisindəki 25 state oxunması, dəyişdirilməsi demək olar ki, mümkün deyil. Aşağıdakı hook-lar çıxarılacaq; hər biri öz məntiqini `App.tsx`-dən alıb müstəqil fayla köçürəcək.

---

## Yaradılacaq fayllar

### `site/src/hooks/useTheme.ts`

Bu hook `themeMode`, `toggleTheme`, `activeTheme` məntiqini `App.tsx`-dən çıxarır.

```typescript
import { useCallback, useEffect, useMemo, useState } from 'react';
import { lightTheme, darkTheme, ThemeMode } from '../types/theme';
import { CatalogSettings } from '../types/product';

const THEME_KEY = 'sahara_theme_mode';

const getInitialThemeMode = (): ThemeMode => {
  const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
  if (saved === 'light' || saved === 'dark') return saved;
  return 'light';
};

export function useTheme(primaryColor?: string) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${themeMode}`);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', themeMode === 'dark' ? '#0d0f14' : '#f8fafc');
    }
  }, [themeMode]);

  const activeTheme = useMemo(() => {
    const base = themeMode === 'dark' ? darkTheme : lightTheme;
    if (primaryColor) return { ...base, primary: primaryColor };
    return base;
  }, [primaryColor, themeMode]);

  return { themeMode, toggleTheme, activeTheme };
}
```

---

### `site/src/hooks/useCompare.ts`

```typescript
import { useCallback, useMemo, useState } from 'react';
import { Product } from '../types/product';

const COMPARE_KEY = 'sahara_compare_items';

const getInitialCompare = (): string[] => {
  try {
    const saved = localStorage.getItem(COMPARE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export function useCompare(products: Product[]) {
  const [comparisonIds, setComparisonIds] = useState<string[]>(getInitialCompare);

  const addToCompare = useCallback((productId: string) => {
    setComparisonIds((prev) => {
      if (prev.includes(productId) || prev.length >= 4) return prev;
      const next = [...prev, productId];
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromCompare = useCallback((productId: string) => {
    setComparisonIds((prev) => {
      const next = prev.filter((id) => id !== productId);
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setComparisonIds([]);
    localStorage.removeItem(COMPARE_KEY);
  }, []);

  const comparisonProducts = useMemo(
    () => comparisonIds.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p)),
    [comparisonIds, products]
  );

  return { comparisonIds, comparisonProducts, addToCompare, removeFromCompare, clearCompare };
}
```

---

### `site/src/hooks/useFavorites.ts`

```typescript
import { useCallback, useState } from 'react';

const FAVORITES_KEY = 'sahara_favorite_items';

const getInitialFavorites = (): string[] => {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(getInitialFavorites);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (productId: string) => favorites.includes(productId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
```

---

### `site/src/hooks/useToast.ts`

```typescript
import { useCallback, useState } from 'react';

interface ToastState {
  message: string;
  visible: boolean;
}

export function useToast(durationMs = 2600) {
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });

  const showToast = useCallback(
    (message: string) => {
      setToast({ message, visible: true });
      window.setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), durationMs);
    },
    [durationMs]
  );

  return { toast, showToast };
}
```

---

### `site/src/hooks/useCatalog.ts`

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import { CatalogData, Product } from '../types/product';
import { catalogApi } from '../services/catalogApi';
import { DEFAULT_CATALOG, normalizeCatalog } from '../data/catalog';

interface UseCatalogOptions {
  onLoaded?: (products: Product[]) => void;
}

export function useCatalog({ onLoaded }: UseCatalogOptions = {}) {
  const [catalog, setCatalog] = useState<CatalogData>(DEFAULT_CATALOG);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      const startTime = Date.now();
      try {
        const raw = await catalogApi.getCatalog();
        const normalized = normalizeCatalog(raw);
        if (isMounted.current) {
          setCatalog(normalized);
          onLoaded?.(normalized.products);
          catalogApi.track('catalog_view');
        }
      } catch {
        const fallback = normalizeCatalog(DEFAULT_CATALOG);
        if (isMounted.current) {
          setCatalog(fallback);
          onLoaded?.(fallback.products);
        }
      } finally {
        const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
        const elapsed = Date.now() - startTime;
        const splashDelay = isTestEnv ? 0 : Math.max(300 - elapsed, 100);
        const shimmerHold = isTestEnv ? 0 : 800;

        setTimeout(() => {
          const splash = document.getElementById('app-splash-screen');
          if (splash) {
            splash.classList.add('splash-fade-out');
            setTimeout(() => splash.remove(), isTestEnv ? 0 : 800);
          }
        }, splashDelay);

        setTimeout(() => {
          if (isMounted.current) setIsLoading(false);
        }, splashDelay + shimmerHold);
      }
    };

    init();
    return () => { isMounted.current = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { catalog, setCatalog, isLoading };
}
```

---

### `site/src/hooks/useContact.ts`

```typescript
import { useCallback } from 'react';
import { Product, CatalogSettings } from '../types/product';
import { phoneHref, whatsappHref } from '../utils/contact';
import { catalogApi } from '../services/catalogApi';

interface UseContactOptions {
  settings: CatalogSettings;
  getProductUrl: (product: Product) => string;
  showToast: (msg: string) => void;
}

export function useContact({ settings, getProductUrl, showToast }: UseContactOptions) {
  const openWhatsApp = useCallback(
    (product?: Product | null) => {
      if (product) {
        const text = `Salam, Sahara Electronics! Bu məhsul haqqında məlumat almaq istəyirəm:\n\n📌 Model: ${product.code}\n🏷 Məhsul: ${product.title}\n\n🔗 ${getProductUrl(product)}`;
        const href = whatsappHref(settings.whatsappNumber, text);
        if (!href) return showToast('WhatsApp nömrəsi admin paneldə hələ əlavə edilməyib.');
        catalogApi.track('contact_whatsapp', product.id);
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        const href = whatsappHref(settings.whatsappNumber, 'Salam, Sahara Electronics! Saytınızdan yazıram.');
        if (!href) return showToast('WhatsApp nömrəsi admin paneldə hələ əlavə edilməyib.');
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    },
    [settings.whatsappNumber, getProductUrl, showToast]
  );

  const openCall = useCallback(
    (productOrPhone?: Product | string) => {
      const phone =
        typeof productOrPhone === 'string'
          ? productOrPhone
          : settings.phoneNumber || settings.phoneNumbers?.[0];
      const href = phoneHref(phone);
      if (!href) return showToast('Zəng nömrəsi admin paneldə hələ əlavə edilməyib.');
      if (typeof productOrPhone !== 'string' && productOrPhone) {
        catalogApi.track('contact_call', productOrPhone.id);
      }
      window.open(href, '_self');
    },
    [settings.phoneNumber, settings.phoneNumbers, showToast]
  );

  return { openWhatsApp, openCall };
}
```

---

## `App.tsx`-i Yenilə

Yuxarıdakı 6 hook yaradıldıqdan sonra `site/src/App.tsx` faylını bu hook-ları istifadə edəcək şəkildə yenilə:

1. `App.tsx`-in yuxarısındakı `useState` bloklarından hook-lara köçürülən state-ləri **sil**
2. Əvəzinə hook import-ları əlavə et:

```typescript
import { useTheme } from './hooks/useTheme';
import { useCompare } from './hooks/useCompare';
import { useFavorites } from './hooks/useFavorites';
import { useToast } from './hooks/useToast';
import { useCatalog } from './hooks/useCatalog';
import { useContact } from './hooks/useContact';
```

3. `App` funksiyasının əvvəlində hook-ları çağır:

```typescript
const { catalog, setCatalog, isLoading } = useCatalog({ onLoaded: parseDeepLink });
const { themeMode, toggleTheme, activeTheme } = useTheme(catalog.settings?.primaryColor);
const { toast, showToast } = useToast();
const { comparisonIds, comparisonProducts, addToCompare, removeFromCompare, clearCompare } = useCompare(catalog.products);
const { favorites, toggleFavorite, isFavorite } = useFavorites();
const { openWhatsApp, openCall } = useContact({ settings: catalog.settings, getProductUrl: productUrl, showToast });
```

4. `App.tsx`-də artıq mövcud olan köhnə `useState` çağırışlarını və inline funksiyaları hook-larla əvəz et — davranışı **dəyişmə**, yalnız köçür.

---

## Uğur Meyarı

- [ ] `site/src/hooks/` içərisində 6 yeni fayl yaranıb
- [ ] `App.tsx` 2029 sətirdən maksimum 1200 sətirə enib
- [ ] `npm run build` uğurla tamamlanır
- [ ] `npm test` bütün testlər keçir (heç bir test sınmır)
- [ ] Brauzer konsolunda yeni xəta yoxdur
