import { z } from 'zod';

export const PublicationStatusSchema = z.enum([
  'draft',
  'in_review',
  'approved',
  'scheduled',
  'published',
  'archived',
  'rejected',
]);

export const BrandVerificationStatusSchema = z.enum(['candidate', 'verified', 'provisional', 'unverified']);

export const SpecNormalizationStatusSchema = z.enum(['valid', 'needs_review', 'raw_only']);

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

export const DryRunTokenPayloadSchema = z.object({
  tokenId: z.string(),
  manifestHash: z.string(),
  migrationVersion: z.number(),
  migrationChecksum: z.string(),
  adminActor: z.string(),
  nonce: z.string(),
  expiresAt: z.string(),
});

export const PimDryRunResponseSchema = z.object({
  ok: z.boolean(),
  plan: z.array(z.object({
    step: z.string(),
    description: z.string(),
  })),
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

export const UnassignedMediaResponseSchema = z.object({
  ok: z.boolean(),
  totalMediaScanned: z.number(),
  assignedCount: z.number(),
  unassignedCount: z.number(),
  unassignedFiles: z.array(z.string()),
  auditNotice: z.string(),
});

export const PostgresVerifyResponseSchema = z.object({
  status: z.literal('DEFERRED'),
  message: z.string(),
  sourceOfTruth: z.literal('SQLite (catalog.sqlite / catalog-draft.sqlite)'),
  productionCutover: z.literal('DEFERRED'),
  postgresAvailable: z.boolean(),
  tableStats: z.array(z.object({
    table: z.string(),
    rowCount: z.number(),
  })),
  ddlPreview: z.string(),
  sqliteManifest: z.object({
    timestamp: z.string(),
    mainDbHash: z.string().nullable(),
    draftDbHash: z.string().nullable(),
  }),
});

export const ProductRevisionSchema = z.object({
  id: z.string(),
  productId: z.string(),
  version: z.number(),
  action: z.enum(['create', 'update', 'delete', 'rollback']),
  changedFields: z.array(z.string()),
  diffPayload: z.string(),
  actor: z.string(),
  createdAt: z.string(),
});

export const ConflictResponseSchema = z.object({
  error: z.literal('PRODUCT_VERSION_CONFLICT'),
  message: z.string(),
  currentVersion: z.number(),
  currentEtag: z.string(),
  currentProduct: z.record(z.string(), z.any()),
});
