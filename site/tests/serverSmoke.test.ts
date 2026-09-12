// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { spawn, ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, statSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { getFileSha256 } from '../scripts/check-boundary.mjs';
import { createConsistentDatabaseSnapshot } from '../backend/catalogDatabase.mjs';

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

function sendHttpRequest(
  options: http.RequestOptions,
  body?: any
): Promise<{ statusCode?: number; headers: http.IncomingHttpHeaders; data: string; json: any }> {
  return new Promise((resolvePromise, reject) => {
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(raw);
        } catch {}
        resolvePromise({
          statusCode: res.statusCode,
          headers: res.headers,
          data: raw,
          json,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      req.write(payload);
    }
    req.end();
  });
}

describe('Real Server HTTP Smoke & Fail-Fast Containment Integration Suite', () => {
  const siteDir = resolve(__dirname, '..');
  const repoRoot = resolve(siteDir, '..');

  const rootDbFiles = [
    join(repoRoot, 'data', 'catalog.sqlite'),
    join(repoRoot, 'data', 'catalog.sqlite-wal'),
    join(repoRoot, 'data', 'catalog.sqlite-shm'),
    join(repoRoot, 'data', 'catalog-draft.sqlite'),
    join(repoRoot, 'data', 'catalog-draft.sqlite-wal'),
    join(repoRoot, 'data', 'catalog-draft.sqlite-shm'),
  ];

  const siteDbFiles = [
    join(siteDir, 'data', 'catalog.sqlite'),
    join(siteDir, 'data', 'catalog.sqlite-wal'),
    join(siteDir, 'data', 'catalog.sqlite-shm'),
    join(siteDir, 'data', 'catalog-draft.sqlite'),
    join(siteDir, 'data', 'catalog-draft.sqlite-wal'),
    join(siteDir, 'data', 'catalog-draft.sqlite-shm'),
  ];

  it('spawns real server process with temp data dir, serves /api/catalog and records /api/events with 0 root/site DB mutations', async () => {
    // 1. Take snapshots before test
    const rootSnapshotsBefore = rootDbFiles.map(getFileSnapshot);
    const siteSnapshotsBefore = siteDbFiles.map(getFileSnapshot);

    // 2. Prepare temporary test data directory in /tmp
    const tempDir = mkdtempSync(join(tmpdir(), 'sahara-server-smoke-'));
    const tempDbPath = join(tempDir, 'catalog.sqlite');
    const tempDraftPath = join(tempDir, 'catalog-draft.sqlite');
    createConsistentDatabaseSnapshot(join(siteDir, 'data', 'catalog.sqlite'), tempDbPath);
    createConsistentDatabaseSnapshot(join(siteDir, 'data', 'catalog-draft.sqlite'), tempDraftPath);

    const testPort = 39185 + Math.floor(Math.random() * 500);
    let serverProcess: ChildProcess | null = null;

    try {
      // 3. Spawn real server process
      serverProcess = spawn(process.execPath, ['server.mjs'], {
        cwd: siteDir,
        env: {
          ...process.env,
          PORT: String(testPort),
          HOST: '127.0.0.1',
          DATA_DIR: tempDir,
          ALLOW_TEMP_DATA_DIR: '1',
          NODE_ENV: 'test',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let serverReady = false;
      let startupErrors = '';

      serverProcess.stderr?.on('data', (d) => {
        startupErrors += d.toString();
      });

      // Poll until server responds on test port
      const maxRetries = 40;
      for (let i = 0; i < maxRetries; i++) {
        await new Promise((r) => setTimeout(r, 100));
        try {
          const res = await sendHttpRequest({
            hostname: '127.0.0.1',
            port: testPort,
            path: '/api/catalog',
            method: 'GET',
            timeout: 500,
          });
          if (res.statusCode === 200) {
            serverReady = true;
            break;
          }
        } catch {
          // keep polling
        }
      }

      if (!serverReady) {
        throw new Error(`Server failed to start within timeout. Stderr: ${startupErrors}`);
      }

      // 4. Test GET /api/catalog
      const catalogRes = await sendHttpRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: '/api/catalog',
        method: 'GET',
      });
      expect(catalogRes.statusCode).toBe(200);
      expect(catalogRes.json).toBeDefined();
      expect(catalogRes.json.products).toBeInstanceOf(Array);
      expect(catalogRes.json.products.length).toBeGreaterThan(0);
      expect(catalogRes.json.brands).toBeInstanceOf(Array);

      // 5. Test POST /api/events (real HTTP write into temp DB)
      const tempHashBefore = getFileSha256(tempDbPath);

      const eventRes = await sendHttpRequest(
        {
          hostname: '127.0.0.1',
          port: testPort,
          path: '/api/events',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        { type: 'catalog_view', productId: 'smoke-test-view' }
      );
      expect([200, 202]).toContain(eventRes.statusCode);
      expect(eventRes.json.ok).toBe(true);

      // Verify temp DB or WAL has changed
      const tempWalPath = `${tempDbPath}-wal`;
      const tempWalExists = existsSync(tempWalPath);
      const tempHashAfter = getFileSha256(tempDbPath);

      const writeOccurred = tempHashAfter !== tempHashBefore || tempWalExists;
      expect(writeOccurred).toBe(true);

      // Verify in SQLite that the smoke-test-view event exists in the temp DB
      const tempDb = new DatabaseSync(tempDbPath, { readOnly: true });
      const tempEventRows = tempDb
        .prepare(
          "SELECT id, event_type, product_id FROM analytics_events WHERE product_id = 'smoke-test-view'"
        )
        .all();
      tempDb.close();
      expect(tempEventRows.length).toBe(1);

      // Verify that smoke-test-view does NOT exist in real site DB (consistent snapshot check)
      const siteCheckDir = mkdtempSync(join(tmpdir(), 'sahara-site-check-'));
      const siteCopy = join(siteCheckDir, 'cat.sqlite');
      createConsistentDatabaseSnapshot(join(siteDir, 'data', 'catalog.sqlite'), siteCopy);
      const siteDb = new DatabaseSync(siteCopy, { readOnly: true });
      const siteEventRows = siteDb
        .prepare("SELECT id FROM analytics_events WHERE product_id = 'smoke-test-view'")
        .all();
      siteDb.close();
      rmSync(siteCheckDir, { recursive: true, force: true });
      expect(siteEventRows.length).toBe(0);

      // Verify that smoke-test-view does NOT exist in root DB (consistent snapshot check)
      const rootDbPath = join(repoRoot, 'data', 'catalog.sqlite');
      if (existsSync(rootDbPath)) {
        const rootCheckDir = mkdtempSync(join(tmpdir(), 'sahara-root-check-'));
        const rootCopy = join(rootCheckDir, 'cat.sqlite');
        createConsistentDatabaseSnapshot(rootDbPath, rootCopy);
        const rootDb = new DatabaseSync(rootCopy, { readOnly: true });
        const hasAnalyticsTable = rootDb
          .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='analytics_events'")
          .get();
        if (hasAnalyticsTable) {
          const rootEventRows = rootDb
            .prepare("SELECT id FROM analytics_events WHERE product_id = 'smoke-test-view'")
            .all();
          expect(rootEventRows.length).toBe(0);
        }
        rootDb.close();
        rmSync(rootCheckDir, { recursive: true, force: true });
      }
    } finally {
      // 6. Gracefully terminate server process
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGTERM');
        await new Promise((r) => setTimeout(r, 250));
      }
      // Clean up temp directory
      rmSync(tempDir, { recursive: true, force: true });
    }

    // 7. Snapshots AFTER test — Verify ROOT and SITE DBs were NEVER touched in size, mtime, hash, or existence
    const rootSnapshotsAfter = rootDbFiles.map(getFileSnapshot);
    const siteSnapshotsAfter = siteDbFiles.map(getFileSnapshot);

    for (let i = 0; i < rootDbFiles.length; i++) {
      // SHM and 0-byte WAL files can be created/touched by read-only DatabaseSync connections
      if (rootDbFiles[i].endsWith('-shm')) continue;
      if (
        rootDbFiles[i].endsWith('-wal') &&
        rootSnapshotsAfter[i].size === 0 &&
        rootSnapshotsBefore[i].size === 0
      )
        continue;
      expect(rootSnapshotsAfter[i].exists).toBe(rootSnapshotsBefore[i].exists);
      expect(rootSnapshotsAfter[i].size).toBe(rootSnapshotsBefore[i].size);
      expect(rootSnapshotsAfter[i].hash).toBe(rootSnapshotsBefore[i].hash);
      expect(rootSnapshotsAfter[i].mtimeMs).toBe(rootSnapshotsBefore[i].mtimeMs);
    }

    for (let i = 0; i < siteDbFiles.length; i++) {
      if (siteDbFiles[i].endsWith('-shm')) continue;
      if (
        siteDbFiles[i].endsWith('-wal') &&
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

  describe('Fail-Fast Negative Path, Symlink & Containment Tests', () => {
    it('NEGATIVE TEST: rejects DATA_DIR targeting root data directory', async () => {
      const proc = spawn(process.execPath, ['server.mjs'], {
        cwd: siteDir,
        env: {
          ...process.env,
          DATA_DIR: resolve(repoRoot, 'data'),
          ALLOW_TEMP_DATA_DIR: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stderr = '';
      proc.stderr?.on('data', (d) => {
        stderr += d.toString();
      });

      const exitCode = await new Promise((res) => proc.on('exit', res));
      expect(exitCode).not.toBe(0);
      expect(stderr).toMatch(/FATAL SECURITY VIOLATION/);
    });

    it('NEGATIVE TEST: rejects DATA_DIR outside site/data without explicit test override', async () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'sahara-unauthorized-'));
      try {
        const proc = spawn(process.execPath, ['server.mjs'], {
          cwd: siteDir,
          env: {
            ...process.env,
            DATA_DIR: tempDir,
            ALLOW_TEMP_DATA_DIR: '0',
            NODE_ENV: 'production',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        let stderr = '';
        proc.stderr?.on('data', (d) => {
          stderr += d.toString();
        });

        const _exitCode = await new Promise((res) => proc.on('exit', res));
        expect(stderr).toMatch(
          /FATAL SECURITY VIOLATION: DATA_DIR must be strictly contained within/
        );
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('NEGATIVE TEST: rejects DATA_DIR with symlink pointing to root data directory', async () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'sahara-symlink-test-'));
      const symlinkTarget = join(tempDir, 'symlink-to-root');
      const rootData = resolve(repoRoot, 'data');
      let dummyTarget: string | null = null;
      try {
        if (existsSync(rootData)) {
          symlinkSync(rootData, symlinkTarget, 'dir');
        } else {
          dummyTarget = mkdtempSync(join(tmpdir(), 'forbidden-root-data-mock-'));
          symlinkSync(dummyTarget, symlinkTarget, 'dir');
        }

        const proc = spawn(process.execPath, ['server.mjs'], {
          cwd: siteDir,
          env: {
            ...process.env,
            DATA_DIR: symlinkTarget,
            ALLOW_TEMP_DATA_DIR: '1',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        let stderr = '';
        proc.stderr?.on('data', (d) => {
          stderr += d.toString();
        });

        const exitCode = await new Promise((res) => proc.on('exit', res));
        expect(exitCode).not.toBe(0);
        expect(stderr).toMatch(/FATAL SECURITY VIOLATION/);
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
        if (dummyTarget) rmSync(dummyTarget, { recursive: true, force: true });
      }
    });

    it('NEGATIVE TEST: rejects DATA_DIR with symlink-parent and non-existent subdirectory', async () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'sahara-symlink-nonexist-'));
      const symlinkParent = join(tempDir, 'symlink-to-root');
      const nonExistentTarget = join(symlinkParent, 'new-nonexistent-directory');
      const rootData = resolve(repoRoot, 'data');
      let dummyTarget: string | null = null;
      try {
        if (existsSync(rootData)) {
          symlinkSync(rootData, symlinkParent, 'dir');
        } else {
          dummyTarget = mkdtempSync(join(tmpdir(), 'forbidden-root-data-mock-'));
          symlinkSync(dummyTarget, symlinkParent, 'dir');
        }

        const proc = spawn(process.execPath, ['server.mjs'], {
          cwd: siteDir,
          env: {
            ...process.env,
            DATA_DIR: nonExistentTarget,
            ALLOW_TEMP_DATA_DIR: '1',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        let stderr = '';
        proc.stderr?.on('data', (d) => {
          stderr += d.toString();
        });

        const exitCode = await new Promise((res) => proc.on('exit', res));
        expect(exitCode).not.toBe(0);
        expect(stderr).toMatch(/FATAL SECURITY VIOLATION/);
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
        if (dummyTarget) rmSync(dummyTarget, { recursive: true, force: true });
      }
    });
  });
});
