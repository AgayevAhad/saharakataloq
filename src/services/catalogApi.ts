import { CatalogAnalytics, CatalogData, ProductMedia } from '../types/product';
import { DEFAULT_CATALOG, normalizeCatalog } from '../data/catalog';

export interface AdminPayload extends CatalogData {
  analytics: CatalogAnalytics;
  csrfToken: string;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, { credentials: 'same-origin', ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Sorğu icra olunmadı');
  return body as T;
};

export const catalogApi = {
  async getCatalog(): Promise<CatalogData> {
    try {
      return normalizeCatalog(await request<CatalogData>('/api/catalog'));
    } catch {
      return DEFAULT_CATALOG;
    }
  },

  track(type: 'catalog_view' | 'product_view' | 'contact_whatsapp' | 'contact_call', productId?: string) {
    const payload = JSON.stringify({ type, productId });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/events', new Blob([payload], { type: 'application/json' }));
      return;
    }
    fetch('/api/events', { method: 'POST', headers: jsonHeaders, body: payload, keepalive: true }).catch(() => {});
  },

  login(password: string) {
    return request<{ ok: true; csrfToken: string }>('/api/admin/login', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ password }),
    });
  },

  getAdminData() {
    return request<AdminPayload>('/api/admin/data');
  },

  saveCatalog(data: CatalogData, csrfToken: string) {
    return request<{ ok: true; updatedAt: string }>('/api/admin/catalog', {
      method: 'PUT',
      headers: { ...jsonHeaders, 'X-CSRF-Token': csrfToken },
      body: JSON.stringify(data),
    });
  },

  publishCatalog(csrfToken: string) {
    return request<{ ok: true; updatedAt: string }>('/api/admin/publish', {
      method: 'POST',
      headers: { ...jsonHeaders, 'X-CSRF-Token': csrfToken },
    });
  },

  async uploadMedia(file: File, csrfToken: string): Promise<ProductMedia> {
    const response = await fetch('/api/admin/media', {
      method: 'POST', credentials: 'same-origin',
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
    return request<CatalogAnalytics>(`/api/admin/analytics?${params.toString()}`);
  },

  getLogs(category = 'all', search = '', limit = 100, offset = 0) {
    const params = new URLSearchParams({ category, search, limit: String(limit), offset: String(offset) });
    return request<{ logs: any[]; total: number }>(`/api/admin/logs?${params.toString()}`);
  },

  clearLogs(csrfToken: string) {
    return request<{ ok: true }>('/api/admin/logs/clear', {
      method: 'POST',
      headers: { ...jsonHeaders, 'X-CSRF-Token': csrfToken },
    });
  },

  toggleCatalogStatus(active: boolean, message: string, csrfToken: string) {
    return request<{ ok: true; active: boolean; message: string }>('/api/admin/catalog/toggle-status', {
      method: 'POST',
      headers: { ...jsonHeaders, 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ active, message }),
    });
  },

  changePassword(oldPassword: string, newPassword: string, csrfToken: string) {
    return request<{ ok: true }>('/api/admin/change-password', {
      method: 'POST',
      headers: { ...jsonHeaders, 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },

  getSnapshots(limit = 50, offset = 0) {
    return request<{ snapshots: Array<{ id: string; name: string; productCount: number; createdBy: string; createdAt: string }>; total: number }>(`/api/admin/snapshots?limit=${limit}&offset=${offset}`);
  },

  createSnapshot(name: string, csrfToken: string) {
    return request<{ ok: true; snapshot: any }>('/api/admin/snapshots', {
      method: 'POST',
      headers: { ...jsonHeaders, 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ name }),
    });
  },

  restoreSnapshot(id: string, csrfToken: string) {
    return request<{ ok: true; catalog: CatalogData }>('/api/admin/snapshots/restore', {
      method: 'POST',
      headers: { ...jsonHeaders, 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ id }),
    });
  },

  deleteSnapshot(id: string, csrfToken: string) {
    return request<{ ok: true }>(`/api/admin/snapshots/${id}`, {
      method: 'DELETE',
      headers: { ...jsonHeaders, 'X-CSRF-Token': csrfToken },
    });
  },

  logout(csrfToken: string) {
    return request<{ ok: true }>('/api/admin/logout', {
      method: 'POST',
      headers: { ...jsonHeaders, 'X-CSRF-Token': csrfToken },
    });
  },
};
