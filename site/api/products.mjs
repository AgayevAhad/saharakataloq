import { copyFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ProductRepository, ProductVersionConflictError } from '../backend/productRepository.mjs';
import { isPhase3SchemaReady } from '../backend/phase3Migration.mjs';
import {
  isPhase4NavigationReady,
  promotePhase4NavigationData,
} from '../backend/phase4NavigationMigration.mjs';
import {
  isPhase5BrandRailReady,
} from '../backend/phase5BrandRailMigration.mjs';
import { BrandRailService } from '../backend/brandRailService.mjs';
import {
  dryRunPimV2Migration,
  validateDryRunToken,
  validateCanonicalSchemaManifest,
  applyPimV2Schema,
  PIM_V2_MIGRATION_VERSION,
  MIGRATION_CHECKSUM,
} from '../backend/pimV2Migration.mjs';
import {
  performCoordinatedCutover,
} from '../backend/shadowCutover.mjs';
import { acquireMigrationLock, releaseMigrationLock } from '../backend/migrationLock.mjs';
import {
  ScheduledPublicationWorker,
  MIN_COMPLETENESS_SCORE,
} from '../backend/scheduledPublicationJob.mjs';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';
import {
  send,
  remoteIp,
  parseCookies,
  readBody,
  safeText,
  validateCatalog,
} from './helpers.mjs';
import { requireAdmin } from './auth.mjs';

export function createProductsRouter({
  getCatalogDatabase,
  getDraftDatabase,
  setCatalogDatabase,
  setDraftDatabase,
  getPubWorker,
  setPubWorker,
  sessions,
  DATA_DIR,
  DATABASE_FILE,
  DRAFT_DATABASE_FILE,
  STAGING_DIR,
  clearIsrCache,
  waitForActiveRequestsDrain,
}) {
  return async function handleProducts(req, res, path) {
    const catalogDatabase = getCatalogDatabase();
    const draftDatabase = getDraftDatabase();

    // GET single product
    if (
      path.startsWith('/api/admin/products/') &&
      req.method === 'GET' &&
      !path.endsWith('/revisions')
    ) {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      const prodId = path.replace('/api/admin/products/', '');
      const repo = new ProductRepository(draftDatabase.db);
      const result = repo.getProductById(prodId);
      if (!result) {
        send(res, 404, { error: 'PRODUCT_NOT_FOUND', message: 'Məhsul tapılmadı' });
        return true;
      }
      send(res, 200, { ok: true, product: result.product }, { ETag: result.etag });
      return true;
    }

    // GET product revisions
    if (
      path.startsWith('/api/admin/products/') &&
      path.endsWith('/revisions') &&
      req.method === 'GET'
    ) {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      const prodId = path.replace('/api/admin/products/', '').replace('/revisions', '');
      const repo = new ProductRepository(draftDatabase.db);
      const revisions = repo.getProductRevisions(prodId);
      send(res, 200, { ok: true, revisions });
      return true;
    }

    // POST create product
    if (path === '/api/admin/products' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      const body = await readBody(req);
      const repo = new ProductRepository(draftDatabase.db);
      try {
        const created = repo.createProduct(body, session.user);
        send(res, 201, { ok: true, product: created.product }, { ETag: created.etag });
      } catch (err) {
        send(res, 500, { error: err.message });
      }
      return true;
    }

    // PUT update product
    if (path.startsWith('/api/admin/products/') && req.method === 'PUT') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match header is mandatory for product updates',
        });
        return true;
      }
      const prodId = path.replace('/api/admin/products/', '');
      const body = await readBody(req);
      const repo = new ProductRepository(draftDatabase.db);
      try {
        const updated = repo.updateProduct(prodId, body, session.user, ifMatch);
        send(res, 200, { ok: true, product: updated.product }, { ETag: updated.etag });
      } catch (err) {
        if (
          err instanceof ProductVersionConflictError ||
          err.name === 'ProductVersionConflictError' ||
          err.code === 'PRODUCT_VERSION_CONFLICT'
        ) {
          send(res, 412, {
            error: 'PRODUCT_VERSION_CONFLICT',
            message: err.message,
            currentVersion: err.currentVersion,
            currentEtag: err.currentEtag,
            currentProduct: err.currentProduct,
          });
          return true;
        }
        send(res, 500, { error: err.message });
      }
      return true;
    }

    // DELETE single product
    if (path.startsWith('/api/admin/products/') && req.method === 'DELETE') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match header is mandatory for product deletion',
        });
        return true;
      }
      const prodId = path.replace('/api/admin/products/', '');
      const repo = new ProductRepository(draftDatabase.db);
      try {
        const result = repo.deleteProduct(prodId, session.user, ifMatch);
        send(res, 200, { ok: true, id: result.id });
      } catch (err) {
        if (
          err instanceof ProductVersionConflictError ||
          err.name === 'ProductVersionConflictError' ||
          err.code === 'PRODUCT_VERSION_CONFLICT'
        ) {
          send(res, 412, {
            error: 'PRODUCT_VERSION_CONFLICT',
            message: err.message,
            currentVersion: err.currentVersion,
            currentEtag: err.currentEtag,
            currentProduct: err.currentProduct,
          });
          return true;
        }
        send(res, 500, { error: err.message });
      }
      return true;
    }

    // GET PIM migration status
    if (path === '/api/admin/pim/migration/status' && req.method === 'GET') {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      try {
        const pubSchema = validateCanonicalSchemaManifest(catalogDatabase.db);
        const draftSchema = validateCanonicalSchemaManifest(draftDatabase.db);

        const pubMig = catalogDatabase.db
          .prepare('SELECT * FROM schema_migrations WHERE version = ?')
          .get(PIM_V2_MIGRATION_VERSION);
        const draftMig = draftDatabase.db
          .prepare('SELECT * FROM schema_migrations WHERE version = ?')
          .get(PIM_V2_MIGRATION_VERSION);

        const pubApplied = Boolean(
          pubMig && pubSchema.isValid && pubMig.checksum === MIGRATION_CHECKSUM
        );
        const draftApplied = Boolean(
          draftMig && draftSchema.isValid && draftMig.checksum === MIGRATION_CHECKSUM
        );

        let status = 'pending';
        if (pubApplied && draftApplied) {
          status = 'applied';
        } else if (
          pubApplied ||
          draftApplied ||
          (pubMig && !pubSchema.isValid) ||
          (draftMig && !draftSchema.isValid)
        ) {
          status = 'mismatch';
        } else {
          status = 'pending';
        }

        send(res, 200, {
          ok: true,
          status,
          appliedAt: pubMig?.applied_at || draftMig?.applied_at || null,
          version: PIM_V2_MIGRATION_VERSION,
          checksum: MIGRATION_CHECKSUM,
          publicDb: {
            isVersionApplied: pubApplied,
            missingTables: pubSchema.missingTables,
            missingColumns: pubSchema.missingColumns,
          },
          draftDb: {
            isVersionApplied: draftApplied,
            missingTables: draftSchema.missingTables,
            missingColumns: draftSchema.missingColumns,
          },
          liveApplyEnabled: process.env.ENABLE_PIM_V2_LIVE_APPLY === 'true',
          message:
            status === 'applied'
              ? 'PIM v2 tam tətbiq edilib'
              : status === 'pending'
                ? 'PIM v2 miqrasiyası gözləyir'
                : 'Bazalar arasında sxem uyğunsuzluğu var',
        });
      } catch (err) {
        send(res, 200, {
          ok: false,
          status: 'failed',
          appliedAt: null,
          version: PIM_V2_MIGRATION_VERSION,
          checksum: MIGRATION_CHECKSUM,
          publicDb: { isVersionApplied: false, missingTables: [], missingColumns: [] },
          draftDb: { isVersionApplied: false, missingTables: [], missingColumns: [] },
          liveApplyEnabled: process.env.ENABLE_PIM_V2_LIVE_APPLY === 'true',
          message: err.message,
        });
      }
      return true;
    }

    // POST PIM migration dry-run
    if (path === '/api/admin/pim/migration/dry-run' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      try {
        const report = dryRunPimV2Migration(DATA_DIR, {
          sessionId: parseCookies(req).sahara_admin || 'admin_session',
          ip: session.ip || remoteIp(req),
        });
        send(res, 200, report);
      } catch (err) {
        send(res, 500, { error: err.message });
      }
      return true;
    }

    // POST PIM migration apply
    if (path === '/api/admin/pim/migration/apply' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;

      // 1. Check Live Apply flag FIRST
      if (process.env.ENABLE_PIM_V2_LIVE_APPLY !== 'true') {
        send(res, 403, {
          error: 'LIVE_APPLY_DISABLED',
          message:
            'Canlı miqrasiya tətbiqi feature flag ilə deaktivdir. Yalnız klon testləri və dry-run icazəlidir.',
        });
        return true;
      }

      // 2. Validate Dry-Run cryptographic token
      const body = await readBody(req);
      const token = body?.dryRunToken || req.headers['x-dry-run-token'];

      const tokenCheck = validateDryRunToken({
        token,
        mainDb: catalogDatabase?.db,
        draftDb: draftDatabase?.db,
        expectedSessionId: parseCookies(req).sahara_admin || 'admin_session',
        expectedIp: session.ip || remoteIp(req),
      });

      if (!tokenCheck.valid) {
        send(res, 400, {
          error: tokenCheck.error || 'INVALID_DRY_RUN_TOKEN',
          message: `Dry-run tokeni etibarsızdır: ${tokenCheck.reason}`,
        });
        return true;
      }

      // 3. Acquire migration lock
      let lockHandle = null;
      try {
        lockHandle = acquireMigrationLock(STAGING_DIR);
        if (!lockHandle || !lockHandle.acquired) {
          send(res, 409, {
            error: 'MIGRATION_LOCKED',
            message: lockHandle?.reason || 'Miqrasiya kilidi hazırda aktivdir.',
          });
          return true;
        }
      } catch (lockErr) {
        send(res, 409, {
          error: 'MIGRATION_LOCKED',
          message: lockErr.message,
        });
        return true;
      }

      let activePubWorker = getPubWorker();

      try {
        // 4. Activate maintenance mode & drain in-flight requests
        globalThis.__SAHARA_MAINTENANCE__ = true;
        const drainTimeoutMs = Number(process.env.PIM_DRAIN_TIMEOUT_MS || 5000);
        const drainRes = await waitForActiveRequestsDrain(drainTimeoutMs);
        if (!drainRes.drained) {
          globalThis.__SAHARA_MAINTENANCE__ = false;
          releaseMigrationLock(lockHandle);
          send(res, 503, {
            error: 'DRAIN_TIMEOUT_ACTIVE_REQUESTS_REMAIN',
            message: `Aktiv sorğuların bitməsi gözlənilərkən vaxt bitdi (${drainRes.remainingCount} aktiv sorğu). Miqrasiya təhlükəsiz dayandırıldı.`,
          });
          return true;
        }

        // 5. Stop scheduled publication worker & close all DB connections
        if (activePubWorker) {
          try {
            activePubWorker.stop();
          } catch {}
          setPubWorker(null);
        }

        try {
          catalogDatabase?.close();
        } catch {}
        try {
          draftDatabase?.close();
        } catch {}
        setCatalogDatabase(null);
        setDraftDatabase(null);

        // 6. Create real same-filesystem staged public and draft database copies
        await mkdir(STAGING_DIR, { recursive: true });
        const stagedPublicPath = join(STAGING_DIR, 'catalog.sqlite.staged');
        const stagedDraftPath = join(STAGING_DIR, 'catalog-draft.sqlite.staged');

        copyFileSync(DATABASE_FILE, stagedPublicPath);
        copyFileSync(DRAFT_DATABASE_FILE, stagedDraftPath);

        // 7. Migrate staged databases
        const stagedPubDb = new DatabaseSync(stagedPublicPath);
        const stagedDraftDb = new DatabaseSync(stagedDraftPath);
        try {
          applyPimV2Schema(stagedPubDb);
          applyPimV2Schema(stagedDraftDb);

          // 8. Verify canonical schema and integrity
          const pubCheck = validateCanonicalSchemaManifest(stagedPubDb);
          const draftCheck = validateCanonicalSchemaManifest(stagedDraftDb);
          const pubIntegrity = stagedPubDb.prepare('PRAGMA integrity_check').get();
          const draftIntegrity = stagedDraftDb.prepare('PRAGMA integrity_check').get();

          if (
            !pubCheck.isValid ||
            !draftCheck.isValid ||
            pubIntegrity?.integrity_check !== 'ok' ||
            draftIntegrity?.integrity_check !== 'ok'
          ) {
            throw new Error('Staged databases failed canonical schema or integrity verification.');
          }
        } finally {
          stagedPubDb.close();
          stagedDraftDb.close();
        }

        // 9. Execute coordinated cutover
        const cutoverRes = performCoordinatedCutover({
          dataDir: DATA_DIR,
          stagingDir: STAGING_DIR,
          stagedPublicPath,
          stagedDraftPath,
          migrationChecksum: MIGRATION_CHECKSUM,
          closeConnectionsFn: () => {
            try {
              getCatalogDatabase()?.close();
            } catch {}
            try {
              getDraftDatabase()?.close();
            } catch {}
            setCatalogDatabase(null);
            setDraftDatabase(null);
          },
          reopenConnectionsFn: () => {
            const newCat = createCatalogDatabase(DATABASE_FILE);
            const newDraft = createCatalogDatabase(DRAFT_DATABASE_FILE);
            setCatalogDatabase(newCat);
            setDraftDatabase(newDraft);
            try {
              const newWorker = new ScheduledPublicationWorker({
                draftDb: newDraft.db,
                publicDb: newCat.db,
                minCompletenessScore: MIN_COMPLETENESS_SCORE,
              });
              newWorker.start(20000);
              setPubWorker(newWorker);
            } catch (workerErr) {
              console.error('[Sahara Apply] Failed to re-create publication worker:', workerErr);
            }
          },
        });

        send(res, 200, {
          ok: true,
          status: 'applied',
          appliedAt: new Date().toISOString(),
          journal: cutoverRes.journal,
        });
        return true;
      } catch (applyErr) {
        if (!getCatalogDatabase() || !getDraftDatabase()) {
          try {
            setCatalogDatabase(createCatalogDatabase(DATABASE_FILE));
            setDraftDatabase(createCatalogDatabase(DRAFT_DATABASE_FILE));
          } catch (reopenErr) {
            console.error('[Sahara Apply] Failed to reopen databases:', reopenErr);
            globalThis.__SAHARA_FAIL_CLOSED__ = true;
          }
        }
        send(res, 500, {
          error: 'MIGRATION_APPLY_FAILED',
          message: applyErr.message,
        });
        return true;
      } finally {
        globalThis.__SAHARA_MAINTENANCE__ = false;
        if (!getPubWorker() && getCatalogDatabase() && getDraftDatabase()) {
          try {
            const restoredWorker = new ScheduledPublicationWorker({
              draftDb: getDraftDatabase().db,
              publicDb: getCatalogDatabase().db,
              minCompletenessScore: MIN_COMPLETENESS_SCORE,
            });
            restoredWorker.start(20000);
            setPubWorker(restoredWorker);
          } catch {}
        }
        if (lockHandle) {
          try {
            releaseMigrationLock(lockHandle);
          } catch {}
        }
      }
    }

    // POST catalog / site toggle status
    if (path === '/api/admin/catalog/toggle-status' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      const body = await readBody(req);
      const active = body.active !== false;
      const scope = body.scope || 'catalog';
      const defaultMsg =
        scope === 'site'
          ? 'Saytda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.'
          : 'Kataloqda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.';
      const message = safeText(body.message, 500) || defaultMsg;

      if (scope === 'site') {
        draftDatabase.updateSiteStatus(active, message);
        catalogDatabase.updateSiteStatus(active, message);
      } else {
        draftDatabase.updateCatalogStatus(active, message);
        catalogDatabase.updateCatalogStatus(active, message);
      }

      const userAgent = safeText(req.headers['user-agent'] || '', 300);
      draftDatabase.logAction({
        category: scope === 'site' ? 'site_status' : 'catalog_status',
        action: active ? `${scope}_resumed` : `${scope}_paused`,
        title:
          scope === 'site'
            ? active
              ? 'Sayt fəaliyyəti bərpa edildi (Yayımda)'
              : 'Sayt fəaliyyəti dayandırıldı (Profilaktika)'
            : active
              ? 'Kataloq fəaliyyəti bərpa edildi (Yayımda)'
              : 'Kataloq fəaliyyəti dayandırıldı (Profilaktika)',
        details: active
          ? `${scope === 'site' ? 'Sayt' : 'Kataloq'} aktivdir`
          : `Mesaj: ${message}`,
        ipAddress: session.ip,
        userAgent,
        status: active ? 'info' : 'warning',
      });
      send(res, 200, { ok: true, active, message, scope });
      return true;
    }

    // PUT save draft catalog
    if (path === '/api/admin/catalog' && req.method === 'PUT') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      const body = await readBody(req);
      if (!validateCatalog(body)) {
        send(res, 400, {
          error: 'INVALID_CATALOG_PAYLOAD',
          message: 'Kataloq məlumat strukturu natamam və ya etibarsızdır.',
        });
        return true;
      }
      draftDatabase.saveCatalog(body);
      const userAgent = safeText(req.headers['user-agent'] || '', 300);
      draftDatabase.logAction({
        category: 'product',
        action: 'draft_save',
        title: 'Qaralama kataloq yeniləndi',
        details: `${body.products.length} məhsul, ${body.categories.length} kateqoriya, ${body.brands.length} brend`,
        ipAddress: session.ip,
        userAgent,
        status: 'info',
      });
      send(res, 200, { ok: true, updatedAt: body.updatedAt });
      return true;
    }

    // POST publish live catalog
    if (path === '/api/admin/publish' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!isPhase3SchemaReady(catalogDatabase.db)) {
        send(res, 409, {
          error: 'PUBLIC_DB_SCHEMA_NOT_READY',
          message:
            'İctimai verilənlər bazası Phase 3 sxemi üçün hazır deyil. Əvvəlcədən təsdiqlənmiş miqrasiya tələb olunur.',
        });
        return true;
      }
      const rawCatalog = draftDatabase.getAdminData
        ? draftDatabase.getAdminData()
        : draftDatabase.getCatalog({ includeAll: true });
      if (!validateCatalog(rawCatalog)) {
        send(res, 400, {
          error: 'INVALID_DRAFT_CATALOG',
          message: 'Qaralama kataloq məlumatları natamamdır.',
        });
        return true;
      }
      const catalog = rawCatalog;
      catalogDatabase.createSnapshot({
        name: `Canlı yayımdan əvvəlki avtomatik nüsxə (${new Date().toLocaleTimeString('az-AZ')})`,
        createdBy: 'auto-publish',
      });
      try {
        catalogDatabase.publishAtomic(rawCatalog, draftDatabase.db);
        if (
          isPhase4NavigationReady(draftDatabase.db) &&
          isPhase4NavigationReady(catalogDatabase.db)
        ) {
          try {
            promotePhase4NavigationData(draftDatabase.db, catalogDatabase.db);
          } catch (navErr) {
            console.error('Failed to promote navigation data on publish:', navErr);
          }
        }
        if (
          isPhase5BrandRailReady(draftDatabase.db) &&
          isPhase5BrandRailReady(catalogDatabase.db)
        ) {
          try {
            const draftRail = new BrandRailService(draftDatabase.db);
            draftRail.publishToPublicDb(catalogDatabase.db, session.user || 'admin');
          } catch (railErr) {
            console.error('Failed to promote brand rail on publish:', railErr);
          }
        }
        clearIsrCache();
      } catch (err) {
        if (err.code === 'PUBLIC_DB_SCHEMA_NOT_READY') {
          send(res, 409, { error: err.code, message: err.message });
        } else {
          send(res, 500, { error: 'PUBLISH_FAILED', message: err.message });
        }
        return true;
      }

      const userAgent = safeText(req.headers['user-agent'] || '', 300);
      draftDatabase.logAction({
        category: 'product',
        action: 'catalog_publish',
        title: 'Kataloq ictimai canlı yayıma buraxıldı',
        details: `${catalog.products.length} məhsul dərc edildi`,
        ipAddress: session.ip,
        userAgent,
        status: 'success',
      });
      catalogDatabase.logAction({
        category: 'product',
        action: 'catalog_publish',
        title: 'Kataloq ictimai canlı yayıma buraxıldı',
        details: `${catalog.products.length} məhsul dərc edildi`,
        ipAddress: session.ip,
        userAgent,
        status: 'success',
      });
      send(res, 200, { ok: true, updatedAt: catalog.updatedAt });
      return true;
    }

    return false;
  };
}
