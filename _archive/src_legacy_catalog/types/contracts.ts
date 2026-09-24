/**
 * Sahara Electronics — Domain Contracts & Runtime Types
 * Defines the shared contracts across public frontend, admin PIM, API DTOs, and analytics.
 */

export type EntityId = string;

export type PublishStatus = 'draft' | 'published' | 'archived';

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
}

export interface ProductSpecContract {
  id: EntityId;
  name: string;
  value: string;
  group: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
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

export interface FeatureFlagsContract {
  enableCart: boolean;
  enableCheckout: boolean;
  enableSaharaMatch: boolean;
  enableOnlinePayment: boolean;
  enableInstallmentCalc: boolean;
  enableStoreReservation: boolean;
  enableLiveChat: boolean;
  enableVideoBanners: boolean;
  enableCompareDifferenceMode: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlagsContract = {
  enableCart: false,
  enableCheckout: false,
  enableSaharaMatch: true,
  enableOnlinePayment: false,
  enableInstallmentCalc: true,
  enableStoreReservation: true,
  enableLiveChat: true,
  enableVideoBanners: true,
  enableCompareDifferenceMode: true,
};
