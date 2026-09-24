import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { chmodSync, existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  send,
  remoteIp,
  isLocalNetwork,
  parseCookies,
  readBody,
  safeText,
} from './helpers.mjs';

export const SESSION_TTL = 8 * 60 * 60 * 1000;

export const sessionFor = (req, sessions) => {
  const token = parseCookies(req).sahara_admin;
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now() || session.ip !== remoteIp(req)) {
    if (token) sessions.delete(token);
    return null;
  }
  session.expiresAt = Date.now() + SESSION_TTL;
  return session;
};

export const requireAdmin = (req, res, sessions, csrf = false) => {
  if (!isLocalNetwork(req)) {
    send(res, 404, { error: 'Tapılmadı' });
    return null;
  }
  const session = sessionFor(req, sessions);
  if (!session) {
    send(res, 401, { error: 'Admin girişi tələb olunur' });
    return null;
  }
  if (csrf && req.headers['x-csrf-token'] !== session.csrfToken) {
    send(res, 403, { error: 'Təhlükəsizlik tokeni etibarsızdır' });
    return null;
  }
  return session;
};

export const requireCustomer = (req, res, customerStore, csrf = false) => {
  const session = customerStore.session(parseCookies(req).sahara_customer);
  if (!session) {
    send(res, 401, { error: 'Qeydiyyatlı hesabınıza daxil olun' });
    return null;
  }
  if (csrf && req.headers['x-csrf-token'] !== session.csrfToken) {
    send(res, 403, { error: 'Təhlükəsizlik tokeni etibarsızdır' });
    return null;
  }
  return session;
};

export const customerCookie = (token, maxAge, req) =>
  `sahara_customer=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`;

export function createAuthRouter({
  sessions,
  loginAttempts,
  customerLoginAttempts,
  customerStore,
  draftDatabase,
  getAdminPassword,
  setAdminPassword,
  ROOT,
}) {
  return async function handleAuth(req, res, path) {
    // Customer Register
    if (path === '/api/customer/register' && req.method === 'POST') {
      const ip = remoteIp(req);
      const attempts = customerLoginAttempts.get(`register:${ip}`) || {
        count: 0,
        resetAt: Date.now() + 3600_000,
      };
      if (attempts.resetAt < Date.now()) {
        attempts.count = 0;
        attempts.resetAt = Date.now() + 3600_000;
      }
      if (attempts.count >= 8) return send(res, 429, { error: 'Qeydiyyat limiti aşılıb' });
      attempts.count += 1;
      customerLoginAttempts.set(`register:${ip}`, attempts);
      const result = await customerStore.register(await readBody(req));
      if (result.error) return send(res, result.status, { error: result.error });
      const session = customerStore.createSession(result.user.id, true);
      send(
        res,
        201,
        { user: result.user, csrfToken: session.csrfToken },
        {
          'Set-Cookie': customerCookie(session.token, session.maxAge, req),
        }
      );
      return true;
    }

    // Customer Login
    if (path === '/api/customer/login' && req.method === 'POST') {
      const ip = remoteIp(req);
      const attempts = customerLoginAttempts.get(`login:${ip}`) || {
        count: 0,
        resetAt: Date.now() + 900_000,
      };
      if (attempts.resetAt < Date.now()) {
        attempts.count = 0;
        attempts.resetAt = Date.now() + 900_000;
      }
      if (attempts.count >= 10)
        return send(res, 429, { error: 'Çoxsaylı giriş cəhdi. 15 dəqiqə gözləyin.' });
      const body = await readBody(req);
      const user = await customerStore.login(body.identifier, body.password);
      if (!user) {
        attempts.count += 1;
        customerLoginAttempts.set(`login:${ip}`, attempts);
        return send(res, 401, { error: 'Telefon/e-poçt və ya şifrə yanlışdır' });
      }
      customerLoginAttempts.delete(`login:${ip}`);
      const session = customerStore.createSession(user.id, Boolean(body.rememberMe));
      send(
        res,
        200,
        { user, csrfToken: session.csrfToken },
        {
          'Set-Cookie': customerCookie(session.token, session.maxAge, req),
        }
      );
      return true;
    }

    // Customer Session
    if (path === '/api/customer/session' && req.method === 'GET') {
      const session = customerStore.session(parseCookies(req).sahara_customer);
      send(res, 200, session || { user: null, csrfToken: null });
      return true;
    }

    // Customer Logout
    if (path === '/api/customer/logout' && req.method === 'POST') {
      const session = requireCustomer(req, res, customerStore, true);
      if (!session) return true;
      customerStore.logout(parseCookies(req).sahara_customer);
      send(
        res,
        200,
        { ok: true },
        {
          'Set-Cookie': customerCookie('', 0, req),
        }
      );
      return true;
    }

    // Customer Profile
    if (path === '/api/customer/profile' && req.method === 'PATCH') {
      const session = requireCustomer(req, res, customerStore, true);
      if (!session) return true;
      const result = customerStore.updateProfile(session.user.id, await readBody(req));
      if (result.error) {
        send(res, result.status, { error: result.error });
      } else {
        send(res, 200, result);
      }
      return true;
    }

    // Customer Password Change
    if (path === '/api/customer/password' && req.method === 'POST') {
      const session = requireCustomer(req, res, customerStore, true);
      if (!session) return true;
      const body = await readBody(req);
      const result = await customerStore.changePassword(
        session.user.id,
        body.currentPassword,
        body.newPassword,
        parseCookies(req).sahara_customer
      );
      if (result.error) {
        send(res, result.status, { error: result.error });
      } else {
        send(res, 200, { ok: true });
      }
      return true;
    }

    // Admin Login
    if (path === '/api/admin/login' && req.method === 'POST') {
      if (!isLocalNetwork(req)) {
        send(res, 404, { error: 'Tapılmadı' });
        return true;
      }
      const ip = remoteIp(req);
      const attempts = loginAttempts.get(ip) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 };
      if (attempts.resetAt < Date.now()) {
        attempts.count = 0;
        attempts.resetAt = Date.now() + 15 * 60 * 1000;
      }
      if (attempts.count >= 8) {
        send(res, 429, {
          error: 'Çoxsaylı uğursuz cəhd. 15 dəqiqə sonra yenidən yoxlayın.',
        });
        return true;
      }
      const { password = '' } = await readBody(req);
      const adminPassword = getAdminPassword();
      const actual = createHash('sha256').update(String(password)).digest();
      const expected = createHash('sha256').update(adminPassword).digest();
      const userAgent = safeText(req.headers['user-agent'] || '', 300);
      if (!timingSafeEqual(actual, expected)) {
        attempts.count += 1;
        loginAttempts.set(ip, attempts);
        draftDatabase.logAction({
          category: 'auth',
          action: 'login_failed',
          title: 'Uğursuz giriş cəhdi',
          details: 'Yanlış şifrə daxil edildi',
          ipAddress: ip,
          userAgent,
          status: 'danger',
        });
        send(res, 401, { error: 'Şifrə yanlışdır' });
        return true;
      }
      loginAttempts.delete(ip);
      const token = randomBytes(32).toString('base64url');
      const csrfToken = randomBytes(24).toString('base64url');
      sessions.set(token, { ip, csrfToken, expiresAt: Date.now() + SESSION_TTL });
      draftDatabase.logAction({
        category: 'auth',
        action: 'login_success',
        title: 'Admin panelə uğurlu giriş',
        details: 'Yeni idarəetmə sessiyası başlandı',
        ipAddress: ip,
        userAgent,
        status: 'success',
      });
      send(
        res,
        200,
        { ok: true, csrfToken },
        {
          'Set-Cookie': `sahara_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}${req.socket.encrypted ? '; Secure' : ''}`,
        }
      );
      return true;
    }

    // Admin Session
    if (path === '/api/admin/session' && req.method === 'GET') {
      if (!isLocalNetwork(req)) {
        send(res, 404, { error: 'Tapılmadı' });
        return true;
      }
      const session = sessionFor(req, sessions);
      if (!session) {
        send(res, 200, { authenticated: false });
      } else {
        send(res, 200, { authenticated: true, csrfToken: session.csrfToken });
      }
      return true;
    }

    // Admin Change Password
    if (path === '/api/admin/change-password' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      const { oldPassword = '', newPassword = '' } = await readBody(req);
      if (!newPassword || newPassword.length < 6) {
        send(res, 400, { error: 'Yeni şifrə ən azı 6 simvoldan ibarət olmalıdır' });
        return true;
      }
      const adminPassword = getAdminPassword();
      const actual = createHash('sha256').update(String(oldPassword)).digest();
      const expected = createHash('sha256').update(adminPassword).digest();
      if (!timingSafeEqual(actual, expected)) {
        send(res, 401, { error: 'Köhnə şifrə yanlışdır' });
        return true;
      }
      setAdminPassword(String(newPassword));
      process.env.ADMIN_PASSWORD = String(newPassword);
      try {
        const envPath = join(ROOT, '.env');
        let envText = existsSync(envPath) ? await readFile(envPath, 'utf8') : '';
        if (envText.includes('ADMIN_PASSWORD=')) {
          envText = envText.replace(
            /ADMIN_PASSWORD=.*(\r?\n|$)/,
            `ADMIN_PASSWORD=${newPassword}$1`
          );
        } else {
          envText += `\nADMIN_PASSWORD=${newPassword}\n`;
        }
        await writeFile(envPath, envText, { mode: 0o600 });
        try {
          chmodSync(envPath, 0o600);
        } catch {}
      } catch (err) {
        console.error('Failed to update .env password file:', err);
      }
      const userAgent = safeText(req.headers['user-agent'] || '', 300);
      draftDatabase.logAction({
        category: 'auth',
        action: 'password_change',
        title: 'Admin şifrəsi dəyişdirildi',
        details: 'Admin girişi üçün yeni şifrə təyin edildi',
        ipAddress: session.ip,
        userAgent,
        status: 'warning',
      });
      send(res, 200, { ok: true });
      return true;
    }

    // Admin Logout
    if (path === '/api/admin/logout' && req.method === 'POST') {
      const session = requireAdmin(req, res, sessions, true);
      if (!session) return true;
      const userAgent = safeText(req.headers['user-agent'] || '', 300);
      draftDatabase.logAction({
        category: 'auth',
        action: 'logout',
        title: 'Admin çıxışı',
        details: 'Admin sessiyası sonlandırıldı',
        ipAddress: session.ip,
        userAgent,
        status: 'info',
      });
      sessions.delete(parseCookies(req).sahara_admin);
      send(
        res,
        200,
        { ok: true },
        {
          'Set-Cookie': `sahara_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${req.socket.encrypted ? '; Secure' : ''}`,
        }
      );
      return true;
    }

    return false;
  };
}
