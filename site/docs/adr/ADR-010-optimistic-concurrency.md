# ADR-010: Strong Per-Product ETags, Precondition Headers (HTTP 428 / 412) & Immutable Revisions

## Status

Təsdiq Edildi (Approved)

## Kontekst və Problem Təsviri

Kataloq admin panelində eyni vaxtda bir neçə administrator məhsulları redaktə edə bilər. Əgər iki administrator eyni məhsulu eyni vaxtda açıb redaktə edərsə, sonuncu yadda saxlayan administrator əvvəlkinin etdiyi dəyişiklikləri səssizcə üzərinə yaza (lost update anomaly) bilər. Bundan əlavə, bütün kataloqun hər dəfə monolit `saveCatalog` ilə yenidən yazılması həm server resurslarını israf edir, həm də concurrency toqquşmalarını artırır.

## Qərar (Decision)

1. **Strong Per-Product ETag**:
   Hər bir məhsul üçün güclü (strong) ETag generasiya edilir:  
   `ETag: "p-{id}-v{version}-{productContentSha256}"`  
   Zəif (`W/"..."`) ETag-lar istifadə edilmir.

2. **RFC 9110 Standartına Uyğun Precondition Status Kodları**:
   - `PUT /api/admin/products/:id` və `DELETE /api/admin/products/:id` sorğularında `If-Match` header-i məcburidir.
   - Əgər `If-Match` göndərilməyibsə -> **HTTP 428 Precondition Required** qaytarılır.
   - Əgər `If-Match` dəyəri məhsulun cari ETag-i və ya versiyası ilə uyğun gəlmirsə -> **HTTP 412 Precondition Failed** qaytarılır (`error: "PRODUCT_VERSION_CONFLICT"`, `currentVersion: N`, `currentEtag: "..."`, `currentProduct: {...}`).
   - UI komponentləri üçün 412 cavabı analoq olaraq versiya konflikt ekranı ilə təqdim olunur.

3. **Dedicated Transactional Repository**:
   Məhsul redaktələri `ProductRepository` vasitəsilə `BEGIN IMMEDIATE` tranzaksiyasında tək məhsul səviyyəsində icra olunur, `version` artırılır və `product_revisions` cədvəlində immutable audit diff qeydi yaradılır.

4. **Rollback Qaydası**:
   Köhnə versiyaya qayıdış (rollback) əməliyyatı köhnə qeydi silmir; həmin vəziyyəti yeni artırılmış `version` ilə yeni revision kimi tətbiq edir.

## Nəticələr (Consequences)

- Lost update anomaliyaları 100% aradan qaldırılır.
- Adminlər eyni anda fərqli məhsulları fasiləsiz redaktə edə bilir.
- Hər bir redaktə field-level diff ilə `product_revisions` cədvəlində tam audit olunur.
