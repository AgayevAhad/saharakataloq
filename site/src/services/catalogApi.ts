import { CatalogAnalytics, CatalogData, ProductMedia } from '../types/product';
import { DEFAULT_CATALOG, normalizeCatalog } from '../data/catalog';
import { apiClient } from './apiClient';
import { BrandSchema, CategorySchema, ProductSchema } from '../types/schemas';

export interface AdminPayload extends CatalogData {
  analytics: CatalogAnalytics;
  csrfToken: string;
}

export interface ValidationReport {
  isValid: boolean;
  productErrors: Array<{ id: string; errors: string[] }>;
  brandErrors: Array<{ id: string; errors: string[] }>;
  categoryErrors: Array<{ id: string; errors: string[] }>;
}

export function validateCatalogData(catalog: CatalogData): ValidationReport {
  const report: ValidationReport = {
    isValid: true,
    productErrors: [],
    brandErrors: [],
    categoryErrors: [],
  };

  catalog.products.forEach((p) => {
    const res = ProductSchema.safeParse(p);
    if (!res.success) {
      report.isValid = false;
      report.productErrors.push({
        id: p.id || 'unknown',
        errors: res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }
  });

  catalog.brands.forEach((b) => {
    const res = BrandSchema.safeParse(b);
    if (!res.success) {
      report.isValid = false;
      report.brandErrors.push({
        id: b.id || 'unknown',
        errors: res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }
  });

  catalog.categories.forEach((c) => {
    const res = CategorySchema.safeParse(c);
    if (!res.success) {
      report.isValid = false;
      report.categoryErrors.push({
        id: c.id || 'unknown',
        errors: res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }
  });

  return report;
}

import {
  PimMigrationStatusResponseType,
  PimDryRunResponseType,
  UnassignedMediaResponseType,
  PostgresVerifyResponseType,
} from '../types/schemas';

export const catalogApi = {
  async getCatalog(): Promise<CatalogData> {
    if (
      import.meta.env?.MODE === 'test' ||
      (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test')
    ) {
      return DEFAULT_CATALOG;
    }
    try {
      const data = await apiClient.get<CatalogData>('/api/catalog');
      const normalized = normalizeCatalog(data);
      // Run non-destructive schema validation and attach structured report
      const report = validateCatalogData(normalized);
      if (!report.isValid) {
        console.warn('[Sahara Catalog] Schema validation notices found in public catalog:', report);
        (normalized as CatalogData & { _validationReport?: ValidationReport })._validationReport =
          report;
      }
      return normalized;
    } catch {
      return DEFAULT_CATALOG;
    }
  },

  track(
    type: 'catalog_view' | 'product_view' | 'contact_whatsapp' | 'contact_call',
    productId?: string
  ) {
    if (
      import.meta.env?.MODE === 'test' ||
      (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test')
    ) {
      return;
    }
    const payload = JSON.stringify({ type, productId });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/events', new Blob([payload], { type: 'application/json' }));
      return;
    }
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  },

  login(password: string) {
    return apiClient.post<{ ok: true; csrfToken: string }>('/api/admin/login', { password });
  },

  getAdminSessionStatus() {
    return apiClient.get<{ authenticated: boolean; csrfToken?: string }>('/api/admin/session');
  },

  getAdminData() {
    return apiClient.get<AdminPayload>('/api/admin/data');
  },

  async saveCatalog(data: CatalogData, csrfToken: string) {
    // Validate entire payload schema before network transmission
    const report = validateCatalogData(data);
    if (!report.isValid) {
      const errorCount =
        report.productErrors.length + report.brandErrors.length + report.categoryErrors.length;
      throw new Error(
        `Kataloqda ${errorCount} schema xətası var. Düzəliş etmədən yadda saxlamaq mümkün deyil.`
      );
    }
    return apiClient.put<{ ok: true; updatedAt: string }>('/api/admin/catalog', data, {
      headers: { 'X-CSRF-Token': csrfToken },
    });
  },

  publishCatalog(csrfToken: string) {
    return apiClient.post<{ ok: true; updatedAt: string }>('/api/admin/publish', undefined, {
      headers: { 'X-CSRF-Token': csrfToken },
    });
  },

  async uploadMedia(file: File, csrfToken: string): Promise<ProductMedia> {
    const response = await fetch('/api/admin/media', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': file.type,
        'X-CSRF-Token': csrfToken,
        'X-Media-Alt': encodeURIComponent(file.name),
        'X-Original-Name': encodeURIComponent(file.name),
      },
      body: file,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Media yüklənmədi');
    return {
      id: body.id,
      type: body.type,
      url: body.url,
      alt: body.alt || file.name,
      originalName: body.originalName || file.name,
    } as ProductMedia;
  },

  getFilteredAnalytics(range: string, fromDate?: string, toDate?: string) {
    const params = new URLSearchParams({ range });
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    return apiClient.get<CatalogAnalytics>(`/api/admin/analytics?${params.toString()}`);
  },

  getLogs(category = 'all', search = '', limit = 100, offset = 0) {
    const params = new URLSearchParams({
      category,
      search,
      limit: String(limit),
      offset: String(offset),
    });
    return apiClient.get<{ logs: any[]; total: number }>(`/api/admin/logs?${params.toString()}`);
  },

  clearLogs(csrfToken: string) {
    return apiClient.post<{ ok: true }>('/api/admin/logs/clear', undefined, {
      headers: { 'X-CSRF-Token': csrfToken },
    });
  },

  toggleCatalogStatus(active: boolean, message: string, csrfToken: string) {
    return apiClient.post<{ ok: true; active: boolean; message: string }>(
      '/api/admin/catalog/toggle-status',
      { active, message },
      { headers: { 'X-CSRF-Token': csrfToken } }
    );
  },

  changePassword(oldPassword: string, newPassword: string, csrfToken: string) {
    return apiClient.post<{ ok: true }>(
      '/api/admin/change-password',
      { oldPassword, newPassword },
      { headers: { 'X-CSRF-Token': csrfToken } }
    );
  },

  getSnapshots(limit = 50, offset = 0) {
    return apiClient.get<{
      snapshots: Array<{
        id: string;
        name: string;
        productCount: number;
        createdBy: string;
        createdAt: string;
      }>;
      total: number;
    }>(`/api/admin/snapshots?limit=${limit}&offset=${offset}`);
  },

  createSnapshot(name: string, csrfToken: string) {
    return apiClient.post<{ ok: true; snapshot: any }>(
      '/api/admin/snapshots',
      { name },
      { headers: { 'X-CSRF-Token': csrfToken } }
    );
  },

  restoreSnapshot(id: string, csrfToken: string) {
    return apiClient.post<{ ok: true; catalog: CatalogData }>(
      '/api/admin/snapshots/restore',
      { id },
      { headers: { 'X-CSRF-Token': csrfToken } }
    );
  },

  deleteSnapshot(id: string, csrfToken: string) {
    return apiClient.delete<{ ok: true }>(`/api/admin/snapshots/${id}`, {
      headers: { 'X-CSRF-Token': csrfToken },
    });
  },

  // Granular Product CRUD with Optimistic Concurrency & ETags
  async getProduct(id: string) {
    const res = await apiClient.getWithMeta<{ ok: boolean; product: any }>(
      `/api/admin/products/${encodeURIComponent(id)}`
    );
    return {
      ok: res.data.ok,
      product: res.data.product,
      etag: res.etag || res.headers.get('etag'),
    };
  },

  async updateProduct(id: string, product: any, options: { ifMatch: string; csrfToken: string }) {
    const res = await apiClient.putWithMeta<{ ok: boolean; product: any }>(
      `/api/admin/products/${encodeURIComponent(id)}`,
      product,
      {
        headers: {
          'If-Match': options.ifMatch,
          'X-CSRF-Token': options.csrfToken,
        },
      }
    );
    return {
      ok: res.data.ok,
      product: res.data.product,
      etag: res.etag || res.headers.get('etag'),
    };
  },

  async deleteProduct(id: string, options: { ifMatch: string; csrfToken: string }) {
    return apiClient.delete<{ ok: true; id: string }>(`/api/admin/products/${id}`, {
      headers: {
        'If-Match': options.ifMatch,
        'X-CSRF-Token': options.csrfToken,
      },
    });
  },

  async getProductRevisions(id: string) {
    return apiClient.get<{ ok: boolean; revisions: any[] }>(`/api/admin/products/${id}/revisions`);
  },

  // PIM v2 Migration & Inspection APIs
  getPimMigrationStatus() {
    return apiClient.get<PimMigrationStatusResponseType>('/api/admin/pim/migration/status');
  },

  runPimDryRun(csrfToken?: string) {
    return apiClient.post<PimDryRunResponseType>(
      '/api/admin/pim/migration/dry-run',
      {},
      csrfToken ? { headers: { 'X-CSRF-Token': csrfToken } } : undefined
    );
  },

  applyPimMigration(dryRunToken: string, csrfToken: string) {
    return apiClient.post<{
      ok: boolean;
      status: string;
      appliedAt: string;
      snapshotManifest: any;
      migrationReport: any;
    }>(
      '/api/admin/pim/migration/apply',
      { dryRunToken },
      { headers: { 'X-CSRF-Token': csrfToken } }
    );
  },

  getUnassignedMedia() {
    return apiClient.get<UnassignedMediaResponseType>('/api/admin/media/unassigned');
  },

  verifyPostgresSchema() {
    return apiClient.get<PostgresVerifyResponseType>('/api/admin/postgres/verify');
  },

  getPublicNavigation(placement?: string) {
    const query = placement ? `?placement=${encodeURIComponent(placement)}` : '';
    return apiClient.get<{ ok: boolean; tree: any[]; items: any[] }>(`/api/navigation${query}`);
  },

  getAdminNavigation(placement?: string) {
    const query = placement ? `?placement=${encodeURIComponent(placement)}` : '';
    return apiClient.get<{ ok: boolean; items: any[] }>(`/api/admin/navigation${query}`);
  },

  createNavigationItem(data: any, csrfToken: string) {
    return apiClient.post<{ ok: boolean; item: any }>('/api/admin/navigation', data, {
      headers: { 'X-CSRF-Token': csrfToken },
    });
  },

  updateNavigationItem(id: string, data: any, csrfToken: string, etag?: string) {
    const headers: Record<string, string> = { 'X-CSRF-Token': csrfToken };
    if (etag) headers['If-Match'] = etag;
    return apiClient.put<{ ok: boolean; item: any }>(
      `/api/admin/navigation/${encodeURIComponent(id)}`,
      data,
      {
        headers,
      }
    );
  },

  deleteNavigationItem(id: string, csrfToken: string, etag?: string) {
    const headers: Record<string, string> = { 'X-CSRF-Token': csrfToken };
    if (etag) headers['If-Match'] = etag;
    return apiClient.delete<{ ok: boolean; id: string }>(
      `/api/admin/navigation/${encodeURIComponent(id)}`,
      {
        headers,
      }
    );
  },

  reorderNavigationItems(items: Array<{ id: string; sortOrder: number }>, csrfToken: string) {
    return apiClient.put<{ ok: boolean; count: number }>(
      '/api/admin/navigation/reorder',
      { items },
      {
        headers: { 'X-CSRF-Token': csrfToken },
      }
    );
  },

  getAdminBrandRail() {
    return apiClient.get<{
      ok: boolean;
      settings: any;
      items: any[];
      revisions: any[];
    }>('/api/admin/brand-rail');
  },

  updateBrandRailSettings(data: any, csrfToken: string, etag?: string) {
    const headers: Record<string, string> = { 'X-CSRF-Token': csrfToken };
    if (etag) headers['If-Match'] = etag;
    return apiClient.put<{ ok: boolean; settings: any }>('/api/admin/brand-rail/settings', data, {
      headers,
    });
  },

  updateBrandRailItems(items: any[], csrfToken: string) {
    return apiClient.put<{ ok: boolean; items: any[] }>(
      '/api/admin/brand-rail/items',
      { items },
      { headers: { 'X-CSRF-Token': csrfToken } }
    );
  },

  publishBrandRail(csrfToken: string) {
    return apiClient.post<{ ok: boolean; publishedAt: string; itemCount: number }>(
      '/api/admin/brand-rail/publish',
      {},
      { headers: { 'X-CSRF-Token': csrfToken } }
    );
  },

  rollbackBrandRail(version: number, csrfToken: string) {
    return apiClient.post<{ ok: boolean; version: number }>(
      '/api/admin/brand-rail/rollback',
      { version },
      { headers: { 'X-CSRF-Token': csrfToken } }
    );
  },

  logout(csrfToken: string) {
    return apiClient.post<{ ok: true }>('/api/admin/logout', undefined, {
      headers: { 'X-CSRF-Token': csrfToken },
    });
  },
};
