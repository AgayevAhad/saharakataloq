import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { BrandRegistryService } from '../backend/brandRegistryService.mjs';
import { applyPhase3Schema } from '../backend/phase3Migration.mjs';

function createTestDb() {
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
  `);

  // Apply additive Phase 3 schema
  applyPhase3Schema(db);

  // Insert initial baseline brands (legacy unreviewed)
  const now = new Date().toISOString();
  db.prepare(
    `
    INSERT INTO brands (id, name, slug, origin_country, logo, active, coming_soon, sort_order, verification_status, logo_rights_status, created_at)
    VALUES ('brand_ardo', 'ARDO', 'ardo', 'İtaliya', '/media/brands/ardo-logo.png', 1, 0, 1, 'legacy_unreviewed', 'unreviewed', ?)
  `
  ).run(now);
  db.prepare(
    `
    INSERT INTO brands (id, name, slug, origin_country, logo, active, coming_soon, sort_order, verification_status, logo_rights_status, created_at)
    VALUES ('brand_lotus', 'Lotus', 'lotus', 'Türkiyə', '/media/brands/lotus-mark.svg', 1, 0, 2, 'legacy_unreviewed', 'unreviewed', ?)
  `
  ).run(now);
  db.prepare(
    `
    INSERT INTO brands (id, name, slug, origin_country, logo, active, coming_soon, sort_order, verification_status, logo_rights_status, created_at)
    VALUES ('brand_artel', 'Artel', 'artel', 'Özbəkistan', '/media/brands/artel-logo.svg', 1, 0, 3, 'legacy_unreviewed', 'unreviewed', ?)
  `
  ).run(now);

  // Add dummy product for ARDO so it appears in public catalog
  db.prepare(
    `
    INSERT INTO products (id, brand_id, category_id, title, slug, status, created_at, updated_at)
    VALUES ('prod_ardo_1', 'brand_ardo', 'cat_1', 'ARDO Sobası', 'ardo-sobasi', 'published', ?, ?)
  `
  ).run(now, now);

  return db;
}

describe('Phase 3: Brand Registry & Verification Service', () => {
  let db: DatabaseSync;
  let service: BrandRegistryService;

  beforeEach(() => {
    db = createTestDb();
    service = new BrandRegistryService(db);
  });

  it('1. Candidate brand visibility: Candidate brands must NOT appear in public brands', () => {
    // Register candidate brand (e.g. Bosch from Baku Electronics)
    const candidate = service.addCandidateBrand({
      name: 'Bosch',
      slug: 'bosch',
      originCountry: 'Almaniya',
      sourceUrl: 'https://www.bakuelectronics.az/brand/bosch.html',
      observedName: 'Bosch',
      actor: 'admin_test',
    });

    expect(candidate.id).toBeDefined();
    expect(candidate.verificationStatus).toBe('candidate');

    // Public list should strictly contain ONLY published or legacy_unreviewed brands
    const publicBrands = service.getPublicBrands();
    const publicSlugs = publicBrands.map((b) => b.slug);

    expect(publicSlugs).toContain('ardo');
    expect(publicSlugs).not.toContain('bosch');
  });

  it('2. Slug and Alias Collisions: Rejects duplicate names, slugs, and aliases', () => {
    // ARDO already exists
    expect(() => {
      service.addCandidateBrand({
        name: 'Ardo',
        slug: 'ardo',
      });
    }).toThrow(/BRAND_SLUG_COLLISION/);

    // Add candidate Samsung
    const samsung = service.addCandidateBrand({
      name: 'Samsung',
      slug: 'samsung',
    });

    // Add alias "Sam" to Samsung
    service.addBrandAlias(samsung.id, 'Sam');

    // Add alias "Sam" to another brand should throw collision
    expect(() => {
      service.addBrandAlias('brand_ardo', 'sam');
    }).toThrow(/ALIAS_COLLISION/);

    // Add alias matching another brand name
    expect(() => {
      service.addBrandAlias(samsung.id, 'ardo');
    }).toThrow(/ALIAS_COLLISION/);
  });

  it('3. Source-less publish prevention: Cannot publish without verified manufacturer source', () => {
    const candidate = service.addCandidateBrand({
      name: 'Beko',
      slug: 'beko',
      originCountry: 'Türkiyə',
    });

    // Move candidate -> verified -> content_ready
    service.updateBrandVerificationStatus(candidate.id, 'verified');
    service.updateBrandVerificationStatus(candidate.id, 'content_ready');

    // Attempting to publish without verified official source throws error
    expect(() => {
      service.updateBrandVerificationStatus(candidate.id, 'published');
    }).toThrow(/BRAND_REQUIRES_VERIFIED_OFFICIAL_SOURCE/);

    // Add manufacturer source and verify it via review
    const source = service.addBrandSource(candidate.id, {
      sourceUrl: 'https://www.beko.com',
      sourceType: 'official_website',
    });
    service.updateBrandSourceStatus(candidate.id, source.id, 'verified');

    // Now transition to published succeeds
    const published = service.updateBrandVerificationStatus(candidate.id, 'published');
    expect(published.verificationStatus).toBe('published');
  });

  it('4. Invalid status transitions: Rejects disallowed status transitions', () => {
    const candidate = service.addCandidateBrand({
      name: 'LG',
      slug: 'lg',
    });

    // candidate cannot jump directly to published
    expect(() => {
      service.updateBrandVerificationStatus(candidate.id, 'published');
    }).toThrow(/INVALID_BRAND_STATUS_TRANSITION/);
  });

  it('5. Logo rights status and public logo display enforcement', () => {
    const candidate = service.addCandidateBrand({
      name: 'Philips',
      slug: 'philips',
    });

    // Add source and verify via review
    const source = service.addBrandSource(candidate.id, {
      sourceUrl: 'https://www.philips.com',
      sourceType: 'official_website',
    });
    service.updateBrandSourceStatus(candidate.id, source.id, 'verified');
    service.updateBrandVerificationStatus(candidate.id, 'verified');
    service.updateBrandVerificationStatus(candidate.id, 'content_ready');
    service.updateBrandVerificationStatus(candidate.id, 'published');

    // Add product so it qualifies for public list
    db.prepare(
      `
      INSERT INTO products (id, brand_id, category_id, title, slug, status, created_at, updated_at)
      VALUES ('prod_philips_1', ?, 'cat_1', 'Philips Məhsul', 'philips-1', 'published', ?, ?)
    `
    ).run(candidate.id, new Date().toISOString(), new Date().toISOString());

    // Logo rights unreviewed -> logo string should be hidden from public output
    db.prepare('UPDATE brands SET logo = ? WHERE id = ?').run(
      '/media/brands/philips.svg',
      candidate.id
    );

    let pub = service.getPublicBrands().find((b) => b.id === candidate.id);
    expect(pub?.logo).toBe('');

    // Approve logo rights
    service.updateLogoRights(candidate.id, {
      logoRightsStatus: 'approved',
      rightsNote: 'Rəsmi distribyutor icazəsi mövcuddur',
      verifiedBy: 'admin_legal',
    });

    pub = service.getPublicBrands().find((b) => b.id === candidate.id);
    expect(pub?.logo).toBe('/media/brands/philips.svg');
  });
});
