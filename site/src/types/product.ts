export type ProductCategory = string;

export interface Brand {
  id: string;
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

export interface CatalogCategory {
  count?: number;
  id: string;
  name: string;
  slug: string;
  icon?: string;
  active: boolean;
  sortOrder?: number;
}

export interface ProductMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  alt?: string;
  originalName?: string;
  poster?: string;
  objectPosition?:
    | 'center'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | string;
  fitMode?: 'contain' | 'cover';
}

export interface ProductSpecItem {
  id: string;
  name: string;
  value: string;
  description?: string;
  icon?: string;
  group?: 'Əsas' | 'Funksiyalar' | 'Təhlükəsizlik' | 'Ölçü və Enerji' | 'Dizayn və Material';
}

export interface Product {
  id: string;
  code: string;
  title: string;
  category: ProductCategory;
  categoryName: string;
  image: string;
  imagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | string;
  imageFit?: 'contain' | 'cover';
  gallery?: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isPopular?: boolean;
  badgeText?: string;
  badgeColor?: 'red' | 'green' | 'amber' | 'blue' | 'purple';
  price?: number;
  oldPrice?: number;
  currency?: string;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'preorder';
  shortDesc: string;
  description?: string;
  specs: ProductSpecItem[];
  highlights: string[];
  brandId?: string;
  media?: ProductMedia[];
  manufacturingCountry?: string;
  status?: 'published' | 'draft';
  version?: number;
  publication_status?: 'published' | 'draft' | 'scheduled';
  completeness_score?: number;
  createdAt?: string;
  updatedAt?: string;

  // Compatibility aliases
  brandName?: string;
  modelCode?: string;
  images?: string[];
  videoUrl?: string;
  specifications?: Record<string, string>;
  energyClass?: string;
  motorType?: string;
}

export interface TechnologyAdvantage {
  title: string;
  desc: string;
}

export interface TechnologyArticle {
  id: string;
  title: string;
  subtitle: string;
  icon?: string;
  badge?: string;
  advantages: TechnologyAdvantage[];
  active?: boolean;
}

export interface StoreAddress {
  id: string;
  title: string;
  address: string;
  mapUrl?: string;
  phone?: string;
  workingHours?: string;
  note?: string;
}

export interface CatalogSettings {
  whatsappNumber: string;
  phoneNumber: string;
  contactPhone?: string;
  phoneNumbers?: string[];
  companyName?: string;
  address?: string;
  addresses?: StoreAddress[];
  email?: string;
  workingHours?: string;
  mapUrl?: string;
  locationNote?: string;
  countries?: string[];
  instagramUsername?: string;
  instagramUrl?: string;
  facebookUsername?: string;
  facebookUrl?: string;

  // Universal Customization & Styling
  siteTitle?: string;
  siteSubtitle?: string;
  headerCaption?: string;
  catalogHeading?: string;
  catalogSubheading?: string;
  heroBannerTitle?: string;
  heroBannerSubtitle?: string;
  footerAbout?: string;
  footerCopyright?: string;
  primaryColor?: string;
  fontFamily?: string;
  whatsappButtonText?: string;
  callButtonText?: string;
  shareButtonText?: string;
  scrollTopButtonText?: string;
  catalogActive?: boolean;
  maintenanceMessage?: string;
}

export interface BrandRailSettings {
  id: string;
  enabled: boolean;
  title: string;
  animationEnabled: boolean;
  speedSeconds: number;
  direction: 'left' | 'right';
  pauseOnHover: boolean;
  edgeFade: boolean;
  cardSize: 'sm' | 'md' | 'lg';
  sectionOrder: number;
  themeVariant: 'neutral' | 'accent' | 'contrast';
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandRailItem {
  id: string;
  brandId: string;
  brandName: string;
  brandSlug: string;
  brandLogo: string;
  originCountry?: string;
  enabled: boolean;
  sortOrder: number;
  optionalDisplayLabel?: string | null;
  linkEnabled: boolean;
  publishedProductCount: number;
  hasPublishedProducts: boolean;
}

export interface BrandRailData {
  enabled: boolean;
  settings: BrandRailSettings | null;
  items: BrandRailItem[];
}

export interface CatalogData {
  brands: Brand[];
  categories: CatalogCategory[];
  products: Product[];
  settings: CatalogSettings;
  countries?: string[];
  articles?: TechnologyArticle[];
  brandRail?: BrandRailData;
  updatedAt?: string;
}

export interface ContactActionTotals {
  whatsapp: number;
  call: number;
}

export interface CatalogAnalytics {
  catalogViews: number;
  productViews: Record<string, number>;
  contactActions: ContactActionTotals;
  contactActionsByProduct: Record<string, ContactActionTotals>;
  lastViewedAt?: string;
  range?: string;
  fromDate?: string | null;
  toDate?: string | null;
}

export type AnalyticsRange =
  'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_30_days' | 'custom';

export interface AuditLog {
  id: number;
  category:
    | 'auth'
    | 'product'
    | 'category_brand'
    | 'settings'
    | 'catalog_status'
    | 'import_export'
    | 'system';
  action: string;
  title: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: 'info' | 'success' | 'warning' | 'danger';
  createdAt: string;
}
