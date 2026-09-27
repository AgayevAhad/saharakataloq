# PROMPT C — Admin Parolu: SHA-256 → scrypt + SQLite

> **Tətbiq yeri:** `site/api/auth.mjs`, `site/backend/catalogDatabase.mjs`
> **Risk:** Orta — autentifikasiya məntiqi dəyişir, diqqətli test lazımdır
> **Ön şərt:** PROMPT_A tamamlanmış olmalıdır
> **Nəticə:** Admin parolu kriptografik cəhətdən etibarlı şəkildə saxlanılır

---

## Problem

İndiki həll:
```javascript
// Parol yoxlaması — SHA-256 (ZƏIF):
const actual = createHash('sha256').update(String(password)).digest();
const expected = createHash('sha256').update(adminPassword).digest();
```

**Niyə SHA-256 yetərsizdir:**
- SHA-256 çox sürətlidir — GPU ilə saniyədə 10+ milyard cəhd mümkündür
- Salt yoxdur — eyni parol həmişə eyni hash verir
- `.env`-dəki `ADMIN_PASSWORD=1234567` — plain text saxlanılır

**Həll: `scrypt`** — Node.js-in `crypto` modulunda mövcuddur, ləng və salt-əsaslıdır.

---

## Strategiya

Parolu artıq `.env`-də saxlamaq əvəzinə SQLite draft database-də `scrypt` hash + salt kimi saxlayacağıq.

**Keçid planı:**
1. İlk işə salındıqda `.env`-dəki plain text parolu oxu → hash et → DB-yə yaz → `.env`-dən sil
2. Sonrakı girişlərdə yalnız DB-dən hash-i oxu, müqayisə et
3. Parol dəyişdirildikdə yeni hash-i DB-yə yaz

---

## Addım 1: `site/backend/catalogDatabase.mjs`-ə admin parol cədvəli əlavə et

`catalogDatabase.mjs`-i aç. `initializeDraftDb` funksiyasını tap (draft database yaradılması). Cədvəl yaratma bloklarına əlavə et:

```javascript
// Mövcud cədvəl yaratmalarından SONRA əlavə et:
db.prepare(`
  CREATE TABLE IF NOT EXISTS admin_credentials (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`).run();
```

---

## Addım 2: `site/api/auth.mjs`-ə scrypt funksiyaları əlavə et

`site/api/auth.mjs` faylının başına import-u yenilə:

```javascript
// MÖVCUD:
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

// YENİ:
import {
  createHash,
  randomBytes,
  timingSafeEqual,
  scrypt as scryptCallback,
  randomUUID,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

// scrypt parametrləri — N=16384 müvazinəti (server üçün)
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
```

**Hash yaratma funksiyası əlavə et:**
```javascript
async function hashPassword(password) {
  const salt = randomBytes(32).toString('hex');
  const hash = await scrypt(password, salt, SCRYPT_KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return { hash: hash.toString('hex'), salt };
}
```

**Hash müqayisə funksiyası əlavə et:**
```javascript
async function verifyPassword(password, storedHash, storedSalt) {
  const derived = await scrypt(password, storedSalt, SCRYPT_KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  const derivedBuf = Buffer.from(derived);
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (derivedBuf.length !== storedBuf.length) return false;
  return timingSafeEqual(derivedBuf, storedBuf);
}
```

---

## Addım 3: `getAdminPassword()` funksiyasını `getAdminHash()` ilə əvəz et

`auth.mjs`-dəki `getAdminPassword` funksiyasını tap. Onu aşağıdakı ilə əvəz et:

```javascript
// Keçid: DB-də hash yoxdursa .env parolunu hash edib DB-yə yaz
async function ensureAdminHashInDb(draftDatabase) {
  const row = draftDatabase.db
    .prepare('SELECT password_hash, password_salt FROM admin_credentials WHERE id = 1')
    .get();

  if (row) return row; // Artıq DB-də var

  // İlk dəfə: .env-dən plain text parolu oxu, hash et, DB-yə yaz
  const plainPassword = process.env.ADMIN_PASSWORD || '';
  if (!plainPassword) {
    throw new Error('ADMIN_PASSWORD mühit dəyişəni tapılmadı');
  }

  const { hash, salt } = await hashPassword(plainPassword);
  draftDatabase.db.prepare(`
    INSERT OR REPLACE INTO admin_credentials (id, password_hash, password_salt, updated_at)
    VALUES (1, ?, ?, datetime('now'))
  `).run(hash, salt);

  console.log('[auth] Admin parolu ilk dəfə hash edilib DB-yə yazıldı');
  return { password_hash: hash, password_salt: salt };
}
```

---

## Addım 4: Admin giriş endpoint-ini yenilə

`/api/admin/login` blokunu tap. Parol müqayisəsini SHA-256-dan scrypt-ə dəyiş:

```javascript
// SİL — bu iki sətri:
const actual = createHash('sha256').update(String(password)).digest();
const expected = createHash('sha256').update(adminPassword).digest();
if (!timingSafeEqual(actual, expected)) {

// ƏVƏZINƏ:
const credentials = await ensureAdminHashInDb(draftDatabase);
const isValid = await verifyPassword(
  String(password),
  credentials.password_hash,
  credentials.password_salt
);
if (!isValid) {
```

---

## Addım 5: Parol dəyişdirmə endpoint-ini yenilə

`/api/admin/change-password` blokunu tap:

```javascript
// SİL — köhnə müqayisə:
const actual = createHash('sha256').update(String(password)).digest();
const expected = createHash('sha256').update(adminPassword).digest();
if (!timingSafeEqual(actual, expected)) { ... }
process.env.ADMIN_PASSWORD = String(newPassword);
// .env fayına yazma kodu...

// ƏVƏZINƏ — köhnə parolu yoxla, yenisini hash et, DB-yə yaz:
const credentials = await ensureAdminHashInDb(draftDatabase);
const isCurrentValid = await verifyPassword(
  String(currentPassword || password),
  credentials.password_hash,
  credentials.password_salt
);
if (!isCurrentValid) {
  send(res, 401, { error: 'Cari şifrə yanlışdır' });
  return true;
}

const { hash: newHash, salt: newSalt } = await hashPassword(String(newPassword));
draftDatabase.db.prepare(`
  UPDATE admin_credentials
  SET password_hash = ?, password_salt = ?, updated_at = datetime('now')
  WHERE id = 1
`).run(newHash, newSalt);

draftDatabase.logAction({
  category: 'auth',
  action: 'password_change',
  title: 'Admin şifrəsi dəyişdirildi',
  details: 'Scrypt hash ilə yeniləndi',
  ipAddress: remoteIp(req),
  status: 'info',
});
send(res, 200, { ok: true });
```

---

## Addım 6: `.env.example`-ı yenilə

```bash
# .env.example
PORT=3004
HOST=0.0.0.0
# İlk işə salındıqda bu parol scrypt ilə hash edilib DB-yə yazılacaq.
# Sonra bu sətri .env-dən silmək tövsiyə olunur.
# Güclü parol istifadə edin: ən azı 12 simvol, böyük/kiçik hərf + rəqəm
ADMIN_PASSWORD=<buraya_guclu_parol_yaz>
DATA_DIR=./data
```

---

## Uğur Meyarı

- [ ] Server ilk dəfə başladıqda konsolda `[auth] Admin parolu ilk dəfə hash edilib DB-yə yazıldı` mesajı çıxır
- [ ] `site/data/draft.db`-də `admin_credentials` cədvəlindəki `password_hash` sütunu dolu, `password_salt` dolu
- [ ] `password_hash` sütununda plain text parol görünmür
- [ ] Admin girişi düzgün paroldan işləyir
- [ ] Yanlış parolda 401 qaytarır
- [ ] 8 uğursuz cəhddən sonra 429 qaytarır
- [ ] Parol dəyişdirmə işləyir — yeni paroldan giriş olunur
- [ ] `npm test` heç bir test sınmır
