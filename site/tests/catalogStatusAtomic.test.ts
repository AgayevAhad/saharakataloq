// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { Readable } from 'node:stream';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';
import { createProductsRouter } from '../api/products.mjs';
import { applyPhase3Migration } from '../backend/phase3Migration.mjs';

describe('Catalog & Site Status Atomic Toggle & Zero-Data-Loss Suite', () => {
  let tempDir: string;
  let pubDbPath: string;
  let draftDbPath: string;
  let pubDb: any;
  let draftDb: any;

  beforeEach(() => {
    process.env.ALLOW_TEMP_DATA_DIR = '1';
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-status-atomic-'));
    pubDbPath = join(tempDir, 'pub.sqlite');
    draftDbPath = join(tempDir, 'draft.sqlite');

    pubDb = createCatalogDatabase(pubDbPath);
    draftDb = createCatalogDatabase(draftDbPath);

    applyPhase3Migration(pubDb.db);
    applyPhase3Migration(draftDb.db);

    // Seed dummy product
    const sampleCatalog = {
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', active: true }],
      categories: [{ id: 'cat-1', name: 'Paltaryuyan', slug: 'paltaryuyan', active: true }],
      products: [
        {
          id: 'prod-1',
          code: 'ARDO-001',
          title: 'ARDO Paltaryuyan',
          brandId: 'ardo',
          category: 'cat-1',
          status: 'active',
          price: 1200,
        },
        {
          id: 'prod-2',
          code: 'ARDO-002',
          title: 'ARDO Soyuducu',
          brandId: 'ardo',
          category: 'cat-1',
          status: 'active',
          price: 1800,
        },
      ],
      settings: {
        companyName: 'Sahara Electronics',
        siteActive: true,
        catalogActive: true,
      },
    };

    draftDb.saveCatalog(sampleCatalog);
    pubDb.saveCatalog(sampleCatalog);
  });

  afterEach(() => {
    try {
      pubDb.close();
      draftDb.close();
      rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it('atomically toggles catalog status without mutating siteActive or deleting products', () => {
    expect(draftDb.getCatalog({ includeAll: true }).products.length).toBe(2);
    expect(pubDb.getCatalog({ includeAll: true }).products.length).toBe(2);

    // Toggle catalog status to false
    draftDb.updateCatalogStatus(false, 'Kataloqda profilaktik təmir aparılır');
    pubDb.updateCatalogStatus(false, 'Kataloqda profilaktik təmir aparılır');

    const draftCat = draftDb.getCatalog({ includeAll: true });
    const pubCat = pubDb.getCatalog({ includeAll: true });

    // Verify catalog status is false
    expect(draftCat.settings.catalogActive).toBe(false);
    expect(draftCat.settings.maintenanceMessage).toBe('Kataloqda profilaktik təmir aparılır');
    expect(pubCat.settings.catalogActive).toBe(false);

    // Verify siteActive remains true
    expect(draftCat.settings.siteActive).toBe(true);
    expect(pubCat.settings.siteActive).toBe(true);

    // Verify products are 100% intact (ZERO data loss)
    expect(draftCat.products.length).toBe(2);
    expect(pubCat.products.length).toBe(2);
    expect(draftCat.products[0].code).toBe('ARDO-001');
    expect(draftCat.products[1].code).toBe('ARDO-002');
  });

  it('atomically toggles site status without mutating catalogActive or deleting products', () => {
    draftDb.updateSiteStatus(false, 'Saytda təmir gedir');
    pubDb.updateSiteStatus(false, 'Saytda təmir gedir');

    const draftCat = draftDb.getCatalog({ includeAll: true });
    const pubCat = pubDb.getCatalog({ includeAll: true });

    expect(draftCat.settings.siteActive).toBe(false);
    expect(draftCat.settings.siteMaintenanceMessage).toBe('Saytda təmir gedir');
    expect(pubCat.settings.siteActive).toBe(false);

    // Catalog status remains true
    expect(draftCat.settings.catalogActive).toBe(true);
    expect(pubCat.settings.catalogActive).toBe(true);

    // Products remain intact
    expect(draftCat.products.length).toBe(2);
    expect(pubCat.products.length).toBe(2);
  });

  it('handles /api/admin/catalog/toggle-status endpoint smoothly without throwing 500 error', async () => {
    const sessions = new Map();
    const mockToken = 'mock-admin-token';
    sessions.set(mockToken, {
      user: 'admin',
      role: 'admin',
      ip: '127.0.0.1',
      csrfToken: 'valid-csrf',
      expiresAt: Date.now() + 100000,
    });

    const handler = createProductsRouter({
      getCatalogDatabase: () => pubDb,
      getDraftDatabase: () => draftDb,
      setCatalogDatabase: () => {},
      setDraftDatabase: () => {},
      getPubWorker: () => null,
      setPubWorker: () => {},
      sessions,
      DATA_DIR: tempDir,
      DATABASE_FILE: pubDbPath,
      DRAFT_DATABASE_FILE: draftDbPath,
      STAGING_DIR: tempDir,
      clearIsrCache: () => {},
      waitForActiveRequestsDrain: async () => {},
    });

    // Simulate POST /api/admin/catalog/toggle-status
    const req = Object.assign(
      Readable.from([
        Buffer.from(
          JSON.stringify({
            active: false,
            message: 'Profilaktika aktivdir',
            scope: 'catalog',
          })
        ),
      ]),
      {
        method: 'POST',
        socket: { remoteAddress: '127.0.0.1' },
        headers: {
          cookie: `sahara_admin=${mockToken}`,
          'x-csrf-token': 'valid-csrf',
        },
      }
    );

    let statusCode = 0;
    let responseData = '';
    const res = {
      writeHead: (code: number, headers?: any) => {
        statusCode = code;
      },
      end: (data?: string) => {
        if (data) responseData = data;
      },
    };

    const handled = await handler(req, res, '/api/admin/catalog/toggle-status');
    expect(handled).toBe(true);
    expect(statusCode).toBe(200);

    const parsed = JSON.parse(responseData);
    expect(parsed.ok).toBe(true);
    expect(parsed.active).toBe(false);
    expect(parsed.message).toBe('Profilaktika aktivdir');
    expect(parsed.scope).toBe('catalog');

    // Verify draft and pub DB
    expect(draftDb.getCatalog({ includeAll: true }).settings.catalogActive).toBe(false);
    expect(draftDb.getCatalog({ includeAll: true }).products.length).toBe(2);
    expect(pubDb.getCatalog({ includeAll: true }).settings.catalogActive).toBe(false);
    expect(pubDb.getCatalog({ includeAll: true }).products.length).toBe(2);
  });

  it('handles /api/admin/publish endpoint smoothly without throwing 500 ReferenceError', async () => {
    const sessions = new Map();
    const mockToken = 'mock-admin-token-publish';
    sessions.set(mockToken, {
      user: 'admin',
      role: 'admin',
      ip: '127.0.0.1',
      csrfToken: 'valid-csrf-publish',
      expiresAt: Date.now() + 100000,
    });

    const handler = createProductsRouter({
      getCatalogDatabase: () => pubDb,
      getDraftDatabase: () => draftDb,
      setCatalogDatabase: () => {},
      setDraftDatabase: () => {},
      getPubWorker: () => null,
      setPubWorker: () => {},
      sessions,
      DATA_DIR: tempDir,
      DATABASE_FILE: pubDbPath,
      DRAFT_DATABASE_FILE: draftDbPath,
      STAGING_DIR: tempDir,
      clearIsrCache: () => {},
      waitForActiveRequestsDrain: async () => {},
    });

    // Simulate POST /api/admin/publish
    const req = Object.assign(Readable.from([]), {
      method: 'POST',
      socket: { remoteAddress: '127.0.0.1' },
      headers: {
        cookie: `sahara_admin=${mockToken}`,
        'x-csrf-token': 'valid-csrf-publish',
      },
    });

    let statusCode = 0;
    let responseData = '';
    const res = {
      writeHead: (code: number, headers?: any) => {
        statusCode = code;
      },
      end: (data?: string) => {
        if (data) responseData = data;
      },
    };

    const handled = await handler(req, res, '/api/admin/publish');
    expect(handled).toBe(true);
    expect(statusCode).toBe(200);

    const parsed = JSON.parse(responseData);
    expect(parsed.ok).toBe(true);
    expect(pubDb.getCatalog({ includeAll: true }).products.length).toBe(2);
  });
});
