import { z } from 'zod';

export const BrandVerificationStatusEnumSchema = z.enum([
  'candidate',
  'verified',
  'content_ready',
  'published',
  'legacy_unreviewed',
  'rejected',
  'archived',
]);

export const LogoRightsStatusEnumSchema = z.enum([
  'unreviewed',
  'pending',
  'approved',
  'rejected',
]);

export const BrandSourceTypeEnumSchema = z.enum([
  'official_website',
  'retailer_catalog',
  'distributor',
  'trademark_registry',
  'other',
]);

export const BrandSourceVerificationStatusEnumSchema = z.enum([
  'candidate',
  'pending',
  'verified',
  'rejected',
]);

export const BrandCandidateCreateSchema = z.object({
  name: z.string().min(1, 'Brend adı mütləqdir').max(100),
  slug: z.string().max(100).optional(),
  originCountry: z.string().max(100).optional().nullable(),
  sourceUrl: z.string().max(500).optional().nullable(),
  observedName: z.string().max(100).optional().nullable(),
});

export const BrandCandidateBatchSchema = z.object({
  candidates: z.array(BrandCandidateCreateSchema).min(1, 'Ən azı 1 namizəd tələb olunur'),
});

export const BrandSourceCreateSchema = z.object({
  sourceUrl: z.string().url('Təhlükəsiz HTTPS URL tələb olunur').max(500),
  sourceType: BrandSourceTypeEnumSchema.default('official_website'),
  observedName: z.string().max(100).optional().nullable(),
  rightsNote: z.string().max(500).optional().nullable(),
});

export const BrandSourceStatusUpdateSchema = z.object({
  status: BrandSourceVerificationStatusEnumSchema,
  note: z.string().max(500).optional().nullable(),
});

export const BrandAliasCreateSchema = z.object({
  alias: z.string().min(1, 'Alias mütləqdir').max(100),
  locale: z.string().max(10).default('az'),
});

export const BrandLogoRightsUpdateSchema = z.object({
  logoRightsStatus: LogoRightsStatusEnumSchema,
  logoSource: z.string().max(500).optional().nullable(),
  rightsNote: z.string().max(500).optional().nullable(),
  verifiedBy: z.string().max(100).optional().nullable(),
});

export const BrandVerificationStatusUpdateSchema = z.object({
  status: BrandVerificationStatusEnumSchema.optional(),
  verificationStatus: BrandVerificationStatusEnumSchema.optional(),
  note: z.string().max(500).optional().nullable(),
}).refine((data) => Boolean(data.status || data.verificationStatus), {
  message: 'Status və ya verificationStatus mütləqdir',
});

export const CategoryCreateSchema = z.object({
  name: z.string().min(1, 'Kateqoriya adı mütləqdir').max(100),
  slug: z.string().max(100).optional(),
  icon: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  parentId: z.string().max(100).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const CategoryMoveSchema = z.object({
  newParentId: z.string().max(100).optional().nullable(),
  newSortOrder: z.number().int().optional(),
  expectedVersion: z.number().int().optional(),
});

export const CategoryReorderItemSchema = z.object({
  id: z.string().min(1),
  sortOrder: z.number().int(),
});

export const CategoryReorderSchema = z.object({
  parentId: z.string().max(100).optional().nullable(),
  items: z.array(CategoryReorderItemSchema).optional(),
  reorderItems: z.array(CategoryReorderItemSchema).optional(),
}).refine((data) => Array.isArray(data.items) || Array.isArray(data.reorderItems), {
  message: 'items və ya reorderItems massivi tələb olunur',
});

export const CategoryArchiveSchema = z.object({
  reassignToCategoryId: z.string().max(100).optional().nullable(),
});

export const CategorySpecTemplateSchema = z.object({
  specKey: z.string().min(1, 'Xüsusiyyət açarı (specKey) mütləqdir').max(100),
  label: z.string().min(1, 'Xüsusiyyət başlığı (label) mütləqdir').max(100),
  unit: z.string().max(50).default(''),
  required: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});
