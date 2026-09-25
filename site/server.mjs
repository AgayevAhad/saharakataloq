import http from 'node:http';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCatalogDatabase } from './backend/catalogDatabase.mjs';
import { validateAndResolveDataDir } from './backend/dataPathSecurity.mjs';
import { executeStartupCrashRecovery } from './backend/shadowCutover.mjs';
import {
  ScheduledPublicationWorker,
  MIN_COMPLETENESS_SCORE,
} from './backend/scheduledPublicationJob.mjs';
import { NavigationService } from './backend/navigationService.mjs';
import {
  isPhase4NavigationReady,
  DEFAULT_NAVIGATION_SEED,
} from './backend/phase4NavigationMigration.mjs';
import {
  isPhase5BrandRailReady,
  applyPhase5BrandRailSchema,
  seedCanonical54Brands,
} from './backend/phase5BrandRailMigration.mjs';
import { CustomerSupportStore } from './backend/customerSupportStore.mjs';
import {
  send,
  isLocalNetwork,
  readLegacyJson,
  normalizeProduct,
  mime,
} from './api/helpers.mjs';
import { createApiRouter } from './api/router.mjs';

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
const STAGING_DIR = join(DATA_DIR, '.migration-staging');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const isGeneratedPassword = !process.env.ADMIN_PASSWORD;
const generatedPassword = randomBytes(12).toString('base64url');
let adminPassword = process.env.ADMIN_PASSWORD || generatedPassword;

const sessions = new Map();
const loginAttempts = new Map();
const eventLimits = new Map();
const customerLoginAttempts = new Map();
const customerStore = new CustomerSupportStore(DATA_DIR);

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
    logo: '/media/brands/lotus-logo.png',
    active: true,
    comingSoon: false,
  },
  {
    id: 'artel',
    name: 'ARTEL',
    slug: 'artel',
    originCountry: 'Özbəkistan',
    manufacturingCountries: ['Özbəkistan'],
    description: '',
    logo: '/media/brands/artel-logo.svg',
    active: true,
    comingSoon: false,
  },
];

const initialSettings = {
  address: 'Bakı şəhəri, Sədərək Ticarət Mərkəzi',
  addresses: [
    {
      id: 'addr-1',
      title: 'Sədərək Ticarət Mərkəzi',
      address: 'Bakı şəhəri, Sədərək Ticarət Mərkəzi, Şirniyyat bazarı, 1-ci sıra, Mağaza 31',
      phone: '+994 50 123 45 67',
      isMain: true,
    },
    {
      id: 'addr-2',
      title: 'Dərnəgül Şourum',
      address: 'Bakı şəhəri, Ziya Bünyadov prospekti 1965-ci məhəllə, Baksol yolu',
      phone: '+994 12 444 55 66',
      isMain: false,
    },
  ],
  phoneNumber: '+994 50 123 45 67',
  phoneNumbers: ['+994 50 123 45 67', '+994 12 444 55 66'],
  workingHours: 'Hər gün: 09:00 - 18:00',
  heroBadge: 'Rəsmi Distribütor & Məişət Texnikası',
  heroTitle: 'Eviniz üçün premium və etibarlı texnika',
  heroSubtitle:
    'İtaliya keyfiyyətli ARDO, müasir LOTUS və sərfəli ARTEL məişət texnikasının rəsmi kataloqu.',
  catalogActive: true,
  maintenanceMessage: 'Kataloqda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.',
  countries: ['İtaliya', 'Türkiyə', 'Çin', 'Özbəkistan', 'Almaniya', 'Polşa'],
};

const seedCatalog = async () => {
  const current = draftDatabase.getCatalog({ includeAll: true });
  if (current.products.length) return current;

  const legacy = await readLegacyJson(CATALOG_FILE, null);
  const fallback = {
    brands: baseBrands,
    categories: categorySeed.map(([id, name, icon]) => ({ id, name, icon, active: true })),
    products: [],
    settings: initialSettings,
    articles: [],
    updatedAt: new Date().toISOString(),
  };

  const initial = legacy && legacy.products ? legacy : fallback;
  initial.brands = baseBrands.map((b) => ({
    ...b,
    ...(initial.brands || []).find((ib) => ib.id === b.id),
  }));
  initial.products = (initial.products || []).map(normalizeProduct);
  initial.settings = { ...initialSettings, ...(initial.settings || {}) };
  initial.categories = (initial.categories || []).length ? initial.categories : fallback.categories;
  initial.articles = initial.articles || [];

  draftDatabase.saveCatalog(initial);
  catalogDatabase.publishAtomic(initial, draftDatabase.db);
  return initial;
};

// Startup Crash Recovery
let startupRecoveryFailed = false;
let startupRecoveryError = null;

try {
  const recoveryResult = executeStartupCrashRecovery(DATA_DIR, STAGING_DIR);
  if (recoveryResult && recoveryResult.recovered) {
    console.log(
      `[Startup Recovery] ✅ Completed crash recovery (${recoveryResult.mode}) at ${recoveryResult.timestamp}`
    );
  }
} catch (recErr) {
  startupRecoveryFailed = true;
  startupRecoveryError = recErr;
  console.error('[Startup Recovery] ❌ CRITICAL: Crash recovery failed on startup:', recErr);
  if (process.env.NODE_ENV === 'production') {
    throw recErr;
  }
}

// Database and Worker instances
let catalogDatabase = null;
let draftDatabase = null;
let pubWorker = null;

try {
  catalogDatabase = createCatalogDatabase(DATABASE_FILE);
  draftDatabase = createCatalogDatabase(DRAFT_DATABASE_FILE);

  if (isPhase5BrandRailReady(draftDatabase.db)) {
    applyPhase5BrandRailSchema(draftDatabase.db);
    seedCanonical54Brands(draftDatabase.db);
  }
  if (isPhase5BrandRailReady(catalogDatabase.db)) {
    applyPhase5BrandRailSchema(catalogDatabase.db);
    seedCanonical54Brands(catalogDatabase.db);
  }

  pubWorker = new ScheduledPublicationWorker({
    draftDb: draftDatabase.db,
    publicDb: catalogDatabase.db,
    minCompletenessScore: MIN_COMPLETENESS_SCORE,
  });
  pubWorker.start(20000);
} catch (dbInitErr) {
  console.error('[Startup] Failed to initialize catalog databases or publication worker:', dbInitErr);
}

// Initial Catalog Seeding
if (catalogDatabase && draftDatabase) {
  try {
    const existing = draftDatabase.getCatalog({ includeAll: true });
    if (!existing.products.length) {
      const legacy = await readLegacyJson(CATALOG_FILE, null);
      const legacyAnalytics = await readLegacyJson(ANALYTICS_FILE, null);
      if (legacy && legacy.products) {
        draftDatabase.saveCatalog(legacy);
        catalogDatabase.publishAtomic(legacy, draftDatabase.db);
        if (legacyAnalytics) {
          draftDatabase.importAnalytics(legacyAnalytics);
          catalogDatabase.importAnalytics(legacyAnalytics);
        }
      } else {
        await seedCatalog();
      }
    }
  } catch (seedErr) {
    console.error('Failed to seed catalog on startup:', seedErr);
  }
}

const readCatalog = () =>
  draftDatabase?.getAdminData
    ? draftDatabase.getAdminData()
    : draftDatabase?.getCatalog({ includeAll: true }) || { brands: [], categories: [], products: [] };

const readPublicCatalog = async () => {
  const catalog = catalogDatabase?.getCatalog
    ? catalogDatabase.getCatalog({ includeAll: false })
    : { brands: [], categories: [], products: [], settings: {} };
  const brands = (catalog.brands || [])
    .filter(
      (brand) =>
        brand.active &&
        (!brand.verificationStatus ||
          ['published', 'legacy_unreviewed', 'unverified'].includes(brand.verificationStatus))
    )
    .map((b) => ({
      ...b,
      originCountry: b.originCountry || '',
      manufacturingCountries: b.manufacturingCountries || [],
    }));
  const visibleBrandIds = new Set(
    brands.filter((brand) => !brand.comingSoon).map((brand) => brand.id)
  );
  return {
    ...catalog,
    brands,
    categories: (catalog.categories || []).filter((category) => category.active && !category.isArchived),
    products: (catalog.products || [])
      .map(normalizeProduct)
      .filter(
        (product) =>
          product.status === 'published' &&
          visibleBrandIds.has(product.brandId || product.brand)
      ),
  };
};

const recordEvent = (event) =>
  catalogDatabase?.recordEvent
    ? catalogDatabase.recordEvent(event)
    : draftDatabase?.recordEvent(event);

const isMaintenanceActive = () =>
  Boolean(
    globalThis.__SAHARA_MAINTENANCE__ ||
      globalThis.__SAHARA_FAIL_CLOSED__ ||
      startupRecoveryFailed ||
      !catalogDatabase ||
      !draftDatabase
  );

const isrCache = new Map();
const ISR_TTL_MS = 5 * 60 * 1000;

export function clearIsrCache() {
  isrCache.clear();
}

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const serveUploadedMedia = async (req, res, pathname) => {
  const relative = decodeURIComponent(pathname.replace(/^\/uploads\//, ''));
  const filePath = resolve(MEDIA_DIR, normalize(relative));
  if (!filePath.startsWith(`${resolve(MEDIA_DIR)}/`)) return send(res, 404, 'Tapılmadı');
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error();
  } catch {
    return send(res, 404, 'Tapılmadı');
  }
  const ext = extname(filePath).toLowerCase();
  res.writeHead(200, {
    ...securityHeaders,
    'Content-Type': mime[ext] || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
  });
  createReadStream(filePath).pipe(res);
};

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
          const publicCatalog = await readPublicCatalog();

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
  while (activeRequestsCount > 1 && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 20));
  }
  const drained = activeRequestsCount <= 1;
  return { drained, remainingCount: Math.max(0, activeRequestsCount - 1) };
}

// Assemble API Router with context
const apiRouter = createApiRouter({
  getCatalogDatabase: () => catalogDatabase,
  getDraftDatabase: () => draftDatabase,
  setCatalogDatabase: (db) => { catalogDatabase = db; },
  setDraftDatabase: (db) => { draftDatabase = db; },
  getPubWorker: () => pubWorker,
  setPubWorker: (w) => { pubWorker = w; },
  catalogDatabase,
  draftDatabase,
  customerStore,
  sessions,
  loginAttempts,
  eventLimits,
  customerLoginAttempts,
  getAdminPassword: () => adminPassword,
  setAdminPassword: (p) => { adminPassword = p; },
  DATA_DIR,
  MEDIA_DIR,
  DATABASE_FILE,
  DRAFT_DATABASE_FILE,
  STAGING_DIR,
  ROOT,
  readCatalog,
  readPublicCatalog,
  recordEvent,
  isMaintenanceActive,
  clearIsrCache,
  waitForActiveRequestsDrain,
});

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

  try {
    const hostHeader = req.headers.host || 'localhost';
    const isHttps = Boolean(req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https');
    const protocol = isHttps ? 'https' : 'http';
    const url = new URL(req.url, `${protocol}://${hostHeader}`);
    const path = url.pathname;

    // Direct match for /api/health before anything else
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
            !underMaintenance && catalogDatabase?.health() && draftDatabase?.health()
              ? 'ok'
              : underMaintenance
                ? 'maintenance'
                : 'error',
        },
        { 'Cache-Control': 'no-store' }
      );
    }

    // Delegate all API requests to modular API router
    if (path.startsWith('/api/')) {
      await apiRouter(req, res, path, url);
      return;
    }

    // Media streaming
    if (path.startsWith('/uploads/')) {
      return serveUploadedMedia(req, res, path);
    }

    // Admin path security guard
    if (
      (path === '/AdministratorNT' || path.startsWith('/AdministratorNT/')) &&
      !isLocalNetwork(req)
    ) {
      return send(res, 404, 'Tapılmadı');
    }

    // Static assets & SSR storefront
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
    catalogDatabase?.close();
    draftDatabase?.close();
    process.exitCode = 1;
    return;
  }
  console.error('Server başladılmadı:', error);
  catalogDatabase?.close();
  draftDatabase?.close();
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
  for (const [token, session] of sessions) {
    if (session.expiresAt < Date.now()) sessions.delete(token);
  }
}, 60_000).unref();

const shutdown = () =>
  server.close(() => {
    catalogDatabase?.close();
    draftDatabase?.close();
    process.exit(0);
  });
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
