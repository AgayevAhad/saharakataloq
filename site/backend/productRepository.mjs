import { createHash, randomUUID } from 'node:crypto';
import { calculateCompletenessScore } from './completenessScorer.mjs';

const parseCropRect = (value) => {
  if (!value) return undefined;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

/**
 * Generates a strong, per-product ETag based on product ID, version, and content hash.
 */
export function generateProductEtag(product) {
  if (!product || !product.id) return null;
  const version = product.version || 1;
  const contentHash = createHash('sha256')
    .update(
      JSON.stringify({
        id: product.id,
        code: product.code,
        title: product.title,
        price: product.price,
        oldPrice: product.oldPrice ?? product.old_price,
        status: product.status || product.publication_status,
        category: product.category ?? product.category_id,
        brandId: product.brandId ?? product.brand_id,
        image: product.image ?? product.primary_image,
        specs: product.specs,
        media: product.media,
      })
    )
    .digest('hex')
    .slice(0, 16);

  return `"p-${product.id}-v${version}-${contentHash}"`;
}

/**
 * Custom error class for optimistic concurrency version conflict.
 */
export class ProductVersionConflictError extends Error {
  constructor(message, currentProduct, currentEtag) {
    super(message);
    this.name = 'ProductVersionConflictError';
    this.code = 'PRODUCT_VERSION_CONFLICT';
    this.currentProduct = currentProduct;
    this.currentVersion = currentProduct?.version || 1;
    this.currentEtag = currentEtag;
  }
}

export class ProductRepository {
  constructor(db) {
    this.db = db;
  }

  hasTable(tableName) {
    const r = this.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
      .get(tableName);
    return Boolean(r);
  }

  tableColumns(tableName) {
    if (!this.hasTable(tableName)) return [];
    return this.db
      .prepare(`PRAGMA table_info('${tableName}')`)
      .all()
      .map((column) => column.name);
  }

  replaceLegacyRelations(productId, productData) {
    if (Array.isArray(productData.media) && this.hasTable('product_media')) {
      const mediaColumns = this.tableColumns('product_media');
      const supportsCrop = mediaColumns.includes('crop_rect');
      const supportsOriginalUrl = mediaColumns.includes('original_url');
      this.db.prepare('DELETE FROM product_media WHERE product_id = ?').run(productId);

      const columns = [
        'id',
        'product_id',
        'media_type',
        'url',
        'alt_text',
        'original_name',
        'poster',
        'object_position',
        'fit_mode',
        ...(supportsCrop ? ['crop_rect'] : []),
        ...(supportsOriginalUrl ? ['original_url'] : []),
        'sort_order',
      ];
      const placeholders = columns.map(() => '?').join(', ');
      const insertMedia = this.db.prepare(
        `INSERT INTO product_media (${columns.join(', ')}) VALUES (${placeholders})`
      );

      productData.media.forEach((media, index) => {
        const mediaType =
          media.type ||
          media.media_type ||
          (media.url && /\.(mp4|webm|ogg|mov)(?:$|\?)/i.test(media.url) ? 'video' : 'image');
        const values = [
          media.id || `${productId}-media-${index + 1}`,
          productId,
          mediaType,
          media.url || '',
          media.alt || media.altText || productData.title || '',
          media.originalName || '',
          media.poster || '',
          media.objectPosition || 'center',
          media.fitMode || 'contain',
          ...(supportsCrop ? [media.cropRect ? JSON.stringify(media.cropRect) : null] : []),
          ...(supportsOriginalUrl ? [media.originalUrl || media.url || null] : []),
          index,
        ];
        insertMedia.run(...values);
      });
    }

    if (Array.isArray(productData.specs) && this.hasTable('product_specs')) {
      this.db.prepare('DELETE FROM product_specs WHERE product_id = ?').run(productId);
      const insertSpec = this.db.prepare(`
        INSERT INTO product_specs (
          id, product_id, name, value, description, icon, spec_group, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      productData.specs.forEach((spec, index) => {
        insertSpec.run(
          spec.id || `${productId}-spec-${index + 1}`,
          productId,
          spec.name || '',
          spec.value || '',
          spec.description || '',
          spec.icon || '',
          spec.group || 'Əsas',
          index
        );
      });
    }

    if (Array.isArray(productData.highlights) && this.hasTable('product_highlights')) {
      this.db.prepare('DELETE FROM product_highlights WHERE product_id = ?').run(productId);
      const insertHighlight = this.db.prepare(
        'INSERT INTO product_highlights(product_id, value, sort_order) VALUES (?, ?, ?)'
      );
      productData.highlights.forEach((value, index) => {
        insertHighlight.run(productId, value, index);
      });
    }
  }

  getProductById(id) {
    const p = this.db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!p) return null;

    let specs = [];
    let media = [];

    const hasPsv = this.hasTable('product_spec_values');
    const hasPmv = this.hasTable('product_media_variants');

    if (hasPsv) {
      const psvRows = this.db
        .prepare('SELECT * FROM product_spec_values WHERE product_id = ? ORDER BY created_at ASC')
        .all(id);
      specs = psvRows.map((s) => ({
        id: s.legacy_spec_id || s.id,
        name: s.raw_name,
        value: s.raw_value,
        normalizedText: s.normalized_value_text,
        normalizedNumber: s.normalized_value_number,
        normalizedBoolean: s.normalized_value_boolean,
        unit: s.unit,
      }));
    } else if (this.hasTable('product_specs')) {
      const psRows = this.db
        .prepare('SELECT * FROM product_specs WHERE product_id = ? ORDER BY sort_order ASC, id ASC')
        .all(id);
      specs = psRows.map((s) => ({
        id: s.id,
        name: s.name,
        value: s.value,
        description: s.description,
        group: s.spec_group,
      }));
    }

    if (hasPmv && this.hasTable('media_assets')) {
      const pmvRows = this.db
        .prepare(
          `
          SELECT pmv.*, ma.type AS media_type, ma.url, ma.original_name
          FROM product_media_variants pmv
          JOIN media_assets ma ON ma.id = pmv.media_id
          WHERE pmv.product_id = ?
          ORDER BY pmv.sort_order ASC, pmv.id ASC
        `
        )
        .all(id);
      media = pmvRows.map((m) => ({
        id: m.legacy_media_id || m.id,
        mediaId: m.media_id,
        type: m.media_type || 'image',
        url: m.url || '',
        originalName: m.original_name || undefined,
        objectPosition: m.object_position,
        fitMode: m.fit_mode,
        isPrimary: Boolean(m.is_primary),
        alt: m.alt_text,
        poster: m.poster_url,
      }));
    } else if (this.hasTable('product_media')) {
      const pmRows = this.db
        .prepare('SELECT * FROM product_media WHERE product_id = ? ORDER BY sort_order ASC, id ASC')
        .all(id);
      media = pmRows.map((m) => ({
        id: m.id,
        type: m.media_type || 'image',
        url: m.url,
        alt: m.alt_text,
        poster: m.poster,
        originalName: m.original_name || undefined,
        objectPosition: m.object_position,
        fitMode: m.fit_mode,
        cropRect: parseCropRect(m.crop_rect),
        originalUrl: m.original_url || undefined,
      }));
    }

    const highlights = this.hasTable('product_highlights')
      ? this.db
          .prepare(
            'SELECT value FROM product_highlights WHERE product_id = ? ORDER BY sort_order ASC'
          )
          .all(id)
          .map((row) => row.value)
      : [];

    const product = {
      id: p.id,
      code: p.code || '',
      title: p.title || '',
      brandId: p.brand_id || 'ardo',
      category: p.category_id || p.category || 'hood',
      categoryId: p.category_id || p.category || 'hood',
      category_id: p.category_id || p.category || 'hood',
      categoryName: p.category_name || '',
      image: p.primary_image || p.image || '',
      originalImage: p.original_image || undefined,
      cropRect: parseCropRect(p.crop_rect),
      isFeatured: Boolean(p.is_featured),
      isNew: Boolean(p.is_new),
      badgeText: p.badge_text || '',
      badgeColor: p.badge_color || 'red',
      shortDesc: p.short_description || p.short_desc || '',
      description: p.description || '',
      manufacturingCountry: p.manufacturing_country || '',
      status: p.status || 'draft',
      price: p.price ?? undefined,
      oldPrice: p.old_price ?? p.oldPrice ?? undefined,
      currency: p.currency || '₼',
      stockStatus: p.stock_status || 'in_stock',
      imagePosition: p.image_position || 'center',
      imageFit: p.image_fit || 'contain',
      version: p.version || 1,
      completenessScore: p.completeness_score || 0,
      specs,
      highlights,
      media,
      gallery: media
        .filter((m) => m.type !== 'video')
        .map((m) => m.url)
        .filter(Boolean),
      createdAt: p.created_at || '',
      updatedAt: p.updated_at || '',
    };

    return {
      product,
      etag: generateProductEtag(product),
    };
  }

  createProduct(productData, actor = 'admin') {
    const id = productData.id || `prod_${randomUUID().slice(0, 12)}`;
    const version = 1;
    const completeness = calculateCompletenessScore(productData);
    const nowIso = new Date().toISOString();

    this.db.exec('BEGIN IMMEDIATE');
    try {
      const prodCols = this.db
        .prepare("PRAGMA table_info('products')")
        .all()
        .map((c) => c.name);

      const hasShortDesc = prodCols.includes('short_description');
      const hasCatId = prodCols.includes('category_id');
      const hasBrandId = prodCols.includes('brand_id');
      const hasPrimaryImg = prodCols.includes('primary_image');

      if (hasShortDesc && hasCatId && hasBrandId && hasPrimaryImg) {
        const columnValues = {
          id,
          code: productData.code || '',
          title: productData.title || '',
          brand_id: productData.brandId || productData.brand_id || 'ardo',
          category_id:
            productData.categoryId || productData.category_id || productData.category || 'hood',
          primary_image: productData.image || '',
          is_featured: productData.isFeatured ? 1 : 0,
          is_new: productData.isNew ? 1 : 0,
          badge_text: productData.badgeText || '',
          badge_color: productData.badgeColor || 'red',
          short_description: productData.shortDesc || '',
          description: productData.description || '',
          manufacturing_country: productData.manufacturingCountry || '',
          status: productData.status || 'draft',
          price: productData.price ?? null,
          old_price: productData.oldPrice ?? null,
          currency: productData.currency || '₼',
          stock_status: productData.stockStatus || 'in_stock',
          image_position: productData.imagePosition || 'center',
          image_fit: productData.imageFit || 'contain',
          crop_rect: productData.cropRect ? JSON.stringify(productData.cropRect) : null,
          original_image: productData.originalImage || null,
          version,
          publication_status: productData.status === 'published' ? 'published' : 'draft',
          completeness_score: completeness.score,
          created_at: nowIso,
          updated_at: nowIso,
        };
        const insertColumns = Object.keys(columnValues).filter((column) =>
          prodCols.includes(column)
        );
        this.db
          .prepare(
            `INSERT INTO products (${insertColumns.join(', ')}) VALUES (${insertColumns.map(() => '?').join(', ')})`
          )
          .run(...insertColumns.map((column) => columnValues[column]));
      } else {
        this.db
          .prepare(
            `
          INSERT INTO products (
            id, code, title, category, category_name, brand_id, image, short_desc,
            description, price, old_price, status, version, publication_status, completeness_score
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            id,
            productData.code || '',
            productData.title || '',
            productData.categoryId || productData.category_id || productData.category || '',
            productData.categoryName || '',
            productData.brandId || productData.brand_id || '',
            productData.image || '',
            productData.shortDesc || '',
            productData.description || '',
            productData.price ?? null,
            productData.oldPrice ?? null,
            productData.status || 'draft',
            version,
            productData.status === 'published' ? 'published' : 'draft',
            completeness.score
          );
      }

      this.replaceLegacyRelations(id, productData);

      if (this.hasTable('product_revisions')) {
        this.db
          .prepare(
            `
          INSERT INTO product_revisions (id, product_id, version, action, changed_fields, diff_payload, actor, created_at)
          VALUES (?, ?, ?, 'create', '["all"]', ?, ?, ?)
        `
          )
          .run(randomUUID(), id, version, JSON.stringify(productData), actor, nowIso);
      }

      this.db.exec('COMMIT');
      return this.getProductById(id);
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  updateProduct(id, productData, actor = 'admin', expectedEtagOrVersion = null) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const current = this.db.prepare('SELECT * FROM products WHERE id = ?').get(id);
      if (!current) {
        throw new Error(`Product with ID ${id} not found.`);
      }

      const currentProductFull = this.getProductById(id);
      const currentVersion = current.version || 1;
      const currentEtag = currentProductFull.etag;

      // Optimistic Concurrency Check
      if (expectedEtagOrVersion !== null && expectedEtagOrVersion !== undefined) {
        let matches = false;
        if (typeof expectedEtagOrVersion === 'number') {
          matches = expectedEtagOrVersion === currentVersion;
        } else if (typeof expectedEtagOrVersion === 'string') {
          matches =
            expectedEtagOrVersion === currentEtag ||
            expectedEtagOrVersion === String(currentVersion);
        }

        if (!matches) {
          throw new ProductVersionConflictError(
            `Məhsul (ID: ${id}) başqa istifadəçi tərəfindən yenilənib. Cari versiya: ${currentVersion}`,
            currentProductFull.product,
            currentEtag
          );
        }
      }

      const newVersion = currentVersion + 1;
      const completeness = calculateCompletenessScore(productData);
      const nowIso = new Date().toISOString();

      const prodCols = this.tableColumns('products');
      const hasVersion = prodCols.includes('version');
      const hasPubStatus = prodCols.includes('publication_status');
      const hasCompleteness = prodCols.includes('completeness_score');

      if (prodCols.includes('short_description') && prodCols.includes('category_id')) {
        const setClauses = [
          'code = ?',
          'title = ?',
          'brand_id = ?',
          'category_id = ?',
          'primary_image = ?',
          'is_featured = ?',
          'is_new = ?',
          'badge_text = ?',
          'badge_color = ?',
          'short_description = ?',
          'description = ?',
          'manufacturing_country = ?',
          'price = ?',
          'old_price = ?',
          'currency = ?',
          'stock_status = ?',
          'status = ?',
          'updated_at = ?',
        ];
        const params = [
          productData.code ?? current.code,
          productData.title ?? current.title,
          productData.brandId ?? productData.brand_id ?? current.brand_id,
          productData.categoryId ??
            productData.category_id ??
            productData.category ??
            current.category_id,
          productData.image ?? current.primary_image,
          productData.isFeatured === undefined
            ? current.is_featured
            : productData.isFeatured
              ? 1
              : 0,
          productData.isNew === undefined ? current.is_new : productData.isNew ? 1 : 0,
          productData.badgeText ?? current.badge_text,
          productData.badgeColor ?? current.badge_color,
          productData.shortDesc ?? current.short_description,
          productData.description ?? current.description ?? '',
          productData.manufacturingCountry ?? current.manufacturing_country,
          productData.price ?? current.price,
          productData.oldPrice ?? current.old_price,
          productData.currency ?? current.currency,
          productData.stockStatus ?? current.stock_status,
          productData.status ?? current.status,
          nowIso,
        ];

        if (hasVersion) {
          setClauses.push('version = ?');
          params.push(newVersion);
        }
        if (hasPubStatus) {
          setClauses.push('publication_status = ?');
          params.push(productData.status === 'published' ? 'published' : 'draft');
        }
        if (hasCompleteness) {
          setClauses.push('completeness_score = ?');
          params.push(completeness.score);
        }
        if (prodCols.includes('crop_rect')) {
          setClauses.push('crop_rect = ?');
          const cr = productData.cropRect !== undefined ? productData.cropRect : current.crop_rect;
          params.push(cr ? (typeof cr === 'object' ? JSON.stringify(cr) : String(cr)) : null);
        }
        if (prodCols.includes('image_position')) {
          setClauses.push('image_position = ?');
          params.push(
            productData.imagePosition ??
              productData.image_position ??
              current.image_position ??
              null
          );
        }
        if (prodCols.includes('image_fit')) {
          setClauses.push('image_fit = ?');
          params.push(productData.imageFit ?? productData.image_fit ?? current.image_fit ?? null);
        }
        if (prodCols.includes('original_image')) {
          setClauses.push('original_image = ?');
          params.push(
            productData.originalImage ??
              productData.original_image ??
              current.original_image ??
              null
          );
        }

        params.push(id);
        this.db.prepare(`UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
      } else {
        const setClauses = [
          'code = ?',
          'title = ?',
          'category = ?',
          'category_name = ?',
          'brand_id = ?',
          'image = ?',
          'short_desc = ?',
          'description = ?',
          'price = ?',
          'old_price = ?',
          'status = ?',
        ];
        const params = [
          productData.code ?? current.code,
          productData.title ?? current.title,
          productData.category ?? current.category,
          productData.categoryName ?? current.category_name,
          productData.brandId ?? current.brand_id,
          productData.image ?? current.image,
          productData.shortDesc ?? current.short_desc,
          productData.description ?? current.description,
          productData.price ?? current.price,
          productData.oldPrice ?? current.old_price,
          productData.status ?? current.status,
        ];

        if (hasVersion) {
          setClauses.push('version = ?');
          params.push(newVersion);
        }
        if (hasPubStatus) {
          setClauses.push('publication_status = ?');
          params.push(productData.status === 'published' ? 'published' : 'draft');
        }
        if (hasCompleteness) {
          setClauses.push('completeness_score = ?');
          params.push(completeness.score);
        }
        if (prodCols.includes('crop_rect')) {
          setClauses.push('crop_rect = ?');
          const cr = productData.cropRect !== undefined ? productData.cropRect : current.crop_rect;
          params.push(cr ? (typeof cr === 'object' ? JSON.stringify(cr) : String(cr)) : null);
        }
        if (prodCols.includes('image_position')) {
          setClauses.push('image_position = ?');
          params.push(
            productData.imagePosition ??
              productData.image_position ??
              current.image_position ??
              null
          );
        }
        if (prodCols.includes('image_fit')) {
          setClauses.push('image_fit = ?');
          params.push(productData.imageFit ?? productData.image_fit ?? current.image_fit ?? null);
        }
        if (prodCols.includes('original_image')) {
          setClauses.push('original_image = ?');
          params.push(
            productData.originalImage ??
              productData.original_image ??
              current.original_image ??
              null
          );
        }

        params.push(id);
        this.db.prepare(`UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
      }

      this.replaceLegacyRelations(id, productData);

      if (this.hasTable('product_revisions')) {
        this.db
          .prepare(
            `
          INSERT INTO product_revisions (id, product_id, version, action, changed_fields, diff_payload, actor, created_at)
          VALUES (?, ?, ?, 'update', '["updated"]', ?, ?, ?)
        `
          )
          .run(randomUUID(), id, newVersion, JSON.stringify(productData), actor, nowIso);
      }

      this.db.exec('COMMIT');
      return this.getProductById(id);
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  deleteProduct(id, actor = 'admin', expectedEtagOrVersion = null) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const current = this.getProductById(id);
      if (!current) {
        throw new Error(`Product with ID ${id} not found.`);
      }

      if (expectedEtagOrVersion !== null && expectedEtagOrVersion !== undefined) {
        if (
          expectedEtagOrVersion !== current.etag &&
          expectedEtagOrVersion !== current.product.version &&
          expectedEtagOrVersion !== String(current.product.version)
        ) {
          throw new ProductVersionConflictError(
            `Məhsul silinə bilmədi: versiya uyğunsuzluğu.`,
            current.product,
            current.etag
          );
        }
      }

      if (this.hasTable('product_revisions')) {
        this.db
          .prepare(
            `
          INSERT INTO product_revisions (id, product_id, version, action, changed_fields, diff_payload, actor, created_at)
          VALUES (?, ?, ?, 'delete', '["deleted"]', ?, ?, ?)
        `
          )
          .run(
            randomUUID(),
            id,
            (current.product.version || 1) + 1,
            JSON.stringify(current.product),
            actor,
            new Date().toISOString()
          );
      }

      this.db.prepare('DELETE FROM products WHERE id = ?').run(id);

      this.db.exec('COMMIT');
      return { success: true, id };
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  getProductRevisions(productId) {
    if (!this.hasTable('product_revisions')) return [];
    return this.db
      .prepare(
        `
      SELECT * FROM product_revisions WHERE product_id = ? ORDER BY version DESC
    `
      )
      .all(productId);
  }
}
