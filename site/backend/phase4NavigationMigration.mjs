export const PHASE4_NAVIGATION_MANIFEST = {
  version: 'phase4_navigation_v1',
  tables: [
    {
      name: 'navigation_items',
      columns: [
        { name: 'id', type: 'TEXT', notnull: 1, pk: 1, dflt_value: null },
        { name: 'placement', type: 'TEXT', notnull: 1, pk: 0, dflt_value: "'header_main'" },
        { name: 'parent_id', type: 'TEXT', notnull: 0, pk: 0, dflt_value: null },
        { name: 'label', type: 'TEXT', notnull: 1, pk: 0, dflt_value: null },
        { name: 'href', type: 'TEXT', notnull: 1, pk: 0, dflt_value: null },
        { name: 'icon_key', type: 'TEXT', notnull: 0, pk: 0, dflt_value: null },
        { name: 'locale', type: 'TEXT', notnull: 1, pk: 0, dflt_value: "'az'" },
        { name: 'sort_order', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: '0' },
        { name: 'enabled', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: '1' },
        { name: 'feature_flag', type: 'TEXT', notnull: 0, pk: 0, dflt_value: null },
        { name: 'open_in_new_tab', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: '0' },
        { name: 'status', type: 'TEXT', notnull: 1, pk: 0, dflt_value: "'published'" },
        { name: 'version', type: 'INTEGER', notnull: 1, pk: 0, dflt_value: '1' },
        { name: 'created_at', type: 'TEXT', notnull: 1, pk: 0, dflt_value: null },
        { name: 'updated_at', type: 'TEXT', notnull: 1, pk: 0, dflt_value: null },
      ],
    },
    {
      name: 'navigation_revisions',
      columns: [
        { name: 'id', type: 'TEXT', notnull: 1, pk: 1, dflt_value: null },
        { name: 'navigation_item_id', type: 'TEXT', notnull: 1, pk: 0, dflt_value: null },
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

export function isPhase4NavigationReady(db) {
  if (!db) return false;
  try {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((t) => t.name);
    return tables.includes('navigation_items') && tables.includes('navigation_revisions');
  } catch {
    return false;
  }
}

export function applyPhase4NavigationSchema(db) {
  if (!db) return;
  db.exec(`
    CREATE TABLE IF NOT EXISTS navigation_items (
      id TEXT PRIMARY KEY,
      placement TEXT NOT NULL DEFAULT 'header_main',
      parent_id TEXT REFERENCES navigation_items(id) ON DELETE SET NULL,
      label TEXT NOT NULL,
      href TEXT NOT NULL,
      icon_key TEXT,
      locale TEXT NOT NULL DEFAULT 'az',
      sort_order INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      feature_flag TEXT,
      open_in_new_tab INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_nav_placement ON navigation_items(placement, sort_order);
    CREATE INDEX IF NOT EXISTS idx_nav_parent ON navigation_items(parent_id);

    CREATE TABLE IF NOT EXISTS navigation_revisions (
      id TEXT PRIMARY KEY,
      navigation_item_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      action TEXT NOT NULL,
      changed_fields TEXT NOT NULL,
      diff_payload TEXT NOT NULL,
      actor TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_nav_rev_item ON navigation_revisions(navigation_item_id, version);
  `);
}

export const DEFAULT_NAVIGATION_SEED = [
  // Top Service Bar
  {
    id: 'nav_service_stores',
    placement: 'top_service_bar',
    label: 'Mağazalarımız',
    href: '/stores',
    sort_order: 1,
    enabled: 1,
    status: 'published',
  },
  {
    id: 'nav_service_services',
    placement: 'top_service_bar',
    label: 'Çatdırılma və Xidmətlər',
    href: '/services',
    sort_order: 2,
    enabled: 1,
    status: 'published',
  },
  {
    id: 'nav_service_support',
    placement: 'top_service_bar',
    label: 'Müştəri Dəstəyi',
    href: '/support',
    sort_order: 3,
    enabled: 1,
    status: 'published',
  },

  // Header Main
  {
    id: 'nav_header_home',
    placement: 'header_main',
    label: 'Ana Səhifə',
    href: '/',
    sort_order: 1,
    enabled: 1,
    status: 'published',
  },
  {
    id: 'nav_header_catalog',
    placement: 'header_main',
    label: 'Bütün Məhsullar',
    href: '/catalog',
    sort_order: 2,
    enabled: 1,
    status: 'published',
  },
  {
    id: 'nav_header_brands',
    placement: 'header_main',
    label: 'Brendlər',
    href: '/brands',
    sort_order: 3,
    enabled: 1,
    status: 'published',
  },
  {
    id: 'nav_header_stores',
    placement: 'header_main',
    label: 'Mağazalar',
    href: '/stores',
    sort_order: 4,
    enabled: 1,
    status: 'published',
  },
  {
    id: 'nav_header_services',
    placement: 'header_main',
    label: 'Xidmətlər',
    href: '/services',
    sort_order: 5,
    enabled: 1,
    status: 'published',
  },
  {
    id: 'nav_header_support',
    placement: 'header_main',
    label: 'Dəstək',
    href: '/support',
    sort_order: 6,
    enabled: 1,
    status: 'published',
  },

  // Mobile Bottom Navigation
  {
    id: 'nav_mobile_home',
    placement: 'mobile_bottom',
    label: 'Ana Səhifə',
    href: '/',
    icon_key: 'home',
    sort_order: 1,
    enabled: 1,
    status: 'published',
  },
  {
    id: 'nav_mobile_catalog',
    placement: 'mobile_bottom',
    label: 'Kataloq',
    href: '/catalog',
    icon_key: 'grid',
    sort_order: 2,
    enabled: 1,
    status: 'published',
  },
  {
    id: 'nav_mobile_search',
    placement: 'mobile_bottom',
    label: 'Axtarış',
    href: '/#search',
    icon_key: 'search',
    sort_order: 3,
    enabled: 1,
    status: 'published',
  },
  {
    id: 'nav_mobile_stores',
    placement: 'mobile_bottom',
    label: 'Mağazalar',
    href: '/stores',
    icon_key: 'map-pin',
    sort_order: 4,
    enabled: 1,
    status: 'published',
  },
  {
    id: 'nav_mobile_support',
    placement: 'mobile_bottom',
    label: 'Dəstək',
    href: '/support',
    icon_key: 'headphones',
    sort_order: 5,
    enabled: 1,
    status: 'published',
  },

  // Footer Col 1: Kataloq & Brendlər
  {
    id: 'nav_footer_c1_catalog',
    placement: 'footer_col_1',
    label: 'Bütün Məhsullar',
    href: '/catalog',
    sort_order: 1,
    enabled: 1,
    status: 'published',
  },
  {
    id: 'nav_footer_c1_brands',
    placement: 'footer_col_1',
    label: 'Rəsmi Brendlər',
    href: '/brands',
    sort_order: 2,
    enabled: 1,
    status: 'published',
  },

  // Footer Col 2: Xidmət və Şərtlər
  {
    id: 'nav_footer_c2_services',
    placement: 'footer_col_2',
    label: 'Çatdırılma və Quraşdırma',
    href: '/services',
    sort_order: 1,
    enabled: 1,
    status: 'published',
  },
  {
    id: 'nav_footer_c2_stores',
    placement: 'footer_col_2',
    label: 'Mağaza Ünvanlarımız',
    href: '/stores',
    sort_order: 2,
    enabled: 1,
    status: 'published',
  },

  // Footer Col 3: Müştəri Xidməti
  {
    id: 'nav_footer_c3_support',
    placement: 'footer_col_3',
    label: 'Müştəri Dəstəyi & Əlaqə',
    href: '/support',
    sort_order: 1,
    enabled: 1,
    status: 'published',
  },
];

export function seedPhase4Navigation(db) {
  if (!db) return;
  const count = db.prepare('SELECT COUNT(*) as c FROM navigation_items').get().c;
  if (count > 0) return;

  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO navigation_items (
      id, placement, parent_id, label, href, icon_key, locale, sort_order, enabled, feature_flag, open_in_new_tab, status, version, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of DEFAULT_NAVIGATION_SEED) {
    insert.run(
      item.id,
      item.placement,
      item.parent_id || null,
      item.label,
      item.href,
      item.icon_key || null,
      item.locale || 'az',
      item.sort_order,
      item.enabled ?? 1,
      item.feature_flag || null,
      item.open_in_new_tab ?? 0,
      item.status || 'published',
      1,
      now,
      now
    );
  }
}

export function promotePhase4NavigationData(draftDb, targetDb) {
  if (!draftDb || !targetDb) return;
  if (!isPhase4NavigationReady(targetDb)) {
    applyPhase4NavigationSchema(targetDb);
  }

  const items = draftDb.prepare('SELECT * FROM navigation_items').all();
  const upsert = targetDb.prepare(`
    INSERT INTO navigation_items (
      id, placement, parent_id, label, href, icon_key, locale, sort_order, enabled, feature_flag, open_in_new_tab, status, version, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      placement = excluded.placement,
      parent_id = excluded.parent_id,
      label = excluded.label,
      href = excluded.href,
      icon_key = excluded.icon_key,
      locale = excluded.locale,
      sort_order = excluded.sort_order,
      enabled = excluded.enabled,
      feature_flag = excluded.feature_flag,
      open_in_new_tab = excluded.open_in_new_tab,
      status = excluded.status,
      version = excluded.version,
      updated_at = excluded.updated_at
  `);

  for (const it of items) {
    upsert.run(
      it.id,
      it.placement,
      it.parent_id || null,
      it.label,
      it.href,
      it.icon_key || null,
      it.locale || 'az',
      it.sort_order,
      it.enabled,
      it.feature_flag || null,
      it.open_in_new_tab,
      it.status,
      it.version,
      it.created_at,
      it.updated_at
    );
  }

  // Also remove items deleted in draft
  const draftIds = items.map((i) => i.id);
  if (draftIds.length > 0) {
    const placeholders = draftIds.map(() => '?').join(',');
    targetDb.prepare(`DELETE FROM navigation_items WHERE id NOT IN (${placeholders})`).run(...draftIds);
  } else {
    targetDb.exec('DELETE FROM navigation_items');
  }
}
