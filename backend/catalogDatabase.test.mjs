import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createCatalogDatabase } from './catalogDatabase.mjs';

const sampleCatalog = () => ({
  brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'İtaliya', manufacturingCountries: ['Türkiyə', 'Çin'], active: true }],
  categories: [{ id: 'oven', name: 'Sobalar', slug: 'oven', active: true, sortOrder: 0 }],
  products: [{
    id: 'ardo-oven-1', code: 'OVEN-1', title: 'Test sobası', brandId: 'ardo', category: 'oven', categoryName: 'Sobalar',
    image: '/media/oven.png', media: [{ id: 'media-1', type: 'image', url: '/media/oven.png', alt: 'Soba' }],
    shortDesc: 'Təsdiqlənmiş test məhsulu', highlights: ['Səssiz'],
    specs: [{ id: 'volume', name: 'Həcm', value: '60 L', group: 'Əsas' }],
    manufacturingCountry: 'Türkiyə', status: 'published',
  }],
  settings: {
    whatsappNumber: '994501234567',
    phoneNumber: '994121234567',
    phoneNumbers: ['994121234567', '994509998877'],
    companyName: 'Sahara Electronics',
    address: 'Bakı şəhəri, Sədərək Ticarət Mərkəzi, Sıra 12',
    email: 'contact@saharaelectronics.az',
    workingHours: '09:00 - 19:00',
    mapUrl: 'https://maps.google.com/test',
    locationNote: 'Rəsmi zəmanət və servis mərkəzi',
    countries: ['Türkiyə', 'Çin', 'İtaliya', 'Almaniya'],
    instagramUsername: '@sahara.electronics.az',
    instagramUrl: 'https://instagram.com/sahara.electronics.az',
    facebookUsername: 'Sahara Electronics Official',
    facebookUrl: 'https://facebook.com/saharaofficial',
  },
  articles: [
    {
      id: 'art-custom',
      title: 'İtalyan SABAF Yanma Sistemi',
      subtitle: 'Qənaətcil və təhlükəsiz qaz forsunkaları.',
      badge: '🔥 SABAF',
      icon: 'Flame',
      active: true,
      advantages: [{ title: 'Qaz Nəzarəti', desc: 'Sönəndə avtomatik qapanır.' }],
    },
  ],
  updatedAt: '2026-08-28T00:00:00.000Z',
});

test('SQLite kataloqu əlaqəli cədvəllərdə saxlayır və geri oxuyur', () => {
  const directory = mkdtempSync(join(tmpdir(), 'sahara-db-'));
  const path = join(directory, 'catalog.sqlite');
  const database = createCatalogDatabase(path);
  try {
    database.saveCatalog(sampleCatalog());
    const catalog = database.getCatalog();
    assert.equal(catalog.products.length, 1);
    assert.equal(catalog.products[0].brandId, 'ardo');
    assert.equal(catalog.products[0].media[0].url, '/media/oven.png');
    assert.equal(catalog.settings.whatsappNumber, '994501234567');
    assert.equal(catalog.settings.phoneNumber, '994121234567');
    assert.deepEqual(catalog.settings.phoneNumbers, ['994121234567', '994509998877']);
    assert.equal(catalog.settings.companyName, 'Sahara Electronics');
    assert.equal(catalog.settings.address, 'Bakı şəhəri, Sədərək Ticarət Mərkəzi, Sıra 12');
    assert.equal(catalog.settings.email, 'contact@saharaelectronics.az');
    assert.equal(catalog.settings.instagramUsername, '@sahara.electronics.az');
    assert.equal(catalog.settings.facebookUsername, 'Sahara Electronics Official');
    assert.equal(catalog.articles.length, 1);
    assert.equal(catalog.articles[0].title, 'İtalyan SABAF Yanma Sistemi');
    assert.ok(Array.isArray(catalog.settings.countries));
    assert.ok(database.tableNames().includes('product_media'));
    assert.ok(database.tableNames().includes('product_specs'));
    assert.equal(readFileSync(path).subarray(0, 15).toString(), 'SQLite format 3');
  } finally { database.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('baxış statistikası kataloq yenilənəndə qorunur', () => {
  const database = createCatalogDatabase(':memory:');
  try {
    const catalog = sampleCatalog();
    database.saveCatalog(catalog);
    database.recordEvent({ type: 'catalog_view' });
    database.recordEvent({ type: 'product_view', productId: 'ardo-oven-1' });
    database.recordEvent({ type: 'contact_whatsapp', productId: 'ardo-oven-1' });
    database.recordEvent({ type: 'contact_call', productId: 'ardo-oven-1' });
    database.recordEvent({ type: 'contact_call', productId: 'ardo-oven-1' });
    catalog.products[0].title = 'Yenilənmiş soba';
    database.saveCatalog(catalog);
    assert.equal(database.getAnalytics().catalogViews, 1);
    assert.equal(database.getAnalytics().productViews['ardo-oven-1'], 1);
    assert.deepEqual(database.getAnalytics().contactActions, { whatsapp: 1, call: 2 });
    assert.deepEqual(database.getAnalytics().contactActionsByProduct['ardo-oven-1'], { whatsapp: 1, call: 2 });
    assert.equal(database.getCatalog().products[0].title, 'Yenilənmiş soba');
  } finally { database.close(); }
});

test('qaralama dəyişiklikləri və bütün əlaqə/texnologiya məlumatları yalnız təsdiqdən sonra public kataloqa keçir', () => {
  const publicDatabase = createCatalogDatabase(':memory:');
  const draftDatabase = createCatalogDatabase(':memory:');
  try {
    publicDatabase.saveCatalog(sampleCatalog());
    draftDatabase.saveCatalog(publicDatabase.getCatalog());
    const draft = draftDatabase.getCatalog();
    
    // Admin dəyişiklikləri edir:
    draft.products[0].title = 'Qaralamadakı yeni başlıq';
    draft.settings.email = 'yeni.admin.mail@saharaelectronics.az';
    draft.settings.phoneNumbers = ['+994 50 111 22 33', '+994 12 999 88 77', '+994 55 444 33 22'];
    draft.settings.address = 'Yeni Ünvan, Babək Prospekti 100';
    draft.settings.instagramUsername = '@sahara_official';
    draft.articles = [
      { id: 'art-new', title: 'Yeni İnvertor Texnologiyası', subtitle: 'İzahı', badge: 'Yeni', icon: 'Zap', active: true, advantages: [] },
    ];
    draftDatabase.saveCatalog(draft);

    // Hələ public edilməyib:
    assert.equal(publicDatabase.getCatalog().products[0].title, 'Test sobası');
    assert.equal(publicDatabase.getCatalog().settings.email, 'contact@saharaelectronics.az');
    assert.equal(publicDatabase.getCatalog().settings.address, 'Bakı şəhəri, Sədərək Ticarət Mərkəzi, Sıra 12');

    // Public etmə əməliyyatı:
    publicDatabase.saveCatalog(draftDatabase.getCatalog());
    
    // İndi public bazada bütün dəyişikliklər 100% mövcuddur:
    const published = publicDatabase.getCatalog();
    assert.equal(published.products[0].title, 'Qaralamadakı yeni başlıq');
    assert.equal(published.settings.email, 'yeni.admin.mail@saharaelectronics.az');
    assert.deepEqual(published.settings.phoneNumbers, ['+994 50 111 22 33', '+994 12 999 88 77', '+994 55 444 33 22']);
    assert.equal(published.settings.address, 'Yeni Ünvan, Babək Prospekti 100');
    assert.equal(published.settings.instagramUsername, '@sahara_official');
    assert.equal(published.articles.length, 1);
    assert.equal(published.articles[0].title, 'Yeni İnvertor Texnologiyası');
  } finally {
    publicDatabase.close();
    draftDatabase.close();
  }
});
