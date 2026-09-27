# PROMPT A — KRİTİK BUG: Media Upload Faylı Diskə Yazmır

> **Tətbiq yeri:** `site/api/media.mjs`
> **Risk:** Kritik bug — fayl yüklənir amma saxlanmır
> **Ön şərt:** Yoxdur — müstəqil fix
> **Nəticə:** Admin yüklədikdə şəkillər gerçəkdən diskdə saxlanılır

---

## Problem

`site/api/media.mjs`-də upload axını:
1. Faylı qəbul edir ✅
2. MIME tipini yoxlayır ✅
3. Magic byte imzasını yoxlayır ✅
4. Qovluq yaradır ✅
5. Fayl adı yaradır ✅
6. **Faylı diske YAZMIR** ❌
7. Uğurlu cavab göndərir (yanlış) ❌

---

## Düzəliş

`site/api/media.mjs` faylını aç. `handleMedia` funksiyasındakı POST `/api/admin/media` blokunu tap.

**Faylın başına `writeFile` import əlavə et:**

```javascript
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';  // ← writeFile əlavə et
import { join } from 'node:path';
```

**`send(res, 201, {...})` çağırışından ƏVVƏL faylı diskə yaz:**

```javascript
// MÖVCUD KOD (sətir ~55 ətrafı):
await mkdir(MEDIA_DIR, { recursive: true });
const fileName = `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}.${mediaInfo[0]}`;
const rawOrigName = req.headers['x-original-name']
  ? decodeURIComponent(String(req.headers['x-original-name']))
  : req.headers['x-media-alt'];
const originalName = safeText(rawOrigName, 300);
send(res, 201, {   // ← BURADAN ƏVVƏL writeFile lazımdır
  id: `media-${randomBytes(8).toString('hex')}`,
  ...
});

// YENİ KOD — send()-dən əvvəl əlavə et:
await mkdir(MEDIA_DIR, { recursive: true });
const fileName = `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}.${mediaInfo[0]}`;
const filePath = join(MEDIA_DIR, fileName);

// Faylı diskə yaz
await writeFile(filePath, buffer);

const rawOrigName = req.headers['x-original-name']
  ? decodeURIComponent(String(req.headers['x-original-name']))
  : req.headers['x-media-alt'];
const originalName = safeText(rawOrigName, 300);

send(res, 201, {
  id: `media-${randomBytes(8).toString('hex')}`,
  type: mediaInfo[1],
  url: `/uploads/${fileName}`,
  alt: safeText(req.headers['x-media-alt'], 300),
  originalName: originalName || fileName,
});
```

**Xəta tutma əlavə et** — writeFile uğursuz olursa 500 qaytar, 201 yox:

```javascript
// writeFile-i try/catch ilə sar:
try {
  await writeFile(filePath, buffer);
} catch (writeErr) {
  console.error('[media] Fayl yazılarkən xəta:', writeErr);
  send(res, 500, { error: 'Fayl serverə yüklənərkən xəta baş verdi' });
  return true;
}
```

---

## Tam Yenilənmiş Blok

```javascript
if (path === '/api/admin/media' && req.method === 'POST') {
  const session = requireAdmin(req, res, sessions, true);
  if (!session) return true;

  const contentType = String(req.headers['content-type'] || '')
    .split(';')[0]
    .toLowerCase();
  const mediaInfo = mediaUploadTypes[contentType];
  if (!mediaInfo) {
    send(res, 415, { error: 'Yalnız JPG, PNG, WEBP, SVG, MP4 və WEBM qəbul edilir' });
    return true;
  }

  const buffer = await readBinaryBody(req);
  if (!validMediaSignature(buffer, contentType)) {
    send(res, 415, { error: 'Fayl məzmunu seçilən media formatına uyğun deyil' });
    return true;
  }

  // Ölçü limiti: 20MB
  const MAX_BYTES = 20 * 1024 * 1024;
  if (buffer.length > MAX_BYTES) {
    send(res, 413, { error: 'Fayl həcmi 20MB-dan böyük ola bilməz' });
    return true;
  }

  await mkdir(MEDIA_DIR, { recursive: true });
  const ext = mediaInfo[0];
  const fileName = `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}.${ext}`;
  const filePath = join(MEDIA_DIR, fileName);

  try {
    await writeFile(filePath, buffer);
  } catch (writeErr) {
    console.error('[media] Fayl yazılarkən xəta:', writeErr);
    send(res, 500, { error: 'Fayl serverə yüklənərkən xəta baş verdi' });
    return true;
  }

  const rawOrigName = req.headers['x-original-name']
    ? decodeURIComponent(String(req.headers['x-original-name']))
    : req.headers['x-media-alt'];
  const originalName = safeText(rawOrigName, 300);

  send(res, 201, {
    id: `media-${randomBytes(8).toString('hex')}`,
    type: mediaInfo[1],
    url: `/uploads/${fileName}`,
    alt: safeText(req.headers['x-media-alt'], 300),
    originalName: originalName || fileName,
  });
  return true;
}
```

---

## Uğur Meyarı

- [ ] Admin paneldən şəkil yüklə
- [ ] `site/data/media/` qovluğunda fayl görünür
- [ ] Server restart-dan sonra şəkil hələ də açılır
- [ ] `GET /uploads/<fayl-adı>` 200 qaytarır
- [ ] 20MB-dan böyük fayl 413 xətası verir
- [ ] Yanlış MIME (`.exe` və s.) 415 xətası verir
- [ ] `npm test` heç bir test sınmır
