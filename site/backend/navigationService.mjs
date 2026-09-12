import { randomUUID } from 'node:crypto';

export class NavigationService {
  constructor(db) {
    this.db = db;
  }

  generateEtag(item) {
    if (!item) return null;
    return `"nav-${item.id}-v${item.version || 1}"`;
  }

  matchEtag(ifMatch, item) {
    if (!ifMatch || !item) return false;
    const clean = ifMatch.trim();
    if (clean === '*' || clean === '"*"') return false; // Strict no wildcard bypass
    const expected = this.generateEtag(item);
    return clean === expected || clean === `"${expected.replace(/"/g, '')}"`;
  }

  validateUrl(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('URL boş ola bilməz');
    }
    const trimmed = url.trim();
    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('file:')
    ) {
      throw new Error('Təhlükəsizlik xətası: İcazə verilməyən URL sxemi');
    }
    if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
      return trimmed;
    }
    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Yalnız HTTP və HTTPS protokollarına icazə verilir');
      }
      return trimmed;
    } catch {
      throw new Error('Yanlış URL formatı');
    }
  }

  validateLabel(label) {
    if (!label || typeof label !== 'string' || !label.trim()) {
      throw new Error('Naviqasiya başlığı (label) boş ola bilməz');
    }
    const clean = label.trim();
    if (clean.length > 100) {
      throw new Error('Başlıq 100 simvoldan uzun ola bilməz');
    }
    return clean;
  }

  checkCycle(itemId, targetParentId) {
    if (!targetParentId || itemId === targetParentId) {
      if (itemId === targetParentId) {
        throw new Error('Dövrü asılılıq (cycle) aşkarlandı: Element özünün valideyni ola bilməz');
      }
      return;
    }
    let current = targetParentId;
    let depth = 0;
    while (current && depth < 20) {
      depth++;
      if (current === itemId) {
        throw new Error('Dövrü asılılıq (cycle) aşkarlandı: Element öz övladının altına köçürülə bilməz');
      }
      const parent = this.db.prepare('SELECT parent_id FROM navigation_items WHERE id = ?').get(current);
      current = parent ? parent.parent_id : null;
    }
    if (depth >= 10) {
      throw new Error('Maksimum menyu dərinliyi (10) aşıldı');
    }
  }

  getNavigationTree({ placement = null, locale = 'az', publicOnly = true, activeFlags = [] } = {}) {
    let sql = 'SELECT * FROM navigation_items WHERE 1=1';
    const params = [];

    if (placement) {
      sql += ' AND placement = ?';
      params.push(placement);
    }
    if (locale) {
      sql += ' AND locale = ?';
      params.push(locale);
    }
    if (publicOnly) {
      sql += " AND enabled = 1 AND status = 'published'";
    }

    sql += ' ORDER BY sort_order ASC, created_at ASC';
    const items = this.db.prepare(sql).all(...params);

    // Filter out feature flagged items if the flag is disabled
    const filtered = items.filter((item) => {
      if (!publicOnly) return true;
      if (!item.feature_flag) return true;
      return activeFlags.includes(item.feature_flag);
    });

    // Build hierarchy
    const itemMap = new Map();
    filtered.forEach((it) => itemMap.set(it.id, { ...it, children: [] }));

    const roots = [];
    filtered.forEach((it) => {
      const node = itemMap.get(it.id);
      if (it.parent_id && itemMap.has(it.parent_id)) {
        itemMap.get(it.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  getAllItems({ placement = null } = {}) {
    let sql = 'SELECT * FROM navigation_items';
    const params = [];
    if (placement) {
      sql += ' WHERE placement = ?';
      params.push(placement);
    }
    sql += ' ORDER BY placement ASC, sort_order ASC';
    return this.db.prepare(sql).all(...params);
  }

  getItemById(id) {
    return this.db.prepare('SELECT * FROM navigation_items WHERE id = ?').get(id);
  }

  createItem(data, actorOrOptions = {}) {
    const actor = typeof actorOrOptions === 'string' ? actorOrOptions : (actorOrOptions?.actor || 'admin');
    const id = data.id || `nav_${randomUUID().slice(0, 8)}`;
    const label = this.validateLabel(data.label);
    const href = this.validateUrl(data.href);
    const placement = data.placement || 'header_main';
    const parentId = data.parentId || data.parent_id || null;
    const iconKey = data.iconKey || data.icon_key || null;
    const locale = data.locale || 'az';
    const sortOrder =
      typeof data.sortOrder === 'number'
        ? data.sortOrder
        : typeof data.sort_order === 'number'
          ? data.sort_order
          : 0;
    const enabled = data.enabled !== undefined ? (data.enabled ? 1 : 0) : 1;
    const featureFlag = data.featureFlag || data.feature_flag || null;
    const openInNewTab = data.openInNewTab || data.open_in_new_tab ? 1 : 0;
    const status = data.status || 'published';
    const now = new Date().toISOString();

    if (parentId) {
      this.checkCycle(id, parentId);
    }

    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db
        .prepare(`
          INSERT INTO navigation_items (
            id, placement, parent_id, label, href, icon_key, locale, sort_order, enabled, feature_flag, open_in_new_tab, status, version, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `)
        .run(
          id,
          placement,
          parentId,
          label,
          href,
          iconKey,
          locale,
          sortOrder,
          enabled,
          featureFlag,
          openInNewTab,
          status,
          now,
          now
        );

      this.db
        .prepare(`
          INSERT INTO navigation_revisions (
            id, navigation_item_id, version, action, changed_fields, diff_payload, actor, created_at
          ) VALUES (?, ?, 1, 'create', '["all"]', ?, ?, ?)
        `)
        .run(randomUUID(), id, JSON.stringify(data), actor, now);

      this.db.exec('COMMIT');
      const item = this.getItemById(id);
      const etag = this.generateEtag(item);
      const res = { ...item, ok: true, item, etag };
      return res;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  updateItem(id, data, actorOrOptions = {}) {
    const actor = typeof actorOrOptions === 'string' ? actorOrOptions : (actorOrOptions?.actor || 'admin');
    const existing = this.getItemById(id);
    if (!existing) {
      throw new Error(`Naviqasiya elementi tapılmadı: ${id}`);
    }

    const label = data.label !== undefined ? this.validateLabel(data.label) : existing.label;
    const href = data.href !== undefined ? this.validateUrl(data.href) : existing.href;
    const placement = data.placement || existing.placement;
    const parentId =
      data.parentId !== undefined
        ? data.parentId
        : data.parent_id !== undefined
          ? data.parent_id
          : existing.parent_id;
    const iconKey =
      data.iconKey !== undefined
        ? data.iconKey
        : data.icon_key !== undefined
          ? data.icon_key
          : existing.icon_key;
    const locale = data.locale || existing.locale;
    const sortOrder =
      typeof data.sortOrder === 'number'
        ? data.sortOrder
        : typeof data.sort_order === 'number'
          ? data.sort_order
          : existing.sort_order;
    const enabled = data.enabled !== undefined ? (data.enabled ? 1 : 0) : existing.enabled;
    const featureFlag =
      data.featureFlag !== undefined
        ? data.featureFlag
        : data.feature_flag !== undefined
          ? data.feature_flag
          : existing.feature_flag;
    const openInNewTab =
      data.openInNewTab !== undefined
        ? data.openInNewTab
          ? 1
          : 0
        : data.open_in_new_tab !== undefined
          ? data.open_in_new_tab
            ? 1
            : 0
          : existing.open_in_new_tab;
    const status = data.status || existing.status;
    const nextVersion = (existing.version || 1) + 1;
    const now = new Date().toISOString();

    if (parentId && parentId !== existing.parent_id) {
      this.checkCycle(id, parentId);
    }

    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db
        .prepare(`
          UPDATE navigation_items SET
            placement = ?, parent_id = ?, label = ?, href = ?, icon_key = ?, locale = ?, sort_order = ?, enabled = ?, feature_flag = ?, open_in_new_tab = ?, status = ?, version = ?, updated_at = ?
          WHERE id = ?
        `)
        .run(
          placement,
          parentId,
          label,
          href,
          iconKey,
          locale,
          sortOrder,
          enabled,
          featureFlag,
          openInNewTab,
          status,
          nextVersion,
          now,
          id
        );

      this.db
        .prepare(`
          INSERT INTO navigation_revisions (
            id, navigation_item_id, version, action, changed_fields, diff_payload, actor, created_at
          ) VALUES (?, ?, ?, 'update', ?, ?, ?, ?)
        `)
        .run(
          randomUUID(),
          id,
          nextVersion,
          JSON.stringify(Object.keys(data)),
          JSON.stringify(data),
          actor,
          now
        );

      this.db.exec('COMMIT');
      const item = this.getItemById(id);
      const etag = this.generateEtag(item);
      const res = { ...item, ok: true, item, etag };
      return res;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  deleteItem(id, actorOrOptions = {}) {
    const actor = typeof actorOrOptions === 'string' ? actorOrOptions : (actorOrOptions?.actor || 'admin');
    const existing = this.getItemById(id);
    if (!existing) {
      throw new Error(`Naviqasiya elementi tapılmadı: ${id}`);
    }

    const nextVersion = (existing.version || 1) + 1;
    const now = new Date().toISOString();

    this.db.exec('BEGIN IMMEDIATE');
    try {
      // Soft delete / archive
      this.db
        .prepare(
          "UPDATE navigation_items SET status = 'archived', enabled = 0, version = ?, updated_at = ? WHERE id = ?"
        )
        .run(nextVersion, now, id);

      this.db
        .prepare(`
          INSERT INTO navigation_revisions (
            id, navigation_item_id, version, action, changed_fields, diff_payload, actor, created_at
          ) VALUES (?, ?, ?, 'archive', '["status","enabled"]', '{}', ?, ?)
        `)
        .run(randomUUID(), id, nextVersion, actor, now);

      this.db.exec('COMMIT');
      return { ok: true, id, item: { ...existing, status: 'archived', enabled: 0 } };
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  reorderItems(items, actorOrOptions = {}) {
    const actor = typeof actorOrOptions === 'string' ? actorOrOptions : (actorOrOptions?.actor || 'admin');
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Sıralama üçün etibarlı elementlər siyahısı tələb olunur');
    }

    this.db.exec('BEGIN IMMEDIATE');
    try {
      const now = new Date().toISOString();
      const updateStmt = this.db.prepare(
        'UPDATE navigation_items SET sort_order = ?, version = version + 1, updated_at = ? WHERE id = ?'
      );
      const revStmt = this.db.prepare(`
        INSERT INTO navigation_revisions (id, navigation_item_id, version, action, changed_fields, diff_payload, actor, created_at)
        VALUES (?, ?, (SELECT version FROM navigation_items WHERE id = ?), 'reorder', '["sort_order"]', ?, ?, ?)
      `);

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const order = typeof it.sortOrder === 'number' ? it.sortOrder : i + 1;
        updateStmt.run(order, now, it.id);
        revStmt.run(randomUUID(), it.id, it.id, JSON.stringify({ sortOrder: order }), actor, now);
      }

      this.db.exec('COMMIT');
      return { ok: true, count: items.length };
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  reorderSiblings(items, actorOrOptions = {}) {
    return this.reorderItems(items, actorOrOptions);
  }
}
