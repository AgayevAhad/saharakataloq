import { readFile } from 'node:fs/promises';

export const MAX_BODY = 8 * 1024 * 1024;
export const MAX_MEDIA_BODY = 100 * 1024 * 1024;

export const send = (res, status, body, extra = {}) => {
  if (res.writableEnded || res.headersSent) return true;
  const isJson = typeof body === 'object' && body !== null && !Buffer.isBuffer(body);
  const payload = isJson ? JSON.stringify(body) : body || '';
  res.writeHead(status, {
    'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...extra,
  });
  res.end(payload);
  return true;
};

export const remoteIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    const clean = raw.trim();
    if (clean) return clean;
  }
  return req.socket.remoteAddress || '127.0.0.1';
};

export const isLocalNetwork = (req) => {
  const ip = remoteIp(req);
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') ||
    ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') ||
    ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') ||
    ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') ||
    ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  );
};

export const parseCookies = (req) =>
  (req.headers.cookie || '').split(';').reduce((acc, part) => {
    const [k, ...v] = part.trim().split('=');
    if (k) acc[k] = decodeURIComponent(v.join('='));
    return acc;
  }, {});

export const readBody = async (req) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error('BODY_TOO_LARGE');
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf-8');
  if (!text) return null;
  return JSON.parse(text);
};

export const readChatAttachment = async (req) => {
  const mimeType = String(req.headers['content-type'] || '')
    .split(';')[0]
    .toLowerCase();
  const allowed = {
    'image/jpeg': ['image', (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
    'image/png': [
      'image',
      (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ],
    'image/webp': [
      'image',
      (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP',
    ],
    'audio/webm': ['audio', (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))],
    'audio/ogg': ['audio', (b) => b.subarray(0, 4).toString() === 'OggS'],
    'audio/mp4': ['audio', (b) => b.subarray(4, 8).toString() === 'ftyp'],
  };
  const entry = allowed[mimeType];
  if (!entry) return { error: 'Yalnız şəkil və səs faylları qəbul edilir' };
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 6 * 1024 * 1024) return { error: 'Fayl 6 MB limitini aşır' };
    chunks.push(chunk);
  }
  const payload = Buffer.concat(chunks);
  if (!payload.length || !entry[1](payload)) return { error: 'Faylın formatı düzgün deyil' };
  return { mime: mimeType, kind: entry[0], payload };
};

export const readBinaryBody = async (req) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_MEDIA_BODY) throw new Error('MEDIA_TOO_LARGE');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

export const safeText = (value, max = 300) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export const _safePhone = (value) => {
  if (typeof value !== 'string') return '';
  const cleaned = value.replace(/[^\d+]/g, '').trim();
  return cleaned.slice(0, 30);
};

export const validSlug = (value) => /^[a-z0-9][a-z0-9_-]{0,79}$/i.test(value);

export const normalizeProduct = (product) => {
  const media = Array.isArray(product.media) ? product.media : [];
  const primaryMedia =
    media.find((m) => m && m.isPrimary) ||
    media.find((m) => m && m.type !== 'video') ||
    media[0] ||
    null;
  const image = typeof product.image === 'string' ? product.image.trim() : '';
  const gallery = Array.isArray(product.gallery)
    ? product.gallery.filter((item) => typeof item === 'string' && item.trim())
    : [];

  return {
    ...product,
    image: image || primaryMedia?.url || '',
    gallery: gallery.length ? gallery : media.map((m) => m.url).filter(Boolean),
    imagePosition: product.imagePosition || primaryMedia?.objectPosition || 'center',
    imageFit: product.imageFit || primaryMedia?.fitMode || 'contain',
    status: product.status || 'published',
  };
};

export const readLegacyJson = async (path, fallback) => {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const validateCatalog = (body) => {
  if (!body || typeof body !== 'object') return false;
  if (!Array.isArray(body.brands) || !Array.isArray(body.categories) || !Array.isArray(body.products))
    return false;
  return true;
};

export const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ico': 'image/x-icon',
};

export const uploadTypes = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

export const validMediaSignature = (buffer, contentType) => {
  if (!buffer || buffer.length < 12) return false;
  if (contentType === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (contentType === 'image/png')
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  if (contentType === 'image/webp')
    return (
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    );
  if (contentType === 'image/svg+xml') {
    const head = buffer.toString('utf-8', 0, Math.min(buffer.length, 512)).toLowerCase();
    return head.includes('<svg') || (head.includes('<?xml') && head.includes('<svg'));
  }
  if (contentType === 'video/mp4') {
    const brand = buffer.toString('ascii', 4, 8);
    return brand === 'ftyp';
  }
  if (contentType === 'video/webm') {
    return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
  }
  return false;
};
