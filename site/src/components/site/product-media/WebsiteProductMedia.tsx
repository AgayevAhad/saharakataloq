import React, { useEffect, useMemo, useState } from 'react';
import { ShimmerImage } from '../../ShimmerImage';
import {
  ProductTone,
  selectWebsiteProductImage,
  WebsiteProductImageMetadata,
} from './websiteProductImageManifest';
import '../../../styles/components/website-product-media.css';

export interface WebsiteProductMediaProps {
  originalSrc: string;
  alt: string;
  metadata?: WebsiteProductImageMetadata | null;
  enhancedSrc?: string | null;
  productTone?: ProductTone;
  themeMode?: 'light' | 'dark';
  enabled?: boolean;
  allowUnreviewed?: boolean;
  objectFit?: 'contain' | 'cover';
  objectPosition?: string;
  loading?: 'eager' | 'lazy';
  className?: string;
  onLoad?: React.ImgHTMLAttributes<HTMLImageElement>['onLoad'];
  onError?: React.ImgHTMLAttributes<HTMLImageElement>['onError'];
}

export const WebsiteProductMedia: React.FC<WebsiteProductMediaProps> = ({
  originalSrc,
  alt,
  metadata,
  enhancedSrc,
  productTone,
  themeMode = 'light',
  enabled,
  allowUnreviewed = false,
  objectFit = 'contain',
  objectPosition = 'center',
  loading = 'lazy',
  className = '',
  onLoad,
  onError,
}) => {
  const resolvedMetadata = useMemo<WebsiteProductImageMetadata | null>(() => {
    if (!metadata && !enhancedSrc) return null;
    if (metadata && !enhancedSrc) return metadata;
    return {
      productId: metadata?.productId || 'website-product-media',
      modelCode: metadata?.modelCode || '',
      backgroundRemoved: metadata?.backgroundRemoved ?? true,
      alreadyTransparent: metadata?.alreadyTransparent,
      productTone: productTone || metadata?.productTone || 'medium',
      processingVersion: metadata?.processingVersion || 1,
      model: metadata?.model || 'provided',
      sourceImage: metadata?.sourceImage || originalSrc,
      transparentImage: enhancedSrc,
      originalPreserved: metadata?.originalPreserved ?? true,
      processingSucceeded: metadata?.processingSucceeded ?? true,
      reviewStatus: metadata?.reviewStatus || 'approved',
      quality: metadata?.quality,
    };
  }, [enhancedSrc, metadata, originalSrc, productTone]);

  const selection = useMemo(
    () =>
      selectWebsiteProductImage({
        originalSrc,
        metadata: resolvedMetadata,
        enabled,
        allowUnreviewed,
      }),
    [allowUnreviewed, enabled, originalSrc, resolvedMetadata]
  );
  const [activeSrc, setActiveSrc] = useState(selection.src);
  const [fellBackToOriginal, setFellBackToOriginal] = useState(false);

  useEffect(() => {
    setActiveSrc(selection.src);
    setFellBackToOriginal(false);
  }, [selection.src]);

  const handleError: React.ImgHTMLAttributes<HTMLImageElement>['onError'] = (event) => {
    if (selection.usesEnhancedImage && activeSrc !== originalSrc && originalSrc) {
      setActiveSrc(originalSrc);
      setFellBackToOriginal(true);
      return;
    }
    onError?.(event);
  };

  const tone = productTone || selection.tone;

  return (
    <div
      className={`site-product-media site-product-media--tone-${tone} site-product-media--theme-${themeMode} ${className}`.trim()}
      data-product-tone={tone}
      data-enhanced-image={selection.usesEnhancedImage && !fellBackToOriginal ? 'true' : 'false'}
      data-fallback-to-original={fellBackToOriginal ? 'true' : 'false'}
    >
      {activeSrc ? (
        <ShimmerImage
          src={activeSrc}
          alt={alt}
          loading={loading}
          objectFit={objectFit}
          objectPosition={objectPosition}
          containerClassName="site-product-media__image-shell"
          className="site-product-media__image"
          onLoad={onLoad}
          onError={handleError}
          fallback={<span className="site-product-media__fallback">Şəkil mövcud deyil</span>}
        />
      ) : (
        <span className="site-product-media__fallback">Şəkil mövcud deyil</span>
      )}
    </div>
  );
};
