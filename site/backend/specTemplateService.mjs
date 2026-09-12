import { randomUUID } from 'node:crypto';

export class SpecTemplateService {
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
   * Retrieves effective spec templates for a category, calculating inheritance from ancestors.
   */
  getCategorySpecTemplates(categoryId, { includeInherited = true } = {}) {
    if (!this.hasTable('category_spec_templates')) return [];

    const cat = this.db.prepare('SELECT id, parent_id FROM categories WHERE id = ?').get(categoryId);
    if (!cat) return [];

    // Collect chain from root to this category
    const categoryChain = [cat];
    let current = cat;
    while (current && current.parent_id) {
      const parent = this.db.prepare('SELECT id, parent_id FROM categories WHERE id = ?').get(current.parent_id);
      if (parent) {
        categoryChain.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }

    if (!includeInherited) {
      return this.db
        .prepare('SELECT * FROM category_spec_templates WHERE category_id = ? ORDER BY sort_order ASC, label ASC')
        .all(categoryId)
        .map((t) => ({
          id: t.id,
          categoryId: t.category_id,
          specKey: t.spec_key,
          label: t.label,
          unit: t.unit || '',
          required: Boolean(t.required),
          sortOrder: t.sort_order ?? 0,
          isInherited: false,
          sourceCategoryId: t.category_id,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }));
    }

    // Accumulate templates walking from root to leaf (leaf overrides ancestors)
    const effectiveMap = new Map();

    for (const c of categoryChain) {
      const isTargetCategory = c.id === categoryId;
      const templates = this.db
        .prepare('SELECT * FROM category_spec_templates WHERE category_id = ? ORDER BY sort_order ASC')
        .all(c.id);

      for (const t of templates) {
        effectiveMap.set(t.spec_key, {
          id: t.id,
          categoryId,
          specKey: t.spec_key,
          label: t.label,
          unit: t.unit || '',
          required: Boolean(t.required),
          sortOrder: t.sort_order ?? 0,
          isInherited: !isTargetCategory,
          sourceCategoryId: t.category_id,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        });
      }
    }

    return Array.from(effectiveMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Sets or overrides a spec template on a category.
   */
  setCategorySpecTemplate(categoryId, { specKey, label, unit = '', required = false, sortOrder = 0, actor = 'admin' }) {
    if (!specKey || !specKey.trim()) {
      throw new Error('SPEC_KEY_REQUIRED: Xüsusiyyət açarı (specKey) mütləqdir.');
    }
    if (!label || !label.trim()) {
      throw new Error('LABEL_REQUIRED: Xüsusiyyət başlığı (label) mütləqdir.');
    }

    const cleanKey = specKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const cleanLabel = label.trim();
    const cleanUnit = (unit || '').trim();
    const reqInt = required ? 1 : 0;
    const nowIso = new Date().toISOString();

    const existing = this.db
      .prepare('SELECT id FROM category_spec_templates WHERE category_id = ? AND spec_key = ?')
      .get(categoryId, cleanKey);

    const templateId = existing ? existing.id : `cst_${randomUUID().slice(0, 10)}`;

    this.db.prepare(`
      INSERT INTO category_spec_templates (
        id, category_id, spec_key, label, unit, required, sort_order, is_inherited, source_category_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
      ON CONFLICT(category_id, spec_key) DO UPDATE SET
        label = excluded.label,
        unit = excluded.unit,
        required = excluded.required,
        sort_order = excluded.sort_order,
        updated_at = excluded.updated_at
    `).run(templateId, categoryId, cleanKey, cleanLabel, cleanUnit, reqInt, sortOrder, categoryId, nowIso, nowIso);

    if (this.hasTable('categories')) {
      const hasUpdatedAt = this.hasColumn('categories', 'updated_at');
      if (hasUpdatedAt) {
        this.db.prepare('UPDATE categories SET version = version + 1, updated_at = ? WHERE id = ?').run(nowIso, categoryId);
      } else {
        this.db.prepare('UPDATE categories SET version = version + 1 WHERE id = ?').run(categoryId);
      }
    }

    this.logAudit({
      category: 'taxonomy',
      action: 'spec_template_updated',
      title: `Kateqoriya xüsusiyyət şablonu saxlanıldı: ${cleanLabel}`,
      details: `Kateqoriya: ${categoryId}, Açar: ${cleanKey}, Tələb: ${required}`,
      actor,
    });

    return {
      id: templateId,
      categoryId,
      specKey: cleanKey,
      label: cleanLabel,
      unit: cleanUnit,
      required: Boolean(required),
      sortOrder,
      isInherited: false,
      sourceCategoryId: categoryId,
      updatedAt: nowIso,
    };
  }

  /**
   * Deletes a spec template directly defined on a category.
   */
  deleteCategorySpecTemplate(categoryId, templateId, { actor = 'admin' } = {}) {
    const existing = this.db
      .prepare('SELECT * FROM category_spec_templates WHERE id = ? AND category_id = ?')
      .get(templateId, categoryId);

    if (!existing) {
      throw new Error(`SPEC_TEMPLATE_NOT_FOUND: Şablon (${templateId}) kateqoriyada tapılmadı.`);
    }

    this.db.prepare('DELETE FROM category_spec_templates WHERE id = ?').run(templateId);

    if (this.hasTable('categories')) {
      const nowIso = new Date().toISOString();
      const hasUpdatedAt = this.hasColumn('categories', 'updated_at');
      if (hasUpdatedAt) {
        this.db.prepare('UPDATE categories SET version = version + 1, updated_at = ? WHERE id = ?').run(nowIso, categoryId);
      } else {
        this.db.prepare('UPDATE categories SET version = version + 1 WHERE id = ?').run(categoryId);
      }
    }

    this.logAudit({
      category: 'taxonomy',
      action: 'spec_template_deleted',
      title: `Kateqoriya xüsusiyyət şablonu silindi: ${existing.label}`,
      details: `Kateqoriya: ${categoryId}, Açar: ${existing.spec_key}`,
      actor,
    });

    return { success: true, deletedId: templateId };
  }

  logAudit({ category = 'spec_templates', action, title, details = '', actor = 'admin', ipAddress = '127.0.0.1', userAgent = 'SpecTemplateService', status = 'success' }) {
    if (!this.hasTable('audit_logs')) return;
    const detailPayload = typeof details === 'object' ? JSON.stringify({ actor, ...details }) : String(details || `Actor: ${actor}`);
    this.db.prepare(`
      INSERT INTO audit_logs (category, action, title, details, ip_address, user_agent, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(category, action, title, detailPayload, ipAddress, userAgent, status, new Date().toISOString());
  }
}
