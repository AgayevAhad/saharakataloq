import { z } from 'zod';

/**
 * Sahara Electronics — PIM v2 Runtime Validation Schemas
 * Schema-first runtime validation for all domain entities at API, Admin, and Public boundaries.
 */

export const PublicationStatusEnum = z.enum([
  'draft',
  'in_review',
  'approved',
  'scheduled',
  'published',
  'archived',
  'rejected',
]);

export const BrandVerificationStatusEnum = z.enum([
  'candidate',
  'verified',
  'content_ready',
  'published',
  'legacy_unreviewed',
  'unverified',
  'active',
]);

export const MediaVerificationStatusEnum = z.enum([
  'exact_verified',
  'legacy_unverified',
  'needs_review',
]);

export const SpecNormalizationStatusEnum = z.enum(['valid', 'needs_review', 'raw_only']);

export const BrandSchema = z.object({
  id: z.string().min(1, 'Brend ID mütləqdir'),
  name: z.string().min(1, 'Brend adı mütləqdir'),
  slug: z.string().min(1, 'Slug mütləqdir'),
  originCountry: z.string().nullable().optional().default('İtaliya'),
  manufacturingCountries: z.array(z.string()).default([]),
  description: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  active: z.boolean().default(true),
  comingSoon: z.boolean().nullable().optional(),
  sortOrder: z.number().nullable().optional(),
  verificationStatus: BrandVerificationStatusEnum.default('candidate'),
  officialUrl: z.string().nullable().optional(),
});

export type BrandSchemaType = z.infer<typeof BrandSchema>;

export const BrandAliasSchema = z.object({
  id: z.string().min(1, 'Alias ID mütləqdir'),
  brandId: z.string().min(1, 'Brend ID mütləqdir'),
  alias: z.string().min(1, 'Alias mütləqdir'),
  normalizedAlias: z.string().min(1, 'Normallaşdırılmış alias mütləqdir'),
  locale: z.string().nullable().optional(),
});

export const BrandSourceSchema = z.object({
  id: z.string().min(1, 'Source ID mütləqdir'),
  brandId: z.string().min(1, 'Brend ID mütləqdir'),
  sourceUrl: z.string().min(1, 'Source URL mütləqdir'),
  sourceType: z.string().min(1, 'Source Type mütləqdir'),
  observedName: z.string().min(1, 'Müşahidə olunan ad mütləqdir'),
  checkedAt: z.string().min(1, 'Yoxlanma tarixi mütləqdir'),
  rightsNote: z.string().nullable().optional(),
  verificationStatus: BrandVerificationStatusEnum.default('candidate'),
});

export const CategorySchema = z.object({
  id: z.string().min(1, 'Kateqoriya ID mütləqdir'),
  name: z.string().min(1, 'Kateqoriya adı mütləqdir'),
  slug: z.string().min(1, 'Slug mütləqdir'),
  icon: z.string().nullable().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().default(0),
  parentId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export type CategorySchemaType = z.infer<typeof CategorySchema>;

export const SpecDefinitionSchema = z.object({
  id: z.string().min(1, 'Spec Definition ID mütləqdir'),
  key: z.string().min(1, 'Açar mütləqdir'),
  nameAz: z.string().min(1, 'Azərbaycan dilində ad mütləqdir'),
  dataType: z.enum(['text', 'number', 'boolean']).default('text'),
  unitFamily: z.string().nullable().optional(),
  filterable: z.boolean().default(false),
  comparable: z.boolean().default(true),
  required: z.boolean().default(false),
  sortOrder: z.number().default(0),
});

export const CategorySpecTemplateSchema = z.object({
  categoryId: z.string().min(1, 'Kateqoriya ID mütləqdir'),
  specDefinitionId: z.string().min(1, 'Spec Definition ID mütləqdir'),
  groupName: z.string().min(1, 'Qrup adı mütləqdir'),
  required: z.boolean().default(false),
  filterable: z.boolean().default(false),
  sortOrder: z.number().default(0),
});

export const MediaAssetSchema = z.object({
  id: z.string().min(1, 'Media ID mütləqdir'),
  type: z.enum(['image', 'video']).default('image'),
  url: z.string().default(''),
  alt: z.string().default(''),
  thumbnailUrl: z.string().nullable().optional(),
  originalName: z.string().nullable().optional(),
  poster: z.string().nullable().optional(),
  fitMode: z.string().nullable().optional(),
  objectPosition: z.string().nullable().optional(),
  sortOrder: z.number().nullable().optional(),
  isPrimary: z.boolean().nullable().optional(),
  videoPoster: z.string().nullable().optional(),
  isMuted: z.boolean().nullable().optional(),
  checksum: z.string().nullable().optional(),
  rightsStatus: z.string().nullable().optional(),
  verificationStatus: MediaVerificationStatusEnum.default('legacy_unverified'),
  exactMatchKey: z.string().nullable().optional(),
});

export type MediaAssetSchemaType = z.infer<typeof MediaAssetSchema>;

export const ProductSpecSchema = z.object({
  id: z.string().min(1, 'Spec ID mütləqdir'),
  name: z.string().default(''),
  value: z.string().default(''),
  group: z.string().default('Əsas'),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  sortOrder: z.number().nullable().optional(),
  rawName: z.string().nullable().optional(),
  rawValue: z.string().nullable().optional(),
  normalizedValueText: z.string().nullable().optional(),
  normalizedValueNumber: z.number().nullable().optional(),
  normalizedValueBoolean: z.boolean().nullable().optional(),
  unit: z.string().nullable().optional(),
  normalizationStatus: SpecNormalizationStatusEnum.default('raw_only'),
});

export type ProductSpecSchemaType = z.infer<typeof ProductSpecSchema>;

export const ProductVariantSchema = z.object({
  id: z.string().min(1, 'Variant ID mütləqdir'),
  sku: z.string().min(1, 'SKU mütləqdir'),
  title: z.string().min(1, 'Başlıq mütləqdir'),
  colorName: z.string().nullable().optional(),
  colorHex: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  oldPrice: z.number().nullable().optional(),
  stockStatus: z.enum(['in_stock', 'out_of_stock', 'preorder', 'on_demand']).default('in_stock'),
  inStockCount: z.number().nullable().optional(),
  primaryImage: z.string().nullable().optional(),
  modelCode: z.string().nullable().optional(),
  gtin: z.string().nullable().optional(),
  mpn: z.string().nullable().optional(),
  warrantyMonths: z.number().nullable().optional(),
  manufacturingCountry: z.string().nullable().optional(),
  status: z.string().default('active'),
});

export type ProductVariantSchemaType = z.infer<typeof ProductVariantSchema>;

export const ProductRevisionSchema = z.object({
  id: z.string().min(1, 'Reviziya ID mütləqdir'),
  productId: z.string().min(1, 'Məhsul ID mütləqdir'),
  version: z.number().min(1, 'Versiya nömrəsi mütləqdir'),
  payloadJson: z.string().min(1, 'Payload JSON mütləqdir'),
  diffJson: z.string().default('{}'),
  actorId: z.string().nullable().optional(),
  createdAt: z.string().min(1, 'Yaradılma tarixi mütləqdir'),
});

export const StoreLocationSchema = z.object({
  id: z.string().min(1, 'Mağaza ID mütləqdir'),
  title: z.string().min(1, 'Mağaza adı mütləqdir'),
  address: z.string().min(1, 'Ünvan mütləqdir'),
  phoneNumbers: z.array(z.string()).default([]),
  workingHours: z.string().default(''),
  mapUrl: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  locationNote: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export type StoreLocationSchemaType = z.infer<typeof StoreLocationSchema>;

export const ProductSchema = z.object({
  id: z.string().min(1, 'Məhsul ID mütləqdir'),
  code: z.string().min(1, 'Model kodu mütləqdir'),
  title: z.string().min(1, 'Məhsul adı mütləqdir'),
  category: z.string().min(1, 'Kateqoriya mütləqdir'),
  categoryName: z.string().default(''),
  image: z.string().default(''),
  imagePosition: z.string().nullable().optional(),
  imageFit: z.string().nullable().optional(),
  gallery: z.array(z.string()).default([]),
  isFeatured: z.boolean().nullable().optional(),
  isNew: z.boolean().nullable().optional(),
  badgeText: z.string().nullable().optional(),
  badgeColor: z.string().nullable().optional(),
  price: z.union([z.number(), z.string()]).nullable().optional(),
  oldPrice: z.union([z.number(), z.string()]).nullable().optional(),
  currency: z.string().default('AZN'),
  stockStatus: z.string().default('in_stock'),
  shortDesc: z.string().nullable().optional().default(''),
  description: z.string().nullable().optional(),
  specs: z.array(ProductSpecSchema).default([]),
  highlights: z.array(z.string()).default([]),
  brandId: z.string().nullable().optional(),
  media: z.array(MediaAssetSchema).default([]),
  manufacturingCountry: z.string().nullable().optional(),
  status: z.enum(['published', 'draft']).default('published'),
  publicationStatus: PublicationStatusEnum.default('published'),
  scheduledAt: z.string().nullable().optional(),
  completenessScore: z.number().min(0).max(100).default(100),
  version: z.number().default(1),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export type ProductSchemaType = z.infer<typeof ProductSchema>;

export const PimMigrationStatusEnumSchema = z.enum(['pending', 'applied', 'mismatch', 'failed']);

export const PimMigrationStatusResponseSchema = z.object({
  ok: z.boolean(),
  status: PimMigrationStatusEnumSchema,
  appliedAt: z.string().nullable(),
  version: z.number().nullable(),
  checksum: z.string().nullable(),
  publicDb: z.object({
    isVersionApplied: z.boolean(),
    missingTables: z.array(z.string()),
    missingColumns: z.array(z.string()),
  }),
  draftDb: z.object({
    isVersionApplied: z.boolean(),
    missingTables: z.array(z.string()),
    missingColumns: z.array(z.string()),
  }),
  liveApplyEnabled: z.boolean(),
  message: z.string(),
});

export type PimMigrationStatusResponseType = z.infer<typeof PimMigrationStatusResponseSchema>;

export const PimDryRunResponseSchema = z.object({
  ok: z.boolean(),
  plan: z.array(
    z.object({
      step: z.string(),
      description: z.string(),
    })
  ),
  report: z.object({
    mainDb: z.object({
      productCount: z.number(),
      specCount: z.number(),
      mediaCount: z.number(),
      publishedCount: z.number(),
    }),
    draftDb: z.object({
      productCount: z.number(),
      specCount: z.number(),
      mediaCount: z.number(),
      publishedCount: z.number(),
    }),
  }),
  dryRunToken: z.string(),
  tokenExpiresAt: z.string(),
  integrityCheck: z.string(),
});

export type PimDryRunResponseType = z.infer<typeof PimDryRunResponseSchema>;

export const UnassignedMediaResponseSchema = z.object({
  ok: z.boolean(),
  totalMediaScanned: z.number(),
  assignedCount: z.number(),
  unassignedCount: z.number(),
  unassignedFiles: z.array(z.string()),
  auditNotice: z.string(),
});

export type UnassignedMediaResponseType = z.infer<typeof UnassignedMediaResponseSchema>;

export const PostgresVerifyResponseSchema = z.object({
  status: z.literal('DEFERRED'),
  message: z.string(),
  sourceOfTruth: z.literal('SQLite (catalog.sqlite / catalog-draft.sqlite)'),
  productionCutover: z.literal('DEFERRED'),
  postgresAvailable: z.boolean(),
  tableStats: z.array(
    z.object({
      table: z.string(),
      rowCount: z.number(),
    })
  ),
  ddlPreview: z.string(),
  sqliteManifest: z.object({
    timestamp: z.string(),
    mainDbHash: z.string().nullable(),
    draftDbHash: z.string().nullable(),
  }),
});

export type PostgresVerifyResponseType = z.infer<typeof PostgresVerifyResponseSchema>;

export const ConflictResponseSchema = z.object({
  error: z.literal('PRODUCT_VERSION_CONFLICT'),
  message: z.string(),
  currentVersion: z.number(),
  currentEtag: z.string(),
  currentProduct: z.record(z.string(), z.any()),
});

export type ConflictResponseType = z.infer<typeof ConflictResponseSchema>;

export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
  };
}
