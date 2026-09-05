import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Image as ImageIcon } from 'lucide-react';

export interface ShimmerImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  fallback?: React.ReactNode;
  showSpinner?: boolean;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  spinnerSize?: number;
}

export const ShimmerImage: React.FC<ShimmerImageProps> = ({
  src,
  alt,
  objectFit = 'contain',
  objectPosition = 'center',
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
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);

    // If image is already cached and loaded by the browser
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    if (onError) onError(e);
  };

  if (!src || hasError) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className={`img-shimmer-container img-fallback-box ${containerClassName}`} style={containerStyle}>
        <ImageIcon size={Math.min(28, spinnerSize + 8)} className="fallback-icon" />
        <span>Şəkil yoxdur</span>
      </div>
    );
  }

  return (
    <div className={`img-shimmer-container ${containerClassName}`} style={containerStyle}>
      {/* Shimmer Overlay with Wave + Rotating Spinner */}
      <div
        className={`img-shimmer-overlay ${isLoaded ? 'is-loaded' : ''}`}
        aria-hidden="true"
      >
        {showSpinner && !isLoaded && (
          <div className="img-shimmer-spinner-wrap">
            <Loader2 size={spinnerSize} className="img-spin" />
          </div>
        )}
      </div>

      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`shimmer-img ${className}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          objectPosition,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s ease',
          ...style,
        }}
        {...rest}
      />
    </div>
  );
};
