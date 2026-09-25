import { DatabaseSync } from 'node:sqlite';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAndContainDataPath } from './dataPathSecurity.mjs';
import { isPhase3SchemaReady, promotePhase3CatalogData } from './phase3Migration.mjs';
import { isPhase5BrandRailReady } from './phase5BrandRailMigration.mjs';
import { BrandRailService } from './brandRailService.mjs';

export { validateAndContainDataPath };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const _SITE_DIR = resolve(__dirname, '..');

const bool = (value) => (value ? 1 : 0);
const placeholders = (items) => items.map(() => '?').join(',');
const defaultBrandLogos = {
  ardo: '/media/brands/ardo-logo.png',
  artel: '/media/brands/artel-logo.svg',
  lotus: '/media/brands/lotus-logo.png',
};
const defaultCountriesList = [
  'Türkiyə',
  'Çin',
  'İtaliya',
  'Almaniya',
  'Polşa',
  'Özbəkistan',
  'Rusiya',
  'Belarus',
];

const defaultArticlesList = [];

export const createCatalogDatabase = (databasePath) => {
  const safePath = validateAndContainDataPath(databasePath);
  if (safePath !== ':memory:') {
    mkdirSync(dirname(safePath), { recursive: true });
  }

  const db = new DatabaseSync(safePath);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS catalog_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS catalog_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      whatsapp_number TEXT NOT NULL DEFAULT '',
      phone_number TEXT NOT NULL DEFAULT '',
      phone_numbers TEXT NOT NULL DEFAULT '[]',
      company_name TEXT NOT NULL DEFAULT 'Sahara Electronics',
      address TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT 'info@saharaelectronics.az',
      working_hours TEXT NOT NULL DEFAULT 'Bazar ertəsi - Bazar: 09:00 - 18:00',
      map_url TEXT NOT NULL DEFAULT '',
      location_note TEXT NOT NULL DEFAULT '',
      countries TEXT NOT NULL DEFAULT '["Türkiyə","Çin","İtaliya","Almaniya","Polşa","Özbəkistan"]',
      instagram_username TEXT NOT NULL DEFAULT '@sahara.electronics',
      instagram_url TEXT NOT NULL DEFAULT 'https://instagram.com/sahara.electronics',
      facebook_username TEXT NOT NULL DEFAULT 'Sahara Electronics',
      facebook_url TEXT NOT NULL DEFAULT 'https://facebook.com/saharaelectronics',
      articles TEXT NOT NULL DEFAULT '[]',
      site_title TEXT NOT NULL DEFAULT 'Sahara Electronic – Məhsul Kataloqu',
      site_subtitle TEXT NOT NULL DEFAULT 'Məişət texnikası modelləri və kataloq məlumatları',
      header_caption TEXT NOT NULL DEFAULT 'Məhsul kataloqu',
      catalog_heading TEXT NOT NULL DEFAULT 'Bütün məhsullar',
      catalog_subheading TEXT NOT NULL DEFAULT 'Modellərə və texniki xüsusiyyət sahələrinə baxın',
      hero_banner_title TEXT NOT NULL DEFAULT 'Sahara Electronics — Məhsul Kataloqu',
      hero_banner_subtitle TEXT NOT NULL DEFAULT 'Məişət və mətbəx texnikası modelləri, texniki parametrlər və rəsmi məhsul seçimi.',
      footer_about TEXT NOT NULL DEFAULT 'Sahara Electronics ARDO, Lotus və Artel məhsullarının kataloqunu təqdim edir.',
      footer_copyright TEXT NOT NULL DEFAULT 'Bütün hüquqlar qorunur.',
      primary_color TEXT NOT NULL DEFAULT '#dc2626',
      font_family TEXT NOT NULL DEFAULT 'Inter',
      whatsapp_button_text TEXT NOT NULL DEFAULT 'WhatsApp',
      call_button_text TEXT NOT NULL DEFAULT 'Zəng et',
      share_button_text TEXT NOT NULL DEFAULT 'Paylaş',
      scroll_top_button_text TEXT NOT NULL DEFAULT 'Yuxarı',
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      origin_country TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      logo TEXT NOT NULL DEFAULT '',
      coming_soon INTEGER NOT NULL DEFAULT 0 CHECK(coming_soon IN (0, 1)),
      active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1))
    );
    CREATE TABLE IF NOT EXISTS brand_manufacturing_countries (
      brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      country TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (brand_id, country)
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      brand_id TEXT NOT NULL REFERENCES brands(id),
      category_id TEXT NOT NULL REFERENCES categories(id),
      primary_image TEXT NOT NULL DEFAULT '',
      is_featured INTEGER NOT NULL DEFAULT 0 CHECK(is_featured IN (0, 1)),
      is_new INTEGER NOT NULL DEFAULT 0 CHECK(is_new IN (0, 1)),
      badge_text TEXT NOT NULL DEFAULT '',
      badge_color TEXT NOT NULL DEFAULT 'red',
      price REAL DEFAULT NULL,
      old_price REAL DEFAULT NULL,
      currency TEXT NOT NULL DEFAULT '₼',
      stock_status TEXT NOT NULL DEFAULT 'in_stock',
      short_description TEXT NOT NULL DEFAULT '',
      manufacturing_country TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('published', 'draft')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS products_brand_idx ON products(brand_id);
    CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id);
    CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
    CREATE TABLE IF NOT EXISTS product_media (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video')),
      url TEXT NOT NULL,
      alt_text TEXT NOT NULL DEFAULT '',
      original_name TEXT NOT NULL DEFAULT '',
      poster TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS product_media_product_idx ON product_media(product_id, sort_order);
    CREATE TABLE IF NOT EXISTS product_highlights (
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      value TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (product_id, sort_order)
    );
    CREATE TABLE IF NOT EXISTS product_specs (
      id TEXT NOT NULL,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      value TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT '',
      spec_group TEXT NOT NULL DEFAULT 'Əsas',
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (product_id, id)
    );
    CREATE TABLE IF NOT EXISTS catalog_analytics (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      catalog_views INTEGER NOT NULL DEFAULT 0,
      last_viewed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS product_view_stats (
      product_id TEXT PRIMARY KEY,
      view_count INTEGER NOT NULL DEFAULT 0,
      last_viewed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS contact_action_stats (
      action_type TEXT NOT NULL CHECK(action_type IN ('whatsapp', 'call')),
      product_id TEXT NOT NULL,
      click_count INTEGER NOT NULL DEFAULT 0,
      last_clicked_at TEXT,
      PRIMARY KEY (action_type, product_id)
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      action TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      ip_address TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'info' CHECK(status IN ('info', 'success', 'warning', 'danger')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS audit_logs_category_idx ON audit_logs(category);
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      product_id TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS catalog_snapshots (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      catalog_json TEXT NOT NULL,
      product_count INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS catalog_snapshots_date_idx ON catalog_snapshots(created_at DESC);
    INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (1, datetime('now'));
    INSERT OR IGNORE INTO catalog_analytics(id, catalog_views) VALUES (1, 0);
    INSERT OR IGNORE INTO catalog_settings(id, whatsapp_number, phone_number, updated_at) VALUES (1, '', '', datetime('now'));
  `);

  // Column migrations for dynamic extensions
  const brandColumns = db.prepare('PRAGMA table_info(brands)').all().map((row) => row.name);
  if (!brandColumns.includes('coming_soon')) {
    db.exec('ALTER TABLE brands ADD COLUMN coming_soon INTEGER NOT NULL DEFAULT 0 CHECK(coming_soon IN (0, 1));');
  }

  const productColumns = db.prepare('PRAGMA table_info(products)').all().map((row) => row.name);
  if (!productColumns.includes('badge_color')) {
    db.exec("ALTER TABLE products ADD COLUMN badge_color TEXT NOT NULL DEFAULT 'red';");
  }
  if (!productColumns.includes('price')) {
    db.exec('ALTER TABLE products ADD COLUMN price REAL DEFAULT NULL;');
  }
  if (!productColumns.includes('old_price')) {
    db.exec('ALTER TABLE products ADD COLUMN old_price REAL DEFAULT NULL;');
  }
  if (!productColumns.includes('currency')) {
    db.exec("ALTER TABLE products ADD COLUMN currency TEXT NOT NULL DEFAULT '₼';");
  }
  if (!productColumns.includes('stock_status')) {
    db.exec("ALTER TABLE products ADD COLUMN stock_status TEXT NOT NULL DEFAULT 'in_stock';");
  }
  if (!productColumns.includes('image_position')) {
    db.exec("ALTER TABLE products ADD COLUMN image_position TEXT NOT NULL DEFAULT 'center';");
  }
  if (!productColumns.includes('image_fit')) {
    db.exec("ALTER TABLE products ADD COLUMN image_fit TEXT NOT NULL DEFAULT 'contain';");
  }

  const productMediaColumns = db.prepare('PRAGMA table_info(product_media)').all().map((row) => row.name);
  if (!productMediaColumns.includes('original_name')) {
    db.exec("ALTER TABLE product_media ADD COLUMN original_name TEXT NOT NULL DEFAULT '';");
  }
  if (!productMediaColumns.includes('object_position')) {
    db.exec("ALTER TABLE product_media ADD COLUMN object_position TEXT NOT NULL DEFAULT 'center';");
  }
  if (!productMediaColumns.includes('fit_mode')) {
    db.exec("ALTER TABLE product_media ADD COLUMN fit_mode TEXT NOT NULL DEFAULT 'contain';");
  }

  const settingsColumns = db.prepare('PRAGMA table_info(catalog_settings)').all().map((row) => row.name);
  if (!settingsColumns.includes('catalog_active')) {
    db.exec('ALTER TABLE catalog_settings ADD COLUMN catalog_active INTEGER NOT NULL DEFAULT 1 CHECK(catalog_active IN (0, 1));');
  }
  if (!settingsColumns.includes('maintenance_message')) {
    db.exec("ALTER TABLE catalog_settings ADD COLUMN maintenance_message TEXT NOT NULL DEFAULT 'Kataloqda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.';");
  }
  if (!settingsColumns.includes('site_active')) {
    db.exec('ALTER TABLE catalog_settings ADD COLUMN site_active INTEGER NOT NULL DEFAULT 1 CHECK(site_active IN (0, 1));');
  }
  if (!settingsColumns.includes('site_maintenance_message')) {
    db.exec("ALTER TABLE catalog_settings ADD COLUMN site_maintenance_message TEXT NOT NULL DEFAULT 'Saytda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.';");
  }

  const newSettingCols = [
    ['company_name', "TEXT NOT NULL DEFAULT 'Sahara Electronics'"],
    ['address', "TEXT NOT NULL DEFAULT ''"],
    ['email', "TEXT NOT NULL DEFAULT 'info@saharaelectronics.az'"],
    ['working_hours', "TEXT NOT NULL DEFAULT 'Bazar ertəsi - Bazar: 09:00 - 18:00'"],
    ['map_url', "TEXT NOT NULL DEFAULT ''"],
    ['location_note', "TEXT NOT NULL DEFAULT ''"],
    ['countries', "TEXT NOT NULL DEFAULT '[\"Türkiyə\",\"Çin\",\"İtaliya\",\"Almaniya\",\"Polşa\",\"Özbəkistan\"]'"],
    ['instagram_username', "TEXT NOT NULL DEFAULT '@sahara.electronics'"],
    ['instagram_url', "TEXT NOT NULL DEFAULT 'https://instagram.com/sahara.electronics'"],
    ['facebook_username', "TEXT NOT NULL DEFAULT 'Sahara Electronics'"],
    ['facebook_url', "TEXT NOT NULL DEFAULT 'https://facebook.com/saharaelectronics'"],
    ['phone_numbers', "TEXT NOT NULL DEFAULT '[]'"],
    ['addresses', "TEXT NOT NULL DEFAULT '[]'"],
    ['articles', "TEXT NOT NULL DEFAULT '[]'"],
    ['site_title', "TEXT NOT NULL DEFAULT 'Sahara Electronic – Məhsul Kataloqu'"],
    ['site_subtitle', "TEXT NOT NULL DEFAULT 'Məişət texnikası modelləri və kataloq məlumatları'"],
    ['header_caption', "TEXT NOT NULL DEFAULT 'Məhsul kataloqu'"],
    ['catalog_heading', "TEXT NOT NULL DEFAULT 'Bütün məhsullar'"],
    ['catalog_subheading', "TEXT NOT NULL DEFAULT 'Modellərə və texniki xüsusiyyət sahələrinə baxın'"],
    ['hero_banner_title', "TEXT NOT NULL DEFAULT 'Sahara Electronics — Məhsul Kataloqu'"],
    ['hero_banner_subtitle', "TEXT NOT NULL DEFAULT 'Məişət və mətbəx texnikası modelləri, texniki parametrlər və rəsmi məhsul seçimi.'"],
    ['footer_about', "TEXT NOT NULL DEFAULT 'Sahara Electronics ARDO, Lotus və Artel məhsullarının kataloqunu təqdim edir.'"],
    ['footer_copyright', "TEXT NOT NULL DEFAULT 'Bütün hüquqlar qorunur.'"],
    ['primary_color', "TEXT NOT NULL DEFAULT '#dc2626'"],
    ['font_family', "TEXT NOT NULL DEFAULT 'Inter'"],
    ['whatsapp_button_text', "TEXT NOT NULL DEFAULT 'WhatsApp'"],
    ['call_button_text', "TEXT NOT NULL DEFAULT 'Zəng et'"],
    ['share_button_text', "TEXT NOT NULL DEFAULT 'Paylaş'"],
    ['scroll_top_button_text', "TEXT NOT NULL DEFAULT 'Yuxarı'"],
  ];

  for (const [colName, colDef] of newSettingCols) {
    if (!settingsColumns.includes(colName)) {
      db.exec(`ALTER TABLE catalog_settings ADD COLUMN ${colName} ${colDef};`);
    }
  }

  if (databasePath !== ':memory:') chmodSync(databasePath, 0o600);

  const getCatalog = (options = {}) => {
    const includeAll = Boolean(options?.includeAll || options?.includeComingSoon);
    const brands = db.prepare('SELECT * FROM brands ORDER BY name').all().map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      originCountry: row.origin_country,
      manufacturingCountries: db.prepare('SELECT country FROM brand_manufacturing_countries WHERE brand_id = ? ORDER BY sort_order').all(row.id).map((item) => item.country),
      description: row.description || undefined,
      logo: row.logo || defaultBrandLogos[row.id] || undefined,
      active: Boolean(row.active),
      comingSoon: Boolean(row.coming_soon),
      verificationStatus: row.verification_status || 'legacy_unreviewed',
    }));

    const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order, name').all().map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      icon: row.icon || undefined,
      active: Boolean(row.active),
      isArchived: Boolean(row.is_archived),
      parentId: row.parent_id || null,
      sortOrder: row.sort_order,
    }));

    const mediaStatement = db.prepare('SELECT * FROM product_media WHERE product_id = ? ORDER BY sort_order');
    const highlightStatement = db.prepare('SELECT value FROM product_highlights WHERE product_id = ? ORDER BY sort_order');
    const specStatement = db.prepare('SELECT * FROM product_specs WHERE product_id = ? ORDER BY sort_order');

    const productQuery = includeAll
      ? `SELECT products.*, categories.name AS category_name FROM products JOIN categories ON categories.id = products.category_id ORDER BY products.created_at, products.id`
      : `SELECT products.*, categories.name AS category_name FROM products JOIN categories ON categories.id = products.category_id JOIN brands ON brands.id = products.brand_id WHERE brands.coming_soon = 0 ORDER BY products.created_at, products.id`;

    const products = db.prepare(productQuery).all().map((row) => {
      const media = mediaStatement.all(row.id).map((item) => ({
        id: item.id,
        type: item.media_type,
        url: item.url,
        alt: item.alt_text || undefined,
        originalName: item.original_name || undefined,
        poster: item.poster || undefined,
        objectPosition: item.object_position || 'center',
        fitMode: item.fit_mode || 'contain',
      }));

      return {
        id: row.id,
        code: row.code,
        title: row.title,
        brandId: row.brand_id,
        category: row.category_id,
        categoryName: row.category_name,
        image: row.primary_image,
        imagePosition: row.image_position || 'center',
        imageFit: row.image_fit || 'contain',
        gallery: media.filter((item) => item.type === 'image').map((item) => item.url),
        media,
        isFeatured: Boolean(row.is_featured),
        isNew: Boolean(row.is_new),
        badgeText: row.badge_text || undefined,
        badgeColor: row.badge_color || 'red',
        price: row.price !== null && row.price !== undefined ? Number(row.price) : undefined,
        oldPrice: row.old_price !== null && row.old_price !== undefined ? Number(row.old_price) : undefined,
        currency: row.currency || '₼',
        stockStatus: row.stock_status || 'in_stock',
        shortDesc: row.short_description,
        manufacturingCountry: row.manufacturing_country,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        highlights: highlightStatement.all(row.id).map((item) => item.value),
        specs: specStatement.all(row.id).map((item) => ({
          id: item.id,
          name: item.name,
          value: item.value,
          description: item.description || undefined,
          icon: item.icon || undefined,
          group: item.spec_group,
        })),
      };
    });

    const meta = db.prepare("SELECT value FROM catalog_meta WHERE key = 'updated_at'").get();
    const settingsRow = db.prepare('SELECT * FROM catalog_settings WHERE id = 1').get();

    let countries = defaultCountriesList;
    if (settingsRow?.countries) {
      try {
        const parsed = JSON.parse(settingsRow.countries);
        if (Array.isArray(parsed) && parsed.length) countries = parsed;
      } catch {}
    }

    let phoneNumbers = [];
    if (settingsRow?.phone_numbers) {
      try {
        const parsed = JSON.parse(settingsRow.phone_numbers);
        if (Array.isArray(parsed) && parsed.length) phoneNumbers = parsed.filter(Boolean);
      } catch {}
    }
    if (!phoneNumbers.length && settingsRow?.phone_number) {
      phoneNumbers = [settingsRow.phone_number];
    }

    let articles = defaultArticlesList;
    if (settingsRow?.articles) {
      try {
        const parsed = JSON.parse(settingsRow.articles);
        if (Array.isArray(parsed) && parsed.length) articles = parsed;
      } catch {}
    }

    let addresses = settingsRow?.address
      ? [
          {
            id: 'addr-1',
            title: 'Əsas Mağaza',
            address: settingsRow.address,
            mapUrl: settingsRow?.map_url || '',
            note: settingsRow?.location_note || '',
            workingHours: settingsRow?.working_hours || '',
          },
        ]
      : [];
    if (settingsRow?.addresses) {
      try {
        const parsed = JSON.parse(settingsRow.addresses);
        if (Array.isArray(parsed) && parsed.length) {
          addresses = parsed;
          if (settingsRow?.address && addresses.length === 1) {
            addresses[0].address = settingsRow.address;
          }
        }
      } catch {}
    }

    const settings = {
      whatsappNumber: settingsRow?.whatsapp_number || '',
      phoneNumber: settingsRow?.phone_number || phoneNumbers[0] || '',
      phoneNumbers,
      companyName: settingsRow?.company_name || 'Sahara Electronics',
      address: settingsRow?.address || addresses[0]?.address || '',
      addresses,
      email: settingsRow?.email || 'info@saharaelectronics.az',
      workingHours: settingsRow?.working_hours || '',
      mapUrl: settingsRow?.map_url || '',
      locationNote: settingsRow?.location_note || '',
      countries,
      instagramUsername: settingsRow?.instagram_username || '@sahara.electronics',
      instagramUrl: settingsRow?.instagram_url || 'https://instagram.com/sahara.electronics',
      facebookUsername: settingsRow?.facebook_username || 'Sahara Electronics',
      facebookUrl: settingsRow?.facebook_url || 'https://facebook.com/saharaelectronics',
      siteTitle: settingsRow?.site_title || 'Sahara Electronic – Məhsul Kataloqu',
      siteSubtitle: settingsRow?.site_subtitle || 'Məişət texnikası modelləri və kataloq məlumatları',
      headerCaption: settingsRow?.header_caption || 'Məhsul kataloqu',
      catalogHeading: settingsRow?.catalog_heading || 'Bütün məhsullar',
      catalogSubheading: settingsRow?.catalog_subheading || 'Modellərə və texniki xüsusiyyət sahələrinə baxın',
      heroBannerTitle:
        settingsRow?.hero_banner_title && settingsRow.hero_banner_title !== 'İtalyan ARDO & Məişət Texnikası'
          ? settingsRow.hero_banner_title
          : 'Sahara Electronics — Məhsul Kataloqu',
      heroBannerSubtitle:
        settingsRow?.hero_banner_subtitle &&
        settingsRow.hero_banner_subtitle !== 'Eleqant dizayn və yüksək enerji səmərəliliyi ilə məişət texnikası modelləri'
          ? settingsRow.hero_banner_subtitle
          : 'Məişət və mətbəx texnikası modelləri, texniki parametrlər və rəsmi məhsul seçimi.',
      footerAbout: settingsRow?.footer_about || 'Sahara Electronics ARDO, Lotus və Artel məhsullarının kataloqunu təqdim edir.',
      footerCopyright: settingsRow?.footer_copyright || 'Bütün hüquqlar qorunur.',
      primaryColor: settingsRow?.primary_color || '#dc2626',
      fontFamily: settingsRow?.font_family || 'Inter',
      whatsappButtonText: settingsRow?.whatsapp_button_text || 'WhatsApp',
      callButtonText: settingsRow?.call_button_text || 'Zəng et',
      shareButtonText: settingsRow?.share_button_text || 'Paylaş',
      scrollTopButtonText: settingsRow?.scroll_top_button_text || 'Yuxarı',
      siteActive: settingsRow?.site_active !== undefined ? Boolean(settingsRow.site_active) : true,
      siteMaintenanceMessage: settingsRow?.site_maintenance_message || 'Saytda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.',
      catalogActive: settingsRow?.catalog_active !== undefined ? Boolean(settingsRow.catalog_active) : true,
      maintenanceMessage: settingsRow?.maintenance_message || 'Kataloqda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.',
    };

    const brandRail = isPhase5BrandRailReady(db)
      ? new BrandRailService(db).getPublicRail()
      : { enabled: false, settings: null, items: [] };

    return { brands, categories, products, settings, countries, articles, brandRail, updatedAt: meta?.value };
  };

  const saveCatalog = (catalog) => {
    const now = catalog.updatedAt || new Date().toISOString();
    const upsertBrand = db.prepare(`INSERT INTO brands(id,name,slug,origin_country,description,logo,coming_soon,active) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,origin_country=excluded.origin_country,description=excluded.description,logo=excluded.logo,coming_soon=excluded.coming_soon,active=excluded.active`);
    const upsertCategory = db.prepare(`INSERT INTO categories(id,name,slug,icon,active,sort_order) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,icon=excluded.icon,active=excluded.active,sort_order=excluded.sort_order`);
    const upsertProduct = db.prepare(`INSERT INTO products(id,code,title,brand_id,category_id,primary_image,is_featured,is_new,badge_text,badge_color,price,old_price,currency,stock_status,short_description,manufacturing_country,status,image_position,image_fit,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET code=excluded.code,title=excluded.title,brand_id=excluded.brand_id,category_id=excluded.category_id,primary_image=excluded.primary_image,is_featured=excluded.is_featured,is_new=excluded.is_new,badge_text=excluded.badge_text,badge_color=excluded.badge_color,price=excluded.price,old_price=excluded.old_price,currency=excluded.currency,stock_status=excluded.stock_status,short_description=excluded.short_description,manufacturing_country=excluded.manufacturing_country,status=excluded.status,image_position=excluded.image_position,image_fit=excluded.image_fit,updated_at=excluded.updated_at`);

    db.exec('BEGIN IMMEDIATE');
    try {
      for (const brand of catalog.brands || []) {
        upsertBrand.run(brand.id, brand.name, brand.slug, brand.originCountry || '', brand.description || '', brand.logo || '', bool(brand.comingSoon), bool(brand.active));
        db.prepare('DELETE FROM brand_manufacturing_countries WHERE brand_id = ?').run(brand.id);
        (brand.manufacturingCountries || []).forEach((country, index) => db.prepare('INSERT INTO brand_manufacturing_countries(brand_id,country,sort_order) VALUES(?,?,?)').run(brand.id, country, index));
      }

      for (const category of catalog.categories || []) {
        upsertCategory.run(category.id, category.name, category.slug, category.icon || '', bool(category.active), category.sortOrder || 0);
      }

      for (const product of catalog.products || []) {
        const createdAt = product.createdAt || now;
        upsertProduct.run(
          product.id,
          product.code,
          product.title,
          product.brandId || 'ardo',
          product.category,
          product.image || '',
          bool(product.isFeatured),
          bool(product.isNew),
          product.badgeText || '',
          product.badgeColor || 'red',
          product.price !== undefined ? Number(product.price) : null,
          product.oldPrice !== undefined ? Number(product.oldPrice) : null,
          product.currency || '₼',
          product.stockStatus || 'in_stock',
          product.shortDesc || '',
          product.manufacturingCountry || '',
          product.status === 'published' ? 'published' : 'draft',
          product.imagePosition || 'center',
          product.imageFit || 'contain',
          createdAt,
          now
        );

        db.prepare('DELETE FROM product_media WHERE product_id = ?').run(product.id);
        db.prepare('DELETE FROM product_highlights WHERE product_id = ?').run(product.id);
        db.prepare('DELETE FROM product_specs WHERE product_id = ?').run(product.id);

        (product.media || []).forEach((item, index) =>
          db
            .prepare(
              'INSERT INTO product_media(id,product_id,media_type,url,alt_text,original_name,poster,object_position,fit_mode,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?)'
            )
            .run(
              item.id,
              product.id,
              item.type,
              item.url,
              item.alt || '',
              item.originalName || '',
              item.poster || '',
              item.objectPosition || 'center',
              item.fitMode || 'contain',
              index
            )
        );
        (product.highlights || []).forEach((value, index) => db.prepare('INSERT INTO product_highlights(product_id,value,sort_order) VALUES(?,?,?)').run(product.id, value, index));
        (product.specs || []).forEach((item, index) => db.prepare('INSERT INTO product_specs(id,product_id,name,value,description,icon,spec_group,sort_order) VALUES(?,?,?,?,?,?,?,?)').run(item.id, product.id, item.name, item.value || '', item.description || '', item.icon || '', item.group || 'Əsas', index));
      }

      const productIds = (catalog.products || []).map((item) => item.id);
      const categoryIds = (catalog.categories || []).map((item) => item.id);
      const brandIds = (catalog.brands || []).map((item) => item.id);

      if (productIds.length) db.prepare(`DELETE FROM products WHERE id NOT IN (${placeholders(productIds)})`).run(...productIds);
      else db.exec('DELETE FROM products');

      if (categoryIds.length) db.prepare(`DELETE FROM categories WHERE id NOT IN (${placeholders(categoryIds)})`).run(...categoryIds);
      else db.exec('DELETE FROM categories');

      if (brandIds.length) db.prepare(`DELETE FROM brands WHERE id NOT IN (${placeholders(brandIds)})`).run(...brandIds);
      else db.exec('DELETE FROM brands');

      if (catalog.settings) {
        const countriesJson = JSON.stringify(catalog.settings.countries || catalog.countries || defaultCountriesList);
        const phoneNumbersJson = JSON.stringify(catalog.settings.phoneNumbers || (catalog.settings.phoneNumber ? [catalog.settings.phoneNumber] : []));
        const primaryAddress = catalog.settings.address || (catalog.settings.addresses && catalog.settings.addresses[0]?.address) || '';
        let addressesToSave = catalog.settings.addresses;
        if (Array.isArray(addressesToSave) && addressesToSave.length) {
          if (catalog.settings.address && addressesToSave.length === 1 && addressesToSave[0].address !== catalog.settings.address) {
            addressesToSave = [{ ...addressesToSave[0], address: catalog.settings.address }];
          }
        } else if (catalog.settings.address) {
          addressesToSave = [
            {
              id: 'addr-1',
              title: 'Əsas Mağaza',
              address: catalog.settings.address,
              mapUrl: catalog.settings.mapUrl || '',
              note: catalog.settings.locationNote || '',
              workingHours: catalog.settings.workingHours || '',
            },
          ];
        } else {
          addressesToSave = [];
        }
        const addressesJson = JSON.stringify(addressesToSave);
        const articlesJson = JSON.stringify(catalog.articles || defaultArticlesList);
        const primaryPhone = catalog.settings.phoneNumber || (catalog.settings.phoneNumbers && catalog.settings.phoneNumbers[0]) || '';
        const siteActiveVal = catalog.settings.siteActive !== undefined ? bool(catalog.settings.siteActive) : 1;
        const siteMaintenanceMsg = catalog.settings.siteMaintenanceMessage || 'Saytda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.';
        const catalogActiveVal = catalog.settings.catalogActive !== undefined ? bool(catalog.settings.catalogActive) : 1;
        const maintenanceMsg = catalog.settings.maintenanceMessage || 'Kataloqda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.';

        db.prepare(`
          UPDATE catalog_settings
          SET whatsapp_number = ?, phone_number = ?, phone_numbers = ?, company_name = ?, address = ?, addresses = ?, email = ?, working_hours = ?, map_url = ?, location_note = ?, countries = ?, instagram_username = ?, instagram_url = ?, facebook_username = ?, facebook_url = ?, articles = ?, site_title = ?, site_subtitle = ?, header_caption = ?, catalog_heading = ?, catalog_subheading = ?, hero_banner_title = ?, hero_banner_subtitle = ?, footer_about = ?, footer_copyright = ?, primary_color = ?, font_family = ?, whatsapp_button_text = ?, call_button_text = ?, share_button_text = ?, scroll_top_button_text = ?, site_active = ?, site_maintenance_message = ?, catalog_active = ?, maintenance_message = ?, updated_at = ?
          WHERE id = 1
        `).run(
          catalog.settings.whatsappNumber || '',
          primaryPhone,
          phoneNumbersJson,
          catalog.settings.companyName || 'Sahara Electronics',
          primaryAddress,
          addressesJson,
          catalog.settings.email || 'info@saharaelectronics.az',
          catalog.settings.workingHours || 'Bazar ertəsi - Bazar: 09:00 - 18:00',
          catalog.settings.mapUrl || '',
          catalog.settings.locationNote || '',
          countriesJson,
          catalog.settings.instagramUsername ?? '@sahara.electronics',
          catalog.settings.instagramUrl ?? 'https://instagram.com/sahara.electronics',
          catalog.settings.facebookUsername ?? 'Sahara Electronics',
          catalog.settings.facebookUrl ?? 'https://facebook.com/saharaelectronics',
          articlesJson,
          catalog.settings.siteTitle || 'Sahara Electronic – Məhsul Kataloqu',
          catalog.settings.siteSubtitle || 'Məişət texnikası modelləri və kataloq məlumatları',
          catalog.settings.headerCaption || 'Məhsul kataloqu',
          catalog.settings.catalogHeading || 'Bütün məhsullar',
          catalog.settings.catalogSubheading || 'Modellərə və texniki xüsusiyyət sahələrinə baxın',
          catalog.settings.heroBannerTitle && catalog.settings.heroBannerTitle !== 'İtalyan ARDO & Məişət Texnikası'
            ? catalog.settings.heroBannerTitle
            : 'Sahara Electronics — Məhsul Kataloqu',
          catalog.settings.heroBannerSubtitle && catalog.settings.heroBannerSubtitle !== 'Eleqant dizayn və yüksək enerji səmərəliliyi ilə məişət texnikası modelləri'
            ? catalog.settings.heroBannerSubtitle
            : 'Məişət və mətbəx texnikası modelləri, texniki parametrlər və rəsmi məhsul seçimi.',
          catalog.settings.footerAbout || 'Sahara Electronics ARDO, Lotus və Artel məhsullarının kataloqunu təqdim edir.',
          catalog.settings.footerCopyright || 'Bütün hüquqlar qorunur.',
          catalog.settings.primaryColor || '#dc2626',
          catalog.settings.fontFamily || 'Inter',
          catalog.settings.whatsappButtonText || 'WhatsApp',
          catalog.settings.callButtonText || 'Zəng et',
          catalog.settings.shareButtonText || 'Paylaş',
          catalog.settings.scrollTopButtonText || 'Yuxarı',
          siteActiveVal,
          siteMaintenanceMsg,
          catalogActiveVal,
          maintenanceMsg,
          now
        );
      }
      db.prepare("INSERT INTO catalog_meta(key,value) VALUES('updated_at',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(now);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };

  const publishAtomic = (catalog, draftDb) => {
    if (!isPhase3SchemaReady(db)) {
      const err = new Error('PUBLIC_DB_SCHEMA_NOT_READY: İctimai verilənlər bazası Phase 3 sxemi üçün hazır deyil. Əvvəlcədən təsdiqlənmiş miqrasiya tələb olunur.');
      err.code = 'PUBLIC_DB_SCHEMA_NOT_READY';
      throw err;
    }
    const now = catalog.updatedAt || new Date().toISOString();
    const upsertBrand = db.prepare(`INSERT INTO brands(id,name,slug,origin_country,description,logo,coming_soon,active) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,origin_country=excluded.origin_country,description=excluded.description,logo=excluded.logo,coming_soon=excluded.coming_soon,active=excluded.active`);
    const upsertCategory = db.prepare(`INSERT INTO categories(id,name,slug,icon,active,sort_order) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,icon=excluded.icon,active=excluded.active,sort_order=excluded.sort_order`);
    const upsertProduct = db.prepare(`INSERT INTO products(id,code,title,brand_id,category_id,primary_image,is_featured,is_new,badge_text,badge_color,price,old_price,currency,stock_status,short_description,manufacturing_country,status,image_position,image_fit,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET code=excluded.code,title=excluded.title,brand_id=excluded.brand_id,category_id=excluded.category_id,primary_image=excluded.primary_image,is_featured=excluded.is_featured,is_new=excluded.is_new,badge_text=excluded.badge_text,badge_color=excluded.badge_color,price=excluded.price,old_price=excluded.old_price,currency=excluded.currency,stock_status=excluded.stock_status,short_description=excluded.short_description,manufacturing_country=excluded.manufacturing_country,status=excluded.status,image_position=excluded.image_position,image_fit=excluded.image_fit,updated_at=excluded.updated_at`);

    db.exec('BEGIN IMMEDIATE');
    try {
      for (const brand of catalog.brands || []) {
        upsertBrand.run(brand.id, brand.name, brand.slug, brand.originCountry || '', brand.description || '', brand.logo || '', bool(brand.comingSoon), bool(brand.active));
        db.prepare('DELETE FROM brand_manufacturing_countries WHERE brand_id = ?').run(brand.id);
        (brand.manufacturingCountries || []).forEach((country, index) => db.prepare('INSERT INTO brand_manufacturing_countries(brand_id,country,sort_order) VALUES(?,?,?)').run(brand.id, country, index));
      }

      for (const category of catalog.categories || []) {
        upsertCategory.run(category.id, category.name, category.slug, category.icon || '', bool(category.active), category.sortOrder || 0);
      }

      for (const product of catalog.products || []) {
        const createdAt = product.createdAt || now;
        upsertProduct.run(
          product.id,
          product.code,
          product.title,
          product.brandId || 'ardo',
          product.category,
          product.image || '',
          bool(product.isFeatured),
          bool(product.isNew),
          product.badgeText || '',
          product.badgeColor || 'red',
          product.price !== undefined ? Number(product.price) : null,
          product.oldPrice !== undefined ? Number(product.oldPrice) : null,
          product.currency || '₼',
          product.stockStatus || 'in_stock',
          product.shortDesc || '',
          product.manufacturingCountry || '',
          product.status === 'published' ? 'published' : 'draft',
          product.imagePosition || 'center',
          product.imageFit || 'contain',
          createdAt,
          now
        );

        db.prepare('DELETE FROM product_media WHERE product_id = ?').run(product.id);
        db.prepare('DELETE FROM product_highlights WHERE product_id = ?').run(product.id);
        db.prepare('DELETE FROM product_specs WHERE product_id = ?').run(product.id);

        (product.media || []).forEach((item, index) =>
          db
            .prepare(
              'INSERT INTO product_media(id,product_id,media_type,url,alt_text,original_name,poster,object_position,fit_mode,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?)'
            )
            .run(
              item.id,
              product.id,
              item.type,
              item.url,
              item.alt || '',
              item.originalName || '',
              item.poster || '',
              item.objectPosition || 'center',
              item.fitMode || 'contain',
              index
            )
        );
        (product.highlights || []).forEach((value, index) => db.prepare('INSERT INTO product_highlights(product_id,value,sort_order) VALUES(?,?,?)').run(product.id, value, index));
        (product.specs || []).forEach((item, index) => db.prepare('INSERT INTO product_specs(id,product_id,name,value,description,icon,spec_group,sort_order) VALUES(?,?,?,?,?,?,?,?)').run(item.id, product.id, item.name, item.value || '', item.description || '', item.icon || '', item.group || 'Əsas', index));
      }

      const productIds = (catalog.products || []).map((item) => item.id);
      const categoryIds = (catalog.categories || []).map((item) => item.id);
      const brandIds = (catalog.brands || []).map((item) => item.id);

      if (productIds.length) db.prepare(`DELETE FROM products WHERE id NOT IN (${placeholders(productIds)})`).run(...productIds);
      else db.exec('DELETE FROM products');

      if (categoryIds.length) db.prepare(`DELETE FROM categories WHERE id NOT IN (${placeholders(categoryIds)})`).run(...categoryIds);
      else db.exec('DELETE FROM categories');

      if (brandIds.length) db.prepare(`DELETE FROM brands WHERE id NOT IN (${placeholders(brandIds)})`).run(...brandIds);
      else db.exec('DELETE FROM brands');

      if (catalog.settings) {
        const countriesJson = JSON.stringify(catalog.settings.countries || catalog.countries || defaultCountriesList);
        const phoneNumbersJson = JSON.stringify(catalog.settings.phoneNumbers || (catalog.settings.phoneNumber ? [catalog.settings.phoneNumber] : []));
        const primaryAddress = catalog.settings.address || (catalog.settings.addresses && catalog.settings.addresses[0]?.address) || '';
        let addressesToSave = catalog.settings.addresses;
        if (Array.isArray(addressesToSave) && addressesToSave.length) {
          if (catalog.settings.address && addressesToSave.length === 1 && addressesToSave[0].address !== catalog.settings.address) {
            addressesToSave = [{ ...addressesToSave[0], address: catalog.settings.address }];
          }
        } else if (catalog.settings.address) {
          addressesToSave = [
            {
              id: 'addr-1',
              title: 'Əsas Mağaza',
              address: catalog.settings.address,
              mapUrl: catalog.settings.mapUrl || '',
              note: catalog.settings.locationNote || '',
              workingHours: catalog.settings.workingHours || '',
            },
          ];
        } else {
          addressesToSave = [];
        }
        const addressesJson = JSON.stringify(addressesToSave);
        const articlesJson = JSON.stringify(catalog.articles || defaultArticlesList);
        const primaryPhone = catalog.settings.phoneNumber || (catalog.settings.phoneNumbers && catalog.settings.phoneNumbers[0]) || '';
        const siteActiveVal = catalog.settings.siteActive !== undefined ? bool(catalog.settings.siteActive) : 1;
        const siteMaintenanceMsg = catalog.settings.siteMaintenanceMessage || 'Saytda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.';
        const catalogActiveVal = catalog.settings.catalogActive !== undefined ? bool(catalog.settings.catalogActive) : 1;
        const maintenanceMsg = catalog.settings.maintenanceMessage || 'Kataloqda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.';

        db.prepare(`
          UPDATE catalog_settings
          SET whatsapp_number = ?, phone_number = ?, phone_numbers = ?, company_name = ?, address = ?, addresses = ?, email = ?, working_hours = ?, map_url = ?, location_note = ?, countries = ?, instagram_username = ?, instagram_url = ?, facebook_username = ?, facebook_url = ?, articles = ?, site_title = ?, site_subtitle = ?, header_caption = ?, catalog_heading = ?, catalog_subheading = ?, hero_banner_title = ?, hero_banner_subtitle = ?, footer_about = ?, footer_copyright = ?, primary_color = ?, font_family = ?, whatsapp_button_text = ?, call_button_text = ?, share_button_text = ?, scroll_top_button_text = ?, site_active = ?, site_maintenance_message = ?, catalog_active = ?, maintenance_message = ?, updated_at = ?
          WHERE id = 1
        `).run(
          catalog.settings.whatsappNumber || '',
          primaryPhone,
          phoneNumbersJson,
          catalog.settings.companyName || 'Sahara Electronics',
          primaryAddress,
          addressesJson,
          catalog.settings.email || 'info@saharaelectronics.az',
          catalog.settings.workingHours || 'Bazar ertəsi - Bazar: 09:00 - 18:00',
          catalog.settings.mapUrl || '',
          catalog.settings.locationNote || '',
          countriesJson,
          catalog.settings.instagramUsername ?? '@sahara.electronics',
          catalog.settings.instagramUrl ?? 'https://instagram.com/sahara.electronics',
          catalog.settings.facebookUsername ?? 'Sahara Electronics',
          catalog.settings.facebookUrl ?? 'https://facebook.com/saharaelectronics',
          articlesJson,
          catalog.settings.siteTitle || 'Sahara Electronic – Məhsul Kataloqu',
          catalog.settings.siteSubtitle || 'Məişət texnikası modelləri və kataloq məlumatları',
          catalog.settings.headerCaption || 'Məhsul kataloqu',
          catalog.settings.catalogHeading || 'Bütün məhsullar',
          catalog.settings.catalogSubheading || 'Modellərə və texniki xüsusiyyət sahələrinə baxın',
          catalog.settings.heroBannerTitle && catalog.settings.heroBannerTitle !== 'İtalyan ARDO & Məişət Texnikası'
            ? catalog.settings.heroBannerTitle
            : 'Sahara Electronics — Məhsul Kataloqu',
          catalog.settings.heroBannerSubtitle && catalog.settings.heroBannerSubtitle !== 'Eleqant dizayn və yüksək enerji səmərəliliyi ilə məişət texnikası modelləri'
            ? catalog.settings.heroBannerSubtitle
            : 'Məişət və mətbəx texnikası modelləri, texniki parametrlər və rəsmi məhsul seçimi.',
          catalog.settings.footerAbout || 'Sahara Electronics ARDO, Lotus və Artel məhsullarının kataloqunu təqdim edir.',
          catalog.settings.footerCopyright || 'Bütün hüquqlar qorunur.',
          catalog.settings.primaryColor || '#dc2626',
          catalog.settings.fontFamily || 'Inter',
          catalog.settings.whatsappButtonText || 'WhatsApp',
          catalog.settings.callButtonText || 'Zəng et',
          catalog.settings.shareButtonText || 'Paylaş',
          catalog.settings.scrollTopButtonText || 'Yuxarı',
          siteActiveVal,
          siteMaintenanceMsg,
          catalogActiveVal,
          maintenanceMsg,
          now
        );
      }
      db.prepare("INSERT INTO catalog_meta(key,value) VALUES('updated_at',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(now);

      // Promote Phase 3 data in the SAME atomic transaction
      if (draftDb) {
        promotePhase3CatalogData(draftDb, db, { manageTransaction: false });
      }

      // Promote Phase 5 Brand Rail in the SAME atomic transaction
      if (draftDb && isPhase5BrandRailReady(draftDb) && isPhase5BrandRailReady(db)) {
        const draftRail = new BrandRailService(draftDb);
        const s = draftRail.getSettings();
        const items = draftRail.getItems(true);
        if (s) {
          db.prepare(`
            INSERT INTO brand_rail_settings (
              id, enabled, title, animation_enabled, speed_seconds, direction, pause_on_hover, edge_fade, card_size, section_order, theme_variant, version, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              enabled = excluded.enabled,
              title = excluded.title,
              animation_enabled = excluded.animation_enabled,
              speed_seconds = excluded.speed_seconds,
              direction = excluded.direction,
              pause_on_hover = excluded.pause_on_hover,
              edge_fade = excluded.edge_fade,
              card_size = excluded.card_size,
              section_order = excluded.section_order,
              theme_variant = excluded.theme_variant,
              version = excluded.version,
              updated_at = excluded.updated_at
          `).run(
            s.id,
            s.enabled ? 1 : 0,
            s.title,
            s.animationEnabled ? 1 : 0,
            s.speedSeconds,
            s.direction,
            s.pauseOnHover ? 1 : 0,
            s.edgeFade ? 1 : 0,
            s.cardSize,
            s.sectionOrder,
            s.themeVariant,
            s.version,
            s.createdAt || now,
            now
          );
        }
        db.prepare('DELETE FROM brand_rail_items').run();
        const insertItem = db.prepare(`
          INSERT INTO brand_rail_items (
            id, brand_id, enabled, sort_order, optional_display_label, link_enabled, version, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
        `);
        for (const it of items) {
          insertItem.run(
            it.id,
            it.brandId,
            it.enabled ? 1 : 0,
            it.sortOrder,
            it.optionalDisplayLabel || null,
            it.linkEnabled ? 1 : 0,
            now,
            now
          );
        }
      }

      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };

  const logAction = ({ category, action, title, details = '', ipAddress = '', userAgent = '', status = 'info' }) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO audit_logs(category, action, title, details, ip_address, user_agent, status, created_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      stmt.run(
        category || 'system',
        action || 'action',
        title || 'Audit Hadisəsi',
        typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
        ipAddress || '',
        userAgent || '',
        status || 'info'
      );
    } catch (err) {
      console.error('Audit log error:', err);
    }
  };

  const getLogs = ({ category = 'all', search = '', limit = 100, offset = 0 } = {}) => {
    let query = 'SELECT * FROM audit_logs';
    const conditions = [];
    const params = [];

    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search && search.trim()) {
      conditions.push('(title LIKE ? OR details LIKE ? OR action LIKE ? OR ip_address LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const rows = db.prepare(query).all(...params);

    let countQuery = 'SELECT COUNT(*) as total FROM audit_logs';
    const countParams = params.slice(0, -2);
    if (conditions.length) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const totalRow = db.prepare(countQuery).get(...countParams);

    return {
      logs: rows.map((r) => ({
        id: r.id,
        category: r.category,
        action: r.action,
        title: r.title,
        details: r.details,
        ipAddress: r.ip_address,
        userAgent: r.user_agent,
        status: r.status,
        createdAt: r.created_at,
      })),
      total: totalRow?.total || 0,
    };
  };

  const clearLogs = () => {
    db.exec('DELETE FROM audit_logs');
  };

  const getFilteredAnalytics = ({ range = 'all', fromDate, toDate } = {}) => {
    let dateFilter = '';
    const params = [];

    if (range === 'today') {
      dateFilter = "date(created_at, 'localtime') = date('now', 'localtime')";
    } else if (range === 'yesterday') {
      dateFilter = "date(created_at, 'localtime') = date('now', 'localtime', '-1 day')";
    } else if (range === 'this_week') {
      dateFilter = "date(created_at, 'localtime') >= date('now', 'localtime', 'weekday 0', '-6 days')";
    } else if (range === 'this_month') {
      dateFilter = "strftime('%Y-%m', created_at, 'localtime') = strftime('%Y-%m', 'now', 'localtime')";
    } else if (range === 'last_30_days') {
      dateFilter = "date(created_at, 'localtime') >= date('now', 'localtime', '-30 days')";
    } else if (range === 'custom' && fromDate) {
      if (toDate) {
        dateFilter = "date(created_at, 'localtime') BETWEEN date(?) AND date(?)";
        params.push(fromDate, toDate);
      } else {
        dateFilter = "date(created_at, 'localtime') = date(?)";
        params.push(fromDate);
      }
    }

    let eventQuery = 'SELECT event_type, product_id, COUNT(*) as count FROM analytics_events';
    if (dateFilter) {
      eventQuery += ' WHERE ' + dateFilter;
    }
    eventQuery += ' GROUP BY event_type, product_id';

    const eventRows = db.prepare(eventQuery).all(...params);

    let catalogViews = 0;
    const productViews = {};
    const contactActions = { whatsapp: 0, call: 0 };
    const contactActionsByProduct = {};

    for (const row of eventRows) {
      if (row.event_type === 'catalog_view') {
        catalogViews += row.count;
      } else if (row.event_type === 'product_view' && row.product_id) {
        productViews[row.product_id] = (productViews[row.product_id] || 0) + row.count;
      } else if (row.event_type === 'contact_whatsapp' || row.event_type === 'contact_call') {
        const action = row.event_type === 'contact_whatsapp' ? 'whatsapp' : 'call';
        contactActions[action] = (contactActions[action] || 0) + row.count;
        if (row.product_id) {
          if (!contactActionsByProduct[row.product_id]) {
            contactActionsByProduct[row.product_id] = { whatsapp: 0, call: 0 };
          }
          contactActionsByProduct[row.product_id][action] = (contactActionsByProduct[row.product_id][action] || 0) + row.count;
        }
      }
    }

    if (range === 'all') {
      const general = db.prepare('SELECT catalog_views, last_viewed_at FROM catalog_analytics WHERE id = 1').get();
      if (general && general.catalog_views > catalogViews) {
        catalogViews = general.catalog_views;
      }
      const pRows = db.prepare('SELECT product_id, view_count FROM product_view_stats').all();
      for (const pr of pRows) {
        if (!productViews[pr.product_id] || pr.view_count > productViews[pr.product_id]) {
          productViews[pr.product_id] = pr.view_count;
        }
      }
    }

    return {
      catalogViews,
      productViews,
      contactActions,
      contactActionsByProduct,
      range,
      fromDate: fromDate || null,
      toDate: toDate || null,
    };
  };

  const getAnalytics = () => {
    return getFilteredAnalytics({ range: 'all' });
  };

  const trackEvent = (type, productId) => {
    const now = new Date().toISOString();
    db.exec('BEGIN IMMEDIATE');
    try {
      if (type === 'catalog_view') {
        db.prepare('UPDATE catalog_analytics SET catalog_views = catalog_views + 1, last_viewed_at = ? WHERE id = 1').run(now);
      } else if (type === 'product_view' && productId) {
        db.prepare(`INSERT INTO product_view_stats(product_id, view_count, last_viewed_at) VALUES(?, 1, ?) ON CONFLICT(product_id) DO UPDATE SET view_count = view_count + 1, last_viewed_at = excluded.last_viewed_at`).run(productId, now);
      } else if ((type === 'contact_whatsapp' || type === 'contact_call') && productId) {
        const action = type === 'contact_whatsapp' ? 'whatsapp' : 'call';
        db.prepare(`INSERT INTO contact_action_stats(action_type, product_id, click_count, last_clicked_at) VALUES(?, ?, 1, ?) ON CONFLICT(action_type, product_id) DO UPDATE SET click_count = click_count + 1, last_clicked_at = excluded.last_clicked_at`).run(action, productId, now);
      }
      db.prepare('INSERT INTO analytics_events(event_type, product_id, created_at) VALUES(?, ?, ?)').run(type, productId || '', now);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };

  const replaceWith = (sourceDatabase) => {
    const sourceData = sourceDatabase.getCatalog();
    saveCatalog(sourceData);
  };

  const isCatalogEmpty = () => {
    const row = db.prepare('SELECT COUNT(*) as count FROM products').get();
    return !row || row.count === 0;
  };

  const health = () => {
    try {
      db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  };

  const recordEvent = (event) => trackEvent(event.type, event.productId);

  const importAnalytics = (data) => {
    if (!data) return;
    db.exec('BEGIN IMMEDIATE');
    try {
      if (typeof data.catalogViews === 'number') {
        db.prepare('UPDATE catalog_analytics SET catalog_views = ?, last_viewed_at = ? WHERE id = 1').run(data.catalogViews, data.lastViewedAt || null);
      }
      if (data.productViews && typeof data.productViews === 'object') {
        for (const [pId, count] of Object.entries(data.productViews)) {
          db.prepare('INSERT INTO product_view_stats(product_id, view_count) VALUES(?, ?) ON CONFLICT(product_id) DO UPDATE SET view_count = ?').run(pId, count, count);
        }
      }
      if (data.contactActions && typeof data.contactActions === 'object') {
        for (const [action, count] of Object.entries(data.contactActions)) {
          if (['whatsapp', 'call'].includes(action)) {
            db.prepare('INSERT INTO contact_action_stats(action_type, product_id, click_count) VALUES(?, ?, ?) ON CONFLICT(action_type, product_id) DO UPDATE SET click_count = ?').run(action, 'global', count, count);
          }
        }
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };

  const createSnapshot = ({ name = 'Avtomatik Nüsxə', createdBy = 'admin', catalogData = null } = {}) => {
    const data = catalogData || getCatalog();
    const id = `snap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const json = JSON.stringify(data);
    const productCount = data.products?.length || 0;
    db.prepare('INSERT INTO catalog_snapshots(id, name, catalog_json, product_count, created_by, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))')
      .run(id, name, json, productCount, createdBy);
    
    // Prune very old auto-snapshots, keeping last 50
    db.exec(`DELETE FROM catalog_snapshots WHERE id NOT IN (SELECT id FROM catalog_snapshots ORDER BY created_at DESC LIMIT 50)`);
    return { id, name, productCount, createdAt: new Date().toISOString() };
  };

  const getSnapshots = ({ limit = 50, offset = 0 } = {}) => {
    const rows = db.prepare('SELECT id, name, product_count, created_by, created_at FROM catalog_snapshots ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
    const total = db.prepare('SELECT COUNT(*) as count FROM catalog_snapshots').get().count;
    return {
      snapshots: rows.map((r) => ({
        id: r.id,
        name: r.name,
        productCount: r.product_count,
        createdBy: r.created_by,
        createdAt: r.created_at,
      })),
      total,
    };
  };

  const getSnapshot = (id) => {
    const row = db.prepare('SELECT * FROM catalog_snapshots WHERE id = ?').get(id);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      catalog: JSON.parse(row.catalog_json),
      productCount: row.product_count,
      createdBy: row.created_by,
      createdAt: row.created_at,
    };
  };

  const restoreSnapshot = (id) => {
    const snap = getSnapshot(id);
    if (!snap) throw new Error('Nüsxə tapılmadı');
    createSnapshot({ name: `Bərpadan əvvəlki ehtiyat nüsxə (${snap.name})`, createdBy: 'system' });
    saveCatalog(snap.catalog);
    return snap.catalog;
  };

  const deleteSnapshot = (id) => {
    db.prepare('DELETE FROM catalog_snapshots WHERE id = ?').run(id);
    return true;
  };

  const tableNames = () => {
    return db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name);
  };

  const checkpoint = () => {
    try {
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch {}
  };

  const backupDatabase = async (destinationPath) => {
    checkpoint();
    if (typeof db.backup === 'function') {
      try {
        await db.backup(destinationPath);
        return true;
      } catch (err) {
        throw new Error(`Failed to create database backup via SQLite backup API: ${err.message}`);
      }
    }
    try {
      const escaped = destinationPath.replace(/'/g, "''");
      db.exec(`VACUUM INTO '${escaped}';`);
      return true;
    } catch (err) {
      throw new Error(`Failed to create atomic database backup via VACUUM INTO: ${err.message}`);
    }
  };

  const updateCatalogStatus = (active, message) => {
    const isAct = active ? 1 : 0;
    const msg =
      message || 'Kataloqda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.';
    db.prepare(`
      UPDATE catalog_settings
      SET catalog_active = ?, maintenance_message = ?, updated_at = datetime('now')
      WHERE id = 1
    `).run(isAct, msg);
    return { active: Boolean(isAct), message: msg };
  };

  const updateSiteStatus = (active, message) => {
    const isAct = active ? 1 : 0;
    const msg =
      message || 'Saytda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.';
    db.prepare(`
      UPDATE catalog_settings
      SET site_active = ?, site_maintenance_message = ?, updated_at = datetime('now')
      WHERE id = 1
    `).run(isAct, msg);
    return { active: Boolean(isAct), message: msg };
  };

  const close = () => {
    try {
      checkpoint();
      db.close();
    } catch {}
  };

  return {
    db,
    getCatalog,
    getAdminData: () => getCatalog({ includeAll: true }),
    saveCatalog,
    publishAtomic,
    updateCatalogStatus,
    updateSiteStatus,
    createSnapshot,
    getSnapshots,
    getSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    getAnalytics,
    getFilteredAnalytics,
    logAction,
    getLogs,
    clearLogs,
    trackEvent,
    recordEvent,
    isCatalogEmpty,
    health,
    importAnalytics,
    replaceWith,
    tableNames,
    checkpoint,
    backupDatabase,
    close,
  };
};

/**
 * Creates an atomic, online consistent snapshot of an existing SQLite database using VACUUM INTO.
 * Fails closed with an explicit error if VACUUM INTO fails.
 */
export function createConsistentDatabaseSnapshot(sourceDbPath, destinationDbPath) {
  const sourceDb = new DatabaseSync(sourceDbPath, { readOnly: true });
  try {
    const escaped = destinationDbPath.replace(/'/g, "''");
    sourceDb.exec(`VACUUM INTO '${escaped}';`);
  } catch (err) {
    throw new Error(`Failed to create consistent database snapshot from '${sourceDbPath}' to '${destinationDbPath}': ${err.message}`);
  } finally {
    sourceDb.close();
  }
}
