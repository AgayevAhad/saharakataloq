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
      headers: { 'Content-Type': file.type, 'X-CSRF-Token': csrfToken, 'X-Media-Alt': file.name },
      body: file,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Media yüklənmədi');
    return body as ProductMedia;
  },

  logout(csrfToken: string) {
    return request<{ ok: true }>('/api/admin/logout', {
      method: 'POST',
      headers: { ...jsonHeaders, 'X-CSRF-Token': csrfToken },
    });
  },
};
