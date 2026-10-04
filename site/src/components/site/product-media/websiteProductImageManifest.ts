export type ProductTone = 'light' | 'medium' | 'dark';
export type ImageReviewStatus = 'needs_review' | 'approved' | 'rejected' | 'failed';

export interface WebsiteProductImageMetadata {
  assetId?: string;
  productId: string;
  brand?: string | null;
  modelCode: string;
  label?: string;
  backgroundRemoved: boolean;
  alreadyTransparent?: boolean;
  productTone: ProductTone;
  processingVersion: number;
  model: string;
  sourceImage: string;
  transparentImage?: string | null;
  comparisonImage?: string | null;
  originalPreserved: boolean;
  processingSucceeded: boolean;
  reviewStatus: ImageReviewStatus;
  quality?: {
    autoQualityPass?: boolean;
    qualityWarnings?: string[];
  };
}

export interface WebsiteProductImageManifest {
  schemaVersion: number;
  processingVersion: number;
  testMode: boolean;
  model: string;
  generatedAt: string;
  entryCount: number;
  successCount: number;
  failureCount: number;
  entries: WebsiteProductImageMetadata[];
}

export const WEBSITE_PRODUCT_IMAGE_MANIFEST_URL =
  '/media/site-product-image-enhancement/manifest.json';

export const WEBSITE_PRODUCT_IMAGE_PREVIEW_MANIFEST_URL =
  '/media-test/product-image-enhancement/manifest.json';

export const isWebsiteProductImageEnhancementEnabled = () =>
  import.meta.env.VITE_ENABLE_SITE_PRODUCT_IMAGE_ENHANCEMENT !== 'false';

interface SelectImageOptions {
  originalSrc: string;
  metadata?: WebsiteProductImageMetadata | null;
  enabled?: boolean;
  allowUnreviewed?: boolean;
}

export interface WebsiteProductImageSelection {
  src: string;
  originalSrc: string;
  tone: ProductTone;
  usesEnhancedImage: boolean;
}

export function selectWebsiteProductImage({
  originalSrc,
  metadata,
  enabled = isWebsiteProductImageEnhancementEnabled(),
  allowUnreviewed = false,
}: SelectImageOptions): WebsiteProductImageSelection {
  const reviewAllowsUse =
    metadata?.reviewStatus === 'approved' ||
    (allowUnreviewed && metadata?.reviewStatus === 'needs_review');
  const canUseEnhanced = Boolean(
    enabled &&
    metadata?.processingSucceeded &&
    metadata.originalPreserved &&
    metadata.transparentImage &&
    reviewAllowsUse
  );

  return {
    src: canUseEnhanced ? String(metadata?.transparentImage) : originalSrc,
    originalSrc,
    tone: metadata?.productTone || 'medium',
    usesEnhancedImage: canUseEnhanced,
  };
}
