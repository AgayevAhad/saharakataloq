# PROMPT 04 — `site/server.mjs` 3105 Sətiri API Router Fayllarına Böl

> **Tətbiq yeri:** `site/`  
> **Risk:** Yüksək — backend məntiqi; diqqətli test tələb edir  
> **Ön şərt:** PROMPT_00 tamamlanmış olmalıdır; PROMPT_01-03-dən müstəqildir  
> **Nəticə:** 3105 sətirlik server.mjs → 1 kiçik başlatma faylı + 6 API router faylı

---

## Kontekst

`site/server.mjs` hazırda 3105 sətirdir. Bu tək faylda aşağıdakılar var:
- HTTP server yaratma
- Miqrasiya başlatma
- Statik fayl servis etmə
- `/api/catalog` endpoint-ləri
- `/api/admin/products` endpoint-ləri
- `/api/admin/brands` endpoint-ləri
- `/api/admin/categories` endpoint-ləri
- `/api/admin/media` endpoint-ləri
- `/api/admin/analytics` endpoint-ləri
- `/api/admin/snapshots` endpoint-ləri
- `/api/admin/settings` endpoint-ləri
- Auth (login, logout, CSRF)
- Rate limiting məntiqi

---

## Yaradılacaq Fayl Strukturu

```
site/
├── server.mjs           ← yalnız başlatma (~100 sətir)
└── api/
    ├── router.mjs       ← bütün route-ları qeydə alır
    ├── auth.mjs         ← login, logout, CSRF, session yoxlama
    ├── catalog.mjs      ← /api/catalog, /api/events
    ├── products.mjs     ← /api/admin/products
    ├── media.mjs        ← /api/admin/media
    ├── snapshots.mjs    ← /api/admin/snapshots
    └── settings.mjs     ← /api/admin/settings, analytics, logs, password
```

---

## İcra Qaydası

### Addım 1: Mövcud `server.mjs`-i analiz et

`site/server.mjs` faylını oxu. Hər endpoint-i müəyyənləşdir:
- `if (req.method === 'GET' && req.url === '/api/catalog')` kimi blokları tap
- Rate limiting middleware-ini tap
- Session yoxlama funksiyasını tap
- CSRF yoxlama funksiyasını tap
- Startup (miqrasiya, init) məntiqini tap

### Addım 2: `site/api/` qovluğunu yarat

```bash
mkdir -p site/api
```

### Addım 3: `site/api/auth.mjs` yarat

Mövcud `server.mjs`-dən aşağıdakıları köçür:
- `POST /api/admin/login` endpoint-i
- `POST /api/admin/logout` endpoint-i
- `GET /api/admin/data` endpoint-i
- `POST /api/admin/change-password` endpoint-i
- Session yoxlama funksiyası (digər router-lar bu funksiyanı import edəcək)
- CSRF token yoxlama funksiyası
- Rate limiting funksiyası

```javascript
// site/api/auth.mjs
export function createAuthRouter({ db, sessions, csrfTokens, rateLimiter }) {
  return async function handleAuth(req, res, url) {
    // login endpoint
    if (req.method === 'POST' && url.pathname === '/api/admin/login') {
      // ... mövcud login məntiqi
      return true; // handled
    }
    // logout endpoint
    if (req.method === 'POST' && url.pathname === '/api/admin/logout') {
      // ... mövcud logout məntiqi
      return true;
    }
    // ... digər auth endpoint-lər
    return false; // not handled
  };
}

// Session yoxlama - digər router-lar import edir
export function requireSession(req, sessions, csrfTokens) {
  // ... mövcud session yoxlama məntiqi
}
```

### Addım 4: `site/api/catalog.mjs` yarat

```javascript
// site/api/catalog.mjs
export function createCatalogRouter({ db, rateLimiter }) {
  return async function handleCatalog(req, res, url) {
    // GET /api/catalog
    if (req.method === 'GET' && url.pathname === '/api/catalog') {
      // ... mövcud catalog GET məntiqi
      return true;
    }
    // POST /api/events (tracking)
    if (req.method === 'POST' && url.pathname === '/api/events') {
      // ... mövcud tracking məntiqi
      return true;
    }
    return false;
  };
}
```

### Addım 5: `site/api/products.mjs` yarat

Admin məhsul endpoint-ləri:
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `POST /api/admin/publish` (kataloqu nəşr et)
- `PUT /api/admin/catalog` (kataloqu yadda saxla)

```javascript
// site/api/products.mjs
import { requireSession } from './auth.mjs';

export function createProductsRouter({ db, sessions, csrfTokens }) {
  return async function handleProducts(req, res, url) {
    // Session yoxla
    const session = requireSession(req, sessions, csrfTokens);
    if (!session) return false; // auth router cavab verəcək

    // GET /api/admin/products
    if (req.method === 'GET' && url.pathname === '/api/admin/products') {
      // ...
      return true;
    }
    // ... digər product endpoint-lər
    return false;
  };
}
```

### Addım 6: `site/api/media.mjs` yarat

- `POST /api/admin/media` (upload)
- `DELETE /api/admin/media/:id`
- `PATCH /api/admin/media/:id` (crop, order, alt yenilə)

### Addım 7: `site/api/snapshots.mjs` yarat

- `GET /api/admin/snapshots`
- `POST /api/admin/snapshots`
- `POST /api/admin/snapshots/restore`
- `DELETE /api/admin/snapshots/:id`

### Addım 8: `site/api/settings.mjs` yarat

- `GET /api/admin/analytics`
- `GET /api/admin/logs`
- `POST /api/admin/logs/clear`
- `POST /api/admin/catalog/toggle-status`
- `GET /api/admin/data` (admin data)

### Addım 9: `site/api/router.mjs` yarat

```javascript
// site/api/router.mjs
import { createAuthRouter } from './auth.mjs';
import { createCatalogRouter } from './catalog.mjs';
import { createProductsRouter } from './products.mjs';
import { createMediaRouter } from './media.mjs';
import { createSnapshotsRouter } from './snapshots.mjs';
import { createSettingsRouter } from './settings.mjs';

export function createApiRouter({ db, sessions, csrfTokens, rateLimiter }) {
  const authRouter = createAuthRouter({ db, sessions, csrfTokens, rateLimiter });
  const catalogRouter = createCatalogRouter({ db, rateLimiter });
  const productsRouter = createProductsRouter({ db, sessions, csrfTokens });
  const mediaRouter = createMediaRouter({ db, sessions, csrfTokens });
  const snapshotsRouter = createSnapshotsRouter({ db, sessions, csrfTokens });
  const settingsRouter = createSettingsRouter({ db, sessions, csrfTokens });

  return async function handleApi(req, res, url) {
    // Sıra ilə hər router-ı yoxla
    if (await authRouter(req, res, url)) return;
    if (await catalogRouter(req, res, url)) return;
    if (await productsRouter(req, res, url)) return;
    if (await mediaRouter(req, res, url)) return;
    if (await snapshotsRouter(req, res, url)) return;
    if (await settingsRouter(req, res, url)) return;

    // Heç bir router cavab vermədisə 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint tapılmadı' }));
  };
}
```

### Addım 10: `site/server.mjs`-i sadələşdir

Mövcud `server.mjs`-in bütün API endpoint məntiqini API router fayllarına köçürdükdən sonra, `server.mjs` yalnız bunları saxlamalıdır:

1. Import-lar (db, migration, backend services)
2. Startup miqrasiyaları (bu qalır)
3. HTTP server yaratma
4. Request handler — API sorğularını `createApiRouter`-a, statik faylları statik handler-a yönləndir

```javascript
// site/server.mjs — sadələşdirilmiş versiya
import http from 'node:http';
// ... digər mövcud import-lar

import { createApiRouter } from './api/router.mjs';
// ... mövcud backend import-ları

// Mövcud startup miqrasiya məntiqi BURADIR — dəyişdirilmir

const apiRouter = createApiRouter({ db, sessions, csrfTokens, rateLimiter });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // API sorğuları
  if (url.pathname.startsWith('/api/')) {
    await apiRouter(req, res, url);
    return;
  }

  // Admin path qorunması
  if (url.pathname.startsWith('/AdministratorNT')) {
    // ... mövcud admin path məntiqi
  }

  // Statik fayllar və SPA fallback
  // ... mövcud statik fayl məntiqi
});
```

---

## Vacib Qeydlər

**Miqrasiya məntiqi dəyişdirilmir** — `server.mjs`-dəki bütün startup miqrasiyaları (`pimV2Migration`, `shadowCutover`, `migrationLock` və s.) olduğu kimi qalır. Bu prompt yalnız API endpoint-lərini köçürür.

**`sessions` və `csrfTokens` obyektləri paylaşılır** — Bütün router-lar eyni `sessions` və `csrfTokens` obyektlərini istifadə etməlidir. Bu obyektlər `server.mjs`-də yaradılır və router-lara prop kimi verilir.

**Xəta handling dəyişdirilmir** — Mövcud xəta tutma məntiqi olduğu kimi köçürülür.

**Rate limiter paylaşılır** — Auth router öz rate limiterini idarə edir; digər router-lar session yoxlamasından istifadə edir.

---

## Uğur Meyarı

- [ ] `site/api/` qovluğunda 7 fayl var
- [ ] `site/server.mjs` 3105 sətirdən ~150 sətirə enib
- [ ] Server işə salındıqda miqrasiyalar uğurla tamamlanır
- [ ] `GET /api/catalog` cavab verir
- [ ] `POST /api/admin/login` işləyir
- [ ] Admin panelə giriş mümkündür
- [ ] Media upload işləyir
- [ ] `npm test` backend testləri keçir
