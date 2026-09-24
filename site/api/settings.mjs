import { BrandRegistryService, generateBrandEtag, matchBrandEtag } from '../backend/brandRegistryService.mjs';
import {
  TaxonomyService,
  generateCategoryEtag,
  matchCategoryEtag,
  generateSiblingSetEtag,
  matchSiblingSetEtag,
} from '../backend/taxonomyService.mjs';
import { SpecTemplateService } from '../backend/specTemplateService.mjs';
import { isPhase3SchemaReady } from '../backend/phase3Migration.mjs';
import { NavigationService } from '../backend/navigationService.mjs';
import {
  isPhase4NavigationReady,
  DEFAULT_NAVIGATION_SEED,
} from '../backend/phase4NavigationMigration.mjs';
import {
  isPhase5BrandRailReady,
} from '../backend/phase5BrandRailMigration.mjs';
import { BrandRailService, generateBrandRailEtag } from '../backend/brandRailService.mjs';
import { verifyPostgresCopyTooling } from '../backend/postgresCopyVerify.mjs';
import {
  BrandCandidateCreateSchema,
  BrandCandidateBatchSchema,
  BrandSourceCreateSchema,
  BrandSourceStatusUpdateSchema,
  BrandAliasCreateSchema,
  BrandLogoRightsUpdateSchema,
  BrandVerificationStatusUpdateSchema,
  CategoryCreateSchema,
  CategoryMoveSchema,
  CategoryReorderSchema,
  CategoryArchiveSchema,
  CategorySpecTemplateSchema,
} from '../backend/schemas/phase3Schemas.mjs';
import {
  send,
  readBody,
  readChatAttachment,
  safeText,
} from './helpers.mjs';
import { requireAdmin } from './auth.mjs';

export function createSettingsRouter({
  getCatalogDatabase,
  getDraftDatabase,
  sessions,
  customerStore,
  DATABASE_FILE,
  clearIsrCache,
}) {
  return async function handleSettings(req, res, path, url) {
    const catalogDatabase = getCatalogDatabase();
    const draftDatabase = getDraftDatabase();

    // GET /api/admin/data
    if (path === '/api/admin/data' && req.method === 'GET') {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      const catalog = draftDatabase.getAdminData
        ? draftDatabase.getAdminData()
        : draftDatabase.getCatalog({ includeAll: true });
      const analytics = catalogDatabase.getAnalytics();
      send(res, 200, { ...catalog, analytics, csrfToken: session.csrfToken });
      return true;
    }

    // GET /api/admin/analytics
    if (path === '/api/admin/analytics' && req.method === 'GET') {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      const range = url.searchParams.get('range') || 'all';
      const from = url.searchParams.get('from') || undefined;
      const to = url.searchParams.get('to') || undefined;
      const filtered = catalogDatabase.getFilteredAnalytics({ range, fromDate: from, toDate: to });
      send(res, 200, filtered);
      return true;
    }

    // GET /api/admin/logs
    if (path === '/api/admin/logs' && req.method === 'GET') {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      const category = url.searchParams.get('category') || 'all';
      const search = url.searchParams.get('search') || '';
      const limit = Number(url.searchParams.get('limit') || 100);
      const offset = Number(url.searchParams.get('offset') || 0);
      const result = draftDatabase.getLogs({ category, search, limit, offset });
      send(res, 200, result);
      return true;
    }

    // POST /api/admin/logs/clear
    if (path === '/api/admin/logs/clear' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      draftDatabase.clearLogs();
      catalogDatabase.clearLogs();
      const userAgent = safeText(req.headers['user-agent'] || '', 300);
      draftDatabase.logAction({
        category: 'system',
        action: 'logs_cleared',
        title: 'Audit logları təmizləndi',
        details: 'Bütün köhnə log qeydləri silindi',
        ipAddress: session.ip,
        userAgent,
        status: 'warning',
      });
      send(res, 200, { ok: true });
      return true;
    }

    // GET /api/admin/logs/export
    if (path === '/api/admin/logs/export' && req.method === 'GET') {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      const format = url.searchParams.get('format') || 'csv';
      const category = url.searchParams.get('category') || 'all';
      const result = draftDatabase.getLogs({ category, limit: 5000, offset: 0 });
      if (format === 'json') {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="sahara-audit-logs-${Date.now()}.json"`,
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        });
        res.end(JSON.stringify(result.logs, null, 2));
        return true;
      }
      const headers = ['ID', 'Tarix', 'Kateqoriya', 'Hadisə', 'Başlıq', 'Detallar', 'Status', 'IP'];
      const csvRows = [headers.join(',')];
      for (const log of result.logs) {
        csvRows.push(
          [
            log.id,
            `"${log.createdAt}"`,
            `"${log.category}"`,
            `"${log.action}"`,
            `"${String(log.title).replace(/"/g, '""')}"`,
            `"${String(log.details).replace(/"/g, '""')}"`,
            `"${log.status}"`,
            `"${log.ipAddress}"`,
          ].join(',')
        );
      }
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="sahara-audit-logs-${Date.now()}.csv"`,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      });
      res.end(csvRows.join('\n'));
      return true;
    }

    // Admin Chat Inbox
    if (path === '/api/admin/chat/inbox' && req.method === 'GET') {
      if (!requireAdmin(req, res, sessions)) return true;
      send(res, 200, { conversations: customerStore.inbox() });
      return true;
    }

    const adminChatMatch = path.match(/^\/api\/admin\/chat\/([^/]+)\/messages$/);
    if (adminChatMatch && req.method === 'GET') {
      if (!requireAdmin(req, res, sessions)) return true;
      if (!customerStore.hasUser(adminChatMatch[1])) {
        send(res, 404, { error: 'İstifadəçi tapılmadı' });
        return true;
      }
      customerStore.markRead(adminChatMatch[1], 'customer');
      send(res, 200, { messages: customerStore.messages(adminChatMatch[1]) });
      return true;
    }

    if (adminChatMatch && req.method === 'POST') {
      if (!requireAdmin(req, res, sessions, true)) return true;
      if (!customerStore.hasUser(adminChatMatch[1])) {
        send(res, 404, { error: 'İstifadəçi tapılmadı' });
        return true;
      }
      const body = await readBody(req);
      const result = customerStore.addMessage(
        adminChatMatch[1],
        'admin',
        body ? body.body : ''
      );
      if (result.error) {
        send(res, result.status, { error: result.error });
      } else {
        send(res, 201, result);
      }
      return true;
    }

    const adminChatAttachmentMatch = path.match(/^\/api\/admin\/chat\/([^/]+)\/attachment$/);
    if (adminChatAttachmentMatch && req.method === 'POST') {
      if (!requireAdmin(req, res, sessions, true)) return true;
      if (!customerStore.hasUser(adminChatAttachmentMatch[1])) {
        send(res, 404, { error: 'İstifadəçi tapılmadı' });
        return true;
      }
      const media = await readChatAttachment(req);
      if (media.error) {
        send(res, 400, { error: media.error });
        return true;
      }
      const result = customerStore.addMessage(adminChatAttachmentMatch[1], 'admin', '', media);
      if (result.error) {
        send(res, result.status, { error: result.error });
      } else {
        send(res, 201, result);
      }
      return true;
    }

    const checkPhase3Ready = (res) => {
      if (!isPhase3SchemaReady(draftDatabase?.db)) {
        send(res, 409, {
          error: 'PHASE3_SCHEMA_NOT_READY',
          message:
            'Mərhələ 3 sxemi bazaya tətbiq edilməyib. Əməliyyat üçün sxem miqrasiyası tələb olunur.',
        });
        return false;
      }
      return true;
    };

    // Brand Registry Admin Endpoints
    if (path === '/api/admin/brands' && req.method === 'GET') {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      const status = url.searchParams.get('status') || undefined;
      const search = url.searchParams.get('search') || undefined;
      const includeArchived = url.searchParams.get('includeArchived') === 'true';
      const brandService = new BrandRegistryService(draftDatabase.db);
      const brands = brandService.getAdminBrands({ status, search, includeArchived });
      send(res, 200, { ok: true, brands });
      return true;
    }

    if (path === '/api/admin/brands/candidates' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!checkPhase3Ready(res)) return true;
      try {
        const body = await readBody(req);
        const brandService = new BrandRegistryService(draftDatabase.db);
        if (Array.isArray(body.candidates)) {
          const parsed = BrandCandidateBatchSchema.parse(body);
          const result = brandService.importCandidateBatch(parsed.candidates, {
            actor: session.username || 'admin',
          });
          send(res, 201, { ok: true, ...result });
          return true;
        }
        const parsed = BrandCandidateCreateSchema.parse(body);
        const brand = brandService.addCandidateBrand({
          ...parsed,
          actor: session.username || 'admin',
        });
        const etag = generateBrandEtag(brand);
        send(res, 201, { ok: true, brand }, etag ? { ETag: etag } : {});
      } catch (err) {
        console.error('[BRAND_CANDIDATE_ERROR]', err);
        send(res, 400, { error: 'BRAND_CANDIDATE_ERROR', message: err.message });
      }
      return true;
    }

    const brandSrcMatch = path.match(/^\/api\/admin\/brands\/([^/]+)\/sources$/);
    if (brandSrcMatch && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!checkPhase3Ready(res)) return true;
      const brandId = brandSrcMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı mənbə əlavə edilməsi üçün məcburidir.',
        });
        return true;
      }
      const brandService = new BrandRegistryService(draftDatabase.db);
      const currentBrand = brandService.getBrandById(brandId);
      if (!currentBrand) {
        send(res, 404, { error: 'BRAND_NOT_FOUND', message: 'Brend tapılmadı' });
        return true;
      }
      if (!matchBrandEtag(ifMatch, currentBrand)) {
        send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Brend versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentBrand.version,
          currentEtag: generateBrandEtag(currentBrand),
        });
        return true;
      }
      try {
        const body = await readBody(req);
        const parsed = BrandSourceCreateSchema.parse(body);
        const source = brandService.addBrandSource(brandId, {
          ...parsed,
          actor: session.username || 'admin',
          ipAddress: session.ip || '127.0.0.1',
          userAgent: safeText(req.headers['user-agent'] || '', 300),
        });
        const freshBrand = brandService.getBrandById(brandId);
        const etag = generateBrandEtag(freshBrand);
        send(res, 201, { ok: true, source, brand: freshBrand }, etag ? { ETag: etag } : {});
      } catch (err) {
        send(res, 400, { error: 'BRAND_SOURCE_ERROR', message: err.message });
      }
      return true;
    }

    const brandSrcStatusMatch = path.match(
      /^\/api\/admin\/brands\/([^/]+)\/sources\/([^/]+)\/status$/
    );
    if (brandSrcStatusMatch && req.method === 'PUT') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!checkPhase3Ready(res)) return true;
      const brandId = brandSrcStatusMatch[1];
      const sourceId = brandSrcStatusMatch[2];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı mənbə statusunun yenilənməsi üçün məcburidir.',
        });
        return true;
      }
      const brandService = new BrandRegistryService(draftDatabase.db);
      const currentBrand = brandService.getBrandById(brandId);
      if (!currentBrand) {
        send(res, 404, { error: 'BRAND_NOT_FOUND', message: 'Brend tapılmadı' });
        return true;
      }
      if (!matchBrandEtag(ifMatch, currentBrand)) {
        send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Brend versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentBrand.version,
          currentEtag: generateBrandEtag(currentBrand),
        });
        return true;
      }
      try {
        const body = await readBody(req);
        const parsed = BrandSourceStatusUpdateSchema.parse(body);
        const updated = brandService.updateBrandSourceStatus(brandId, sourceId, parsed.status, {
          note: parsed.note || '',
          actor: session.username || 'admin',
          ipAddress: session.ip || '127.0.0.1',
          userAgent: safeText(req.headers['user-agent'] || '', 300),
        });
        const freshBrand = brandService.getBrandById(brandId);
        const etag = generateBrandEtag(freshBrand);
        send(
          res,
          200,
          { ok: true, source: updated, brand: freshBrand },
          etag ? { ETag: etag } : {}
        );
      } catch (err) {
        send(res, 400, { error: 'BRAND_SOURCE_STATUS_ERROR', message: err.message });
      }
      return true;
    }

    const brandAliasMatch = path.match(/^\/api\/admin\/brands\/([^/]+)\/aliases$/);
    if (brandAliasMatch && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!checkPhase3Ready(res)) return true;
      const brandId = brandAliasMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı ləqəb əlavə edilməsi üçün məcburidir.',
        });
        return true;
      }
      const brandService = new BrandRegistryService(draftDatabase.db);
      const currentBrand = brandService.getBrandById(brandId);
      if (!currentBrand) {
        send(res, 404, { error: 'BRAND_NOT_FOUND', message: 'Brend tapılmadı' });
        return true;
      }
      if (!matchBrandEtag(ifMatch, currentBrand)) {
        send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Brend versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentBrand.version,
          currentEtag: generateBrandEtag(currentBrand),
        });
        return true;
      }
      try {
        const body = await readBody(req);
        const parsed = BrandAliasCreateSchema.parse(body);
        const alias = brandService.addBrandAlias(
          brandId,
          parsed.alias,
          parsed.locale,
          session.username || 'admin',
          {
            ipAddress: session.ip || '127.0.0.1',
            userAgent: safeText(req.headers['user-agent'] || '', 300),
          }
        );
        const freshBrand = brandService.getBrandById(brandId);
        const etag = generateBrandEtag(freshBrand);
        send(res, 201, { ok: true, alias, brand: freshBrand }, etag ? { ETag: etag } : {});
      } catch (err) {
        send(res, 400, { error: 'BRAND_ALIAS_ERROR', message: err.message });
      }
      return true;
    }

    const brandLogoMatch = path.match(/^\/api\/admin\/brands\/([^/]+)\/logo-rights$/);
    if (brandLogoMatch && req.method === 'PUT') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!checkPhase3Ready(res)) return true;
      const brandId = brandLogoMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı loqo hüquqlarının yenilənməsi üçün məcburidir.',
        });
        return true;
      }
      const brandService = new BrandRegistryService(draftDatabase.db);
      const currentBrand = brandService.getBrandById(brandId);
      if (!currentBrand) {
        send(res, 404, { error: 'BRAND_NOT_FOUND', message: 'Brend tapılmadı' });
        return true;
      }
      if (!matchBrandEtag(ifMatch, currentBrand)) {
        send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Brend versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentBrand.version,
          currentEtag: generateBrandEtag(currentBrand),
        });
        return true;
      }
      try {
        const body = await readBody(req);
        const parsed = BrandLogoRightsUpdateSchema.parse(body);
        const updated = brandService.updateLogoRights(brandId, {
          ...parsed,
          actor: session.username || 'admin',
          ipAddress: session.ip || '127.0.0.1',
          userAgent: safeText(req.headers['user-agent'] || '', 300),
        });
        const etag = generateBrandEtag(updated);
        send(res, 200, { ok: true, brand: updated }, etag ? { ETag: etag } : {});
      } catch (err) {
        send(res, 400, { error: 'LOGO_RIGHTS_ERROR', message: err.message });
      }
      return true;
    }

    const brandVerifMatch = path.match(/^\/api\/admin\/brands\/([^/]+)\/verification-status$/);
    if (brandVerifMatch && req.method === 'PUT') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!checkPhase3Ready(res)) return true;
      const brandId = brandVerifMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı brend statusunun yenilənməsi üçün məcburidir.',
        });
        return true;
      }
      const brandService = new BrandRegistryService(draftDatabase.db);
      const currentBrand = brandService.getBrandById(brandId);
      if (!currentBrand) {
        send(res, 404, { error: 'BRAND_NOT_FOUND', message: 'Brend tapılmadı' });
        return true;
      }
      if (!matchBrandEtag(ifMatch, currentBrand)) {
        send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Brend versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentBrand.version,
          currentEtag: generateBrandEtag(currentBrand),
        });
        return true;
      }
      try {
        const body = await readBody(req);
        const parsed = BrandVerificationStatusUpdateSchema.parse(body);
        const updated = brandService.updateBrandVerificationStatus(
          brandId,
          parsed.status || parsed.verificationStatus,
          {
            actor: session.username || 'admin',
            note: parsed.note || '',
            ipAddress: session.ip || '127.0.0.1',
            userAgent: safeText(req.headers['user-agent'] || '', 300),
          }
        );
        const etag = generateBrandEtag(updated);
        send(res, 200, { ok: true, brand: updated }, etag ? { ETag: etag } : {});
      } catch (err) {
        send(res, 400, { error: 'BRAND_VERIFICATION_ERROR', message: err.message });
      }
      return true;
    }

    // Category Tree Admin Endpoints
    if (path === '/api/admin/categories/tree' && req.method === 'GET') {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      const includeArchived = url.searchParams.get('includeArchived') === 'true';
      const taxService = new TaxonomyService(draftDatabase.db);
      const tree = taxService.getCategoryTree({ includeArchived });
      send(res, 200, { ok: true, tree });
      return true;
    }

    const catImpactMatch = path.match(/^\/api\/admin\/categories\/([^/]+)\/impact$/);
    if (catImpactMatch && req.method === 'GET') {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      if (!checkPhase3Ready(res)) return true;
      const categoryId = catImpactMatch[1];
      try {
        const taxService = new TaxonomyService(draftDatabase.db);
        const impact = taxService.getCategoryArchiveImpact(categoryId);
        send(res, 200, { ok: true, ...impact });
      } catch (err) {
        send(res, 400, { error: 'CATEGORY_IMPACT_ERROR', message: err.message });
      }
      return true;
    }

    if (path === '/api/admin/categories' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!checkPhase3Ready(res)) return true;
      try {
        const body = await readBody(req);
        const parsed = CategoryCreateSchema.parse(body);
        const taxService = new TaxonomyService(draftDatabase.db);
        const created = taxService.createCategory({
          ...parsed,
          actor: session.username || 'admin',
        });
        const etag = generateCategoryEtag(created);
        send(res, 201, { ok: true, category: created }, etag ? { ETag: etag } : {});
      } catch (err) {
        console.error('[CATEGORY_CREATE_ERROR]', err);
        send(res, 400, { error: 'CATEGORY_CREATE_ERROR', message: err.message });
      }
      return true;
    }

    const catMoveMatch = path.match(/^\/api\/admin\/categories\/([^/]+)\/move$/);
    if (catMoveMatch && req.method === 'PUT') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!checkPhase3Ready(res)) return true;
      const categoryId = catMoveMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı kateqoriyanın köçürülməsi üçün məcburidir.',
        });
        return true;
      }
      const taxService = new TaxonomyService(draftDatabase.db);
      const currentCat = taxService.getCategoryById(categoryId);
      if (!currentCat) {
        send(res, 404, { error: 'CATEGORY_NOT_FOUND', message: 'Kateqoriya tapılmadı' });
        return true;
      }
      if (!matchCategoryEtag(ifMatch, currentCat)) {
        send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Kateqoriya versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentCat.version,
          currentEtag: generateCategoryEtag(currentCat),
        });
        return true;
      }
      try {
        const body = await readBody(req);
        const parsed = CategoryMoveSchema.parse(body);
        const moved = taxService.moveCategory(
          categoryId,
          parsed.newParentId || null,
          parsed.newSortOrder,
          { expectedVersion: currentCat.version, actor: session.username || 'admin' }
        );
        const etag = generateCategoryEtag(moved);
        send(res, 200, { ok: true, category: moved }, etag ? { ETag: etag } : {});
      } catch (err) {
        send(res, 400, { error: 'CATEGORY_MOVE_ERROR', message: err.message });
      }
      return true;
    }

    if (path === '/api/admin/categories/reorder' && req.method === 'PUT') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!checkPhase3Ready(res)) return true;
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı kateqoriyaların yenidən sıralanması üçün məcburidir.',
        });
        return true;
      }
      try {
        const body = await readBody(req);
        const parsed = CategoryReorderSchema.parse(body);
        const taxService = new TaxonomyService(draftDatabase.db);
        const parentId = parsed.parentId !== undefined ? parsed.parentId : null;
        if (!matchSiblingSetEtag(ifMatch, draftDatabase.db, parentId)) {
          send(res, 412, {
            error: 'PRECONDITION_FAILED',
            message: 'Sıralama versiya toqquşması aşkarlandı (stale ETag)',
            currentEtag: generateSiblingSetEtag(draftDatabase.db, parentId),
          });
          return true;
        }
        const reorderItems =
          parsed.items || parsed.reorderItems || (Array.isArray(parsed) ? parsed : []);
        const result = taxService.reorderCategories({
          parentId,
          reorderItems,
          actor: session.username || 'admin',
          ipAddress: session.ip || '127.0.0.1',
          userAgent: safeText(req.headers['user-agent'] || '', 300),
        });
        const freshEtag = generateSiblingSetEtag(draftDatabase.db, parentId);
        send(res, 200, { ok: true, ...result }, freshEtag ? { ETag: freshEtag } : {});
      } catch (err) {
        send(res, 400, { error: 'CATEGORY_REORDER_ERROR', message: err.message });
      }
      return true;
    }

    const catArchiveMatch = path.match(/^\/api\/admin\/categories\/([^/]+)\/archive$/);
    if (catArchiveMatch && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!checkPhase3Ready(res)) return true;
      const categoryId = catArchiveMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı kateqoriyanın arxivlənməsi üçün məcburidir.',
        });
        return true;
      }
      const taxService = new TaxonomyService(draftDatabase.db);
      const currentCat = taxService.getCategoryById(categoryId);
      if (!currentCat) {
        send(res, 404, { error: 'CATEGORY_NOT_FOUND', message: 'Kateqoriya tapılmadı' });
        return true;
      }
      if (!matchCategoryEtag(ifMatch, currentCat)) {
        send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Kateqoriya versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentCat.version,
          currentEtag: generateCategoryEtag(currentCat),
        });
        return true;
      }
      try {
        const body = await readBody(req);
        const parsed = CategoryArchiveSchema.parse(body);
        const archived = taxService.archiveCategory(categoryId, {
          reassignToCategoryId: parsed.reassignToCategoryId || null,
          actor: session.username || 'admin',
        });
        const etag = generateCategoryEtag(archived);
        send(res, 200, { ok: true, category: archived }, etag ? { ETag: etag } : {});
      } catch (err) {
        send(res, 400, { error: 'CATEGORY_ARCHIVE_ERROR', message: err.message });
      }
      return true;
    }

    const catRestoreMatch = path.match(/^\/api\/admin\/categories\/([^/]+)\/restore$/);
    if (catRestoreMatch && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!checkPhase3Ready(res)) return true;
      const categoryId = catRestoreMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı kateqoriyanın bərpası üçün məcburidir.',
        });
        return true;
      }
      const taxService = new TaxonomyService(draftDatabase.db);
      const currentCat = taxService.getCategoryById(categoryId);
      if (!currentCat) {
        send(res, 404, { error: 'CATEGORY_NOT_FOUND', message: 'Kateqoriya tapılmadı' });
        return true;
      }
      if (!matchCategoryEtag(ifMatch, currentCat)) {
        send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Kateqoriya versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentCat.version,
          currentEtag: generateCategoryEtag(currentCat),
        });
        return true;
      }
      try {
        const restored = taxService.restoreCategory(categoryId, {
          actor: session.username || 'admin',
        });
        const etag = generateCategoryEtag(restored);
        send(res, 200, { ok: true, category: restored }, etag ? { ETag: etag } : {});
      } catch (err) {
        send(res, 400, { error: 'CATEGORY_RESTORE_ERROR', message: err.message });
      }
      return true;
    }

    // Category Spec Template Endpoints
    const catSpecListMatch = path.match(/^\/api\/admin\/categories\/([^/]+)\/spec-templates$/);
    if (catSpecListMatch && req.method === 'GET') {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      if (!checkPhase3Ready(res)) return true;
      const categoryId = catSpecListMatch[1];
      const taxService = new TaxonomyService(draftDatabase.db);
      const currentCat = taxService.getCategoryById(categoryId);
      if (!currentCat) {
        send(res, 404, { error: 'CATEGORY_NOT_FOUND', message: 'Kateqoriya tapılmadı' });
        return true;
      }
      try {
        const specService = new SpecTemplateService(draftDatabase.db);
        const includeInherited = url.searchParams.get('includeInherited') !== 'false';
        const templates = specService.getCategorySpecTemplates(categoryId, { includeInherited });
        const etag = generateCategoryEtag(currentCat);
        send(
          res,
          200,
          { ok: true, templates, category: currentCat },
          etag ? { ETag: etag } : {}
        );
      } catch (err) {
        send(res, 400, { error: 'SPEC_TEMPLATES_ERROR', message: err.message });
      }
      return true;
    }

    if (catSpecListMatch && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!checkPhase3Ready(res)) return true;
      const categoryId = catSpecListMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı xüsusiyyət şablonunun yaradılması üçün məcburidir.',
        });
        return true;
      }
      const taxService = new TaxonomyService(draftDatabase.db);
      const currentCat = taxService.getCategoryById(categoryId);
      if (!currentCat) {
        send(res, 404, { error: 'CATEGORY_NOT_FOUND', message: 'Kateqoriya tapılmadı' });
        return true;
      }
      if (!matchCategoryEtag(ifMatch, currentCat)) {
        send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Kateqoriya versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentCat.version,
          currentEtag: generateCategoryEtag(currentCat),
        });
        return true;
      }
      try {
        const body = await readBody(req);
        const parsed = CategorySpecTemplateSchema.parse(body);
        const specService = new SpecTemplateService(draftDatabase.db);
        const template = specService.setCategorySpecTemplate(categoryId, {
          ...parsed,
          actor: session.username || 'admin',
        });
        const freshCat = taxService.getCategoryById(categoryId);
        const etag = generateCategoryEtag(freshCat);
        send(
          res,
          201,
          { ok: true, template, category: freshCat },
          etag ? { ETag: etag } : {}
        );
      } catch (err) {
        send(res, 400, { error: 'SPEC_TEMPLATE_SAVE_ERROR', message: err.message });
      }
      return true;
    }

    const catSpecDeleteMatch = path.match(
      /^\/api\/admin\/categories\/([^/]+)\/spec-templates\/([^/]+)$/
    );
    if (catSpecDeleteMatch && req.method === 'DELETE') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!checkPhase3Ready(res)) return true;
      const categoryId = catSpecDeleteMatch[1];
      const templateId = catSpecDeleteMatch[2];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı xüsusiyyət şablonunun silinməsi üçün məcburidir.',
        });
        return true;
      }
      const taxService = new TaxonomyService(draftDatabase.db);
      const currentCat = taxService.getCategoryById(categoryId);
      if (!currentCat) {
        send(res, 404, { error: 'CATEGORY_NOT_FOUND', message: 'Kateqoriya tapılmadı' });
        return true;
      }
      if (!matchCategoryEtag(ifMatch, currentCat)) {
        send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Kateqoriya versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentCat.version,
          currentEtag: generateCategoryEtag(currentCat),
        });
        return true;
      }
      try {
        const specService = new SpecTemplateService(draftDatabase.db);
        const result = specService.deleteCategorySpecTemplate(categoryId, templateId, {
          actor: session.username || 'admin',
        });
        const freshCat = taxService.getCategoryById(categoryId);
        const etag = generateCategoryEtag(freshCat);
        send(
          res,
          200,
          { ok: true, ...result, category: freshCat },
          etag ? { ETag: etag } : {}
        );
      } catch (err) {
        send(res, 400, { error: 'SPEC_TEMPLATE_DELETE_ERROR', message: err.message });
      }
      return true;
    }

    // Hard delete disabled
    if (path.startsWith('/api/admin/categories') && req.method === 'DELETE') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      send(res, 405, {
        error: 'CATEGORY_HARD_DELETE_DISABLED',
        message:
          'Kateqoriyaların tam silinməsi qadağandır. Arxivləmə funksiyasından istifadə edin.',
      });
      return true;
    }

    // Navigation Admin Endpoints
    if (path === '/api/admin/navigation' && req.method === 'GET') {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      const placement = url.searchParams.get('placement') || null;
      const locale = url.searchParams.get('locale') || 'az';
      if (draftDatabase?.db && isPhase4NavigationReady(draftDatabase.db)) {
        const navService = new NavigationService(draftDatabase.db);
        const items = navService.getNavigationTree({ placement, locale, publicOnly: false });
        send(res, 200, { ok: true, items });
        return true;
      }
      let items = [...DEFAULT_NAVIGATION_SEED];
      if (placement) {
        items = items.filter((item) => item.placement === placement);
      }
      send(res, 200, { ok: true, items });
      return true;
    }

    if (path === '/api/admin/navigation' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!draftDatabase?.db || !isPhase4NavigationReady(draftDatabase.db)) {
        send(res, 400, {
          error: 'NAVIGATION_SCHEMA_NOT_READY',
          message: 'Navigation sxemi aktiv deyil',
        });
        return true;
      }
      const body = await readBody(req);
      const navService = new NavigationService(draftDatabase.db);
      try {
        const created = navService.createItem(body, session.user || 'admin');
        const etag = navService.generateEtag(created);
        send(res, 201, { ok: true, item: created }, etag ? { ETag: etag } : {});
      } catch (err) {
        send(res, 400, { error: 'NAVIGATION_CREATE_ERROR', message: err.message });
      }
      return true;
    }

    if (path === '/api/admin/navigation/reorder' && req.method === 'PUT') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!draftDatabase?.db || !isPhase4NavigationReady(draftDatabase.db)) {
        send(res, 400, {
          error: 'NAVIGATION_SCHEMA_NOT_READY',
          message: 'Navigation sxemi aktiv deyil',
        });
        return true;
      }
      const body = await readBody(req);
      const navService = new NavigationService(draftDatabase.db);
      try {
        const result = navService.reorderSiblings(body.items || [], session.user || 'admin');
        send(res, 200, { ok: true, ...result });
      } catch (err) {
        send(res, 400, { error: 'NAVIGATION_REORDER_ERROR', message: err.message });
      }
      return true;
    }

    if (
      path.startsWith('/api/admin/navigation/') &&
      req.method === 'PUT' &&
      !path.endsWith('/reorder')
    ) {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!draftDatabase?.db || !isPhase4NavigationReady(draftDatabase.db)) {
        send(res, 400, {
          error: 'NAVIGATION_SCHEMA_NOT_READY',
          message: 'Navigation sxemi aktiv deyil',
        });
        return true;
      }
      const id = path.replace('/api/admin/navigation/', '');
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'PRECONDITION_REQUIRED',
          message: 'If-Match başlığı tələb olunur',
        });
        return true;
      }
      if (ifMatch.trim() === '*' || ifMatch.trim() === '"*"') {
        send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Wildcard (*) If-Match qadağandır',
        });
        return true;
      }
      const navService = new NavigationService(draftDatabase.db);
      const current = navService.getItemById(id);
      if (!current) {
        send(res, 404, {
          error: 'ITEM_NOT_FOUND',
          message: 'Naviqasiya elementi tapılmadı',
        });
        return true;
      }
      if (!navService.matchEtag(ifMatch, current)) {
        send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Element başqa sessiya tərəfindən dəyişdirilib',
        });
        return true;
      }
      const body = await readBody(req);
      try {
        const updated = navService.updateItem(id, body, session.user || 'admin');
        const etag = navService.generateEtag(updated);
        send(res, 200, { ok: true, item: updated }, etag ? { ETag: etag } : {});
      } catch (err) {
        send(res, 400, { error: 'NAVIGATION_UPDATE_ERROR', message: err.message });
      }
      return true;
    }

    if (path.startsWith('/api/admin/navigation/') && req.method === 'DELETE') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!draftDatabase?.db || !isPhase4NavigationReady(draftDatabase.db)) {
        send(res, 400, {
          error: 'NAVIGATION_SCHEMA_NOT_READY',
          message: 'Navigation sxemi aktiv deyil',
        });
        return true;
      }
      const id = path.replace('/api/admin/navigation/', '');
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'PRECONDITION_REQUIRED',
          message: 'If-Match başlığı tələb olunur',
        });
        return true;
      }
      if (ifMatch.trim() === '*' || ifMatch.trim() === '"*"') {
        send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Wildcard (*) If-Match qadağandır',
        });
        return true;
      }
      const navService = new NavigationService(draftDatabase.db);
      const current = navService.getItemById(id);
      if (!current) {
        send(res, 404, {
          error: 'ITEM_NOT_FOUND',
          message: 'Naviqasiya elementi tapılmadı',
        });
        return true;
      }
      if (!navService.matchEtag(ifMatch, current)) {
        send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Element başqa sessiya tərəfindən dəyişdirilib',
        });
        return true;
      }
      try {
        const deleted = navService.deleteItem(id, session.user || 'admin');
        send(res, 200, { ok: true, item: deleted });
      } catch (err) {
        send(res, 400, { error: 'NAVIGATION_DELETE_ERROR', message: err.message });
      }
      return true;
    }

    // Brand Rail Admin Endpoints
    if (path === '/api/admin/brand-rail' && req.method === 'GET') {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      if (!draftDatabase?.db || !isPhase5BrandRailReady(draftDatabase.db)) {
        send(res, 400, {
          error: 'BRAND_RAIL_SCHEMA_NOT_READY',
          message: 'Brend lenti sxemi aktiv deyil',
        });
        return true;
      }
      const railService = new BrandRailService(draftDatabase.db);
      const settings = railService.getSettings();
      const items = railService.getItems(true);
      const revisions = railService.getRevisions(20);
      const etag = generateBrandRailEtag(settings);
      send(res, 200, { ok: true, settings, items, revisions }, etag ? { ETag: etag } : {});
      return true;
    }

    if (path === '/api/admin/brand-rail/settings' && req.method === 'PUT') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!draftDatabase?.db || !isPhase5BrandRailReady(draftDatabase.db)) {
        send(res, 400, {
          error: 'BRAND_RAIL_SCHEMA_NOT_READY',
          message: 'Brend lenti sxemi aktiv deyil',
        });
        return true;
      }
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        send(res, 428, {
          error: 'PRECONDITION_REQUIRED',
          message: 'If-Match başlığı tələb olunur',
        });
        return true;
      }
      if (ifMatch.trim() === '*' || ifMatch.trim() === '"*"') {
        send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Wildcard (*) If-Match qadağandır',
        });
        return true;
      }
      const body = await readBody(req);
      const railService = new BrandRailService(draftDatabase.db);
      try {
        const updated = railService.updateSettings(body, ifMatch, session.user || 'admin');
        const etag = generateBrandRailEtag(updated);
        send(res, 200, { ok: true, settings: updated }, etag ? { ETag: etag } : {});
      } catch (err) {
        send(res, err.statusCode || 400, {
          error: 'BRAND_RAIL_SETTINGS_UPDATE_ERROR',
          message: err.message,
        });
      }
      return true;
    }

    if (path === '/api/admin/brand-rail/items' && req.method === 'PUT') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!draftDatabase?.db || !isPhase5BrandRailReady(draftDatabase.db)) {
        send(res, 400, {
          error: 'BRAND_RAIL_SCHEMA_NOT_READY',
          message: 'Brend lenti sxemi aktiv deyil',
        });
        return true;
      }
      const body = await readBody(req);
      const railService = new BrandRailService(draftDatabase.db);
      try {
        const updatedItems = railService.updateItems(body.items || [], session.user || 'admin');
        send(res, 200, { ok: true, items: updatedItems });
      } catch (err) {
        send(res, 400, {
          error: 'BRAND_RAIL_ITEMS_UPDATE_ERROR',
          message: err.message,
        });
      }
      return true;
    }

    if (path === '/api/admin/brand-rail/publish' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      if (!draftDatabase?.db || !catalogDatabase?.db) {
        send(res, 500, { error: 'DATABASE_UNAVAILABLE', message: 'Baza əlçatan deyil' });
        return true;
      }
      const draftRail = new BrandRailService(draftDatabase.db);
      try {
        const result = draftRail.publishToPublicDb(catalogDatabase.db, session.user || 'admin');
        clearIsrCache();
        const userAgent = safeText(req.headers['user-agent'] || '', 300);
        draftDatabase.logAction({
          category: 'brand_rail',
          action: 'publish',
          title: 'Brend lenti ictimai yayıma verildi',
          details: `${result.itemCount} brend lenti dərc edildi`,
          ipAddress: session.ip,
          userAgent,
          status: 'success',
        });
        catalogDatabase.logAction({
          category: 'brand_rail',
          action: 'publish',
          title: 'Brend lenti ictimai yayıma verildi',
          details: `${result.itemCount} brend lenti dərc edildi`,
          ipAddress: session.ip,
          userAgent,
          status: 'success',
        });
        send(res, 200, { ok: true, ...result });
      } catch (err) {
        send(res, 500, { error: 'BRAND_RAIL_PUBLISH_ERROR', message: err.message });
      }
      return true;
    }

    if (path === '/api/admin/brand-rail/rollback' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      try {
        const body = await readBody(req);
        const versionOrId = body.version || body.revisionId;
        if (!versionOrId) {
          send(res, 400, {
            error: 'INVALID_REQUEST',
            message: 'Reviziya və ya versiya nömrəsi tələb olunur.',
          });
          return true;
        }
        const brandRailService = new BrandRailService(draftDatabase.db);
        const result = brandRailService.rollback(versionOrId, session.username || 'admin');
        const userAgent = safeText(req.headers['user-agent'] || '', 300);
        draftDatabase.logAction({
          category: 'brand_rail',
          action: 'rollback',
          title: 'Brend lenti əvvəlki versiyaya qaytarıldı',
          details: `Versiya: ${versionOrId}`,
          ipAddress: session.ip,
          userAgent,
          status: 'success',
        });
        send(res, 200, { ok: true, ...result });
      } catch (err) {
        const status = err.statusCode || 500;
        send(res, status, { error: 'BRAND_RAIL_ROLLBACK_ERROR', message: err.message });
      }
      return true;
    }

    // Postgres Copy Tooling Verification
    if (path === '/api/admin/postgres-verify' && req.method === 'GET') {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      const report = verifyPostgresCopyTooling(DATABASE_FILE);
      send(res, 200, report);
      return true;
    }

    return false;
  };
}
