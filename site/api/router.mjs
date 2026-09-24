import { createAuthRouter } from './auth.mjs';
import { createCatalogRouter } from './catalog.mjs';
import { createProductsRouter } from './products.mjs';
import { createMediaRouter } from './media.mjs';
import { createSnapshotsRouter } from './snapshots.mjs';
import { createSettingsRouter } from './settings.mjs';
import { send } from './helpers.mjs';

export function createApiRouter(context) {
  const authRouter = createAuthRouter(context);
  const catalogRouter = createCatalogRouter(context);
  const productsRouter = createProductsRouter(context);
  const mediaRouter = createMediaRouter(context);
  const snapshotsRouter = createSnapshotsRouter(context);
  const settingsRouter = createSettingsRouter(context);

  return async function handleApi(req, res, path, url) {
    if (context.isMaintenanceActive && context.isMaintenanceActive() && path !== '/api/health') {
      send(
        res,
        503,
        {
          error: 'SERVICE_UNDER_MAINTENANCE',
          message:
            'Sistemdə təhlükəsiz bazalararası yenilənmə aparılır. Zəhmət olmasa bir az sonra yenidən cəhd edin.',
        },
        { 'Retry-After': '5' }
      );
      return true;
    }

    // Try routers in sequence
    if (await authRouter(req, res, path, url)) return true;
    if (await catalogRouter(req, res, path, url)) return true;
    if (await productsRouter(req, res, path, url)) return true;
    if (await mediaRouter(req, res, path, url)) return true;
    if (await snapshotsRouter(req, res, path, url)) return true;
    if (await settingsRouter(req, res, path, url)) return true;

    if (res.writableEnded || res.headersSent) return true;

    // If no route matched, send 404
    return send(res, 404, { error: 'API ünvanı tapılmadı' });
  };
}
