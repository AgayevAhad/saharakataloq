import { randomUUID } from 'node:crypto';

export const BRAND_STATUS_TRANSITIONS = {
  candidate: ['verified', 'rejected', 'archived'],
  verified: ['content_ready', 'rejected', 'archived'],
  content_ready: ['published', 'verified', 'archived'],
  published: ['content_ready', 'archived'],
  legacy_unreviewed: ['verified', 'archived'],
  rejected: ['candidate', 'archived'],
  archived: ['candidate', 'verified', 'content_ready', 'published'],
};

export function normalizeBrandAlias(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ş/g, 's')
    .replace(/[^a-z0-9]/g, '');
}

export function validateHttpsUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('INVALID_URL: Mənbə URL-i mətni mütləqdir.');
  }
  const clean = rawUrl.trim();
  let parsed;
  try {
    parsed = new URL(clean);
  } catch {
    throw new Error(`INVALID_URL_FORMAT: "${clean}" düzgün URL formatında deyil.`);
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(`INSECURE_URL_PROTOCOL: Yalnız təhlükəsiz HTTPS URL-lər qəbul edilir. ("${clean}")`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
  ) {
    throw new Error(`DISALLOWED_HOST: Daxili şəbəkə və ya localhost URL-ləri qadağandır. ("${clean}")`);
  }

  return clean;
}

export function generateBrandEtag(brand) {
  if (!brand || !brand.id) return null;
  const version = brand.version || 1;
  return `"b-${brand.id}-v${version}"`;
}

export function matchBrandEtag(ifMatchHeader, brand) {
  if (!ifMatchHeader || !brand) return false;
  const clean = ifMatchHeader.trim();
  if (clean === '*' || clean === '"*"') return false;
  const etag = generateBrandEtag(brand);
  if (clean === etag) return true;
  const version = brand.version || 1;
  if (clean === `"${version}"` || clean === String(version)) return true;
  if (clean === `"v${version}"` || clean === `v${version}`) return true;
  if (clean === `W/"v${version}"` || clean === `W/"${version}"`) return true;
  return false;
}

export class BrandRegistryService {
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
   * Registers a candidate brand observed from public retailer directories.
   */
  addCandidateBrand({ id, name, slug, originCountry, sourceUrl, observedName, actor = 'admin' }) {
    if (!name || !name.trim()) {
      throw new Error('BRAND_NAME_REQUIRED: Brend adı mütləqdir.');
    }
    const cleanName = name.trim();
    const cleanSlug = (slug || cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')).toLowerCase();

    // Check collision against existing brands
    const existingBrand = this.db
      .prepare('SELECT id, name, slug FROM brands WHERE slug = ? OR LOWER(name) = LOWER(?)')
      .get(cleanSlug, cleanName);

    if (existingBrand) {
      throw new Error(`BRAND_SLUG_COLLISION: "${cleanName}" və ya "${cleanSlug}" adlı brend artıq mövcuddur.`);
    }

    let validatedSourceUrl = '';
    if (sourceUrl && sourceUrl.trim()) {
      validatedSourceUrl = validateHttpsUrl(sourceUrl);
    }

    const brandId = (id && String(id).trim()) ? String(id).trim() : `brand_${cleanSlug.replace(/[^a-z0-9_]/g, '_')}_${randomUUID().slice(0, 6)}`;
    const nowIso = new Date().toISOString();

    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const hasVerifStatus = this.hasColumn('brands', 'verification_status');
      const hasCreatedAt = this.hasColumn('brands', 'created_at');
      if (hasVerifStatus && hasCreatedAt) {
        this.db.prepare(`
          INSERT INTO brands (
            id, name, slug, origin_country, description, logo, active, coming_soon,
            verification_status, logo_rights_status, logo_source, rights_note, version, created_at
          ) VALUES (?, ?, ?, ?, '', '', 1, 0, 'candidate', 'unreviewed', '', '', 1, ?)
        `).run(brandId, cleanName, cleanSlug, originCountry || '', nowIso);
      } else if (hasVerifStatus) {
        this.db.prepare(`
          INSERT INTO brands (
            id, name, slug, origin_country, description, logo, active, coming_soon,
            verification_status, logo_rights_status, logo_source, rights_note, version
          ) VALUES (?, ?, ?, ?, '', '', 1, 0, 'candidate', 'unreviewed', '', '', 1)
        `).run(brandId, cleanName, cleanSlug, originCountry || '');
      } else if (hasCreatedAt) {
        this.db.prepare(`
          INSERT INTO brands (id, name, slug, origin_country, description, logo, active, coming_soon, created_at)
          VALUES (?, ?, ?, ?, '', '', 1, 0, ?)
        `).run(brandId, cleanName, cleanSlug, originCountry || '', nowIso);
      } else {
        this.db.prepare(`
          INSERT INTO brands (id, name, slug, origin_country, description, logo, active, coming_soon)
          VALUES (?, ?, ?, ?, '', '', 1, 0)
        `).run(brandId, cleanName, cleanSlug, originCountry || '');
      }

      if (validatedSourceUrl && this.hasTable('brand_sources')) {
        const sourceId = `bsrc_${randomUUID().slice(0, 10)}`;
        this.db.prepare(`
          INSERT INTO brand_sources (
            id, brand_id, source_url, source_type, observed_name, checked_at, rights_note, verification_status
          ) VALUES (?, ?, ?, 'retailer_catalog', ?, ?, '', 'candidate')
        `).run(sourceId, brandId, validatedSourceUrl, observedName || cleanName, nowIso);
      }

      this.logAudit({
        category: 'brand_registry',
        action: 'candidate_added',
        title: `Namizəd brend əlavə edildi: ${cleanName}`,
        details: {
          brandId,
          entityId: brandId,
          name: cleanName,
          slug: cleanSlug,
          sourceUrl: validatedSourceUrl || '',
          beforeVersion: 0,
          afterVersion: 1,
        },
        actor,
      });

      this.db.exec('COMMIT;');
      return this.getBrandById(brandId);
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Batch imports candidate brands with detailed per-item results.
   */
  importCandidateBatch(candidates, { actor = 'admin' } = {}) {
    if (!Array.isArray(candidates)) {
      throw new Error('INVALID_CANDIDATE_BATCH: Namizədlər massiv olmalıdır.');
    }

    const results = {
      added: [],
      duplicates: [],
      rejected: [],
      errors: [],
    };

    for (const cand of candidates) {
      if (!cand.name || !cand.name.trim()) {
        results.rejected.push({ candidate: cand, reason: 'Ad boşdur' });
        continue;
      }
      const cleanName = cand.name.trim();
      const cleanSlug = (cand.slug || cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')).toLowerCase();

      const existing = this.db
        .prepare('SELECT id, name FROM brands WHERE slug = ? OR LOWER(name) = LOWER(?)')
        .get(cleanSlug, cleanName);

      if (existing) {
        results.duplicates.push({ name: cleanName, slug: cleanSlug, existingId: existing.id });
        continue;
      }

      try {
        const added = this.addCandidateBrand({
          name: cleanName,
          slug: cleanSlug,
          originCountry: cand.originCountry || '',
          sourceUrl: cand.sourceUrl || '',
          observedName: cand.observedName || cleanName,
          actor,
        });
        results.added.push(added);
      } catch (err) {
        results.errors.push({ name: cleanName, error: err.message });
      }
    }

    return results;
  }

  /**
   * Adds an official manufacturer or retailer source to a brand. Initial status is ALWAYS 'pending'.
   */
  addBrandSource(brandId, { sourceUrl, sourceType = 'official_website', observedName, rightsNote = '', actor = 'admin', ipAddress = '127.0.0.1', userAgent = 'BrandRegistryService' } = {}) {
    const validatedUrl = validateHttpsUrl(sourceUrl);
    const brand = this.getBrandById(brandId);
    if (!brand) throw new Error(`BRAND_NOT_FOUND: Brend (${brandId}) tapılmadı.`);

    const sourceId = `bsrc_${randomUUID().slice(0, 10)}`;
    const nowIso = new Date().toISOString();
    // Always forced to pending - no caller override permitted
    const forcedVerificationStatus = 'pending';

    this.db.exec('BEGIN IMMEDIATE;');
    try {
      this.db.prepare(`
        INSERT INTO brand_sources (
          id, brand_id, source_url, source_type, observed_name, checked_at, rights_note, verification_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sourceId,
        brandId,
        validatedUrl,
        sourceType,
        observedName || brand.name,
        nowIso,
        rightsNote || '',
        forcedVerificationStatus
      );

      // Increment brand version on source change
      const newVersion = (brand.version || 1) + 1;
      this.db.prepare('UPDATE brands SET version = ? WHERE id = ?').run(newVersion, brandId);

      this.logAudit({
        category: 'brand_registry',
        action: 'source_added',
        title: `${brand.name} üçün mənbə əlavə edildi`,
        details: {
          brandId,
          sourceId,
          sourceType,
          sourceUrl: validatedUrl,
          verificationStatus: forcedVerificationStatus,
          beforeVersion: brand.version || 1,
          afterVersion: newVersion,
        },
        actor,
        ipAddress,
        userAgent,
      });

      this.db.exec('COMMIT;');
      return { id: sourceId, brandId, sourceUrl: validatedUrl, sourceType, verificationStatus: forcedVerificationStatus, checkedAt: nowIso };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Updates verification status of a specific brand source after manual review.
   */
  updateBrandSourceStatus(brandId, sourceId, status, { actor = 'admin', note = '', ipAddress = '127.0.0.1', userAgent = 'BrandRegistryService' } = {}) {
    const validStatuses = ['pending', 'verified', 'rejected', 'candidate'];
    if (!validStatuses.includes(status)) {
      throw new Error(`INVALID_SOURCE_STATUS: "${status}" etibarsız mənbə statusudur.`);
    }

    const brand = this.getBrandById(brandId);
    if (!brand) throw new Error(`BRAND_NOT_FOUND: Brend (${brandId}) tapılmadı.`);

    const src = this.db.prepare('SELECT * FROM brand_sources WHERE id = ? AND brand_id = ?').get(sourceId, brandId);
    if (!src) throw new Error(`SOURCE_NOT_FOUND: Mənbə (${sourceId}) tapılmadı.`);

    const nowIso = new Date().toISOString();
    const newVersion = (brand.version || 1) + 1;

    this.db.exec('BEGIN IMMEDIATE;');
    try {
      this.db.prepare(`
        UPDATE brand_sources
        SET verification_status = ?, rights_note = ?, checked_at = ?
        WHERE id = ?
      `).run(status, note || src.rights_note, nowIso, sourceId);

      // Increment brand version on source review status change
      this.db.prepare('UPDATE brands SET version = ? WHERE id = ?').run(newVersion, brandId);

      this.logAudit({
        category: 'brand_registry',
        action: 'source_status_updated',
        title: `${brand.name} mənbə statusu yeniləndi: ${status}`,
        details: {
          brandId,
          sourceId,
          sourceUrl: src.source_url,
          beforeStatus: src.verification_status,
          afterStatus: status,
          beforeVersion: brand.version || 1,
          afterVersion: newVersion,
        },
        actor,
        ipAddress,
        userAgent,
      });

      this.db.exec('COMMIT;');
      return { id: sourceId, brandId, sourceUrl: src.source_url, verificationStatus: status, checkedAt: nowIso };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Adds an alias/synonym for a brand with duplicate/collision checks.
   */
  addBrandAlias(brandId, alias, locale = 'az', actor = 'admin', { ipAddress = '127.0.0.1', userAgent = 'BrandRegistryService' } = {}) {
    if (!alias || !alias.trim()) {
      throw new Error('ALIAS_REQUIRED: Alias mətni mütləqdir.');
    }
    const brand = this.getBrandById(brandId);
    if (!brand) throw new Error(`BRAND_NOT_FOUND: Brend (${brandId}) tapılmadı.`);

    const cleanAlias = alias.trim();
    const normalized = normalizeBrandAlias(cleanAlias);

    if (!normalized) {
      throw new Error('EMPTY_NORMALIZED_ALIAS: Alias normalizasiyası boş alına bilməz.');
    }

    // Collision check against other brands or existing aliases
    const collisionBrand = this.db
      .prepare('SELECT id, name FROM brands WHERE id != ? AND (LOWER(name) = LOWER(?) OR slug = LOWER(?))')
      .get(brandId, cleanAlias, cleanAlias);

    if (collisionBrand) {
      throw new Error(`ALIAS_COLLISION: "${cleanAlias}" başqa bir brendin ("${collisionBrand.name}") əsas adı və ya slug-ı ilə toqquşur.`);
    }

    const collisionAlias = this.db
      .prepare('SELECT a.*, b.name as brand_name FROM brand_aliases a JOIN brands b ON b.id = a.brand_id WHERE a.brand_id != ? AND (LOWER(a.alias) = LOWER(?) OR a.normalized_alias = ?)')
      .get(brandId, cleanAlias, normalized);

    if (collisionAlias) {
      throw new Error(`ALIAS_COLLISION: "${cleanAlias}" artıq "${collisionAlias.brand_name}" brendinə təyin olunub.`);
    }

    const aliasId = `balias_${randomUUID().slice(0, 10)}`;
    const newVersion = (brand.version || 1) + 1;

    this.db.exec('BEGIN IMMEDIATE;');
    try {
      this.db.prepare(`
        INSERT INTO brand_aliases (id, brand_id, alias, normalized_alias, locale)
        VALUES (?, ?, ?, ?, ?)
      `).run(aliasId, brandId, cleanAlias, normalized, locale);

      // Increment brand version on alias change
      this.db.prepare('UPDATE brands SET version = ? WHERE id = ?').run(newVersion, brandId);

      this.logAudit({
        category: 'brand_registry',
        action: 'alias_added',
        title: `${brand.name} üçün alias əlavə edildi: ${cleanAlias}`,
        details: {
          brandId,
          aliasId,
          alias: cleanAlias,
          normalizedAlias: normalized,
          beforeVersion: brand.version || 1,
          afterVersion: newVersion,
        },
        actor,
        ipAddress,
        userAgent,
      });

      this.db.exec('COMMIT;');
      return { id: aliasId, brandId, alias: cleanAlias, normalizedAlias: normalized, locale };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Updates brand logo rights and legal authorization status.
   */
  updateLogoRights(brandId, { logoRightsStatus, logoSource = '', rightsNote = '', verifiedBy, actor = 'admin', ipAddress = '127.0.0.1', userAgent = 'BrandRegistryService' }) {
    const validStatuses = ['unreviewed', 'pending', 'approved', 'rejected'];
    if (!validStatuses.includes(logoRightsStatus)) {
      throw new Error(`INVALID_LOGO_RIGHTS_STATUS: "${logoRightsStatus}" etibarsız loqo hüquq statusudur.`);
    }

    const brand = this.getBrandById(brandId);
    if (!brand) throw new Error(`BRAND_NOT_FOUND: Brend (${brandId}) tapılmadı.`);

    const nowIso = new Date().toISOString();
    const newVersion = (brand.version || 1) + 1;

    this.db.prepare(`
      UPDATE brands
      SET logo_rights_status = ?, logo_source = ?, rights_note = ?,
          verified_by = ?, verified_at = ?, version = ?
      WHERE id = ?
    `).run(logoRightsStatus, (logoSource || '').trim(), (rightsNote || '').trim(), verifiedBy || actor, nowIso, newVersion, brandId);

    this.logAudit({
      category: 'brand_registry',
      action: 'logo_rights_updated',
      title: `${brand.name} loqo hüquq statusu yeniləndi: ${logoRightsStatus}`,
      details: {
        brandId,
        beforeRightsStatus: brand.logoRightsStatus,
        afterRightsStatus: logoRightsStatus,
        rightsNote,
        beforeVersion: brand.version || 1,
        afterVersion: newVersion,
      },
      actor,
      ipAddress,
      userAgent,
    });

    return this.getBrandById(brandId);
  }

  /**
   * Transitions brand verification status enforcing strict gatekeeper rules.
   */
  updateBrandVerificationStatus(brandId, nextStatus, { actor = 'admin', note = '', ipAddress = '127.0.0.1', userAgent = 'BrandRegistryService' } = {}) {
    const brand = this.getBrandById(brandId);
    if (!brand) throw new Error(`BRAND_NOT_FOUND: Brend (${brandId}) tapılmadı.`);

    const currentStatus = brand.verificationStatus || 'candidate';
    const allowedNext = BRAND_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedNext.includes(nextStatus) && currentStatus !== nextStatus) {
      throw new Error(
        `INVALID_BRAND_STATUS_TRANSITION: "${currentStatus}" statusundan "${nextStatus}" statusuna keçid icazəli deyil. İcazəli keçidlər: ${allowedNext.join(', ')}`
      );
    }

    // Gatekeeper: Cannot publish without at least 1 verified official manufacturer source (source_type = 'official_website')
    if (nextStatus === 'published') {
      const verifiedOfficialSources = this.db
        .prepare(`
          SELECT COUNT(*) as count FROM brand_sources
          WHERE brand_id = ? AND verification_status = 'verified' AND source_type = 'official_website'
        `)
        .get(brandId);

      const count = verifiedOfficialSources?.count || 0;
      if (count === 0) {
        throw new Error(
          `BRAND_REQUIRES_VERIFIED_OFFICIAL_SOURCE: "${brand.name}" brendini ictimai dərc (published) etmək üçün ən azı 1 təsdiqlənmiş rəsmi vebsayt mənbəsi (source_type=official_website, status=verified) tələb olunur.`
        );
      }
    }

    const newVersion = (brand.version || 1) + 1;

    this.db.prepare(`
      UPDATE brands
      SET verification_status = ?, version = ?
      WHERE id = ?
    `).run(nextStatus, newVersion, brandId);

    this.logAudit({
      category: 'brand_registry',
      action: 'status_transition',
      title: `${brand.name} statusu dəyişdirildi: ${currentStatus} -> ${nextStatus}`,
      details: {
        brandId,
        beforeStatus: currentStatus,
        afterStatus: nextStatus,
        beforeVersion: brand.version || 1,
        afterVersion: newVersion,
        note,
      },
      actor,
      ipAddress,
      userAgent,
    });

    return this.getBrandById(brandId);
  }

  /**
   * Returns a single brand by ID with full metadata, sources, and aliases.
   */
  getBrandById(brandId) {
    const b = this.db.prepare('SELECT * FROM brands WHERE id = ?').get(brandId);
    if (!b) return null;

    const sources = this.hasTable('brand_sources')
      ? this.db.prepare('SELECT * FROM brand_sources WHERE brand_id = ?').all(brandId)
      : [];
    const aliases = this.hasTable('brand_aliases')
      ? this.db.prepare('SELECT * FROM brand_aliases WHERE brand_id = ?').all(brandId)
      : [];
    const productCount = this.hasTable('products')
      ? this.db.prepare('SELECT COUNT(*) as c FROM products WHERE brand_id = ?').get(brandId)?.c || 0
      : 0;

    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      originCountry: b.origin_country || b.originCountry || '',
      description: b.description || '',
      logo: b.logo || '',
      active: Boolean(b.active ?? 1),
      comingSoon: Boolean(b.coming_soon ?? b.comingSoon ?? 0),
      sortOrder: b.sort_order ?? b.sortOrder ?? 0,
      verificationStatus: b.verification_status || 'candidate',
      logoRightsStatus: b.logo_rights_status || 'unreviewed',
      logoSource: b.logo_source || '',
      rightsNote: b.rights_note || '',
      verifiedBy: b.verified_by || null,
      verifiedAt: b.verified_at || null,
      version: b.version || 1,
      createdAt: b.created_at || null,
      sources,
      aliases,
      productCount,
    };
  }

  /**
   * Returns public brands, including legacy PIM `unverified` records that predate
   * the candidate approval workflow, while filtering out new candidate brands.
   */
  getPublicBrands() {
    const hasVerifStatus = this.hasColumn('brands', 'verification_status');
    const hasPubStatus = this.hasColumn('products', 'publication_status');
    const prodStatusCond = hasPubStatus
      ? "(p.status = 'published' OR p.publication_status = 'published')"
      : "p.status = 'published'";

    const brands = hasVerifStatus
      ? this.db.prepare(`
          SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND ${prodStatusCond}) as product_count
          FROM brands b
          WHERE b.active = 1
            AND b.verification_status IN ('published', 'legacy_unreviewed', 'unverified')
          ORDER BY b.name ASC
        `).all()
      : this.db.prepare(`
          SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND ${prodStatusCond}) as product_count
          FROM brands b
          WHERE b.active = 1
          ORDER BY b.name ASC
        `).all();

    // 0-product brands default to hidden unless comingSoon is true
    return brands
      .filter((b) => (b.product_count > 0 || Boolean(b.coming_soon || b.comingSoon)))
      .map((b) => {
        const isLogoApproved = b.logo_rights_status === 'approved' || b.verification_status === 'legacy_unreviewed';
        return {
          id: b.id,
          name: b.name,
          slug: b.slug,
          originCountry: b.origin_country || b.originCountry || '',
          description: b.description || '',
          logo: isLogoApproved ? (b.logo || '') : '',
          active: true,
          comingSoon: Boolean(b.coming_soon || b.comingSoon),
          productCount: b.product_count || 0,
        };
      });
  }

  /**
   * Returns admin brands with candidate queue and search filtering.
   */
  getAdminBrands({ status, search, includeArchived = false } = {}) {
    const hasVerifStatus = this.hasColumn('brands', 'verification_status');
    let sql =
      'SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id) as product_count FROM brands b WHERE 1=1';
    const params = [];

    if (hasVerifStatus) {
      if (!includeArchived) {
        sql += " AND (b.verification_status != 'archived' OR b.verification_status IS NULL)";
      }
      if (status) {
        sql += ' AND b.verification_status = ?';
        params.push(status);
      }
    }
    if (search && search.trim()) {
      sql += ' AND (LOWER(b.name) LIKE ? OR LOWER(b.slug) LIKE ?)';
      const q = `%${search.trim().toLowerCase()}%`;
      params.push(q, q);
    }
    sql += ' ORDER BY b.name ASC';

    const list = this.db.prepare(sql).all(...params);
    return list.map((b) => this.getBrandById(b.id));
  }

  logAudit({ category, action, title, details = '', actor = 'admin', ipAddress = '127.0.0.1', userAgent = 'BrandRegistryService', status = 'success' }) {
    if (!this.hasTable('audit_logs')) return;
    const detailPayload =
      typeof details === 'object'
        ? JSON.stringify({
            actor,
            entityId: details.entityId || details.brandId || details.categoryId || '',
            ...details,
          })
        : String(details || `Actor: ${actor}`);
    this.db.prepare(`
      INSERT INTO audit_logs (category, action, title, details, ip_address, user_agent, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(category, action, title, detailPayload, ipAddress, userAgent, status, new Date().toISOString());
  }
}
