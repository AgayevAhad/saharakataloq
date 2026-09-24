import { BrandRegistryService } from '../backend/brandRegistryService.mjs';
import { TaxonomyService } from '../backend/taxonomyService.mjs';
import { NavigationService } from '../backend/navigationService.mjs';
import {
  isPhase4NavigationReady,
  DEFAULT_NAVIGATION_SEED,
} from '../backend/phase4NavigationMigration.mjs';
import {
  isPhase5BrandRailReady,
} from '../backend/phase5BrandRailMigration.mjs';
import { BrandRailService } from '../backend/brandRailService.mjs';
import {
  send,
  remoteIp,
  isLocalNetwork,
  parseCookies,
  readBody,
  readChatAttachment,
  safeText,
} from './helpers.mjs';
import { requireCustomer, sessionFor } from './auth.mjs';

export function createCatalogRouter({
  catalogDatabase,
  draftDatabase,
  eventLimits,
  customerStore,
  sessions,
  readCatalog,
  readPublicCatalog,
  recordEvent,
  isMaintenanceActive,
}) {
  return async function handleCatalog(req, res, path, url) {
    // Public Health
    if (path === '/api/health' && req.method === 'GET') {
      const underMaintenance = isMaintenanceActive();
      send(
        res,
        underMaintenance ? 503 : 200,
        {
          app: 'sahara-catalog',
          status: underMaintenance ? 'maintenance' : 'ok',
          storage: 'sqlite',
          database:
            !underMaintenance && catalogDatabase.health() && draftDatabase.health()
              ? 'ok'
              : underMaintenance
                ? 'maintenance'
                : 'error',
        },
        { 'Cache-Control': 'no-store' }
      );
      return true;
    }

    // Public Catalog
    if (path === '/api/catalog' && req.method === 'GET') {
      send(res, 200, await readPublicCatalog(), {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      });
      return true;
    }

    // Public Brands
    if (path === '/api/brands' && req.method === 'GET') {
      if (catalogDatabase?.db) {
        const brandService = new BrandRegistryService(catalogDatabase.db);
        const brands = brandService.getPublicBrands();
        send(
          res,
          200,
          { brands },
          { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
        );
        return true;
      }
      const catalog = await readCatalog();
      send(
        res,
        200,
        {
          brands: catalog.brands.filter(
            (b) =>
              b.active &&
              (!b.verificationStatus ||
                b.verificationStatus === 'published' ||
                b.verificationStatus === 'legacy_unreviewed' ||
                b.verificationStatus === 'unverified')
          ),
        },
        { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
      );
      return true;
    }

    // Public Category Tree
    if (path === '/api/categories/tree' && req.method === 'GET') {
      if (catalogDatabase?.db) {
        const taxService = new TaxonomyService(catalogDatabase.db);
        const tree = taxService.getCategoryTree({ publicOnly: true });
        send(
          res,
          200,
          { tree },
          { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
        );
        return true;
      }
      const catalog = await readCatalog();
      send(
        res,
        200,
        { tree: catalog.categories.filter((c) => c.active) },
        { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
      );
      return true;
    }

    // Public Navigation
    if (path === '/api/navigation' && req.method === 'GET') {
      const placement = url.searchParams.get('placement') || null;
      const locale = url.searchParams.get('locale') || 'az';
      if (catalogDatabase?.db && isPhase4NavigationReady(catalogDatabase.db)) {
        const navService = new NavigationService(catalogDatabase.db);
        const items = navService.getNavigationTree({ placement, locale, publicOnly: true });
        send(
          res,
          200,
          { ok: true, items },
          { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
        );
        return true;
      }
      let items = DEFAULT_NAVIGATION_SEED.filter((i) => i.enabled && i.status === 'published');
      if (placement) {
        items = items.filter((i) => i.placement === placement);
      }
      if (locale) {
        items = items.filter((i) => i.locale === locale);
      }
      send(
        res,
        200,
        { ok: true, items },
        { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
      );
      return true;
    }

    // Public Brand Rail
    if (path === '/api/brand-rail' && req.method === 'GET') {
      if (catalogDatabase?.db && isPhase5BrandRailReady(catalogDatabase.db)) {
        const railService = new BrandRailService(catalogDatabase.db);
        const rail = railService.getPublicRail();
        send(
          res,
          200,
          { ok: true, ...rail },
          { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
        );
        return true;
      }
      send(res, 200, { ok: true, enabled: false, settings: null, items: [] });
      return true;
    }

    // Public Event Tracking
    if (path === '/api/events' && req.method === 'POST') {
      const ip = remoteIp(req);
      const limit = eventLimits.get(ip) || { count: 0, resetAt: Date.now() + 60 * 60 * 1000 };
      if (limit.resetAt < Date.now()) {
        limit.count = 0;
        limit.resetAt = Date.now() + 60 * 60 * 1000;
      }
      if (limit.count >= 240) {
        send(res, 429, { error: 'Statistika limiti aşılıb' });
        return true;
      }
      limit.count += 1;
      eventLimits.set(ip, limit);
      const body = await readBody(req);
      if (
        body &&
        ['catalog_view', 'product_view', 'contact_whatsapp', 'contact_call'].includes(body.type)
      ) {
        await recordEvent({ type: body.type, productId: safeText(body.productId, 80) });
      }
      send(res, 202, { ok: true });
      return true;
    }

    // Customer Chat Messages (GET)
    if (path === '/api/chat/messages' && req.method === 'GET') {
      const session = requireCustomer(req, res, customerStore);
      if (!session) return true;
      customerStore.markRead(session.user.id, 'admin');
      send(res, 200, { messages: customerStore.messages(session.user.id) });
      return true;
    }

    // Customer Chat Messages (POST)
    if (path === '/api/chat/messages' && req.method === 'POST') {
      const session = requireCustomer(req, res, customerStore, true);
      if (!session) return true;
      const body = await readBody(req);
      const result = customerStore.addMessage(
        session.user.id,
        'customer',
        body ? body.body : ''
      );
      if (result.error) {
        send(res, result.status, { error: result.error });
      } else {
        send(res, 201, result);
      }
      return true;
    }

    // Customer Chat Attachment (POST)
    if (path === '/api/chat/attachment' && req.method === 'POST') {
      const session = requireCustomer(req, res, customerStore, true);
      if (!session) return true;
      const media = await readChatAttachment(req);
      if (media.error) {
        send(res, 400, { error: media.error });
        return true;
      }
      const result = customerStore.addMessage(session.user.id, 'customer', '', media);
      if (result.error) {
        send(res, result.status, { error: result.error });
      } else {
        send(res, 201, result);
      }
      return true;
    }

    // Customer Chat Attachments (GET)
    if (path.startsWith('/api/chat/attachments/') && req.method === 'GET') {
      const id = path.slice('/api/chat/attachments/'.length);
      if (!/^attachment-[a-f0-9]{24}$/.test(id)) {
        send(res, 404, { error: 'Fayl tapılmadı' });
        return true;
      }
      const customerSession = customerStore.session(parseCookies(req).sahara_customer);
      const adminSession = isLocalNetwork(req) ? sessionFor(req, sessions) : null;
      if (!customerSession && !adminSession) {
        send(res, 401, { error: 'Giriş tələb olunur' });
        return true;
      }
      const media = customerStore.attachment(id, adminSession ? null : customerSession.user.id);
      if (!media) {
        send(res, 404, { error: 'Fayl tapılmadı' });
        return true;
      }
      res.writeHead(200, {
        'Content-Type': media.mime,
        'Content-Length': media.payload.length,
        'Cache-Control': 'private, no-store',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      });
      res.end(media.payload);
      return true;
    }

    return false;
  };
}
