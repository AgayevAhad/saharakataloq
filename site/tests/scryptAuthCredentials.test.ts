import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import {
  hashPassword,
  verifyPassword,
  ensureAdminHashInDb,
  createAuthRouter,
} from '../api/auth.mjs';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';

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

describe('Admin Scrypt Password & SQLite Persistence Suite (PROMPT C)', () => {
  let tempDir: string;
  let draftDbPath: string;
  let draftDbInstance: any;
  let sessions: Map<string, any>;
  let loginAttempts: Map<string, any>;
  let customerLoginAttempts: Map<string, any>;
  const initialPassword = 'InitialSuperSecretAdminPass123!';

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-scrypt-auth-test-'));
    draftDbPath = join(tempDir, 'catalog-draft.sqlite');
    draftDbInstance = createCatalogDatabase(draftDbPath);
    sessions = new Map();
    loginAttempts = new Map();
    customerLoginAttempts = new Map();
  });

  afterEach(() => {
    if (draftDbInstance) {
      draftDbInstance.close();
    }
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('1. hashPassword generates unique 64-byte scrypt hex hash and salt, and verifyPassword validates correctly', async () => {
    const pw = 'MyComplexPassword@2026';
    const { hash: hash1, salt: salt1 } = await hashPassword(pw);
    const { hash: hash2, salt: salt2 } = await hashPassword(pw);

    expect(hash1).toHaveLength(128); // 64 bytes in hex
    expect(salt1).toHaveLength(64); // 32 bytes in hex
    expect(hash1).not.toBe(hash2); // Different salts produce different hashes
    expect(salt1).not.toBe(salt2);

    // Verify correct password
    const match1 = await verifyPassword(pw, hash1, salt1);
    expect(match1).toBe(true);

    // Verify wrong password
    const matchWrong = await verifyPassword('WrongPassword123', hash1, salt1);
    expect(matchWrong).toBe(false);
  });

  it('2. ensureAdminHashInDb creates and persists scrypt hash in admin_credentials SQLite table on first run', async () => {
    const credentials = await ensureAdminHashInDb(draftDbInstance, () => initialPassword);
    expect(credentials.password_hash).toBeDefined();
    expect(credentials.password_salt).toBeDefined();

    // Verify direct SQLite row
    const rawDb = new DatabaseSync(draftDbPath);
    try {
      const row = rawDb
        .prepare('SELECT password_hash, password_salt FROM admin_credentials WHERE id = 1')
        .get() as any;
      expect(row).toBeDefined();
      expect(row.password_hash).toBe(credentials.password_hash);
      expect(row.password_salt).toBe(credentials.password_salt);
    } finally {
      rawDb.close();
    }

    // Subsequent call returns existing without overwriting
    const cached = await ensureAdminHashInDb(draftDbInstance, () => 'DifferentPass');
    expect(cached.password_hash).toBe(credentials.password_hash);
    expect(cached.password_salt).toBe(credentials.password_salt);
  });

  it('3. Admin login validates via scrypt from SQLite and rejects invalid passwords with 401', async () => {
    let currentAdminPass = initialPassword;
    const handleAuth = createAuthRouter({
      sessions,
      loginAttempts,
      customerLoginAttempts,
      draftDatabase: draftDbInstance,
      getAdminPassword: () => currentAdminPass,
      setAdminPassword: (p: string) => {
        currentAdminPass = p;
      },
      ROOT: tempDir,
      customerStore: { session: () => null, login: () => {}, logout: () => {} },
    });

    // 1. Invalid password attempt
    const reqFail = createMockReq({
      method: 'POST',
      body: { password: 'WrongPasswordGiven' },
    });
    const resFail = createMockRes();
    await handleAuth(reqFail, resFail, '/api/admin/login');
    expect(resFail.statusCode).toBe(401);
    expect(JSON.parse(resFail.body).error).toBe('Şifrə yanlışdır');

    // 2. Valid password attempt
    const reqSuccess = createMockReq({
      method: 'POST',
      body: { password: initialPassword },
    });
    const resSuccess = createMockRes();
    await handleAuth(reqSuccess, resSuccess, '/api/admin/login');
    expect(resSuccess.statusCode).toBe(200);
    const json = JSON.parse(resSuccess.body);
    expect(json.ok).toBe(true);
    expect(json.csrfToken).toBeDefined();
    expect(resSuccess.headers['Set-Cookie']).toContain('sahara_admin=');
  });

  it('4. Change password updates SQLite scrypt credentials and enforces new password on next login', async () => {
    let currentAdminPass = initialPassword;
    const handleAuth = createAuthRouter({
      sessions,
      loginAttempts,
      customerLoginAttempts,
      draftDatabase: draftDbInstance,
      getAdminPassword: () => currentAdminPass,
      setAdminPassword: (p: string) => {
        currentAdminPass = p;
      },
      ROOT: tempDir,
      customerStore: { session: () => null, login: () => {}, logout: () => {} },
    });

    // Setup active session
    const token = 'active-admin-token-777';
    const csrf = 'valid-csrf-token-xyz';
    sessions.set(token, {
      ip: '127.0.0.1',
      csrfToken: csrf,
      expiresAt: Date.now() + 3600000,
    });

    const newPassword = 'NewBrandSecureAdminPassword2026!';

    // Change password request
    const reqChange = createMockReq({
      method: 'POST',
      headers: {
        cookie: `sahara_admin=${token}`,
        'x-csrf-token': csrf,
      },
      body: {
        oldPassword: initialPassword,
        newPassword,
      },
    });
    const resChange = createMockRes();

    await handleAuth(reqChange, resChange, '/api/admin/change-password');
    expect(resChange.statusCode).toBe(200);
    expect(JSON.parse(resChange.body).ok).toBe(true);

    // Old password should now fail login
    const reqOldLogin = createMockReq({
      method: 'POST',
      body: { password: initialPassword },
    });
    const resOldLogin = createMockRes();
    await handleAuth(reqOldLogin, resOldLogin, '/api/admin/login');
    expect(resOldLogin.statusCode).toBe(401);

    // New password should succeed login
    const reqNewLogin = createMockReq({
      method: 'POST',
      body: { password: newPassword },
    });
    const resNewLogin = createMockRes();
    await handleAuth(reqNewLogin, resNewLogin, '/api/admin/login');
    expect(resNewLogin.statusCode).toBe(200);
    expect(JSON.parse(resNewLogin.body).ok).toBe(true);
  });
});
