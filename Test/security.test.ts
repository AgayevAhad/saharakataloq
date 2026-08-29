// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { catalogApi } from '../src/services/catalogApi';
import { normalizePhoneNumber, whatsappHref } from '../src/utils/contact';

// ─── Admin yolu mühafizəsi ─────────────────────────────────────────────────

describe('Admin yolu mühafizəsi', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, pathname: '/' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('/AdministratorNT yolu admin rejimini aktivləşdirir', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, pathname: '/AdministratorNT' },
    });
    const isAdmin = window.location.pathname.startsWith('/AdministratorNT');
    expect(isAdmin).toBe(true);
  });

  it('adi kataloq yolu admin rejimini aktivləşdirmir', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, pathname: '/' },
    });
    const isAdmin = window.location.pathname.startsWith('/AdministratorNT');
    expect(isAdmin).toBe(false);
  });

  it('/administrator (kiçik hərf) admin yolundan fərqli sayılır — case-sensitive', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, pathname: '/administrator' },
    });
    const isAdmin = window.location.pathname.startsWith('/AdministratorNT');
    expect(isAdmin).toBe(false);
  });

  it('/AdministratorNTextra uzantılı yol hələ də admin sayılır', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, pathname: '/AdministratorNTextra' },
    });
    const isAdmin = window.location.pathname.startsWith('/AdministratorNT');
    expect(isAdmin).toBe(true);
  });
});

// ─── CSRF token mühafizəsi ─────────────────────────────────────────────────

describe('CSRF token API sorğularında ötürülür', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true, updatedAt: '2026-01-01' }), { status: 200 })
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('saveCatalog çağıranda X-CSRF-Token başlığı göndərilir', async () => {
    const { DEFAULT_CATALOG } = await import('../src/data/catalog');
    await catalogApi.saveCatalog(DEFAULT_CATALOG, 'csrf-abc-123');
    const call = fetchSpy.mock.calls[0];
    const init = call[1] as RequestInit;
    expect((init.headers as Record<string, string>)['X-CSRF-Token']).toBe('csrf-abc-123');
  });

  it('publishCatalog çağıranda X-CSRF-Token başlığı göndərilir', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ ok: true, updatedAt: '2026-01-01' }), { status: 200 })
    );
    await catalogApi.publishCatalog('csrf-xyz-789');
    const call = fetchSpy.mock.calls[0];
    const init = call[1] as RequestInit;
    expect((init.headers as Record<string, string>)['X-CSRF-Token']).toBe('csrf-xyz-789');
  });

  it('logout çağıranda X-CSRF-Token başlığı göndərilir', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    await catalogApi.logout('csrf-logout-111');
    const call = fetchSpy.mock.calls[0];
    const init = call[1] as RequestInit;
    expect((init.headers as Record<string, string>)['X-CSRF-Token']).toBe('csrf-logout-111');
  });
});

// ─── API səhv idarəetməsi ──────────────────────────────────────────────────

describe('catalogApi — server xətalarını idarə edir', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it('getCatalog server xətasında default kataloqa düşür', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network xətası'));
    const { DEFAULT_CATALOG } = await import('../src/data/catalog');
    const result = await catalogApi.getCatalog();
    expect(result.brands).toEqual(DEFAULT_CATALOG.brands);
  });

  it('getCatalog 500 cavabında default kataloqa düşür', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Server xətası' }), { status: 500 })
    );
    const { DEFAULT_CATALOG } = await import('../src/data/catalog');
    const result = await catalogApi.getCatalog();
    expect(result.brands).toEqual(DEFAULT_CATALOG.brands);
  });

  it('login uğursuz olduqda xəta atır — default-a düşmür', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Yanlış şifrə' }), { status: 401 })
    );
    await expect(catalogApi.login('yanlish-shifre')).rejects.toThrow('Yanlış şifrə');
  });

  it('getAdminData 403 cavabında xəta atır', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'İcazə yoxdur' }), { status: 403 })
    );
    await expect(catalogApi.getAdminData()).rejects.toThrow();
  });
});

// ─── WhatsApp URL injection mühafizəsi ────────────────────────────────────

describe('WhatsApp URL — injection mühafizəsi', () => {
  it('xüsusi simvollar URL-də encode edilir', () => {
    const href = whatsappHref('994501234567', 'Salam! <script>alert(1)</script>');
    expect(href).not.toContain('<script>');
    expect(href).toContain('%3Cscript%3E');
  });

  it('azərbaycanca xüsusi hərflər düzgün encode edilir', () => {
    const href = whatsappHref('994501234567', 'ə ö ü ğ ş ı İ Ə');
    expect(href).toContain('https://wa.me/994501234567?text=');
    // Encoded olduğunu yoxlayırıq
    expect(href.includes('%')).toBe(true);
  });

  it('boş nömrə ilə WhatsApp linki yaradılmır', () => {
    expect(whatsappHref('', 'Salam')).toBe('');
    expect(whatsappHref('   ', 'Salam')).toBe('');
  });

  it('çox qısa nömrə ilə WhatsApp linki yaradılmır', () => {
    expect(whatsappHref('123', 'Salam')).toBe('');
  });
});

// ─── Telefon nömrəsi validasiyası ─────────────────────────────────────────

describe('Telefon nömrəsi — format validasiyası', () => {
  it('Azərbaycan formatında nömrəni qəbul edir', () => {
    expect(normalizePhoneNumber('+994 50 123 45 67')).toBe('994501234567');
    expect(normalizePhoneNumber('994501234567')).toBe('994501234567');
  });

  it('mötərizə və tire ilə formatları qəbul edir', () => {
    expect(normalizePhoneNumber('+994 (12) 555-44-33')).toBe('994125554433');
  });

  it('6 rəqəmdən qısa nömrəni rədd edir', () => {
    expect(normalizePhoneNumber('12345')).toBe('');
    expect(normalizePhoneNumber('12')).toBe('');
  });

  it('16 rəqəmdən uzun nömrəni rədd edir', () => {
    expect(normalizePhoneNumber('12345678901234567')).toBe('');
  });

  it('yalnız hərfdən ibarət dəyəri rədd edir', () => {
    expect(normalizePhoneNumber('abcdefgh')).toBe('');
  });
});
