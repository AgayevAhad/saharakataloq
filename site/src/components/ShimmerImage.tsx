import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { resolveThemeImage } from '../utils/themeImage';

export interface ShimmerImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  isDarkMode?: boolean;
  darkUrl?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  cropRect?: { x: number; y: number; w: number; h: number };
  fallback?: React.ReactNode;
  showSpinner?: boolean;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  spinnerSize?: number;
}

export interface NormalizedCropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CropFrameTransform {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const normalizeCropRect = (cropRect?: NormalizedCropRect): NormalizedCropRect | null => {
  if (!cropRect) return null;
  const w = Math.max(0.001, Math.min(1, Number.isFinite(cropRect.w) ? cropRect.w : 1));
  const h = Math.max(0.001, Math.min(1, Number.isFinite(cropRect.h) ? cropRect.h : 1));
  const x = Math.max(0, Math.min(1 - w, Number.isFinite(cropRect.x) ? cropRect.x : 0));
  const y = Math.max(0, Math.min(1 - h, Number.isFinite(cropRect.y) ? cropRect.y : 0));
  return { x, y, w, h };
};

/**
 * Maps a normalized source-image viewport into a fixed destination frame.
 * The destination frame never changes size. The selected source area covers
 * that frame without stretching the original image or leaving letterboxing.
 */
export const calculateCropFrameTransform = (
  cropRect: NormalizedCropRect,
  naturalWidth: number,
  naturalHeight: number,
  frameWidth: number,
  frameHeight: number,
  objectFit: string = 'contain'
): CropFrameTransform | null => {
  const normalized = normalizeCropRect(cropRect);
  if (
    !normalized ||
    naturalWidth <= 0 ||
    naturalHeight <= 0 ||
    frameWidth <= 0 ||
    frameHeight <= 0
  ) {
    return null;
  }

  const selectedWidth = normalized.w * naturalWidth;
  const selectedHeight = normalized.h * naturalHeight;
  
  let scale;
  if (objectFit === 'cover') {
    scale = Math.max(frameWidth / selectedWidth, frameHeight / selectedHeight);
  } else {
    scale = Math.min(frameWidth / selectedWidth, frameHeight / selectedHeight);
  }
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  const selectedCenterX = (normalized.x + normalized.w / 2) * naturalWidth * scale;
  const selectedCenterY = (normalized.y + normalized.h / 2) * naturalHeight * scale;

  return {
    left: frameWidth / 2 - selectedCenterX,
    top: frameHeight / 2 - selectedCenterY,
    width,
    height,
  };
};

const globalLoadedImageUrls = new Set<string>();

export const ShimmerImage = React.forwardRef<HTMLImageElement, ShimmerImageProps>(
  (
    {
      src,
      alt,
      isDarkMode,
      darkUrl,
      objectFit = 'contain',
      objectPosition = 'center',
      cropRect,
      fallback,
      showSpinner = true,
      containerClassName = '',
      containerStyle,
      spinnerSize = 22,
      className = '',
      style,
      loading = 'lazy',
      onLoad,
      onError,
      ...rest
    },
    ref
  ) => {
    const [domIsDark, setDomIsDark] = useState<boolean>(() => {
      if (typeof document === 'undefined') return false;
      return Boolean(
        document.documentElement.getAttribute('data-theme')?.startsWith('dark') ||
        document.body?.classList.contains('theme-dark')
      );
    });

    useEffect(() => {
      if (typeof document === 'undefined') return;
      const checkTheme = () => {
        const isDark = Boolean(
          document.documentElement.getAttribute('data-theme')?.startsWith('dark') ||
          document.body?.classList.contains('theme-dark')
        );
        setDomIsDark(isDark);
      };
      const observer = new MutationObserver(checkTheme);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
      if (document.body) {
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      }
      return () => observer.disconnect();
    }, []);

    const activeIsDark = Boolean(isDarkMode || domIsDark);
    const effectiveSrc = resolveThemeImage(src, activeIsDark, darkUrl);
    const isTransparentProduct = Boolean(
      effectiveSrc &&
      effectiveSrc.includes('/media/products/') &&
      !effectiveSrc.includes('_light.') &&
      !effectiveSrc.includes('_dark.')
    );

    const [loadedSrc, setLoadedSrc] = useState<string | null>(() => {
      if (effectiveSrc && globalLoadedImageUrls.has(effectiveSrc)) return effectiveSrc;
      return null;
    });
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const isLoaded = loadedSrc === effectiveSrc;
    const hasError = failedSrc === effectiveSrc;
    const internalImgRef = useRef<HTMLImageElement | null>(null);

    const [naturalDims, setNaturalDims] = useState<{ w: number; h: number } | null>(null);

    const markLoaded = (url: string) => {
      if (url) {
        globalLoadedImageUrls.add(url);
        setLoadedSrc(url);
      }
    };

    const setRefs = (node: HTMLImageElement | null) => {
      internalImgRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLImageElement | null>).current = node;
      }
    };

    useEffect(() => {
      if (!effectiveSrc) return;
      let isCancelled = false;
      const img = internalImgRef.current;
      if (!img) return;
      setNaturalDims(null);

      // If image is already complete with natural dimensions (cached)
      if (img.complete && img.naturalWidth > 0) {
        setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
        markLoaded(effectiveSrc);
        return;
      }

      if (globalLoadedImageUrls.has(effectiveSrc)) {
        setLoadedSrc(effectiveSrc);
      }

      if (img.decode) {
        img
          .decode()
          .then(() => {
            if (!isCancelled && (img.complete || img.naturalWidth > 0)) {
              setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
              markLoaded(effectiveSrc);
            }
          })
          .catch(() => {
            if (!isCancelled && img.complete && img.naturalWidth > 0) {
              setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
              markLoaded(effectiveSrc);
            }
          });
      }

      const onNativeLoad = () => {
        if (!isCancelled && img.naturalWidth > 0) {
          setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
          markLoaded(effectiveSrc);
        }
      };
      const onNativeError = () => {
        if (!isCancelled) setFailedSrc(effectiveSrc);
      };

      img.addEventListener('load', onNativeLoad);
      img.addEventListener('error', onNativeError);

      return () => {
        isCancelled = true;
        img.removeEventListener('load', onNativeLoad);
        img.removeEventListener('error', onNativeError);
      };
    }, [effectiveSrc]);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.currentTarget;
      if (img && img.naturalWidth > 0) {
        setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
      }
      markLoaded(effectiveSrc);
      if (onLoad) onLoad(e);
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setFailedSrc(effectiveSrc);
      if (onError) onError(e);
    };

    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerDims, setContainerDims] = useState<{ w: number; h: number } | null>(null);

    useEffect(() => {
      if (!containerRef.current) return;
      const updateDims = () => {
        if (containerRef.current) {
          const { clientWidth, clientHeight } = containerRef.current;
          if (clientWidth > 0 && clientHeight > 0) {
            setContainerDims({ w: clientWidth, h: clientHeight });
          }
        }
      };
      updateDims();
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => updateDims());
        ro.observe(containerRef.current);
        return () => ro.disconnect();
      }
    }, []);

    if (!effectiveSrc || hasError) {
      if (fallback) return <>{fallback}</>;
      return (
        <div
          ref={containerRef}
          className={`img-shimmer-container img-fallback-box ${containerClassName}`}
          style={containerStyle}
        >
          <ImageIcon size={Math.min(28, spinnerSize + 8)} className="fallback-icon" />
          <span>Şəkil yoxdur</span>
        </div>
      );
    }

    const normalizedCropRect = normalizeCropRect(cropRect);
    const hasCrop = Boolean(
      normalizedCropRect &&
      (normalizedCropRect.w < 0.999 ||
        normalizedCropRect.h < 0.999 ||
        normalizedCropRect.x > 0.001 ||
        normalizedCropRect.y > 0.001)
    );

    const cropTransform =
      hasCrop && normalizedCropRect && naturalDims && containerDims
        ? calculateCropFrameTransform(
            normalizedCropRect,
            naturalDims.w,
            naturalDims.h,
            containerDims.w,
            containerDims.h,
            objectFit
          )
        : null;
    const isVisuallyReady = isLoaded && (!hasCrop || Boolean(cropTransform));

    return (
      <div
        ref={containerRef}
        className={`img-shimmer-container ${containerClassName} ${isTransparentProduct ? 'has-transparent-product' : ''}`}
        style={containerStyle}
      >
        {/* Shimmer Overlay with Wave + Rotating Spinner */}
        <div
          className={`img-shimmer-overlay ${isVisuallyReady ? 'is-loaded' : ''}`}
          aria-hidden="true"
        >
          {showSpinner && !isVisuallyReady && (
            <div className="img-shimmer-spinner-wrap">
              <Loader2 size={spinnerSize} className="img-spin" />
            </div>
          )}
        </div>

        {hasCrop ? (
          <img
            ref={setRefs}
            src={effectiveSrc}
            alt={alt}
            loading={loading}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={`shimmer-img crop-framed-img ${isTransparentProduct ? 'is-transparent-product' : ''} ${className}`}
            data-crop-rect={normalizedCropRect ? JSON.stringify(normalizedCropRect) : undefined}
            style={{
              ...style,
              position: 'absolute',
              width: cropTransform ? `${cropTransform.width}px` : 'auto',
              height: cropTransform ? `${cropTransform.height}px` : 'auto',
              left: cropTransform ? `${cropTransform.left}px` : '50%',
              top: cropTransform ? `${cropTransform.top}px` : '50%',
              maxWidth: 'none',
              maxHeight: 'none',
              padding: 0,
              objectFit: 'fill',
              objectPosition: 'center',
              opacity: style?.opacity ?? (isVisuallyReady ? 1 : 0),
              transition: 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s ease',
            }}
            {...rest}
          />
        ) : (
          <img
            ref={setRefs}
            src={effectiveSrc}
            alt={alt}
            loading={loading}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={`shimmer-img ${isTransparentProduct ? 'is-transparent-product' : ''} ${className}`}
            style={{
              transition: 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s ease',
              width: style?.width || '100%',
              height: style?.height || '100%',
              objectFit,
              objectPosition,
              opacity: style?.opacity ?? (isLoaded ? 1 : 0),
              ...style,
            }}
            {...rest}
          />
        )}
      </div>
    );
  }
);

ShimmerImage.displayName = 'ShimmerImage';
