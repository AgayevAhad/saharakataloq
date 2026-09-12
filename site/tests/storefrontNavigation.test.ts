import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  PHASE4_NAVIGATION_MANIFEST,
  isPhase4NavigationReady,
  applyPhase4NavigationSchema,
  promotePhase4NavigationData,
  DEFAULT_NAVIGATION_SEED,
} from '../backend/phase4NavigationMigration.mjs';
import { NavigationService } from '../backend/navigationService.mjs';
import { resolveRouteFromPath } from '../src/App';
import { featureFlags } from '../src/utils/featureFlags';

describe('Phase 4: Navigation CMS Model & Storefront Shell Tests', () => {
  let tempDir: string;
  let draftDb: DatabaseSync;
  let publicDb: DatabaseSync;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-p4-test-'));
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

  describe('1. Navigation Schema & Manifest', () => {
    it('should match manifest configuration and seed structure', () => {
      expect(PHASE4_NAVIGATION_MANIFEST.version).toBe('phase4_navigation_v1');
      expect(PHASE4_NAVIGATION_MANIFEST.tables.length).toBe(2);
      expect(DEFAULT_NAVIGATION_SEED.length).toBeGreaterThan(0);
    });

    it('should report false before schema migration and true after', () => {
      expect(isPhase4NavigationReady(draftDb)).toBe(false);
      applyPhase4NavigationSchema(draftDb);
      expect(isPhase4NavigationReady(draftDb)).toBe(true);
    });

    it('should match canonical manifest table and column definitions', () => {
      applyPhase4NavigationSchema(draftDb);

      const navColumns = draftDb.prepare("PRAGMA table_info('navigation_items')").all() as any[];
      const navColNames = navColumns.map((c) => c.name);

      expect(navColNames).toContain('id');
      expect(navColNames).toContain('placement');
      expect(navColNames).toContain('parent_id');
      expect(navColNames).toContain('label');
      expect(navColNames).toContain('href');
      expect(navColNames).toContain('sort_order');
      expect(navColNames).toContain('enabled');
      expect(navColNames).toContain('status');
      expect(navColNames).toContain('version');

      const revColumns = draftDb
        .prepare("PRAGMA table_info('navigation_revisions')")
        .all() as any[];
      const revColNames = revColumns.map((c) => c.name);

      expect(revColNames).toContain('navigation_item_id');
      expect(revColNames).toContain('version');
      expect(revColNames).toContain('action');
      expect(revColNames).toContain('actor');
    });

    it('should be idempotent across repeated applications', () => {
      applyPhase4NavigationSchema(draftDb);
      applyPhase4NavigationSchema(draftDb);
      expect(isPhase4NavigationReady(draftDb)).toBe(true);
    });
  });

  describe('2. Safe URL Validation & XSS Prevention', () => {
    it('should accept valid internal paths and valid http/https URLs', () => {
      applyPhase4NavigationSchema(draftDb);
      const service = new NavigationService(draftDb);

      expect(service.validateUrl('/catalog')).toBe('/catalog');
      expect(service.validateUrl('/stores')).toBe('/stores');
      expect(service.validateUrl('https://example.com/warranty')).toBe(
        'https://example.com/warranty'
      );
      expect(service.validateUrl('http://saharaelectronics.az')).toBe(
        'http://saharaelectronics.az'
      );
    });

    it('should strictly reject malicious schemes: javascript:, data:, vbscript:, file:', () => {
      applyPhase4NavigationSchema(draftDb);
      const service = new NavigationService(draftDb);

      expect(() => service.validateUrl('javascript:alert(1)')).toThrow(
        /Təhlükəsizlik xətası: İcazə verilməyən URL sxemi/
      );
      expect(() => service.validateUrl('data:text/html,<script>alert(1)</script>')).toThrow(
        /Təhlükəsizlik xətası: İcazə verilməyən URL sxemi/
      );
      expect(() => service.validateUrl('vbscript:msgbox(1)')).toThrow(
        /Təhlükəsizlik xətası: İcazə verilməyən URL sxemi/
      );
      expect(() => service.validateUrl('file:///etc/passwd')).toThrow(
        /Təhlükəsizlik xətası: İcazə verilməyən URL sxemi/
      );
    });

    it('should validate label boundaries (non-empty, max 100 chars)', () => {
      applyPhase4NavigationSchema(draftDb);
      const service = new NavigationService(draftDb);

      expect(service.validateLabel('  Mağazalar  ')).toBe('Mağazalar');
      expect(() => service.validateLabel('')).toThrow(/boş ola bilməz/);
      expect(() => service.validateLabel('   ')).toThrow(/boş ola bilməz/);
      expect(() => service.validateLabel('A'.repeat(101))).toThrow(/100 simvoldan uzun ola bilməz/);
    });
  });

  describe('3. Tree Depth & Cycle Prevention', () => {
    it('should prevent direct self-parenting', () => {
      applyPhase4NavigationSchema(draftDb);
      const service = new NavigationService(draftDb);

      expect(() => service.checkCycle('item-1', 'item-1')).toThrow(/Dövrü asılılıq/);
    });

    it('should prevent cyclical descendant ancestor assignment', () => {
      applyPhase4NavigationSchema(draftDb);
      const service = new NavigationService(draftDb);

      const root = service.createItem({ label: 'Root', href: '/root' }, 'admin');
      const child = service.createItem(
        { label: 'Child', href: '/child', parent_id: root.id },
        'admin'
      );
      const grandChild = service.createItem(
        { label: 'Grandchild', href: '/grandchild', parent_id: child.id },
        'admin'
      );

      // Attempt to set root parent to grandchild
      expect(() => service.checkCycle(root.id, grandChild.id)).toThrow(/Dövrü asılılıq/);
    });
  });

  describe('4. Strict Concrete ETag Concurrency (428 / 412)', () => {
    it('should generate deterministic ETag from id and version', () => {
      applyPhase4NavigationSchema(draftDb);
      const service = new NavigationService(draftDb);

      const item = service.createItem({ label: 'Test', href: '/test' }, 'admin');
      const etag = service.generateEtag(item);
      expect(etag).toBe(`"nav-${item.id}-v1"`);
    });

    it('should strictly reject wildcard * ETag matching', () => {
      applyPhase4NavigationSchema(draftDb);
      const service = new NavigationService(draftDb);

      const item = service.createItem({ label: 'Test', href: '/test' }, 'admin');
      expect(service.matchEtag('*', item)).toBe(false);
      expect(service.matchEtag('"*"', item)).toBe(false);
      expect(service.matchEtag(`"nav-${item.id}-v1"`, item)).toBe(true);
    });

    it('should increment version and revision on update', () => {
      applyPhase4NavigationSchema(draftDb);
      const service = new NavigationService(draftDb);

      const item = service.createItem({ label: 'Test Item', href: '/test' }, 'admin');
      const updated = service.updateItem(item.id, { label: 'Updated Label' }, 'admin');

      expect(updated.version).toBe(2);
      expect(updated.label).toBe('Updated Label');

      const revisions = draftDb
        .prepare('SELECT * FROM navigation_revisions WHERE navigation_item_id = ?')
        .all(item.id) as any[];

      expect(revisions.length).toBe(2); // create + update
      expect(revisions[1].action).toBe('update');
      expect(revisions[1].version).toBe(2);
    });
  });

  describe('5. Sibling Reordering', () => {
    it('should reorder siblings atomically in transaction', () => {
      applyPhase4NavigationSchema(draftDb);
      const service = new NavigationService(draftDb);

      const item1 = service.createItem({ label: 'One', href: '/1', sort_order: 1 }, 'admin');
      const item2 = service.createItem({ label: 'Two', href: '/2', sort_order: 2 }, 'admin');
      const item3 = service.createItem({ label: 'Three', href: '/3', sort_order: 3 }, 'admin');

      service.reorderSiblings(
        [
          { id: item3.id, sortOrder: 0 },
          { id: item1.id, sortOrder: 1 },
          { id: item2.id, sortOrder: 2 },
        ],
        'admin'
      );

      const tree = service.getNavigationTree({ publicOnly: false });
      expect(tree[0].id).toBe(item3.id);
      expect(tree[1].id).toBe(item1.id);
      expect(tree[2].id).toBe(item2.id);
    });
  });

  describe('6. Draft vs Public Isolation & Promotion', () => {
    it('should isolate draft items until promoted to public DB', () => {
      applyPhase4NavigationSchema(draftDb);
      applyPhase4NavigationSchema(publicDb);

      const draftService = new NavigationService(draftDb);
      const publicService = new NavigationService(publicDb);

      // Create draft item
      const item = draftService.createItem(
        { label: 'New Campaign', href: '/campaigns', status: 'published' },
        'admin'
      );

      // Draft tree has it
      const draftTree = draftService.getNavigationTree({ publicOnly: true });
      expect(draftTree.some((i) => i.id === item.id)).toBe(true);

      // Public tree does NOT have it before promotion
      const publicTreeBefore = publicService.getNavigationTree({ publicOnly: true });
      expect(publicTreeBefore.some((i) => i.id === item.id)).toBe(false);

      // Promote to public
      promotePhase4NavigationData(draftDb, publicDb);

      // Public tree now has it
      const publicTreeAfter = publicService.getNavigationTree({ publicOnly: true });
      expect(publicTreeAfter.some((i) => i.id === item.id)).toBe(true);
    });
  });

  describe('7. Clean URL Route Resolution', () => {
    it('should resolve standard clean routes', () => {
      expect(resolveRouteFromPath('/')).toEqual({ route: 'home' });
      expect(resolveRouteFromPath('/catalog')).toEqual({ route: 'catalog' });
      expect(resolveRouteFromPath('/brands')).toEqual({ route: 'brands' });
      expect(resolveRouteFromPath('/stores')).toEqual({ route: 'stores' });
      expect(resolveRouteFromPath('/services')).toEqual({ route: 'services' });
      expect(resolveRouteFromPath('/support')).toEqual({ route: 'support' });
    });

    it('should resolve category and brand slug routes', () => {
      expect(resolveRouteFromPath('/category/refrigerator')).toEqual({
        route: 'catalog',
        category: 'refrigerator',
      });
      expect(resolveRouteFromPath('/brand/ardo')).toEqual({
        route: 'catalog',
        brand: 'ardo',
      });
    });

    it('should resolve unknown routes to 404', () => {
      expect(resolveRouteFromPath('/non-existent-page')).toEqual({ route: '404' });
    });
  });

  describe('8. Feature Flag Protection & Alive Route Verification', () => {
    it('should block compare route when enableCompare flag is false', () => {
      const originalFlags = { ...featureFlags.getFlags() };
      featureFlags.setFlag('enableCompare', false);
      expect(resolveRouteFromPath('/compare')).toEqual({ route: '404' });

      featureFlags.setFlag('enableCompare', true);
      expect(resolveRouteFromPath('/compare')).toEqual({ route: 'compare' });

      // Restore
      featureFlags.setFlag('enableCompare', originalFlags.enableCompare);
    });
  });
});
