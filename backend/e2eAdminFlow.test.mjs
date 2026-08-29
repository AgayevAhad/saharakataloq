import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createCatalogDatabase } from './catalogDatabase.mjs';

test('End-to-End: Admin məlumatları dəyişir, public edir və /api/catalog dərhal yenilənir', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'sahara-e2e-'));
  const pubDb = createCatalogDatabase(join(dir, 'pub.sqlite'));
  const draftDb = createCatalogDatabase(join(dir, 'draft.sqlite'));

  // Initialize catalogs
  const initial = {
    brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'İtaliya', manufacturingCountries: ['Türkiyə', 'Çin'], active: true }],
    categories: [{ id: 'hood', name: 'Aspiratorlar', slug: 'hood', active: true, sortOrder: 0 }],
    products: [{
      id: 'p-1', code: 'A-1', title: 'Aspirator 1', brandId: 'ardo', category: 'hood', categoryName: 'Aspiratorlar',
      image: '/media/1.png', media: [], shortDesc: 'İzah', highlights: [], specs: [], manufacturingCountry: 'Türkiyə', status: 'published',
    }],
    settings: {
      companyName: 'Sahara Electronics',
      email: 'info@saharaelectronics.az',
      phoneNumbers: ['994121234567'],
      phoneNumber: '994121234567',
      address: 'Köhnə Ünvan',
    },
  };
  pubDb.saveCatalog(initial);
  draftDb.saveCatalog(initial);

  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const path = url.pathname;

    if (path === '/api/catalog' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(pubDb.getCatalog()));
    }
    if (path === '/api/admin/data' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ...draftDb.getCatalog(), csrfToken: 'token-123' }));
    }
    if (path === '/api/admin/catalog' && req.method === 'PUT') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      draftDb.saveCatalog(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true }));
    }
    if (path === '/api/admin/publish' && req.method === 'POST') {
      const currentDraft = draftDb.getCatalog();
      pubDb.saveCatalog(currentDraft);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true }));
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const host = `http://127.0.0.1:${port}`;

  try {
    // 1. Admin məlumatları oxuyur
    const adminDataRes = await fetch(`${host}/api/admin/data`);
    assert.equal(adminDataRes.status, 200);
    const adminData = await adminDataRes.json();

    // 2. Admin redaktə edir:
    adminData.settings.email = 'yeni.elaqe@saharaelectronics.az';
    adminData.settings.phoneNumbers = ['+994 12 555 44 33', '+994 50 999 88 77'];
    adminData.settings.address = 'Bakı şəhəri, Sədərək T.M. Yeni Korpus 5';
    adminData.settings.instagramUsername = '@sahara.yeni.profil';
    adminData.settings.instagramUrl = 'https://instagram.com/sahara.yeni.profil';
    adminData.articles = [
      {
        id: 'art-sabaf-test',
        title: 'İtalyan SABAF Qaz Forsunkaları',
        subtitle: 'Təhlükəsiz və qənaətcil yanma sistemi.',
        badge: '🔥 SABAF',
        icon: 'Flame',
        active: true,
        advantages: [{ title: 'Qaz Nəzarəti', desc: 'Alov sönəndə dərhal qapanır.' }],
      },
    ];

    // 3. Qaralamanı saxla
    const saveRes = await fetch(`${host}/api/admin/catalog`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminData),
    });
    assert.equal(saveRes.status, 200);

    // 4. Public et
    const publishRes = await fetch(`${host}/api/admin/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert.equal(publishRes.status, 200);

    // 5. Public endpointi (/api/catalog) anonim istifadəçi kimi yoxlayırıq
    const publicRes = await fetch(`${host}/api/catalog`);
    assert.equal(publicRes.status, 200);
    const publicCatalog = await publicRes.json();

    // 6. Yoxlayırıq ki, public bazada bütün sahələr dərhal dəyişib
    assert.equal(publicCatalog.settings.email, 'yeni.elaqe@saharaelectronics.az');
    assert.deepEqual(publicCatalog.settings.phoneNumbers, ['+994 12 555 44 33', '+994 50 999 88 77']);
    assert.equal(publicCatalog.settings.address, 'Bakı şəhəri, Sədərək T.M. Yeni Korpus 5');
    assert.equal(publicCatalog.settings.instagramUsername, '@sahara.yeni.profil');
    assert.equal(publicCatalog.settings.instagramUrl, 'https://instagram.com/sahara.yeni.profil');
    assert.equal(publicCatalog.articles.length, 1);
    assert.equal(publicCatalog.articles[0].title, 'İtalyan SABAF Qaz Forsunkaları');
  } finally {
    server.close();
    pubDb.close();
    draftDb.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
