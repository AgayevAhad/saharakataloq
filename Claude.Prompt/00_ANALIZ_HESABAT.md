# ArdoKataloq — Public Buraxılış Analizi
## Senior Code Review — Kataloq Fokus

---

## A. REFAKTORINQ VƏZİYYƏTİ

| Göstərici | Vəziyyət |
|---|---|
| `App.tsx` → 94 sətir | ✅ |
| `CatalogAdmin.tsx` → 49 sətir (re-export) | ✅ |
| `server.mjs` → 683 sətir | ✅ |
| `index.css` → 12 sətir | ✅ |
| `api/` qovluğu (6 router fayl) | ✅ |
| Lazy loading (8 lazy import CatalogApp-da) | ✅ |
| `react-router-dom` v6 | ✅ |
| `isSiteMode` sıfıra enib | ✅ |
| Test sayı: 92 | ✅ |
| Vite `manualChunks` | ✅ |

**Refaktorinq tamamdır. Qalan işlər yalnız public hazırlıq üçündür.**

---

## B. KRİTİK PROBLEMLƏR (Public-ə buraxmadan əvvəl MÜTLƏQ həll edilməlidir)

### 🔴 B1 — Media Upload Faylı Diskə Yazmır (BUG)

`api/media.mjs`-də fayl upload qəbul edilir, MIME tipi yoxlanılır, fayl adı yaradılır — **amma diskə yazılmır!**

```javascript
// api/media.mjs — mövcud kod:
const buffer = await readBinaryBody(req);
if (!validMediaSignature(buffer, contentType)) { ... }
await mkdir(MEDIA_DIR, { recursive: true });
const fileName = `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}.${mediaInfo[0]}`;
// ← BURADA writeFile() OLMALIDIR — YOX!
send(res, 201, { url: `/uploads/${fileName}`, ... });
```

Admin şəkil yükləyir, uğurlu cavab alır, URL alır — amma server restart-dan sonra fayl yoxdur. Bu kritik bug-dır.

---

### 🔴 B2 — Admin Cookie HTTPS-də `Secure` Bayrağı Almır (Reverse Proxy Arxasında)

```javascript
// api/auth.mjs sətir 243 — admin cookie:
`sahara_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${...}${req.socket.encrypted ? '; Secure' : ''}`

// müştəri cookie (düzgün):
`sahara_customer=...; ${req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`
```

Müştəri cookie `x-forwarded-proto` başlığını yoxlayır (reverse proxy üçün düzgün). Admin cookie **yalnız** `req.socket.encrypted` yoxlayır — reverse proxy arxasında bu həmişə `false` olur. Nəticə: HTTPS saytda admin cookie `Secure` bayrağı almır.

---

### 🔴 B3 — Content-Security-Policy (CSP) Başlığı Yoxdur

`server.mjs`-də təhlükəsizlik başlıqları:
```javascript
'X-Content-Type-Options': 'nosniff',   ✅
'X-Frame-Options': 'DENY',             ✅
'Referrer-Policy': '...',              ✅
// Content-Security-Policy:            ❌ YOX
```

CSP olmadan XSS hücumları daha təhlükəlidir. Admin paneli olan bir sayt üçün bu qorunma vacibdir.

---

### 🔴 B4 — Admin Parolu SHA-256 ilə Saxlanılır (Zəif)

```javascript
// auth.mjs:
const actual = createHash('sha256').update(String(password)).digest();
const expected = createHash('sha256').update(adminPassword).digest();
```

SHA-256 sürətli hash alqoritmidir — parol sındırma üçün GPU ilə saniyədə milyardlarla cəhd mümkündür. Admin parolu üçün `scrypt` (artıq Node.js-də mövcuddur) istifadə edilməlidir.

**.env.example-dakı default parol:**
```
ADMIN_PASSWORD=1234567
```
Bu default parol heç vaxt production-da istifadə edilməməlidir.

---

### 🔴 B5 — Admin Panel Yalnız Local Network-dən Əlçatandır — Bu Məhdudiyyət Public-də Problem Yarada Bilər

```javascript
// server.mjs + auth.mjs:
if (!isLocalNetwork(req)) {
  send(res, 404, { error: 'Tapılmadı' });
  return;
}
```

Əgər server VPS/bulud-da işləyəcəksə və admin uzaqdan giriş etmək istəyirsə — bu məhdudiyyət blok edəcək. **Bunun necə işləyəcəyini qərar vermək lazımdır:** ya VPN, ya da bu yoxlamanı dəyişmək.

---

## C. ORTA PROBLEMLƏR (İlk həftədə həll edilməlidir)

### 🟠 C1 — Vite Production Sourcemap Konfiqurasiyası Aydın Deyil

`vite.config.ts`-də `sourcemap` açıq şəkildə `false` yazılmayıb. Default davranış Vite v6-da `false`-dur — amma açıq yazmaq daha etibarlıdır. Production sourcemap açıq olsa, istifadəçi brauzerindən mənbə kodu oxunur.

### 🟠 C2 — `process.env.ADMIN_PASSWORD` Runtime-da Dəyişdirilir

```javascript
// auth.mjs:
process.env.ADMIN_PASSWORD = String(newPassword);
```

Parol dəyişdikdə həm `.env` faylı, həm `process.env` güncəllənir. Bu yanaşma işləyir amma təhlükəlidir: server çökərsə, yeni parol yalnız `.env`-dədir. Daha etibarlı: parol SQLite-da hash kimi saxlanılmalıdır.

### 🟠 C3 — Admin Panel Yalnız Local Network-ə Açıqdır — Lakin Catalog Public-ə Açılacaq

Kataloq public domain-dən açılacaqsa, `isLocalNetwork` yoxlaması admin girişini bloklayacaq — **əgər server remote-dadırsa.** Bu arxitektura qərarının aydınlaşdırılması lazımdır.

### 🟠 C4 — `console.log` Production Build-də Çıxarılmır

`vite.config.ts`-də `build.minify` default `esbuild`-dir, amma `drop: ['console']` yazılmayıb. Debug məlumatları istifadəçi brauzerinin konsolunda görünə bilər.

### 🟠 C5 — Session Memory-dadır, Restart-da Silinir

```javascript
const sessions = new Map(); // ← server.mjs
```

Server restart-da bütün admin sessionları silinir. Deployment-dən sonra admin yenidən giriş etməlidir. Bu kritik deyil amma gözlənilməlidir.

---

## D. AŞAĞI RİSKLİ / YAXŞILAŞDIRMA

### 🟡 D1 — `ADMIN_PASSWORD=1234567` Default — .env.example

`.env.example`-da default parol var. Production `.env` faylının fərqli, güclü parol içərdiyi təsdiqlənməlidir.

### 🟡 D2 — Admin Cookie `x-forwarded-proto` Yoxlamıyor

(B2-nin alt məsələsi — ayrıca prompt yazılacaq)

### 🟡 D3 — Uğur Audit Logu IP Ünvanı

Admin giriş loqunda `ipAddress` saxlanılır — bu yaxşıdır. Amma reverse proxy arxasında `X-Forwarded-For` spoofing mümkündür. `remoteIp()` funksiyası bunu idarə edirmi yoxlanılmalıdır.

---

## E. XÜLASƏ — PROMPT PLANI

| # | Problem | Prioritet |
|---|---|---|
| PROMPT_A | Media upload faylı diskə yaz (BUG FIX) | 🔴 Kritik |
| PROMPT_B | CSP başlığı əlavə et + Admin cookie `x-forwarded-proto` fix | 🔴 Kritik |
| PROMPT_C | Admin parolunu scrypt ilə hash et + SQLite-da saxla | 🔴 Kritik |
| PROMPT_D | Vite production `drop console` + `sourcemap: false` | 🟠 Orta |
| PROMPT_E | Deployment checklist (nginx, PM2, .env, pre-launch) | 🟠 Orta |
