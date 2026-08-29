import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { catalogApi } from '../src/services/catalogApi';
import { Product } from '../src/types/product';
import { normalizeProduct } from '../src/data/catalog';

const makeProduct = (id: string, code: string): Product =>
  normalizeProduct({
    id, code, title: `Məhsul ${code}`, category: 'hood', categoryName: 'Aspiratorlar',
    image: '', shortDesc: '', specs: [], highlights: [], status: 'published',
  });

// ─── Deep link URL ayrıştırılması ─────────────────────────────────────────

describe('Deep link URL ayrıştırılması', () => {
  it('?product=id parametri ilə məhsul tapılır', () => {
    const products = [makeProduct('asp-001', 'A100'), makeProduct('asp-002', 'A200')];
    const url = new URL('https://saharaelectronics.az/?product=asp-001');
    const id = url.searchParams.get('product');
    const found = products.find((p) => p.id === id || p.code.toLocaleLowerCase('az') === id?.toLocaleLowerCase('az'));
    expect(found?.id).toBe('asp-001');
  });

  it('kod ilə də deep link işləyir (case-insensitive)', () => {
    const products = [makeProduct('asp-001', 'A100')];
    const id = 'a100'; // kiçik hərf
    const found = products.find((p) => p.id === id || p.code.toLocaleLowerCase('az') === id.toLocaleLowerCase('az'));
    expect(found?.id).toBe('asp-001');
  });

  it('?product parametri olmadıqda heç nə tapılmır', () => {
    const products = [makeProduct('asp-001', 'A100')];
    const url = new URL('https://saharaelectronics.az/');
    const id = url.searchParams.get('product');
    expect(id).toBeNull();
    const found = id ? products.find((p) => p.id === id) : undefined;
    expect(found).toBeUndefined();
  });

  it('mövcud olmayan id ilə deep link nəticəsiz qalır', () => {
    const products = [makeProduct('asp-001', 'A100')];
    const id = 'yoxdur-999';
    const found = products.find((p) => p.id === id || p.code.toLocaleLowerCase('az') === id.toLocaleLowerCase('az'));
    expect(found).toBeUndefined();
  });
});

// ─── Paylaşım URL formatı ──────────────────────────────────────────────────

describe('Paylaşım URL formatı', () => {
  const origin = 'https://saharaelectronics.az';
  const pathname = '/';

  const productUrl = (product: Product) =>
    `${origin}${pathname}?product=${encodeURIComponent(product.id)}`;

  it('məhsul URL-i düzgün formatda formalaşır', () => {
    const product = makeProduct('ardo-hood-500', 'HOD-500');
    expect(productUrl(product)).toBe('https://saharaelectronics.az/?product=ardo-hood-500');
  });

  it('xüsusi simvol olan id-lər URL-encode edilir', () => {
    const product = makeProduct('ardo hood 500', 'HOD 500');
    const url = productUrl(product);
    expect(url).not.toContain(' ');
    expect(url).toContain('ardo%20hood%20500');
  });
});

// ─── catalogApi.track ─────────────────────────────────────────────────────
// Not: Bu testlər vitest default (node) mühitində işləyir.
// navigator.sendBeacon node mühitində yoxdur — fetch fallback yolunu test edirik.

describe('catalogApi.track — analitika izləmə (fetch fallback)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // sendBeacon-u sil ki, fetch fallback-a düşsün
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { sendBeacon: undefined },
    });
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 })
    );
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { sendBeacon: undefined },
    });
  });

  it('fetch fallback-da catalog_view düzgün payload göndərir', async () => {
    catalogApi.track('catalog_view');
    await new Promise((r) => setTimeout(r, 10));
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/events',
      expect.objectContaining({ method: 'POST' })
    );
    const callInit = fetchSpy.mock.calls[0][1] as RequestInit;
    const payload = JSON.parse(callInit.body as string);
    expect(payload.type).toBe('catalog_view');
  });

  it('fetch fallback-da product_view productId ilə göndərilir', async () => {
    catalogApi.track('product_view', 'ardo-hood-500');
    await new Promise((r) => setTimeout(r, 10));
    const callInit = fetchSpy.mock.calls[0][1] as RequestInit;
    const payload = JSON.parse(callInit.body as string);
    expect(payload.type).toBe('product_view');
    expect(payload.productId).toBe('ardo-hood-500');
  });

  it('fetch fallback-da contact_whatsapp hadisəsi göndərilir', async () => {
    catalogApi.track('contact_whatsapp', 'ardo-hood-500');
    await new Promise((r) => setTimeout(r, 10));
    const callInit = fetchSpy.mock.calls[0][1] as RequestInit;
    const payload = JSON.parse(callInit.body as string);
    expect(payload.type).toBe('contact_whatsapp');
    expect(payload.productId).toBe('ardo-hood-500');
  });

  it('fetch fallback-da contact_call hadisəsi göndərilir', async () => {
    catalogApi.track('contact_call', 'ardo-kon-200');
    await new Promise((r) => setTimeout(r, 10));
    const callInit = fetchSpy.mock.calls[0][1] as RequestInit;
    const payload = JSON.parse(callInit.body as string);
    expect(payload.type).toBe('contact_call');
  });
});
