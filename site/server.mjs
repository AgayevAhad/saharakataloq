import http from 'node:http';
import { chmodSync, copyFileSync, createReadStream, existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { createCatalogDatabase } from './backend/catalogDatabase.mjs';
import { validateAndResolveDataDir } from './backend/dataPathSecurity.mjs';
import {
  dryRunPimV2Migration,
  validateDryRunToken,
  validateCanonicalSchemaManifest,
  applyPimV2Schema,
  PIM_V2_MIGRATION_VERSION,
  MIGRATION_CHECKSUM,
} from './backend/pimV2Migration.mjs';
import { ProductRepository, ProductVersionConflictError } from './backend/productRepository.mjs';
import {
  executeStartupCrashRecovery,
  performCoordinatedCutover,
} from './backend/shadowCutover.mjs';
import { acquireMigrationLock, releaseMigrationLock } from './backend/migrationLock.mjs';
import { auditUnassignedMedia } from './backend/unassignedMediaAudit.mjs';
import { verifyPostgresCopyTooling } from './backend/postgresCopyVerify.mjs';
import {
  ScheduledPublicationWorker,
  MIN_COMPLETENESS_SCORE,
} from './backend/scheduledPublicationJob.mjs';
import {
  TaxonomyService,
  generateCategoryEtag,
  matchCategoryEtag,
  generateSiblingSetEtag,
  matchSiblingSetEtag,
} from './backend/taxonomyService.mjs';
import {
  BrandRegistryService,
  generateBrandEtag,
  matchBrandEtag,
} from './backend/brandRegistryService.mjs';
import { SpecTemplateService } from './backend/specTemplateService.mjs';
import { isPhase3SchemaReady } from './backend/phase3Migration.mjs';
import { NavigationService } from './backend/navigationService.mjs';
import {
  isPhase4NavigationReady,
  promotePhase4NavigationData,
  DEFAULT_NAVIGATION_SEED,
} from './backend/phase4NavigationMigration.mjs';
import {
  isPhase5BrandRailReady,
  applyPhase5BrandRailSchema,
  seedCanonical54Brands,
} from './backend/phase5BrandRailMigration.mjs';
import { BrandRailService, generateBrandRailEtag } from './backend/brandRailService.mjs';
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
} from './backend/schemas/phase3Schemas.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));

// Load .env if present and environment variables are not already set
const envFilePath = join(ROOT, '.env');
if (existsSync(envFilePath)) {
  try {
    const envContent = readFileSync(envFilePath, 'utf8');
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (key && !(key in process.env)) {
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    console.error('Failed to parse .env file:', err);
  }
}

const DATA_DIR = validateAndResolveDataDir(process.env.DATA_DIR);
const DIST = join(ROOT, 'dist');
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
const isGeneratedPassword = !process.env.ADMIN_PASSWORD;
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

const baseBrands = [
  {
    id: 'ardo',
    name: 'ARDO',
    slug: 'ardo',
    originCountry: 'İtaliya',
    manufacturingCountries: ['Türkiyə', 'Çin'],
    description: '',
    logo: '/media/brands/ardo-logo.png',
    active: true,
    comingSoon: false,
  },
  {
    id: 'lotus',
    name: 'LOTUS',
    slug: 'lotus',
    originCountry: '',
    manufacturingCountries: [],
    description: '',
    logo: '/media/brands/lotus-mark.svg',
    active: true,
    comingSoon: true,
  },
  {
    id: 'artel',
    name: 'ARTEL',
    slug: 'artel',
    originCountry: '',
    manufacturingCountries: [],
    description: '',
    logo: '/media/brands/artel-logo.svg',
    active: true,
    comingSoon: true,
  },
];

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
};

const send = (res, status, body, extra = {}) => {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    ...securityHeaders,
    'Content-Type':
      typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extra,
  });
  res.end(payload);
};

const remoteIp = (req) => {
  const socketIp = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  const forwarded = req.headers['x-forwarded-for'];
  if ((socketIp === '127.0.0.1' || socketIp === '::1') && typeof forwarded === 'string') {
    return forwarded
      .split(',')[0]
      .trim()
      .replace(/^::ffff:/, '');
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

const parseCookies = (req) =>
  Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
      })
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

const safeText = (value, max = 300) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';
const _safePhone = (value) => {
  const text = safeText(value, 40);
  if (!text) return '';
  const digits = text.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15)
    throw new Error('Telefon nömrəsi 7–15 rəqəmdən ibarət olmalıdır');
  return digits;
};
const validSlug = (value) => /^[a-z0-9][a-z0-9_-]{0,79}$/i.test(value);
const normalizeProduct = (product) => {
  const gallery = [
    ...new Set(
      [product.image, ...(Array.isArray(product.gallery) ? product.gallery : [])].filter(Boolean)
    ),
  ];
  return {
    ...product,
    highlights: Array.isArray(product.highlights) ? product.highlights : [],
    specs: Array.isArray(product.specs) ? product.specs : [],
    brandId: product.brandId || 'ardo',
    gallery,
    media:
      Array.isArray(product.media) && product.media.length
        ? product.media
        : gallery.map((url, index) => ({
            id: `${product.id}-image-${index + 1}`,
            type: 'image',
            url,
            alt: `${product.title} — görüntü ${index + 1}`,
          })),
    manufacturingCountry: product.manufacturingCountry || '',
    status: product.status === 'draft' ? 'draft' : 'published',
  };
};

const seedCatalog = async () => {
  return {
    brands: baseBrands,
    categories: categorySeed.map(([id, name, icon], sortOrder) => ({
      id,
      name,
      slug: id,
      icon,
      active: true,
      sortOrder,
    })),
    products: [],
    settings: { whatsappNumber: '', phoneNumber: '' },
    updatedAt: new Date().toISOString(),
  };
};

const readLegacyJson = async (path, fallback) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
};

const validateCatalog = (body) => {
  if (
    !body ||
    !Array.isArray(body.brands) ||
    !Array.isArray(body.categories) ||
    !Array.isArray(body.products)
  )
    throw new Error('Kataloq formatı düzgün deyil');
  if (body.brands.length > 100 || body.categories.length > 300 || body.products.length > 5000)
    throw new Error('Kataloq limitləri aşılıb');
  const unique = (list, label) => {
    const ids = new Set();
    for (const item of list) {
      if (!validSlug(item.id) || ids.has(item.id))
        throw new Error(`${label} ID-ləri unikal və düzgün olmalıdır`);
      ids.add(item.id);
    }
  };
  unique(body.brands, 'Brend');
  unique(body.categories, 'Kateqoriya');
  unique(body.products, 'Məhsul');
  const brandIds = new Set(body.brands.map((item) => item.id));
  const categoryIds = new Set(body.categories.map((item) => item.id));
  const products = body.products.map((product) => {
    if (!safeText(product.title, 200) || !safeText(product.code, 100))
      throw new Error('Məhsul adı və model kodu boş ola bilməz');
    if (!brandIds.has(product.brandId)) throw new Error(`Naməlum brend: ${product.brandId}`);
    if (!categoryIds.has(product.category))
      throw new Error(`Naməlum kateqoriya: ${product.category}`);
    const media = Array.isArray(product.media)
      ? product.media
          .slice(0, 30)
          .map((item, index) => ({
            id: safeText(item.id, 100) || `${product.id}-media-${index + 1}`,
            type: item.type === 'video' ? 'video' : 'image',
            url: safeText(item.url, 2000),
            alt: safeText(item.alt, 300),
            poster: safeText(item.poster, 2000),
          }))
          .filter((item) => item.url)
      : [];
    return normalizeProduct({
      ...product,
      id: product.id,
      code: safeText(product.code, 100),
      title: safeText(product.title, 200),
      categoryName: safeText(product.categoryName, 150),
      shortDesc: safeText(product.shortDesc, 2000),
      media,
      highlights: Array.isArray(product.highlights)
        ? product.highlights.slice(0, 20).map((x) => safeText(x, 300))
        : [],
      specs: Array.isArray(product.specs)
        ? product.specs.slice(0, 100).map((spec, index) => ({
            id: safeText(spec.id, 100) || `spec-${index + 1}`,
            name: safeText(spec.name, 200),
            value: safeText(spec.value, 1000),
            description: safeText(spec.description, 1000),
            group: safeText(spec.group, 100),
          }))
        : [],
      updatedAt: new Date().toISOString(),
    });
  });
  const rawPhoneList =
    Array.isArray(body.settings?.phoneNumbers) && body.settings.phoneNumbers.length
      ? body.settings.phoneNumbers
      : body.settings?.phoneNumber
        ? [body.settings.phoneNumber]
        : [];
  const cleanPhoneNumbers = rawPhoneList.map((p) => safeText(p, 40)).filter(Boolean);

  const countries =
    Array.isArray(body.settings?.countries) && body.settings.countries.length
      ? body.settings.countries.map((c) => safeText(c, 100)).filter(Boolean)
      : Array.isArray(body.countries) && body.countries.length
        ? body.countries.map((c) => safeText(c, 100)).filter(Boolean)
        : ['Türkiyə', 'Çin', 'İtaliya', 'Almaniya', 'Polşa', 'Özbəkistan'];

  const articles =
    Array.isArray(body.articles) && body.articles.length
      ? body.articles.map((art) => ({
          id: safeText(art.id, 100) || `art-${Date.now().toString(36)}`,
          title: safeText(art.title, 200),
          subtitle: safeText(art.subtitle, 500),
          badge: safeText(art.badge, 100),
          icon: safeText(art.icon, 50) || 'Zap',
          active: art.active !== false,
          advantages: Array.isArray(art.advantages)
            ? art.advantages.map((adv) => ({
                title: safeText(adv.title, 200),
                desc: safeText(adv.desc, 1000),
              }))
            : [],
        }))
      : undefined;

  return {
    brands: body.brands.map((brand) => ({
      id: brand.id,
      name: safeText(brand.name, 100),
      slug: safeText(brand.slug, 100) || brand.id,
      originCountry: safeText(brand.originCountry, 100),
      manufacturingCountries: Array.isArray(brand.manufacturingCountries)
        ? brand.manufacturingCountries.slice(0, 20).map((x) => safeText(x, 100))
        : [],
      description: safeText(brand.description, 1000),
      logo: safeText(brand.logo, 2000),
      active: brand.active !== false,
      comingSoon: brand.comingSoon === true,
    })),
    categories: body.categories.map((category, index) => ({
      id: category.id,
      name: safeText(category.name, 150),
      slug: safeText(category.slug, 100) || category.id,
      icon: safeText(category.icon, 50),
      active: category.active !== false,
      sortOrder: Number(category.sortOrder ?? index),
    })),
    products,
    settings: {
      whatsappNumber: safeText(body.settings?.whatsappNumber, 40),
      phoneNumber: cleanPhoneNumbers[0] || safeText(body.settings?.phoneNumber, 40),
      phoneNumbers: cleanPhoneNumbers,
      companyName: safeText(body.settings?.companyName, 200) || 'Sahara Electronics',
      address: safeText(body.settings?.address, 500) || '',
      addresses: Array.isArray(body.settings?.addresses)
        ? body.settings.addresses
            .slice(0, 30)
            .map((a, i) => ({
              id: safeText(a?.id, 50) || `addr-${i + 1}`,
              title: safeText(a?.title, 200) || `Filial ${i + 1}`,
              address: safeText(a?.address, 500),
              mapUrl: safeText(a?.mapUrl, 2000),
              workingHours: safeText(a?.workingHours, 300),
              note: safeText(a?.note, 1000),
            }))
            .filter((a) => a.address)
        : [],
      email: safeText(body.settings?.email, 200) || 'info@saharaelectronics.az',
      workingHours:
        safeText(body.settings?.workingHours, 300) || 'Bazar ertəsi - Bazar: 09:00 - 18:00',
      mapUrl: safeText(body.settings?.mapUrl, 2000),
      locationNote: safeText(body.settings?.locationNote, 1000),
      countries,
      instagramUsername: safeText(body.settings?.instagramUsername, 100) || '@sahara.electronics',
      instagramUrl:
        safeText(body.settings?.instagramUrl, 1000) || 'https://instagram.com/sahara.electronics',
      facebookUsername: safeText(body.settings?.facebookUsername, 100) || 'Sahara Electronics',
      facebookUrl:
        safeText(body.settings?.facebookUrl, 1000) || 'https://facebook.com/saharaelectronics',
      siteTitle: safeText(body.settings?.siteTitle, 200) || 'Sahara Electronic – Məhsul Kataloqu',
      siteSubtitle:
        safeText(body.settings?.siteSubtitle, 300) ||
        'Məişət texnikası modelləri və kataloq məlumatları',
      headerCaption: safeText(body.settings?.headerCaption, 100) || 'Məhsul kataloqu',
      catalogHeading: safeText(body.settings?.catalogHeading, 150) || 'Bütün məhsullar',
      catalogSubheading:
        safeText(body.settings?.catalogSubheading, 300) ||
        'Modellərə və texniki xüsusiyyət sahələrinə baxın',
      heroBannerTitle:
        safeText(body.settings?.heroBannerTitle, 200) || 'Sahara Electronics — Məhsul Kataloqu',
      heroBannerSubtitle:
        safeText(body.settings?.heroBannerSubtitle, 400) ||
        'Məişət və mətbəx texnikası modelləri, texniki parametrlər və rəsmi məhsul seçimi.',
      footerAbout:
        safeText(body.settings?.footerAbout, 1000) ||
        'Sahara Electronics ARDO, Lotus və Artel məhsullarının kataloqunu təqdim edir.',
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
const STAGING_DIR = join(DATA_DIR, '.migration-staging');
let startupRecoveryFailed = false;
let startupRecoveryError = null;

if (process.env.ENABLE_PIM_V2_LIVE_APPLY === 'true' && !process.env.PIM_TOKEN_SECRET) {
  startupRecoveryFailed = true;
  startupRecoveryError = 'PIM_TOKEN_SECRET is required when ENABLE_PIM_V2_LIVE_APPLY=true';
}

try {
  const recoveryResult = executeStartupCrashRecovery(DATA_DIR, STAGING_DIR);
  if (recoveryResult && recoveryResult.unrecoverable) {
    startupRecoveryFailed = true;
    startupRecoveryError = 'Unrecoverable crash state in migration journal';
  }
} catch (recoveryErr) {
  console.error('[Sahara Recovery] Startup recovery failed:', recoveryErr.message);
  startupRecoveryFailed = true;
  startupRecoveryError = recoveryErr.message;
}

if (startupRecoveryFailed) {
  globalThis.__SAHARA_FAIL_CLOSED__ = true;
}

let catalogDatabase = null;
let draftDatabase = null;
let pubWorker = null;

if (!startupRecoveryFailed) {
  catalogDatabase = createCatalogDatabase(DATABASE_FILE);
  if (catalogDatabase.isCatalogEmpty()) {
    const initialCatalog = existsSync(CATALOG_FILE)
      ? await readLegacyJson(CATALOG_FILE, await seedCatalog())
      : await seedCatalog();
    catalogDatabase.saveCatalog(validateCatalog(initialCatalog));
  }
  draftDatabase = createCatalogDatabase(DRAFT_DATABASE_FILE);
  if (draftDatabase.isCatalogEmpty()) draftDatabase.saveCatalog(catalogDatabase.getCatalog());
  if (existsSync(ANALYTICS_FILE) && catalogDatabase.getAnalytics().catalogViews === 0) {
    catalogDatabase.importAnalytics(await readLegacyJson(ANALYTICS_FILE, {}));
  }
  for (const legacyFile of [CATALOG_FILE, ANALYTICS_FILE]) {
    if (existsSync(legacyFile)) await unlink(legacyFile);
  }

  try {
    pubWorker = new ScheduledPublicationWorker({
      draftDb: draftDatabase.db,
      publicDb: catalogDatabase.db,
      minCompletenessScore: MIN_COMPLETENESS_SCORE,
    });
    try {
      pubWorker.processPendingJobs();
    } catch (procErr) {
      console.error('[Sahara Startup] Initial publication processing error:', procErr);
    }
    pubWorker.start(20000);
  } catch (workerErr) {
    console.error('[Sahara Startup] Worker initialization error:', workerErr);
  }

  try {
    if (draftDatabase?.db) {
      applyPhase5BrandRailSchema(draftDatabase.db);
      seedCanonical54Brands(draftDatabase.db);
    }
    if (catalogDatabase?.db) {
      applyPhase5BrandRailSchema(catalogDatabase.db);
      seedCanonical54Brands(catalogDatabase.db);
    }
  } catch (railInitErr) {
    console.error('[Sahara Startup] Brand rail schema initialization error:', railInitErr);
  }
}

const readCatalog = () =>
  catalogDatabase
    ? catalogDatabase.getCatalog()
    : { brands: [], categories: [], products: [], settings: {} };
const recordEvent = (event) =>
  catalogDatabase ? catalogDatabase.recordEvent(event) : Promise.resolve();

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};
const uploadTypes = {
  'image/jpeg': ['jpg', 'image'],
  'image/png': ['png', 'image'],
  'image/webp': ['webp', 'image'],
  'video/mp4': ['mp4', 'video'],
  'video/webm': ['webm', 'video'],
};
const validMediaSignature = (buffer, contentType) => {
  if (contentType === 'image/jpeg')
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (contentType === 'image/png')
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (contentType === 'image/webp')
    return (
      buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP'
    );
  if (contentType === 'video/mp4') return buffer.subarray(4, 8).toString() === 'ftyp';
  if (contentType === 'video/webm')
    return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  return false;
};
const serveUploadedMedia = async (req, res, pathname) => {
  const fileName = decodeURIComponent(pathname.slice('/uploads/'.length));
  if (!/^[a-z0-9_-]+\.(jpg|png|webp|mp4|webm)$/i.test(fileName)) return send(res, 404, 'Tapılmadı');
  const filePath = join(MEDIA_DIR, fileName);
  let info;
  try {
    info = await stat(filePath);
  } catch {
    return send(res, 404, 'Tapılmadı');
  }
  const contentType = mime[extname(filePath).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range?.match(/bytes=(\d+)-(\d*)/);
  if (range) {
    const start = Number(range[1]);
    const end = range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
    if (start > end || start >= info.size)
      return send(res, 416, 'Düzgün olmayan media intervalı', {
        'Content-Range': `bytes */${info.size}`,
      });
    res.writeHead(206, {
      ...securityHeaders,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${info.size}`,
      'Content-Length': end - start + 1,
      'Cache-Control': 'public, max-age=3600',
    });
    return createReadStream(filePath, { start, end }).pipe(res);
  }
  res.writeHead(200, {
    ...securityHeaders,
    'Content-Type': contentType,
    'Content-Length': info.size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600',
  });
  createReadStream(filePath).pipe(res);
};
const isrCache = new Map();
const ISR_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function clearIsrCache() {
  isrCache.clear();
}

const serveFile = async (res, pathname) => {
  const relative =
    pathname === '/' || pathname === '/AdministratorNT'
      ? 'index.html'
      : decodeURIComponent(pathname.slice(1));
  const target = resolve(DIST, normalize(relative));
  if (!target.startsWith(`${resolve(DIST)}/`) && target !== resolve(DIST, 'index.html'))
    return send(res, 404, 'Tapılmadı');
  let finalPath = target;
  let isIndexHtml = false;
  try {
    if (!(await stat(finalPath)).isFile()) throw new Error();
  } catch {
    if (extname(target)) return send(res, 404, 'Tapılmadı');
    finalPath = join(DIST, 'index.html');
    isIndexHtml = true;
  }
  if (finalPath.endsWith('index.html')) {
    isIndexHtml = true;
  }

  // SSR / ISR for public storefront HTML routes (Exclude Admin & Static Assets)
  if (isIndexHtml && !pathname.startsWith('/AdministratorNT')) {
    const isPublicRoute =
      pathname === '/' ||
      pathname === '/catalog' ||
      pathname === '/brands' ||
      pathname === '/stores' ||
      pathname === '/services' ||
      pathname === '/support' ||
      pathname.startsWith('/category/') ||
      pathname.startsWith('/brand/') ||
      pathname === '/404';

    if (isPublicRoute) {
      const catalogRev = catalogDatabase?.getCatalog
        ? catalogDatabase.getCatalog({ includeAll: false })?.updatedAt || 'v1'
        : 'v1';
      const cacheKey = `${pathname}:az:${catalogRev}`;
      const cached = isrCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < ISR_TTL_MS) {
        res.writeHead(200, {
          ...securityHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
          'X-SSR': 'isr-hit',
        });
        res.end(cached.html);
        return;
      }

      // Check if SSR server entry bundle exists
      const ssrBundlePath = join(DIST, 'server', 'entry-server.js');
      if (existsSync(ssrBundlePath)) {
        try {
          const { render } = await import(pathToFileURL(ssrBundlePath).href);
          const publicCatalog = catalogDatabase?.getCatalog
            ? catalogDatabase.getCatalog({ includeAll: false })
            : await readCatalog();

          let navItems = DEFAULT_NAVIGATION_SEED.filter(
            (i) => i.enabled && i.status === 'published'
          );
          if (catalogDatabase?.db && isPhase4NavigationReady(catalogDatabase.db)) {
            const navService = new NavigationService(catalogDatabase.db);
            navItems = navService.getNavigationTree({ publicOnly: true });
          }

          const initialData = {
            catalog: publicCatalog,
            navigation: navItems,
          };

          // Route meta context
          let pageTitle = 'Sahara Electronics — Rəsmi Məişət Texnikası Kataloqu';
          let pageDesc =
            'Sahara Electronics — ARDO, Lotus, Artel və digər rəsmi məişət texnikası brendlərinin tam kataloq və xüsusiyyət platforması.';
          let breadcrumbs = [{ label: 'Ana Səhifə', href: '/' }];

          if (pathname === '/catalog') {
            pageTitle = 'Məhsul Kataloqu — Sahara Electronics';
            breadcrumbs = [
              { label: 'Ana Səhifə', href: '/' },
              { label: 'Kataloq', href: '/catalog' },
            ];
          } else if (pathname === '/brands') {
            pageTitle = 'Brendlər — Sahara Electronics';
            breadcrumbs = [
              { label: 'Ana Səhifə', href: '/' },
              { label: 'Brendlər', href: '/brands' },
            ];
          } else if (pathname === '/stores') {
            pageTitle = 'Mağazalarımız və Filiallar — Sahara Electronics';
            breadcrumbs = [
              { label: 'Ana Səhifə', href: '/' },
              { label: 'Mağazalar', href: '/stores' },
            ];
          } else if (pathname === '/services') {
            pageTitle = 'Servis və Zəmanət — Sahara Electronics';
            breadcrumbs = [
              { label: 'Ana Səhifə', href: '/' },
              { label: 'Servis', href: '/services' },
            ];
          } else if (pathname === '/support') {
            pageTitle = 'Dəstək və Əlaqə — Sahara Electronics';
            breadcrumbs = [
              { label: 'Ana Səhifə', href: '/' },
              { label: 'Dəstək', href: '/support' },
            ];
          } else if (pathname.startsWith('/category/')) {
            const catSlug = pathname.replace('/category/', '');
            const cat = publicCatalog.categories?.find(
              (c) => c.id === catSlug || c.slug === catSlug
            );
            if (cat) {
              pageTitle = `${cat.name} — Sahara Electronics Kataloq`;
              breadcrumbs = [
                { label: 'Ana Səhifə', href: '/' },
                { label: 'Kataloq', href: '/catalog' },
                { label: cat.name, href: `/category/${cat.id}` },
              ];
            }
          } else if (pathname.startsWith('/brand/')) {
            const bSlug = pathname.replace('/brand/', '');
            const br = publicCatalog.brands?.find(
              (b) => b.id === bSlug || b.name.toLowerCase() === bSlug.toLowerCase()
            );
            if (br) {
              pageTitle = `${br.name} Məişət Texnikası — Sahara Electronics`;
              breadcrumbs = [
                { label: 'Ana Səhifə', href: '/' },
                { label: 'Brendlər', href: '/brands' },
                { label: br.name, href: `/brand/${br.id || br.name}` },
              ];
            }
          }

          const rendered = render(pathname, {
            url: pathname,
            data: initialData,
            title: pageTitle,
            description: pageDesc,
            breadcrumbs,
          });

          let html = await readFile(finalPath, 'utf8');
          if (rendered.headTags) {
            html = html.replace('</head>', `${rendered.headTags}\n</head>`);
          }
          const sanitizedInitialData = JSON.stringify(initialData).replace(/</g, '\\u003c');
          const scriptInjection = `<script type="application/json" id="__SAHARA_DATA__">${sanitizedInitialData}</script>`;
          html = html.replace(
            '<div id="root"></div>',
            `${scriptInjection}\n<div id="root">${rendered.html}</div>`
          );

          isrCache.set(cacheKey, { html, timestamp: Date.now() });

          res.writeHead(200, {
            ...securityHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
            'X-SSR': 'rendered',
          });
          res.end(html);
          return;
        } catch (ssrErr) {
          console.error('SSR render failed, falling back to static SPA index.html:', ssrErr);
        }
      }
    }
  }

  res.writeHead(200, {
    ...securityHeaders,
    'Content-Type': mime[extname(finalPath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': finalPath.endsWith('index.html')
      ? 'no-cache'
      : finalPath.includes(`${join(DIST, 'assets')}/`)
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600',
  });
  createReadStream(finalPath).pipe(res);
};

let activeRequestsCount = 0;

export async function waitForActiveRequestsDrain(timeoutMs = 5000) {
  const start = Date.now();
  // Note: the apply endpoint request itself is 1 active request, so activeRequestsCount > 1 means there are other in-flight requests.
  while (activeRequestsCount > 1 && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 20));
  }
  const drained = activeRequestsCount <= 1;
  return { drained, remainingCount: Math.max(0, activeRequestsCount - 1) };
}

const server = http.createServer(async (req, res) => {
  activeRequestsCount++;
  let decremented = false;
  const decrement = () => {
    if (!decremented) {
      decremented = true;
      activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    }
  };
  res.on('finish', decrement);
  res.on('close', decrement);

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname.replace(/\/$/, '') || '/';
  try {
    if (globalThis.__SAHARA_FAIL_CLOSED__) {
      if (path === '/api/health') {
        return send(
          res,
          503,
          {
            app: 'sahara-catalog',
            status: 'error',
            storage: 'sqlite',
            database: 'unrecoverable_crash',
            details: startupRecoveryError,
          },
          { 'Cache-Control': 'no-store' }
        );
      }
      return send(
        res,
        503,
        {
          error: 'DATABASE_RECOVERY_FAILED',
          message:
            'Verilənlər bazası bərpası uğursuz oldu. Təhlükəsizlik məqsədilə server Fail-Closed rejimindədir.',
          details: startupRecoveryError,
        },
        { 'Retry-After': '10' }
      );
    }

    const isMaintenanceActive = () => {
      if (globalThis.__SAHARA_MAINTENANCE__) return true;
      const journalFile = join(STAGING_DIR, 'migration_journal.json');
      if (existsSync(journalFile)) {
        try {
          const raw = JSON.parse(readFileSync(journalFile, 'utf8'));
          if (raw?.state && raw.state !== 'COMMITTED' && raw.state !== 'ROLLED_BACK') {
            return true;
          }
        } catch {}
      }
      return false;
    };

    if (path.startsWith('/api/') && path !== '/api/health' && isMaintenanceActive()) {
      return send(
        res,
        503,
        {
          error: 'SERVICE_UNDER_MAINTENANCE',
          message:
            'Sistemdə təhlükəsiz bazalararası yenilənmə aparılır. Zəhmət olmasa bir az sonra yenidən cəhd edin.',
        },
        { 'Retry-After': '5' }
      );
    }

    if (path === '/api/health' && req.method === 'GET') {
      const underMaintenance = isMaintenanceActive();
      return send(
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
    }
    if (path === '/api/admin/media' && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      const contentType = String(req.headers['content-type'] || '')
        .split(';')[0]
        .toLowerCase();
      const mediaInfo = uploadTypes[contentType];
      if (!mediaInfo)
        return send(res, 415, { error: 'Yalnız JPG, PNG, WEBP, MP4 və WEBM qəbul edilir' });
      const buffer = await readBinaryBody(req);
      if (!validMediaSignature(buffer, contentType))
        return send(res, 415, { error: 'Fayl məzmunu seçilən media formatına uyğun deyil' });
      await mkdir(MEDIA_DIR, { recursive: true });
      const fileName = `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}.${mediaInfo[0]}`;
      const rawOrigName = req.headers['x-original-name']
        ? decodeURIComponent(String(req.headers['x-original-name']))
        : req.headers['x-media-alt'];
      const originalName = safeText(rawOrigName, 300);
      return send(res, 201, {
        id: `media-${randomBytes(8).toString('hex')}`,
        type: mediaInfo[1],
        url: `/uploads/${fileName}`,
        alt: safeText(req.headers['x-media-alt'], 300),
        originalName: originalName || fileName,
      });
    }
    if (path === '/api/catalog' && req.method === 'GET') {
      const catalog = await readCatalog();
      const activeBrands = catalog.brands.filter(
        (item) =>
          item.active &&
          (!item.verificationStatus ||
            item.verificationStatus === 'published' ||
            item.verificationStatus === 'legacy_unreviewed')
      );
      const comingSoonBrandIds = new Set(activeBrands.filter((b) => b.comingSoon).map((b) => b.id));
      return send(
        res,
        200,
        {
          ...catalog,
          brands: activeBrands,
          categories: catalog.categories.filter((item) => item.active && !item.isArchived),
          products: catalog.products.filter(
            (item) => item.status !== 'draft' && !comingSoonBrandIds.has(item.brandId)
          ),
        },
        { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
      );
    }
    if (path === '/api/brands' && req.method === 'GET') {
      if (catalogDatabase?.db) {
        const brandService = new BrandRegistryService(catalogDatabase.db);
        const brands = brandService.getPublicBrands();
        return send(
          res,
          200,
          { brands },
          { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
        );
      }
      const catalog = await readCatalog();
      return send(
        res,
        200,
        {
          brands: catalog.brands.filter(
            (b) =>
              b.active &&
              (!b.verificationStatus ||
                b.verificationStatus === 'published' ||
                b.verificationStatus === 'legacy_unreviewed')
          ),
        },
        { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
      );
    }
    if (path === '/api/categories/tree' && req.method === 'GET') {
      if (catalogDatabase?.db) {
        const taxService = new TaxonomyService(catalogDatabase.db);
        const tree = taxService.getCategoryTree({ publicOnly: true });
        return send(
          res,
          200,
          { tree },
          { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
        );
      }
      const catalog = await readCatalog();
      return send(
        res,
        200,
        { tree: catalog.categories.filter((c) => c.active) },
        { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
      );
    }
    if (path === '/api/navigation' && req.method === 'GET') {
      const placement = url.searchParams.get('placement') || null;
      const locale = url.searchParams.get('locale') || 'az';
      if (catalogDatabase?.db && isPhase4NavigationReady(catalogDatabase.db)) {
        const navService = new NavigationService(catalogDatabase.db);
        const items = navService.getNavigationTree({ placement, locale, publicOnly: true });
        return send(
          res,
          200,
          { ok: true, items },
          { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
        );
      }
      let items = DEFAULT_NAVIGATION_SEED.filter((i) => i.enabled && i.status === 'published');
      if (placement) {
        items = items.filter((i) => i.placement === placement);
      }
      if (locale) {
        items = items.filter((i) => i.locale === locale);
      }
      return send(
        res,
        200,
        { ok: true, items },
        { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
      );
    }
    if (path === '/api/brand-rail' && req.method === 'GET') {
      if (catalogDatabase?.db && isPhase5BrandRailReady(catalogDatabase.db)) {
        const railService = new BrandRailService(catalogDatabase.db);
        const rail = railService.getPublicRail();
        return send(
          res,
          200,
          { ok: true, ...rail },
          { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
        );
      }
      return send(res, 200, { ok: true, enabled: false, settings: null, items: [] });
    }
    if (path === '/api/events' && req.method === 'POST') {
      const ip = remoteIp(req);
      const limit = eventLimits.get(ip) || { count: 0, resetAt: Date.now() + 60 * 60 * 1000 };
      if (limit.resetAt < Date.now()) {
        limit.count = 0;
        limit.resetAt = Date.now() + 60 * 60 * 1000;
      }
      if (limit.count >= 240) return send(res, 429, { error: 'Statistika limiti aşılıb' });
      limit.count += 1;
      eventLimits.set(ip, limit);
      const body = await readBody(req);
      if (
        ['catalog_view', 'product_view', 'contact_whatsapp', 'contact_call'].includes(body.type)
      ) {
        await recordEvent({ type: body.type, productId: safeText(body.productId, 80) });
      }
      return send(res, 202, { ok: true });
    }
    if (path === '/api/admin/login' && req.method === 'POST') {
      if (!isLocalNetwork(req)) return send(res, 404, { error: 'Tapılmadı' });
      const ip = remoteIp(req);
      const attempts = loginAttempts.get(ip) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 };
      if (attempts.resetAt < Date.now()) {
        attempts.count = 0;
        attempts.resetAt = Date.now() + 15 * 60 * 1000;
      }
      if (attempts.count >= 8)
        return send(res, 429, {
          error: 'Çoxsaylı uğursuz cəhd. 15 dəqiqə sonra yenidən yoxlayın.',
        });
      const { password = '' } = await readBody(req);
      const actual = createHash('sha256').update(String(password)).digest();
      const expected = createHash('sha256').update(adminPassword).digest();
      const userAgent = safeText(req.headers['user-agent'] || '', 300);
      if (!timingSafeEqual(actual, expected)) {
        attempts.count += 1;
        loginAttempts.set(ip, attempts);
        draftDatabase.logAction({
          category: 'auth',
          action: 'login_failed',
          title: 'Uğursuz giriş cəhdi',
          details: 'Yanlış şifrə daxil edildi',
          ipAddress: ip,
          userAgent,
          status: 'danger',
        });
        return send(res, 401, { error: 'Şifrə yanlışdır' });
      }
      loginAttempts.delete(ip);
      const token = randomBytes(32).toString('base64url');
      const csrfToken = randomBytes(24).toString('base64url');
      sessions.set(token, { ip, csrfToken, expiresAt: Date.now() + SESSION_TTL });
      draftDatabase.logAction({
        category: 'auth',
        action: 'login_success',
        title: 'Admin panelə uğurlu giriş',
        details: 'Yeni idarəetmə sessiyası başlandı',
        ipAddress: ip,
        userAgent,
        status: 'success',
      });
      return send(
        res,
        200,
        { ok: true, csrfToken },
        {
          'Set-Cookie': `sahara_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}${req.socket.encrypted ? '; Secure' : ''}`,
        }
      );
    }
    if (path === '/api/admin/session' && req.method === 'GET') {
      if (!isLocalNetwork(req)) return send(res, 404, { error: 'Tapılmadı' });
      const session = sessionFor(req);
      if (!session) {
        return send(res, 200, { authenticated: false });
      }
      return send(res, 200, { authenticated: true, csrfToken: session.csrfToken });
    }
    if (path === '/api/admin/data' && req.method === 'GET') {
      const session = requireAdmin(req, res);
      if (!session) return;
      const catalog = draftDatabase.getAdminData
        ? draftDatabase.getAdminData()
        : draftDatabase.getCatalog({ includeAll: true });
      const analytics = catalogDatabase.getAnalytics();
      return send(res, 200, { ...catalog, analytics, csrfToken: session.csrfToken });
    }
    if (path === '/api/admin/analytics' && req.method === 'GET') {
      const session = requireAdmin(req, res);
      if (!session) return;
      const range = url.searchParams.get('range') || 'all';
      const from = url.searchParams.get('from') || undefined;
      const to = url.searchParams.get('to') || undefined;
      const filtered = catalogDatabase.getFilteredAnalytics({ range, fromDate: from, toDate: to });
      return send(res, 200, filtered);
    }
    if (path === '/api/admin/logs' && req.method === 'GET') {
      const session = requireAdmin(req, res);
      if (!session) return;
      const category = url.searchParams.get('category') || 'all';
      const search = url.searchParams.get('search') || '';
      const limit = Number(url.searchParams.get('limit') || 100);
      const offset = Number(url.searchParams.get('offset') || 0);
      const result = draftDatabase.getLogs({ category, search, limit, offset });
      return send(res, 200, result);
    }
    if (path === '/api/admin/logs/clear' && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
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
      return send(res, 200, { ok: true });
    }
    if (path === '/api/admin/logs/export' && req.method === 'GET') {
      const session = requireAdmin(req, res);
      if (!session) return;
      const format = url.searchParams.get('format') || 'csv';
      const category = url.searchParams.get('category') || 'all';
      const result = draftDatabase.getLogs({ category, limit: 5000, offset: 0 });
      if (format === 'json') {
        res.writeHead(200, {
          ...securityHeaders,
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="sahara-audit-logs-${Date.now()}.json"`,
        });
        return res.end(JSON.stringify(result.logs, null, 2));
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
        ...securityHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="sahara-audit-logs-${Date.now()}.csv"`,
      });
      return res.end(csvRows.join('\n'));
    }

    // ==========================================
    // Phase 3: Brand Registry & Taxonomy Endpoints
    // ==========================================
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

    if (path === '/api/admin/brands' && req.method === 'GET') {
      const session = requireAdmin(req, res);
      if (!session) return;
      const status = url.searchParams.get('status') || undefined;
      const search = url.searchParams.get('search') || undefined;
      const includeArchived = url.searchParams.get('includeArchived') === 'true';
      const brandService = new BrandRegistryService(draftDatabase.db);
      const brands = brandService.getAdminBrands({ status, search, includeArchived });
      return send(res, 200, { ok: true, brands });
    }

    if (path === '/api/admin/brands/candidates' && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!checkPhase3Ready(res)) return;
      try {
        const body = await readBody(req);
        const brandService = new BrandRegistryService(draftDatabase.db);
        if (Array.isArray(body.candidates)) {
          const parsed = BrandCandidateBatchSchema.parse(body);
          const result = brandService.importCandidateBatch(parsed.candidates, {
            actor: session.username || 'admin',
          });
          return send(res, 201, { ok: true, ...result });
        }
        const parsed = BrandCandidateCreateSchema.parse(body);
        const brand = brandService.addCandidateBrand({
          ...parsed,
          actor: session.username || 'admin',
        });
        const etag = generateBrandEtag(brand);
        return send(res, 201, { ok: true, brand }, etag ? { ETag: etag } : {});
      } catch (err) {
        console.error('[BRAND_CANDIDATE_ERROR]', err);
        return send(res, 400, { error: 'BRAND_CANDIDATE_ERROR', message: err.message });
      }
    }

    const brandSrcMatch = path.match(/^\/api\/admin\/brands\/([^/]+)\/sources$/);
    if (brandSrcMatch && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!checkPhase3Ready(res)) return;
      const brandId = brandSrcMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı mənbə əlavə edilməsi üçün məcburidir.',
        });
      }
      const brandService = new BrandRegistryService(draftDatabase.db);
      const currentBrand = brandService.getBrandById(brandId);
      if (!currentBrand) {
        return send(res, 404, { error: 'BRAND_NOT_FOUND', message: 'Brend tapılmadı' });
      }
      if (!matchBrandEtag(ifMatch, currentBrand)) {
        return send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Brend versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentBrand.version,
          currentEtag: generateBrandEtag(currentBrand),
        });
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
        return send(res, 201, { ok: true, source, brand: freshBrand }, etag ? { ETag: etag } : {});
      } catch (err) {
        return send(res, 400, { error: 'BRAND_SOURCE_ERROR', message: err.message });
      }
    }

    const brandSrcStatusMatch = path.match(
      /^\/api\/admin\/brands\/([^/]+)\/sources\/([^/]+)\/status$/
    );
    if (brandSrcStatusMatch && req.method === 'PUT') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!checkPhase3Ready(res)) return;
      const brandId = brandSrcStatusMatch[1];
      const sourceId = brandSrcStatusMatch[2];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı mənbə statusunun yenilənməsi üçün məcburidir.',
        });
      }
      const brandService = new BrandRegistryService(draftDatabase.db);
      const currentBrand = brandService.getBrandById(brandId);
      if (!currentBrand) {
        return send(res, 404, { error: 'BRAND_NOT_FOUND', message: 'Brend tapılmadı' });
      }
      if (!matchBrandEtag(ifMatch, currentBrand)) {
        return send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Brend versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentBrand.version,
          currentEtag: generateBrandEtag(currentBrand),
        });
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
        return send(
          res,
          200,
          { ok: true, source: updated, brand: freshBrand },
          etag ? { ETag: etag } : {}
        );
      } catch (err) {
        return send(res, 400, { error: 'BRAND_SOURCE_STATUS_ERROR', message: err.message });
      }
    }

    const brandAliasMatch = path.match(/^\/api\/admin\/brands\/([^/]+)\/aliases$/);
    if (brandAliasMatch && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!checkPhase3Ready(res)) return;
      const brandId = brandAliasMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı ləqəb əlavə edilməsi üçün məcburidir.',
        });
      }
      const brandService = new BrandRegistryService(draftDatabase.db);
      const currentBrand = brandService.getBrandById(brandId);
      if (!currentBrand) {
        return send(res, 404, { error: 'BRAND_NOT_FOUND', message: 'Brend tapılmadı' });
      }
      if (!matchBrandEtag(ifMatch, currentBrand)) {
        return send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Brend versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentBrand.version,
          currentEtag: generateBrandEtag(currentBrand),
        });
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
        return send(res, 201, { ok: true, alias, brand: freshBrand }, etag ? { ETag: etag } : {});
      } catch (err) {
        return send(res, 400, { error: 'BRAND_ALIAS_ERROR', message: err.message });
      }
    }

    const brandLogoMatch = path.match(/^\/api\/admin\/brands\/([^/]+)\/logo-rights$/);
    if (brandLogoMatch && req.method === 'PUT') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!checkPhase3Ready(res)) return;
      const brandId = brandLogoMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı loqo hüquqlarının yenilənməsi üçün məcburidir.',
        });
      }
      const brandService = new BrandRegistryService(draftDatabase.db);
      const currentBrand = brandService.getBrandById(brandId);
      if (!currentBrand) {
        return send(res, 404, { error: 'BRAND_NOT_FOUND', message: 'Brend tapılmadı' });
      }
      if (!matchBrandEtag(ifMatch, currentBrand)) {
        return send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Brend versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentBrand.version,
          currentEtag: generateBrandEtag(currentBrand),
        });
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
        return send(res, 200, { ok: true, brand: updated }, etag ? { ETag: etag } : {});
      } catch (err) {
        return send(res, 400, { error: 'LOGO_RIGHTS_ERROR', message: err.message });
      }
    }

    const brandVerifMatch = path.match(/^\/api\/admin\/brands\/([^/]+)\/verification-status$/);
    if (brandVerifMatch && req.method === 'PUT') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!checkPhase3Ready(res)) return;
      const brandId = brandVerifMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı brend statusunun yenilənməsi üçün məcburidir.',
        });
      }
      const brandService = new BrandRegistryService(draftDatabase.db);
      const currentBrand = brandService.getBrandById(brandId);
      if (!currentBrand) {
        return send(res, 404, { error: 'BRAND_NOT_FOUND', message: 'Brend tapılmadı' });
      }
      if (!matchBrandEtag(ifMatch, currentBrand)) {
        return send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Brend versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentBrand.version,
          currentEtag: generateBrandEtag(currentBrand),
        });
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
        return send(res, 200, { ok: true, brand: updated }, etag ? { ETag: etag } : {});
      } catch (err) {
        return send(res, 400, { error: 'BRAND_VERIFICATION_ERROR', message: err.message });
      }
    }

    // ==========================================
    // Phase 3: Taxonomy & Hierarchy Admin Endpoints
    // ==========================================
    if (path === '/api/admin/categories/tree' && req.method === 'GET') {
      const session = requireAdmin(req, res);
      if (!session) return;
      const includeArchived = url.searchParams.get('includeArchived') === 'true';
      const taxService = new TaxonomyService(draftDatabase.db);
      const tree = taxService.getCategoryTree({ includeArchived });
      return send(res, 200, { ok: true, tree });
    }

    const catImpactMatch = path.match(/^\/api\/admin\/categories\/([^/]+)\/impact$/);
    if (catImpactMatch && req.method === 'GET') {
      const session = requireAdmin(req, res);
      if (!session) return;
      if (!checkPhase3Ready(res)) return;
      const categoryId = catImpactMatch[1];
      try {
        const taxService = new TaxonomyService(draftDatabase.db);
        const impact = taxService.getCategoryArchiveImpact(categoryId);
        return send(res, 200, { ok: true, ...impact });
      } catch (err) {
        return send(res, 400, { error: 'CATEGORY_IMPACT_ERROR', message: err.message });
      }
    }

    if (path === '/api/admin/categories' && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!checkPhase3Ready(res)) return;
      try {
        const body = await readBody(req);
        const parsed = CategoryCreateSchema.parse(body);
        const taxService = new TaxonomyService(draftDatabase.db);
        const created = taxService.createCategory({
          ...parsed,
          actor: session.username || 'admin',
        });
        const etag = generateCategoryEtag(created);
        return send(res, 201, { ok: true, category: created }, etag ? { ETag: etag } : {});
      } catch (err) {
        console.error('[CATEGORY_CREATE_ERROR]', err);
        return send(res, 400, { error: 'CATEGORY_CREATE_ERROR', message: err.message });
      }
    }

    const catMoveMatch = path.match(/^\/api\/admin\/categories\/([^/]+)\/move$/);
    if (catMoveMatch && req.method === 'PUT') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!checkPhase3Ready(res)) return;
      const categoryId = catMoveMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı kateqoriyanın köçürülməsi üçün məcburidir.',
        });
      }
      const taxService = new TaxonomyService(draftDatabase.db);
      const currentCat = taxService.getCategoryById(categoryId);
      if (!currentCat) {
        return send(res, 404, { error: 'CATEGORY_NOT_FOUND', message: 'Kateqoriya tapılmadı' });
      }
      if (!matchCategoryEtag(ifMatch, currentCat)) {
        return send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Kateqoriya versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentCat.version,
          currentEtag: generateCategoryEtag(currentCat),
        });
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
        return send(res, 200, { ok: true, category: moved }, etag ? { ETag: etag } : {});
      } catch (err) {
        return send(res, 400, { error: 'CATEGORY_MOVE_ERROR', message: err.message });
      }
    }

    if (path === '/api/admin/categories/reorder' && req.method === 'PUT') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!checkPhase3Ready(res)) return;
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı kateqoriyaların yenidən sıralanması üçün məcburidir.',
        });
      }
      try {
        const body = await readBody(req);
        const parsed = CategoryReorderSchema.parse(body);
        const taxService = new TaxonomyService(draftDatabase.db);
        const parentId = parsed.parentId !== undefined ? parsed.parentId : null;
        if (!matchSiblingSetEtag(ifMatch, draftDatabase.db, parentId)) {
          return send(res, 412, {
            error: 'PRECONDITION_FAILED',
            message: 'Sıralama versiya toqquşması aşkarlandı (stale ETag)',
            currentEtag: generateSiblingSetEtag(draftDatabase.db, parentId),
          });
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
        return send(res, 200, { ok: true, ...result }, freshEtag ? { ETag: freshEtag } : {});
      } catch (err) {
        return send(res, 400, { error: 'CATEGORY_REORDER_ERROR', message: err.message });
      }
    }

    const catArchiveMatch = path.match(/^\/api\/admin\/categories\/([^/]+)\/archive$/);
    if (catArchiveMatch && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!checkPhase3Ready(res)) return;
      const categoryId = catArchiveMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı kateqoriyanın arxivlənməsi üçün məcburidir.',
        });
      }
      const taxService = new TaxonomyService(draftDatabase.db);
      const currentCat = taxService.getCategoryById(categoryId);
      if (!currentCat) {
        return send(res, 404, { error: 'CATEGORY_NOT_FOUND', message: 'Kateqoriya tapılmadı' });
      }
      if (!matchCategoryEtag(ifMatch, currentCat)) {
        return send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Kateqoriya versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentCat.version,
          currentEtag: generateCategoryEtag(currentCat),
        });
      }
      try {
        const body = await readBody(req);
        const parsed = CategoryArchiveSchema.parse(body);
        const archived = taxService.archiveCategory(categoryId, {
          reassignToCategoryId: parsed.reassignToCategoryId || null,
          actor: session.username || 'admin',
        });
        const etag = generateCategoryEtag(archived);
        return send(res, 200, { ok: true, category: archived }, etag ? { ETag: etag } : {});
      } catch (err) {
        return send(res, 400, { error: 'CATEGORY_ARCHIVE_ERROR', message: err.message });
      }
    }

    const catRestoreMatch = path.match(/^\/api\/admin\/categories\/([^/]+)\/restore$/);
    if (catRestoreMatch && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!checkPhase3Ready(res)) return;
      const categoryId = catRestoreMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı kateqoriyanın bərpası üçün məcburidir.',
        });
      }
      const taxService = new TaxonomyService(draftDatabase.db);
      const currentCat = taxService.getCategoryById(categoryId);
      if (!currentCat) {
        return send(res, 404, { error: 'CATEGORY_NOT_FOUND', message: 'Kateqoriya tapılmadı' });
      }
      if (!matchCategoryEtag(ifMatch, currentCat)) {
        return send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Kateqoriya versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentCat.version,
          currentEtag: generateCategoryEtag(currentCat),
        });
      }
      try {
        const restored = taxService.restoreCategory(categoryId, {
          actor: session.username || 'admin',
        });
        const etag = generateCategoryEtag(restored);
        return send(res, 200, { ok: true, category: restored }, etag ? { ETag: etag } : {});
      } catch (err) {
        return send(res, 400, { error: 'CATEGORY_RESTORE_ERROR', message: err.message });
      }
    }

    // Category Spec Template Endpoints
    const catSpecListMatch = path.match(/^\/api\/admin\/categories\/([^/]+)\/spec-templates$/);
    if (catSpecListMatch && req.method === 'GET') {
      const session = requireAdmin(req, res);
      if (!session) return;
      if (!checkPhase3Ready(res)) return;
      const categoryId = catSpecListMatch[1];
      const taxService = new TaxonomyService(draftDatabase.db);
      const currentCat = taxService.getCategoryById(categoryId);
      if (!currentCat) {
        return send(res, 404, { error: 'CATEGORY_NOT_FOUND', message: 'Kateqoriya tapılmadı' });
      }
      try {
        const specService = new SpecTemplateService(draftDatabase.db);
        const includeInherited = url.searchParams.get('includeInherited') !== 'false';
        const templates = specService.getCategorySpecTemplates(categoryId, { includeInherited });
        const etag = generateCategoryEtag(currentCat);
        return send(
          res,
          200,
          { ok: true, templates, category: currentCat },
          etag ? { ETag: etag } : {}
        );
      } catch (err) {
        return send(res, 400, { error: 'SPEC_TEMPLATES_ERROR', message: err.message });
      }
    }

    if (catSpecListMatch && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!checkPhase3Ready(res)) return;
      const categoryId = catSpecListMatch[1];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı xüsusiyyət şablonunun yaradılması üçün məcburidir.',
        });
      }
      const taxService = new TaxonomyService(draftDatabase.db);
      const currentCat = taxService.getCategoryById(categoryId);
      if (!currentCat) {
        return send(res, 404, { error: 'CATEGORY_NOT_FOUND', message: 'Kateqoriya tapılmadı' });
      }
      if (!matchCategoryEtag(ifMatch, currentCat)) {
        return send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Kateqoriya versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentCat.version,
          currentEtag: generateCategoryEtag(currentCat),
        });
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
        return send(
          res,
          201,
          { ok: true, template, category: freshCat },
          etag ? { ETag: etag } : {}
        );
      } catch (err) {
        return send(res, 400, { error: 'SPEC_TEMPLATE_SAVE_ERROR', message: err.message });
      }
    }

    const catSpecDeleteMatch = path.match(
      /^\/api\/admin\/categories\/([^/]+)\/spec-templates\/([^/]+)$/
    );
    if (catSpecDeleteMatch && req.method === 'DELETE') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!checkPhase3Ready(res)) return;
      const categoryId = catSpecDeleteMatch[1];
      const templateId = catSpecDeleteMatch[2];
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match başlığı xüsusiyyət şablonunun silinməsi üçün məcburidir.',
        });
      }
      const taxService = new TaxonomyService(draftDatabase.db);
      const currentCat = taxService.getCategoryById(categoryId);
      if (!currentCat) {
        return send(res, 404, { error: 'CATEGORY_NOT_FOUND', message: 'Kateqoriya tapılmadı' });
      }
      if (!matchCategoryEtag(ifMatch, currentCat)) {
        return send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Kateqoriya versiya toqquşması aşkarlandı (stale ETag)',
          currentVersion: currentCat.version,
          currentEtag: generateCategoryEtag(currentCat),
        });
      }
      try {
        const specService = new SpecTemplateService(draftDatabase.db);
        const result = specService.deleteCategorySpecTemplate(categoryId, templateId, {
          actor: session.username || 'admin',
        });
        const freshCat = taxService.getCategoryById(categoryId);
        const etag = generateCategoryEtag(freshCat);
        return send(
          res,
          200,
          { ok: true, ...result, category: freshCat },
          etag ? { ETag: etag } : {}
        );
      } catch (err) {
        return send(res, 400, { error: 'SPEC_TEMPLATE_DELETE_ERROR', message: err.message });
      }
    }

    // Hard delete disabled: Return 405 CATEGORY_HARD_DELETE_DISABLED
    if (path.startsWith('/api/admin/categories') && req.method === 'DELETE') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      return send(res, 405, {
        error: 'CATEGORY_HARD_DELETE_DISABLED',
        message:
          'Kateqoriyaların tam silinməsi qadağandır. Arxivləmə funksiyasından istifadə edin.',
      });
    }

    // Phase 4 Navigation Manager Admin Endpoints
    if (path === '/api/admin/navigation' && req.method === 'GET') {
      const session = requireAdmin(req, res);
      if (!session) return;
      const placement = url.searchParams.get('placement') || null;
      const locale = url.searchParams.get('locale') || 'az';
      if (draftDatabase?.db && isPhase4NavigationReady(draftDatabase.db)) {
        const navService = new NavigationService(draftDatabase.db);
        const items = navService.getNavigationTree({ placement, locale, publicOnly: false });
        return send(res, 200, { ok: true, items });
      }
      let items = [...DEFAULT_NAVIGATION_SEED];
      if (placement) {
        items = items.filter((item) => item.placement === placement);
      }
      return send(res, 200, { ok: true, items });
    }
    if (path === '/api/admin/navigation' && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!draftDatabase?.db || !isPhase4NavigationReady(draftDatabase.db)) {
        return send(res, 400, {
          error: 'NAVIGATION_SCHEMA_NOT_READY',
          message: 'Navigation sxemi aktiv deyil',
        });
      }
      const body = await readBody(req);
      const navService = new NavigationService(draftDatabase.db);
      try {
        const created = navService.createItem(body, session.user || 'admin');
        const etag = navService.generateEtag(created);
        return send(res, 201, { ok: true, item: created }, etag ? { ETag: etag } : {});
      } catch (err) {
        return send(res, 400, { error: 'NAVIGATION_CREATE_ERROR', message: err.message });
      }
    }
    if (path === '/api/admin/navigation/reorder' && req.method === 'PUT') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!draftDatabase?.db || !isPhase4NavigationReady(draftDatabase.db)) {
        return send(res, 400, {
          error: 'NAVIGATION_SCHEMA_NOT_READY',
          message: 'Navigation sxemi aktiv deyil',
        });
      }
      const body = await readBody(req);
      const navService = new NavigationService(draftDatabase.db);
      try {
        const result = navService.reorderSiblings(body.items || [], session.user || 'admin');
        return send(res, 200, { ok: true, ...result });
      } catch (err) {
        return send(res, 400, { error: 'NAVIGATION_REORDER_ERROR', message: err.message });
      }
    }
    if (
      path.startsWith('/api/admin/navigation/') &&
      req.method === 'PUT' &&
      !path.endsWith('/reorder')
    ) {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!draftDatabase?.db || !isPhase4NavigationReady(draftDatabase.db)) {
        return send(res, 400, {
          error: 'NAVIGATION_SCHEMA_NOT_READY',
          message: 'Navigation sxemi aktiv deyil',
        });
      }
      const id = path.replace('/api/admin/navigation/', '');
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'PRECONDITION_REQUIRED',
          message: 'If-Match başlığı tələb olunur',
        });
      }
      if (ifMatch.trim() === '*' || ifMatch.trim() === '"*"') {
        return send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Wildcard (*) If-Match qadağandır',
        });
      }
      const navService = new NavigationService(draftDatabase.db);
      const current = navService.getItemById(id);
      if (!current) {
        return send(res, 404, {
          error: 'ITEM_NOT_FOUND',
          message: 'Naviqasiya elementi tapılmadı',
        });
      }
      if (!navService.matchEtag(ifMatch, current)) {
        return send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Element başqa sessiya tərəfindən dəyişdirilib',
        });
      }
      const body = await readBody(req);
      try {
        const updated = navService.updateItem(id, body, session.user || 'admin');
        const etag = navService.generateEtag(updated);
        return send(res, 200, { ok: true, item: updated }, etag ? { ETag: etag } : {});
      } catch (err) {
        return send(res, 400, { error: 'NAVIGATION_UPDATE_ERROR', message: err.message });
      }
    }
    if (path.startsWith('/api/admin/navigation/') && req.method === 'DELETE') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!draftDatabase?.db || !isPhase4NavigationReady(draftDatabase.db)) {
        return send(res, 400, {
          error: 'NAVIGATION_SCHEMA_NOT_READY',
          message: 'Navigation sxemi aktiv deyil',
        });
      }
      const id = path.replace('/api/admin/navigation/', '');
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'PRECONDITION_REQUIRED',
          message: 'If-Match başlığı tələb olunur',
        });
      }
      if (ifMatch.trim() === '*' || ifMatch.trim() === '"*"') {
        return send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Wildcard (*) If-Match qadağandır',
        });
      }
      const navService = new NavigationService(draftDatabase.db);
      const current = navService.getItemById(id);
      if (!current) {
        return send(res, 404, {
          error: 'ITEM_NOT_FOUND',
          message: 'Naviqasiya elementi tapılmadı',
        });
      }
      if (!navService.matchEtag(ifMatch, current)) {
        return send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Element başqa sessiya tərəfindən dəyişdirilib',
        });
      }
      try {
        const deleted = navService.deleteItem(id, session.user || 'admin');
        return send(res, 200, { ok: true, item: deleted });
      } catch (err) {
        return send(res, 400, { error: 'NAVIGATION_DELETE_ERROR', message: err.message });
      }
    }

    // Phase 5 Brand Rail Admin Endpoints
    if (path === '/api/admin/brand-rail' && req.method === 'GET') {
      const session = requireAdmin(req, res);
      if (!session) return;
      if (!draftDatabase?.db || !isPhase5BrandRailReady(draftDatabase.db)) {
        return send(res, 400, {
          error: 'BRAND_RAIL_SCHEMA_NOT_READY',
          message: 'Brend lenti sxemi aktiv deyil',
        });
      }
      const railService = new BrandRailService(draftDatabase.db);
      const settings = railService.getSettings();
      const items = railService.getItems(true);
      const revisions = railService.getRevisions(20);
      const etag = generateBrandRailEtag(settings);
      return send(res, 200, { ok: true, settings, items, revisions }, etag ? { ETag: etag } : {});
    }
    if (path === '/api/admin/brand-rail/settings' && req.method === 'PUT') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!draftDatabase?.db || !isPhase5BrandRailReady(draftDatabase.db)) {
        return send(res, 400, {
          error: 'BRAND_RAIL_SCHEMA_NOT_READY',
          message: 'Brend lenti sxemi aktiv deyil',
        });
      }
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'PRECONDITION_REQUIRED',
          message: 'If-Match başlığı tələb olunur',
        });
      }
      if (ifMatch.trim() === '*' || ifMatch.trim() === '"*"') {
        return send(res, 412, {
          error: 'PRECONDITION_FAILED',
          message: 'Wildcard (*) If-Match qadağandır',
        });
      }
      const body = await readBody(req);
      const railService = new BrandRailService(draftDatabase.db);
      try {
        const updated = railService.updateSettings(body, ifMatch, session.user || 'admin');
        const etag = generateBrandRailEtag(updated);
        return send(res, 200, { ok: true, settings: updated }, etag ? { ETag: etag } : {});
      } catch (err) {
        return send(res, err.statusCode || 400, {
          error: 'BRAND_RAIL_SETTINGS_UPDATE_ERROR',
          message: err.message,
        });
      }
    }
    if (path === '/api/admin/brand-rail/items' && req.method === 'PUT') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!draftDatabase?.db || !isPhase5BrandRailReady(draftDatabase.db)) {
        return send(res, 400, {
          error: 'BRAND_RAIL_SCHEMA_NOT_READY',
          message: 'Brend lenti sxemi aktiv deyil',
        });
      }
      const body = await readBody(req);
      const railService = new BrandRailService(draftDatabase.db);
      try {
        const updatedItems = railService.updateItems(body.items || [], session.user || 'admin');
        return send(res, 200, { ok: true, items: updatedItems });
      } catch (err) {
        return send(res, 400, {
          error: 'BRAND_RAIL_ITEMS_UPDATE_ERROR',
          message: err.message,
        });
      }
    }
    if (path === '/api/admin/brand-rail/publish' && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!draftDatabase?.db || !catalogDatabase?.db) {
        return send(res, 500, { error: 'DATABASE_UNAVAILABLE', message: 'Baza əlçatan deyil' });
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
        return send(res, 200, { ok: true, ...result });
      } catch (err) {
        return send(res, 500, { error: 'BRAND_RAIL_PUBLISH_ERROR', message: err.message });
      }
    }

    if (path === '/api/admin/brand-rail/rollback' && req.method === 'POST') {
      const session = requireAdmin(req, res);
      if (!session) return;
      if (!verifyCsrf(req, res, session)) return;
      try {
        const body = await parseJsonBody(req);
        const versionOrId = body.version || body.revisionId;
        if (!versionOrId) {
          return send(res, 400, { error: 'INVALID_REQUEST', message: 'Reviziya və ya versiya nömrəsi tələb olunur.' });
        }
        const brandRailService = new BrandRailService(draftDb, publicDb);
        const result = brandRailService.rollback(versionOrId, session.username || 'admin');
        const userAgent = req.headers['user-agent'] || '';
        await logAdminAction(draftDb, {
          actor: session.username || 'admin',
          action: 'rollback',
          title: 'Brend lenti əvvəlki versiyaya qaytarıldı',
          details: `Versiya: ${versionOrId}`,
          ipAddress: session.ip,
          userAgent,
          status: 'success',
        });
        return send(res, 200, { ok: true, ...result });
      } catch (err) {
        const status = err.statusCode || 500;
        return send(res, status, { error: 'BRAND_RAIL_ROLLBACK_ERROR', message: err.message });
      }
    }

    if (
      path.startsWith('/api/admin/products/') &&
      req.method === 'GET' &&
      !path.endsWith('/revisions')
    ) {
      const session = requireAdmin(req, res);
      if (!session) return;
      const prodId = path.replace('/api/admin/products/', '');
      const repo = new ProductRepository(draftDatabase.db);
      const result = repo.getProductById(prodId);
      if (!result)
        return send(res, 404, { error: 'PRODUCT_NOT_FOUND', message: 'Məhsul tapılmadı' });
      return send(res, 200, { ok: true, product: result.product }, { ETag: result.etag });
    }
    if (
      path.startsWith('/api/admin/products/') &&
      path.endsWith('/revisions') &&
      req.method === 'GET'
    ) {
      const session = requireAdmin(req, res);
      if (!session) return;
      const prodId = path.replace('/api/admin/products/', '').replace('/revisions', '');
      const repo = new ProductRepository(draftDatabase.db);
      const revisions = repo.getProductRevisions(prodId);
      return send(res, 200, { ok: true, revisions });
    }
    if (path === '/api/admin/products' && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      const body = await readBody(req);
      const repo = new ProductRepository(draftDatabase.db);
      try {
        const created = repo.createProduct(body, session.user);
        return send(res, 201, { ok: true, product: created.product }, { ETag: created.etag });
      } catch (err) {
        return send(res, 500, { error: err.message });
      }
    }
    if (path.startsWith('/api/admin/products/') && req.method === 'PUT') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match header is mandatory for product updates',
        });
      }
      const prodId = path.replace('/api/admin/products/', '');
      const body = await readBody(req);
      const repo = new ProductRepository(draftDatabase.db);
      try {
        const updated = repo.updateProduct(prodId, body, session.user, ifMatch);
        return send(res, 200, { ok: true, product: updated.product }, { ETag: updated.etag });
      } catch (err) {
        if (
          err instanceof ProductVersionConflictError ||
          err.name === 'ProductVersionConflictError' ||
          err.code === 'PRODUCT_VERSION_CONFLICT'
        ) {
          return send(res, 412, {
            error: 'PRODUCT_VERSION_CONFLICT',
            message: err.message,
            currentVersion: err.currentVersion,
            currentEtag: err.currentEtag,
            currentProduct: err.currentProduct,
          });
        }
        return send(res, 500, { error: err.message });
      }
    }
    if (path.startsWith('/api/admin/products/') && req.method === 'DELETE') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      const ifMatch = req.headers['if-match'];
      if (!ifMatch) {
        return send(res, 428, {
          error: 'IF_MATCH_REQUIRED',
          message: 'If-Match header is mandatory for product deletion',
        });
      }
      const prodId = path.replace('/api/admin/products/', '');
      const repo = new ProductRepository(draftDatabase.db);
      try {
        const result = repo.deleteProduct(prodId, session.user, ifMatch);
        return send(res, 200, { ok: true, id: result.id });
      } catch (err) {
        if (
          err instanceof ProductVersionConflictError ||
          err.name === 'ProductVersionConflictError' ||
          err.code === 'PRODUCT_VERSION_CONFLICT'
        ) {
          return send(res, 412, {
            error: 'PRODUCT_VERSION_CONFLICT',
            message: err.message,
            currentVersion: err.currentVersion,
            currentEtag: err.currentEtag,
            currentProduct: err.currentProduct,
          });
        }
        return send(res, 500, { error: err.message });
      }
    }
    if (path === '/api/admin/pim/migration/status' && req.method === 'GET') {
      const session = requireAdmin(req, res);
      if (!session) return;
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

        return send(res, 200, {
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
        return send(res, 200, {
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
    }
    if (path === '/api/admin/pim/migration/dry-run' && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      try {
        const report = dryRunPimV2Migration(DATA_DIR, {
          sessionId: parseCookies(req).sahara_admin || 'admin_session',
          ip: session.ip || remoteIp(req),
        });
        return send(res, 200, report);
      } catch (err) {
        return send(res, 500, { error: err.message });
      }
    }
    if (path === '/api/admin/pim/migration/apply' && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;

      // 1. Check Live Apply flag FIRST - return exact 403 before any token, lock or filesystem op
      if (process.env.ENABLE_PIM_V2_LIVE_APPLY !== 'true') {
        return send(res, 403, {
          error: 'LIVE_APPLY_DISABLED',
          message:
            'Canlı miqrasiya tətbiqi feature flag ilə deaktivdir. Yalnız klon testləri və dry-run icazəlidir.',
        });
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
        return send(res, 400, {
          error: tokenCheck.error || 'INVALID_DRY_RUN_TOKEN',
          message: `Dry-run tokeni etibarsızdır: ${tokenCheck.reason}`,
        });
      }

      // 3. Acquire migration lock and save as lockHandle
      let lockHandle = null;
      try {
        lockHandle = acquireMigrationLock(STAGING_DIR);
        if (!lockHandle || !lockHandle.acquired) {
          return send(res, 409, {
            error: 'MIGRATION_LOCKED',
            message: lockHandle?.reason || 'Miqrasiya kilidi hazırda aktivdir.',
          });
        }
      } catch (lockErr) {
        return send(res, 409, {
          error: 'MIGRATION_LOCKED',
          message: lockErr.message,
        });
      }

      try {
        // 4. Activate maintenance mode (blocks all new API requests with 503) & drain in-flight requests
        globalThis.__SAHARA_MAINTENANCE__ = true;
        const drainTimeoutMs = Number(process.env.PIM_DRAIN_TIMEOUT_MS || 5000);
        const drainRes = await waitForActiveRequestsDrain(drainTimeoutMs);
        if (!drainRes.drained) {
          globalThis.__SAHARA_MAINTENANCE__ = false;
          releaseMigrationLock(lockHandle);
          return send(res, 503, {
            error: 'DRAIN_TIMEOUT_ACTIVE_REQUESTS_REMAIN',
            message: `Aktiv sorğuların bitməsi gözlənilərkən vaxt bitdi (${drainRes.remainingCount} aktiv sorğu). Miqrasiya təhlükəsiz dayandırıldı.`,
          });
        }

        // 5. Stop scheduled publication worker & close all DB connections
        if (pubWorker) {
          try {
            pubWorker.stop();
          } catch {}
          pubWorker = null;
        }

        try {
          catalogDatabase?.close();
        } catch {}
        try {
          draftDatabase?.close();
        } catch {}
        catalogDatabase = null;
        draftDatabase = null;

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

          // 8. Verify canonical schema and integrity on staged databases
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

        // 9. Execute coordinated cutover with verified existing staged paths
        const cutoverRes = performCoordinatedCutover({
          dataDir: DATA_DIR,
          stagingDir: STAGING_DIR,
          stagedPublicPath,
          stagedDraftPath,
          migrationChecksum: MIGRATION_CHECKSUM,
          closeConnectionsFn: () => {
            try {
              catalogDatabase?.close();
            } catch {}
            try {
              draftDatabase?.close();
            } catch {}
            catalogDatabase = null;
            draftDatabase = null;
          },
          reopenConnectionsFn: () => {
            catalogDatabase = createCatalogDatabase(DATABASE_FILE);
            draftDatabase = createCatalogDatabase(DRAFT_DATABASE_FILE);
            try {
              pubWorker = new ScheduledPublicationWorker({
                draftDb: draftDatabase.db,
                publicDb: catalogDatabase.db,
                minCompletenessScore: MIN_COMPLETENESS_SCORE,
              });
              pubWorker.start(20000);
            } catch (workerErr) {
              console.error('[Sahara Apply] Failed to re-create publication worker:', workerErr);
            }
          },
        });

        return send(res, 200, {
          ok: true,
          status: 'applied',
          appliedAt: new Date().toISOString(),
          journal: cutoverRes.journal,
        });
      } catch (applyErr) {
        if (!catalogDatabase || !draftDatabase) {
          try {
            catalogDatabase = createCatalogDatabase(DATABASE_FILE);
            draftDatabase = createCatalogDatabase(DRAFT_DATABASE_FILE);
          } catch (reopenErr) {
            console.error('[Sahara Apply] Failed to reopen databases:', reopenErr);
            globalThis.__SAHARA_FAIL_CLOSED__ = true;
          }
        }
        return send(res, 500, {
          error: 'MIGRATION_APPLY_FAILED',
          message: applyErr.message,
        });
      } finally {
        globalThis.__SAHARA_MAINTENANCE__ = false;
        if (!pubWorker && catalogDatabase && draftDatabase) {
          try {
            pubWorker = new ScheduledPublicationWorker({
              draftDb: draftDatabase.db,
              publicDb: catalogDatabase.db,
              minCompletenessScore: MIN_COMPLETENESS_SCORE,
            });
            pubWorker.start(20000);
          } catch {}
        }
        if (lockHandle) {
          try {
            releaseMigrationLock(lockHandle);
          } catch {}
        }
      }
    }
    if (path === '/api/admin/media/unassigned' && req.method === 'GET') {
      const session = requireAdmin(req, res);
      if (!session) return;
      const pubMediaDir = join(ROOT, 'public', 'media');
      const audit = auditUnassignedMedia(
        DATABASE_FILE,
        existsSync(pubMediaDir) ? pubMediaDir : MEDIA_DIR
      );
      return send(res, 200, audit);
    }
    if (path === '/api/admin/postgres-verify' && req.method === 'GET') {
      const session = requireAdmin(req, res);
      if (!session) return;
      const report = verifyPostgresCopyTooling(DATABASE_FILE);
      return send(res, 200, report);
    }
    if (path === '/api/admin/catalog/toggle-status' && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      const body = await readBody(req);
      const active = body.active !== false;
      const message =
        safeText(body.message, 500) ||
        'Kataloqda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.';
      const draftCat = draftDatabase.getAdminData
        ? draftDatabase.getAdminData()
        : draftDatabase.getCatalog({ includeAll: true });
      const updatedDraft = {
        ...draftCat,
        settings: {
          ...draftCat.settings,
          catalogActive: active,
          maintenanceMessage: message,
        },
      };
      draftDatabase.saveCatalog(updatedDraft);
      const pubCat = catalogDatabase.getAdminData
        ? catalogDatabase.getAdminData()
        : catalogDatabase.getCatalog({ includeAll: true });
      const updatedPub = {
        ...pubCat,
        settings: {
          ...pubCat.settings,
          catalogActive: active,
          maintenanceMessage: message,
        },
      };
      catalogDatabase.saveCatalog(updatedPub);
      const userAgent = safeText(req.headers['user-agent'] || '', 300);
      draftDatabase.logAction({
        category: 'catalog_status',
        action: active ? 'catalog_resumed' : 'catalog_paused',
        title: active
          ? 'Kataloq fəaliyyəti bərpa edildi (Yayımda)'
          : 'Kataloq fəaliyyəti dayandırıldı (Profilaktika)',
        details: active ? 'Ziyarətçilər kataloqa normal baxa bilər' : `Mesaj: ${message}`,
        ipAddress: session.ip,
        userAgent,
        status: active ? 'success' : 'warning',
      });
      return send(res, 200, { ok: true, active, message });
    }
    if (path === '/api/admin/catalog' && req.method === 'PUT') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      const catalog = validateCatalog(await readBody(req));
      draftDatabase.saveCatalog(catalog);
      const userAgent = safeText(req.headers['user-agent'] || '', 300);
      draftDatabase.logAction({
        category: 'product',
        action: 'draft_save',
        title: 'Qaralama kataloq yeniləndi',
        details: `${catalog.products.length} məhsul, ${catalog.categories.length} kateqoriya, ${catalog.brands.length} brend`,
        ipAddress: session.ip,
        userAgent,
        status: 'info',
      });
      return send(res, 200, { ok: true, updatedAt: catalog.updatedAt });
    }
    if (path === '/api/admin/publish' && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      if (!isPhase3SchemaReady(catalogDatabase.db)) {
        return send(res, 409, {
          error: 'PUBLIC_DB_SCHEMA_NOT_READY',
          message:
            'İctimai verilənlər bazası Phase 3 sxemi üçün hazır deyil. Əvvəlcədən təsdiqlənmiş miqrasiya tələb olunur.',
        });
      }
      const catalog = validateCatalog(
        draftDatabase.getAdminData
          ? draftDatabase.getAdminData()
          : draftDatabase.getCatalog({ includeAll: true })
      );
      catalogDatabase.createSnapshot({
        name: `Canlı yayımdan əvvəlki avtomatik nüsxə (${new Date().toLocaleTimeString('az-AZ')})`,
        createdBy: 'auto-publish',
      });
      try {
        catalogDatabase.publishAtomic(catalog, draftDatabase.db);
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
          return send(res, 409, { error: err.code, message: err.message });
        }
        return send(res, 500, { error: 'PUBLISH_FAILED', message: err.message });
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
      return send(res, 200, { ok: true, updatedAt: catalog.updatedAt });
    }
    if (path === '/api/admin/snapshots' && req.method === 'GET') {
      const session = requireAdmin(req, res);
      if (!session) return;
      const limit = Number(url.searchParams.get('limit') || 50);
      const offset = Number(url.searchParams.get('offset') || 0);
      const result = draftDatabase.getSnapshots({ limit, offset });
      return send(res, 200, result);
    }
    if (path === '/api/admin/snapshots' && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      const body = await readBody(req);
      const name = safeText(body.name, 120) || 'Əllə yaradılmış ehtiyat nüsxə';
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
      return send(res, 200, { ok: true, snapshot: snap });
    }
    if (path === '/api/admin/snapshots/restore' && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      const body = await readBody(req);
      const { id } = body;
      if (!id) return send(res, 400, { error: 'Nüsxə ID-si tələb olunur' });
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
        return send(res, 200, { ok: true, catalog: restored });
      } catch (err) {
        return send(res, 404, { error: err.message || 'Nüsxə tapılmadı' });
      }
    }
    if (path.startsWith('/api/admin/snapshots/') && req.method === 'DELETE') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      const id = path.replace('/api/admin/snapshots/', '');
      draftDatabase.deleteSnapshot(id);
      catalogDatabase.deleteSnapshot(id);
      return send(res, 200, { ok: true });
    }
    if (path === '/api/admin/change-password' && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
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
          envText = envText.replace(
            /ADMIN_PASSWORD=.*(\r?\n|$)/,
            `ADMIN_PASSWORD=${adminPassword}$1`
          );
        } else {
          envText += `\nADMIN_PASSWORD=${adminPassword}\n`;
        }
        await writeFile(envPath, envText, { mode: 0o600 });
        try {
          chmodSync(envPath, 0o600);
        } catch {}
      } catch (err) {
        console.error('Failed to update .env password file:', err);
      }
      const userAgent = safeText(req.headers['user-agent'] || '', 300);
      draftDatabase.logAction({
        category: 'auth',
        action: 'password_change',
        title: 'Admin şifrəsi dəyişdirildi',
        details: 'Admin girişi üçün yeni şifrə təyin edildi',
        ipAddress: session.ip,
        userAgent,
        status: 'warning',
      });
      return send(res, 200, { ok: true });
    }
    if (path === '/api/admin/logout' && req.method === 'POST') {
      const session = requireAdmin(req, res, true);
      if (!session) return;
      const userAgent = safeText(req.headers['user-agent'] || '', 300);
      draftDatabase.logAction({
        category: 'auth',
        action: 'logout',
        title: 'Admin çıxışı',
        details: 'Admin sessiyası sonlandırıldı',
        ipAddress: session.ip,
        userAgent,
        status: 'info',
      });
      sessions.delete(parseCookies(req).sahara_admin);
      return send(
        res,
        200,
        { ok: true },
        { 'Set-Cookie': 'sahara_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' }
      );
    }
    if (path.startsWith('/api/')) return send(res, 404, { error: 'API ünvanı tapılmadı' });
    if (path.startsWith('/uploads/')) return serveUploadedMedia(req, res, path);
    if (
      (path === '/AdministratorNT' || path.startsWith('/AdministratorNT/')) &&
      !isLocalNetwork(req)
    )
      return send(res, 404, 'Tapılmadı');
    return serveFile(res, path);
  } catch (error) {
    console.error(error);
    return send(res, error instanceof SyntaxError ? 400 : 500, {
      error: error.message || 'Server xətası',
    });
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `\nPort ${PORT} artıq istifadə olunur. ./start.sh boş portu avtomatik seçə bilər.`
    );
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
  if (isGeneratedPassword) {
    console.log(
      `\n================================================================================`
    );
    console.log(`🔑 İLK GİRİŞ ŞİFRƏSİ: ${generatedPassword}`);
    console.log(`⚠️ XƏBƏRDARLIQ: Server restart edildikdə bu şifrə dəyişəcək!`);
    console.log(
      `Şifrəni qalıcı etmək üçün Admin panelə daxil olub şifrəni dəyişin və ya .env faylında ADMIN_PASSWORD təyin edin.`
    );
    console.log(
      `================================================================================\n`
    );
  }
});

setInterval(() => {
  for (const [token, session] of sessions)
    if (session.expiresAt < Date.now()) sessions.delete(token);
}, 60_000).unref();

const shutdown = () =>
  server.close(() => {
    catalogDatabase.close();
    draftDatabase.close();
    process.exit(0);
  });
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
