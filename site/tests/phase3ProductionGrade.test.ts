import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  PHASE_3_CHECKSUM,
  PHASE_3_MIGRATION_VERSION,
  PHASE_3_MIGRATION_NAME,
  isPhase3SchemaReady,
  validatePhase3SchemaManifest,
  applyPhase3Schema,
  promotePhase3CatalogData,
} from '../backend/phase3Migration.mjs';
import {
  BrandRegistryService,
  generateBrandEtag,
  matchBrandEtag,
  validateHttpsUrl,
} from '../backend/brandRegistryService.mjs';
import {
  TaxonomyService,
  generateCategoryEtag,
  matchCategoryEtag,
} from '../backend/taxonomyService.mjs';
import { SpecTemplateService } from '../backend/specTemplateService.mjs';
import {
  createCatalogDatabase,
  createConsistentDatabaseSnapshot,
} from '../backend/catalogDatabase.mjs';
import { applyPimV2Schema } from '../backend/pimV2Migration.mjs';

function createBaseTestDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      origin_country TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      logo TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      coming_soon INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE audit_logs (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      action TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      ip_address TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'success',
      created_at TEXT NOT NULL
    );
    CREATE TABLE spec_definitions (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      name_az TEXT NOT NULL,
      data_type TEXT NOT NULL DEFAULT 'text',
      unit_family TEXT NOT NULL DEFAULT '',
      filterable INTEGER NOT NULL DEFAULT 0,
      comparable INTEGER NOT NULL DEFAULT 1,
      required INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL,
      status TEXT NOT NULL
    );
  `);
  return db;
}

describe('Phase 3 Production Grade: Schema Readiness & Migration', () => {
  it('1. Schema readiness guard: isPhase3SchemaReady returns false on pre-migration DB and true after migration', () => {
    const db = createBaseTestDb();
    expect(isPhase3SchemaReady(db)).toBe(false);

    // Apply Phase 3 migration
    applyPhase3Schema(db);
    expect(isPhase3SchemaReady(db)).toBe(true);
  });

  it('2. Canonical manifest validator: detects valid schema and catches missing columns / indexes', () => {
    const db = createBaseTestDb();
    applyPhase3Schema(db);

    const validation = validatePhase3SchemaManifest(db);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Test checksum consistency
    expect(PHASE_3_CHECKSUM).toBeTruthy();
    expect(PHASE_3_CHECKSUM.length).toBe(64);
    expect(PHASE_3_MIGRATION_VERSION).toBe(9);
    expect(PHASE_3_MIGRATION_NAME).toBe('0009_brand_registry_and_taxonomy');
  });

  it('3. Fail-Closed on Checksum Mismatch or Tampered Schema: applyPhase3Schema throws and never heals history', () => {
    const db = createBaseTestDb();
    applyPhase3Schema(db);

    // Tamper with schema_migrations checksum
    db.prepare(
      "UPDATE schema_migrations SET checksum = 'tampered_checksum_hex_123' WHERE version = 9"
    ).run();

    const val = validatePhase3SchemaManifest(db);
    expect(val.valid).toBe(false);
    expect(val.errors.some((e: string) => e.includes('CHECKSUM_MISMATCH'))).toBe(true);
    expect(isPhase3SchemaReady(db)).toBe(false);

    // Calling applyPhase3Schema must fail-closed and throw MIGRATION_TAMPERED
    expect(() => applyPhase3Schema(db)).toThrow(/MIGRATION_TAMPERED/);

    // Verify migration history was NOT updated or healed
    const mig = db.prepare('SELECT * FROM schema_migrations WHERE version = 9').get() as any;
    expect(mig.checksum).toBe('tampered_checksum_hex_123');
  });

  it('4. Non-destructive Phase 2 category_spec_templates migration: Preserves all legacy rows 1:1 with canonical field-level hash', () => {
    const db = createBaseTestDb();
    // Pre-populate exact Phase 2 DDL from site/backend/pimV2Migration.mjs
    db.exec(`
      DROP TABLE IF EXISTS category_spec_templates;
      DROP TABLE IF EXISTS spec_definitions;
      CREATE TABLE spec_definitions (
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

      CREATE TABLE category_spec_templates (
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        spec_definition_id TEXT NOT NULL REFERENCES spec_definitions(id) ON DELETE CASCADE,
        group_name TEXT NOT NULL DEFAULT 'Əsas',
        required INTEGER NOT NULL DEFAULT 0 CHECK(required IN (0, 1)),
        filterable INTEGER NOT NULL DEFAULT 0 CHECK(filterable IN (0, 1)),
        sort_order INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (category_id, spec_definition_id)
      );

      INSERT INTO categories (id, name, slug, created_at, updated_at)
      VALUES ('cat_washers', 'Paltaryuyanlar', 'paltaryuyanlar', datetime('now'), datetime('now'));

      -- Use distinct IDs and keys to ensure spec_definition_id is not confused with spec_key
      INSERT INTO spec_definitions (id, key, name_az, data_type, unit_family, filterable, comparable, required, sort_order)
      VALUES 
        ('def_uuid_cap_101', 'capacity_kg', 'Yükləmə Tutumu', 'number', 'kq', 1, 1, 1, 1),
        ('def_uuid_spin_202', 'spin_speed_rpm', 'Fırlanma Sürəti', 'number', 'dövr/dəq', 1, 1, 0, 2);

      INSERT INTO category_spec_templates (category_id, spec_definition_id, group_name, required, filterable, sort_order)
      VALUES 
        ('cat_washers', 'def_uuid_cap_101', 'Əsas Texniki Göstəricilər', 1, 1, 10),
        ('cat_washers', 'def_uuid_spin_202', 'Əlavə Funksiyalar', 0, 0, 20);
    `);

    // Capture Phase 2 field-level manifest before migration
    const beforeRows = db
      .prepare(
        'SELECT category_id, spec_definition_id, group_name, required, filterable, sort_order FROM category_spec_templates ORDER BY category_id ASC, spec_definition_id ASC'
      )
      .all() as any[];
    expect(beforeRows).toHaveLength(2);

    const canonicalBeforeJson = JSON.stringify(
      beforeRows.map((r) => ({
        category_id: r.category_id,
        spec_definition_id: r.spec_definition_id,
        group_name: r.group_name,
        required: Number(r.required),
        filterable: Number(r.filterable),
        sort_order: Number(r.sort_order),
      }))
    );
    const beforeFieldHash = createHash('sha256').update(canonicalBeforeJson).digest('hex');

    // Run Phase 3 Migration (transactional lossless table rebuild)
    applyPhase3Schema(db);

    // Verify canonical schema is valid
    const val = validatePhase3SchemaManifest(db);
    expect(val.valid).toBe(true);

    // Capture Phase 3 field-level manifest after migration
    const afterRows = db
      .prepare(
        'SELECT category_id, spec_definition_id, group_name, required, filterable, sort_order FROM category_spec_templates ORDER BY category_id ASC, spec_definition_id ASC'
      )
      .all() as any[];
    expect(afterRows).toHaveLength(2);

    const canonicalAfterJson = JSON.stringify(
      afterRows.map((r) => ({
        category_id: r.category_id,
        spec_definition_id: r.spec_definition_id,
        group_name: r.group_name,
        required: Number(r.required),
        filterable: Number(r.filterable),
        sort_order: Number(r.sort_order),
      }))
    );
    const afterFieldHash = createHash('sha256').update(canonicalAfterJson).digest('hex');

    // Assert exact canonical field-level SHA-256 hash equality
    expect(afterFieldHash).toBe(beforeFieldHash);
    expect(afterRows.length).toBe(beforeRows.length);

    // Verify 100% field-level preservation with explicit per-row assertions
    const migratedRows = db
      .prepare('SELECT * FROM category_spec_templates ORDER BY sort_order ASC')
      .all() as any[];
    expect(migratedRows).toHaveLength(2);

    // Row 1 assertions
    expect(migratedRows[0].category_id).toBe('cat_washers');
    expect(migratedRows[0].spec_definition_id).toBe('def_uuid_cap_101');
    expect(migratedRows[0].spec_key).toBe('capacity_kg');
    expect(migratedRows[0].label).toBe('Yükləmə Tutumu');
    expect(migratedRows[0].unit).toBe('kq');
    expect(migratedRows[0].group_name).toBe('Əsas Texniki Göstəricilər');
    expect(migratedRows[0].required).toBe(1);
    expect(migratedRows[0].filterable).toBe(1);
    expect(migratedRows[0].sort_order).toBe(10);

    // Row 2 assertions
    expect(migratedRows[1].category_id).toBe('cat_washers');
    expect(migratedRows[1].spec_definition_id).toBe('def_uuid_spin_202');
    expect(migratedRows[1].spec_key).toBe('spin_speed_rpm');
    expect(migratedRows[1].label).toBe('Fırlanma Sürəti');
    expect(migratedRows[1].unit).toBe('dövr/dəq');
    expect(migratedRows[1].group_name).toBe('Əlavə Funksiyalar');
    expect(migratedRows[1].required).toBe(0);
    expect(migratedRows[1].filterable).toBe(0);
    expect(migratedRows[1].sort_order).toBe(20);

    // Verify Foreign Key on spec_definition_id exists in PRAGMA foreign_key_list
    const fkList = db.prepare("PRAGMA foreign_key_list('category_spec_templates')").all() as any[];
    const specDefFk = fkList.find(
      (fk) => fk.table === 'spec_definitions' && fk.from === 'spec_definition_id' && fk.to === 'id'
    );
    expect(specDefFk).toBeDefined();
    expect(specDefFk.on_delete).toBe('SET NULL');

    // Verify foreign_key_check passes with zero violations
    const fkViolations = db.prepare('PRAGMA foreign_key_check').all() as any[];
    expect(fkViolations).toHaveLength(0);
  });

  it('5. Real /tmp clone idempotency: Applying Phase 3 migration twice to VACUUM INTO clones is 100% idempotent', () => {
    const sourceDbPath = join(process.cwd(), 'data', 'catalog.sqlite');
    const sourceDraftPath = join(process.cwd(), 'data', 'catalog-draft.sqlite');

    if (!existsSync(sourceDbPath) || !existsSync(sourceDraftPath)) {
      return;
    }

    const tempDir = mkdtempSync(join(tmpdir(), 'sahara-p3-idempotent-'));
    const tempDb = join(tempDir, 'catalog.sqlite');
    const tempDraft = join(tempDir, 'catalog-draft.sqlite');

    try {
      createConsistentDatabaseSnapshot(sourceDbPath, tempDb);
      createConsistentDatabaseSnapshot(sourceDraftPath, tempDraft);

      for (const targetPath of [tempDb, tempDraft]) {
        const db = new DatabaseSync(targetPath);
        try {
          applyPimV2Schema(db);
          // First execution
          applyPhase3Schema(db);
          const val1 = validatePhase3SchemaManifest(db);
          expect(val1.valid).toBe(true);

          const countBrands1 = db.prepare('SELECT COUNT(*) as c FROM brands').get() as {
            c: number;
          };
          const countCats1 = db.prepare('SELECT COUNT(*) as c FROM categories').get() as {
            c: number;
          };
          const countProds1 = db.prepare('SELECT COUNT(*) as c FROM products').get() as {
            c: number;
          };

          // Second execution (must be completely idempotent without throwing)
          applyPhase3Schema(db);
          const val2 = validatePhase3SchemaManifest(db);
          expect(val2.valid).toBe(true);

          const countBrands2 = db.prepare('SELECT COUNT(*) as c FROM brands').get() as {
            c: number;
          };
          const countCats2 = db.prepare('SELECT COUNT(*) as c FROM categories').get() as {
            c: number;
          };
          const countProds2 = db.prepare('SELECT COUNT(*) as c FROM products').get() as {
            c: number;
          };

          expect(countBrands2.c).toBe(countBrands1.c);
          expect(countCats2.c).toBe(countCats1.c);
          expect(countProds2.c).toBe(countProds1.c);
        } finally {
          db.close();
        }
      }
    } finally {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });
});

describe('Phase 3 Production Grade: Brand Verification & Source Reviews', () => {
  let db: DatabaseSync;
  let brandService: BrandRegistryService;

  beforeEach(() => {
    db = createBaseTestDb();
    applyPhase3Schema(db);
    brandService = new BrandRegistryService(db);
  });

  it('1. URL Validation: accepts valid HTTPS and strictly rejects insecure or private network URLs', () => {
    expect(validateHttpsUrl('https://example.com/catalog')).toBe('https://example.com/catalog');
    expect(validateHttpsUrl('https://bosch-home.com')).toBe('https://bosch-home.com');

    // Insecure & dangerous protocols
    expect(() => validateHttpsUrl('http://insecure.com')).toThrow(/INSECURE_URL_PROTOCOL/);
    expect(() => validateHttpsUrl('javascript:alert(1)')).toThrow();
    expect(() => validateHttpsUrl('data:text/html,<h1>test</h1>')).toThrow();
    expect(() => validateHttpsUrl('file:///etc/passwd')).toThrow();

    // Localhost & private network IPs
    expect(() => validateHttpsUrl('https://localhost/api')).toThrow(/DISALLOWED_HOST/);
    expect(() => validateHttpsUrl('https://127.0.0.1:8080')).toThrow(/DISALLOWED_HOST/);
    expect(() => validateHttpsUrl('https://192.168.1.1/admin')).toThrow(/DISALLOWED_HOST/);
    expect(() => validateHttpsUrl('https://10.0.0.1')).toThrow(/DISALLOWED_HOST/);
  });

  it('2. Candidate creation & Source Pending: Initial candidate brand has candidate status and unverified sources', () => {
    const candidate = brandService.addCandidateBrand({
      name: 'Siemens Test',
      slug: 'siemens-test',
      originCountry: 'Almaniya',
      sourceUrl: 'https://siemens-home.bsh-group.com',
      observedName: 'Siemens Home',
      actor: 'tester',
    });

    expect(candidate.id).toBeTruthy();
    expect(candidate.verificationStatus).toBe('candidate');
    expect(candidate.sources).toHaveLength(1);
    expect(candidate.sources![0].verification_status).toBe('candidate');

    // Public catalog must NOT show candidate brands
    const publicBrands = brandService.getPublicBrands();
    expect(publicBrands.some((b) => b.id === candidate.id)).toBe(false);
  });

  it('3. Manual Source Review & Gatekeeper: Cannot publish without at least 1 verified official source', () => {
    const candidate = brandService.addCandidateBrand({
      name: 'Miele Test',
      slug: 'miele-test',
      originCountry: 'Almaniya',
      actor: 'admin',
    });

    // Add unverified source
    const source = brandService.addBrandSource(candidate.id, {
      sourceUrl: 'https://miele.com',
      sourceType: 'official_website',
      observedName: 'Miele Official',
      verificationStatus: 'pending',
    });
    expect(source.verificationStatus).toBe('pending');

    // Transition: candidate -> verified -> content_ready
    brandService.updateBrandVerificationStatus(candidate.id, 'verified');
    brandService.updateBrandVerificationStatus(candidate.id, 'content_ready');

    // Gatekeeper: Attempting to publish without a verified official website source must FAIL
    expect(() => {
      brandService.updateBrandVerificationStatus(candidate.id, 'published');
    }).toThrow(/BRAND_REQUIRES_VERIFIED_OFFICIAL_SOURCE/);

    // Manually review and verify source
    brandService.updateBrandSourceStatus(candidate.id, source.id, 'verified', {
      note: 'Rəsmi istehsalçı saytı təsdiqləndi',
      actor: 'lead_admin',
    });

    // Now transitioning to published succeeds
    const publishedBrand = brandService.updateBrandVerificationStatus(candidate.id, 'published');
    expect(publishedBrand.verificationStatus).toBe('published');
  });

  it('4. Logo Rights & Public Visibility: Logo is hidden on public unless logo_rights_status=approved', () => {
    const brand = brandService.addCandidateBrand({
      name: 'Samsung Test',
      slug: 'samsung-test',
      originCountry: 'Koreya',
    });
    const source = brandService.addBrandSource(brand.id, {
      sourceUrl: 'https://samsung.com',
      sourceType: 'official_website',
    });
    expect(source.id).toBeTruthy();
    brandService.updateBrandSourceStatus(brand.id, source.id, 'verified');

    // Update logo URL
    db.prepare("UPDATE brands SET logo = '/media/brands/samsung.png' WHERE id = ?").run(brand.id);

    // Add a published product
    db.prepare(
      `
      INSERT INTO products (id, brand_id, category_id, title, slug, status, created_at, updated_at)
      VALUES ('p_samsung_1', ?, 'cat_1', 'Samsung TV', 'samsung-tv', 'published', datetime('now'), datetime('now'))
    `
    ).run(brand.id);

    // Move to published
    brandService.updateBrandVerificationStatus(brand.id, 'verified');
    brandService.updateBrandVerificationStatus(brand.id, 'content_ready');
    brandService.updateBrandVerificationStatus(brand.id, 'published');

    // Currently logoRightsStatus is 'unreviewed' -> public logo should be empty string
    let publicBrands = brandService.getPublicBrands();
    let publicBrand = publicBrands.find((b) => b.id === brand.id);
    expect(publicBrand).toBeDefined();
    expect(publicBrand!.logo).toBe('');

    // Approve logo rights
    brandService.updateLogoRights(brand.id, {
      logoRightsStatus: 'approved',
      rightsNote: 'İstehsalçı tərəfindən icazə verilib',
      verifiedBy: 'legal_lead',
    });

    publicBrands = brandService.getPublicBrands();
    publicBrand = publicBrands.find((b) => b.id === brand.id);
    expect(publicBrand!.logo).toBe('/media/brands/samsung.png');
  });

  it('5. Brand Alias Collision: Rejects empty aliases and prevents cross-brand duplicate aliases', () => {
    const brand1 = brandService.addCandidateBrand({ name: 'Brand Alpha', slug: 'alpha' });
    const brand2 = brandService.addCandidateBrand({ name: 'Brand Beta', slug: 'beta' });

    // Empty alias
    expect(() => brandService.addBrandAlias(brand1.id, '   ')).toThrow(/ALIAS_REQUIRED/);
    expect(() => brandService.addBrandAlias(brand1.id, '---')).toThrow(/EMPTY_NORMALIZED_ALIAS/);

    // Add valid alias
    const alias1 = brandService.addBrandAlias(brand1.id, 'Alpha Pro');
    expect(alias1.normalizedAlias).toBe('alphapro');

    // Attempting to assign same alias to Brand Beta must throw collision error
    expect(() => brandService.addBrandAlias(brand2.id, 'Alpha Pro')).toThrow(/ALIAS_COLLISION/);
    expect(() => brandService.addBrandAlias(brand2.id, 'alpha-pro')).toThrow(/ALIAS_COLLISION/);
  });

  it('6. Batch Candidate Import: returns detailed per-item results without swallowing errors', () => {
    const result = brandService.importCandidateBatch([
      { name: 'Batch Brand 1', slug: 'batch-1', originCountry: 'Türkiyə' },
      { name: 'Batch Brand 2', slug: 'batch-2', originCountry: 'İtaliya' },
      { name: 'Batch Brand 1', slug: 'batch-1' }, // Duplicate
      { name: '' }, // Rejected empty
    ]);

    expect(result.added).toHaveLength(2);
    expect(result.duplicates).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
  });
});

describe('Phase 3 Production Grade: Taxonomy Safety & Category Spec Templates', () => {
  let db: DatabaseSync;
  let taxService: TaxonomyService;
  let specService: SpecTemplateService;

  beforeEach(() => {
    db = createBaseTestDb();
    applyPhase3Schema(db);
    taxService = new TaxonomyService(db);
    specService = new SpecTemplateService(db);
  });

  it('1. Hierarchy & Depth Protection: Enforces max depth <= 4 and creates tree with parent-child links', () => {
    const root = taxService.createCategory({
      name: 'Böyük Məişət Texnikası',
      slug: 'large-appliances',
    });
    expect(root.depth).toBe(1);

    const l2 = taxService.createCategory({
      name: 'Soyuducular',
      slug: 'refrigerators',
      parentId: root.id,
    });
    expect(l2.depth).toBe(2);

    const l3 = taxService.createCategory({
      name: 'İkiqapılı Soyuducular',
      slug: 'double-door',
      parentId: l2.id,
    });
    expect(l3.depth).toBe(3);

    const l4 = taxService.createCategory({
      name: 'No Frost İkiqapılı',
      slug: 'no-frost',
      parentId: l3.id,
    });
    expect(l4.depth).toBe(4);

    // Attempting depth 5 must fail
    expect(() => {
      taxService.createCategory({
        name: 'İnverter No Frost',
        slug: 'inverter-no-frost',
        parentId: l4.id,
      });
    }).toThrow(/MAX_DEPTH_EXCEEDED/);
  });

  it('2. Subtree Archive & Impact Analysis: Calculates impact and reassigns products safely', () => {
    const root = taxService.createCategory({ name: 'Sobalar', slug: 'ovens' });
    const sub = taxService.createCategory({
      name: 'Quraşdırılan Sobalar',
      slug: 'built-in-ovens',
      parentId: root.id,
    });
    const other = taxService.createCategory({ name: 'Digər Kateqoriya', slug: 'other-cat' });

    // Add products in root and sub
    db.prepare(
      `
      INSERT INTO products (id, brand_id, category_id, title, slug, status, created_at, updated_at)
      VALUES 
        ('p1', 'b1', ?, 'Soba Model 1', 'soba-1', 'published', datetime('now'), datetime('now')),
        ('p2', 'b1', ?, 'Soba Model 2', 'soba-2', 'published', datetime('now'), datetime('now'))
    `
    ).run(root.id, sub.id);

    const impact = taxService.getCategoryArchiveImpact(root.id);
    expect(impact.directProductCount).toBe(1);
    expect(impact.descendantCount).toBe(1);
    expect(impact.descendantProductCount).toBe(1);
    expect(impact.totalAffectedProducts).toBe(2);
    expect(impact.reassignmentRequired).toBe(true);

    // Reassignment target cannot be self or descendant
    expect(() => {
      taxService.archiveCategory(root.id, { reassignToCategoryId: root.id });
    }).toThrow(/INVALID_REASSIGNMENT_TARGET/);

    expect(() => {
      taxService.archiveCategory(root.id, { reassignToCategoryId: sub.id });
    }).toThrow(/INVALID_REASSIGNMENT_TARGET/);

    // Successful archive with valid reassignment
    const archived = taxService.archiveCategory(root.id, { reassignToCategoryId: other.id });
    expect(archived.isArchived).toBe(true);

    const subUpdated = taxService.getCategoryById(sub.id);
    expect(subUpdated.isArchived).toBe(true);

    // Check that products were reassigned to other category
    const countInOther = db
      .prepare('SELECT COUNT(*) as c FROM products WHERE category_id = ?')
      .get(other.id) as { c: number };
    expect(countInOther.c).toBe(2);
  });

  it('3. Category Spec Template inheritance and leaf override', () => {
    const parent = taxService.createCategory({ name: 'Kondisionerlər', slug: 'ac' });
    const child = taxService.createCategory({
      name: 'İnverter Kondisionerlər',
      slug: 'inverter-ac',
      parentId: parent.id,
    });

    // Define template on parent
    specService.setCategorySpecTemplate(parent.id, {
      specKey: 'btu_capacity',
      label: 'BTU Gücü',
      unit: 'BTU/h',
      required: true,
      sortOrder: 1,
    });

    specService.setCategorySpecTemplate(parent.id, {
      specKey: 'noise_level',
      label: 'Səs Səviyyəsi',
      unit: 'dB',
      required: false,
      sortOrder: 2,
    });

    // Child inherits parent templates
    let childTemplates = specService.getCategorySpecTemplates(child.id);
    expect(childTemplates).toHaveLength(2);
    expect(childTemplates[0].specKey).toBe('btu_capacity');
    expect(childTemplates[0].isInherited).toBe(true);
    expect(childTemplates[0].sourceCategoryId).toBe(parent.id);

    // Child overrides 'noise_level' with custom required=true and new unit
    specService.setCategorySpecTemplate(child.id, {
      specKey: 'noise_level',
      label: 'Səs Səviyyəsi (İnverter)',
      unit: 'dB(A)',
      required: true,
      sortOrder: 2,
    });

    childTemplates = specService.getCategorySpecTemplates(child.id);
    expect(childTemplates).toHaveLength(2);
    const noiseTpl = childTemplates.find((t) => t.specKey === 'noise_level')!;
    expect(noiseTpl.label).toBe('Səs Səviyyəsi (İnverter)');
    expect(noiseTpl.unit).toBe('dB(A)');
    expect(noiseTpl.required).toBe(true);
    expect(noiseTpl.isInherited).toBe(false);
    expect(noiseTpl.sourceCategoryId).toBe(child.id);
  });
});

describe('Phase 3 Production Grade: Concurrency & ETags', () => {
  it('1. Brand & Category ETags: Generates valid ETags and matches weak/strong versions', () => {
    const brand = { id: 'ardo', version: 3 };
    const brandEtag = generateBrandEtag(brand);
    expect(brandEtag).toBe('"b-ardo-v3"');

    expect(matchBrandEtag('"b-ardo-v3"', brand)).toBe(true);
    expect(matchBrandEtag('"v3"', brand)).toBe(true);
    expect(matchBrandEtag('v3', brand)).toBe(true);
    expect(matchBrandEtag('3', brand)).toBe(true);
    expect(matchBrandEtag('W/"v3"', brand)).toBe(true);
    // Wildcard * must be rejected to prevent concurrency bypass
    expect(matchBrandEtag('*', brand)).toBe(false);
    expect(matchBrandEtag('"*"', brand)).toBe(false);

    // Mismatches
    expect(matchBrandEtag('"b-ardo-v2"', brand)).toBe(false);
    expect(matchBrandEtag('v2', brand)).toBe(false);

    const cat = { id: 'ovens', version: 2 };
    const catEtag = generateCategoryEtag(cat);
    expect(catEtag).toBe('"c-ovens-v2"');

    expect(matchCategoryEtag('"c-ovens-v2"', cat)).toBe(true);
    expect(matchCategoryEtag('"v2"', cat)).toBe(true);
    expect(matchCategoryEtag('*', cat)).toBe(false);
    expect(matchCategoryEtag('"*"', cat)).toBe(false);
    expect(matchCategoryEtag('v1', cat)).toBe(false);
  });

  it('2. Version bumping on brand source, alias, logo, and status mutations', () => {
    const db = createBaseTestDb();
    applyPhase3Schema(db);
    const brandService = new BrandRegistryService(db);

    const brand = brandService.addCandidateBrand({ name: 'VersionTest', slug: 'version-test' });
    expect(brand.version).toBe(1);

    // Add source -> bumps version
    const source = brandService.addBrandSource(brand.id, {
      sourceUrl: 'https://versiontest.com',
      sourceType: 'official_website',
    });
    let b = brandService.getBrandById(brand.id)!;
    expect(b.version).toBe(2);

    // Review source status -> bumps version
    brandService.updateBrandSourceStatus(brand.id, source.id, 'verified');
    b = brandService.getBrandById(brand.id)!;
    expect(b.version).toBe(3);

    // Add alias -> bumps version
    brandService.addBrandAlias(brand.id, 'VT Pro');
    b = brandService.getBrandById(brand.id)!;
    expect(b.version).toBe(4);

    // Update logo rights -> bumps version
    brandService.updateLogoRights(brand.id, { logoRightsStatus: 'approved' });
    b = brandService.getBrandById(brand.id)!;
    expect(b.version).toBe(5);

    // Update verification status -> bumps version
    brandService.updateBrandVerificationStatus(brand.id, 'verified');
    b = brandService.getBrandById(brand.id)!;
    expect(b.version).toBe(6);
  });

  it('3. Complete Sibling Set Validation on Category Reorder', () => {
    const db = createBaseTestDb();
    applyPhase3Schema(db);
    const taxService = new TaxonomyService(db);

    const c1 = taxService.createCategory({ name: 'Cat 1', slug: 'cat-1' });
    const c2 = taxService.createCategory({ name: 'Cat 2', slug: 'cat-2' });
    const c3 = taxService.createCategory({ name: 'Cat 3', slug: 'cat-3' });

    // Incomplete sibling set (only 2 of 3 root categories) must throw
    expect(() => {
      taxService.reorderCategories({
        parentId: null,
        reorderItems: [
          { id: c1.id, sortOrder: 10 },
          { id: c2.id, sortOrder: 20 },
        ],
      });
    }).toThrow(/INCOMPLETE_SIBLING_SET/);

    // Complete sibling set succeeds
    const res = taxService.reorderCategories({
      parentId: null,
      reorderItems: [
        { id: c3.id, sortOrder: 10 },
        { id: c1.id, sortOrder: 20 },
        { id: c2.id, sortOrder: 30 },
      ],
    });
    expect(res.reorderedCount).toBe(3);

    const tree = taxService.getCategoryTree();
    expect(tree[0].id).toBe(c3.id);
    expect(tree[1].id).toBe(c1.id);
    expect(tree[2].id).toBe(c2.id);
  });
});

describe('Phase 3 Production Grade: Transactional Promotion to Public DB', () => {
  it('1. promotePhase3CatalogData atomically synchronizes Phase 3 data from draft to target DB in /tmp', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'sahara-p3-promote-'));
    const draftPath = join(tempDir, 'draft.sqlite');
    const pubPath = join(tempDir, 'public.sqlite');

    try {
      const draftDb = new DatabaseSync(draftPath);
      const pubDb = new DatabaseSync(pubPath);

      // Initialize base schema on both
      for (const d of [draftDb, pubDb]) {
        d.exec(`
          CREATE TABLE brands (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            origin_country TEXT NOT NULL DEFAULT '',
            description TEXT NOT NULL DEFAULT '',
            logo TEXT NOT NULL DEFAULT '',
            active INTEGER NOT NULL DEFAULT 1,
            coming_soon INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
          );
          CREATE TABLE categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            icon TEXT NOT NULL DEFAULT '',
            description TEXT NOT NULL DEFAULT '',
            sort_order INTEGER NOT NULL DEFAULT 0,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
          CREATE TABLE products (
            id TEXT PRIMARY KEY,
            brand_id TEXT NOT NULL,
            category_id TEXT NOT NULL,
            title TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL DEFAULT 'published',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
          CREATE TABLE audit_logs (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            action TEXT NOT NULL,
            title TEXT NOT NULL,
            details TEXT NOT NULL DEFAULT '',
            ip_address TEXT NOT NULL DEFAULT '',
            user_agent TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'success',
            created_at TEXT NOT NULL
          );
          CREATE TABLE schema_migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            checksum TEXT NOT NULL,
            applied_at TEXT NOT NULL,
            status TEXT NOT NULL
          );
        `);
        applyPhase3Schema(d);
      }

      // Populate draftDb with rich Phase 3 data
      const brandService = new BrandRegistryService(draftDb);
      const taxService = new TaxonomyService(draftDb);
      const specService = new SpecTemplateService(draftDb);

      const b = brandService.addCandidateBrand({
        name: 'Lotus Pro',
        slug: 'lotus-pro',
        originCountry: 'İtaliya',
      });
      const src = brandService.addBrandSource(b.id, {
        sourceUrl: 'https://lotus.it',
        sourceType: 'official_website',
      });
      brandService.updateBrandSourceStatus(b.id, src.id, 'verified');
      brandService.addBrandAlias(b.id, 'Lotus Italy');
      brandService.updateLogoRights(b.id, { logoRightsStatus: 'approved' });
      brandService.updateBrandVerificationStatus(b.id, 'verified');
      brandService.updateBrandVerificationStatus(b.id, 'content_ready');
      brandService.updateBrandVerificationStatus(b.id, 'published');

      const rootCat = taxService.createCategory({ name: 'Aspiratorlar', slug: 'aspiratorlar' });
      const subCat = taxService.createCategory({
        name: 'Teleskopik Aspiratorlar',
        slug: 'teleskopik',
        parentId: rootCat.id,
      });
      specService.setCategorySpecTemplate(rootCat.id, {
        specKey: 'airflow_m3h',
        label: 'Hava Sovurma Gücü',
        unit: 'm3/saat',
        required: true,
      });

      // Run transactional Phase 3 promotion
      const promoResult = promotePhase3CatalogData(draftDb, pubDb);
      expect(promoResult.ok).toBe(true);

      // Verify pubDb received exact Phase 3 data
      const pubBrand = pubDb.prepare('SELECT * FROM brands WHERE id = ?').get(b.id) as any;
      expect(pubBrand).toBeDefined();
      expect(pubBrand.verification_status).toBe('published');
      expect(pubBrand.logo_rights_status).toBe('approved');

      const pubSources = pubDb.prepare('SELECT * FROM brand_sources WHERE brand_id = ?').all(b.id);
      expect(pubSources).toHaveLength(1);

      const pubAliases = pubDb
        .prepare('SELECT * FROM brand_aliases WHERE brand_id = ?')
        .all(b.id) as any[];
      expect(pubAliases).toHaveLength(1);
      expect(pubAliases[0].alias).toBe('Lotus Italy');

      const pubCats = pubDb.prepare('SELECT * FROM categories WHERE id = ?').get(subCat.id) as any;
      expect(pubCats.parent_id).toBe(rootCat.id);
      expect(pubCats.depth).toBe(2);

      const pubTpls = pubDb
        .prepare('SELECT * FROM category_spec_templates WHERE category_id = ?')
        .all(rootCat.id) as any[];
      expect(pubTpls).toHaveLength(1);
      expect(pubTpls[0].spec_key).toBe('airflow_m3h');

      draftDb.close();
      pubDb.close();
    } finally {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

  it('2. publishAtomic fails closed with PUBLIC_DB_SCHEMA_NOT_READY when target public DB lacks Phase 3 schema', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'sahara-p3-notready-'));
    const draftPath = join(tempDir, 'draft.sqlite');
    const pubPath = join(tempDir, 'public.sqlite');

    try {
      const draftRepo = createCatalogDatabase(draftPath);
      const pubRepo = createCatalogDatabase(pubPath);

      // Apply Phase 3 to draft only
      applyPhase3Schema(draftRepo.db);
      expect(isPhase3SchemaReady(draftRepo.db)).toBe(true);
      expect(isPhase3SchemaReady(pubRepo.db)).toBe(false);

      const catalogData = {
        brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', active: true }],
        categories: [{ id: 'washers', name: 'Washers', slug: 'washers', active: true }],
        products: [],
        settings: {},
      };

      // publishAtomic must throw PUBLIC_DB_SCHEMA_NOT_READY
      expect(() => {
        pubRepo.publishAtomic(catalogData, draftRepo.db);
      }).toThrow(/PUBLIC_DB_SCHEMA_NOT_READY/);

      // Verify no changes to public DB
      const brandCount = pubRepo.db.prepare('SELECT COUNT(*) as c FROM brands').get() as {
        c: number;
      };
      expect(brandCount.c).toBe(0);

      draftRepo.close();
      pubRepo.close();
    } finally {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

  it('3. publishAtomic is 100% transactional: Rolls back catalog save if Phase 3 promotion fails midway', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'sahara-p3-atomic-rollback-'));
    const draftPath = join(tempDir, 'draft.sqlite');
    const pubPath = join(tempDir, 'public.sqlite');

    try {
      const draftRepo = createCatalogDatabase(draftPath);
      const pubRepo = createCatalogDatabase(pubPath);

      applyPhase3Schema(draftRepo.db);
      applyPhase3Schema(pubRepo.db);

      // Initial catalog in public
      const initialCatalog = {
        brands: [
          { id: 'initial_brand', name: 'Initial Brand', slug: 'initial-brand', active: true },
        ],
        categories: [
          { id: 'initial_cat', name: 'Initial Category', slug: 'initial-cat', active: true },
        ],
        products: [
          {
            id: 'p_init',
            code: 'INIT01',
            title: 'Initial Product',
            brandId: 'initial_brand',
            category: 'initial_cat',
            status: 'published',
          },
        ],
        settings: {},
      };
      pubRepo.saveCatalog(initialCatalog);

      // Capture public DB state before failed publish
      const beforeBrandCount = (pubRepo.db.prepare('SELECT COUNT(*) as c FROM brands').get() as any)
        .c;
      const beforeProdCount = (
        pubRepo.db.prepare('SELECT COUNT(*) as c FROM products').get() as any
      ).c;
      const beforeProd = pubRepo.db
        .prepare('SELECT * FROM products WHERE id = ?')
        .get('p_init') as any;
      expect(beforeProd).toBeDefined();

      // Draft data with changes
      const updatedCatalog = {
        brands: [{ id: 'new_brand', name: 'New Brand', slug: 'new-brand', active: true }],
        categories: [{ id: 'new_cat', name: 'New Category', slug: 'new-cat', active: true }],
        products: [
          {
            id: 'p_new',
            code: 'NEW01',
            title: 'New Product',
            brandId: 'new_brand',
            category: 'new_cat',
            status: 'published',
          },
        ],
        settings: {},
      };

      // Add Phase 3 draft data that will trigger a constraint failure on pubDb
      // E.g. Add a trigger to public DB that aborts during brand_sources insert
      pubRepo.db.exec(`
        CREATE TRIGGER fail_sources_insert BEFORE INSERT ON brand_sources
        BEGIN
          SELECT RAISE(FAIL, 'INTENTIONAL_PROMOTION_FAILURE');
        END;
      `);

      // Add brand source in draft to ensure trigger fires
      const brandService = new BrandRegistryService(draftRepo.db);
      brandService.addCandidateBrand({ id: 'new_brand', name: 'New Brand', slug: 'new-brand' });
      brandService.addBrandSource('new_brand', {
        sourceUrl: 'https://newbrand.com',
        sourceType: 'official_website',
      });

      // Attempt atomic publish - must throw and rollback completely
      expect(() => {
        pubRepo.publishAtomic(updatedCatalog, draftRepo.db);
      }).toThrow(/INTENTIONAL_PROMOTION_FAILURE/);

      // Verify public DB was 100% rolled back to initial state
      const afterBrandCount = (pubRepo.db.prepare('SELECT COUNT(*) as c FROM brands').get() as any)
        .c;
      const afterProdCount = (pubRepo.db.prepare('SELECT COUNT(*) as c FROM products').get() as any)
        .c;
      const afterProd = pubRepo.db
        .prepare('SELECT * FROM products WHERE id = ?')
        .get('p_init') as any;

      expect(afterBrandCount).toBe(beforeBrandCount);
      expect(afterProdCount).toBe(beforeProdCount);
      expect(afterProd).toBeDefined();
      expect(afterProd.title).toBe('Initial Product');

      // Verify the new product does NOT exist in public DB
      const newProdCheck = pubRepo.db.prepare('SELECT * FROM products WHERE id = ?').get('p_new');
      expect(newProdCheck).toBeUndefined();

      draftRepo.close();
      pubRepo.close();
    } finally {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });
});
