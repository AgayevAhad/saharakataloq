import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Image as ImageIcon } from 'lucide-react';

export interface ShimmerImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  cropRect?: { x: number; y: number; w: number; h: number };
  fallback?: React.ReactNode;
  showSpinner?: boolean;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  spinnerSize?: number;
}

const globalLoadedImageUrls = new Set<string>();

export const ShimmerImage = React.forwardRef<HTMLImageElement, ShimmerImageProps>(
  (
    {
      src,
      alt,
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
    const [loadedSrc, setLoadedSrc] = useState<string | null>(() => {
      if (src && globalLoadedImageUrls.has(src)) return src;
      return null;
    });
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const isLoaded = loadedSrc === src;
    const hasError = failedSrc === src;
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
      if (!src) return;
      if (globalLoadedImageUrls.has(src)) {
        setLoadedSrc(src);
        return;
      }

      let isCancelled = false;
      const img = internalImgRef.current;
      if (!img) return;

      // If image is already complete with natural dimensions (cached)
      if (img.complete && img.naturalWidth > 0) {
        setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
        markLoaded(src);
        return;
      }

      if (img.decode) {
        img
          .decode()
          .then(() => {
            if (!isCancelled && (img.complete || img.naturalWidth > 0)) {
              setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
              markLoaded(src);
            }
          })
          .catch(() => {
            if (!isCancelled && img.complete && img.naturalWidth > 0) {
              setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
              markLoaded(src);
            }
          });
      }

      const onNativeLoad = () => {
        if (!isCancelled && img.naturalWidth > 0) {
          setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
          markLoaded(src);
        }
      };
      const onNativeError = () => {
        if (!isCancelled) setFailedSrc(src);
      };

      img.addEventListener('load', onNativeLoad);
      img.addEventListener('error', onNativeError);

      return () => {
        isCancelled = true;
        img.removeEventListener('load', onNativeLoad);
        img.removeEventListener('error', onNativeError);
      };
    }, [src]);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const img = e.currentTarget;
      if (img && img.naturalWidth > 0) {
        setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
      }
      markLoaded(src);
      if (onLoad) onLoad(e);
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setFailedSrc(src);
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

    if (!src || hasError) {
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

    const normalizedCropRect = cropRect
      ? {
          w: Math.max(0.001, Math.min(1, Number.isFinite(cropRect.w) ? cropRect.w : 1)),
          h: Math.max(0.001, Math.min(1, Number.isFinite(cropRect.h) ? cropRect.h : 1)),
          x: 0,
          y: 0,
        }
      : null;
    if (normalizedCropRect && cropRect) {
      normalizedCropRect.x = Math.max(
        0,
        Math.min(1 - normalizedCropRect.w, Number.isFinite(cropRect.x) ? cropRect.x : 0)
      );
      normalizedCropRect.y = Math.max(
        0,
        Math.min(1 - normalizedCropRect.h, Number.isFinite(cropRect.y) ? cropRect.y : 0)
      );
    }
    const hasCrop = Boolean(
      normalizedCropRect &&
      (normalizedCropRect.w < 0.999 ||
        normalizedCropRect.h < 0.999 ||
        normalizedCropRect.x > 0.001 ||
        normalizedCropRect.y > 0.001)
    );

    const natW = naturalDims?.w || 1;
    const natH = naturalDims?.h || 1;
    const cropW = (normalizedCropRect?.w || 1) * natW;
    const cropH = (normalizedCropRect?.h || 1) * natH;
    const cropAspect = cropW / (cropH || 1);

    const contAspect =
      containerDims && containerDims.w > 0 && containerDims.h > 0
        ? containerDims.w / containerDims.h
        : 1;
    const isWidthConstrained = cropAspect >= contAspect;

    return (
      <div
        ref={containerRef}
        className={`img-shimmer-container ${containerClassName}`}
        style={containerStyle}
      >
        {/* Shimmer Overlay with Wave + Rotating Spinner */}
        <div className={`img-shimmer-overlay ${isLoaded ? 'is-loaded' : ''}`} aria-hidden="true">
          {showSpinner && !isLoaded && (
            <div className="img-shimmer-spinner-wrap">
              <Loader2 size={spinnerSize} className="img-spin" />
            </div>
          )}
        </div>

        {hasCrop ? (
          <div
            className="crop-inner-viewport"
            style={{
              position: 'relative',
              width: isWidthConstrained ? '100%' : 'auto',
              height: isWidthConstrained ? 'auto' : '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              aspectRatio: `${cropAspect}`,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img
              ref={setRefs}
              src={src}
              alt={alt}
              loading={loading}
              decoding="async"
              onLoad={handleLoad}
              onError={handleError}
              className={`shimmer-img ${className}`}
              style={{
                ...style,
                position: 'absolute',
                width: `${(1 / normalizedCropRect!.w) * 100}%`,
                height: `${(1 / normalizedCropRect!.h) * 100}%`,
                left: `-${(normalizedCropRect!.x / normalizedCropRect!.w) * 100}%`,
                top: `-${(normalizedCropRect!.y / normalizedCropRect!.h) * 100}%`,
                maxWidth: 'none',
                maxHeight: 'none',
                objectFit: 'fill',
                opacity: style?.opacity ?? (isLoaded ? 1 : 0),
                transition: 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s ease',
              }}
              {...rest}
            />
          </div>
        ) : (
          <img
            ref={setRefs}
            src={src}
            alt={alt}
            loading={loading}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={`shimmer-img ${className}`}
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
