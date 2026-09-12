import { describe, it, expect } from 'vitest';
import {
  ProductSchema,
  ProductSchemaType,
  PimMigrationStatusResponseSchema,
  PimMigrationStatusResponseType,
  PimDryRunResponseSchema,
  PimDryRunResponseType,
  ConflictResponseSchema,
  ConflictResponseType,
  PostgresVerifyResponseSchema,
  PostgresVerifyResponseType,
  validateSafe,
} from '../src/types/schemas';

describe('TypeScript Non-Any Compile-Time & Runtime Type Inference Suite', () => {
  it('1. Correctly parses and strongly types Product schema', () => {
    const raw = {
      id: 'p-1',
      code: 'M-101',
      title: 'ARDO Cooktop',
      category: 'cooktop',
      image: '/media/ardo/m-101.jpg',
      price: 450,
      currency: 'AZN',
      stockStatus: 'in_stock',
      status: 'published',
      publicationStatus: 'published',
      completenessScore: 100,
      version: 1,
    };

    const res = validateSafe(ProductSchema, raw);
    expect(res.success).toBe(true);
    if (res.success) {
      const prod: ProductSchemaType = res.data;
      expect(prod.id).toBe('p-1');
      expect(prod.price).toBe(450);
      expect(prod.publicationStatus).toBe('published');
    }
  });

  it('2. Correctly parses and strongly types PimMigrationStatusResponse', () => {
    const raw = {
      ok: true,
      status: 'pending' as const,
      appliedAt: null,
      version: 8,
      checksum: 'sha-test',
      publicDb: { isVersionApplied: false, missingTables: [], missingColumns: [] },
      draftDb: { isVersionApplied: false, missingTables: [], missingColumns: [] },
      liveApplyEnabled: false,
      message: 'Pending migration',
    };

    const res = validateSafe(PimMigrationStatusResponseSchema, raw);
    expect(res.success).toBe(true);
    if (res.success) {
      const statusObj: PimMigrationStatusResponseType = res.data;
      expect(statusObj.status).toBe('pending');
      expect(statusObj.liveApplyEnabled).toBe(false);
    }
  });

  it('3. Correctly parses and strongly types ConflictResponse', () => {
    const raw = {
      error: 'PRODUCT_VERSION_CONFLICT' as const,
      message: 'Version conflict detected',
      currentVersion: 2,
      currentEtag: '"p-1-v2-abc"',
      currentProduct: { id: 'p-1', version: 2 },
    };

    const res = validateSafe(ConflictResponseSchema, raw);
    expect(res.success).toBe(true);
    if (res.success) {
      const conflict: ConflictResponseType = res.data;
      expect(conflict.error).toBe('PRODUCT_VERSION_CONFLICT');
      expect(conflict.currentVersion).toBe(2);
    }
  });

  it('4. Correctly parses and strongly types PimDryRunResponse', () => {
    const raw = {
      ok: true,
      plan: [{ step: '0008_pim_v2_additive_architecture', description: 'Apply PIM v2' }],
      report: {
        mainDb: { productCount: 350, specCount: 4532, mediaCount: 174, publishedCount: 25 },
        draftDb: { productCount: 350, specCount: 4532, mediaCount: 174, publishedCount: 25 },
      },
      dryRunToken: 'token-123',
      tokenExpiresAt: '2026-09-10T12:00:00.000Z',
      integrityCheck: 'PASSED',
    };

    const res = validateSafe(PimDryRunResponseSchema, raw);
    expect(res.success).toBe(true);
    if (res.success) {
      const dryRun: PimDryRunResponseType = res.data;
      expect(dryRun.dryRunToken).toBe('token-123');
      expect(dryRun.report.mainDb.productCount).toBe(350);
      expect(dryRun.integrityCheck).toBe('PASSED');
    }
  });

  it('5. Correctly parses and strongly types PostgresVerifyResponse', () => {
    const raw = {
      status: 'DEFERRED' as const,
      message: 'PostgreSQL verification deferred',
      sourceOfTruth: 'SQLite (catalog.sqlite / catalog-draft.sqlite)' as const,
      productionCutover: 'DEFERRED' as const,
      postgresAvailable: false,
      tableStats: [{ table: 'products', rowCount: 350 }],
      ddlPreview: 'CREATE TABLE products (...);',
      sqliteManifest: {
        timestamp: '2026-09-10T12:00:00.000Z',
        mainDbHash: 'abc',
        draftDbHash: 'def',
      },
    };

    const res = validateSafe(PostgresVerifyResponseSchema, raw);
    expect(res.success).toBe(true);
    if (res.success) {
      const pg: PostgresVerifyResponseType = res.data;
      expect(pg.status).toBe('DEFERRED');
      expect(pg.tableStats).toHaveLength(1);
      expect(pg.tableStats[0].rowCount).toBe(350);
    }
  });
});
