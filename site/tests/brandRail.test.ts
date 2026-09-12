import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  CANONICAL_54_BRANDS,
  isPhase5BrandRailReady,
  applyPhase5BrandRailSchema,
  seedCanonical54Brands,
} from '../backend/phase5BrandRailMigration.mjs';
import {
  BrandRailService,
  generateBrandRailEtag,
  matchBrandRailEtag,
} from '../backend/brandRailService.mjs';

describe('Phase 5: Animated Brand Rail & 54 Canonical Brands Integration Tests', () => {
  let tempDir: string;
  let draftDb: DatabaseSync;
  let publicDb: DatabaseSync;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-p5-test-'));
    draftDb = new DatabaseSync(join(tempDir, 'catalog-draft.sqlite'));
    publicDb = new DatabaseSync(join(tempDir, 'catalog.sqlite'));
  });

  afterEach(() => {
    try {
      draftDb.close();
      publicDb.close();
      rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  describe('1. 54 Canonical Brands & Manifest Integrity', () => {
    it('should have exactly 54 canonical brands in definition', () => {
      expect(CANONICAL_54_BRANDS.length).toBe(54);
    });

    it('should enforce distinct, unique slugs for all 54 brands', () => {
      const slugs = CANONICAL_54_BRANDS.map((b) => b.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(54);
    });

    it('should preserve required distinctive brands without confusion or alias errors', () => {
      const brandNames = CANONICAL_54_BRANDS.map((b) => b.name);
      // Darkin
      expect(brandNames).toContain('Darkin');
      // Konka & Konko
      expect(brandNames).toContain('Konka');
      expect(brandNames).toContain('Konko');
      // Hailang & Hayland
      expect(brandNames).toContain('Hailang');
      expect(brandNames).toContain('Hayland');
      // Winsor (not Windsor)
      expect(brandNames).toContain('Winsor');
      expect(brandNames).not.toContain('Windsor');
      // Ficher (not Fisher)
      expect(brandNames).toContain('Ficher');
      expect(brandNames).not.toContain('Fisher');
      // ES
      expect(brandNames).toContain('ES');
      // Ardesto & Arlant
      expect(brandNames).toContain('Ardesto');
      expect(brandNames).toContain('Arlant');
      // ARDO, ARTEL, LOTUS
      expect(brandNames).toContain('ARDO');
      expect(brandNames).toContain('ARTEL');
      expect(brandNames).toContain('LOTUS');
    });

    it('should report false before schema migration and true after', () => {
      expect(isPhase5BrandRailReady(draftDb)).toBe(false);
      applyPhase5BrandRailSchema(draftDb);
      expect(isPhase5BrandRailReady(draftDb)).toBe(true);
    });

    it('should seed 54 canonical brands deterministically on empty database', () => {
      applyPhase5BrandRailSchema(draftDb);
      seedCanonical54Brands(draftDb);

      const count = draftDb.prepare('SELECT COUNT(*) as count FROM brand_rail_items').get() as {
        count: number;
      };
      expect(count.count).toBe(54);

      // Verify idempotency (calling seed again does not duplicate items)
      seedCanonical54Brands(draftDb);
      const countAfter = draftDb
        .prepare('SELECT COUNT(*) as count FROM brand_rail_items')
        .get() as { count: number };
      expect(countAfter.count).toBe(54);
    });
  });

  describe('2. BrandRailService Settings & Items Management', () => {
    let railService: BrandRailService;

    beforeEach(() => {
      applyPhase5BrandRailSchema(draftDb);
      seedCanonical54Brands(draftDb);
      railService = new BrandRailService(draftDb);
    });

    it('should retrieve default settings correctly', () => {
      const settings = railService.getSettings();
      expect(settings).not.toBeNull();
      expect(settings.enabled).toBe(true);
      expect(settings.speedSeconds).toBe(30);
      expect(settings.direction).toBe('left');
      expect(settings.pauseOnHover).toBe(true);
      expect(settings.edgeFade).toBe(true);
      expect(settings.cardSize).toBe('md');
      expect(settings.title).toBe('Brendlər');
    });

    it('should update settings with valid values and ETag check', () => {
      const current = railService.getSettings();
      const etag = generateBrandRailEtag(current);

      const updated = railService.updateSettings(
        {
          speedSeconds: 45,
          direction: 'right',
          pauseOnHover: false,
          edgeFade: false,
        },
        etag
      );

      expect(updated.speedSeconds).toBe(45);
      expect(updated.direction).toBe('right');
      expect(updated.pauseOnHover).toBe(false);
      expect(updated.edgeFade).toBe(false);

      const refreshed = railService.getSettings();
      expect(refreshed.speedSeconds).toBe(45);
      expect(refreshed.direction).toBe('right');
    });

    it('should retrieve 54 items in sorted order', () => {
      const items = railService.getItems();
      expect(items.length).toBe(54);
      for (let i = 0; i < items.length - 1; i++) {
        expect(items[i].sortOrder).toBeLessThanOrEqual(items[i + 1].sortOrder);
      }
    });

    it('should batch update item orders, active flags, and link states', () => {
      const items = railService.getItems();
      const firstItem = items[0];

      const patch = [
        {
          id: firstItem.id,
          brandId: firstItem.brandId,
          sortOrder: 999,
          enabled: false,
          linkEnabled: false,
        },
      ];

      const updated = railService.updateItems(patch);
      const modified = updated.find((it) => it.id === firstItem.id);
      expect(modified?.sortOrder).toBe(999);
      expect(modified?.enabled).toBe(false);
      expect(modified?.linkEnabled).toBe(false);
    });
  });

  describe('3. Dynamic Published Product Count & Public Rail Data', () => {
    let railService: BrandRailService;

    beforeEach(() => {
      // Setup products table in draftDb to test dynamic product count linkage
      draftDb.exec(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          brand_id TEXT,
          brand_slug TEXT,
          status TEXT DEFAULT 'published'
        );
      `);

      // Insert published products for ARDO (3) and ARTEL (2), but only draft products for LOTUS (5)
      draftDb.exec(`
        INSERT INTO products (id, brand_id, brand_slug, status) VALUES
        ('p1', 'ardo', 'ardo', 'published'),
        ('p2', 'ardo', 'ardo', 'published'),
        ('p3', 'ardo', 'ardo', 'published'),
        ('p4', 'artel', 'artel', 'published'),
        ('p5', 'artel', 'artel', 'published'),
        ('p6', 'lotus', 'lotus', 'draft'),
        ('p7', 'lotus', 'lotus', 'draft'),
        ('p8', 'lotus', 'lotus', 'draft'),
        ('p9', 'lotus', 'lotus', 'draft'),
        ('p10', 'lotus', 'lotus', 'draft');
      `);

      applyPhase5BrandRailSchema(draftDb);
      seedCanonical54Brands(draftDb);
      railService = new BrandRailService(draftDb);
    });

    it('should compute published_product_count dynamically without leaking draft items', () => {
      const publicRail = railService.getPublicRail();
      expect(publicRail.enabled).toBe(true);

      const ardo = publicRail.items.find((i) => i.brandSlug === 'ardo');
      const artel = publicRail.items.find((i) => i.brandSlug === 'artel');
      const lotus = publicRail.items.find((i) => i.brandSlug === 'lotus');
      const beko = publicRail.items.find((i) => i.brandSlug === 'beko');

      expect(ardo?.publishedProductCount).toBe(3);
      expect(ardo?.hasPublishedProducts).toBe(true);

      expect(artel?.publishedProductCount).toBe(2);
      expect(artel?.hasPublishedProducts).toBe(true);

      // Lotus only has draft items, so published count MUST be 0 and hasPublishedProducts MUST be false
      expect(lotus?.publishedProductCount).toBe(0);
      expect(lotus?.hasPublishedProducts).toBe(false);

      expect(beko?.publishedProductCount).toBe(0);
      expect(beko?.hasPublishedProducts).toBe(false);
    });

    it('should exclude deactivated items from public rail', () => {
      const items = railService.getItems();
      const darkin = items.find((i) => i.brandSlug === 'darkin');
      expect(darkin).toBeDefined();

      railService.updateItems([{ id: darkin!.id, brandId: darkin!.brandId, enabled: false }]);

      const publicRail = railService.getPublicRail();
      const darkinInPublic = publicRail.items.find((i) => i.brandSlug === 'darkin');
      expect(darkinInPublic).toBeUndefined();
      expect(publicRail.items.length).toBe(53);
    });
  });

  describe('4. ETag Concurrency & Revision Management', () => {
    let railService: BrandRailService;

    beforeEach(() => {
      applyPhase5BrandRailSchema(draftDb);
      seedCanonical54Brands(draftDb);
      railService = new BrandRailService(draftDb);
    });

    it('should generate deterministic strong ETag for brand rail state', () => {
      const settings = railService.getSettings();

      const etag1 = generateBrandRailEtag(settings);
      const etag2 = generateBrandRailEtag(settings);

      expect(etag1).toBe(etag2);
      expect(etag1?.startsWith('"')).toBe(true);
      expect(matchBrandRailEtag(etag1, settings)).toBe(true);
    });

    it('should throw 428 when If-Match is missing and 412 on mismatch', () => {
      // Missing If-Match -> 428
      expect(() => {
        railService.updateSettings({ speedSeconds: 50 }, null as any);
      }).toThrowError(/PRECONDITION_REQUIRED/);

      // Wrong ETag -> 412
      expect(() => {
        railService.updateSettings({ speedSeconds: 50 }, '"wrong-etag"');
      }).toThrowError(/PRECONDITION_FAILED/);
    });

    it('should create revisions on update and support rollback', () => {
      const initialSettings = railService.getSettings();
      expect(initialSettings.speedSeconds).toBe(30);

      const etag1 = generateBrandRailEtag(initialSettings);
      const updated1 = railService.updateSettings({ speedSeconds: 50 }, etag1);
      const revsAfterSettings = railService.getRevisions();
      expect(revsAfterSettings.length).toBeGreaterThanOrEqual(1);

      const etag2 = generateBrandRailEtag(updated1);
      railService.updateSettings({ speedSeconds: 20 }, etag2);
      const revsAfterSecond = railService.getRevisions();
      expect(revsAfterSecond.length).toBeGreaterThanOrEqual(2);

      // Rollback the newest revision (which restores the previous state: speed 50)
      const latestRev = revsAfterSecond[0];
      const rolledBack = railService.rollback(latestRev.id, 'admin');

      expect(rolledBack.speedSeconds).toBe(50);
      expect(railService.getSettings().speedSeconds).toBe(50);
    });
  });

  describe('5. Atomic Public Database Promotion', () => {
    let draftService: BrandRailService;

    beforeEach(() => {
      applyPhase5BrandRailSchema(draftDb);
      applyPhase5BrandRailSchema(publicDb);
      seedCanonical54Brands(draftDb);
      draftService = new BrandRailService(draftDb);
    });

    it('should promote draft brand rail data atomically into public DB', () => {
      // Customize draft settings and an item
      const current = draftService.getSettings();
      const etag = generateBrandRailEtag(current);
      draftService.updateSettings({ speedSeconds: 42, direction: 'right' }, etag);

      const draftItems = draftService.getItems();
      draftService.updateItems([
        { id: draftItems[0].id, brandId: draftItems[0].brandId, sortOrder: 10 },
      ]);

      // Promote to public DB
      const result = draftService.publishToPublicDb(publicDb, 'test-admin');
      expect(result.published_items_count).toBe(54);

      // Verify public DB has exact promoted data
      const publicService = new BrandRailService(publicDb);
      const publicSettings = publicService.getSettings();
      expect(publicSettings.speedSeconds).toBe(42);
      expect(publicSettings.direction).toBe('right');

      const publicItems = publicService.getItems();
      expect(publicItems.length).toBe(54);
      expect(publicItems.find((i) => i.id === draftItems[0].id)?.sortOrder).toBe(10);
    });
  });
});
