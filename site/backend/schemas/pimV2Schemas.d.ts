import { z } from 'zod';

export declare const PublicationStatusSchema: z.ZodEnum<[
  'draft',
  'in_review',
  'approved',
  'scheduled',
  'published',
  'archived',
  'rejected'
]>;

export declare const BrandVerificationStatusSchema: z.ZodEnum<['candidate', 'verified', 'provisional', 'unverified']>;
export declare const SpecNormalizationStatusSchema: z.ZodEnum<['valid', 'needs_review', 'raw_only']>;
export declare const PimMigrationStatusEnumSchema: z.ZodEnum<['pending', 'applied', 'mismatch', 'failed']>;

export declare const PimMigrationStatusResponseSchema: z.ZodObject<{
  ok: z.ZodBoolean;
  status: typeof PimMigrationStatusEnumSchema;
  appliedAt: z.ZodNullable<z.ZodString>;
  version: z.ZodNullable<z.ZodNumber>;
  checksum: z.ZodNullable<z.ZodString>;
  publicDb: z.ZodObject<{
    isVersionApplied: z.ZodBoolean;
    missingTables: z.ZodArray<z.ZodString>;
    missingColumns: z.ZodArray<z.ZodString>;
  }>;
  draftDb: z.ZodObject<{
    isVersionApplied: z.ZodBoolean;
    missingTables: z.ZodArray<z.ZodString>;
    missingColumns: z.ZodArray<z.ZodString>;
  }>;
  liveApplyEnabled: z.ZodBoolean;
  message: z.ZodString;
}>;

export declare const DryRunTokenPayloadSchema: z.ZodObject<{
  tokenId: z.ZodString;
  manifestHash: z.ZodString;
  migrationVersion: z.ZodNumber;
  migrationChecksum: z.ZodString;
  adminActor: z.ZodString;
  nonce: z.ZodString;
  expiresAt: z.ZodString;
}>;

export declare const PimDryRunResponseSchema: z.ZodObject<{
  ok: z.ZodBoolean;
  plan: z.ZodArray<z.ZodObject<{
    step: z.ZodString;
    description: z.ZodString;
  }>>;
  report: z.ZodObject<{
    mainDb: z.ZodObject<{
      productCount: z.ZodNumber;
      specCount: z.ZodNumber;
      mediaCount: z.ZodNumber;
      publishedCount: z.ZodNumber;
    }>;
    draftDb: z.ZodObject<{
      productCount: z.ZodNumber;
      specCount: z.ZodNumber;
      mediaCount: z.ZodNumber;
      publishedCount: z.ZodNumber;
    }>;
  }>;
  dryRunToken: z.ZodString;
  tokenExpiresAt: z.ZodString;
  integrityCheck: z.ZodString;
}>;

export declare const UnassignedMediaResponseSchema: z.ZodObject<{
  ok: z.ZodBoolean;
  totalMediaScanned: z.ZodNumber;
  assignedCount: z.ZodNumber;
  unassignedCount: z.ZodNumber;
  unassignedFiles: z.ZodArray<z.ZodString>;
  auditNotice: z.ZodString;
}>;

export declare const PostgresVerifyResponseSchema: z.ZodObject<{
  status: z.ZodLiteral<'DEFERRED'>;
  message: z.ZodString;
  sourceOfTruth: z.ZodLiteral<'SQLite (catalog.sqlite / catalog-draft.sqlite)'>;
  productionCutover: z.ZodLiteral<'DEFERRED'>;
  postgresAvailable: z.ZodBoolean;
  tableStats: z.ZodArray<z.ZodObject<{
    table: z.ZodString;
    rowCount: z.ZodNumber;
  }>>;
  ddlPreview: z.ZodString;
  sqliteManifest: z.ZodObject<{
    timestamp: z.ZodString;
    mainDbHash: z.ZodNullable<z.ZodString>;
    draftDbHash: z.ZodNullable<z.ZodString>;
  }>;
}>;

export declare const ProductRevisionSchema: z.ZodObject<{
  id: z.ZodString;
  productId: z.ZodString;
  version: z.ZodNumber;
  action: z.ZodEnum<['create', 'update', 'delete', 'rollback']>;
  changedFields: z.ZodArray<z.ZodString>;
  diffPayload: z.ZodString;
  actor: z.ZodString;
  createdAt: z.ZodString;
}>;

export declare const ConflictResponseSchema: z.ZodObject<{
  error: z.ZodLiteral<'PRODUCT_VERSION_CONFLICT'>;
  message: z.ZodString;
  currentVersion: z.ZodNumber;
  currentEtag: z.ZodString;
  currentProduct: z.ZodRecord<z.ZodString, z.ZodAny>;
}>;
