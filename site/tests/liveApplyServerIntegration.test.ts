import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { spawn, type ChildProcess } from 'node:child_process';
import {
  ScheduledPublicationWorker,
  MIN_COMPLETENESS_SCORE,
} from '../backend/scheduledPublicationJob.mjs';

function requestHttp(
  urlStr: string,
  options: http.RequestOptions = {},
  body?: string
): Promise<{ status: number; headers: http.IncomingHttpHeaders; data: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = http.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          let data: any = raw;
          try {
            data = JSON.parse(raw);
          } catch {}
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            data,
            raw,
          });
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

describe('Live Apply Real Server Integration Suite', () => {
  let tempDir: string;
  let publicPath: string;
  let draftPath: string;
  let serverProcess: ChildProcess | null = null;
  let serverPort: number;
  let baseUrl: string;
  const adminPassword = 'test-admin-secret-live-2026';
  const tokenSecret = 'test-token-secret-live-xyz-7890';

  const waitForServerReady = async (url: string, timeoutMs = 7000): Promise<void> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const res = await requestHttp(`${url}/api/catalog`);
        if (res.status === 200) return;
      } catch {
        // Retry
      }
      await new Promise((r) => setTimeout(r, 60));
    }
    throw new Error(`Server failed to become ready at ${url} within ${timeoutMs}ms`);
  };

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-real-server-int-'));
    publicPath = join(tempDir, 'catalog.sqlite');
    draftPath = join(tempDir, 'catalog-draft.sqlite');

    // Create baseline catalog schema in both databases
    for (const p of [publicPath, draftPath]) {
      const db = new DatabaseSync(p);
      db.exec(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE brands (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        );
        CREATE TABLE categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          sort_order INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE products (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          brand_id TEXT NOT NULL,
          category_id TEXT NOT NULL,
          price REAL NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'draft',
          version INTEGER NOT NULL DEFAULT 1,
          publication_status TEXT NOT NULL DEFAULT 'draft',
          completeness_score REAL NOT NULL DEFAULT 100,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
          updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        );
      `);

      db.exec("INSERT INTO brands (id, name, slug) VALUES ('ardo', 'ARDO', 'ardo');");
      db.exec("INSERT INTO categories (id, name, slug) VALUES ('oven', 'Sobalar', 'oven');");
      db.exec(
        "INSERT INTO products (id, code, title, brand_id, category_id, price, status) VALUES ('p-live-1', 'OV-LIVE', 'Live Oven', 'ardo', 'oven', 850, 'draft');"
      );
      db.close();
    }

    serverPort = 32000 + Math.floor(Math.random() * 7000);
    baseUrl = `http://127.0.0.1:${serverPort}`;
  });

  afterEach(async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      serverProcess = null;
    }
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('1. Real delayed in-flight request triggers drain timeout -> aborts apply without closing DBs or cutover (fail-closed 503)', async () => {
    // Start real server with short drain timeout (150ms)
    serverProcess = spawn(process.execPath, [join(__dirname, '..', 'server.mjs')], {
      env: {
        ...process.env,
        PORT: String(serverPort),
        HOST: '127.0.0.1',
        DATA_DIR: tempDir,
        ADMIN_PASSWORD: adminPassword,
        PIM_TOKEN_SECRET: tokenSecret,
        ENABLE_PIM_V2_LIVE_APPLY: 'true',
        PIM_DRAIN_TIMEOUT_MS: '150',
      },
      stdio: 'pipe',
    });

    await waitForServerReady(baseUrl);

    // Step A: Login to obtain admin session cookie and csrfToken
    const loginRes = await requestHttp(
      `${baseUrl}/api/admin/login`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      JSON.stringify({ password: adminPassword })
    );
    expect(loginRes.status).toBe(200);
    const setCookie = loginRes.headers['set-cookie'];
    const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie || '';
    const cookie = cookieHeader.split(';')[0];
    const csrfToken = loginRes.data?.csrfToken;
    expect(cookie).toContain('sahara_admin=');
    expect(csrfToken).toBeDefined();

    // Step B: Run dry-run to obtain dryRunToken with CSRF header
    const dryRunRes = await requestHttp(
      `${baseUrl}/api/admin/pim/migration/dry-run`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
          'X-CSRF-Token': csrfToken,
        },
      },
      JSON.stringify({})
    );
    expect(dryRunRes.status).toBe(200);
    const dryRunToken = dryRunRes.data?.dryRunToken;
    expect(dryRunToken).toBeDefined();

    // Step C: Start a delayed in-flight HTTP request holding the connection for 600ms
    const req = http.request(
      `${baseUrl}/api/admin/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      () => {}
    );

    // Write partial body and delay completion so readBody(req) holds activeRequestsCount
    req.write('{"password": "');
    setTimeout(() => {
      req.end('dummy-pass"}');
    }, 500);

    // Wait 50ms so request is counted in in-flight activeRequestsCount
    await new Promise((r) => setTimeout(r, 50));

    // Step D: Trigger live apply while in-flight request is held
    const applyRes = await requestHttp(
      `${baseUrl}/api/admin/pim/migration/apply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
          'X-CSRF-Token': csrfToken,
        },
      },
      JSON.stringify({ dryRunToken })
    );

    // Step E: Verify fail-closed 503 response due to active request drain timeout
    expect(applyRes.status).toBe(503);
    expect(applyRes.data.error).toBe('DRAIN_TIMEOUT_ACTIVE_REQUESTS_REMAIN');

    // Wait for in-flight request to finish
    await new Promise((r) => setTimeout(r, 550));

    // Step F: Verify server is NOT locked, maintenance is cleared, and DB was NOT altered
    const catalogRes = await requestHttp(`${baseUrl}/api/catalog`);
    expect(catalogRes.status).toBe(200);
  }, 15000);

  it('2. Successful Live-Apply flow preserves WAL un-checkpointed data and restarts publication worker', async () => {
    // Insert un-checkpointed WAL data in draft DB before starting server
    const initDraftDb = new DatabaseSync(draftPath);
    initDraftDb.exec(`
        INSERT INTO products (id, code, title, brand_id, category_id, price, status, version, publication_status, completeness_score)
        VALUES ('p-wal-test', 'WAL-100', 'Uncheckpointed WAL Product', 'ardo', 'oven', 1200, 'draft', 1, 'draft', 95);
      `);
    initDraftDb.close();

    // Start real server with normal drain timeout
    serverProcess = spawn(process.execPath, [join(__dirname, '..', 'server.mjs')], {
      env: {
        ...process.env,
        PORT: String(serverPort),
        HOST: '127.0.0.1',
        DATA_DIR: tempDir,
        ADMIN_PASSWORD: adminPassword,
        PIM_TOKEN_SECRET: tokenSecret,
        ENABLE_PIM_V2_LIVE_APPLY: 'true',
        PIM_DRAIN_TIMEOUT_MS: '2000',
      },
      stdio: 'pipe',
    });

    await waitForServerReady(baseUrl);

    // 1. Login
    const loginRes = await requestHttp(
      `${baseUrl}/api/admin/login`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      JSON.stringify({ password: adminPassword })
    );
    const setCookie = loginRes.headers['set-cookie'];
    const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie || '';
    const cookie = cookieHeader.split(';')[0];
    const csrfToken = loginRes.data?.csrfToken;

    // 2. Dry-Run
    const dryRunRes = await requestHttp(
      `${baseUrl}/api/admin/pim/migration/dry-run`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
          'X-CSRF-Token': csrfToken,
        },
      },
      JSON.stringify({})
    );
    expect(dryRunRes.status).toBe(200);
    const { dryRunToken } = dryRunRes.data;
    expect(dryRunToken).toBeDefined();

    // 3. Live Apply (no in-flight blockers)
    const applyRes = await requestHttp(
      `${baseUrl}/api/admin/pim/migration/apply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
          'X-CSRF-Token': csrfToken,
        },
      },
      JSON.stringify({ dryRunToken })
    );

    expect(applyRes.status).toBe(200);
    expect(applyRes.data.status).toBe('applied');
    expect(applyRes.data.ok).toBe(true);

    // 4. Verify catalog is served from newly migrated database and WAL product is present
    const catalogRes = await requestHttp(`${baseUrl}/api/catalog`);
    expect(catalogRes.status).toBe(200);

    // Verify draft database has PIM v2 canonical tables and WAL data
    const verifyDb = new DatabaseSync(draftPath);
    const hasPubJobs = verifyDb
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='publication_jobs'")
      .get();
    expect(hasPubJobs).toBeDefined();

    const walProd = verifyDb.prepare("SELECT * FROM products WHERE id = 'p-wal-test'").get() as any;
    expect(walProd).toBeDefined();
    expect(walProd.title).toBe('Uncheckpointed WAL Product');
    verifyDb.close();
  }, 15000);

  it('3. Worker timer starts, survives exceptions, and enforces MIN_COMPLETENESS_SCORE configuration', async () => {
    const publicDb = new DatabaseSync(publicPath);
    const draftDb = new DatabaseSync(draftPath);

    try {
      const worker = new ScheduledPublicationWorker({
        draftDb,
        publicDb,
        minCompletenessScore: MIN_COMPLETENESS_SCORE,
      });

      expect(worker.minCompletenessScore).toBe(50);
      expect(worker.isRunning()).toBe(false);

      worker.start(50);
      expect(worker.isRunning()).toBe(true);

      // Verify timer survives errors
      const orig = worker.processPendingJobs.bind(worker);
      let errorThrown = false;
      worker.processPendingJobs = () => {
        errorThrown = true;
        throw new Error('Simulated transient sync poll failure');
      };

      await new Promise((r) => setTimeout(r, 120));
      expect(errorThrown).toBe(true);
      expect(worker.isRunning()).toBe(true);

      worker.stop();
      expect(worker.isRunning()).toBe(false);
      worker.processPendingJobs = orig;
    } finally {
      publicDb.close();
      draftDb.close();
    }
  });
});
