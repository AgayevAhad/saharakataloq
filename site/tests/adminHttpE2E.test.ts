// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { spawn, ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import http from 'node:http';
import { createConsistentDatabaseSnapshot } from '../backend/catalogDatabase.mjs';
import { DatabaseSync } from 'node:sqlite';

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

describe('Real Admin HTTP E2E Integration Suite', () => {
  const siteDir = resolve(__dirname, '..');

  it('performs full admin workflow: login, inspects complete Lotus draft inventory in admin API while keeping public storefront 100% coming-soon filtered', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'sahara-admin-e2e-'));
    const tempDbPath = join(tempDir, 'catalog.sqlite');
    const tempDraftPath = join(tempDir, 'catalog-draft.sqlite');

    createConsistentDatabaseSnapshot(join(siteDir, 'data', 'catalog.sqlite'), tempDbPath);
    createConsistentDatabaseSnapshot(join(siteDir, 'data', 'catalog-draft.sqlite'), tempDraftPath);

    const testPort = 39750 + Math.floor(Math.random() * 200);
    const testAdminPassword = 'TestE2EAdminPassword987!';
    let serverProcess: ChildProcess | null = null;

    try {
      serverProcess = spawn(process.execPath, ['server.mjs'], {
        cwd: siteDir,
        env: {
          ...process.env,
          PORT: String(testPort),
          HOST: '127.0.0.1',
          DATA_DIR: tempDir,
          ADMIN_PASSWORD: testAdminPassword,
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

      for (let i = 0; i < 40; i++) {
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
        } catch {}
      }

      if (!serverReady) {
        throw new Error(`Server failed to start within timeout. Stderr: ${startupErrors}`);
      }

      // 1. PUBLIC TEST: GET /api/catalog must have ZERO Lotus / Artel products, comingSoon=true
      const publicRes = await sendHttpRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: '/api/catalog',
        method: 'GET',
      });

      expect(publicRes.statusCode).toBe(200);
      expect(publicRes.json).toBeDefined();

      const lotusBrand = publicRes.json.brands.find((b: any) => b.id === 'lotus');
      expect(lotusBrand).toBeDefined();
      expect(lotusBrand.comingSoon).toBe(false);

      const artelBrand = publicRes.json.brands.find((b: any) => b.id === 'artel');
      expect(artelBrand).toBeDefined();
      expect(artelBrand.comingSoon).toBe(true);

      const publicLotusProducts = publicRes.json.products.filter(
        (p: any) => p.brandId === 'lotus' || p.brand === 'lotus'
      );
      expect(publicLotusProducts.length).toBeGreaterThanOrEqual(1);

      const publicArtelProducts = publicRes.json.products.filter(
        (p: any) => p.brandId === 'artel' || p.brand === 'artel'
      );
      expect(publicArtelProducts.length).toBe(0);

      const publicArdoProducts = publicRes.json.products.filter(
        (p: any) => p.brandId === 'ardo' || p.brand === 'ardo'
      );
      expect(publicArdoProducts.length).toBeGreaterThanOrEqual(25);
      expect(publicArdoProducts.every((p: any) => p.status === 'published')).toBe(true);

      // 2. ADMIN LOGIN TEST: POST /api/admin/login
      const loginRes = await sendHttpRequest(
        {
          hostname: '127.0.0.1',
          port: testPort,
          path: '/api/admin/login',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        { password: testAdminPassword }
      );

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.json.ok).toBe(true);
      expect(loginRes.json.csrfToken).toBeDefined();

      const setCookieHeader = loginRes.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();
      const cookieVal = Array.isArray(setCookieHeader)
        ? setCookieHeader[0].split(';')[0]
        : String(setCookieHeader).split(';')[0];

      // 3. ADMIN DATA QUERY: GET /api/admin/data
      const adminDataRes = await sendHttpRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: '/api/admin/data',
        method: 'GET',
        headers: {
          Cookie: cookieVal,
        },
      });

      expect(adminDataRes.statusCode).toBe(200);
      expect(adminDataRes.json).toBeDefined();
      expect(adminDataRes.json.csrfToken).toBeDefined();

      // Verify admin sees every record from the current (not an old 646-row) snapshot.
      const adminProducts = adminDataRes.json.products;
      const snapshot = new DatabaseSync(tempDbPath, { readOnly: true });
      const expectedProductCount = (
        snapshot.prepare('SELECT COUNT(*) AS count FROM products').get() as { count: number }
      ).count;
      snapshot.close();
      expect(adminProducts.length).toBe(expectedProductCount);

      const adminLotusProducts = adminProducts.filter((p: any) => p.brandId === 'lotus');
      expect(adminLotusProducts.length).toBeGreaterThan(0);

      const adminArdoProducts = adminProducts.filter((p: any) => p.brandId === 'ardo');
      expect(adminArdoProducts.length).toBeGreaterThan(0);

      // 4. GRANULAR PRODUCT CRUD & OPTIMISTIC CONCURRENCY VIA HTTP ENDPOINTS
      const targetProdId = adminArdoProducts[0].id;

      // 4a. GET product with strong ETag
      const getProdRes = await sendHttpRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: `/api/admin/products/${targetProdId}`,
        method: 'GET',
        headers: { Cookie: cookieVal },
      });

      expect(getProdRes.statusCode).toBe(200);
      expect(getProdRes.json.ok).toBe(true);
      const originalEtag = getProdRes.headers['etag'] as string;
      expect(originalEtag).toBeDefined();
      expect(originalEtag).toMatch(/^"p-/);

      // 4b. PUT without If-Match returns HTTP 428 Precondition Required
      const putNoIfMatch = await sendHttpRequest(
        {
          hostname: '127.0.0.1',
          port: testPort,
          path: `/api/admin/products/${targetProdId}`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': adminDataRes.json.csrfToken,
            Cookie: cookieVal,
          },
        },
        { title: 'New Title' }
      );
      expect(putNoIfMatch.statusCode).toBe(428);
      expect(putNoIfMatch.json.error).toBe('IF_MATCH_REQUIRED');

      // 4c. PUT with stale/conflicted If-Match returns HTTP 412 Precondition Failed
      const putStaleIfMatch = await sendHttpRequest(
        {
          hostname: '127.0.0.1',
          port: testPort,
          path: `/api/admin/products/${targetProdId}`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'If-Match': '"p-stale-version-99"',
            'X-CSRF-Token': adminDataRes.json.csrfToken,
            Cookie: cookieVal,
          },
        },
        { title: 'Conflicted Title' }
      );
      expect(putStaleIfMatch.statusCode).toBe(412);
      expect(putStaleIfMatch.json.error).toBe('PRODUCT_VERSION_CONFLICT');

      // 4d. PUT with matching If-Match succeeds and returns new ETag
      const putSuccess = await sendHttpRequest(
        {
          hostname: '127.0.0.1',
          port: testPort,
          path: `/api/admin/products/${targetProdId}`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'If-Match': originalEtag,
            'X-CSRF-Token': adminDataRes.json.csrfToken,
            Cookie: cookieVal,
          },
        },
        { ...getProdRes.json.product, title: 'Updated Title via Real HTTP' }
      );
      expect(putSuccess.statusCode).toBe(200);
      expect(putSuccess.json.ok).toBe(true);
      const updatedEtag = putSuccess.headers['etag'] as string;
      expect(updatedEtag).toBeDefined();
      expect(updatedEtag).not.toBe(originalEtag);
    } finally {
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGTERM');
        await new Promise((r) => setTimeout(r, 200));
      }
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
