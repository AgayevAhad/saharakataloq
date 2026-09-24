import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { auditUnassignedMedia } from '../backend/unassignedMediaAudit.mjs';
import {
  send,
  readBinaryBody,
  safeText,
  validMediaSignature,
} from './helpers.mjs';
import { requireAdmin } from './auth.mjs';

const mediaUploadTypes = {
  'image/jpeg': ['jpg', 'image'],
  'image/png': ['png', 'image'],
  'image/webp': ['webp', 'image'],
  'image/svg+xml': ['svg', 'image'],
  'video/mp4': ['mp4', 'video'],
  'video/webm': ['webm', 'video'],
};

export function createMediaRouter({
  sessions,
  MEDIA_DIR,
  DATABASE_FILE,
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
        send(res, 415, { error: 'Yalnız JPG, PNG, WEBP, MP4 və WEBM qəbul edilir' });
        return true;
      }
      const buffer = await readBinaryBody(req);
      if (!validMediaSignature(buffer, contentType)) {
        send(res, 415, { error: 'Fayl məzmunu seçilən media formatına uyğun deyil' });
        return true;
      }
      await mkdir(MEDIA_DIR, { recursive: true });
      const fileName = `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}.${mediaInfo[0]}`;
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
