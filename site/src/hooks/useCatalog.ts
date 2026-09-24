import { useCallback, useEffect, useRef, useState } from 'react';
import { CatalogData, Product } from '../types/product';
import { catalogApi } from '../services/catalogApi';
import { DEFAULT_CATALOG, normalizeCatalog } from '../data/catalog';

interface UseCatalogOptions {
  initialCatalog?: CatalogData;
  isSsr?: boolean;
  onLoaded?: (products: Product[]) => void;
}

export function useCatalog(options: UseCatalogOptions = {}) {
  const { initialCatalog, isSsr = false, onLoaded } = options;

  const [catalog, setCatalog] = useState<CatalogData>(() =>
    initialCatalog ? normalizeCatalog(initialCatalog) : DEFAULT_CATALOG
  );
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(() =>
    initialCatalog ? false : !isSsr
  );

  const isMountedRef = useRef(true);

  const loadCatalog = useCallback(async () => {
    const startTime = Date.now();
    try {
      const publicCatalog = await catalogApi.getCatalog();
      const normalized = normalizeCatalog(publicCatalog);
      if (isMountedRef.current) {
        setCatalog(normalized);
        onLoaded?.(normalized.products);
        catalogApi.track('catalog_view');
      }
    } catch {
      const fallback = normalizeCatalog(DEFAULT_CATALOG);
      if (isMountedRef.current) {
        setCatalog(fallback);
        onLoaded?.(fallback.products);
      }
    } finally {
      const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
      const elapsed = Date.now() - startTime;
      const splashDismissDelay = isTestEnv ? 0 : Math.max(300 - elapsed, 100);

      setTimeout(() => {
        if (typeof document !== 'undefined') {
          if ((window as any)?.__hold_splash_for_test) return;
          const splash = document.getElementById('app-splash-screen');
          if (splash) {
            splash.classList.add('splash-fade-out');
            setTimeout(
              () => {
                splash.remove();
              },
              isTestEnv ? 0 : 500
            );
          }
        }
        if (isMountedRef.current) {
          setIsLoadingCatalog(false);
        }
      }, splashDismissDelay);
    }
  }, [onLoaded]);

  useEffect(() => {
    isMountedRef.current = true;
    loadCatalog();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadCatalog]);

  return {
    catalog,
    setCatalog,
    isLoadingCatalog,
    isLoading: isLoadingCatalog,
    reloadCatalog: loadCatalog,
  };
}
