import { createHash, randomUUID } from 'node:crypto';

export const MAX_CATEGORY_DEPTH = 4;

export function generateCategoryEtag(category) {
  if (!category || !category.id) return null;
  const version = category.version || 1;
  return `"c-${category.id}-v${version}"`;
}

export function matchCategoryEtag(ifMatchHeader, category) {
  if (!ifMatchHeader || !category) return false;
  const clean = ifMatchHeader.trim();
  if (clean === '*' || clean === '"*"') return false;
  const etag = generateCategoryEtag(category);
  if (clean === etag) return true;
  const version = category.version || 1;
  if (clean === `"${version}"` || clean === String(version)) return true;
  if (clean === `"v${version}"` || clean === `v${version}`) return true;
  if (clean === `W/"v${version}"` || clean === `W/"${version}"`) return true;
  return false;
}

export function generateSiblingSetEtag(db, parentId) {
  const hasCategories = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").get();
  if (!hasCategories) return null;
  const targetParent = parentId !== undefined && parentId !== null ? parentId : null;
  const siblings = targetParent === null
    ? db.prepare('SELECT id, version FROM categories WHERE parent_id IS NULL AND (is_archived = 0 OR is_archived IS NULL) ORDER BY id ASC').all()
    : db.prepare('SELECT id, version FROM categories WHERE parent_id = ? AND (is_archived = 0 OR is_archived IS NULL) ORDER BY id ASC').all(targetParent);
  const aggregate = siblings.map((s) => `${s.id}:${s.version || 1}`).join(',');
  const hash = createHash('sha256').update(aggregate).digest('hex').substring(0, 16);
  const pTag = targetParent ? `p-${targetParent}` : 'root';
  return `"reorder-${pTag}-${hash}"`;
}

export function matchSiblingSetEtag(ifMatchHeader, db, parentId) {
  if (!ifMatchHeader) return false;
  const clean = ifMatchHeader.trim();
  if (clean === '*' || clean === '"*"') return false;
  const expectedEtag = generateSiblingSetEtag(db, parentId);
  if (clean === expectedEtag) return true;
  const targetParent = parentId !== undefined && parentId !== null ? parentId : null;
  if (targetParent) {
    const parentCat = db.prepare('SELECT id, version FROM categories WHERE id = ?').get(targetParent);
    if (parentCat && matchCategoryEtag(clean, parentCat)) return true;
  }
  return false;
}

export class TaxonomyService {
  constructor(db) {
    this.db = db;
  }

  hasTable(tableName) {
    const res = this.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
      .get(tableName);
    return Boolean(res);
  }

  hasColumn(tableName, colName) {
    if (!this.hasTable(tableName)) return false;
    const cols = this.db.prepare(`PRAGMA table_info('${tableName}')`).all();
    return cols.some((c) => c.name === colName);
  }

  /**
   * Retrieves a single category with depth, path, product counts, and children.
   */
  getCategoryById(categoryId) {
    const cat = this.db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId);
    if (!cat) return null;

    const productCount = this.hasTable('products')
      ? this.db.prepare('SELECT COUNT(*) as c FROM products WHERE category_id = ?').get(categoryId)?.c || 0
      : 0;

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || '',
      description: cat.description || '',
      parentId: cat.parent_id || null,
      depth: cat.depth || 1,
      path: cat.path || `/${cat.slug || cat.id}`,
      sortOrder: cat.sort_order ?? cat.sortOrder ?? 0,
      isArchived: Boolean(cat.is_archived ?? 0),
      version: cat.version || 1,
      createdAt: cat.created_at || null,
      updatedAt: cat.updated_at || null,
      productCount,
    };
  }

  /**
   * Collects all descendant IDs of a category recursively.
   */
  getDescendantIds(categoryId) {
    const ids = [];
    const children = this.db.prepare('SELECT id FROM categories WHERE parent_id = ?').all(categoryId);
    for (const child of children) {
      ids.push(child.id);
      ids.push(...this.getDescendantIds(child.id));
    }
    return ids;
  }

  /**
   * Returns archive impact preview detailing direct products, descendant categories, and descendant products.
   */
  getCategoryArchiveImpact(categoryId) {
    const cat = this.getCategoryById(categoryId);
    if (!cat) throw new Error(`CATEGORY_NOT_FOUND: Kateqoriya (${categoryId}) tapılmadı.`);

    const descendantIds = this.getDescendantIds(categoryId);
    const directProductCount = cat.productCount;

    let descendantProductCount = 0;
    if (this.hasTable('products') && descendantIds.length > 0) {
      const placeholders = descendantIds.map(() => '?').join(',');
      const res = this.db
        .prepare(`SELECT COUNT(*) as c FROM products WHERE category_id IN (${placeholders})`)
        .get(...descendantIds);
      descendantProductCount = res?.c || 0;
    }

    const totalAffectedProducts = directProductCount + descendantProductCount;
    const reassignmentRequired = totalAffectedProducts > 0;

    return {
      category: cat,
      directProductCount,
      descendantCount: descendantIds.length,
      descendantIds,
      descendantProductCount,
      totalAffectedProducts,
      reassignmentRequired,
    };
  }

  /**
   * Returns all categories with parent-child hierarchy.
   * For public storefront:
   * - strictly excludes archived categories
   * - strictly preserves ancestor nodes leading to any descendant node that has products!
   */
  getCategoryTree({ publicOnly = false, includeArchived = false } = {}) {
    const hasArchived = this.hasColumn('categories', 'is_archived');
    let sql = 'SELECT * FROM categories WHERE 1=1';
    if (hasArchived) {
      if (!includeArchived && !publicOnly) {
        sql += ' AND (is_archived = 0 OR is_archived IS NULL)';
      } else if (publicOnly) {
        sql += ' AND (is_archived = 0 OR is_archived IS NULL)';
      }
    }
    sql += ' ORDER BY sort_order ASC, name ASC';

    const allCategories = this.db.prepare(sql).all();

    const productCounts = new Map();
    if (this.hasTable('products')) {
      const hasPubStatus = this.hasColumn('products', 'publication_status');
      const prodStatusCond = hasPubStatus
        ? "(status = 'published' OR publication_status = 'published')"
        : "status = 'published'";

      const pSql = publicOnly
        ? `SELECT category_id, COUNT(*) as c FROM products WHERE ${prodStatusCond} GROUP BY category_id`
        : `SELECT category_id, COUNT(*) as c FROM products GROUP BY category_id`;
      const counts = this.db.prepare(pSql).all();
      for (const row of counts) {
        productCounts.set(row.category_id, row.c);
      }
    }

    const nodeMap = new Map();
    for (const cat of allCategories) {
      const id = cat.id;
      const count = productCounts.get(id) || 0;
      nodeMap.set(id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon || '',
        description: cat.description || '',
        parentId: cat.parent_id || null,
        depth: cat.depth || 1,
        path: cat.path || `/${cat.slug || cat.id}`,
        sortOrder: cat.sort_order ?? 0,
        isArchived: Boolean(cat.is_archived ?? 0),
        version: cat.version || 1,
        productCount: count,
        totalDescendantProducts: count,
        children: [],
      });
    }

    // Link children to parents
    const roots = [];
    for (const node of nodeMap.values()) {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }

    // Recursively calculate total products (including descendant products)
    function computeDescendantTotals(node) {
      let total = node.productCount;
      for (const child of node.children) {
        total += computeDescendantTotals(child);
      }
      node.totalDescendantProducts = total;
      return total;
    }

    for (const root of roots) {
      computeDescendantTotals(root);
    }

    // If publicOnly, filter tree so that a node is kept IF AND ONLY IF totalDescendantProducts > 0
    if (publicOnly) {
      function filterPublicTree(nodes) {
        const result = [];
        for (const node of nodes) {
          if (node.totalDescendantProducts > 0) {
            const filteredChildren = filterPublicTree(node.children);
            result.push({
              id: node.id,
              name: node.name,
              slug: node.slug,
              icon: node.icon,
              description: node.description,
              parentId: node.parentId,
              depth: node.depth,
              path: node.path,
              sortOrder: node.sortOrder,
              productCount: node.productCount,
              totalDescendantProducts: node.totalDescendantProducts,
              children: filteredChildren,
            });
          }
        }
        return result;
      }

      return filterPublicTree(roots);
    }

    return roots;
  }

  /**
   * Adds a new category under an optional parent with path & depth calculation.
   */
  createCategory({ name, slug, icon = '', _description = '', parentId = null, sortOrder = 0, actor = 'admin' }) {
    if (!name || !name.trim()) {
      throw new Error('CATEGORY_NAME_REQUIRED: Kateqoriya adı mütləqdir.');
    }
    const cleanName = name.trim();
    const cleanSlug = (slug || cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')).toLowerCase();

    // Check slug collision
    const existing = this.db.prepare('SELECT id FROM categories WHERE slug = ?').get(cleanSlug);
    if (existing) {
      throw new Error(`CATEGORY_SLUG_COLLISION: "${cleanSlug}" adlı kateqoriya slug-ı artıq mövcuddur.`);
    }

    let depth = 1;
    let path = `/${cleanSlug}`;

    if (parentId) {
      const parent = this.getCategoryById(parentId);
      if (!parent) {
        throw new Error(`PARENT_CATEGORY_NOT_FOUND: Valideyn kateqoriya (${parentId}) tapılmadı.`);
      }
      if (parent.isArchived) {
        throw new Error('PARENT_IS_ARCHIVED: Arxivlənmiş kateqoriyanın altına alt-kateqoriya əlavə edilə bilməz.');
      }
      depth = (parent.depth || 1) + 1;
      if (depth > MAX_CATEGORY_DEPTH) {
        throw new Error(`MAX_DEPTH_EXCEEDED: Kateqoriya dərinliyi maksimum ${MAX_CATEGORY_DEPTH} ola bilər.`);
      }
      path = `${parent.path}/${cleanSlug}`;
    }

    const catId = `cat_${cleanSlug.replace(/[^a-z0-9_]/g, '_')}_${randomUUID().slice(0, 6)}`;

    const hasArchived = this.hasColumn('categories', 'is_archived');
    const hasCreatedAt = this.hasColumn('categories', 'created_at');
    const hasUpdatedAt = this.hasColumn('categories', 'updated_at');
    const nowIso = new Date().toISOString();

    if (hasArchived && hasCreatedAt && hasUpdatedAt) {
      this.db.prepare(`
        INSERT INTO categories (
          id, name, slug, icon, active, sort_order, parent_id, depth, path, is_archived, version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, 0, 1, ?, ?)
      `).run(catId, cleanName, cleanSlug, icon || '', sortOrder, parentId, depth, path, nowIso, nowIso);
    } else if (hasArchived && hasCreatedAt) {
      this.db.prepare(`
        INSERT INTO categories (
          id, name, slug, icon, active, sort_order, parent_id, depth, path, is_archived, version, created_at
        ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, 0, 1, ?)
      `).run(catId, cleanName, cleanSlug, icon || '', sortOrder, parentId, depth, path, nowIso);
    } else if (hasArchived) {
      this.db.prepare(`
        INSERT INTO categories (
          id, name, slug, icon, active, sort_order, parent_id, depth, path, is_archived, version
        ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, 0, 1)
      `).run(catId, cleanName, cleanSlug, icon || '', sortOrder, parentId, depth, path);
    } else if (hasCreatedAt && hasUpdatedAt) {
      this.db.prepare(`
        INSERT INTO categories (id, name, slug, icon, active, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?)
      `).run(catId, cleanName, cleanSlug, icon || '', sortOrder, nowIso, nowIso);
    } else if (hasCreatedAt) {
      this.db.prepare(`
        INSERT INTO categories (id, name, slug, icon, active, sort_order, created_at)
        VALUES (?, ?, ?, ?, 1, ?, ?)
      `).run(catId, cleanName, cleanSlug, icon || '', sortOrder, nowIso);
    } else {
      this.db.prepare(`
        INSERT INTO categories (id, name, slug, icon, active, sort_order)
        VALUES (?, ?, ?, ?, 1, ?)
      `).run(catId, cleanName, cleanSlug, icon || '', sortOrder);
    }

    this.logAudit({
      category: 'taxonomy',
      action: 'category_created',
      title: `Yeni kateqoriya yaradıldı: ${cleanName}`,
      details: `Path: ${path}, Depth: ${depth}`,
      actor,
    });

    return this.getCategoryById(catId);
  }

  /**
   * Moves a category to a new parent with cycle detection, depth validation and recursive path/depth updates.
   */
  moveCategory(categoryId, newParentId, newSortOrder, { expectedVersion, actor = 'admin' } = {}) {
    const cat = this.getCategoryById(categoryId);
    if (!cat) throw new Error(`CATEGORY_NOT_FOUND: Kateqoriya (${categoryId}) tapılmadı.`);

    if (expectedVersion !== undefined && cat.version !== expectedVersion) {
      throw new Error(`OPTIMISTIC_LOCK_CONFLICT: Kateqoriya başqa istifadəçi tərəfindən yenilənib. (Versiya: ${cat.version})`);
    }

    if (newParentId === categoryId) {
      throw new Error('CYCLE_DETECTED: Kateqoriya özü-özünün valideyni ola bilməz.');
    }

    let newParent = null;
    let targetDepth = 1;
    let basePath = '';

    if (newParentId) {
      newParent = this.getCategoryById(newParentId);
      if (!newParent) {
        throw new Error(`PARENT_NOT_FOUND: Hədəf valideyn kateqoriya (${newParentId}) tapılmadı.`);
      }
      if (newParent.isArchived) {
        throw new Error('PARENT_IS_ARCHIVED: Arxivlənmiş kateqoriyanın altına daşınma edilə bilməz.');
      }

      // Cycle detection: Check if newParent is a descendant of categoryId
      let ancestorCheck = newParent;
      while (ancestorCheck && ancestorCheck.parentId) {
        if (ancestorCheck.parentId === categoryId) {
          throw new Error('CYCLE_DETECTED: Kateqoriya öz alt-kateqoriyasının altına daşına bilməz (dövrə xətası).');
        }
        ancestorCheck = this.getCategoryById(ancestorCheck.parentId);
      }

      targetDepth = (newParent.depth || 1) + 1;
      basePath = newParent.path;
    }

    // Check maximum subtree depth
    const subtreeHeight = this.calculateSubtreeHeight(categoryId);
    if (targetDepth + subtreeHeight > MAX_CATEGORY_DEPTH) {
      throw new Error(
        `MAX_DEPTH_EXCEEDED: Daşınma nəticəsində bəzi alt-kateqoriyalar icazə verilən maksimum dərinliyi (${MAX_CATEGORY_DEPTH}) aşacaq.`
      );
    }

    const newPath = `${basePath}/${cat.slug}`;
    const finalSortOrder = newSortOrder !== undefined ? newSortOrder : cat.sortOrder;
    const nextVersion = cat.version + 1;
    const nowIso = new Date().toISOString();

    this.db.exec('BEGIN IMMEDIATE;');
    try {
      // 1. Update the category itself
      const hasUpdatedAt = this.hasColumn('categories', 'updated_at');
      if (hasUpdatedAt) {
        this.db.prepare(`
          UPDATE categories
          SET parent_id = ?, depth = ?, path = ?, sort_order = ?, version = ?, updated_at = ?
          WHERE id = ?
        `).run(newParentId || null, targetDepth, newPath, finalSortOrder, nextVersion, nowIso, categoryId);
      } else {
        this.db.prepare(`
          UPDATE categories
          SET parent_id = ?, depth = ?, path = ?, sort_order = ?, version = ?
          WHERE id = ?
        `).run(newParentId || null, targetDepth, newPath, finalSortOrder, nextVersion, categoryId);
      }

      // 2. Recursively update all descendants' path and depth
      this.updateDescendantsPathAndDepth(categoryId, newPath, targetDepth);

      this.logAudit({
        category: 'taxonomy',
        action: 'category_moved',
        title: `Kateqoriya daşındı: ${cat.name}`,
        details: `Yeni Valideyn: ${newParentId || 'Root'}, Yeni Path: ${newPath}`,
        actor,
      });

      this.db.exec('COMMIT;');
      return this.getCategoryById(categoryId);
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Helper to compute the relative subtree height of a category (0 for leaf node).
   */
  calculateSubtreeHeight(categoryId) {
    const children = this.db.prepare('SELECT id FROM categories WHERE parent_id = ? AND is_archived = 0').all(categoryId);
    if (children.length === 0) return 0;

    let maxChildHeight = 0;
    for (const child of children) {
      const h = this.calculateSubtreeHeight(child.id);
      if (h > maxChildHeight) maxChildHeight = h;
    }
    return maxChildHeight + 1;
  }

  /**
   * Recursively recalculates depth, path, and version for all descendants after a move.
   */
  updateDescendantsPathAndDepth(parentId, parentPath, parentDepth) {
    const children = this.db.prepare('SELECT id, slug FROM categories WHERE parent_id = ?').all(parentId);
    const updateStmt = this.db.prepare(`
      UPDATE categories
      SET depth = ?, path = ?, version = version + 1
      WHERE id = ?
    `);

    for (const child of children) {
      const childDepth = parentDepth + 1;
      const childPath = `${parentPath}/${child.slug}`;
      updateStmt.run(childDepth, childPath, child.id);
      this.updateDescendantsPathAndDepth(child.id, childPath, childDepth);
    }
  }

  /**
   * Reorders multiple categories in a single atomic transaction with complete sibling set validation.
   */
  reorderCategories(arg1, arg2 = {}) {
    const items = Array.isArray(arg1) ? arg1 : (arg1?.reorderItems || arg1?.items || []);
    const options = Array.isArray(arg1) ? (arg2 || {}) : (arg1 || {});
    const parentId = options.parentId;
    const actor = options.actor || 'admin';
    const ipAddress = options.ipAddress || '127.0.0.1';
    const userAgent = options.userAgent || 'TaxonomyService';

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('INVALID_REORDER_PAYLOAD: Yenidən sıralama massivi boş ola bilməz.');
    }

    let targetParentId = parentId;
    if (targetParentId === undefined && items[0]?.id) {
      const firstCat = this.db.prepare('SELECT parent_id FROM categories WHERE id = ?').get(items[0].id);
      if (firstCat) targetParentId = firstCat.parent_id;
    }

    if (targetParentId !== undefined) {
      const allSiblings = targetParentId === null
        ? this.db.prepare('SELECT id FROM categories WHERE parent_id IS NULL AND is_archived = 0').all()
        : this.db.prepare('SELECT id FROM categories WHERE parent_id = ? AND is_archived = 0').all(targetParentId);

      const payloadIdSet = new Set(items.map((r) => r.id));
      if (payloadIdSet.size !== items.length) {
        throw new Error('DUPLICATE_REORDER_IDS: Sıralama massivində təkrarlanan ID-lər var.');
      }

      if (allSiblings.length > 0 && allSiblings.length !== items.length) {
        throw new Error(`INCOMPLETE_SIBLING_SET: Sıralama üçün həmin qovluq altındakı bütün aktiv kateqoriyalar (${allSiblings.length} ədəd) tam təqdim olunmalıdır.`);
      }
      for (const sib of allSiblings) {
        if (!payloadIdSet.has(sib.id)) {
          throw new Error(`MISSING_SIBLING_IN_REORDER: Qovluq altındakı '${sib.id}' kateqoriyası sıralama siyahısında yoxdur.`);
        }
      }
    }

    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const hasUpdatedAt = this.hasColumn('categories', 'updated_at');
      const nowIso = new Date().toISOString();
      const updateStmt = hasUpdatedAt
        ? this.db.prepare(`
            UPDATE categories
            SET sort_order = ?, version = version + 1, updated_at = ?
            WHERE id = ?
          `)
        : this.db.prepare(`
            UPDATE categories
            SET sort_order = ?, version = version + 1
            WHERE id = ?
          `);

      for (const item of items) {
        if (!item.id || typeof item.sortOrder !== 'number') {
          throw new Error(`INVALID_REORDER_ITEM: Hər bir element 'id' və ədədi 'sortOrder' saxlamalıdır.`);
        }
        const exists = this.db.prepare('SELECT id FROM categories WHERE id = ?').get(item.id);
        if (!exists) {
          throw new Error(`CATEGORY_NOT_FOUND: Sıralanan kateqoriya (${item.id}) tapılmadı.`);
        }
        if (hasUpdatedAt) {
          updateStmt.run(item.sortOrder, nowIso, item.id);
        } else {
          updateStmt.run(item.sortOrder, item.id);
        }
      }

      this.logAudit({
        category: 'taxonomy',
        action: 'categories_reordered',
        title: `${items.length} kateqoriyanın sırası yeniləndi`,
        details: JSON.stringify(items.map((r) => ({ id: r.id, order: r.sortOrder }))),
        actor,
        ipAddress,
        userAgent,
      });

      this.db.exec('COMMIT;');
      return { success: true, reorderedCount: items.length, count: items.length };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Archives a category and its entire subtree in a single atomic transaction.
   * Target category cannot be the category itself or any of its descendants.
   */
  archiveCategory(categoryId, { reassignToCategoryId, actor = 'admin' } = {}) {
    const cat = this.getCategoryById(categoryId);
    if (!cat) throw new Error(`CATEGORY_NOT_FOUND: Kateqoriya (${categoryId}) tapılmadı.`);

    if (cat.isArchived) {
      return cat;
    }

    const descendantIds = this.getDescendantIds(categoryId);
    const allArchivedIds = [categoryId, ...descendantIds];

    if (reassignToCategoryId) {
      if (allArchivedIds.includes(reassignToCategoryId)) {
        throw new Error('INVALID_REASSIGNMENT_TARGET: Məhsullar arxivlənən kateqoriyanın özünə və ya onun alt-kateqoriyalarına köçürülə bilməz.');
      }
      const targetCat = this.getCategoryById(reassignToCategoryId);
      if (!targetCat || targetCat.isArchived) {
        throw new Error('INVALID_REASSIGNMENT_TARGET: Köçürüləcək hədəf kateqoriya mövcud deyil və ya arxivlənib.');
      }
    }

    // Check impact
    const impact = this.getCategoryArchiveImpact(categoryId);
    if (impact.reassignmentRequired && !reassignToCategoryId) {
      throw new Error(
        `CATEGORY_HAS_ACTIVE_PRODUCTS: "${cat.name}" və alt-kateqoriyalarında ${impact.totalAffectedProducts} aktiv məhsul var. Kateqoriyanı arxivləmək üçün məhsulların köçürüləcəyi başqa bir hədəf kateqoriya (reassignToCategoryId) seçilməlidir.`
      );
    }

    this.db.exec('BEGIN IMMEDIATE;');
    try {
      // 1. Reassign products from all categories in subtree to target
      if (impact.totalAffectedProducts > 0 && reassignToCategoryId) {
        const placeholders = allArchivedIds.map(() => '?').join(',');
        this.db.prepare(`
          UPDATE products
          SET category_id = ?
          WHERE category_id IN (${placeholders})
        `).run(reassignToCategoryId, ...allArchivedIds);
      }

      // 2. Mark category and all descendants as archived
      const archiveStmt = this.db.prepare(`
        UPDATE categories
        SET is_archived = 1, version = version + 1
        WHERE id = ?
      `);

      for (const id of allArchivedIds) {
        archiveStmt.run(id);
      }

      this.logAudit({
        category: 'taxonomy',
        action: 'category_archived',
        title: `Kateqoriya subtree arxivləndi: ${cat.name}`,
        details: reassignToCategoryId
          ? `Məhsullar (${impact.totalAffectedProducts}) köçürüldü: ${reassignToCategoryId}`
          : 'Məhsulsuz arxivləndi',
        actor,
      });

      this.db.exec('COMMIT;');
      return this.getCategoryById(categoryId);
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Restores an archived category. If its parent is archived, resets parent to root.
   */
  restoreCategory(categoryId, { actor = 'admin' } = {}) {
    const cat = this.getCategoryById(categoryId);
    if (!cat) throw new Error(`CATEGORY_NOT_FOUND: Kateqoriya (${categoryId}) tapılmadı.`);

    if (!cat.isArchived) {
      return cat;
    }

    this.db.exec('BEGIN IMMEDIATE;');
    try {
      let parentId = cat.parentId;
      let depth = 1;
      let path = `/${cat.slug}`;

      if (parentId) {
        const parent = this.getCategoryById(parentId);
        if (!parent || parent.isArchived) {
          parentId = null;
        } else {
          depth = (parent.depth || 1) + 1;
          path = `${parent.path}/${cat.slug}`;
        }
      }

      this.db.prepare(`
        UPDATE categories
        SET is_archived = 0, parent_id = ?, depth = ?, path = ?, version = version + 1
        WHERE id = ?
      `).run(parentId, depth, path, categoryId);

      this.updateDescendantsPathAndDepth(categoryId, path, depth);

      this.logAudit({
        category: 'taxonomy',
        action: 'category_restored',
        title: `Kateqoriya bərpa edildi: ${cat.name}`,
        details: `Yeni Valideyn: ${parentId || 'Root'}, Path: ${path}`,
        actor,
      });

      this.db.exec('COMMIT;');
      return this.getCategoryById(categoryId);
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  logAudit({ category, action, title, details = '', actor = 'admin', ipAddress = '127.0.0.1', userAgent = 'TaxonomyService', status = 'success' }) {
    if (!this.hasTable('audit_logs')) return;
    const detailPayload = typeof details === 'object' ? JSON.stringify({ actor, ...details }) : String(details || `Actor: ${actor}`);
    this.db.prepare(`
      INSERT INTO audit_logs (category, action, title, details, ip_address, user_agent, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(category, action, title, detailPayload, ipAddress, userAgent, status, new Date().toISOString());
  }
}
