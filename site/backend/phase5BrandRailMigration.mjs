export const CANONICAL_54_BRANDS = [
  { name: 'Arçelik', slug: 'arcelik', originCountry: 'Türkiyə' },
  { name: 'AEG', slug: 'aeg', originCountry: 'Almaniya' },
  { name: 'Ardesto', slug: 'ardesto', originCountry: 'Ukrayna' },
  { name: 'ARDO', slug: 'ardo', originCountry: 'İtaliya', logo: '/media/brands/ardo-mark.svg' },
  { name: 'Ariston', slug: 'ariston', originCountry: 'İtaliya' },
  { name: 'ARTEL', slug: 'artel', originCountry: 'Özbəkistan', logo: '/media/brands/artel-logo.svg' },
  { name: 'Arlant', slug: 'arlant', originCountry: '' },
  { name: 'Beko', slug: 'beko', originCountry: 'Türkiyə' },
  { name: 'Biryusa', slug: 'biryusa', originCountry: 'Rusiya' },
  { name: 'Bosch', slug: 'bosch', originCountry: 'Almaniya' },
  { name: 'Daewoo', slug: 'daewoo', originCountry: 'Cənubi Koreya' },
  { name: 'Darkin', slug: 'darkin', originCountry: '' },
  { name: 'Electrolux', slug: 'electrolux', originCountry: 'İsveç' },
  { name: 'ES', slug: 'es', originCountry: '' },
  { name: 'Eurolux', slug: 'eurolux', originCountry: '' },
  { name: 'Everest', slug: 'everest', originCountry: '' },
  { name: 'Ficher', slug: 'ficher', originCountry: '' },
  { name: 'Finlux', slug: 'finlux', originCountry: 'Finlandiya' },
  { name: 'GoldMaster', slug: 'goldmaster', originCountry: 'Türkiyə' },
  { name: 'Hailang', slug: 'hailang', originCountry: 'Çin' },
  { name: 'Hayland', slug: 'hayland', originCountry: '' },
  { name: 'Hisense', slug: 'hisense', originCountry: 'Çin' },
  { name: 'Hitachi', slug: 'hitachi', originCountry: 'Yaponiya' },
  { name: 'Hoffmann', slug: 'hoffmann', originCountry: 'Almaniya' },
  { name: 'Hotpoint', slug: 'hotpoint', originCountry: 'İtaliya' },
  { name: 'Indesit', slug: 'indesit', originCountry: 'İtaliya' },
  { name: 'Javel', slug: 'javel', originCountry: '' },
  { name: 'Konka', slug: 'konka', originCountry: 'Çin' },
  { name: 'Konko', slug: 'konko', originCountry: '' },
  { name: 'Lanova', slug: 'lanova', originCountry: '' },
  { name: 'LG', slug: 'lg', originCountry: 'Cənubi Koreya' },
  { name: 'LOTUS', slug: 'lotus', originCountry: 'Türkiyə', logo: '/media/brands/lotus-mark.svg' },
  { name: 'MGI', slug: 'mgi', originCountry: '' },
  { name: 'Midea', slug: 'midea', originCountry: 'Çin' },
  { name: 'Neos', slug: 'neos', originCountry: '' },
  { name: 'Pozis', slug: 'pozis', originCountry: 'Rusiya' },
  { name: 'Regal', slug: 'regal', originCountry: 'Türkiyə' },
  { name: 'Rokos', slug: 'rokos', originCountry: '' },
  { name: 'Samsung', slug: 'samsung', originCountry: 'Cənubi Koreya' },
  { name: 'Sharp', slug: 'sharp', originCountry: 'Yaponiya' },
  { name: 'Shivaki', slug: 'shivaki', originCountry: 'Yaponiya' },
  { name: 'Siemens', slug: 'siemens', originCountry: 'Almaniya' },
  { name: 'Silver', slug: 'silver', originCountry: '' },
  { name: 'Skyworth', slug: 'skyworth', originCountry: 'Çin' },
  { name: 'Talberg', slug: 'talberg', originCountry: '' },
  { name: 'TCL', slug: 'tcl', originCountry: 'Çin' },
  { name: 'Tesla', slug: 'tesla', originCountry: 'Serbiya' },
  { name: 'Toshiba', slug: 'toshiba', originCountry: 'Yaponiya' },
  { name: 'Vegas', slug: 'vegas', originCountry: '' },
  { name: 'Vestel', slug: 'vestel', originCountry: 'Türkiyə' },
  { name: 'Whirlpool', slug: 'whirlpool', originCountry: 'ABŞ' },
  { name: 'Winsor', slug: 'winsor', originCountry: '' },
  { name: 'Yoshiro', slug: 'yoshiro', originCountry: '' },
  { name: 'Zanussi', slug: 'zanussi', originCountry: 'İtaliya' },
];

export const PHASE5_BRAND_RAIL_MANIFEST = {
  version: 'phase5_brand_rail_v1',
  tables: [
    {
      name: 'brand_rail_settings',
      columns: [
        { name: 'id', type: 'TEXT', notnull: 1, pk: 1, dflt_value: null },
        { name: 'enabled', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: '1' },
        { name: 'title', type: 'TEXT', notnull: 1, pk: 0, dflt_value: "'Brendlər'" },
        { name: 'animation_enabled', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: '1' },
        { name: 'speed_seconds', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: '30' },
        { name: 'direction', type: 'TEXT', notnull: 1, pk: 0, dflt_value: "'left'" },
        { name: 'pause_on_hover', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: '1' },
        { name: 'edge_fade', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: '1' },
        { name: 'card_size', type: 'TEXT', notnull: 1, pk: 0, dflt_value: "'md'" },
        { name: 'section_order', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: '1' },
        { name: 'theme_variant', type: 'TEXT', notnull: 1, pk: 0, dflt_value: "'neutral'" },
        { name: 'version', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: '1' },
        { name: 'created_at', type: 'TEXT', notnull: 1, pk: 0, dflt_value: null },
        { name: 'updated_at', type: 'TEXT', notnull: 1, pk: 0, dflt_value: null },
      ],
    },
    {
      name: 'brand_rail_items',
      columns: [
        { name: 'id', type: 'TEXT', notnull: 1, pk: 1, dflt_value: null },
        { name: 'brand_id', type: 'TEXT', notnull: 1, pk: 0, dflt_value: null },
        { name: 'enabled', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: '1' },
        { name: 'sort_order', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: '0' },
        { name: 'optional_display_label', type: 'TEXT', notnull: 0, pk: 0, dflt_value: null },
        { name: 'link_enabled', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: '1' },
        { name: 'version', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: '1' },
        { name: 'created_at', type: 'TEXT', notnull: 1, pk: 0, dflt_value: null },
        { name: 'updated_at', type: 'TEXT', notnull: 1, pk: 0, dflt_value: null },
      ],
    },
    {
      name: 'brand_rail_revisions',
      columns: [
        { name: 'id', type: 'TEXT', notnull: 1, pk: 1, dflt_value: null },
        { name: 'revision_type', type: 'TEXT', notnull: 1, pk: 0, dflt_value: "'settings'" },
        { name: 'version', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: null },
        { name: 'action', type: 'TEXT', notnull: 1, pk: 0, dflt_value: null },
        { name: 'changed_fields', type: 'TEXT', notnull: 1, pk: 0, dflt_value: null },
        { name: 'diff_payload', type: 'TEXT', notnull: 1, pk: 0, dflt_value: null },
        { name: 'actor', type: 'TEXT', notnull: 1, pk: 0, dflt_value: null },
        { name: 'created_at', type: 'TEXT', notnull: 1, pk: 0, dflt_value: null },
      ],
    },
  ],
};

export function isPhase5BrandRailReady(db) {
  if (!db) return false;
  try {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((t) => t.name);
    return (
      tables.includes('brand_rail_settings') &&
      tables.includes('brand_rail_items') &&
      tables.includes('brand_rail_revisions')
    );
  } catch {
    return false;
  }
}

export function applyPhase5BrandRailSchema(db) {
  if (!db) return;
  db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      origin_country TEXT,
      description TEXT,
      logo TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      coming_soon INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS brand_rail_settings (
      id TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL DEFAULT 'Brendlər',
      animation_enabled INTEGER NOT NULL DEFAULT 1,
      speed_seconds INTEGER NOT NULL DEFAULT 30,
      direction TEXT NOT NULL DEFAULT 'left',
      pause_on_hover INTEGER NOT NULL DEFAULT 1,
      edge_fade INTEGER NOT NULL DEFAULT 1,
      card_size TEXT NOT NULL DEFAULT 'md',
      section_order INTEGER NOT NULL DEFAULT 1,
      theme_variant TEXT NOT NULL DEFAULT 'neutral',
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS brand_rail_items (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      optional_display_label TEXT,
      link_enabled INTEGER NOT NULL DEFAULT 1,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_brand_rail_sort ON brand_rail_items(sort_order);
    CREATE INDEX IF NOT EXISTS idx_brand_rail_brand_id ON brand_rail_items(brand_id);

    CREATE TABLE IF NOT EXISTS brand_rail_revisions (
      id TEXT PRIMARY KEY,
      revision_type TEXT NOT NULL DEFAULT 'settings',
      version INTEGER NOT NULL,
      action TEXT NOT NULL,
      changed_fields TEXT NOT NULL,
      diff_payload TEXT NOT NULL,
      actor TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_brand_rail_rev ON brand_rail_revisions(version);
  `);
}

export function seedCanonical54Brands(db, _actor = 'migration') {
  if (!db) return;
  const now = new Date().toISOString();

  // 1. Ensure 54 canonical brands exist in brands table
  const hasComingSoonCol = db
    .prepare("PRAGMA table_info('brands')")
    .all()
    .some((c) => c.name === 'coming_soon');

  for (const b of CANONICAL_54_BRANDS) {
    const existing = db.prepare('SELECT id, name FROM brands WHERE id = ? OR slug = ?').get(b.slug, b.slug);
    if (!existing) {
      if (hasComingSoonCol) {
        db.prepare(`
          INSERT INTO brands (id, name, slug, origin_country, description, logo, active, coming_soon)
          VALUES (?, ?, ?, ?, '', ?, 1, 0)
        `).run(b.slug, b.name, b.slug, b.originCountry || '', b.logo || '');
      } else {
        db.prepare(`
          INSERT INTO brands (id, name, slug, origin_country, description, logo, active)
          VALUES (?, ?, ?, ?, '', ?, 1)
        `).run(b.slug, b.name, b.slug, b.originCountry || '', b.logo || '');
      }
    } else if (existing.name !== b.name) {
      db.prepare('UPDATE brands SET name = ? WHERE id = ?').run(b.name, existing.id);
    }
  }

  // 2. Ensure initial brand_rail_settings
  const settingsCount = db.prepare('SELECT count(*) as cnt FROM brand_rail_settings').get().cnt;
  if (settingsCount === 0) {
    db.prepare(`
      INSERT INTO brand_rail_settings (
        id, enabled, title, animation_enabled, speed_seconds, direction, pause_on_hover, edge_fade, card_size, section_order, theme_variant, version, created_at, updated_at
      ) VALUES (
        'brand_rail_default', 1, 'Brendlər', 1, 30, 'left', 1, 1, 'md', 1, 'neutral', 1, ?, ?
      )
    `).run(now, now);
  }

  // 3. Ensure all 54 brands are in brand_rail_items
  const itemsCount = db.prepare('SELECT count(*) as cnt FROM brand_rail_items').get().cnt;
  if (itemsCount === 0) {
    const insertItem = db.prepare(`
      INSERT INTO brand_rail_items (
        id, brand_id, enabled, sort_order, optional_display_label, link_enabled, version, created_at, updated_at
      ) VALUES (?, ?, 1, ?, NULL, 1, 1, ?, ?)
    `);

    CANONICAL_54_BRANDS.forEach((b, index) => {
      insertItem.run(`rail_item_${b.slug}`, b.slug, index + 1, now, now);
    });
  }
}
