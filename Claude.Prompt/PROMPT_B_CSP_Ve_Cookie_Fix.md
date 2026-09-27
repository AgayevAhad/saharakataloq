# PROMPT B — CSP Başlığı + Admin Cookie Secure Fix

> **Tətbiq yeri:** `site/server.mjs`, `site/api/auth.mjs`
> **Risk:** Aşağı — başlıq əlavəsi, davranış dəyişmir
> **Ön şərt:** Yoxdur — müstəqil
> **Nəticə:** XSS qorunması güclənir; HTTPS-də admin cookie düzgün işləyir

---

## Tapşırıq 1: Content-Security-Policy (CSP) Başlığı

### Problem
`server.mjs`-də `X-Frame-Options`, `X-Content-Type-Options` var — amma `Content-Security-Policy` yoxdur. CSP olmadan XSS hücumlarına qarşı qorunma zəifdir.

### Düzəliş

`site/server.mjs`-i aç. Aşağıdakı bloku tap (sətir ~319):

```javascript
// MÖVCUD:
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
```

Bu bloku aşağıdakı ilə **əvəz et:**

```javascript
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'off',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    // Şəkillər: öz server + data URI (crop üçün) + Google Fonts şəkillər
    "img-src 'self' data: blob: https://fonts.gstatic.com",
    // Stillər: öz server + Google Fonts + inline stil (React inline style üçün)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Fontlar: öz server + Google Fonts
    "font-src 'self' https://fonts.gstatic.com",
    // Skriptlər: yalnız öz server (React bundle)
    "script-src 'self'",
    // API çağırışları: yalnız öz server
    "connect-src 'self'",
    // Media faylları: öz server + blob (video üçün)
    "media-src 'self' blob:",
    // Iframe: heç kim
    "frame-src 'none'",
    // Object/embed: heç kim
    "object-src 'none'",
    // Base URI: yalnız öz server
    "base-uri 'self'",
    // Form: yalnız öz server
    "form-action 'self'",
    // Upgrade insecure requests (HTTPS-də)
    "upgrade-insecure-requests",
  ].join('; '),
};
```

> **Qeyd:** `'unsafe-inline'` `style-src`-da React-in inline `style={{}}` istifadəsi üçün lazımdır. Gələcəkdə CSS-in-JS olmadan tam `nonce` əsaslı CSP-ə keçmək mümkündür — amma bu sonrakı mərhələdir.

---

## Tapşırıq 2: Admin Cookie — `x-forwarded-proto` Fix

### Problem

`site/api/auth.mjs` sətir 243:
```javascript
// MÖVCUD — yanlış (yalnız socket şifrələməsini yoxlayır):
`sahara_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}${req.socket.encrypted ? '; Secure' : ''}`
```

Nginx/Caddy kimi reverse proxy arxasında `req.socket.encrypted` həmişə `false`-dur çünki proxy ilə server arasında HTTP işləyir. Nəticədə HTTPS saytda admin cookie `Secure` bayrağı almır.

**Müştəri cookie-si düzgün yazılıb** (sətir 58):
```javascript
// DÜZGÜN — həm socket, həm proxy yoxlayır:
`... ${req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`
```

### Düzəliş

`site/api/auth.mjs` faylını aç. **Sətir 243**-ü tap:

```javascript
// BU SƏTİRİ TAP:
'Set-Cookie': `sahara_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}${req.socket.encrypted ? '; Secure' : ''}`,
```

**Belə dəyiş:**
```javascript
'Set-Cookie': `sahara_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}${req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`,
```

**Eyni düzəlişi logout cookie-si üçün də et** (sətir ~334):
```javascript
// BU SƏTİRİ TAP:
'Set-Cookie': `sahara_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${req.socket.encrypted ? '; Secure' : ''}`,

// BELƏ DƏYİŞ:
'Set-Cookie': `sahara_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`,
```

---

## Tapşırıq 3: `remoteIp()` — X-Forwarded-For Spoofing Yoxlaması

`site/api/helpers.mjs`-dəki `remoteIp` funksiyasını tap:

```javascript
// MÖVCUD remoteIp — yoxla:
export const remoteIp = (req) => {
  // X-Forwarded-For başlığını oxuyursa — yoxla
};
```

Əgər `remoteIp` `X-Forwarded-For` başlığından IP oxuyursa, **yalnız trusted proxy-dən gələn başlıqları qəbul etmək lazımdır.** Aşağıdakı ilə müqayisə et — əgər belə deyilsə, yenilə:

```javascript
export const remoteIp = (req) => {
  // Trusted proxy arxasında ilk IP-ni al
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // İlk IP real client IP-sidir (soldan)
    const firstIp = String(forwarded).split(',')[0].trim();
    // Sadə IPv4/IPv6 format yoxlaması
    if (/^[\d.:a-fA-F]+$/.test(firstIp)) return firstIp;
  }
  return req.socket?.remoteAddress || '127.0.0.1';
};
```

> **Qeyd:** Nginx konfiqurasiyasında `proxy_set_header X-Forwarded-For $remote_addr;` ilə yalnız real IP-nin ötürüldüyünü təmin et — bu server tərəfdə spoofing-ə qarşı ən güclü qorunmadır.

---

## Uğur Meyarı

- [ ] `curl -I https://saytadresin/api/catalog` cavabında `Content-Security-Policy` başlığı var
- [ ] `X-Frame-Options: DENY` hələ mövcuddur
- [ ] HTTPS-də admin cookie `Set-Cookie` başlığında `; Secure` var
- [ ] HTTP-də (lokal test) admin cookie `; Secure` almır (düzgündür)
- [ ] Admin girişi hələ də işləyir
- [ ] Katalog düzgün yüklənir (CSS/font/şəkil problemsiz)
- [ ] `npm test` heç bir test sınmır
