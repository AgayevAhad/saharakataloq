import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { auditUnassignedMedia } from '../backend/unassignedMediaAudit.mjs';
import { send, readBinaryBody, safeText, validMediaSignature } from './helpers.mjs';
import { requireAdmin } from './auth.mjs';

const mediaUploadTypes = {
  'image/jpeg': ['jpg', 'image'],
  'image/png': ['png', 'image'],
  'image/webp': ['webp', 'image'],
  'image/svg+xml': ['svg', 'image'],
  'video/mp4': ['mp4', 'video'],
  'video/webm': ['webm', 'video'],
};

const isMediaReferenced = (databaseFile, mediaUrl) => {
  if (!databaseFile || !existsSync(databaseFile)) return false;
  const db = new DatabaseSync(databaseFile, { readOnly: true });
  try {
    const hasTable = (name) =>
      Boolean(
        db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name)
      );
    if (hasTable('product_media')) {
      const mediaColumns = db
        .prepare("PRAGMA table_info('product_media')")
        .all()
        .map((column) => column.name);
      const urlColumns = ['url', 'original_url', 'poster'].filter((column) =>
        mediaColumns.includes(column)
      );
      if (urlColumns.length) {
        const condition = urlColumns.map((column) => `${column} = ?`).join(' OR ');
        if (
          db
            .prepare(`SELECT 1 FROM product_media WHERE ${condition} LIMIT 1`)
            .get(...urlColumns.map(() => mediaUrl))
        ) {
          return true;
        }
      }
    }
    if (!hasTable('products')) return false;
    const productColumns = db
      .prepare("PRAGMA table_info('products')")
      .all()
      .map((column) => column.name);
    const imageColumns = ['primary_image', 'original_image', 'image'].filter((column) =>
      productColumns.includes(column)
    );
    if (!imageColumns.length) return false;
    const condition = imageColumns.map((column) => `${column} = ?`).join(' OR ');
    return Boolean(
      db
        .prepare(`SELECT 1 FROM products WHERE ${condition} LIMIT 1`)
        .get(...imageColumns.map(() => mediaUrl))
    );
  } finally {
    db.close();
  }
};

export function createMediaRouter({
  sessions,
  MEDIA_DIR,
  DATABASE_FILE,
  DRAFT_DATABASE_FILE,
  ROOT,
}) {
  return async function handleMedia(req, res, path) {
    // Admin Media Upload
    if (path === '/api/admin/media' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      const contentType = String(req.headers['content-type'] || '')
        .split(';')[0]
        .toLowerCase();
      const mediaInfo = mediaUploadTypes[contentType];
      if (!mediaInfo) {
        send(res, 415, { error: 'Yalnız JPG, PNG, WEBP, SVG, MP4 və WEBM qəbul edilir' });
        return true;
      }
      const buffer = await readBinaryBody(req);
      if (!validMediaSignature(buffer, contentType)) {
        send(res, 415, { error: 'Fayl məzmunu seçilən media formatına uyğun deyil' });
        return true;
      }

      // Ölçü limiti: 20MB
      const MAX_BYTES = 20 * 1024 * 1024;
      if (buffer.length > MAX_BYTES) {
        send(res, 413, { error: 'Fayl həcmi 20MB-dan böyük ola bilməz' });
        return true;
      }

      await mkdir(MEDIA_DIR, { recursive: true });
      const ext = mediaInfo[0];
      const fileName = `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}.${ext}`;
      const filePath = join(MEDIA_DIR, fileName);

      try {
        await writeFile(filePath, buffer);
      } catch (writeErr) {
        console.error('[media] Fayl yazılarkən xəta:', writeErr);
        send(res, 500, { error: 'Fayl serverə yüklənərkən xəta baş verdi' });
        return true;
      }

      const rawOrigName = req.headers['x-original-name']
        ? decodeURIComponent(String(req.headers['x-original-name']))
        : req.headers['x-media-alt'];
      const originalName = safeText(rawOrigName, 300);
      send(res, 201, {
        id: `media-${randomBytes(8).toString('hex')}`,
        type: mediaInfo[1],
        url: `/uploads/${fileName}`,
        alt: safeText(req.headers['x-media-alt'], 300),
        originalName: originalName || fileName,
      });
      return true;
    }

    // Delete only server-generated, unlinked uploads. Product removal is committed first by the caller.
    if (path.startsWith('/api/admin/media/') && req.method === 'DELETE') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      let fileName = '';
      try {
        fileName = decodeURIComponent(path.slice('/api/admin/media/'.length));
      } catch {
        send(res, 400, { error: 'UPLOAD_FILE_NAME_INVALID' });
        return true;
      }
      if (!/^[a-z0-9]+-[a-f0-9]{16}\.(?:jpg|png|webp|svg|mp4|webm)$/i.test(fileName)) {
        send(res, 400, { error: 'UPLOAD_FILE_NAME_INVALID' });
        return true;
      }
      const mediaUrl = `/uploads/${fileName}`;
      if (
        isMediaReferenced(DATABASE_FILE, mediaUrl) ||
        isMediaReferenced(DRAFT_DATABASE_FILE, mediaUrl)
      ) {
        send(res, 409, { error: 'MEDIA_IS_STILL_IN_USE' });
        return true;
      }
      try {
        await unlink(join(MEDIA_DIR, fileName));
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
      send(res, 200, { ok: true, fileName });
      return true;
    }

    // Admin Unassigned Media Audit
    if (path === '/api/admin/media/unassigned' && req.method === 'GET') {
      const session = requireAdmin(req, res, sessions);
      if (!session) return true;
      const pubMediaDir = join(ROOT, 'public', 'media');
      const audit = auditUnassignedMedia(
        DATABASE_FILE,
        existsSync(pubMediaDir) ? pubMediaDir : MEDIA_DIR
      );
      send(res, 200, audit);
      return true;
    }

    return false;
  };
}
