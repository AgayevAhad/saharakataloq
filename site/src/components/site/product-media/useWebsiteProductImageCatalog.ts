import { useEffect, useMemo, useState } from 'react';
import { CatalogData, Product, ProductMedia } from '../../../types/product';
import {
  isWebsiteProductImageEnhancementEnabled,
  WEBSITE_PRODUCT_IMAGE_MANIFEST_URL,
  WebsiteProductImageManifest,
  WebsiteProductImageMetadata,
} from './websiteProductImageManifest';

const TARGET_BRANDS = new Set(['ardo', 'artel', 'lotus']);

const normalizedPath = (value: string) => {
  if (!value) return '';
  try {
    const url = new URL(
      value,
      typeof window === 'undefined' ? 'http://localhost' : window.location.origin
    );
    return url.pathname;
  } catch {
    return value.split(/[?#]/, 1)[0];
  }
};

const approvedEntriesBySource = (manifest: WebsiteProductImageManifest | null) => {
  const result = new Map<string, WebsiteProductImageMetadata>();
  for (const entry of manifest?.entries || []) {
    if (
      entry.reviewStatus === 'approved' &&
      entry.processingSucceeded &&
      entry.originalPreserved &&
      entry.transparentImage &&
      TARGET_BRANDS.has(String(entry.brand || '').toLocaleLowerCase('az'))
    ) {
      result.set(normalizedPath(entry.sourceImage), entry);
    }
  }
  return result;
};

const enhanceMedia = (
  media: ProductMedia,
  entries: Map<string, WebsiteProductImageMetadata>,
  failedUrls: ReadonlySet<string>
): ProductMedia => {
  if (media.type !== 'image') return media;
  const sourcePath = normalizedPath(media.url);
  const entry = entries.get(sourcePath);
  const enhancedPath = normalizedPath(String(entry?.transparentImage || ''));
  if (!entry || !enhancedPath || failedUrls.has(enhancedPath)) return media;
  return {
    ...media,
    url: String(entry.transparentImage),
    originalUrl: media.originalUrl || media.url,
    cropRect: undefined,
    fitMode: 'contain',
    objectPosition: 'center',
  };
};

export const enhanceWebsiteProduct = (
  product: Product,
  entries: Map<string, WebsiteProductImageMetadata>,
  failedUrls: ReadonlySet<string> = new Set()
): Product => {
  const sourcePath = normalizedPath(product.image);
  const entry = entries.get(sourcePath);
  const enhancedPath = normalizedPath(String(entry?.transparentImage || ''));
  const isImageEnhanced = entry?.transparentImage && !failedUrls.has(enhancedPath);

  const resolve = (url: string) => {
    const e = entries.get(normalizedPath(url));
    const p = normalizedPath(String(e?.transparentImage || ''));
    return e?.transparentImage && !failedUrls.has(p)
      ? String(e.transparentImage)
      : url;
  };

  return {
    ...product,
    image: isImageEnhanced ? String(entry.transparentImage) : product.image,
    originalImage: product.originalImage || product.image,
    ...(isImageEnhanced && {
      cropRect: undefined,
      imageFit: 'contain',
      imagePosition: 'center',
    }),
    gallery: product.gallery?.map(resolve),
    images: product.images?.map(resolve),
    media: product.media?.map((item) => enhanceMedia(item, entries, failedUrls)),
  };
};

interface UseWebsiteProductImageCatalogOptions {
  enabled?: boolean;
}

export function useWebsiteProductImageCatalog(
  sourceCatalog: CatalogData,
  options: UseWebsiteProductImageCatalogOptions = {}
) {
  const enabled = options.enabled ?? isWebsiteProductImageEnhancementEnabled();
  const [manifest, setManifest] = useState<WebsiteProductImageManifest | null>(null);
  const [failedUrls, setFailedUrls] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    if (!enabled) {
      setManifest(null);
      return;
    }
    const controller = new AbortController();
    fetch(WEBSITE_PRODUCT_IMAGE_MANIFEST_URL, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
        return response.json();
      })
      .then((data: WebsiteProductImageManifest) => setManifest(data))
      .catch((error) => {
        if (error?.name !== 'AbortError') setManifest(null);
      });
    return () => controller.abort();
  }, [enabled]);

  const entries = useMemo(() => approvedEntriesBySource(manifest), [manifest]);
  const enhancedToOriginal = useMemo(() => {
    const mapping = new Map<string, string>();
    for (const [original, entry] of entries) {
      if (entry.transparentImage) {
        mapping.set(normalizedPath(entry.transparentImage), original);
      }
    }
    return mapping;
  }, [entries]);

  useEffect(() => {
    if (!enabled || enhancedToOriginal.size === 0 || typeof window === 'undefined') return;
    const handleImageError = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;
      const enhancedPath = normalizedPath(target.currentSrc || target.src);
      if (!enhancedToOriginal.has(enhancedPath)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setFailedUrls((current) => {
        if (current.has(enhancedPath)) return current;
        const next = new Set(current);
        next.add(enhancedPath);
        return next;
      });
    };
    window.addEventListener('error', handleImageError, true);
    return () => window.removeEventListener('error', handleImageError, true);
  }, [enabled, enhancedToOriginal]);

  const catalog = useMemo<CatalogData>(() => {
    if (!enabled || entries.size === 0) return sourceCatalog;
    return {
      ...sourceCatalog,
      products: sourceCatalog.products.map((product) =>
        enhanceWebsiteProduct(product, entries, failedUrls)
      ),
    };
  }, [enabled, entries, failedUrls, sourceCatalog]);

  return {
    catalog,
    approvedAssetCount: entries.size,
    failedAssetCount: failedUrls.size,
  };
}
