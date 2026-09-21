// @vitest-environment happy-dom
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { existsSync, lstatSync, mkdtempSync, rmSync, realpathSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { verifyRootBoundary, getFileSha256, isMonorepoRoot } from '../scripts/check-boundary.mjs';
import {
  createCatalogDatabase,
  createConsistentDatabaseSnapshot,
} from '../backend/catalogDatabase.mjs';

function getFileSnapshot(filePath: string) {
  if (!existsSync(filePath)) {
    return { exists: false, size: 0, mtimeMs: 0, hash: null };
  }
  const stat = statSync(filePath);
  const hash = stat.size > 0 ? getFileSha256(filePath) : 'empty';
  return {
    exists: true,
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    hash,
  };
}

describe('Boundary Isolation & Root Catalog Protection Test Suite', () => {
  const siteDir = resolve(__dirname, '..');
  const repoRoot = resolve(siteDir, '..');

  it('verifies all protected root files match exact SHA-256 baseline manifest (331 files)', () => {
    const isStandalone = !isMonorepoRoot(repoRoot);
    if (isStandalone) {
      console.log(
        'ℹ️ [BOUNDARY] Root manifest verification: Not applicable in standalone mode (no parent monorepo detected).'
      );
      return;
    }
    const result = verifyRootBoundary();
    expect(result.success).toBe(true);
    expect(result.verifiedFiles.length).toBe(331);
    expect(result.errors).toHaveLength(0);
  });

  it('NEGATIVE TEST: deliberately fails when root file tampering is simulated', () => {
    const isStandalone = !isMonorepoRoot(repoRoot);
    if (isStandalone) {
      console.log('ℹ️ [BOUNDARY] Negative tamper simulation: Not applicable in standalone mode.');
      return;
    }
    expect(() => {
      verifyRootBoundary({ simulateTamper: true });
    }).toThrow(/SHA-256 uyğunsuzluğu tapıldı/);
  });

  it('verifies site/ has its own independent SQLite databases that are physically separate from root', () => {
    const siteCatalog = join(siteDir, 'data', 'catalog.sqlite');
    const siteDraft = join(siteDir, 'data', 'catalog-draft.sqlite');
    const rootCatalog = join(repoRoot, 'data', 'catalog.sqlite');
    const rootDraft = join(repoRoot, 'data', 'catalog-draft.sqlite');

    expect(existsSync(siteCatalog)).toBe(true);
    expect(existsSync(siteDraft)).toBe(true);

    const statCatalog = lstatSync(siteCatalog);
    const statDraft = lstatSync(siteDraft);
    expect(statCatalog.isSymbolicLink()).toBe(false);
    expect(statDraft.isSymbolicLink()).toBe(false);

    // Verify real paths do NOT cross over
    if (existsSync(rootCatalog)) {
      const realSiteCatalog = realpathSync(siteCatalog);
      const realRootCatalog = realpathSync(rootCatalog);
      expect(realSiteCatalog).not.toBe(realRootCatalog);
    }

    if (existsSync(rootDraft)) {
      const realSiteDraft = realpathSync(siteDraft);
      const realRootDraft = realpathSync(rootDraft);
      expect(realSiteDraft).not.toBe(realRootDraft);
    }
  });

  it('FAIL-FAST SECURITY TEST: site database factory strictly rejects root database paths', () => {
    const rootCatalogPath = join(repoRoot, 'data', 'catalog.sqlite');
    if (existsSync(rootCatalogPath)) {
      expect(() => {
        createCatalogDatabase(rootCatalogPath);
      }).toThrow(/FATAL SECURITY VIOLATION/);
    }
  });

  it('verifies write and analytical operations during test execution NEVER mutate real root databases', () => {
    const rootFiles = [
      join(repoRoot, 'data', 'catalog.sqlite'),
      join(repoRoot, 'data', 'catalog.sqlite-wal'),
      join(repoRoot, 'data', 'catalog.sqlite-shm'),
      join(repoRoot, 'data', 'catalog-draft.sqlite'),
      join(repoRoot, 'data', 'catalog-draft.sqlite-wal'),
      join(repoRoot, 'data', 'catalog-draft.sqlite-shm'),
    ];
    const siteFiles = [
      join(siteDir, 'data', 'catalog.sqlite'),
      join(siteDir, 'data', 'catalog.sqlite-wal'),
      join(siteDir, 'data', 'catalog.sqlite-shm'),
      join(siteDir, 'data', 'catalog-draft.sqlite'),
      join(siteDir, 'data', 'catalog-draft.sqlite-wal'),
      join(siteDir, 'data', 'catalog-draft.sqlite-shm'),
    ];

    // Snapshots BEFORE test
    const rootSnapshotsBefore = rootFiles.map(getFileSnapshot);
    const siteSnapshotsBefore = siteFiles.map(getFileSnapshot);

    // 1. Create temporary directory in /tmp
    const tempDir = mkdtempSync(join(tmpdir(), 'sahara-boundary-temp-'));
    const tempDbPath = join(tempDir, 'catalog.sqlite');

    let prevEnv = process.env.NODE_ENV;
    let prevAllow = process.env.ALLOW_TEMP_DATA_DIR;

    try {
      // 2. Copy site DB to temporary directory via consistent snapshot
      createConsistentDatabaseSnapshot(siteFiles[0], tempDbPath);

      // 3. Perform write, analytics and modification operations ONLY on temp DB
      process.env.NODE_ENV = 'test';
      process.env.ALLOW_TEMP_DATA_DIR = '1';

      const tempDb = createCatalogDatabase(tempDbPath);

      const catalog = tempDb.getCatalog();
      expect(catalog).toBeDefined();
      expect(catalog.products.length).toBeGreaterThan(0);

      // Write test analytics events into temp DB
      tempDb.recordEvent?.({ type: 'catalog_view', productId: 'temp-isolated-test-view' });
      tempDb.recordEvent?.({ type: 'product_view', productId: 'temp-isolated-test-prod' });

      // Save a modified test catalog in temp DB
      const modifiedCatalog = {
        ...catalog,
        settings: {
          ...catalog.settings,
          companyName: 'Sahara Temp Isolation Test',
        },
      };
      tempDb.saveCatalog(modifiedCatalog);

      const updated = tempDb.getCatalog();
      expect(updated.settings.companyName).toBe('Sahara Temp Isolation Test');

      // Close temp DB to flush changes to disk
      tempDb.close();

      // Verify temp DB was indeed modified
      const tempHash = getFileSha256(tempDbPath);
      expect(tempHash).not.toBe(siteSnapshotsBefore[0].hash);
    } finally {
      process.env.NODE_ENV = prevEnv;
      process.env.ALLOW_TEMP_DATA_DIR = prevAllow;
      // 4. Clean up temporary directory
      rmSync(tempDir, { recursive: true, force: true });
    }

    // Snapshots AFTER test — Strict verification that REAL databases (and WAL/SHM) were NEVER touched
    const rootSnapshotsAfter = rootFiles.map(getFileSnapshot);
    const siteSnapshotsAfter = siteFiles.map(getFileSnapshot);

    for (let i = 0; i < rootFiles.length; i++) {
      if (rootFiles[i].endsWith('-shm')) continue;
      if (
        rootFiles[i].endsWith('-wal') &&
        rootSnapshotsAfter[i].size === 0 &&
        rootSnapshotsBefore[i].size === 0
      )
        continue;
      expect(rootSnapshotsAfter[i].exists).toBe(rootSnapshotsBefore[i].exists);
      expect(rootSnapshotsAfter[i].size).toBe(rootSnapshotsBefore[i].size);
      expect(rootSnapshotsAfter[i].hash).toBe(rootSnapshotsBefore[i].hash);
      expect(rootSnapshotsAfter[i].mtimeMs).toBe(rootSnapshotsBefore[i].mtimeMs);
    }

    for (let i = 0; i < siteFiles.length; i++) {
      if (siteFiles[i].endsWith('-shm')) continue;
      if (
        siteFiles[i].endsWith('-wal') &&
        siteSnapshotsAfter[i].size === 0 &&
        siteSnapshotsBefore[i].size === 0
      )
        continue;
      expect(siteSnapshotsAfter[i].exists).toBe(siteSnapshotsBefore[i].exists);
      expect(siteSnapshotsAfter[i].size).toBe(siteSnapshotsBefore[i].size);
      expect(siteSnapshotsAfter[i].hash).toBe(siteSnapshotsBefore[i].hash);
      expect(siteSnapshotsAfter[i].mtimeMs).toBe(siteSnapshotsBefore[i].mtimeMs);
    }
  });

  it('verifies site/ contains its own independent configuration and manifests', () => {
    expect(existsSync(join(siteDir, 'package.json'))).toBe(true);
    expect(existsSync(join(siteDir, 'package-lock.json'))).toBe(true);
    expect(existsSync(join(siteDir, 'tsconfig.json'))).toBe(true);
    expect(existsSync(join(siteDir, 'vite.config.ts'))).toBe(true);
    expect(existsSync(join(siteDir, 'server.mjs'))).toBe(true);
    expect(existsSync(join(siteDir, 'index.html'))).toBe(true);
  });

  describe('dataPathSecurity Strict Flag Matrix & Containment Regression', () => {
    // Dynamically import validateAndContainDataPath
    let validateAndContainDataPath: any;
    beforeAll(async () => {
      const mod = await import('../backend/dataPathSecurity.mjs');
      validateAndContainDataPath = mod.validateAndContainDataPath;
    });

    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('1. Rejects temp path when only NODE_ENV=test is set (missing ALLOW_TEMP_DATA_DIR=1)', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.ALLOW_TEMP_DATA_DIR;
      delete process.env.SAHARA_PRODUCTION_RUNTIME_TEST;

      const validTempDir = mkdtempSync(join(tmpdir(), 'sahara-test-matrix-'));
      try {
        expect(() => validateAndContainDataPath(validTempDir)).toThrow(
          /FATAL SECURITY VIOLATION: DATA_DIR must be strictly contained/
        );
      } finally {
        rmSync(validTempDir, { recursive: true, force: true });
      }
    });

    it('2. Rejects temp path when only ALLOW_TEMP_DATA_DIR=1 is set (missing valid test/prod runtime env)', () => {
      delete process.env.NODE_ENV;
      process.env.ALLOW_TEMP_DATA_DIR = '1';
      delete process.env.SAHARA_PRODUCTION_RUNTIME_TEST;

      const validTempDir = mkdtempSync(join(tmpdir(), 'sahara-test-matrix-'));
      try {
        expect(() => validateAndContainDataPath(validTempDir)).toThrow(
          /FATAL SECURITY VIOLATION: DATA_DIR must be strictly contained/
        );
      } finally {
        rmSync(validTempDir, { recursive: true, force: true });
      }
    });

    it('3. Accepts valid sahara- temp path when NODE_ENV=test AND ALLOW_TEMP_DATA_DIR=1', () => {
      process.env.NODE_ENV = 'test';
      process.env.ALLOW_TEMP_DATA_DIR = '1';
      delete process.env.SAHARA_PRODUCTION_RUNTIME_TEST;

      const validTempDir = mkdtempSync(join(tmpdir(), 'sahara-test-matrix-'));
      try {
        const resolved = validateAndContainDataPath(validTempDir);
        expect(resolved).toBe(resolve(validTempDir));
      } finally {
        rmSync(validTempDir, { recursive: true, force: true });
      }
    });

    it('4. Rejects temp path in production with ALLOW_TEMP_DATA_DIR=1 when SAHARA_PRODUCTION_RUNTIME_TEST flag is missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_TEMP_DATA_DIR = '1';
      delete process.env.SAHARA_PRODUCTION_RUNTIME_TEST;

      const validTempDir = mkdtempSync(join(tmpdir(), 'sahara-test-matrix-'));
      try {
        expect(() => validateAndContainDataPath(validTempDir)).toThrow(
          /FATAL SECURITY VIOLATION: DATA_DIR must be strictly contained/
        );
      } finally {
        rmSync(validTempDir, { recursive: true, force: true });
      }
    });

    it('5. Accepts valid sahara- temp path in production with ALLOW_TEMP_DATA_DIR=1 AND SAHARA_PRODUCTION_RUNTIME_TEST=1', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_TEMP_DATA_DIR = '1';
      process.env.SAHARA_PRODUCTION_RUNTIME_TEST = '1';

      const validTempDir = mkdtempSync(join(tmpdir(), 'sahara-prod-runtime-'));
      try {
        const resolved = validateAndContainDataPath(validTempDir);
        expect(resolved).toBe(resolve(validTempDir));
      } finally {
        rmSync(validTempDir, { recursive: true, force: true });
      }
    });

    it('6. Rejects non-sahara temp directory even with all test flags enabled', () => {
      process.env.NODE_ENV = 'test';
      process.env.ALLOW_TEMP_DATA_DIR = '1';

      const invalidTempDir = mkdtempSync(join(tmpdir(), 'unauthorized-other-'));
      try {
        expect(() => validateAndContainDataPath(invalidTempDir)).toThrow(
          /top-level directory must start with 'sahara-'/
        );
      } finally {
        rmSync(invalidTempDir, { recursive: true, force: true });
      }
    });

    it('7. Fatally rejects root data directory and any symlink to root data under ALL conditions', () => {
      process.env.NODE_ENV = 'test';
      process.env.ALLOW_TEMP_DATA_DIR = '1';
      process.env.SAHARA_PRODUCTION_RUNTIME_TEST = '1';

      const rootDataPath = join(repoRoot, 'data');
      expect(() => validateAndContainDataPath(rootDataPath)).toThrow(
        /resolves to root data directory via symlink or directory tree/
      );
    });
  });
});
