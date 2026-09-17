/**
 * Sahara Electronics — Domain Contracts & Runtime Types
 * Defines the shared contracts across public frontend, admin PIM, API DTOs, and analytics.
 */

export type EntityId = string;

export type PublishStatus = 'draft' | 'published' | 'archived';

export type PublicationStatus =
  'draft' | 'in_review' | 'approved' | 'scheduled' | 'published' | 'archived' | 'rejected';

export type BrandVerificationStatus = 'candidate' | 'verified' | 'content_ready' | 'published';

export type MediaVerificationStatus = 'exact_verified' | 'legacy_unverified' | 'needs_review';

export type SpecNormalizationStatus = 'valid' | 'needs_review' | 'raw_only';

export interface LocalizedString {
  az: string;
  ru?: string;
  en?: string;
}

export interface BrandContract {
  id: EntityId;
  name: string;
  slug: string;
  originCountry: string;
  manufacturingCountries: string[];
  description?: string;
  logo?: string;
  active: boolean;
  comingSoon?: boolean;
  sortOrder?: number;
  verificationStatus?: BrandVerificationStatus;
  officialUrl?: string;
}

export interface BrandAliasContract {
  id: EntityId;
  brandId: EntityId;
  alias: string;
  normalizedAlias: string;
  locale?: string;
}

export interface BrandSourceContract {
  id: EntityId;
  brandId: EntityId;
  sourceUrl: string;
  sourceType: string;
  observedName: string;
  checkedAt: string;
  rightsNote?: string;
  verificationStatus: BrandVerificationStatus;
}

export interface CategoryContract {
  id: EntityId;
  name: string;
  slug: string;
  icon?: string;
  active: boolean;
  sortOrder: number;
  parentId?: EntityId | null;
  description?: string;
}

export interface CategoryTranslationContract {
  categoryId: EntityId;
  locale: string;
  name: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface SpecDefinitionContract {
  id: EntityId;
  key: string;
  nameAz: string;
  dataType: 'text' | 'number' | 'boolean';
  unitFamily?: string;
  filterable: boolean;
  comparable: boolean;
  required: boolean;
  sortOrder: number;
}

export interface CategorySpecTemplateContract {
  categoryId: EntityId;
  specDefinitionId: EntityId;
  groupName: string;
  required: boolean;
  filterable: boolean;
  sortOrder: number;
}

export interface MediaAssetContract {
  id: EntityId;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  alt: string;
  fitMode?: 'contain' | 'cover' | 'fill';
  objectPosition?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  videoPoster?: string;
  isMuted?: boolean;
  checksum?: string;
  originalName?: string;
  rightsStatus?: string;
  verificationStatus?: MediaVerificationStatus;
  exactMatchKey?: string;
}

export interface ProductSpecContract {
  id: EntityId;
  name: string;
  value: string;
  group: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  rawName?: string;
  rawValue?: string;
  normalizedValueText?: string;
  normalizedValueNumber?: number | null;
  normalizedValueBoolean?: boolean | null;
  unit?: string;
  normalizationStatus?: SpecNormalizationStatus;
}

export interface ProductVariantContract {
  id: EntityId;
  sku: string;
  title: string;
  colorName?: string;
  colorHex?: string;
  price?: number | null;
  oldPrice?: number | null;
  stockStatus: 'in_stock' | 'out_of_stock' | 'preorder' | 'on_demand';
  inStockCount?: number;
  primaryImage?: string;
  modelCode?: string;
  gtin?: string | null;
  mpn?: string | null;
  warrantyMonths?: number | null;
  manufacturingCountry?: string | null;
  status?: string;
}

export interface ProductRevisionContract {
  id: EntityId;
  productId: EntityId;
  version: number;
  payloadJson: string;
  diffJson: string;
  actorId?: string;
  createdAt: string;
}

export interface PublicationRevisionContract {
  id: EntityId;
  productId: EntityId;
  publicationStatus: PublicationStatus;
  scheduledAt?: string | null;
  completenessScore: number;
  actorId?: string;
  createdAt: string;
}

export interface ContentCompletenessReport {
  score: number;
  isPublishable: boolean;
  missingFields: string[];
  recommendations: string[];
}

export interface StoreLocationContract {
  id: EntityId;
  title: string;
  address: string;
  phoneNumbers: string[];
  workingHours: string;
  mapUrl?: string;
  latitude?: number;
  longitude?: number;
  locationNote?: string;
  isActive: boolean;
}

export interface BreadcrumbItemContract {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export interface ApiResponseContract<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface FeatureFlagsContract {
  enableCart: boolean;
  enableCheckout: boolean;
  enableSaharaMatch: boolean;
  enableCompare: boolean;
  enableFavorites: boolean;
  enableGuides: boolean;
  enableBrandDetail: boolean;
  enableOnlinePayment: boolean;
  enableInstallmentCalc: boolean;
  enableStoreReservation: boolean;
  enableLiveChat: boolean;
  enableVideoBanners: boolean;
  enableCompareDifferenceMode: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlagsContract = {
  enableCart: true,
  enableCheckout: false,
  enableSaharaMatch: false,
  enableCompare: false,
  enableFavorites: true,
  enableGuides: false,
  enableBrandDetail: false,
  enableOnlinePayment: false,
  enableInstallmentCalc: false,
  enableStoreReservation: false,
  enableLiveChat: false,
  enableVideoBanners: true,
  enableCompareDifferenceMode: false,
};

// ==========================================
// Runtime Type Guards
// ==========================================

export function isBrandContract(item: unknown): item is BrandContract {
  if (typeof item !== 'object' || item === null) return false;
  const b = item as Record<string, unknown>;
  return (
    typeof b.id === 'string' &&
    typeof b.name === 'string' &&
    typeof b.slug === 'string' &&
    typeof b.active === 'boolean'
  );
}

export function isCategoryContract(item: unknown): item is CategoryContract {
  if (typeof item !== 'object' || item === null) return false;
  const c = item as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.slug === 'string' &&
    typeof c.active === 'boolean'
  );
}

export function isMediaAssetContract(item: unknown): item is MediaAssetContract {
  if (typeof item !== 'object' || item === null) return false;
  const m = item as Record<string, unknown>;
  return (
    typeof m.id === 'string' &&
    (m.type === 'image' || m.type === 'video') &&
    typeof m.url === 'string'
  );
}

export function isStoreLocationContract(item: unknown): item is StoreLocationContract {
  if (typeof item !== 'object' || item === null) return false;
  const s = item as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.title === 'string' &&
    typeof s.address === 'string' &&
    Array.isArray(s.phoneNumbers)
  );
}
