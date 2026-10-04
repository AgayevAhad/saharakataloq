import { applyPimV2Schema } from './pimV2Migration.mjs';
import { applyPhase3Schema, isPhase3SchemaReady } from './phase3Migration.mjs';

/**
 * Applies only additive, idempotent catalog migrations required by the live
 * publish path. Legacy product/media tables remain authoritative and intact.
 */
export function ensureCatalogPublishSchema(db) {
  const pimResult = applyPimV2Schema(db);
  const phase3Result = applyPhase3Schema(db);

  if (!isPhase3SchemaReady(db)) {
    throw new Error('PUBLIC_DB_SCHEMA_NOT_READY: Phase 3 schema bootstrap failed.');
  }

  return { pimResult, phase3Result };
}
