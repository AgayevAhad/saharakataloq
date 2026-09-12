import { DatabaseSync } from 'node:sqlite';
import { randomUUID, createHash } from 'node:crypto';

export const MIN_COMPLETENESS_SCORE = Math.min(
  100,
  Math.max(0, parseInt(process.env.PIM_MIN_COMPLETENESS_SCORE || '50', 10) || 50)
);

export class ScheduledPublicationWorker {
  constructor(arg1 = {}, arg2 = null, arg3 = {}) {
    if (arg1 && typeof arg1.prepare === 'function') {
      // Positional args: (publicDb, draftDb, options) or (draftDb, publicDb, options)
      this.publicDb = arg1;
      this.draftDb = arg2;
      const opts = arg3 || {};
      this.workerId = opts.workerId || `worker_${process.pid}`;
      this.leaseTimeoutMs = opts.leaseTimeoutMs || 5 * 60 * 1000;
      this.backoffBaseSeconds = opts.backoffBaseSeconds || 0;
      this.minCompletenessScore =
        typeof opts.minCompletenessScore === 'number'
          ? Math.min(100, Math.max(0, opts.minCompletenessScore))
          : MIN_COMPLETENESS_SCORE;
    } else {
      // Options object: { draftDb, publicDb, workerId, ... }
      const opts = arg1 || {};
      this.draftDb = opts.draftDb;
      this.publicDb = opts.publicDb;
      this.workerId = opts.workerId || `worker_${process.pid}`;
      this.leaseTimeoutMs = opts.leaseTimeoutMs || 5 * 60 * 1000;
      this.backoffBaseSeconds = opts.backoffBaseSeconds || 0;
      this.minCompletenessScore =
        typeof opts.minCompletenessScore === 'number'
          ? Math.min(100, Math.max(0, opts.minCompletenessScore))
          : MIN_COMPLETENESS_SCORE;
    }
    this.running = false;
    this.timer = null;
  }

  start(intervalMs = 15000) {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      try {
        this.processPendingJobs();
      } catch (err) {
        console.error('ScheduledPublicationWorker timer execution error:', err);
      }
    }, intervalMs);
    this.timer.unref();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  isRunning() {
    return Boolean(this.timer);
  }

  hasTable(db, tableName) {
    if (!db) return false;
    const r = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
      .get(tableName);
    return Boolean(r);
  }

  /**
   * Recovers expired worker leases for jobs stuck in 'publishing'.
   */
  recoverExpiredLeases() {
    if (!this.hasTable(this.draftDb, 'publication_jobs')) return 0;
    const thresholdIso = new Date(Date.now() - this.leaseTimeoutMs).toISOString();

    const recovered = this.draftDb.prepare(`
      UPDATE publication_jobs
      SET state = 'retry_pending', locked_by_worker = NULL, locked_at = NULL,
          last_error = 'Worker lease expired; recovered automatically'
      WHERE state = 'publishing' AND (locked_at IS NULL OR locked_at < ?)
    `).run(thresholdIso);

    return recovered.changes || 0;
  }

  /**
   * Schedules a publication job in the outbox table.
   */
  scheduleProductPublication(productId, scheduledAt, productVersion, idempotencyKey) {
    const id = `pubjob_${randomUUID().slice(0, 12)}`;
    const version = productVersion || 1;
    const payloadHash = createHash('sha256').update(`${productId}:${version}:${scheduledAt}`).digest('hex');

    this.draftDb.prepare(`
      INSERT INTO publication_jobs (
        id, product_id, scheduled_at, state, payload_hash, product_version,
        idempotency_key, retry_count, max_retries, created_at
      ) VALUES (?, ?, ?, 'scheduled', ?, ?, ?, 0, 3, ?)
    `).run(
      id,
      productId,
      scheduledAt,
      payloadHash,
      version,
      idempotencyKey || id,
      new Date().toISOString()
    );

    const prodCols = this.draftDb.prepare("PRAGMA table_info('products')").all().map((c) => c.name);
    if (prodCols.includes('scheduled_publish_at')) {
      this.draftDb.prepare(`
        UPDATE products SET scheduled_publish_at = ?, publication_status = 'scheduled' WHERE id = ?
      `).run(scheduledAt, productId);
    }

    return { id, productId, scheduledAt, state: 'scheduled' };
  }

  /**
   * Processes all pending scheduled publication jobs with transactional outbox safety,
   * exponential backoff, and idempotent public promotion without INSERT OR REPLACE.
   */
  processPendingJobs() {
    if (this.running) return { processed: 0, skipped: 'worker_busy' };
    this.running = true;

    try {
      if (!this.hasTable(this.draftDb, 'publication_jobs')) {
        return { processed: 0, skipped: 'no_outbox_table' };
      }

      this.recoverExpiredLeases();

      const nowIso = new Date().toISOString();

      const pendingJobs = this.draftDb.prepare(`
        SELECT * FROM publication_jobs
        WHERE state IN ('scheduled', 'retry_pending')
          AND scheduled_at <= ?
        ORDER BY scheduled_at ASC
      `).all(nowIso);

      let processedCount = 0;

      for (const job of pendingJobs) {
        try {
          // Lock job to current worker
          const lockRes = this.draftDb.prepare(`
            UPDATE publication_jobs
            SET state = 'publishing', locked_by_worker = ?, locked_at = ?
            WHERE id = ? AND state IN ('scheduled', 'retry_pending')
          `).run(this.workerId, nowIso, job.id);

          if (lockRes.changes === 0) continue; // Concurrently picked up by another worker

          const product = this.draftDb.prepare('SELECT * FROM products WHERE id = ?').get(job.product_id);
          if (!product) {
            throw new Error(`Draft product ${job.product_id} not found.`);
          }

          // 1. Verify product version matches
          const currentProdVersion = product.version || 1;
          if (job.product_version !== currentProdVersion) {
            throw new Error(
              `PRODUCT_VERSION_MISMATCH: Job version ${job.product_version} !== draft product version ${currentProdVersion}`
            );
          }

          // 2. Verify canonical payload hash
          const expectedPayloadHash = createHash('sha256')
            .update(`${job.product_id}:${job.product_version}:${job.scheduled_at}`)
            .digest('hex');
          if (job.payload_hash !== expectedPayloadHash) {
            throw new Error(
              `PAYLOAD_HASH_MISMATCH: Job payload hash ${job.payload_hash} does not match expected ${expectedPayloadHash}`
            );
          }

          // 3. Verify minimum completeness score threshold
          const completenessScore = product.completeness_score ?? 100;
          if (completenessScore < this.minCompletenessScore) {
            throw new Error(
              `COMPLETENESS_SCORE_TOO_LOW: Product completeness ${completenessScore} is below threshold ${this.minCompletenessScore}`
            );
          }

          // Promote to public database idempotently without INSERT OR REPLACE
          if (this.publicDb) {
            this.publicDb.exec('BEGIN IMMEDIATE');
            try {
              const pubProdCols = this.publicDb.prepare("PRAGMA table_info('products')").all().map((c) => c.name);
              const existsInPub = this.publicDb.prepare('SELECT id FROM products WHERE id = ?').get(product.id);

              const newVersion = (product.version || 1) + 1;
              const now = new Date().toISOString();

              // Ensure brand exists in publicDb if brands table exists
              if (this.hasTable(this.draftDb, 'brands') && this.hasTable(this.publicDb, 'brands') && product.brand_id) {
                const draftBrand = this.draftDb.prepare('SELECT * FROM brands WHERE id = ?').get(product.brand_id);
                if (draftBrand) {
                  const pubBrand = this.publicDb.prepare('SELECT id FROM brands WHERE id = ?').get(draftBrand.id);
                  if (!pubBrand) {
                    const pubBrandCols = this.publicDb.prepare("PRAGMA table_info('brands')").all().map((c) => c.name);
                    const brandColsToInsert = ['id', 'name', 'slug'];
                    const brandVals = [draftBrand.id, draftBrand.name, draftBrand.slug || draftBrand.id];

                    if (pubBrandCols.includes('origin_country')) {
                      brandColsToInsert.push('origin_country');
                      brandVals.push(draftBrand.origin_country || draftBrand.originCountry || draftBrand.country || '');
                    }
                    if (pubBrandCols.includes('description')) {
                      brandColsToInsert.push('description');
                      brandVals.push(draftBrand.description || '');
                    }
                    if (pubBrandCols.includes('logo_url')) {
                      brandColsToInsert.push('logo_url');
                      brandVals.push(draftBrand.logo_url || draftBrand.logo || '');
                    } else if (pubBrandCols.includes('logo')) {
                      brandColsToInsert.push('logo');
                      brandVals.push(draftBrand.logo || draftBrand.logo_url || '');
                    }
                    if (pubBrandCols.includes('sort_order')) {
                      brandColsToInsert.push('sort_order');
                      brandVals.push(draftBrand.sort_order || 0);
                    }
                    if (pubBrandCols.includes('active')) {
                      brandColsToInsert.push('active');
                      brandVals.push(draftBrand.active ?? 1);
                    }

                    const qMarks = brandColsToInsert.map(() => '?').join(', ');
                    this.publicDb.prepare(`INSERT INTO brands (${brandColsToInsert.join(', ')}) VALUES (${qMarks})`).run(...brandVals);
                  }
                }
              }

              // Ensure category exists in publicDb if categories table exists
              const categoryId = product.category_id || product.category;
              if (this.hasTable(this.draftDb, 'categories') && this.hasTable(this.publicDb, 'categories') && categoryId) {
                const draftCat = this.draftDb.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId);
                if (draftCat) {
                  const pubCat = this.publicDb.prepare('SELECT id FROM categories WHERE id = ?').get(draftCat.id);
                  if (!pubCat) {
                    const pubCatCols = this.publicDb.prepare("PRAGMA table_info('categories')").all().map((c) => c.name);
                    const catColsToInsert = ['id', 'name', 'slug'];
                    const catVals = [draftCat.id, draftCat.name, draftCat.slug || draftCat.id];
                    if (pubCatCols.includes('icon')) {
                      catColsToInsert.push('icon');
                      catVals.push(draftCat.icon || '');
                    }
                    if (pubCatCols.includes('sort_order')) {
                      catColsToInsert.push('sort_order');
                      catVals.push(draftCat.sort_order || 0);
                    }
                    if (pubCatCols.includes('active')) {
                      catColsToInsert.push('active');
                      catVals.push(draftCat.active ?? 1);
                    }
                    const catQMarks = catColsToInsert.map(() => '?').join(', ');
                    this.publicDb.prepare(`INSERT INTO categories (${catColsToInsert.join(', ')}) VALUES (${catQMarks})`).run(...catVals);
                  }
                }
              }

              if (existsInPub) {
                // Idempotent UPDATE
                if (pubProdCols.includes('short_description') && pubProdCols.includes('category_id')) {
                  this.publicDb.prepare(`
                    UPDATE products
                    SET code = ?, title = ?, brand_id = ?, category_id = ?, primary_image = ?,
                        is_featured = ?, is_new = ?, badge_text = ?, badge_color = ?,
                        price = ?, old_price = ?, currency = ?, stock_status = ?,
                        short_description = ?, manufacturing_country = ?, status = 'published',
                        version = ?, publication_status = 'published', completeness_score = ?,
                        updated_at = ?
                    WHERE id = ?
                  `).run(
                    product.code,
                    product.title,
                    product.brand_id,
                    product.category_id || product.category || 'hood',
                    product.primary_image || product.image || '',
                    product.is_featured ? 1 : 0,
                    product.is_new ? 1 : 0,
                    product.badge_text || '',
                    product.badge_color || 'red',
                    product.price,
                    product.old_price ?? product.oldPrice ?? null,
                    product.currency || '₼',
                    product.stock_status || 'in_stock',
                    product.short_description || product.short_desc || '',
                    product.manufacturing_country || '',
                    newVersion,
                    product.completeness_score ?? 100,
                    now,
                    product.id
                  );
                } else {
                  this.publicDb.prepare(`
                    UPDATE products
                    SET code = ?, title = ?, category = ?, category_name = ?, brand_id = ?, image = ?,
                        short_desc = ?, description = ?, price = ?, old_price = ?, status = 'published',
                        version = ?, publication_status = 'published', completeness_score = ?
                    WHERE id = ?
                  `).run(
                    product.code,
                    product.title,
                    product.category || 'hood',
                    product.category_name || '',
                    product.brand_id || 'ardo',
                    product.image || product.primary_image || '',
                    product.short_desc || product.short_description || '',
                    product.description || '',
                    product.price,
                    product.old_price ?? product.oldPrice ?? null,
                    newVersion,
                    product.completeness_score ?? 100,
                    product.id
                  );
                }
              } else {
                // Idempotent INSERT
                if (pubProdCols.includes('short_description') && pubProdCols.includes('category_id')) {
                  this.publicDb.prepare(`
                    INSERT INTO products (
                      id, code, title, brand_id, category_id, primary_image, is_featured, is_new,
                      badge_text, badge_color, price, old_price, currency, stock_status,
                      short_description, manufacturing_country, status, version, publication_status,
                      completeness_score, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, 'published', ?, ?, ?)
                  `).run(
                    product.id,
                    product.code,
                    product.title,
                    product.brand_id,
                    product.category_id || product.category || 'hood',
                    product.primary_image || product.image || '',
                    product.is_featured ? 1 : 0,
                    product.is_new ? 1 : 0,
                    product.badge_text || '',
                    product.badge_color || 'red',
                    product.price,
                    product.old_price ?? product.oldPrice ?? null,
                    product.currency || '₼',
                    product.stock_status || 'in_stock',
                    product.short_description || product.short_desc || '',
                    product.manufacturing_country || '',
                    newVersion,
                    product.completeness_score ?? 100,
                    product.created_at || now,
                    now
                  );
                } else {
                  this.publicDb.prepare(`
                    INSERT INTO products (
                      id, code, title, category, category_name, brand_id, image, short_desc,
                      description, price, old_price, status, version, publication_status, completeness_score
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, 'published', ?)
                  `).run(
                    product.id,
                    product.code,
                    product.title,
                    product.category || 'hood',
                    product.category_name || '',
                    product.brand_id || 'ardo',
                    product.image || product.primary_image || '',
                    product.short_desc || product.short_description || '',
                    product.description || '',
                    product.price,
                    product.old_price ?? product.oldPrice ?? null,
                    newVersion,
                    product.completeness_score ?? 100
                  );
                }
              }

              // Ensure product variants if table exists
              if (this.hasTable(this.draftDb, 'product_variants') && this.hasTable(this.publicDb, 'product_variants')) {
                const draftVariants = this.draftDb.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(product.id);
                this.publicDb.prepare('DELETE FROM product_variants WHERE product_id = ?').run(product.id);
                const insVar = this.publicDb.prepare(`
                  INSERT INTO product_variants (
                    id, product_id, model_code, sku, gtin, mpn, color_name, color_hex, finish, energy_class,
                    price, old_price, status, is_default, sort_order, created_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                for (const v of draftVariants) {
                  insVar.run(
                    v.id,
                    v.product_id,
                    v.model_code || product.code || product.id,
                    v.sku ?? null,
                    v.gtin ?? null,
                    v.mpn ?? null,
                    v.color_name ?? null,
                    v.color_hex ?? null,
                    v.finish ?? null,
                    v.energy_class ?? null,
                    v.price ?? null,
                    v.old_price ?? null,
                    v.status || 'active',
                    v.is_default ? 1 : 0,
                    v.sort_order || 0,
                    v.created_at || now
                  );
                }
              }

              // Promote specs & spec definitions if PIM v2 tables exist
              if (this.hasTable(this.draftDb, 'product_spec_values') && this.hasTable(this.publicDb, 'product_spec_values')) {
                const draftSpecs = this.draftDb.prepare('SELECT * FROM product_spec_values WHERE product_id = ?').all(product.id);
                
                if (this.hasTable(this.draftDb, 'spec_definitions') && this.hasTable(this.publicDb, 'spec_definitions')) {
                  const specDefIds = [...new Set(draftSpecs.map((s) => s.spec_definition_id).filter(Boolean))];
                  for (const defId of specDefIds) {
                    const pubDef = this.publicDb.prepare('SELECT id FROM spec_definitions WHERE id = ?').get(defId);
                    if (!pubDef) {
                      const draftDef = this.draftDb.prepare('SELECT * FROM spec_definitions WHERE id = ?').get(defId);
                      if (draftDef) {
                        this.publicDb.prepare(`
                          INSERT INTO spec_definitions (id, key, name_az, data_type, unit_family, filterable, comparable, required, sort_order)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).run(
                          draftDef.id,
                          draftDef.key || draftDef.id,
                          draftDef.name_az || draftDef.name || '',
                          draftDef.data_type || 'text',
                          draftDef.unit_family || '',
                          draftDef.filterable ? 1 : 0,
                          draftDef.comparable !== 0 ? 1 : 0,
                          draftDef.required ? 1 : 0,
                          draftDef.sort_order || 0
                        );
                      }
                    }
                  }
                }

                this.publicDb.prepare('DELETE FROM product_spec_values WHERE product_id = ?').run(product.id);
                const insSpec = this.publicDb.prepare(`
                  INSERT INTO product_spec_values (
                    id, product_id, variant_id, spec_definition_id, legacy_spec_id, raw_name, raw_value,
                    normalized_value_text, normalized_value_number, normalized_value_boolean, unit,
                    normalization_status, is_override, created_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                for (const s of draftSpecs) {
                  insSpec.run(
                    s.id, s.product_id, s.variant_id, s.spec_definition_id, s.legacy_spec_id || null,
                    s.raw_name || '', s.raw_value || '', s.normalized_value_text || null, s.normalized_value_number ?? null,
                    s.normalized_value_boolean ?? null, s.unit || null, s.normalization_status || 'valid', s.is_override ? 1 : 0, s.created_at || now
                  );
                }
              }

              // Promote media & media assets if PIM v2 tables exist
              if (this.hasTable(this.draftDb, 'product_media_variants') && this.hasTable(this.publicDb, 'product_media_variants')) {
                const draftMedia = this.draftDb.prepare('SELECT * FROM product_media_variants WHERE product_id = ?').all(product.id);
                
                if (this.hasTable(this.draftDb, 'media_assets') && this.hasTable(this.publicDb, 'media_assets')) {
                  const mediaIds = [...new Set(draftMedia.map((m) => m.media_id).filter(Boolean))];
                  for (const medId of mediaIds) {
                    const pubMed = this.publicDb.prepare('SELECT id FROM media_assets WHERE id = ?').get(medId);
                    if (!pubMed) {
                      const draftMed = this.draftDb.prepare('SELECT * FROM media_assets WHERE id = ?').get(medId);
                      if (draftMed) {
                        this.publicDb.prepare(`
                          INSERT INTO media_assets (id, type, url, original_name, mime_type, byte_size, width, height, duration_seconds, checksum_sha256, verification_status, created_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).run(
                          draftMed.id,
                          draftMed.type || 'image',
                          draftMed.url || '',
                          draftMed.original_name || '',
                          draftMed.mime_type || 'image/jpeg',
                          draftMed.byte_size || 0,
                          draftMed.width ?? null,
                          draftMed.height ?? null,
                          draftMed.duration_seconds ?? null,
                          draftMed.checksum_sha256 ?? null,
                          draftMed.verification_status || 'verified',
                          draftMed.created_at || now
                        );
                      }
                    }
                  }
                }

                this.publicDb.prepare('DELETE FROM product_media_variants WHERE product_id = ?').run(product.id);
                const insMedia = this.publicDb.prepare(`
                  INSERT INTO product_media_variants (
                    id, product_id, variant_id, media_id, legacy_media_id, is_primary, sort_order,
                    object_position, fit_mode, alt_text, poster_url
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                for (const m of draftMedia) {
                  insMedia.run(
                    m.id, m.product_id, m.variant_id, m.media_id, m.legacy_media_id || null,
                    m.is_primary ? 1 : 0, m.sort_order || 0, m.object_position || '50% 50%', m.fit_mode || 'contain', m.alt_text || '', m.poster_url || null
                  );
                }
              }

              this.publicDb.exec('COMMIT');
            } catch (pubErr) {
              this.publicDb.exec('ROLLBACK');
              throw pubErr;
            }
          }

          // Mark job published and update draft product
          const completedAt = new Date().toISOString();
          this.draftDb.prepare(`
            UPDATE publication_jobs
            SET state = 'published', published_at = ?, locked_by_worker = NULL, last_error = NULL
            WHERE id = ?
          `).run(completedAt, job.id);

          const draftCols = this.draftDb.prepare("PRAGMA table_info('products')").all().map((c) => c.name);
          const setClauses = ["status = 'published'", "publication_status = 'published'"];
          if (draftCols.includes('scheduled_publish_at')) {
            setClauses.push('scheduled_publish_at = NULL');
          }
          if (draftCols.includes('scheduled_at')) {
            setClauses.push('scheduled_at = NULL');
          }
          this.draftDb.prepare(`
            UPDATE products
            SET ${setClauses.join(', ')}
            WHERE id = ?
          `).run(job.product_id);

          processedCount++;
        } catch (jobErr) {
          // Exponential backoff
          const nextRetry = (job.retry_count || 0) + 1;
          const isFinalFailure = nextRetry >= (job.max_retries || 3);
          const nextState = isFinalFailure ? 'failed' : 'retry_pending';
          const backoffDelaySeconds = this.backoffBaseSeconds > 0 ? Math.pow(2, nextRetry) * this.backoffBaseSeconds : 0;
          const nextScheduledAt = new Date(Date.now() + backoffDelaySeconds * 1000).toISOString();

          this.draftDb.prepare(`
            UPDATE publication_jobs
            SET state = ?, retry_count = ?, scheduled_at = ?, last_error = ?, locked_by_worker = NULL, locked_at = NULL
            WHERE id = ?
          `).run(nextState, nextRetry, nextScheduledAt, jobErr.message, job.id);
        }
      }

      return { processed: processedCount, published: processedCount, failed: pendingJobs.length - processedCount };
    } finally {
      this.running = false;
    }
  }

  schedulePublication({ productId, scheduledAt, actor: _actor }) {
    const res = this.scheduleProductPublication(productId, scheduledAt, 1, `key_${productId}`);
    return res.id;
  }
}

export function processScheduledPublications(dbPath, options = {}) {
  const db = new DatabaseSync(dbPath);
  try {
    const hasJobsTable = Boolean(
      db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='publication_jobs'").get()
    );

    const worker = new ScheduledPublicationWorker({
      draftDb: db,
      publicDb: db,
      minCompletenessScore:
        typeof options.minCompletenessScore === 'number'
          ? options.minCompletenessScore
          : MIN_COMPLETENESS_SCORE,
    });

    if (!hasJobsTable) {
      return {
        error: 'PIM_V2_OUTBOX_REQUIRED',
        processedCount: 0,
        processed: 0,
        published: 0,
        products: [],
      };
    }

    // Ensure any un-enqueued scheduled draft products have an outbox job
    const nowIso = new Date().toISOString();
    const unqueued = db.prepare(`
      SELECT p.* FROM products p
      LEFT JOIN publication_jobs j ON j.product_id = p.id AND j.state IN ('scheduled', 'publishing')
      WHERE (p.publication_status = 'scheduled' OR p.status = 'draft')
        AND (p.scheduled_at <= ? OR p.scheduled_publish_at <= ?)
        AND j.id IS NULL
    `).all(nowIso, nowIso);

    for (const prod of unqueued) {
      const schedTime = prod.scheduled_publish_at || prod.scheduled_at || nowIso;
      worker.scheduleProductPublication(prod.id, schedTime, prod.version || 1, `legacy_sched_${prod.id}`);
    }

    const result = worker.processPendingJobs();
    const publishedProducts = db.prepare(`
      SELECT * FROM products WHERE status = 'published' AND updated_at >= datetime('now', '-5 minutes')
    `).all();
    return { processedCount: result.published || result.processed || 0, products: publishedProducts, result };
  } finally {
    db.close();
  }
}
