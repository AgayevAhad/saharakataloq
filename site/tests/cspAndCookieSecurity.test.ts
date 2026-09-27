import { describe, it, expect, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { createAuthRouter } from '../api/auth.mjs';
import { send, remoteIp } from '../api/helpers.mjs';

function createMockReq({
  method = 'POST',
  headers = {},
  encrypted = false,
  remoteAddress = '127.0.0.1',
  body = null,
}: {
  method?: string;
  headers?: Record<string, string>;
  encrypted?: boolean;
  remoteAddress?: string;
  body?: any;
}) {
  const emitter = new EventEmitter() as any;
  emitter.method = method;
  emitter.headers = headers;
  emitter.socket = { remoteAddress, encrypted };
  emitter[Symbol.asyncIterator] = async function* () {
    if (body !== null) {
      const buf = Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
      yield buf;
    }
  };
  return emitter;
}

function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '',
    writableEnded: false,
    headersSent: false,
    writeHead(status: number, headers: Record<string, string> = {}) {
      res.statusCode = status;
      res.headers = { ...res.headers, ...headers };
      res.headersSent = true;
    },
    end(data: string = '') {
      res.body = data;
      res.writableEnded = true;
    },
  };
  return res;
}

describe('CSP, Permissions-Policy and Cookie Security Suite (PROMPT B)', () => {
  let sessions: Map<string, any>;
  const adminPassword = 'TestSecureAdminPassword123!';
  const mockDraftDb = {
    logAction: () => {},
  };

  beforeEach(() => {
    sessions = new Map();
  });

  it('1. Verifies CSP, Permissions-Policy and security headers in send() helper', () => {
    const res = createMockRes();
    send(res, 200, { ok: true });

    expect(res.headers['Content-Security-Policy']).toBeDefined();
    expect(res.headers['Content-Security-Policy']).toContain("default-src 'self'");
    expect(res.headers['Content-Security-Policy']).toContain(
      "img-src 'self' data: blob: https://fonts.gstatic.com"
    );
    expect(res.headers['Content-Security-Policy']).toContain(
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
    );
    expect(res.headers['Content-Security-Policy']).toContain("script-src 'self'");
    expect(res.headers['Content-Security-Policy']).toContain('upgrade-insecure-requests');

    expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
    expect(res.headers['X-Frame-Options']).toBe('DENY');
    expect(res.headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers['X-DNS-Prefetch-Control']).toBe('off');
    expect(res.headers['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
  });

  it('2. Admin login Set-Cookie does NOT have Secure on plain local HTTP', async () => {
    const handleAuth = createAuthRouter({
      sessions,
      loginAttempts: new Map(),
      customerLoginAttempts: new Map(),
      draftDatabase: mockDraftDb,
      getAdminPassword: () => adminPassword,
      setAdminPassword: () => {},
      ROOT: '/tmp',
      customerStore: { session: () => null, login: () => {}, logout: () => {} },
    });

    const req = createMockReq({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      encrypted: false,
      body: { password: adminPassword },
    });
    const res = createMockRes();

    const handled = await handleAuth(req, res, '/api/admin/login');
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(200);

    const setCookie = res.headers['Set-Cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('sahara_admin=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    expect(setCookie).not.toContain('; Secure');
  });

  it('3. Admin login Set-Cookie DOES have Secure when behind reverse proxy with x-forwarded-proto: https', async () => {
    const handleAuth = createAuthRouter({
      sessions,
      loginAttempts: new Map(),
      customerLoginAttempts: new Map(),
      draftDatabase: mockDraftDb,
      getAdminPassword: () => adminPassword,
      setAdminPassword: () => {},
      ROOT: '/tmp',
      customerStore: { session: () => null, login: () => {}, logout: () => {} },
    });

    const req = createMockReq({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-proto': 'https',
      },
      encrypted: false, // Node socket is unencrypted because proxy terminates TLS
      body: { password: adminPassword },
    });
    const res = createMockRes();

    const handled = await handleAuth(req, res, '/api/admin/login');
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(200);

    const setCookie = res.headers['Set-Cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('sahara_admin=');
    expect(setCookie).toContain('; Secure');
  });

  it('4. Admin logout Set-Cookie correctly sets Secure flag behind HTTPS reverse proxy', async () => {
    const token = 'active-admin-token-123';
    sessions.set(token, {
      ip: '127.0.0.1',
      csrfToken: 'csrf-xyz',
      expiresAt: Date.now() + 3600000,
    });

    const handleAuth = createAuthRouter({
      sessions,
      loginAttempts: new Map(),
      customerLoginAttempts: new Map(),
      draftDatabase: mockDraftDb,
      getAdminPassword: () => adminPassword,
      setAdminPassword: () => {},
      ROOT: '/tmp',
      customerStore: { session: () => null, login: () => {}, logout: () => {} },
    });

    const req = createMockReq({
      method: 'POST',
      headers: {
        cookie: `sahara_admin=${token}`,
        'x-csrf-token': 'csrf-xyz',
        'x-forwarded-proto': 'https',
      },
      encrypted: false,
    });
    const res = createMockRes();

    const handled = await handleAuth(req, res, '/api/admin/logout');
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(200);

    const setCookie = res.headers['Set-Cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('sahara_admin=;');
    expect(setCookie).toContain('Max-Age=0');
    expect(setCookie).toContain('; Secure');
  });

  it('5. remoteIp safely parses X-Forwarded-For and filters invalid injection', () => {
    const reqValid = createMockReq({
      headers: {
        'x-forwarded-for': '198.51.100.42, 10.0.0.1',
      },
    });
    expect(remoteIp(reqValid)).toBe('198.51.100.42');

    const reqIpv6 = createMockReq({
      headers: {
        'x-forwarded-for': '2001:db8::1',
      },
    });
    expect(remoteIp(reqIpv6)).toBe('2001:db8::1');

    const reqSpoofed = createMockReq({
      headers: {
        'x-forwarded-for': '<script>alert(1)</script>',
      },
      remoteAddress: '127.0.0.1',
    });
    expect(remoteIp(reqSpoofed)).toBe('127.0.0.1');
  });
});
