import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createSnapshotSet,
  restoreSnapshotSet,
  dryRunPimV2Migration,
  executeDualDatabaseMigration,
  calculateFileHash,
} from '../backend/pimV2Migration.mjs';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';

describe('PIM v2 Additive Migration & Idempotency Suite', () => {
  let tempDir: string;
  let publicDbPath: string;
  let draftDbPath: string;

  beforeEach(() => {
    process.env.PIM_TOKEN_SECRET = 'test_secret_for_vitest';
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-pim-test-'));
    publicDbPath = join(tempDir, 'catalog.sqlite');
    draftDbPath = join(tempDir, 'catalog-draft.sqlite');

    // Create realistic initial public catalog
    const db = createCatalogDatabase(publicDbPath);
    db.saveCatalog({
      brands: [
        {
          id: 'ardo',
          name: 'ARDO',
          slug: 'ardo',
          originCountry: 'İtaliya',
          manufacturingCountries: ['İtaliya'],
          comingSoon: false,
          active: true,
        },
        {
          id: 'lotus',
          name: 'Lotus',
          slug: 'lotus',
          originCountry: 'Çin',
          manufacturingCountries: ['Çin'],
          comingSoon: false,
          active: true,
        },
      ],
      categories: [
        {
          id: 'cooktop',
          name: 'Qaz Panelləri',
          slug: 'cooktop',
          icon: 'flame',
          active: true,
          sortOrder: 1,
        },
      ],
      products: [
        {
          id: 'p-legacy-1',
          code: 'M-101',
          title: 'ARDO Qaz Paneli Inox',
          brandId: 'ardo',
          category: 'cooktop',
          image: '/media/ardo/m-101.jpg',
          imagePosition: 'center 40%',
          imageFit: 'contain',
          isFeatured: true,
          price: 450,
          oldPrice: 500,
          status: 'published',
          shortDesc: 'Xüsusi admin təsviri',
          highlights: ['SABAF ocaqları'],
          specs: [
            { id: 's1', name: 'Gözlərin sayı', value: '4', group: 'Əsas' },
            { id: 's2', name: 'Güc', value: '2,2 kW', group: 'Texniki' },
          ],
          media: [
            {
              id: 'm-1',
              type: 'image',
              url: '/media/ardo/m-101.jpg',
              alt: 'ARDO M-101',
              objectPosition: 'center 40%',
              fitMode: 'contain',
            },
          ],
        },
      ],
      settings: {
        whatsappNumber: '+994501234567',
        phoneNumbers: ['+994121234567'],
        companyName: 'Sahara Electronics',
      },
    });
    db.close();

    // Create draft catalog copy
    const draftDb = createCatalogDatabase(draftDbPath);
    draftDb.saveCatalog({
      brands: [
        {
          id: 'ardo',
          name: 'ARDO',
          slug: 'ardo',
          originCountry: 'İtaliya',
          manufacturingCountries: ['İtaliya'],
          comingSoon: false,
          active: true,
        },
      ],
      categories: [
        {
          id: 'cooktop',
          name: 'Qaz Panelləri',
          slug: 'cooktop',
          icon: 'flame',
          active: true,
          sortOrder: 1,
        },
      ],
      products: [
        {
          id: 'p-draft-1',
          code: 'M-102-DRAFT',
          title: 'Draft Məhsul',
          brandId: 'ardo',
          category: 'cooktop',
          image: '/media/ardo/m-102.jpg',
          status: 'draft',
          shortDesc: 'Draft qeyd',
          specs: [],
          media: [],
        },
      ],
    });
    draftDb.close();
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('1. Dry-run simulation returns success without writing to actual database', () => {
    const beforeHash = calculateFileHash(publicDbPath);
    const dryRunResult = dryRunPimV2Migration(tempDir);

    expect(dryRunResult.ok).toBe(true);
    expect(dryRunResult.report.mainDb.productCount).toBe(1);
    expect(dryRunResult.dryRunToken).toBeDefined();

    const afterHash = calculateFileHash(publicDbPath);
    expect(afterHash).toBe(beforeHash); // Zero writes to original DB
  });

  it('2. Dual-DB migration executes safely, preserves all crops, specs and published status', () => {
    const result = executeDualDatabaseMigration(tempDir);
    expect(result.success).toBe(true);

    const pubDb = new DatabaseSync(publicDbPath);
    try {
      // Check PRAGMA integrity
      const integrity = pubDb.prepare('PRAGMA integrity_check').get();
      const fkCheck = pubDb.prepare('PRAGMA foreign_key_check').all();
      expect((integrity as any)?.integrity_check).toBe('ok');
      expect(fkCheck).toEqual([]);

      // Check product preservation
      const product = pubDb.prepare('SELECT * FROM products WHERE id = ?').get('p-legacy-1') as any;
      expect(product.code).toBe('M-101');
      expect(product.publication_status).toBe('published'); // Preserved legacy published status
      expect(product.price).toBe(450);
      expect(product.image_position).toBe('center 40%');
      expect(product.image_fit).toBe('contain');

      // Check product variant populated
      const variant = pubDb
        .prepare('SELECT * FROM product_variants WHERE product_id = ?')
        .get('p-legacy-1') as any;
      expect(variant.model_code).toBe('M-101');
      expect(variant.status).toBe('active');
      expect(variant.gtin).toBeNull(); // No fake data

      // Check spec values with raw and normalized separation
      const specVals = pubDb
        .prepare('SELECT * FROM product_spec_values WHERE variant_id = ?')
        .all(variant.id) as any[];
      expect(specVals).toHaveLength(2);
      const powerSpec = specVals.find((s) => s.raw_name === 'Güc');
      expect(powerSpec.raw_value).toBe('2,2 kW'); // Raw preserved
      expect(powerSpec.normalized_value_number).toBe(2200); // Normalized
      expect(powerSpec.unit).toBe('W');
      expect(powerSpec.normalization_status).toBe('valid');

      // Check media crop preservation
      const media = pubDb
        .prepare('SELECT * FROM product_media WHERE product_id = ?')
        .get('p-legacy-1') as any;
      expect(media.object_position).toBe('center 40%');
      expect(media.fit_mode).toBe('contain');

      const asset = pubDb.prepare('SELECT * FROM media_assets WHERE url = ?').get(media.url) as any;
      expect(asset.verification_status).toBe('legacy_unverified');

      // Check initial revision created
      const revisions = pubDb
        .prepare('SELECT * FROM product_revisions WHERE product_id = ?')
        .all('p-legacy-1') as any[];
      expect(revisions).toHaveLength(1);
      expect(revisions[0].version).toBe(1);

      // Check schema_migrations table
      const migrationRecord = pubDb
        .prepare('SELECT * FROM schema_migrations WHERE version = 8')
        .get() as any;
      expect(migrationRecord.status).toBe('success');
    } finally {
      pubDb.close();
    }
  });

  it('3. Idempotency test: running migration 1x, 2x, and 10x produces 0 drift', () => {
    // 1st run
    executeDualDatabaseMigration(tempDir);

    const pubDb1 = new DatabaseSync(publicDbPath);
    const variants1 = pubDb1.prepare('SELECT COUNT(*) AS count FROM product_variants').get() as any;
    const specs1 = pubDb1.prepare('SELECT COUNT(*) AS count FROM product_spec_values').get() as any;
    const revisions1 = pubDb1
      .prepare('SELECT COUNT(*) AS count FROM product_revisions')
      .get() as any;
    pubDb1.close();

    // 2nd run
    executeDualDatabaseMigration(tempDir);

    // 10th run simulation
    for (let i = 3; i <= 10; i++) {
      executeDualDatabaseMigration(tempDir);
    }

    const pubDb10 = new DatabaseSync(publicDbPath);
    const variants10 = pubDb10
      .prepare('SELECT COUNT(*) AS count FROM product_variants')
      .get() as any;
    const specs10 = pubDb10
      .prepare('SELECT COUNT(*) AS count FROM product_spec_values')
      .get() as any;
    const revisions10 = pubDb10
      .prepare('SELECT COUNT(*) AS count FROM product_revisions')
      .get() as any;
    pubDb10.close();

    expect(variants10.count).toBe(variants1.count);
    expect(specs10.count).toBe(specs1.count);
    expect(revisions10.count).toBe(revisions1.count);
  });

  it('4. Snapshot and Rollback test: atomic rollback restores exact original state on failure', () => {
    const originalHash = calculateFileHash(publicDbPath);
    const snapshotSet = createSnapshotSet(tempDir);

    // Modify DB destructively
    const pubDb = new DatabaseSync(publicDbPath);
    pubDb.exec("UPDATE products SET title = 'CORRUPTED DATA';");
    pubDb.close();

    expect(calculateFileHash(publicDbPath)).not.toBe(originalHash);

    // Restore from snapshot
    restoreSnapshotSet(snapshotSet);

    // Verify exact restoration matches snapshot checksum
    expect(calculateFileHash(publicDbPath)).toBe(snapshotSet.databases['catalog.sqlite'].sha256);

    const restoredDb = new DatabaseSync(publicDbPath);
    const product = restoredDb
      .prepare('SELECT * FROM products WHERE id = ?')
      .get('p-legacy-1') as any;
    expect(product.title).toBe('ARDO Qaz Paneli Inox');
    restoredDb.close();
  });
});
