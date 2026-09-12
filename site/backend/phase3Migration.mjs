import { createHash } from 'node:crypto';

export const PHASE_3_MIGRATION_VERSION = 9;
export const PHASE_3_MIGRATION_NAME = '0009_brand_registry_and_taxonomy';

export const PHASE_3_CANONICAL_DDL = `
-- Table: brand_sources
CREATE TABLE IF NOT EXISTS brand_sources (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'official_website',
  observed_name TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  rights_note TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'candidate',
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  CHECK (source_type IN ('official_website', 'distributor_declaration', 'trademark_registry', 'retailer_catalog', 'manual_review')),
  CHECK (verification_status IN ('candidate', 'pending', 'verified', 'rejected'))
);
CREATE INDEX IF NOT EXISTS brand_sources_brand_idx ON brand_sources(brand_id);

-- Table: brand_aliases
CREATE TABLE IF NOT EXISTS brand_aliases (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'az',
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  CHECK (length(alias) > 0)
);
CREATE INDEX IF NOT EXISTS brand_aliases_brand_idx ON brand_aliases(brand_id);
CREATE UNIQUE INDEX IF NOT EXISTS brand_aliases_norm_unique ON brand_aliases(normalized_alias);

-- Table: category_spec_templates
CREATE TABLE IF NOT EXISTS category_spec_templates (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  spec_key TEXT NOT NULL,
  label TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  required INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_inherited INTEGER NOT NULL DEFAULT 0,
  source_category_id TEXT,
  spec_definition_id TEXT,
  group_name TEXT NOT NULL DEFAULT '',
  filterable INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(category_id, spec_key),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (spec_definition_id) REFERENCES spec_definitions(id) ON DELETE SET NULL,
  CHECK (required IN (0, 1)),
  CHECK (is_inherited IN (0, 1)),
  CHECK (filterable IN (0, 1))
);
CREATE INDEX IF NOT EXISTS cat_spec_tpl_cat_idx ON category_spec_templates(category_id);

-- Indexes for categories & brands hierarchy
CREATE INDEX IF NOT EXISTS categories_parent_idx ON categories(parent_id);
CREATE INDEX IF NOT EXISTS categories_archived_idx ON categories(is_archived);
CREATE INDEX IF NOT EXISTS brands_verif_idx ON brands(verification_status);
`;

export const PHASE_3_CHECKSUM = createHash('sha256')
  .update(PHASE_3_CANONICAL_DDL.trim())
  .digest('hex');

export const PHASE_3_CANONICAL_MANIFEST = {
  version: PHASE_3_MIGRATION_VERSION,
  name: PHASE_3_MIGRATION_NAME,
  checksum: PHASE_3_CHECKSUM,
  tables: {
    brand_sources: {
      columns: {
        id: { type: 'TEXT', notnull: 0, dflt_value: null, pk: 1 },
        brand_id: { type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        source_url: { type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        source_type: { type: 'TEXT', notnull: 1, dflt_value: "'official_website'", pk: 0 },
        observed_name: { type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        checked_at: { type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        rights_note: { type: 'TEXT', notnull: 1, dflt_value: "''", pk: 0 },
        verification_status: { type: 'TEXT', notnull: 1, dflt_value: "'candidate'", pk: 0 },
      },
      foreignKeys: [{ table: 'brands', from: 'brand_id', to: 'id' }],
      checkKeywords: [
        "source_type IN ('official_website', 'distributor_declaration', 'trademark_registry', 'retailer_catalog', 'manual_review')",
        "verification_status IN ('candidate', 'pending', 'verified', 'rejected')",
      ],
    },
    brand_aliases: {
      columns: {
        id: { type: 'TEXT', notnull: 0, dflt_value: null, pk: 1 },
        brand_id: { type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        alias: { type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        normalized_alias: { type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        locale: { type: 'TEXT', notnull: 1, dflt_value: "'az'", pk: 0 },
      },
      foreignKeys: [{ table: 'brands', from: 'brand_id', to: 'id' }],
      checkKeywords: ['length(alias) > 0'],
    },
    category_spec_templates: {
      columns: {
        id: { type: 'TEXT', notnull: 0, dflt_value: null, pk: 1 },
        category_id: { type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        spec_key: { type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        label: { type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        unit: { type: 'TEXT', notnull: 1, dflt_value: "''", pk: 0 },
        required: { type: 'INTEGER', notnull: 1, dflt_value: '0', pk: 0 },
        sort_order: { type: 'INTEGER', notnull: 1, dflt_value: '0', pk: 0 },
        is_inherited: { type: 'INTEGER', notnull: 1, dflt_value: '0', pk: 0 },
        source_category_id: { type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
        spec_definition_id: { type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
        group_name: { type: 'TEXT', notnull: 1, dflt_value: "''", pk: 0 },
        filterable: { type: 'INTEGER', notnull: 1, dflt_value: '0', pk: 0 },
        created_at: { type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        updated_at: { type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
      },
      foreignKeys: [
        { table: 'categories', from: 'category_id', to: 'id' },
        { table: 'spec_definitions', from: 'spec_definition_id', to: 'id' },
      ],
      checkKeywords: ['required IN (0, 1)', 'is_inherited IN (0, 1)', 'filterable IN (0, 1)'],
    },
  },
  brand_columns: {
    verification_status: {
      type: 'TEXT',
      notnull: 1,
      dflt_value: "'legacy_unreviewed'",
      allowed_defaults: ["'legacy_unreviewed'", "'unverified'", "'legacy_unverified'", "'candidate'"],
      pk: 0,
    },
    logo_rights_status: { type: 'TEXT', notnull: 1, dflt_value: "'unreviewed'", pk: 0 },
    logo_source: { type: 'TEXT', notnull: 1, dflt_value: "''", pk: 0 },
    rights_note: { type: 'TEXT', notnull: 1, dflt_value: "''", pk: 0 },
    verified_by: { type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
    verified_at: { type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
    version: { type: 'INTEGER', notnull: 1, dflt_value: '1', pk: 0 },
  },
  category_columns: {
    parent_id: { type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
    depth: { type: 'INTEGER', notnull: 1, dflt_value: '1', pk: 0 },
    path: { type: 'TEXT', notnull: 1, dflt_value: "''", pk: 0 },
    is_archived: { type: 'INTEGER', notnull: 1, dflt_value: '0', pk: 0 },
    version: { type: 'INTEGER', notnull: 1, dflt_value: '1', pk: 0 },
  },
  indices: [
    { name: 'brand_sources_brand_idx', table: 'brand_sources', unique: false, columns: ['brand_id'] },
    { name: 'brand_aliases_brand_idx', table: 'brand_aliases', unique: false, columns: ['brand_id'] },
    { name: 'brand_aliases_norm_unique', table: 'brand_aliases', unique: true, columns: ['normalized_alias'] },
    { name: 'cat_spec_tpl_cat_idx', table: 'category_spec_templates', unique: false, columns: ['category_id'] },
    { name: 'categories_parent_idx', table: 'categories', unique: false, columns: ['parent_id'] },
    { name: 'categories_archived_idx', table: 'categories', unique: false, columns: ['is_archived'] },
    { name: 'brands_verif_idx', table: 'brands', unique: false, columns: ['verification_status'] },
  ],
};

function normalizeDefaultValue(val) {
  if (val === null || val === undefined) return null;
  let str = String(val).trim();
  if (str.startsWith('(') && str.endsWith(')')) {
    str = str.slice(1, -1).trim();
  }
  if ((str.startsWith("'") && str.endsWith("'")) || (str.startsWith('"') && str.endsWith('"'))) {
    return str.slice(1, -1);
  }
  return str;
}

/**
 * Validates the database schema against the canonical Phase 3 manifest.
 */
export function validatePhase3SchemaManifest(db) {
  const errors = [];
  const missingTables = [];
  const columnMismatches = [];
  const foreignKeyMismatches = [];
  const missingChecks = [];
  const missingIndices = [];

  if (!db) {
    return {
      valid: false,
      isValid: false,
      errors: ['NO_DATABASE: Verilənlər bazası instansı mövcud deyil.'],
      missingTables,
      columnMismatches,
      foreignKeyMismatches,
      missingChecks,
      missingIndices,
    };
  }

  const existingTables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((r) => r.name);

  // Table schemas for CHECK constraint inspection
  const tableSchemas = db
    .prepare("SELECT name, sql FROM sqlite_master WHERE type='table'")
    .all();

  // 1. Check tables and their column properties (type, notnull, pk, dflt_value)
  for (const [tableName, tableDef] of Object.entries(PHASE_3_CANONICAL_MANIFEST.tables)) {
    if (!existingTables.includes(tableName)) {
      missingTables.push(tableName);
      errors.push(`MISSING_TABLE: '${tableName}' cədvəli mövcud deyil.`);
      continue;
    }

    const cols = db.prepare(`PRAGMA table_info('${tableName}')`).all();
    const colMap = new Map(cols.map((c) => [c.name, c]));

    for (const [colName, expected] of Object.entries(tableDef.columns)) {
      const actual = colMap.get(colName);
      if (!actual) {
        columnMismatches.push(`${tableName}.${colName}: missing column`);
        errors.push(`MISSING_COLUMN: '${tableName}.${colName}' sütunu tapılmadı.`);
        continue;
      }

      // Type check
      if (expected.type && actual.type.toUpperCase() !== expected.type.toUpperCase()) {
        columnMismatches.push(
          `${tableName}.${colName}: expected type ${expected.type}, got ${actual.type}`
        );
        errors.push(
          `COLUMN_TYPE_MISMATCH: '${tableName}.${colName}' tipi '${actual.type}', gözlənilən '${expected.type}'`
        );
      }

      // Nullability check (excluding primary keys which SQLite can treat specially)
      const expectedNotNull = expected.notnull ? 1 : 0;
      if (expected.notnull !== undefined && actual.notnull !== expectedNotNull && actual.pk === 0) {
        columnMismatches.push(
          `${tableName}.${colName}: expected notnull=${expectedNotNull}, got notnull=${actual.notnull}`
        );
        errors.push(
          `COLUMN_NOTNULL_MISMATCH: '${tableName}.${colName}' notnull=${actual.notnull}, gözlənilən ${expectedNotNull}`
        );
      }

      // Primary Key check
      const expectedPk = expected.pk || 0;
      if (actual.pk !== expectedPk) {
        columnMismatches.push(
          `${tableName}.${colName}: expected PK position ${expectedPk}, got ${actual.pk}`
        );
        errors.push(
          `COLUMN_PK_MISMATCH: '${tableName}.${colName}' PK=${actual.pk}, gözlənilən ${expectedPk}`
        );
      }

      // Default value check
      if (expected.dflt_value !== undefined) {
        const normActual = normalizeDefaultValue(actual.dflt_value);
        const normExpected = normalizeDefaultValue(expected.dflt_value);
        const allowed = expected.allowed_defaults
          ? expected.allowed_defaults.map(normalizeDefaultValue)
          : [normExpected];
        if (!allowed.includes(normActual)) {
          columnMismatches.push(
            `${tableName}.${colName}: expected default ${expected.dflt_value}, got ${actual.dflt_value}`
          );
          errors.push(
            `COLUMN_DEFAULT_MISMATCH: '${tableName}.${colName}' default="${actual.dflt_value}", gözlənilən "${expected.dflt_value}"`
          );
        }
      }
    }

    // Foreign Keys check
    if (tableDef.foreignKeys) {
      const fks = db.prepare(`PRAGMA foreign_key_list('${tableName}')`).all();
      for (const expFk of tableDef.foreignKeys) {
        const match = fks.find(
          (fk) => fk.table === expFk.table && fk.from === expFk.from && fk.to === expFk.to
        );
        if (!match) {
          foreignKeyMismatches.push(`${tableName} -> ${expFk.table} (${expFk.from} -> ${expFk.to})`);
          errors.push(
            `MISSING_FOREIGN_KEY: '${tableName}' cədvəlində '${expFk.from}' -> '${expFk.table}.${expFk.to}' xarici açarı tapılmadı.`
          );
        }
      }
    }

    // CHECK constraints
    if (tableDef.checkKeywords) {
      const tSchema = tableSchemas.find((s) => s.name === tableName)?.sql || '';
      for (const kw of tableDef.checkKeywords) {
        if (!tSchema.includes(kw)) {
          missingChecks.push(`${tableName}: missing CHECK(${kw})`);
          errors.push(
            `MISSING_CHECK_CONSTRAINT: '${tableName}' cədvəlində CHECK (${kw}) məhdudiyyəti tapılmadı.`
          );
        }
      }
    }
  }

  // 2. Check additive columns on brands table with complete manifest specs
  if (existingTables.includes('brands')) {
    const brandCols = db.prepare("PRAGMA table_info('brands')").all();
    const brandColMap = new Map(brandCols.map((c) => [c.name, c]));
    for (const [colName, expected] of Object.entries(PHASE_3_CANONICAL_MANIFEST.brand_columns)) {
      const actual = brandColMap.get(colName);
      if (!actual) {
        columnMismatches.push(`brands.${colName}: missing column`);
        errors.push(`MISSING_BRAND_COLUMN: 'brands.${colName}' sütunu tapılmadı.`);
        continue;
      }
      if (expected.type && actual.type.toUpperCase() !== expected.type.toUpperCase()) {
        errors.push(
          `BRAND_COLUMN_TYPE_MISMATCH: 'brands.${colName}' tipi '${actual.type}', gözlənilən '${expected.type}'`
        );
      }
      const expNotNull = expected.notnull ? 1 : 0;
      if (expected.notnull !== undefined && actual.notnull !== expNotNull && actual.pk === 0) {
        errors.push(
          `BRAND_COLUMN_NOTNULL_MISMATCH: 'brands.${colName}' notnull=${actual.notnull}, gözlənilən ${expNotNull}`
        );
      }
      if (expected.dflt_value !== undefined) {
        const normActual = normalizeDefaultValue(actual.dflt_value);
        const normExpected = normalizeDefaultValue(expected.dflt_value);
        const allowed = expected.allowed_defaults
          ? expected.allowed_defaults.map(normalizeDefaultValue)
          : [normExpected];
        if (!allowed.includes(normActual)) {
          errors.push(
            `BRAND_COLUMN_DEFAULT_MISMATCH: 'brands.${colName}' default="${actual.dflt_value}", gözlənilən "${expected.dflt_value}"`
          );
        }
      }
    }
  }

  // 3. Check additive columns on categories table with complete manifest specs
  if (existingTables.includes('categories')) {
    const catCols = db.prepare("PRAGMA table_info('categories')").all();
    const catColMap = new Map(catCols.map((c) => [c.name, c]));
    for (const [colName, expected] of Object.entries(PHASE_3_CANONICAL_MANIFEST.category_columns)) {
      const actual = catColMap.get(colName);
      if (!actual) {
        columnMismatches.push(`categories.${colName}: missing column`);
        errors.push(`MISSING_CATEGORY_COLUMN: 'categories.${colName}' sütunu tapılmadı.`);
        continue;
      }
      if (expected.type && actual.type.toUpperCase() !== expected.type.toUpperCase()) {
        errors.push(
          `CATEGORY_COLUMN_TYPE_MISMATCH: 'categories.${colName}' tipi '${actual.type}', gözlənilən '${expected.type}'`
        );
      }
      const expNotNull = expected.notnull ? 1 : 0;
      if (expected.notnull !== undefined && actual.notnull !== expNotNull && actual.pk === 0) {
        errors.push(
          `CATEGORY_COLUMN_NOTNULL_MISMATCH: 'categories.${colName}' notnull=${actual.notnull}, gözlənilən ${expNotNull}`
        );
      }
      if (expected.dflt_value !== undefined) {
        const normActual = normalizeDefaultValue(actual.dflt_value);
        const normExpected = normalizeDefaultValue(expected.dflt_value);
        const allowed = expected.allowed_defaults
          ? expected.allowed_defaults.map(normalizeDefaultValue)
          : [normExpected];
        if (!allowed.includes(normActual)) {
          errors.push(
            `CATEGORY_COLUMN_DEFAULT_MISMATCH: 'categories.${colName}' default="${actual.dflt_value}", gözlənilən "${expected.dflt_value}"`
          );
        }
      }
    }
  }

  // 4. Check indexes: verify name, unique flag, columns and column ordering
  for (const expIdx of PHASE_3_CANONICAL_MANIFEST.indices) {
    if (!existingTables.includes(expIdx.table)) continue;
    const indexList = db.prepare(`PRAGMA index_list('${expIdx.table}')`).all();
    const found = indexList.find((i) => i.name === expIdx.name);
    if (!found) {
      missingIndices.push(expIdx.name);
      errors.push(`MISSING_INDEX: '${expIdx.name}' indeksi '${expIdx.table}' cədvəlində tapılmadı.`);
      continue;
    }
    const expUnique = expIdx.unique ? 1 : 0;
    if (found.unique !== expUnique) {
      errors.push(
        `INDEX_UNIQUE_MISMATCH: '${expIdx.name}' unique=${found.unique}, gözlənilən ${expUnique}`
      );
    }
    const info = db.prepare(`PRAGMA index_info('${expIdx.name}')`).all();
    const actualCols = info.sort((a, b) => a.seqno - b.seqno).map((r) => r.name);
    if (
      actualCols.length !== expIdx.columns.length ||
      actualCols.some((c, i) => c !== expIdx.columns[i])
    ) {
      errors.push(
        `INDEX_COLUMNS_MISMATCH: '${expIdx.name}' sütunları [${actualCols.join(', ')}], gözlənilən [${expIdx.columns.join(', ')}]`
      );
    }
  }

  // 5. PRAGMA foreign_key_check integrity check
  let fkViolations = [];
  try {
    fkViolations = db.prepare('PRAGMA foreign_key_check').all();
    if (fkViolations.length > 0) {
      errors.push(`FOREIGN_KEY_VIOLATIONS: ${fkViolations.length} xarici açar ziddiyyəti aşkarlandı.`);
    }
  } catch (err) {
    errors.push(`FOREIGN_KEY_CHECK_FAILED: ${err.message}`);
  }

  // 6. Check schema_migrations version 9 integrity (fail-closed on tampered checksum/name/status)
  if (existingTables.includes('schema_migrations')) {
    const migRow = db
      .prepare('SELECT * FROM schema_migrations WHERE version = ?')
      .get(PHASE_3_MIGRATION_VERSION);
    if (!migRow) {
      errors.push(`MISSING_MIGRATION_RECORD: 'schema_migrations' cədvəlində versiya ${PHASE_3_MIGRATION_VERSION} tapılmadı.`);
    } else {
      if (migRow.checksum !== PHASE_3_CHECKSUM) {
        errors.push(
          `CHECKSUM_MISMATCH: Versiya ${PHASE_3_MIGRATION_VERSION} üçün gözlənilən checksum '${PHASE_3_CHECKSUM}', tapılan '${migRow.checksum}'`
        );
      }
      if (migRow.name !== PHASE_3_MIGRATION_NAME) {
        errors.push(
          `NAME_MISMATCH: Versiya ${PHASE_3_MIGRATION_VERSION} üçün gözlənilən ad '${PHASE_3_MIGRATION_NAME}', tapılan '${migRow.name}'`
        );
      }
      if (migRow.status !== 'success' && migRow.status !== 'applied') {
        errors.push(`MIGRATION_STATUS_INVALID: Versiya ${PHASE_3_MIGRATION_VERSION} statusu '${migRow.status}'`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    isValid: errors.length === 0,
    errors,
    missingTables,
    columnMismatches,
    foreignKeyMismatches,
    missingChecks,
    missingIndices,
    fkViolationsCount: fkViolations.length,
  };
}

/**
 * Checks if the Phase 3 schema has been applied and passes canonical validation.
 */
export function isPhase3SchemaReady(db) {
  if (!db) return false;
  try {
    const result = validatePhase3SchemaManifest(db);
    return Boolean(result.valid);
  } catch {
    return false;
  }
}

/**
 * Applies additive Phase 3 schema upgrades to a database instance idempotently without data loss.
 * If schema_migrations version 9 already exists, fail-closed on tampered checksum/name/status.
 */
export function applyPhase3Schema(db) {
  const hasMigrations = Boolean(
    db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'").get()
  );

  if (hasMigrations) {
    const existingMig = db
      .prepare('SELECT * FROM schema_migrations WHERE version = ?')
      .get(PHASE_3_MIGRATION_VERSION);
    if (existingMig) {
      if (
        existingMig.checksum !== PHASE_3_CHECKSUM ||
        existingMig.name !== PHASE_3_MIGRATION_NAME ||
        (existingMig.status !== 'success' && existingMig.status !== 'applied')
      ) {
        throw new Error(
          `MIGRATION_TAMPERED: Schema migrations version ${PHASE_3_MIGRATION_VERSION} təhrif edilib (Mövcud checksum: '${existingMig.checksum}', Gözlənilən: '${PHASE_3_CHECKSUM}'). Müdaxilə qadağandır.`
        );
      }
      // Valid record already exists
      return { success: true, version: PHASE_3_MIGRATION_VERSION, alreadyApplied: true };
    }
  }

  db.exec('BEGIN IMMEDIATE;');
  try {
    const hasBrands = Boolean(
      db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='brands'").get()
    );
    const hasCategories = Boolean(
      db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").get()
    );

    // 1. Upgrade brands table with additive verification and logo rights columns
    if (hasBrands) {
      const brandCols = db
        .prepare("PRAGMA table_info('brands')")
        .all()
        .map((c) => c.name);

      if (!brandCols.includes('verification_status')) {
        db.exec(
          "ALTER TABLE brands ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'legacy_unreviewed';"
        );
      }
      if (!brandCols.includes('logo_rights_status')) {
        db.exec(
          "ALTER TABLE brands ADD COLUMN logo_rights_status TEXT NOT NULL DEFAULT 'unreviewed';"
        );
      }
      if (!brandCols.includes('logo_source')) {
        db.exec("ALTER TABLE brands ADD COLUMN logo_source TEXT NOT NULL DEFAULT '';");
      }
      if (!brandCols.includes('rights_note')) {
        db.exec("ALTER TABLE brands ADD COLUMN rights_note TEXT NOT NULL DEFAULT '';");
      }
      if (!brandCols.includes('verified_by')) {
        db.exec('ALTER TABLE brands ADD COLUMN verified_by TEXT;');
      }
      if (!brandCols.includes('verified_at')) {
        db.exec('ALTER TABLE brands ADD COLUMN verified_at TEXT;');
      }
      if (!brandCols.includes('version')) {
        db.exec('ALTER TABLE brands ADD COLUMN version INTEGER NOT NULL DEFAULT 1;');
      }
    }

    // 2. Upgrade categories table with additive hierarchy, depth, path and archive columns
    if (hasCategories) {
      const catCols = db
        .prepare("PRAGMA table_info('categories')")
        .all()
        .map((c) => c.name);

      if (!catCols.includes('parent_id')) {
        db.exec('ALTER TABLE categories ADD COLUMN parent_id TEXT;');
      }
      if (!catCols.includes('depth')) {
        db.exec('ALTER TABLE categories ADD COLUMN depth INTEGER NOT NULL DEFAULT 1;');
      }
      if (!catCols.includes('path')) {
        db.exec("ALTER TABLE categories ADD COLUMN path TEXT NOT NULL DEFAULT '';");
      }
      if (!catCols.includes('is_archived')) {
        db.exec('ALTER TABLE categories ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0;');
      }
      if (!catCols.includes('version')) {
        db.exec('ALTER TABLE categories ADD COLUMN version INTEGER NOT NULL DEFAULT 1;');
      }
    }

    // 3. Ensure brand_sources exists with full canonical schema and constraints
    const hasBrandSources = Boolean(
      db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='brand_sources'").get()
    );
    if (!hasBrandSources) {
      db.exec(`
        CREATE TABLE brand_sources (
          id TEXT PRIMARY KEY,
          brand_id TEXT NOT NULL,
          source_url TEXT NOT NULL,
          source_type TEXT NOT NULL DEFAULT 'official_website',
          observed_name TEXT NOT NULL,
          checked_at TEXT NOT NULL,
          rights_note TEXT NOT NULL DEFAULT '',
          verification_status TEXT NOT NULL DEFAULT 'candidate',
          FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
          CHECK (source_type IN ('official_website', 'distributor_declaration', 'trademark_registry', 'retailer_catalog', 'manual_review')),
          CHECK (verification_status IN ('candidate', 'pending', 'verified', 'rejected'))
        );
        CREATE INDEX IF NOT EXISTS brand_sources_brand_idx ON brand_sources(brand_id);
      `);
    } else {
      const bsSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='brand_sources'").get()?.sql || '';
      if (!bsSql.includes("source_type IN ('official_website'") || !bsSql.includes("verification_status IN ('candidate'")) {
        db.exec(`
          CREATE TABLE brand_sources_p3_mig (
            id TEXT PRIMARY KEY,
            brand_id TEXT NOT NULL,
            source_url TEXT NOT NULL,
            source_type TEXT NOT NULL DEFAULT 'official_website',
            observed_name TEXT NOT NULL,
            checked_at TEXT NOT NULL,
            rights_note TEXT NOT NULL DEFAULT '',
            verification_status TEXT NOT NULL DEFAULT 'candidate',
            FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
            CHECK (source_type IN ('official_website', 'distributor_declaration', 'trademark_registry', 'retailer_catalog', 'manual_review')),
            CHECK (verification_status IN ('candidate', 'pending', 'verified', 'rejected'))
          );
          INSERT INTO brand_sources_p3_mig (id, brand_id, source_url, source_type, observed_name, checked_at, rights_note, verification_status)
          SELECT id, brand_id, source_url, COALESCE(source_type, 'official_website'), observed_name, checked_at, COALESCE(rights_note, ''), COALESCE(verification_status, 'candidate')
          FROM brand_sources;
          DROP TABLE brand_sources;
          ALTER TABLE brand_sources_p3_mig RENAME TO brand_sources;
          CREATE INDEX IF NOT EXISTS brand_sources_brand_idx ON brand_sources(brand_id);
        `);
      }
    }

    // 4. Ensure brand_aliases exists with full canonical schema and constraints
    const hasBrandAliases = Boolean(
      db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='brand_aliases'").get()
    );
    if (!hasBrandAliases) {
      db.exec(`
        CREATE TABLE brand_aliases (
          id TEXT PRIMARY KEY,
          brand_id TEXT NOT NULL,
          alias TEXT NOT NULL,
          normalized_alias TEXT NOT NULL,
          locale TEXT NOT NULL DEFAULT 'az',
          FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
          CHECK (length(alias) > 0)
        );
        CREATE INDEX IF NOT EXISTS brand_aliases_brand_idx ON brand_aliases(brand_id);
        CREATE UNIQUE INDEX IF NOT EXISTS brand_aliases_norm_unique ON brand_aliases(normalized_alias);
      `);
    } else {
      const baSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='brand_aliases'").get()?.sql || '';
      if (!baSql.includes('length(alias) > 0')) {
        db.exec(`
          CREATE TABLE brand_aliases_p3_mig (
            id TEXT PRIMARY KEY,
            brand_id TEXT NOT NULL,
            alias TEXT NOT NULL,
            normalized_alias TEXT NOT NULL,
            locale TEXT NOT NULL DEFAULT 'az',
            FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
            CHECK (length(alias) > 0)
          );
          INSERT INTO brand_aliases_p3_mig (id, brand_id, alias, normalized_alias, locale)
          SELECT id, brand_id, alias, normalized_alias, COALESCE(locale, 'az')
          FROM brand_aliases;
          DROP TABLE brand_aliases;
          ALTER TABLE brand_aliases_p3_mig RENAME TO brand_aliases;
          CREATE INDEX IF NOT EXISTS brand_aliases_brand_idx ON brand_aliases(brand_id);
          CREATE UNIQUE INDEX IF NOT EXISTS brand_aliases_norm_unique ON brand_aliases(normalized_alias);
        `);
      }
    }

    // 4.5 Ensure spec_definitions table exists for foreign key reference
    db.exec(`
      CREATE TABLE IF NOT EXISTS spec_definitions (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        name_az TEXT NOT NULL,
        data_type TEXT NOT NULL DEFAULT 'text' CHECK(data_type IN ('text', 'number', 'boolean')),
        unit_family TEXT NOT NULL DEFAULT '',
        filterable INTEGER NOT NULL DEFAULT 0 CHECK(filterable IN (0, 1)),
        comparable INTEGER NOT NULL DEFAULT 1 CHECK(comparable IN (0, 1)),
        required INTEGER NOT NULL DEFAULT 0 CHECK(required IN (0, 1)),
        sort_order INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS spec_definitions_key_idx ON spec_definitions(key);
    `);

    // 5. Upgrade / migrate category_spec_templates preserving 100% Phase 2 legacy rows & columns
    const hasCategorySpecTemplates = Boolean(
      db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='category_spec_templates'").get()
    );

    if (!hasCategorySpecTemplates) {
      db.exec(`
        CREATE TABLE category_spec_templates (
          id TEXT PRIMARY KEY,
          category_id TEXT NOT NULL,
          spec_key TEXT NOT NULL,
          label TEXT NOT NULL,
          unit TEXT NOT NULL DEFAULT '',
          required INTEGER NOT NULL DEFAULT 0,
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_inherited INTEGER NOT NULL DEFAULT 0,
          source_category_id TEXT,
          spec_definition_id TEXT,
          group_name TEXT NOT NULL DEFAULT '',
          filterable INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(category_id, spec_key),
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
          FOREIGN KEY (spec_definition_id) REFERENCES spec_definitions(id) ON DELETE SET NULL,
          CHECK (required IN (0, 1)),
          CHECK (is_inherited IN (0, 1)),
          CHECK (filterable IN (0, 1))
        );
        CREATE INDEX IF NOT EXISTS cat_spec_tpl_cat_idx ON category_spec_templates(category_id);
      `);
    } else {
      const cstCols = db.prepare("PRAGMA table_info('category_spec_templates')").all().map((c) => c.name);
      const cstSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='category_spec_templates'").get()?.sql || '';

      if (cstCols.includes('spec_definition_id') || !cstSql.includes('required IN (0, 1)') || !cstCols.includes('spec_key')) {
        // Migrate legacy Phase 2 rows by joining spec_definitions using sd.key and sd.unit_family
        db.exec(`
          CREATE TABLE IF NOT EXISTS category_spec_templates_p3_mig (
            id TEXT PRIMARY KEY,
            category_id TEXT NOT NULL,
            spec_key TEXT NOT NULL,
            label TEXT NOT NULL,
            unit TEXT NOT NULL DEFAULT '',
            required INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_inherited INTEGER NOT NULL DEFAULT 0,
            source_category_id TEXT,
            spec_definition_id TEXT,
            group_name TEXT NOT NULL DEFAULT '',
            filterable INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(category_id, spec_key),
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
            FOREIGN KEY (spec_definition_id) REFERENCES spec_definitions(id) ON DELETE SET NULL,
            CHECK (required IN (0, 1)),
            CHECK (is_inherited IN (0, 1)),
            CHECK (filterable IN (0, 1))
          );
        `);

        const hasSpecDefs = Boolean(
          db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='spec_definitions'").get()
        );

        const oldRows = db.prepare('SELECT * FROM category_spec_templates').all();
        const insertStmt = db.prepare(`
          INSERT OR REPLACE INTO category_spec_templates_p3_mig (
            id, category_id, spec_key, label, unit, required, sort_order,
            is_inherited, source_category_id, spec_definition_id, group_name,
            filterable, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const nowIso = new Date().toISOString();

        for (const row of oldRows) {
          const specDefId = row.spec_definition_id || null;
          const groupName = row.group_name || '';
          let filterable = row.filterable !== undefined ? Number(row.filterable) : 0;
          let specKey = row.spec_key;
          let label = row.label;
          let unit = row.unit !== undefined && row.unit !== null ? String(row.unit) : '';

          if (hasSpecDefs && row.spec_definition_id) {
            // Read from spec_definitions using sd.key and sd.unit_family
            const sd = db.prepare('SELECT * FROM spec_definitions WHERE id = ?').get(row.spec_definition_id);
            if (sd) {
              if (!specKey) specKey = sd.key;
              if (!label) label = sd.name_az || sd.key;
              if (!unit && sd.unit_family) unit = sd.unit_family;
              if (row.filterable === undefined && sd.filterable !== undefined) {
                filterable = Number(sd.filterable);
              }
            }
          }

          if (!specKey) {
            specKey = row.spec_definition_id || `spec_${Math.random().toString(36).slice(2, 8)}`;
          }
          if (!label) {
            label = groupName || specKey;
          }

          const templateId = row.id || `cst_${row.category_id}_${specKey}`;
          const req = row.required !== undefined ? Number(row.required) : (row.is_required !== undefined ? Number(row.is_required) : 0);
          const sort = row.sort_order !== undefined ? Number(row.sort_order) : 0;
          const isInherited = row.is_inherited !== undefined ? Number(row.is_inherited) : 0;
          const sourceCatId = row.source_category_id || null;
          const createdAt = row.created_at || nowIso;
          const updatedAt = row.updated_at || nowIso;

          insertStmt.run(
            templateId,
            row.category_id,
            specKey,
            label,
            unit,
            req,
            sort,
            isInherited,
            sourceCatId,
            specDefId,
            groupName,
            filterable,
            createdAt,
            updatedAt
          );
        }

        db.exec(`
          DROP TABLE category_spec_templates;
          ALTER TABLE category_spec_templates_p3_mig RENAME TO category_spec_templates;
          CREATE INDEX IF NOT EXISTS cat_spec_tpl_cat_idx ON category_spec_templates(category_id);
        `);
      } else {
        // Ensure index exists
        db.exec('CREATE INDEX IF NOT EXISTS cat_spec_tpl_cat_idx ON category_spec_templates(category_id);');
      }
    }

    // 6. Record migration in schema_migrations (INSERT ONLY)
    if (hasMigrations) {
      const migCols = db
        .prepare("PRAGMA table_info('schema_migrations')")
        .all()
        .map((c) => c.name);
      if (!migCols.includes('name')) {
        db.exec("ALTER TABLE schema_migrations ADD COLUMN name TEXT NOT NULL DEFAULT '';");
      }
      if (!migCols.includes('checksum')) {
        db.exec("ALTER TABLE schema_migrations ADD COLUMN checksum TEXT NOT NULL DEFAULT '';");
      }
      if (!migCols.includes('status')) {
        db.exec("ALTER TABLE schema_migrations ADD COLUMN status TEXT NOT NULL DEFAULT 'success';");
      }

      db.prepare(`
        INSERT INTO schema_migrations (version, name, checksum, applied_at, status)
        VALUES (?, ?, ?, ?, 'success')
      `).run(PHASE_3_MIGRATION_VERSION, PHASE_3_MIGRATION_NAME, PHASE_3_CHECKSUM, new Date().toISOString());
    }

    // 7. Recreate all Phase 3 indexes
    if (hasCategories) {
      db.exec(`
        CREATE INDEX IF NOT EXISTS categories_parent_idx ON categories(parent_id);
        CREATE INDEX IF NOT EXISTS categories_archived_idx ON categories(is_archived);
      `);
    }
    if (hasBrands) {
      db.exec(`
        CREATE INDEX IF NOT EXISTS brands_verif_idx ON brands(verification_status);
      `);
    }

    db.exec('COMMIT;');
    return { success: true, version: PHASE_3_MIGRATION_VERSION };
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {}
    throw err;
  }
}

export const applyPhase3Migration = applyPhase3Schema;

/**
 * Promotes Phase 3 brand, taxonomy, source, alias, and spec template data
 * from draftDb to targetDb within an atomic transaction.
 * Does NOT call applyPhase3Schema; targetDb must already be schema-ready.
 */
export function promotePhase3CatalogData(draftDb, targetDb, { manageTransaction = true } = {}) {
  if (!draftDb) return { ok: false, reason: 'NO_DRAFT_DB' };
  if (!targetDb) return { ok: false, reason: 'NO_TARGET_DB' };

  if (!isPhase3SchemaReady(targetDb)) {
    throw new Error('TARGET_DB_NOT_READY: İctimai baza Phase 3 sxeminə hazır deyil. Əvvəlcə miqrasiya tətbiq edilməlidir.');
  }

  if (manageTransaction) {
    targetDb.exec('BEGIN IMMEDIATE;');
  }
  try {
    const catCols = targetDb.prepare("PRAGMA table_info('categories')").all().map((c) => c.name);
    const hasCatCreatedAt = catCols.includes('created_at');
    const hasCatUpdatedAt = catCols.includes('updated_at');

    const draftCategories = draftDb.prepare('SELECT * FROM categories').all();
    const nowIso = new Date().toISOString();

    for (const cat of draftCategories) {
      if (hasCatCreatedAt && hasCatUpdatedAt) {
        targetDb.prepare(`
          INSERT INTO categories (id, name, slug, icon, active, sort_order, parent_id, depth, path, is_archived, version, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            slug = excluded.slug,
            icon = excluded.icon,
            active = excluded.active,
            sort_order = excluded.sort_order,
            parent_id = excluded.parent_id,
            depth = excluded.depth,
            path = excluded.path,
            is_archived = excluded.is_archived,
            version = excluded.version,
            updated_at = excluded.updated_at
        `).run(
          cat.id,
          cat.name,
          cat.slug,
          cat.icon || '',
          cat.active ?? 1,
          cat.sort_order ?? 0,
          cat.parent_id || null,
          cat.depth ?? 1,
          cat.path || `/${cat.slug || cat.id}`,
          cat.is_archived ?? 0,
          cat.version ?? 1,
          cat.created_at || nowIso,
          cat.updated_at || nowIso
        );
      } else if (hasCatCreatedAt) {
        targetDb.prepare(`
          INSERT INTO categories (id, name, slug, icon, active, sort_order, parent_id, depth, path, is_archived, version, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            slug = excluded.slug,
            icon = excluded.icon,
            active = excluded.active,
            sort_order = excluded.sort_order,
            parent_id = excluded.parent_id,
            depth = excluded.depth,
            path = excluded.path,
            is_archived = excluded.is_archived,
            version = excluded.version
        `).run(
          cat.id,
          cat.name,
          cat.slug,
          cat.icon || '',
          cat.active ?? 1,
          cat.sort_order ?? 0,
          cat.parent_id || null,
          cat.depth ?? 1,
          cat.path || `/${cat.slug || cat.id}`,
          cat.is_archived ?? 0,
          cat.version ?? 1,
          cat.created_at || nowIso
        );
      } else {
        targetDb.prepare(`
          INSERT INTO categories (id, name, slug, icon, active, sort_order, parent_id, depth, path, is_archived, version)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            slug = excluded.slug,
            icon = excluded.icon,
            active = excluded.active,
            sort_order = excluded.sort_order,
            parent_id = excluded.parent_id,
            depth = excluded.depth,
            path = excluded.path,
            is_archived = excluded.is_archived,
            version = excluded.version
        `).run(
          cat.id,
          cat.name,
          cat.slug,
          cat.icon || '',
          cat.active ?? 1,
          cat.sort_order ?? 0,
          cat.parent_id || null,
          cat.depth ?? 1,
          cat.path || `/${cat.slug || cat.id}`,
          cat.is_archived ?? 0,
          cat.version ?? 1
        );
      }
    }

    // 2. Sync Brands - update verification status, logo rights, version, etc.
    const brandCols = targetDb.prepare("PRAGMA table_info('brands')").all().map((c) => c.name);
    const hasBrandCreatedAt = brandCols.includes('created_at');
    const hasBrandSortOrder = brandCols.includes('sort_order');
    const draftBrands = draftDb.prepare('SELECT * FROM brands').all();

    for (const b of draftBrands) {
      const cols = [
        'id', 'name', 'slug', 'origin_country', 'description', 'logo', 'active', 'coming_soon',
        'verification_status', 'logo_rights_status', 'logo_source', 'rights_note',
        'verified_by', 'verified_at', 'version'
      ];
      const vals = [
        b.id, b.name, b.slug, b.origin_country || '', b.description || '', b.logo || '',
        b.active ?? 1, b.coming_soon ?? 0,
        b.verification_status || 'candidate', b.logo_rights_status || 'unreviewed',
        b.logo_source || '', b.rights_note || '',
        b.verified_by || null, b.verified_at || null, b.version ?? 1
      ];

      if (hasBrandSortOrder) {
        cols.push('sort_order');
        vals.push(b.sort_order ?? 0);
      }
      if (hasBrandCreatedAt) {
        cols.push('created_at');
        vals.push(b.created_at || nowIso);
      }

      const placeholders = cols.map(() => '?').join(', ');
      const updateSet = cols
        .filter((c) => c !== 'id' && c !== 'created_at')
        .map((c) => `${c} = excluded.${c}`)
        .join(', ');

      targetDb.prepare(`
        INSERT INTO brands (${cols.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT(id) DO UPDATE SET ${updateSet}
      `).run(...vals);
    }

    // 3. Sync brand_sources
    if (draftDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='brand_sources'").get()) {
      targetDb.prepare('DELETE FROM brand_sources').run();
      const sources = draftDb.prepare('SELECT * FROM brand_sources').all();
      const insertSrc = targetDb.prepare(`
        INSERT INTO brand_sources (id, brand_id, source_url, source_type, observed_name, checked_at, rights_note, verification_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const s of sources) {
        const brandExists = targetDb.prepare('SELECT id FROM brands WHERE id = ?').get(s.brand_id);
        if (brandExists) {
          insertSrc.run(
            s.id,
            s.brand_id,
            s.source_url,
            s.source_type,
            s.observed_name || '',
            s.checked_at || new Date().toISOString(),
            s.rights_note || '',
            s.verification_status || 'candidate'
          );
        }
      }
    }

    // 4. Sync brand_aliases
    if (draftDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='brand_aliases'").get()) {
      targetDb.prepare('DELETE FROM brand_aliases').run();
      const aliases = draftDb.prepare('SELECT * FROM brand_aliases').all();
      const insertAlias = targetDb.prepare(`
        INSERT INTO brand_aliases (id, brand_id, alias, normalized_alias, locale)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const a of aliases) {
        const brandExists = targetDb.prepare('SELECT id FROM brands WHERE id = ?').get(a.brand_id);
        if (brandExists) {
          insertAlias.run(a.id, a.brand_id, a.alias, a.normalized_alias, a.locale || 'az');
        }
      }
    }

    // 5. Sync category_spec_templates (including legacy spec_definition_id, group_name, filterable)
    if (draftDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='category_spec_templates'").get()) {
      targetDb.prepare('DELETE FROM category_spec_templates').run();
      const templates = draftDb.prepare('SELECT * FROM category_spec_templates').all();
      const insertTpl = targetDb.prepare(`
        INSERT INTO category_spec_templates (
          id, category_id, spec_key, label, unit, required, sort_order,
          is_inherited, source_category_id, spec_definition_id, group_name,
          filterable, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const t of templates) {
        const catExists = targetDb.prepare('SELECT id FROM categories WHERE id = ?').get(t.category_id);
        if (catExists) {
          insertTpl.run(
            t.id,
            t.category_id,
            t.spec_key,
            t.label,
            t.unit || '',
            t.required ?? 0,
            t.sort_order ?? 0,
            t.is_inherited ?? 0,
            t.source_category_id || null,
            t.spec_definition_id || null,
            t.group_name || '',
            t.filterable ?? 0,
            t.created_at || new Date().toISOString(),
            t.updated_at || new Date().toISOString()
          );
        }
      }
    }

    if (manageTransaction) {
      targetDb.exec('COMMIT;');
    }
    return { ok: true };
  } catch (err) {
    if (manageTransaction) {
      try {
        targetDb.exec('ROLLBACK;');
      } catch {}
    }
    throw err;
  }
}
