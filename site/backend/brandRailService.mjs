import { randomUUID } from 'node:crypto';

export function generateBrandRailEtag(settings) {
  if (!settings) return null;
  const version = settings.version || 1;
  return `"br-${settings.id || 'default'}-v${version}"`;
}

export function matchBrandRailEtag(ifMatchHeader, settings) {
  if (!ifMatchHeader || !settings) return false;
  const clean = ifMatchHeader.trim();
  if (clean === '*' || clean === '"*"') return false; // Wildcard disallowed
  const etag = generateBrandRailEtag(settings);
  if (clean === etag) return true;
  const version = settings.version || 1;
  if (clean === `"${version}"` || clean === String(version)) return true;
  if (clean === `"v${version}"` || clean === `v${version}`) return true;
  if (clean === `W/"v${version}"` || clean === `W/"${version}"`) return true;
  return false;
}

export class BrandRailService {
  constructor(db) {
    this.db = db;
  }

  _runTx(db, fn) {
    if (typeof db.transaction === 'function') {
      const tx = db.transaction(fn);
      return tx();
    }
    db.exec('BEGIN IMMEDIATE');
    try {
      const res = fn();
      db.exec('COMMIT');
      return res;
    } catch (err) {
      try {
        db.exec('ROLLBACK');
      } catch {}
      throw err;
    }
  }

  getSettings() {
    const row = this.db.prepare('SELECT * FROM brand_rail_settings LIMIT 1').get();
    if (!row) return null;
    return {
      id: row.id,
      enabled: Boolean(row.enabled),
      title: row.title || 'Brendlər',
      animationEnabled: Boolean(row.animation_enabled),
      speedSeconds: Number(row.speed_seconds) || 30,
      direction: row.direction || 'left',
      pauseOnHover: Boolean(row.pause_on_hover),
      edgeFade: Boolean(row.edge_fade),
      cardSize: row.card_size || 'md',
      sectionOrder: Number(row.section_order) || 1,
      themeVariant: row.theme_variant || 'neutral',
      version: Number(row.version) || 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  updateSettings(data, ifMatchHeader, actor = 'admin') {
    const current = this.getSettings();
    if (!current) {
      const err = new Error('NOT_FOUND: Brend lenti tənzimləmələri tapılmadı.');
      err.statusCode = 404;
      throw err;
    }

    if (!ifMatchHeader) {
      const err = new Error('PRECONDITION_REQUIRED: Concurrency nəzarəti üçün If-Match header-i tələb olunur.');
      err.statusCode = 428;
      throw err;
    }

    if (!matchBrandRailEtag(ifMatchHeader, current)) {
      const err = new Error(`PRECONDITION_FAILED: Brend lenti başqa bir istifadəçi tərəfindən yenilənib. (Cari versiya: ${current.version})`);
      err.statusCode = 412;
      throw err;
    }

    const nextVersion = current.version + 1;
    const now = new Date().toISOString();

    const enabled = data.enabled !== undefined ? (data.enabled ? 1 : 0) : (current.enabled ? 1 : 0);
    const title = (data.title !== undefined ? String(data.title).trim() : current.title) || 'Brendlər';
    const animationEnabled = data.animationEnabled !== undefined ? (data.animationEnabled ? 1 : 0) : (current.animationEnabled ? 1 : 0);
    const speedSeconds = Number(data.speedSeconds) || current.speedSeconds || 30;
    const direction = data.direction === 'right' ? 'right' : 'left';
    const pauseOnHover = data.pauseOnHover !== undefined ? (data.pauseOnHover ? 1 : 0) : (current.pauseOnHover ? 1 : 0);
    const edgeFade = data.edgeFade !== undefined ? (data.edgeFade ? 1 : 0) : (current.edgeFade ? 1 : 0);
    const cardSize = ['sm', 'md', 'lg'].includes(data.cardSize) ? data.cardSize : current.cardSize;
    const sectionOrder = Number(data.sectionOrder) || current.sectionOrder || 1;
    const themeVariant = data.themeVariant || current.themeVariant || 'neutral';

    this.db.prepare(`
      UPDATE brand_rail_settings SET
        enabled = ?,
        title = ?,
        animation_enabled = ?,
        speed_seconds = ?,
        direction = ?,
        pause_on_hover = ?,
        edge_fade = ?,
        card_size = ?,
        section_order = ?,
        theme_variant = ?,
        version = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      enabled,
      title,
      animationEnabled,
      speedSeconds,
      direction,
      pauseOnHover,
      edgeFade,
      cardSize,
      sectionOrder,
      themeVariant,
      nextVersion,
      now,
      current.id
    );

    // Record revision
    this.db.prepare(`
      INSERT INTO brand_rail_revisions (
        id, revision_type, version, action, changed_fields, diff_payload, actor, created_at
      ) VALUES (?, 'settings_update', ?, 'update', ?, ?, ?, ?)
    `).run(
      randomUUID(),
      nextVersion,
      JSON.stringify(Object.keys(data)),
      JSON.stringify({ prev: current, next: data }),
      actor,
      now
    );

    return this.getSettings();
  }

  getItems(includeDisabled = true) {
    const hasProductsTable = Boolean(
      this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'").get()
    );

    let productCountSubquery = '0';
    if (hasProductsTable) {
      const pragmaCols = this.db.prepare("PRAGMA table_info('products')").all();
      const colNames = new Set(pragmaCols.map((c) => c.name));
      const hasStatus = colNames.has('status');
      const statusFilter = hasStatus ? "AND p.status = 'published'" : '';

      if (colNames.has('brand_slug')) {
        productCountSubquery = `(SELECT count(*) FROM products p WHERE (p.brand_id = b.id OR p.brand_slug = b.slug) ${statusFilter})`;
      } else if (colNames.has('brand_id')) {
        productCountSubquery = `(SELECT count(*) FROM products p WHERE (p.brand_id = b.id OR p.brand_id = b.slug) ${statusFilter})`;
      } else if (colNames.has('brand')) {
        productCountSubquery = `(SELECT count(*) FROM products p WHERE (p.brand = b.id OR p.brand = b.name OR p.brand = b.slug) ${statusFilter})`;
      }
    }

    const query = `
      SELECT 
        bri.id,
        bri.brand_id,
        bri.enabled,
        bri.sort_order,
        bri.optional_display_label,
        bri.link_enabled,
        bri.version,
        b.name AS brand_name,
        b.slug AS brand_slug,
        b.logo AS brand_logo,
        b.origin_country,
        ${productCountSubquery} AS published_product_count
      FROM brand_rail_items bri
      JOIN brands b ON bri.brand_id = b.id
      ${includeDisabled ? '' : 'WHERE bri.enabled = 1 AND b.active = 1'}
      ORDER BY bri.sort_order ASC
    `;

    const rows = this.db.prepare(query).all();
    return rows.map((r) => ({
      id: r.id,
      brandId: r.brand_id,
      brandName: r.brand_name,
      brandSlug: r.brand_slug,
      brandLogo: r.brand_logo || '',
      originCountry: r.origin_country || '',
      enabled: Boolean(r.enabled),
      sortOrder: Number(r.sort_order) || 0,
      optionalDisplayLabel: r.optional_display_label || null,
      linkEnabled: Boolean(r.link_enabled),
      publishedProductCount: Number(r.published_product_count) || 0,
      hasPublishedProducts: Number(r.published_product_count) > 0,
    }));
  }

  updateItems(itemsList, actor = 'admin') {
    if (!Array.isArray(itemsList)) {
      const err = new Error('INVALID_PAYLOAD: items massiv olmalıdır.');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date().toISOString();

    this._runTx(this.db, () => {
      for (const item of itemsList) {
        if (!item.id && !item.brandId) continue;
        const brandId = item.brandId || item.id;
        const enabled = item.enabled !== undefined ? (item.enabled ? 1 : 0) : 1;
        const sortOrder = Number(item.sortOrder) || 0;
        const linkEnabled = item.linkEnabled !== undefined ? (item.linkEnabled ? 1 : 0) : 1;
        const displayLabel = item.optionalDisplayLabel ? String(item.optionalDisplayLabel).trim() : null;

        const existing = this.db.prepare('SELECT id FROM brand_rail_items WHERE brand_id = ?').get(brandId);
        if (existing) {
          this.db.prepare(`
            UPDATE brand_rail_items SET
              enabled = ?,
              sort_order = ?,
              optional_display_label = ?,
              link_enabled = ?,
              updated_at = ?
            WHERE id = ?
          `).run(enabled, sortOrder, displayLabel, linkEnabled, now, existing.id);
        } else {
          this.db.prepare(`
            INSERT INTO brand_rail_items (
              id, brand_id, enabled, sort_order, optional_display_label, link_enabled, version, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
          `).run(randomUUID(), brandId, enabled, sortOrder, displayLabel, linkEnabled, now, now);
        }
      }

      // Record revision
      this.db.prepare(`
        INSERT INTO brand_rail_revisions (
          id, revision_type, version, action, changed_fields, diff_payload, actor, created_at
        ) VALUES (?, 'items_reorder', 1, 'update_items', 'items', ?, ?, ?)
      `).run(
        randomUUID(),
        JSON.stringify({ itemCount: itemsList.length }),
        actor,
        now
      );
    });

    return this.getItems(true);
  }

  getPublicRail() {
    const settings = this.getSettings();
    if (!settings || !settings.enabled) {
      return {
        enabled: false,
        settings: null,
        items: [],
      };
    }

    const items = this.getItems(false);
    return {
      enabled: true,
      settings,
      items,
    };
  }

  publishToPublicDb(publicDb, _actor = 'admin') {
    if (!publicDb) {
      throw new Error('TARGET_DB_REQUIRED: Public database hədəfi mütləqdir.');
    }

    const settings = this.getSettings();
    const items = this.getItems(true);
    const now = new Date().toISOString();

    this._runTx(publicDb, () => {
      // 0. Ensure brands exist in publicDb
      const hasBrandsInDraft = Boolean(
        this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='brands'").get()
      );
      if (hasBrandsInDraft) {
        const draftBrands = this.db.prepare('SELECT * FROM brands').all();
        const hasComingSoon = publicDb
          .prepare("PRAGMA table_info('brands')")
          .all()
          .some((c) => c.name === 'coming_soon');

        for (const b of draftBrands) {
          if (hasComingSoon) {
            publicDb.prepare(`
              INSERT INTO brands (id, name, slug, origin_country, description, logo, active, coming_soon)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                slug = excluded.slug,
                origin_country = excluded.origin_country,
                description = excluded.description,
                logo = excluded.logo,
                active = excluded.active,
                coming_soon = excluded.coming_soon
            `).run(
              b.id,
              b.name,
              b.slug,
              b.origin_country || '',
              b.description || '',
              b.logo || '',
              b.active !== undefined ? b.active : 1,
              b.coming_soon !== undefined ? b.coming_soon : 0
            );
          } else {
            publicDb.prepare(`
              INSERT INTO brands (id, name, slug, origin_country, description, logo, active)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                slug = excluded.slug,
                origin_country = excluded.origin_country,
                description = excluded.description,
                logo = excluded.logo,
                active = excluded.active
            `).run(
              b.id,
              b.name,
              b.slug,
              b.origin_country || '',
              b.description || '',
              b.logo || '',
              b.active !== undefined ? b.active : 1
            );
          }
        }
      }

      // 1. Sync settings
      if (settings) {
        publicDb.prepare(`
          INSERT INTO brand_rail_settings (
            id, enabled, title, animation_enabled, speed_seconds, direction, pause_on_hover, edge_fade, card_size, section_order, theme_variant, version, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            enabled = excluded.enabled,
            title = excluded.title,
            animation_enabled = excluded.animation_enabled,
            speed_seconds = excluded.speed_seconds,
            direction = excluded.direction,
            pause_on_hover = excluded.pause_on_hover,
            edge_fade = excluded.edge_fade,
            card_size = excluded.card_size,
            section_order = excluded.section_order,
            theme_variant = excluded.theme_variant,
            version = excluded.version,
            updated_at = excluded.updated_at
        `).run(
          settings.id,
          settings.enabled ? 1 : 0,
          settings.title,
          settings.animationEnabled ? 1 : 0,
          settings.speedSeconds,
          settings.direction,
          settings.pauseOnHover ? 1 : 0,
          settings.edgeFade ? 1 : 0,
          settings.cardSize,
          settings.sectionOrder,
          settings.themeVariant,
          settings.version,
          settings.createdAt || now,
          now
        );
      }

      // 2. Sync items
      publicDb.prepare('DELETE FROM brand_rail_items').run();
      const insertItem = publicDb.prepare(`
        INSERT INTO brand_rail_items (
          id, brand_id, enabled, sort_order, optional_display_label, link_enabled, version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
      `);

      for (const it of items) {
        insertItem.run(
          it.id,
          it.brandId,
          it.enabled ? 1 : 0,
          it.sortOrder,
          it.optionalDisplayLabel || null,
          it.linkEnabled ? 1 : 0,
          now,
          now
        );
      }
    });

    return { success: true, publishedAt: now, published_items_count: items.length, itemCount: items.length };
  }

  getRevisions(limit = 20) {
    return this.db
      .prepare('SELECT * FROM brand_rail_revisions ORDER BY version DESC, created_at DESC, rowid DESC LIMIT ?')
      .all(limit);
  }

  rollback(revisionIdOrVersion, actor = 'admin') {
    let rev = this.db.prepare('SELECT * FROM brand_rail_revisions WHERE id = ?').get(revisionIdOrVersion);
    if (!rev && (typeof revisionIdOrVersion === 'number' || !isNaN(Number(revisionIdOrVersion)))) {
      rev = this.db.prepare('SELECT * FROM brand_rail_revisions WHERE version = ? ORDER BY created_at DESC LIMIT 1').get(Number(revisionIdOrVersion));
    }
    if (!rev) {
      const err = new Error('NOT_FOUND: Reviziya tapılmadı.');
      err.statusCode = 404;
      throw err;
    }

    const payload = JSON.parse(rev.diff_payload || '{}');
    const prev = payload.prev;
    if (!prev) {
      const err = new Error('INVALID_REVISION: Bərpa üçün keçmiş məlumat tapılmadı.');
      err.statusCode = 400;
      throw err;
    }

    const current = this.getSettings();
    const etag = generateBrandRailEtag(current);
    return this.updateSettings(prev, etag, actor);
  }
}
