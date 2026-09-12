process.env.NODE_ENV = 'test';
process.env.ALLOW_TEMP_DATA_DIR = '1';

import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  createCatalogDatabase,
  createConsistentDatabaseSnapshot,
} from '../backend/catalogDatabase.mjs';

test('Backup & Restore: Verilənlər bazasının nüsxələnməsi, snapshot bərpası və rollback dəqiqliyi', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'sahara-backup-test-'));
  const liveDbPath = join(tempDir, 'catalog.sqlite');
  const backupDbPath = join(tempDir, 'catalog-backup.sqlite');

  const db = createCatalogDatabase(liveDbPath);

  try {
    // 1. İlkin məlumatı yazırıq
    const initialData = {
      brands: [
        {
          id: 'ardo',
          name: 'ARDO',
          slug: 'ardo',
          originCountry: 'İtaliya',
          manufacturingCountries: ['Türkiyə'],
          active: true,
        },
      ],
      categories: [{ id: 'oven', name: 'Sobalar', slug: 'oven', active: true, sortOrder: 0 }],
      products: [
        {
          id: 'ardo-oven-v1',
          code: 'V1-MODEL',
          title: 'İlkin Soba Modeli',
          brandId: 'ardo',
          category: 'oven',
          categoryName: 'Sobalar',
          image: '/media/oven-v1.png',
          media: [{ id: 'm1', type: 'image', url: '/media/oven-v1.png', alt: 'V1' }],
          shortDesc: 'V1 Təsvir',
          highlights: ['A+ Enerji'],
          specs: [{ id: 's1', name: 'Güc', value: '2000W', group: 'Əsas' }],
          manufacturingCountry: 'Türkiyə',
          status: 'published',
        },
      ],
      settings: { companyName: 'Sahara Electronics', address: 'Sədərək TM' },
      articles: [],
      updatedAt: '2026-09-06T10:00:00.000Z',
    };

    db.saveCatalog(initialData);
    assert.equal(db.getCatalog().products[0].title, 'İlkin Soba Modeli');

    // 2. Snapshot yaradırıq
    db.createSnapshot({ name: 'V1 İlkin Snapshot', createdBy: 'admin' });
    const { snapshots, total } = db.getSnapshots();
    assert.equal(total, 1);
    assert.equal(snapshots.length, 1);
    const snapshotId = snapshots[0].id;

    // 3. Cold backup fayl nüsxəsini çıxarırıq (SQLite Checkpoint & Backup)
    await db.backupDatabase(backupDbPath);
    assert.equal(existsSync(backupDbPath), true);

    // 4. Bazanı dəyişdiririk (V2 məlumatı daxil edirik)
    const modifiedData = {
      ...initialData,
      products: [
        {
          id: 'ardo-oven-v2',
          code: 'V2-MODEL',
          title: 'Dəyişdirilmiş Soba Modeli V2',
          brandId: 'ardo',
          category: 'oven',
          categoryName: 'Sobalar',
          image: '/media/oven-v2.png',
          media: [{ id: 'm2', type: 'image', url: '/media/oven-v2.png', alt: 'V2' }],
          shortDesc: 'V2 Təsvir',
          highlights: ['Inverter'],
          specs: [{ id: 's2', name: 'Güc', value: '2500W', group: 'Əsas' }],
          manufacturingCountry: 'Türkiyə',
          status: 'published',
        },
      ],
    };
    db.saveCatalog(modifiedData);
    assert.equal(db.getCatalog().products[0].title, 'Dəyişdirilmiş Soba Modeli V2');

    // 5. Snapshot-a Rollback edirik və V1-in bərpa olunduğunu təsdiqləyirik
    const restored = db.restoreSnapshot(snapshotId);
    assert.ok(restored);
    assert.equal(db.getCatalog().products[0].title, 'İlkin Soba Modeli');
    assert.equal(db.getCatalog().products[0].code, 'V1-MODEL');

    // 6. Cold Backup faylından təcrid olunmuş tam bərpanı (Cold Restore) yoxlayırıq
    const restoredDir = mkdtempSync(join(tmpdir(), 'sahara-cold-restore-'));
    const restoredDbPath = join(restoredDir, 'restored.sqlite');
    copyFileSync(backupDbPath, restoredDbPath);

    const restoredDb = createCatalogDatabase(restoredDbPath);
    const restoredCatalog = restoredDb.getCatalog();
    assert.equal(restoredCatalog.products.length, 1);
    assert.equal(restoredCatalog.products[0].title, 'İlkin Soba Modeli');
    assert.equal(restoredCatalog.brands[0].name, 'ARDO');
    assert.equal(restoredCatalog.settings.companyName, 'Sahara Electronics');

    rmSync(restoredDir, { recursive: true, force: true });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Online Snapshot Integrity: createConsistentDatabaseSnapshot VACUUM INTO ilə aktiv bazadan atomik nüsxə çıxarır', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'sahara-online-snap-test-'));
  const liveDbPath = join(tempDir, 'catalog.sqlite');
  const snapDbPath = join(tempDir, 'catalog-snap.sqlite');

  try {
    const db = createCatalogDatabase(liveDbPath);
    db.saveCatalog({
      brands: [
        {
          id: 'ardo',
          name: 'ARDO',
          slug: 'ardo',
          originCountry: 'İtaliya',
          manufacturingCountries: [],
          active: true,
        },
      ],
      categories: [{ id: 'hood', name: 'Aspiratorlar', slug: 'hood', active: true, sortOrder: 0 }],
      products: [
        {
          id: 'p1',
          code: 'C1',
          title: 'Aspirator 1',
          brandId: 'ardo',
          category: 'hood',
          categoryName: 'Aspiratorlar',
          price: 300,
          status: 'published',
        },
        {
          id: 'p2',
          code: 'C2',
          title: 'Aspirator 2',
          brandId: 'ardo',
          category: 'hood',
          categoryName: 'Aspiratorlar',
          price: 400,
          status: 'published',
        },
      ],
      settings: { companyName: 'Sahara Electronics', address: '' },
      articles: [],
      updatedAt: '2026-09-06T10:00:00.000Z',
    });

    // Write directly without checkpoint to create active WAL pages
    db.recordEvent({ type: 'catalog_view', data: { page: 'home' } });
    db.recordEvent({ type: 'catalog_view', data: { page: 'products' } });

    // Perform atomic online snapshot via SQLite VACUUM INTO
    createConsistentDatabaseSnapshot(liveDbPath, snapDbPath);
    assert.equal(existsSync(snapDbPath), true);

    const snapDb = createCatalogDatabase(snapDbPath);
    const catalog = snapDb.getCatalog();
    assert.equal(catalog.products.length, 2);
    assert.equal(catalog.products[0].code, 'C1');
    assert.equal(catalog.products[1].code, 'C2');

    const analytics = snapDb.getAnalytics();
    assert.equal(analytics.catalogViews, 2);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Fail-Closed Integrity: VACUUM INTO uğursuz olduqda raw-copy yaranmır və əməliyyat xəta qaytarır', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'sahara-failclosed-snap-test-'));
  const liveDbPath = join(tempDir, 'catalog.sqlite');
  const invalidDestination = join(tempDir, 'non_existent_folder', 'nested', 'backup.sqlite');

  try {
    const db = createCatalogDatabase(liveDbPath);
    db.saveCatalog({
      brands: [
        {
          id: 'ardo',
          name: 'ARDO',
          slug: 'ardo',
          originCountry: 'İtaliya',
          manufacturingCountries: [],
          active: true,
        },
      ],
      categories: [{ id: 'hood', name: 'Aspiratorlar', slug: 'hood', active: true, sortOrder: 0 }],
      products: [
        {
          id: 'p1',
          code: 'C1',
          title: 'Aspirator 1',
          brandId: 'ardo',
          category: 'hood',
          categoryName: 'Aspiratorlar',
          price: 300,
          status: 'published',
        },
      ],
      settings: { companyName: 'Sahara Electronics', address: '' },
      articles: [],
      updatedAt: '2026-09-06T10:00:00.000Z',
    });

    // 1. Verify createConsistentDatabaseSnapshot throws and does NOT create raw file
    assert.throws(() => {
      createConsistentDatabaseSnapshot(liveDbPath, invalidDestination);
    }, /Failed to create consistent database snapshot/);
    assert.equal(existsSync(invalidDestination), false);

    // 2. Verify db.backupDatabase rejects and does NOT create raw copy
    await assert.rejects(async () => {
      await db.backupDatabase(invalidDestination);
    }, /Failed to create atomic database backup via VACUUM INTO/);
    assert.equal(existsSync(invalidDestination), false);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
