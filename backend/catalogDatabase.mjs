import { DatabaseSync } from 'node:sqlite';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const bool = (value) => value ? 1 : 0;
const placeholders = (items) => items.map(() => '?').join(',');
const defaultBrandLogos = { ardo: '/media/brands/ardo-logo.png', artel: '/media/brands/artel-logo.svg', lotus: '/media/brands/lotus-mark.svg' };
const defaultCountriesList = ['Türkiyə', 'Çin', 'İtaliya', 'Almaniya', 'Polşa', 'Özbəkistan', 'Rusiya', 'Belarus'];

const defaultArticlesList = [
  {
    id: 'art-inverter',
    title: 'Məişət Texnikasında İnvertor Texnologiyası',
    subtitle: 'İş gücünü ehtiyaca uyğun tənzimləyən, enerjiyə qənaət edən və səssiz işləyən idarəetmə prinsipi.',
    badge: '⚡ Qənaət & Səssiz',
    icon: 'Zap',
    active: true,
    advantages: [
      { title: 'Tənzimlənən enerji istifadəsi', desc: 'Mühərrik və ya kompressor tələb olunan gücə uyğun dəqiq idarə olunaraq 40%-dək enerji qənaəti təmin edir.' },
      { title: 'Səs və vibrasiyanın azaldılması', desc: 'Fasiləsiz minimum gücdə işləyərək kəskin start-stop səslərini və vibrasiyanı aradan qaldırır.' },
      { title: 'Daha sabit iş rejimi və temperatur', desc: 'Tez-tez sönüb-yanmadan qoyulmuş dərəcəni daimi və bərabər saxlayır.' },
      { title: 'Uzunömürlü etibarlı istismar', desc: 'Aşınma və elektrik gərginliyi dalğalanmalarına qarşı daha yüksək dayanıqlılıq göstərir.' },
    ],
  },
  {
    id: 'art-sabaf',
    title: 'İtalyan SABAF Qaz Yanma Sistemi',
    subtitle: 'Dünyanın ən etibarlı və təhlükəsiz qaz forsunkaları ilə 100% təhlükəsizlik və qənaət.',
    badge: '🔥 İtalyan Təhlükəsizlik',
    icon: 'Flame',
    active: true,
    advantages: [
      { title: 'Qaz Nəzarət Sistemi (Gas Control)', desc: 'Külək və ya daşma səbəbilə alov sönərsə, qaz təchizatı 0.5 saniyə ərzində avtomatik bağlanır.' },
      { title: 'Yüksək Yanma Səmərəliliyi', desc: 'Mavi alov texnologiyası ilə maksimum istilik verimi yaradır, qaz itkisinin qarşısını alır.' },
      { title: 'Paslanmaz Orijinal Ərinti', desc: 'Yüksək temperatura dözümlü xüsusi ərinti korroziyaya uğramır və deşiklər tutulmur.' },
      { title: 'Bərabər İstilik Paylanması', desc: 'Qazan və tavaların dibinə istiliyi tam bərabər yayaraq yeməklərin dibinin yanmasını önləyir.' },
    ],
  },
  {
    id: 'art-convection',
    title: '3D Dairəvi Konveksiya və Bərabər Bişirmə',
    subtitle: 'Sobada ventilyator və dairəvi qızdırıcı element vasitəsilə restoran səviyyəsində bişirmə imkanı.',
    badge: '🌪️ 3D Konveksiya',
    icon: 'Wind',
    active: true,
    advantages: [
      { title: 'Bərabər İstilik Sirkulyasiyası', desc: 'İsti hava kameranın hər nöqtəsinə çatır, yeməklər hər iki tərəfdən qızılı bişir.' },
      { title: 'Çoxsəviyyəli Eyni Vaxtda Bişirmə', desc: '2 və ya 3 səviyyədə fərqli yeməkləri qoxuları qarışmadan eyni anda bişirə bilərsiniz.' },
      { title: '25% Daha Tez Hazırlıq', desc: 'Ənənəvi statik sobalara nisbətən yeməklər daha qısa müddətdə hazır olur.' },
      { title: 'Şirəli Daxili, Xırtıldayan Qabıq', desc: 'Yeməyin şirəsini daxilində saxlayaraq xaricdən mükəmməl xırtıldayan dad verir.' },
    ],
  },
];

export const createCatalogDatabase = (databasePath) => {
  mkdirSync(dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
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
      address TEXT NOT NULL DEFAULT 'Bakı şəhəri, Sədərək Ticarət Mərkəzi',
      email TEXT NOT NULL DEFAULT 'info@saharaelectronics.az',
      working_hours TEXT NOT NULL DEFAULT 'Bazar ertəsi - Bazar: 09:00 - 18:00',
      map_url TEXT NOT NULL DEFAULT '',
      location_note TEXT NOT NULL DEFAULT 'Məişət texnikası satışı və rəsmi zəmanət xidməti',
      countries TEXT NOT NULL DEFAULT '["Türkiyə","Çin","İtaliya","Almaniya","Polşa","Özbəkistan"]',
      instagram_username TEXT NOT NULL DEFAULT '@sahara.electronics',
      instagram_url TEXT NOT NULL DEFAULT 'https://instagram.com/sahara.electronics',
      facebook_username TEXT NOT NULL DEFAULT 'Sahara Electronics',
      facebook_url TEXT NOT NULL DEFAULT 'https://facebook.com/saharaelectronics',
      articles TEXT NOT NULL DEFAULT '[]',
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
    INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (1, datetime('now'));
    INSERT OR IGNORE INTO catalog_analytics(id, catalog_views) VALUES (1, 0);
    INSERT OR IGNORE INTO catalog_settings(id, whatsapp_number, phone_number, updated_at) VALUES (1, '', '', datetime('now'));
  `);
  const brandColumns = db.prepare('PRAGMA table_info(brands)').all().map((row) => row.name);
  if (!brandColumns.includes('coming_soon')) {
    db.exec('ALTER TABLE brands ADD COLUMN coming_soon INTEGER NOT NULL DEFAULT 0 CHECK(coming_soon IN (0, 1));');
    db.prepare('INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (2, ?)').run(new Date().toISOString());
  }
  const productColumns = db.prepare('PRAGMA table_info(products)').all().map((row) => row.name);
  if (productColumns.includes('price')) db.exec('ALTER TABLE products DROP COLUMN price;');
  if (productColumns.includes('old_price')) db.exec('ALTER TABLE products DROP COLUMN old_price;');
  if (productColumns.includes('price') || productColumns.includes('old_price')) {
    db.prepare('INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (3, ?)').run(new Date().toISOString());
  }
  db.prepare('INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (4, ?)').run(new Date().toISOString());

  // Migration 5, 6, 7: Settings columns
  const settingsColumns = db.prepare('PRAGMA table_info(catalog_settings)').all().map((row) => row.name);
  if (!settingsColumns.includes('company_name')) {
    db.exec("ALTER TABLE catalog_settings ADD COLUMN company_name TEXT NOT NULL DEFAULT 'Sahara Electronics';");
  }
  if (!settingsColumns.includes('address')) {
    db.exec("ALTER TABLE catalog_settings ADD COLUMN address TEXT NOT NULL DEFAULT 'Bakı şəhəri, Sədərək Ticarət Mərkəzi';");
  }
  if (!settingsColumns.includes('email')) {
    db.exec("ALTER TABLE catalog_settings ADD COLUMN email TEXT NOT NULL DEFAULT 'info@saharaelectronics.az';");
  }
  if (!settingsColumns.includes('working_hours')) {
    db.exec("ALTER TABLE catalog_settings ADD COLUMN working_hours TEXT NOT NULL DEFAULT 'Bazar ertəsi - Bazar: 09:00 - 18:00';");
  }
  if (!settingsColumns.includes('map_url')) {
    db.exec("ALTER TABLE catalog_settings ADD COLUMN map_url TEXT NOT NULL DEFAULT '';");
  }
  if (!settingsColumns.includes('location_note')) {
    db.exec("ALTER TABLE catalog_settings ADD COLUMN location_note TEXT NOT NULL DEFAULT 'Məişət texnikası satışı və rəsmi zəmanət xidməti';");
  }
  if (!settingsColumns.includes('countries')) {
    db.exec("ALTER TABLE catalog_settings ADD COLUMN countries TEXT NOT NULL DEFAULT '[\"Türkiyə\",\"Çin\",\"İtaliya\",\"Almaniya\",\"Polşa\",\"Özbəkistan\"]';");
  }
  if (!settingsColumns.includes('instagram_username')) {
    db.exec("ALTER TABLE catalog_settings ADD COLUMN instagram_username TEXT NOT NULL DEFAULT '@sahara.electronics';");
  }
  if (!settingsColumns.includes('instagram_url')) {
    db.exec("ALTER TABLE catalog_settings ADD COLUMN instagram_url TEXT NOT NULL DEFAULT 'https://instagram.com/sahara.electronics';");
  }
  if (!settingsColumns.includes('facebook_username')) {
    db.exec("ALTER TABLE catalog_settings ADD COLUMN facebook_username TEXT NOT NULL DEFAULT 'Sahara Electronics';");
  }
  if (!settingsColumns.includes('facebook_url')) {
    db.exec("ALTER TABLE catalog_settings ADD COLUMN facebook_url TEXT NOT NULL DEFAULT 'https://facebook.com/saharaelectronics';");
  }
  if (!settingsColumns.includes('phone_numbers')) {
    db.exec("ALTER TABLE catalog_settings ADD COLUMN phone_numbers TEXT NOT NULL DEFAULT '[]';");
  }
  if (!settingsColumns.includes('articles')) {
    db.exec("ALTER TABLE catalog_settings ADD COLUMN articles TEXT NOT NULL DEFAULT '[]';");
  }
  db.prepare('INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (7, ?)').run(new Date().toISOString());

  if (databasePath !== ':memory:') chmodSync(databasePath, 0o600);

  const getCatalog = () => {
    const brands = db.prepare('SELECT * FROM brands ORDER BY name').all().map((row) => ({
      id: row.id, name: row.name, slug: row.slug, originCountry: row.origin_country,
      manufacturingCountries: db.prepare('SELECT country FROM brand_manufacturing_countries WHERE brand_id = ? ORDER BY sort_order').all(row.id).map((item) => item.country),
      description: row.description || undefined, logo: row.logo || defaultBrandLogos[row.id] || undefined, active: Boolean(row.active), comingSoon: Boolean(row.coming_soon),
    }));
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order, name').all().map((row) => ({
      id: row.id, name: row.name, slug: row.slug, icon: row.icon || undefined, active: Boolean(row.active), sortOrder: row.sort_order,
    }));
    const mediaStatement = db.prepare('SELECT * FROM product_media WHERE product_id = ? ORDER BY sort_order');
    const highlightStatement = db.prepare('SELECT value FROM product_highlights WHERE product_id = ? ORDER BY sort_order');
    const specStatement = db.prepare('SELECT * FROM product_specs WHERE product_id = ? ORDER BY sort_order');
    const products = db.prepare(`SELECT products.*, categories.name AS category_name FROM products JOIN categories ON categories.id = products.category_id ORDER BY products.created_at, products.id`).all().map((row) => {
      const media = mediaStatement.all(row.id).map((item) => ({ id: item.id, type: item.media_type, url: item.url, alt: item.alt_text || undefined, poster: item.poster || undefined }));
      return {
        id: row.id, code: row.code, title: row.title, brandId: row.brand_id,
        category: row.category_id, categoryName: row.category_name, image: row.primary_image,
        gallery: media.filter((item) => item.type === 'image').map((item) => item.url), media,
        isFeatured: Boolean(row.is_featured), isNew: Boolean(row.is_new), badgeText: row.badge_text || undefined,
        shortDesc: row.short_description,
        manufacturingCountry: row.manufacturing_country, status: row.status,
        createdAt: row.created_at, updatedAt: row.updated_at,
        highlights: highlightStatement.all(row.id).map((item) => item.value),
        specs: specStatement.all(row.id).map((item) => ({
          id: item.id, name: item.name, value: item.value, description: item.description || undefined,
          icon: item.icon || undefined, group: item.spec_group,
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

    const settings = {
      whatsappNumber: settingsRow?.whatsapp_number || '',
      phoneNumber: settingsRow?.phone_number || phoneNumbers[0] || '',
      phoneNumbers,
      companyName: settingsRow?.company_name || 'Sahara Electronics',
      address: settingsRow?.address || 'Bakı şəhəri, Sədərək Ticarət Mərkəzi',
      email: settingsRow?.email || 'info@saharaelectronics.az',
      workingHours: settingsRow?.working_hours || 'Bazar ertəsi - Bazar: 09:00 - 18:00',
      mapUrl: settingsRow?.map_url || '',
      locationNote: settingsRow?.location_note || 'Məişət texnikası satışı və rəsmi zəmanət xidməti',
      countries,
      instagramUsername: settingsRow?.instagram_username || '@sahara.electronics',
      instagramUrl: settingsRow?.instagram_url || 'https://instagram.com/sahara.electronics',
      facebookUsername: settingsRow?.facebook_username || 'Sahara Electronics',
      facebookUrl: settingsRow?.facebook_url || 'https://facebook.com/saharaelectronics',
    };
    return { brands, categories, products, settings, countries, articles, updatedAt: meta?.value };
  };

  const saveCatalog = (catalog) => {
    const now = catalog.updatedAt || new Date().toISOString();
    const upsertBrand = db.prepare(`INSERT INTO brands(id,name,slug,origin_country,description,logo,coming_soon,active) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,origin_country=excluded.origin_country,description=excluded.description,logo=excluded.logo,coming_soon=excluded.coming_soon,active=excluded.active`);
    const upsertCategory = db.prepare(`INSERT INTO categories(id,name,slug,icon,active,sort_order) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,icon=excluded.icon,active=excluded.active,sort_order=excluded.sort_order`);
    const upsertProduct = db.prepare(`INSERT INTO products(id,code,title,brand_id,category_id,primary_image,is_featured,is_new,badge_text,short_description,manufacturing_country,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET code=excluded.code,title=excluded.title,brand_id=excluded.brand_id,category_id=excluded.category_id,primary_image=excluded.primary_image,is_featured=excluded.is_featured,is_new=excluded.is_new,badge_text=excluded.badge_text,short_description=excluded.short_description,manufacturing_country=excluded.manufacturing_country,status=excluded.status,updated_at=excluded.updated_at`);
    db.exec('BEGIN IMMEDIATE');
    try {
      for (const brand of catalog.brands) {
        upsertBrand.run(brand.id, brand.name, brand.slug, brand.originCountry || '', brand.description || '', brand.logo || '', bool(brand.comingSoon), bool(brand.active));
        db.prepare('DELETE FROM brand_manufacturing_countries WHERE brand_id = ?').run(brand.id);
        (brand.manufacturingCountries || []).forEach((country, index) => db.prepare('INSERT INTO brand_manufacturing_countries(brand_id,country,sort_order) VALUES(?,?,?)').run(brand.id, country, index));
      }
      for (const category of catalog.categories) upsertCategory.run(category.id, category.name, category.slug, category.icon || '', bool(category.active), category.sortOrder || 0);
      for (const product of catalog.products) {
        const createdAt = product.createdAt || now;
        upsertProduct.run(product.id, product.code, product.title, product.brandId, product.category, product.image || '', bool(product.isFeatured), bool(product.isNew), product.badgeText || '', product.shortDesc || '', product.manufacturingCountry || '', product.status === 'published' ? 'published' : 'draft', createdAt, now);
        db.prepare('DELETE FROM product_media WHERE product_id = ?').run(product.id);
        db.prepare('DELETE FROM product_highlights WHERE product_id = ?').run(product.id);
        db.prepare('DELETE FROM product_specs WHERE product_id = ?').run(product.id);
        (product.media || []).forEach((item, index) => db.prepare('INSERT INTO product_media(id,product_id,media_type,url,alt_text,poster,sort_order) VALUES(?,?,?,?,?,?,?)').run(item.id, product.id, item.type, item.url, item.alt || '', item.poster || '', index));
        (product.highlights || []).forEach((value, index) => db.prepare('INSERT INTO product_highlights(product_id,value,sort_order) VALUES(?,?,?)').run(product.id, value, index));
        (product.specs || []).forEach((item, index) => db.prepare('INSERT INTO product_specs(id,product_id,name,value,description,icon,spec_group,sort_order) VALUES(?,?,?,?,?,?,?,?)').run(item.id, product.id, item.name, item.value || '', item.description || '', item.icon || '', item.group || 'Əsas', index));
      }
      const productIds = catalog.products.map((item) => item.id);
      const categoryIds = catalog.categories.map((item) => item.id);
      const brandIds = catalog.brands.map((item) => item.id);
      if (productIds.length) db.prepare(`DELETE FROM products WHERE id NOT IN (${placeholders(productIds)})`).run(...productIds); else db.exec('DELETE FROM products');
      if (categoryIds.length) db.prepare(`DELETE FROM categories WHERE id NOT IN (${placeholders(categoryIds)})`).run(...categoryIds); else db.exec('DELETE FROM categories');
      if (brandIds.length) db.prepare(`DELETE FROM brands WHERE id NOT IN (${placeholders(brandIds)})`).run(...brandIds); else db.exec('DELETE FROM brands');
      if (catalog.settings) {
        const countriesJson = JSON.stringify(catalog.settings.countries || catalog.countries || defaultCountriesList);
        const phoneNumbersJson = JSON.stringify(catalog.settings.phoneNumbers || (catalog.settings.phoneNumber ? [catalog.settings.phoneNumber] : []));
        const articlesJson = JSON.stringify(catalog.articles || defaultArticlesList);
        const primaryPhone = catalog.settings.phoneNumber || (catalog.settings.phoneNumbers && catalog.settings.phoneNumbers[0]) || '';
        
        db.prepare(`
          UPDATE catalog_settings
          SET whatsapp_number = ?, phone_number = ?, phone_numbers = ?, company_name = ?, address = ?, email = ?, working_hours = ?, map_url = ?, location_note = ?, countries = ?, instagram_username = ?, instagram_url = ?, facebook_username = ?, facebook_url = ?, articles = ?, updated_at = ?
          WHERE id = 1
        `).run(
          catalog.settings.whatsappNumber || '',
          primaryPhone,
          phoneNumbersJson,
          catalog.settings.companyName || 'Sahara Electronics',
          catalog.settings.address || 'Bakı şəhəri, Sədərək Ticarət Mərkəzi',
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

  const getAnalytics = () => {
    const catalog = db.prepare('SELECT catalog_views,last_viewed_at FROM catalog_analytics WHERE id = 1').get();
    const productViews = Object.fromEntries(db.prepare('SELECT product_id,view_count FROM product_view_stats').all().map((row) => [row.product_id, row.view_count]));
    const contactActions = { whatsapp: 0, call: 0 };
    const contactActionsByProduct = {};
    for (const row of db.prepare('SELECT action_type,product_id,click_count FROM contact_action_stats').all()) {
      contactActions[row.action_type] += row.click_count;
      contactActionsByProduct[row.product_id] ||= { whatsapp: 0, call: 0 };
      contactActionsByProduct[row.product_id][row.action_type] = row.click_count;
    }
    return { catalogViews: catalog?.catalog_views || 0, productViews, contactActions, contactActionsByProduct, lastViewedAt: catalog?.last_viewed_at || undefined };
  };

  const importAnalytics = (analytics) => {
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('UPDATE catalog_analytics SET catalog_views = ?, last_viewed_at = ? WHERE id = 1').run(Number(analytics?.catalogViews || 0), analytics?.lastViewedAt || null);
      for (const [productId, views] of Object.entries(analytics?.productViews || {})) db.prepare('INSERT INTO product_view_stats(product_id,view_count,last_viewed_at) VALUES(?,?,?) ON CONFLICT(product_id) DO UPDATE SET view_count=excluded.view_count,last_viewed_at=excluded.last_viewed_at').run(productId, Number(views || 0), analytics?.lastViewedAt || null);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  };

  const recordEvent = (event) => {
    const now = new Date().toISOString();
    if (event.type === 'catalog_view') db.prepare('UPDATE catalog_analytics SET catalog_views = catalog_views + 1, last_viewed_at = ? WHERE id = 1').run(now);
    if (event.type === 'product_view' && event.productId) db.prepare('INSERT INTO product_view_stats(product_id,view_count,last_viewed_at) VALUES(?,1,?) ON CONFLICT(product_id) DO UPDATE SET view_count=view_count+1,last_viewed_at=excluded.last_viewed_at').run(event.productId, now);
    if ((event.type === 'contact_whatsapp' || event.type === 'contact_call') && event.productId) {
      const action = event.type === 'contact_whatsapp' ? 'whatsapp' : 'call';
      db.prepare('INSERT INTO contact_action_stats(action_type,product_id,click_count,last_clicked_at) VALUES(?,?,1,?) ON CONFLICT(action_type,product_id) DO UPDATE SET click_count=click_count+1,last_clicked_at=excluded.last_clicked_at').run(action, event.productId, now);
    }
  };

  return {
    getCatalog,
    saveCatalog,
    getAnalytics,
    importAnalytics,
    recordEvent,
    isCatalogEmpty: () => Number(db.prepare('SELECT COUNT(*) AS count FROM products').get().count) === 0,
    health: () => db.prepare('SELECT 1 AS ok').get().ok === 1,
    tableNames: () => db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map((row) => row.name),
    close: () => db.close(),
  };
};
