import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { join } from 'node:path';

const scrypt = promisify(scryptCallback);
const tokenHash = (token) => createHash('sha256').update(token).digest('hex');
const cleanPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.startsWith('994') && digits.length === 12 ? digits.slice(3) : digits;
};
const publicUser = (row) => row && ({
  id: row.id, fullName: row.full_name, phone: row.phone, email: row.email || undefined,
  birthDate: row.birth_date || undefined, role: 'customer', registeredAt: row.created_at,
});
const validPassword = (value) =>
  typeof value === 'string' && value.length >= 8 && /[a-zA-ZƏÖÜĞÇŞİəöüğçşı]/.test(value) && /[A-ZƏÖÜĞÇŞİ]/.test(value) && /\d/.test(value);

export class CustomerSupportStore {
  constructor(dataDir) {
    this.db = new DatabaseSync(join(dataDir, 'customer-support.sqlite'));
    this.db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customer_users (
        id TEXT PRIMARY KEY, full_name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE,
        email TEXT UNIQUE, birth_date TEXT NOT NULL, password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS customer_sessions (
        token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES customer_users(id) ON DELETE CASCADE,
        csrf_token TEXT NOT NULL, expires_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_customer_sessions_user ON customer_sessions(user_id);
      CREATE TABLE IF NOT EXISTS support_attachments (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES customer_users(id) ON DELETE CASCADE,
        mime TEXT NOT NULL, payload BLOB NOT NULL, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS support_messages (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES customer_users(id) ON DELETE CASCADE,
        sender TEXT NOT NULL CHECK(sender IN ('customer', 'admin')),
        kind TEXT NOT NULL CHECK(kind IN ('text', 'image', 'audio')),
        body TEXT NOT NULL DEFAULT '',
        attachment_id TEXT REFERENCES support_attachments(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL, seen_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_support_messages_user_time ON support_messages(user_id, created_at);
    `);
  }

  async register(data) {
    const fullName = String(data.fullName || '').trim().slice(0, 100);
    const phone = cleanPhone(data.phone);
    const email = String(data.email || '').trim().toLowerCase().slice(0, 254) || null;
    const birthDate = String(data.birthDate || '');
    if (fullName.length < 3 || !/^\d{9}$/.test(phone) || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !validPassword(data.password) || data.termsAccepted !== true) {
      return { error: 'Qeydiyyat məlumatları və ya şifrə qaydaları düzgün deyil', status: 400 };
    }
    const salt = randomBytes(16).toString('hex');
    const derived = await scrypt(data.password, salt, 64);
    const id = `customer-${randomBytes(12).toString('hex')}`;
    const createdAt = new Date().toISOString();
    try {
      this.db.prepare('INSERT INTO customer_users VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, fullName, phone, email, birthDate, `${salt}:${derived.toString('hex')}`, createdAt);
    } catch (error) {
      if (String(error).includes('UNIQUE')) return { error: 'Telefon və ya e-poçt artıq qeydiyyatdadır', status: 409 };
      throw error;
    }
    return { user: publicUser(this.db.prepare('SELECT * FROM customer_users WHERE id = ?').get(id)) };
  }

  async login(identifier, password) {
    const input = String(identifier || '').trim();
    const key = input.includes('@') ? input.toLowerCase() : cleanPhone(input);
    const user = this.db.prepare('SELECT * FROM customer_users WHERE phone = ? OR email = ?').get(key, key);
    // Always run scrypt, including for missing accounts, to reduce account enumeration by timing.
    const [salt, expectedHex] = (user?.password_hash || `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
    const derived = await scrypt(String(password || ''), salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    if (!user || expected.length !== derived.length || !timingSafeEqual(derived, expected)) return null;
    return publicUser(user);
  }

  createSession(userId, rememberMe = false) {
    const token = randomBytes(32).toString('base64url');
    const csrfToken = randomBytes(24).toString('base64url');
    const maxAge = rememberMe ? 30 * 86400 : 86400;
    this.db.prepare('INSERT INTO customer_sessions VALUES (?, ?, ?, ?)')
      .run(tokenHash(token), userId, csrfToken, Date.now() + maxAge * 1000);
    return { token, csrfToken, maxAge };
  }

  session(token) {
    if (!token) return null;
    const row = this.db.prepare(`SELECT s.csrf_token, s.expires_at, u.* FROM customer_sessions s
      JOIN customer_users u ON u.id = s.user_id WHERE s.token_hash = ?`).get(tokenHash(token));
    if (!row) return null;
    if (row.expires_at < Date.now()) {
      this.db.prepare('DELETE FROM customer_sessions WHERE token_hash = ?').run(tokenHash(token));
      return null;
    }
    return { user: publicUser(row), csrfToken: row.csrf_token };
  }

  logout(token) {
    if (token) this.db.prepare('DELETE FROM customer_sessions WHERE token_hash = ?').run(tokenHash(token));
  }

  updateProfile(userId, data) {
    const fullName = String(data.fullName || '').trim().slice(0, 100);
    const email = String(data.email || '').trim().toLowerCase().slice(0, 254) || null;
    const birthDate = String(data.birthDate || '');
    if (fullName.length < 3 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return { error: 'Profil məlumatları düzgün deyil', status: 400 };
    }
    try {
      this.db.prepare('UPDATE customer_users SET full_name = ?, email = ?, birth_date = ? WHERE id = ?')
        .run(fullName, email, birthDate, userId);
    } catch (error) {
      if (String(error).includes('UNIQUE')) return { error: 'E-poçt artıq qeydiyyatdadır', status: 409 };
      throw error;
    }
    return { user: publicUser(this.db.prepare('SELECT * FROM customer_users WHERE id = ?').get(userId)) };
  }

  async changePassword(userId, currentPassword, newPassword, currentToken) {
    if (!validPassword(newPassword)) return { error: 'Yeni şifrə təhlükəsizlik qaydalarına uyğun deyil', status: 400 };
    const row = this.db.prepare('SELECT phone FROM customer_users WHERE id = ?').get(userId);
    if (!row || !(await this.login(row.phone, currentPassword))) return { error: 'Cari şifrə yanlışdır', status: 401 };
    const salt = randomBytes(16).toString('hex');
    const derived = await scrypt(newPassword, salt, 64);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('UPDATE customer_users SET password_hash = ? WHERE id = ?').run(`${salt}:${derived.toString('hex')}`, userId);
      this.db.prepare('DELETE FROM customer_sessions WHERE user_id = ? AND token_hash != ?').run(userId, tokenHash(currentToken));
      this.db.exec('COMMIT');
      return { ok: true };
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  addMessage(userId, sender, body, attachment = null) {
    const cleanBody = String(body || '').trim().slice(0, 3000);
    if ((!cleanBody && !attachment) || String(body || '').length > 3000) return { error: 'Mesaj boşdur və ya çox uzundur', status: 400 };
    const recent = this.db.prepare("SELECT COUNT(*) AS count FROM support_messages WHERE user_id = ? AND sender = ? AND created_at > ?")
      .get(userId, sender, new Date(Date.now() - 60_000).toISOString()).count;
    if (recent >= 20) return { error: 'Mesaj limiti aşıldı. Bir dəqiqə gözləyin.', status: 429 };
    const id = `msg-${randomBytes(12).toString('hex')}`;
    const createdAt = new Date().toISOString();
    let attachmentId = null;
    if (attachment) {
      attachmentId = `attachment-${randomBytes(12).toString('hex')}`;
      this.db.prepare('INSERT INTO support_attachments VALUES (?, ?, ?, ?, ?)')
        .run(attachmentId, userId, attachment.mime, attachment.payload, createdAt);
    }
    this.db.prepare('INSERT INTO support_messages VALUES (?, ?, ?, ?, ?, ?, ?, NULL)')
      .run(id, userId, sender, attachment?.kind || 'text', cleanBody, attachmentId, createdAt);
    return { message: this.db.prepare('SELECT id, user_id AS userId, sender, kind, body, attachment_id AS attachmentId, created_at AS createdAt, seen_at AS seenAt FROM support_messages WHERE id = ?').get(id) };
  }

  messages(userId) {
    return this.db.prepare(`SELECT id, user_id AS userId, sender, kind, body,
      attachment_id AS attachmentId, created_at AS createdAt, seen_at AS seenAt
      FROM support_messages WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 100`)
      .all(userId).reverse();
  }

  inbox() {
    return this.db.prepare(`SELECT u.id AS userId, u.full_name AS fullName, u.phone,
      (SELECT body FROM support_messages m WHERE m.user_id = u.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS lastMessage,
      (SELECT created_at FROM support_messages m WHERE m.user_id = u.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS lastAt,
      (SELECT COUNT(*) FROM support_messages m WHERE m.user_id = u.id AND m.sender = 'customer' AND m.seen_at IS NULL) AS unreadCount
      FROM customer_users u WHERE EXISTS (SELECT 1 FROM support_messages m WHERE m.user_id = u.id)
      ORDER BY lastAt DESC`).all();
  }

  markRead(userId, sender) {
    this.db.prepare('UPDATE support_messages SET seen_at = ? WHERE user_id = ? AND sender = ? AND seen_at IS NULL')
      .run(new Date().toISOString(), userId, sender);
  }

  attachment(id, requesterUserId = null) {
    return this.db.prepare('SELECT mime, payload, user_id AS userId FROM support_attachments WHERE id = ? AND (? IS NULL OR user_id = ?)')
      .get(id, requesterUserId, requesterUserId);
  }

  hasUser(userId) {
    return Boolean(this.db.prepare('SELECT 1 FROM customer_users WHERE id = ?').get(userId));
  }

  close() { this.db.close(); }
}
