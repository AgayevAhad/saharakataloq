import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { TaxonomyService } from '../backend/taxonomyService.mjs';
import { applyPhase3Schema } from '../backend/phase3Migration.mjs';

function createTestDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
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

  applyPhase3Schema(db);

  // Insert initial root categories
  const now = new Date().toISOString();
  db.prepare(
    `
    INSERT INTO categories (id, name, slug, icon, sort_order, parent_id, depth, path, is_archived, version, created_at, updated_at)
    VALUES ('cat_stoves', 'Mətbəx Plitələri', 'metbex-pliteleri', 'Flame', 1, NULL, 1, '/metbex-pliteleri', 0, 1, ?, ?)
  `
  ).run(now, now);

  db.prepare(
    `
    INSERT INTO categories (id, name, slug, icon, sort_order, parent_id, depth, path, is_archived, version, created_at, updated_at)
    VALUES ('cat_hoods', 'Aspiratorlar', 'aspiratorlar', 'Wind', 2, NULL, 1, '/aspiratorlar', 0, 1, ?, ?)
  `
  ).run(now, now);

  return db;
}

describe('Phase 3: Taxonomy & Hierarchy Service', () => {
  let db: DatabaseSync;
  let service: TaxonomyService;

  beforeEach(() => {
    db = createTestDb();
    service = new TaxonomyService(db);
  });

  it('1. Create subcategory with calculated path and depth', () => {
    const sub = service.createCategory({
      name: 'Qaz Plitələri',
      slug: 'qaz-pliteleri',
      parentId: 'cat_stoves',
      icon: 'Flame',
    });

    expect(sub.depth).toBe(2);
    expect(sub.path).toBe('/metbex-pliteleri/qaz-pliteleri');
    expect(sub.parentId).toBe('cat_stoves');
  });

  it('2. Depth Limit Enforcement: Max category depth is 4', () => {
    const level2 = service.createCategory({
      name: 'L2',
      slug: 'l2',
      parentId: 'cat_stoves',
    });
    expect(level2.depth).toBe(2);

    const level3 = service.createCategory({
      name: 'L3',
      slug: 'l3',
      parentId: level2.id,
    });
    expect(level3.depth).toBe(3);

    const level4 = service.createCategory({
      name: 'L4',
      slug: 'l4',
      parentId: level3.id,
    });
    expect(level4.depth).toBe(4);

    // Creating Level 5 must fail
    expect(() => {
      service.createCategory({
        name: 'L5',
        slug: 'l5',
        parentId: level4.id,
      });
    }).toThrow(/MAX_DEPTH_EXCEEDED/);
  });

  it('3. Cycle Prevention: Cannot set category as own parent or descendant of itself', () => {
    const level2 = service.createCategory({
      name: 'L2',
      slug: 'l2',
      parentId: 'cat_stoves',
    });
    const level3 = service.createCategory({
      name: 'L3',
      slug: 'l3',
      parentId: level2.id,
    });

    // Cannot make root category a child of its own grandchild level3
    expect(() => {
      service.moveCategory('cat_stoves', level3.id, 0);
    }).toThrow(/CYCLE_DETECTED/);

    // Cannot make category its own parent
    expect(() => {
      service.moveCategory('cat_stoves', 'cat_stoves', 0);
    }).toThrow(/CYCLE_DETECTED/);
  });

  it('4. Transactional Reordering: Atomic updates and rollbacks on error', () => {
    const res = service.reorderCategories([
      { id: 'cat_stoves', sortOrder: 5 },
      { id: 'cat_hoods', sortOrder: 1 },
    ]);
    expect(res.success).toBe(true);

    const stoves = service.getCategoryById('cat_stoves');
    const hoods = service.getCategoryById('cat_hoods');
    expect(stoves?.sortOrder).toBe(5);
    expect(hoods?.sortOrder).toBe(1);

    // Invalid reorder with non-existent ID fails and rolls back
    expect(() => {
      service.reorderCategories([{ id: 'non_existent', sortOrder: 10 }]);
    }).toThrow(/CATEGORY_NOT_FOUND/);
  });

  it('5. Safe Archive & Product Reassignment: Protects active products from becoming orphaned', () => {
    // Add product to cat_stoves
    const now = new Date().toISOString();
    db.prepare(
      `
      INSERT INTO products (id, brand_id, category_id, title, slug, status, created_at, updated_at)
      VALUES ('p1', 'brand_1', 'cat_stoves', 'Məhsul 1', 'm1', 'published', ?, ?)
    `
    ).run(now, now);

    // Trying to archive cat_stoves without reassignment fails
    expect(() => {
      service.archiveCategory('cat_stoves');
    }).toThrow(/CATEGORY_HAS_ACTIVE_PRODUCTS/);

    // Reassigning to cat_hoods succeeds
    const archived = service.archiveCategory('cat_stoves', {
      reassignToCategoryId: 'cat_hoods',
    });
    expect(archived.isArchived).toBe(true);

    // Product should now be reassigned to cat_hoods
    const prod = db.prepare("SELECT category_id FROM products WHERE id = 'p1'").get();
    expect(prod?.category_id).toBe('cat_hoods');
  });

  it('6. Public Category Tree Ancestor Preservation: Preserves all ancestors leading to descendant with products', () => {
    // Create hierarchy: Root -> Level2 -> Level3 (Leaf)
    const level2 = service.createCategory({
      name: 'Bişirmə Texnikası',
      slug: 'bisirme-texnikasi',
      parentId: 'cat_stoves',
    });
    const level3 = service.createCategory({
      name: 'Sabaf Qaz Plitələri',
      slug: 'sabaf-qaz-pliteleri',
      parentId: level2.id,
    });

    // Add product ONLY to leaf level3
    const now = new Date().toISOString();
    db.prepare(
      `
      INSERT INTO products (id, brand_id, category_id, title, slug, status, created_at, updated_at)
      VALUES ('p_leaf', 'b1', ?, 'Sabaf Plitə', 'sabaf-plite', 'published', ?, ?)
    `
    ).run(level3.id, now, now);

    // In public tree, cat_stoves and level2 must BOTH be preserved as ancestors even though they have 0 direct products
    const publicTree = service.getCategoryTree({ publicOnly: true });

    expect(publicTree.length).toBe(1);
    const root = publicTree[0];
    expect(root.id).toBe('cat_stoves');
    expect(root.productCount).toBe(0);
    expect(root.totalDescendantProducts).toBe(1);

    expect(root.children.length).toBe(1);
    const l2 = root.children[0];
    expect(l2.id).toBe(level2.id);
    expect(l2.totalDescendantProducts).toBe(1);

    expect(l2.children.length).toBe(1);
    const l3 = l2.children[0];
    expect(l3.id).toBe(level3.id);
    expect(l3.productCount).toBe(1);

    // Empty category 'cat_hoods' with 0 products should be omitted from public tree
    expect(publicTree.some((n) => n.id === 'cat_hoods')).toBe(false);
  });
});
