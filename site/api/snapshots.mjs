import {
  send,
  readBody,
  safeText,
} from './helpers.mjs';
import { requireAdmin } from './auth.mjs';

export function createSnapshotsRouter({
  getCatalogDatabase,
  getDraftDatabase,
  sessions,
}) {
  return async function handleSnapshots(req, res, path, url) {
    const catalogDatabase = getCatalogDatabase();
    const draftDatabase = getDraftDatabase();

    // GET snapshots
    if (path === '/api/admin/snapshots' && req.method === 'GET') {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      const limit = Number(url.searchParams.get('limit') || 50);
      const offset = Number(url.searchParams.get('offset') || 0);
      const result = draftDatabase.getSnapshots({ limit, offset });
      send(res, 200, result);
      return true;
    }

    // POST create snapshot
    if (path === '/api/admin/snapshots' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      const body = await readBody(req);
      const name = safeText(body?.name, 120) || 'Əllə yaradılmış ehtiyat nüsxə';
      const snap = draftDatabase.createSnapshot({ name, createdBy: 'admin' });
      catalogDatabase.createSnapshot({ name, createdBy: 'admin' });
      const userAgent = safeText(req.headers['user-agent'] || '', 300);
      draftDatabase.logAction({
        category: 'system',
        action: 'snapshot_created',
        title: 'Kataloq ehtiyat nüsxəsi (Snapshot) yaradıldı',
        details: `Ad: "${name}", ${snap.productCount} məhsul`,
        ipAddress: session.ip,
        userAgent,
        status: 'success',
      });
      send(res, 200, { ok: true, snapshot: snap });
      return true;
    }

    // POST restore snapshot
    if (path === '/api/admin/snapshots/restore' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      const body = await readBody(req);
      const { id } = body || {};
      if (!id) {
        send(res, 400, { error: 'Nüsxə ID-si tələb olunur' });
        return true;
      }
      try {
        const restored = draftDatabase.restoreSnapshot(id);
        const userAgent = safeText(req.headers['user-agent'] || '', 300);
        draftDatabase.logAction({
          category: 'system',
          action: 'snapshot_restored',
          title: 'Kataloq əvvəlki nüsxədən bərpa edildi',
          details: `Nüsxə ID: ${id}, ${restored.products.length} məhsul`,
          ipAddress: session.ip,
          userAgent,
          status: 'warning',
        });
        send(res, 200, { ok: true, catalog: restored });
      } catch (err) {
        send(res, 404, { error: err.message || 'Nüsxə tapılmadı' });
      }
      return true;
    }

    // DELETE snapshot
    if (path.startsWith('/api/admin/snapshots/') && req.method === 'DELETE') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      const id = path.replace('/api/admin/snapshots/', '');
      draftDatabase.deleteSnapshot(id);
      catalogDatabase.deleteSnapshot(id);
      send(res, 200, { ok: true });
      return true;
    }

    return false;
  };
}
