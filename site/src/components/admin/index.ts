// Barrel export for modular Admin components
export { AdminShell, AdminShell as CatalogAdmin } from './AdminShell';
export type { AdminShellProps, Tab } from './AdminShell';

// Sections
export { AnalyticsSection } from './sections/AnalyticsSection';
export type { AnalyticsSectionProps } from './sections/AnalyticsSection';

export { ProductsSection } from './sections/ProductsSection';
export type { ProductsSectionProps } from './sections/ProductsSection';

export { ProductEditor } from './sections/ProductEditor';
export type { ProductEditorProps } from './sections/ProductEditor';

export { BrandsSection } from './sections/BrandsSection';
export type { BrandsSectionProps } from './sections/BrandsSection';

export { CategoriesSection } from './sections/CategoriesSection';
export type { CategoriesSectionProps } from './sections/CategoriesSection';

export { MediaSection } from './sections/MediaSection';
export type { MediaSectionProps } from './sections/MediaSection';

export { SnapshotsSection } from './sections/SnapshotsSection';
export type { SnapshotsSectionProps } from './sections/SnapshotsSection';

export { LogsSection, LogManager } from './sections/LogsSection';
export type { LogsSectionProps, LogManagerProps } from './sections/LogsSection';

export {
  AppearanceManager,
  ArticleManager,
  ContactManager,
  SecurityManager,
} from './sections/SettingsSection';
export type {
  AppearanceManagerProps,
  ArticleManagerProps,
  ContactManagerProps,
  SecurityManagerProps,
} from './sections/SettingsSection';

// Utils & Helpers
export {
  isProductModified,
  slugify,
  newId,
  emptyProduct,
  getProductUniqueMediaUrls,
  getProductUniqueMediaCount,
  getProductVideoCount,
  getProductImageCount,
  PRESET_COLORS,
} from './utils/adminHelpers';
export type { CompletenessFilter } from './utils/adminHelpers';
