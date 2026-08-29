import http from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCatalogDatabase } from './backend/catalogDatabase.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));

// Load .env file automatically
if (existsSync(join(ROOT, '.env'))) {
  try {
    const envContent = await readFile(join(ROOT, '.env'), 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (process.env[key] === undefined) process.env[key] = val;
      }
    }
  } catch {}
}

const DIST = join(ROOT, 'dist');
const DATA_DIR = resolve(process.env.DATA_DIR || join(ROOT, 'data'));
const CATALOG_FILE = join(DATA_DIR, 'catalog.json');
const ANALYTICS_FILE = join(DATA_DIR, 'analytics.json');
const DATABASE_FILE = join(DATA_DIR, 'catalog.sqlite');
const DRAFT_DATABASE_FILE = join(DATA_DIR, 'catalog-draft.sqlite');
const MEDIA_DIR = join(DATA_DIR, 'media');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_BODY = 8 * 1024 * 1024;
const MAX_MEDIA_BODY = 100 * 1024 * 1024;
const SESSION_TTL = 8 * 60 * 60 * 1000;
const generatedPassword = randomBytes(12).toString('base64url');
let adminPassword = process.env.ADMIN_PASSWORD || generatedPassword;
const sessions = new Map();
const loginAttempts = new Map();
const eventLimits = new Map();

const categorySeed = [
  ['hood', 'Aspiratorlar', 'Wind'],
  ['air_conditioner', 'Kondisionerlər', 'Snowflake'],
  ['microwave', 'Mikrodalğalı sobalar', 'Box'],
  ['cooktop', 'Bişirmə panelləri', 'Flame'],
  ['oven', 'Sobalar', 'Layers'],
  ['refrigerator', 'Soyuducular', 'Refrigerator'],
];

const baseBrands = [{
  id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'İtaliya',
  manufacturingCountries: ['Türkiyə', 'Çin'],
  description: 'İtalyan brendi. Orijinal dizayn və yüksək keyfiyyət standartları.',
  logo: '/media/brands/ardo-logo.png', active: true, comingSoon: false,
},
{ id: 'lotus', name: 'LOTUS', slug: 'lotus', originCountry: '', manufacturingCountries: [], description: '', logo: '/media/brands/lotus-mark.svg', active: true, comingSoon: true },
{ id: 'artel', name: 'ARTEL', slug: 'artel', originCountry: '', manufacturingCountries: [], description: '', logo: '/media/brands/artel-logo.svg', active: true, comingSoon: true }];

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
};

const send = (res, status, body, extra = {}) => {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    ...securityHeaders,
    'Content-Type': typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extra,
  });
  res.end(payload);
};

const remoteIp = (req) => {
  const socketIp = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  const forwarded = req.headers['x-forwarded-for'];
  if ((socketIp === '127.0.0.1' || socketIp === '::1') && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim().replace(/^::ffff:/, '');
  }
  return socketIp;
};
const isLocalNetwork = (req) => {
  const ip = remoteIp(req);
  if (ip === '127.0.0.1' || ip === '::1') return true;
  if (/^10\./.test(ip) || /^192\.168\./.test(ip)) return true;
  if (/^(fc|fd|fe80):/i.test(ip)) return true;
  const match = ip.match(/^172\.(\d+)\./);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
};

const parseCookies = (req) => Object.fromEntries(
  (req.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }),
);

const sessionFor = (req) => {
  const token = parseCookies(req).sahara_admin;
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now() || session.ip !== remoteIp(req)) {
    if (token) sessions.delete(token);
    return null;
  }
  session.expiresAt = Date.now() + SESSION_TTL;
  return session;
};

const requireAdmin = (req, res, csrf = false) => {
  if (!isLocalNetwork(req)) {
    send(res, 404, { error: 'Tapılmadı' });
    return null;
  }
  const session = sessionFor(req);
  if (!session) {
    send(res, 401, { error: 'Admin girişi tələb olunur' });
    return null;
  }
  if (csrf && req.headers['x-csrf-token'] !== session.csrfToken) {
    send(res, 403, { error: 'Təhlükəsizlik tokeni etibarsızdır' });
    return null;
  }
  return session;
};

const readBody = async (req) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error('Sorğu həddindən böyükdür');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const readBinaryBody = async (req) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_MEDIA_BODY) throw new Error('Media faylı 100 MB limitini aşır');
    chunks.push(chunk);
  }
  if (!chunks.length) throw new Error('Media faylı boşdur');
  return Buffer.concat(chunks);
};

const safeText = (value, max = 300) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const safePhone = (value) => {
  const text = safeText(value, 40);
  if (!text) return '';
  const digits = text.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) throw new Error('Telefon nömrəsi 7–15 rəqəmdən ibarət olmalıdır');
  return digits;
};
const validSlug = (value) => /^[a-z0-9][a-z0-9_-]{0,79}$/i.test(value);
const normalizeProduct = (product) => {
  const gallery = [...new Set([product.image, ...(Array.isArray(product.gallery) ? product.gallery : [])].filter(Boolean))];
  return {
    ...product,
    highlights: Array.isArray(product.highlights) ? product.highlights : [],
    specs: Array.isArray(product.specs) ? product.specs : [],
    brandId: product.brandId || 'ardo',
    gallery,
    media: Array.isArray(product.media) && product.media.length ? product.media : gallery.map((url, index) => ({
      id: `${product.id}-image-${index + 1}`, type: 'image', url, alt: `${product.title} — görüntü ${index + 1}`,
    })),
    manufacturingCountry: product.manufacturingCountry || '',
    status: product.status === 'draft' ? 'draft' : 'published',
  };
};

const seedCatalog = async () => {
  return {
    brands: baseBrands,
    categories: categorySeed.map(([id, name, icon], sortOrder) => ({ id, name, slug: id, icon, active: true, sortOrder })),
    products: [],
    settings: { whatsappNumber: '', phoneNumber: '' },
    updatedAt: new Date().toISOString(),
  };
};

const readLegacyJson = async (path, fallback) => {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return fallback; }
};

const validateCatalog = (body) => {
  if (!body || !Array.isArray(body.brands) || !Array.isArray(body.categories) || !Array.isArray(body.products)) throw new Error('Kataloq formatı düzgün deyil');
  if (body.brands.length > 100 || body.categories.length > 300 || body.products.length > 5000) throw new Error('Kataloq limitləri aşılıb');
  const unique = (list, label) => {
    const ids = new Set();
    for (const item of list) {
      if (!validSlug(item.id) || ids.has(item.id)) throw new Error(`${label} ID-ləri unikal və düzgün olmalıdır`);
      ids.add(item.id);
    }
  };
  unique(body.brands, 'Brend'); unique(body.categories, 'Kateqoriya'); unique(body.products, 'Məhsul');
  const brandIds = new Set(body.brands.map((item) => item.id));
  const categoryIds = new Set(body.categories.map((item) => item.id));
  const products = body.products.map((product) => {
    if (!safeText(product.title, 200) || !safeText(product.code, 100)) throw new Error('Məhsul adı və model kodu boş ola bilməz');
    if (!brandIds.has(product.brandId)) throw new Error(`Naməlum brend: ${product.brandId}`);
    if (!categoryIds.has(product.category)) throw new Error(`Naməlum kateqoriya: ${product.category}`);
    const media = Array.isArray(product.media) ? product.media.slice(0, 30).map((item, index) => ({
      id: safeText(item.id, 100) || `${product.id}-media-${index + 1}`,
      type: item.type === 'video' ? 'video' : 'image',
      url: safeText(item.url, 2000), alt: safeText(item.alt, 300), poster: safeText(item.poster, 2000),
    })).filter((item) => item.url) : [];
    return normalizeProduct({
      ...product,
      id: product.id, code: safeText(product.code, 100), title: safeText(product.title, 200),
      categoryName: safeText(product.categoryName, 150), shortDesc: safeText(product.shortDesc, 2000), media,
      highlights: Array.isArray(product.highlights) ? product.highlights.slice(0, 20).map((x) => safeText(x, 300)) : [],
      specs: Array.isArray(product.specs) ? product.specs.slice(0, 100).map((spec, index) => ({
        id: safeText(spec.id, 100) || `spec-${index + 1}`, name: safeText(spec.name, 200),
        value: safeText(spec.value, 1000), description: safeText(spec.description, 1000), group: safeText(spec.group, 100),
      })) : [],
      updatedAt: new Date().toISOString(),
    });
  });
    const rawPhoneList = Array.isArray(body.settings?.phoneNumbers) && body.settings.phoneNumbers.length
      ? body.settings.phoneNumbers
      : body.settings?.phoneNumber ? [body.settings.phoneNumber] : [];
    const cleanPhoneNumbers = rawPhoneList.map((p) => safeText(p, 40)).filter(Boolean);

    const countries = Array.isArray(body.settings?.countries) && body.settings.countries.length
      ? body.settings.countries.map((c) => safeText(c, 100)).filter(Boolean)
      : Array.isArray(body.countries) && body.countries.length
        ? body.countries.map((c) => safeText(c, 100)).filter(Boolean)
        : ['Türkiyə', 'Çin', 'İtaliya', 'Almaniya', 'Polşa', 'Özbəkistan'];

    const articles = Array.isArray(body.articles) && body.articles.length
      ? body.articles.map((art) => ({
          id: safeText(art.id, 100) || `art-${Date.now().toString(36)}`,
          title: safeText(art.title, 200),
          subtitle: safeText(art.subtitle, 500),
          badge: safeText(art.badge, 100),
          icon: safeText(art.icon, 50) || 'Zap',
          active: art.active !== false,
          advantages: Array.isArray(art.advantages) ? art.advantages.map((adv) => ({
            title: safeText(adv.title, 200),
            desc: safeText(adv.desc, 1000),
          })) : [],
        }))
      : undefined;

    return {
      brands: body.brands.map((brand) => ({
        id: brand.id, name: safeText(brand.name, 100), slug: safeText(brand.slug, 100) || brand.id,
        originCountry: safeText(brand.originCountry, 100),
        manufacturingCountries: Array.isArray(brand.manufacturingCountries) ? brand.manufacturingCountries.slice(0, 20).map((x) => safeText(x, 100)) : [],
        description: safeText(brand.description, 1000), logo: safeText(brand.logo, 2000), active: brand.active !== false, comingSoon: brand.comingSoon === true,
      })),
      categories: body.categories.map((category, index) => ({
        id: category.id, name: safeText(category.name, 150), slug: safeText(category.slug, 100) || category.id,
        icon: safeText(category.icon, 50), active: category.active !== false, sortOrder: Number(category.sortOrder ?? index),
      })),
      products,
      settings: {
        whatsappNumber: safeText(body.settings?.whatsappNumber, 40),
        phoneNumber: cleanPhoneNumbers[0] || safeText(body.settings?.phoneNumber, 40),
        phoneNumbers: cleanPhoneNumbers,
        companyName: safeText(body.settings?.companyName, 200) || 'Sahara Electronics',
        address: safeText(body.settings?.address, 500) || 'Bakı şəhəri, Sədərək Ticarət Mərkəzi',
        addresses: Array.isArray(body.settings?.addresses)
          ? body.settings.addresses.slice(0, 30).map((a, i) => ({
              id: safeText(a?.id, 50) || `addr-${i + 1}`,
              title: safeText(a?.title, 200) || `Filial ${i + 1}`,
              address: safeText(a?.address, 500),
              mapUrl: safeText(a?.mapUrl, 2000),
              workingHours: safeText(a?.workingHours, 300),
              note: safeText(a?.note, 1000),
            })).filter((a) => a.address)
          : [],
        email: safeText(body.settings?.email, 200) || 'info@saharaelectronics.az',
        workingHours: safeText(body.settings?.workingHours, 300) || 'Bazar ertəsi - Bazar: 09:00 - 18:00',
        mapUrl: safeText(body.settings?.mapUrl, 2000),
        locationNote: safeText(body.settings?.locationNote, 1000),
        countries,
        instagramUsername: safeText(body.settings?.instagramUsername, 100) || '@sahara.electronics',
        instagramUrl: safeText(body.settings?.instagramUrl, 1000) || 'https://instagram.com/sahara.electronics',
        facebookUsername: safeText(body.settings?.facebookUsername, 100) || 'Sahara Electronics',
        facebookUrl: safeText(body.settings?.facebookUrl, 1000) || 'https://facebook.com/saharaelectronics',
        siteTitle: safeText(body.settings?.siteTitle, 200) || 'Sahara Electronic – Məhsul Kataloqu',
        siteSubtitle: safeText(body.settings?.siteSubtitle, 300) || 'Məişət texnikası modelləri və zəmanətli satış mərkəzi',
        headerCaption: safeText(body.settings?.headerCaption, 100) || 'Rəsmi məhsul kataloqu',
        catalogHeading: safeText(body.settings?.catalogHeading, 150) || 'Bütün məhsullar',
        catalogSubheading: safeText(body.settings?.catalogSubheading, 300) || 'Modellərə və texniki xüsusiyyət sahələrinə baxın',
        heroBannerTitle: safeText(body.settings?.heroBannerTitle, 200) || 'Premium İtalyan ARDO & Məişət Texnikası',
        heroBannerSubtitle: safeText(body.settings?.heroBannerSubtitle, 400) || 'Eleqant dizayn, yüksək enerji səmərəliliyi və 3 ilə qədər rəsmi zəmanət',
        footerAbout: safeText(body.settings?.footerAbout, 1000) || 'Sahara Electronics rəsmi ARDO, Lotus və Artel məhsullarının zəmanətli satış mərkəzidir.',
        footerCopyright: safeText(body.settings?.footerCopyright, 200) || 'Bütün hüquqlar qorunur.',
        primaryColor: safeText(body.settings?.primaryColor, 30) || '#dc2626',
        fontFamily: safeText(body.settings?.fontFamily, 50) || 'Inter',
        whatsappButtonText: safeText(body.settings?.whatsappButtonText, 50) || 'WhatsApp',
        callButtonText: safeText(body.settings?.callButtonText, 50) || 'Zəng et',
        shareButtonText: safeText(body.settings?.shareButtonText, 50) || 'Paylaş',
        scrollTopButtonText: safeText(body.settings?.scrollTopButtonText, 50) || 'Yuxarı',
      },
      countries,
      articles,
      updatedAt: new Date().toISOString(),
    };
  };

await mkdir(DATA_DIR, { recursive: true });
const catalogDatabase = createCatalogDatabase(DATABASE_FILE);
if (catalogDatabase.isCatalogEmpty()) {
  const initialCatalog = existsSync(CATALOG_FILE)
    ? await readLegacyJson(CATALOG_FILE, await seedCatalog())
    : await seedCatalog();
  catalogDatabase.saveCatalog(validateCatalog(initialCatalog));
}
const draftDatabase = createCatalogDatabase(DRAFT_DATABASE_FILE);
if (draftDatabase.isCatalogEmpty()) draftDatabase.saveCatalog(catalogDatabase.getCatalog());
if (existsSync(ANALYTICS_FILE) && catalogDatabase.getAnalytics().catalogViews === 0) {
  catalogDatabase.importAnalytics(await readLegacyJson(ANALYTICS_FILE, {}));
}
for (const legacyFile of [CATALOG_FILE, ANALYTICS_FILE]) {
  if (existsSync(legacyFile)) await unlink(legacyFile);
}
const readCatalog = () => catalogDatabase.getCatalog();
const recordEvent = (event) => catalogDatabase.recordEvent(event);

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm' };
const uploadTypes = { 'image/jpeg': ['jpg', 'image'], 'image/png': ['png', 'image'], 'image/webp': ['webp', 'image'], 'video/mp4': ['mp4', 'video'], 'video/webm': ['webm', 'video'] };
const validMediaSignature = (buffer, contentType) => {
  if (contentType === 'image/jpeg') return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (contentType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if (contentType === 'image/webp') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  if (contentType === 'video/mp4') return buffer.subarray(4, 8).toString() === 'ftyp';
  if (contentType === 'video/webm') return buffer.subarray(0, 4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));
  return false;
};
const serveUploadedMedia = async (req, res, pathname) => {
  const fileName = decodeURIComponent(pathname.slice('/uploads/'.length));
  if (!/^[a-z0-9_-]+\.(jpg|png|webp|mp4|webm)$/i.test(fileName)) return send(res, 404, 'Tapılmadı');
  const filePath = join(MEDIA_DIR, fileName);
  let info;
  try { info = await stat(filePath); } catch { return send(res, 404, 'Tapılmadı'); }
  const contentType = mime[extname(filePath).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range?.match(/bytes=(\d+)-(\d*)/);
  if (range) {
    const start = Number(range[1]);
    const end = range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
    if (start > end || start >= info.size) return send(res, 416, 'Düzgün olmayan media intervalı', { 'Content-Range': `bytes */${info.size}` });
    res.writeHead(206, { ...securityHeaders, 'Content-Type': contentType, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${info.size}`, 'Content-Length': end - start + 1, 'Cache-Control': 'public, max-age=3600' });
    return createReadStream(filePath, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...securityHeaders, 'Content-Type': contentType, 'Content-Length': info.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=3600' });
  createReadStream(filePath).pipe(res);
};
const serveFile = async (res, pathname) => {
  const relative = pathname === '/' || pathname === '/AdministratorNT' ? 'index.html' : decodeURIComponent(pathname.slice(1));
  const target = resolve(DIST, normalize(relative));
  if (!target.startsWith(`${resolve(DIST)}/`) && target !== resolve(DIST, 'index.html')) return send(res, 404, 'Tapılmadı');
  let finalPath = target;
  try { if (!(await stat(finalPath)).isFile()) throw new Error(); }
  catch {
    if (extname(target)) return send(res, 404, 'Tapılmadı');
    finalPath = join(DIST, 'index.html');
  }
  res.writeHead(200, {
    ...securityHeaders,
    'Content-Type': mime[extname(finalPath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': finalPath.endsWith('index.html') ? 'no-cache' : finalPath.includes(`${join(DIST, 'assets')}/`) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
  });
  createReadStream(finalPath).pipe(res);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname.replace(/\/$/, '') || '/';
  try {
    if (path === '/api/health' && req.method === 'GET') {
      return send(res, 200, { app: 'sahara-catalog', status: 'ok', storage: 'sqlite', database: catalogDatabase.health() && draftDatabase.health() ? 'ok' : 'error' }, { 'Cache-Control': 'no-store' });
    }
    if (path === '/api/admin/media' && req.method === 'POST') {
      const session = requireAdmin(req, res, true); if (!session) return;
      const contentType = String(req.headers['content-type'] || '').split(';')[0].toLowerCase();
      const mediaInfo = uploadTypes[contentType];
      if (!mediaInfo) return send(res, 415, { error: 'Yalnız JPG, PNG, WEBP, MP4 və WEBM qəbul edilir' });
      const buffer = await readBinaryBody(req);
      if (!validMediaSignature(buffer, contentType)) return send(res, 415, { error: 'Fayl məzmunu seçilən media formatına uyğun deyil' });
      await mkdir(MEDIA_DIR, { recursive: true });
      const fileName = `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}.${mediaInfo[0]}`;
      await writeFile(join(MEDIA_DIR, fileName), buffer, { mode: 0o600 });
      return send(res, 201, { id: `media-${randomBytes(8).toString('hex')}`, type: mediaInfo[1], url: `/uploads/${fileName}`, alt: safeText(req.headers['x-media-alt'], 300) });
    }
    if (path === '/api/catalog' && req.method === 'GET') {
      const catalog = await readCatalog();
      return send(res, 200, {
        ...catalog,
        brands: catalog.brands.filter((item) => item.active),
        categories: catalog.categories.filter((item) => item.active),
        products: catalog.products.filter((item) => item.status !== 'draft'),
      }, { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' });
    }
    if (path === '/api/events' && req.method === 'POST') {
      const ip = remoteIp(req);
      const limit = eventLimits.get(ip) || { count: 0, resetAt: Date.now() + 60 * 60 * 1000 };
      if (limit.resetAt < Date.now()) { limit.count = 0; limit.resetAt = Date.now() + 60 * 60 * 1000; }
      if (limit.count >= 240) return send(res, 429, { error: 'Statistika limiti aşılıb' });
      limit.count += 1; eventLimits.set(ip, limit);
      const body = await readBody(req);
      if (['catalog_view', 'product_view', 'contact_whatsapp', 'contact_call'].includes(body.type)) {
        await recordEvent({ type: body.type, productId: safeText(body.productId, 80) });
      }
      return send(res, 202, { ok: true });
    }
    if (path === '/api/admin/login' && req.method === 'POST') {
      if (!isLocalNetwork(req)) return send(res, 404, { error: 'Tapılmadı' });
      const ip = remoteIp(req);
      const attempts = loginAttempts.get(ip) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 };
      if (attempts.resetAt < Date.now()) { attempts.count = 0; attempts.resetAt = Date.now() + 15 * 60 * 1000; }
      if (attempts.count >= 8) return send(res, 429, { error: 'Çoxsaylı uğursuz cəhd. 15 dəqiqə sonra yenidən yoxlayın.' });
      const { password = '' } = await readBody(req);
      const actual = createHash('sha256').update(String(password)).digest();
      const expected = createHash('sha256').update(adminPassword).digest();
      if (!timingSafeEqual(actual, expected)) {
        attempts.count += 1; loginAttempts.set(ip, attempts);
        return send(res, 401, { error: 'Şifrə yanlışdır' });
      }
      loginAttempts.delete(ip);
      const token = randomBytes(32).toString('base64url');
      const csrfToken = randomBytes(24).toString('base64url');
      sessions.set(token, { ip, csrfToken, expiresAt: Date.now() + SESSION_TTL });
      return send(res, 200, { ok: true, csrfToken }, {
        'Set-Cookie': `sahara_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}${req.socket.encrypted ? '; Secure' : ''}`,
      });
    }
    if (path === '/api/admin/data' && req.method === 'GET') {
      const session = requireAdmin(req, res); if (!session) return;
      const catalog = draftDatabase.getCatalog();
      const analytics = catalogDatabase.getAnalytics();
      return send(res, 200, { ...catalog, analytics, csrfToken: session.csrfToken });
    }
    if (path === '/api/admin/catalog' && req.method === 'PUT') {
      const session = requireAdmin(req, res, true); if (!session) return;
      const catalog = validateCatalog(await readBody(req));
      draftDatabase.saveCatalog(catalog);
      return send(res, 200, { ok: true, updatedAt: catalog.updatedAt });
    }
    if (path === '/api/admin/publish' && req.method === 'POST') {
      const session = requireAdmin(req, res, true); if (!session) return;
      const catalog = validateCatalog(draftDatabase.getCatalog());
      catalogDatabase.saveCatalog(catalog);
      return send(res, 200, { ok: true, updatedAt: catalog.updatedAt });
    }
    if (path === '/api/admin/change-password' && req.method === 'POST') {
      const session = requireAdmin(req, res, true); if (!session) return;
      const { oldPassword = '', newPassword = '' } = await readBody(req);
      if (!newPassword || newPassword.length < 6) {
        return send(res, 400, { error: 'Yeni şifrə ən azı 6 simvoldan ibarət olmalıdır' });
      }
      const actual = createHash('sha256').update(String(oldPassword)).digest();
      const expected = createHash('sha256').update(adminPassword).digest();
      if (!timingSafeEqual(actual, expected)) {
        return send(res, 401, { error: 'Köhnə şifrə yanlışdır' });
      }
      adminPassword = String(newPassword);
      process.env.ADMIN_PASSWORD = adminPassword;
      try {
        const envPath = join(ROOT, '.env');
        let envText = existsSync(envPath) ? await readFile(envPath, 'utf8') : '';
        if (envText.includes('ADMIN_PASSWORD=')) {
          envText = envText.replace(/ADMIN_PASSWORD=.*(\r?\n|$)/, `ADMIN_PASSWORD=${adminPassword}$1`);
        } else {
          envText += `\nADMIN_PASSWORD=${adminPassword}\n`;
        }
        await writeFile(envPath, envText, { mode: 0o600 });
      } catch (err) {
        console.error('Failed to update .env password:', err);
      }
      return send(res, 200, { ok: true });
    }
    if (path === '/api/admin/logout' && req.method === 'POST') {
      const session = requireAdmin(req, res, true); if (!session) return;
      sessions.delete(parseCookies(req).sahara_admin);
      return send(res, 200, { ok: true }, { 'Set-Cookie': 'sahara_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
    }
    if (path.startsWith('/api/')) return send(res, 404, { error: 'API ünvanı tapılmadı' });
    if (path.startsWith('/uploads/')) return serveUploadedMedia(req, res, path);
    if ((path === '/AdministratorNT' || path.startsWith('/AdministratorNT/')) && !isLocalNetwork(req)) return send(res, 404, 'Tapılmadı');
    return serveFile(res, path);
  } catch (error) {
    console.error(error);
    return send(res, error instanceof SyntaxError ? 400 : 500, { error: error.message || 'Server xətası' });
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} artıq istifadə olunur. ./start.sh boş portu avtomatik seçə bilər.`);
    catalogDatabase.close();
    draftDatabase.close();
    process.exitCode = 1;
    return;
  }
  console.error('Server başladılmadı:', error);
  catalogDatabase.close();
  process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
  console.log(`Sahara kataloq serveri: http://localhost:${PORT}`);
  if (!process.env.ADMIN_PASSWORD) console.log(`Bu sessiya üçün yaradılmış admin şifrəsi: ${generatedPassword}`);
});

setInterval(() => {
  for (const [token, session] of sessions) if (session.expiresAt < Date.now()) sessions.delete(token);
}, 60_000).unref();

const shutdown = () => server.close(() => {
  catalogDatabase.close();
  draftDatabase.close();
  process.exit(0);
});
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
