# Mərhələ 2: PIM v2, Staging Cutover Protocol, Concurrency & Zero-Data-Loss Master Remediation Plan

**Sənəd**: `site/docs/phase-2-remediation-plan.md`  
**Tarix**: 2026-09-09  
**Hədəf Branch**: `saharasitedev`  
**Status**: Təsdiqə Təqdimat (Kumulyativ vahid master plan; heç bir kod dəyişikliyi və ya canlı tətbiq edilməyib)

---

## 1. Əsas Təhlükəsizlik Zəmanətləri və Sərhəd Qaydaları

1. **Canlı və Root Bazaların Mütləq Toxunulmazlığı**: Real `site/data/*.sqlite` və root `data/*.sqlite` bazalarına heç bir birbaşa canlı miqrasiya tətbiq edilmir (`ENABLE_PIM_V2_LIVE_APPLY=false`).
2. **Klon Təcridi**: Bütün testlər və dry-run simulyasiyaları yalnız `/tmp` daxilində `VACUUM INTO` ilə yaradılmış müvəqqəti klonlarda aparılır. Testlər zamanı `site/data/.migration-staging/` daxilində heç bir fayl yaradılmır.
3. **Commit və Push Qadağası**: İş bitənədək heç bir git commit və ya push edilmir.
4. **Sıfır İtki Zəmanəti**: 350 məhsul, 25 published məhsul, 4532 spesifikasiya və 174 media sətri 1:1 field-level manifest ilə qorunur.

---

## 2. Vahid və Kumulyativ Arxitektura Spesifikasiyası

### 2.1. İmmutable Miqrasiya Versiyası 8, Name və Checksum

- **Versiya**: `PIM_V2_MIGRATION_VERSION = 8`
- **Ad**: `PIM_V2_MIGRATION_NAME = '0008_pim_v2_additive_architecture'`
- **Kanonik Checksum**: Bütün PIM v2 DDL və additive SQL skriptinin deterministik SHA-256 imzası (`MIGRATION_CHECKSUM`).
- **Idempotency & Mismatch Qaydası**:
  - Əgər `schema_migrations` cədvəlində versiya 8 artıq varsa:
    - `name === '0008_pim_v2_additive_architecture'`
    - `checksum === MIGRATION_CHECKSUM`
    - `status === 'success'`
    - Hər 8 PIM v2 cədvəli və sütunları mövcuddur
      -> Bütün şərtlər ödəndikdə **0 sətir yazı ilə təmiz No-Op** qaytarılır (`applied_at` dəyişmir).
  - Checksum və ya sxem fərqlidirsə -> **`FAIL_CLOSED_MIGRATION_MISMATCH`** atılır.

### 2.2. Dinamik Status Endpointi (`/api/admin/pim/migration/status`)

Hardcoded nəticə qaytarılması qadağandır. Hər iki bazanın faktiki cədvəl və miqrasiya cədvəli yoxlanılır:

- **`applied`**: Həm `catalog.sqlite`, həm `catalog-draft.sqlite` daxilində versiya 8 uğurla tətbiq olunub və tam kanonik sxem mövcuddur.
- **`pending`**: Hər iki bazada versiya 8 hələ tətbiq edilməyib (faktiki mövcud vəziyyət).
- **`mismatch`**: Bazalardan birində tətbiq olunub digərində yoxdur, və ya natamam sütunlar/indekslər var.
- **`failed`**: Baza korlanıb və ya checksum uyğunsuzluğu var.

### 2.3. Anti-TOCTOU Apply Əməliyyatının Dəqiq İcra Sırası

Canlı tətbiq (gələcəkdə aktivləşdiriləndə) aşağıdakı dəqiq ardıcıllıqla icra olunur:

1. **Auth & CSRF**: Admin sessiyasının və `X-CSRF-Token` yoxlanışı.
2. **Feature Flag Check**: `ENABLE_PIM_V2_LIVE_APPLY === true` yoxlanışı (false olduqda dərhal HTTP 403 Forbidden).
3. **Migration Lock**: `migration.lock` atomik yaradılır.
4. **Maintenance Mode**: `isMaintenanceMode = true` edilir; yeni HTTP yazıları üçün `503 Service Unavailable` qaytarılır.
5. **Drain Active Requests**: Aktiv sorğuların tamamlanması gözlənilir.
6. **Close SQLite Connections**: `catalogDatabase` və `draftDatabase` bağlantıları bağlanır (`db.close()`).
7. **Fresh Semantic Manifest**: Aktiv WAL nəzərə alınmaqla hər iki bazadan təzə kanonik semantic manifest hesablanır.
8. **Dry-Run Token Validation & Atomic Consumption**: Təqdim olunan tokenin `manifestHash` ilə təzə manifestin hash-i `crypto.timingSafeEqual` ilə müqayisə edilir və token birdəfəlik silinir. Uyuşmazlıqda lock buraxılır və 409/412 qaytarılır.
9. **Staging Migration**: Eyni filesystem-də (`site/data/.migration-staging/`) shadow klonlar yaradılır, DDL/DML icra olunur, `integrity_check` və `foreign_key_check` yoxlanılır.
10. **Two-Phase Coordinated Cutover**: Journal intent addımları ilə atomik rename və fsync icra olunur.

### 2.4. Intent Vəziyyətli Cutover State Machine və Deterministic Recovery

State Machine vəziyyətləri:
`PREPARED` -> `CONNECTIONS_CLOSED` -> `PUBLIC_SWAP_INTENT` -> `PUBLIC_SWAPPED` -> `DRAFT_SWAP_INTENT` -> `DRAFT_SWAPPED` -> `VERIFIED` -> `COMMITTED`

- **Durable Journal**: `site/data/.migration-staging/migration_journal.json` faylında hər addım `fsyncSync` ilə diske yazılır.
- **Deterministik Recovery Qərar Matrisi (Server boot zamanı, DB açılmadan və `listen()` çağırılmadan əvvəl)**:
  - `PREPARED` / `CONNECTIONS_CLOSED` / `PUBLIC_SWAP_INTENT`: **Rollback** (staging təmizlənir, orijinal bazalar saxlanılır).
  - `PUBLIC_SWAPPED` / `DRAFT_SWAP_INTENT`: Faktiki fayl hash-ləri yoxlanılır; `public_backup` -> `catalog.sqlite` bərpa edilir (**Rollback**).
  - `DRAFT_SWAPPED`: Hər iki staged hash manifestlə eynidirsə və `integrity_check` keçirsə -> **Verify & Commit Recovery**; əks halda hər iki baza backup-dan **Rollback** edilir.
  - `VERIFIED`: **Commit Recovery** (jurnal `COMMITTED` edilir).
  - `COMMITTED`: **No-Op** (normal start).
  - Recovery zamanı server `503 Service Unavailable` (`Retry-After: 5`) qaytarır.

### 2.5. Canlı PID və Process Identity Əsaslı `migration.lock`

- Lock strukturu: `{ pid, process_start_time, nonce, timestamp, hostname }`.
- **Qayda**: Yalnız `process.kill(pid, 0)` uğursuz olduqda (`ESRCH` - proses mövcud deyil) VƏ lock 5 dəqiqədən köhnə olduqda təmizlənir.
- Canlı PID-in lock-u TTL keçsə belə **heç vaxt silinmir**. Şübhəli hallarda sistem **Fail-Closed** qalır.

### 2.6. Kanonik Field-Level Hash Manifesti

- Bütün sahələr (`brands`, `categories`, `products`, `product_specs` [4532 sətir], `product_media` [174 sətir], `catalog_settings`) üzrə deterministik sıralanmış JSON SHA-256 manifesti hesablanır.
- 1 qiymət, 1 hərf, crop və ya 1 spec dəyərinin dəyişməsi tokeni dərhal etibarsız edir.

### 2.7. Strong Per-Product ETag, HTTP 428 və HTTP 412

- Məhsullar üçün güclü ETag: `ETag: "p-{id}-v{version}-{productSha256}"`.
- PUT/PATCH sorğularında `If-Match` olmadıqda -> **HTTP 428 Precondition Required**.
- `If-Match` versiya/ETag ilə uyğun gəlmədikdə -> **HTTP 412 Precondition Failed** (`PRODUCT_VERSION_CONFLICT` və cari server datası).
- Seçim [`site/docs/adr/ADR-010-optimistic-concurrency.md`](file:///home/oni10/Desktop/ArdoKataloq/site/docs/adr/ADR-010-optimistic-concurrency.md) daxilində RFC 9110 əsasında sənədləşdirilir.

### 2.8. Dedicated Transactional Product Repository

- [`site/backend/productRepository.mjs`](file:///home/oni10/Desktop/ArdoKataloq/site/backend/productRepository.mjs):
  - `createProduct(product, actor)`
  - `updateProduct(id, product, actor, expectedEtag/version)`
  - `deleteProduct(id, actor, expectedEtag/version)`
- `BEGIN IMMEDIATE` tranzaksiyasında yalnız hədəf məhsulu yeniləyir, `version`-u artırır və `product_revisions` qeydi yaradır. Tək məhsul üçün bütün kataloq yenidən yazılmır.

### 2.9. `product_spec_values` Cədvəli və Partial Unique Index

- Sxem:
  ```sql
  CREATE TABLE IF NOT EXISTS product_spec_values (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    spec_definition_id TEXT NOT NULL REFERENCES spec_definitions(id) ON DELETE CASCADE,
    legacy_spec_id TEXT,
    raw_name TEXT NOT NULL,
    raw_value TEXT NOT NULL,
    normalized_value_text TEXT,
    normalized_value_number REAL,
    normalized_value_boolean INTEGER,
    unit TEXT,
    normalization_status TEXT NOT NULL DEFAULT 'valid' CHECK(normalization_status IN ('valid', 'needs_review', 'raw_only')),
    is_override INTEGER NOT NULL DEFAULT 0 CHECK(is_override IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );
  CREATE INDEX IF NOT EXISTS psv_product_idx ON product_spec_values(product_id);
  CREATE INDEX IF NOT EXISTS psv_variant_idx ON product_spec_values(variant_id);
  CREATE UNIQUE INDEX IF NOT EXISTS psv_legacy_spec_idx ON product_spec_values(legacy_spec_id) WHERE legacy_spec_id IS NOT NULL;
  ```
- Bütün 4532 legacy spesifikasiya sətri məhsulun default variantına bağlanır (`legacy_spec_id` NOT NULL).
- Gələcək variant spesifik override-lar üçün `legacy_spec_id = NULL` və `is_override = 1` istifadə olunur (süni legacy ID yaradılmır).

### 2.10. Deterministik Unicode Spec Key Kolliziya İdarəetməsi

- Raw Unicode adlar (`raw_name`) 100% toxunulmaz qalır.
- Kolliziyada (məs: `Güc` və `Gücü`) AI təxmini edilmir:
  - İlk rast gəlinən: `guc`
  - Növbəti fərqli raw ad: `guc_<sha256(raw_name).slice(0,6)>`
  - Status: `needs_review` qeyd olunur, heç bir data birləşdirilmir və itirilmir.

### 2.11. Media Sxemi, Video Poster və Expression Index

- `media_assets`: `id, type, url, original_name, mime_type, byte_size, width, height, duration_seconds, checksum_sha256`.
- `product_media_variants`:
  - `id, product_id, variant_id, media_id, legacy_media_id, is_primary, sort_order, object_position, fit_mode, alt_text, poster_url`.
- SQLite Expression Unique Index:
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS pmv_scope_idx ON product_media_variants(
    product_id,
    COALESCE(variant_id, '__PRODUCT_LEVEL__'),
    media_id
  );
  ```
- 174 media sətrinin crop, objectPosition, fitMode, poster və alt_text məlumatları 100% qorunur.

### 2.12. Outbox Pattern ilə Scheduled Publication (`publication_jobs`)

- State maşını: `scheduled -> publishing -> retry_pending -> published` (və ya `failed`).
- CHECK constraint: `CHECK(state IN ('scheduled', 'publishing', 'retry_pending', 'published', 'failed'))`.
- Draft məhsul yalnız ictimai `catalog.sqlite` bazasına promotion və verification bitdikdən sonra `published` edilir.
- Uğursuzluqda `retry_pending` / `failed` saxlanılır; exponential backoff ilə təkrar cəhd edilir.

### 2.13. Vahid Shared Runtime Zod Sxem Modulu və TypeScript Təhlükəsizliyi

- `site/src/types/sharedSchemas.mjs` və onun `.d.ts` tipləri:
  - Node server (`server.mjs`) birbaşa import edir.
  - TypeScript frontend (`site/src/types/schemas.ts`) import edərək `z.infer` ilə güclü tiplər çıxarır.
  - Compile-time type test ilə `z.infer` nəticəsinin `any` olmadığı sübut olunur.

### 2.14. Kanonik Sxem Manifest və CHECK Constraint Təftişi

- `PRAGMA table_info`, `foreign_key_list`, `index_list` ilə yanaşı `sqlite_master.sql` kanonik DDL analizi və etibarsız insert-ləri rədd edən behavioral schema testləri aparılır.

### 2.15. No Hallucination Policy

- Naməlum SKU/GTIN/MPN/zəmanət `NULL` saxlanılır.
- Brendlər avtomatik `verified` edilmir.
- Məhsulun `code` dəyəri birbaşa `model_code` qəbul edilir; mənbəsiz heç bir təsvir və ya xüsusiyyət mətni yaradılmır.

### 2.16. PostgreSQL Yalnız DEFERRED

- Real PostgreSQL instansı olmadığı üçün `/api/admin/postgres-verify` həmişə dəqiq `DEFERRED` qaytarır.

### 2.17. Pending Compatibility Mode (Dual-Mode Runtime)

- Canlı bazalar miqrasiya edilmədən storefront və admin panel `sqlite_master` yoxlanışı ilə problemsiz işləməyə davam edir.

### 2.18. Feature Flag Qoruması

- `ENABLE_PIM_V2_LIVE_APPLY=false`.
- API `/api/admin/pim/migration/apply` 403 Forbidden qaytarır.
- Admin UI Apply düyməsi disabled qalır.

---

## 3. Fayl Dəyişiklikləri Xəritəsi

```
site/
├── backend/
│   ├── schemas/
│   │   ├── pimV2Schemas.mjs                  [NEW]  - Runtime Zod validation schemas
│   │   └── pimV2Schemas.d.ts                 [NEW]  - Strictly typed declarations for frontend
│   ├── migrationLock.mjs                     [NEW]  - Atomic open('wx'), PID/nonce/TTL, alive-PID protection
│   ├── migrationJournal.mjs                  [NEW]  - Intent-based cutover journal with fsync
│   ├── shadowCutover.mjs                     [NEW]  - Staging cutover state machine & rollback coordinator
│   ├── productRepository.mjs                 [NEW]  - Transactional granular product CRUD & revision manager
│   ├── pimV2Migration.mjs                    [MODIFY] - Version 8, SHA-256 checksum, product_spec_values, No-Op
│   ├── specNormalizer.mjs                    [MODIFY] - Azerbaijani Unicode spec key collision handling
│   ├── catalogDatabase.mjs                   [MODIFY] - Dual-mode pending compatibility & ETag generation
│   ├── scheduledPublicationJob.mjs           [MODIFY] - Outbox state machine & worker lease
│   ├── unassignedMediaAudit.mjs              [MODIFY] - Boundary token matching (HB-6 vs HB-60)
│   └── postgresCopyVerify.mjs                [MODIFY] - Explicit DEFERRED status verification
├── docs/
│   ├── adr/
│   │   └── ADR-010-optimistic-concurrency.md [NEW]  - Strong ETag, HTTP 428/412 & revision design record
│   ├── phase-2-remediation-plan.md           [NEW]  - Master remediation plan (this document)
│   └── phase-2-report.md                     [MODIFY] - Marked SUPERSEDED [QƏBUL EDİLMƏDİ]
├── src/
│   ├── components/
│   │   ├── PimMigrationManager.tsx           [MODIFY] - Dynamic status, disabled apply, dry-run token UI
│   │   └── CatalogAdmin.tsx                  [MODIFY] - 412 Conflict modal, granular product save
│   ├── services/
│   │   └── catalogApi.ts                     [MODIFY] - Strong ETag, If-Match headers, Zod response parsing
│   └── types/
│       ├── contracts.ts                      [MODIFY] - PIM v2 contract definitions
│       └── schemas.ts                        [MODIFY] - TypeScript schemas inferred from shared module
├── server.mjs                                [MODIFY] - ETag middleware, If-Match (428/412), dry-run CSRF
└── tests/
    ├── regressionManifest.test.ts            [NEW]  - 350 products, 25 published, 4532 specs, 174 media test
    ├── startupRecovery.test.ts               [NEW]  - Intent-state recovery, crash simulation, 503 maintenance
    ├── tokenInvalidationOnFieldEdit.test.ts  [NEW]  - Canonical field-level hash token invalidation
    ├── alivePidLock.test.ts                  [NEW]  - Alive PID lock preservation test
    ├── duplicateAndVariantSpecs.test.ts      [NEW]  - Legacy spec partial index & variant override test
    ├── mediaPosterAndAlt.test.ts             [NEW]  - Expression index & media preservation test
    ├── scheduledPublishOutbox.test.ts        [NEW]  - Outbox retry/backoff & draft-to-public promotion test
    ├── canonicalSchemaMismatch.test.ts       [NEW]  - Column/index/CHECK constraint mismatch fail-closed
    ├── typeInference.test.ts                 [NEW]  - Compile-time non-any Zod schema inference test
    ├── pimV2Migration.test.ts                [MODIFY] - 1x/2x/10x idempotency, fail-closed checksum, staging
    ├── pimV2RevisionsAndScheduled.test.ts    [MODIFY] - Real HTTP 428/412 ETag tests & worker lease
    ├── unassignedMediaAudit.test.ts          [MODIFY] - Exact match & ambiguity tests
    └── browser/
        └── pimV2AdminE2E.spec.ts             [NEW]  - Playwright E2E: status, dry-run, disabled apply, 412 modal
```

---

## 4. Tam Test Matrisi

| Test Faylı                             | Əhatə Etdiyi Sahə                                          | Gözlənilən Nəticə                                             |
| -------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `regressionManifest.test.ts`           | 350 məhsul, 25 published, 4532 spec, 174 media             | Pre vs Post field-level JSON SHA-256 100% bərabərdir          |
| `startupRecovery.test.ts`              | Crash simulyasiyası, `PUBLIC_SWAP_INTENT`, `DRAFT_SWAPPED` | Deterministik rollback və ya forward commit, bərpa zamanı 503 |
| `tokenInvalidationOnFieldEdit.test.ts` | 1 qiymət, 1 hərf və ya 1 spec dəyişdirilməsi               | Dry-run tokeni dərhal etibarsızlaşır (TOCTOU qorunması)       |
| `alivePidLock.test.ts`                 | Canlı proses PID-i və TTL keçməsi                          | Lock silinmir, ikinci proses fail-closed bloklanır            |
| `duplicateAndVariantSpecs.test.ts`     | Eyni adlı spesifikasiyalar və variant override             | Bütün 4532 legacy spec qorunur, partial index işləyir         |
| `mediaPosterAndAlt.test.ts`            | Video poster, alt, crop, expression index                  | SQLite expression unique index uğurla işləyir                 |
| `scheduledPublishOutbox.test.ts`       | Outbox `scheduled -> publishing -> retry_pending`          | Public yazılış bitmədən draft published olmur                 |
| `canonicalSchemaMismatch.test.ts`      | Natamam sütun/indeks/CHECK constraint                      | `FAIL_CLOSED_SCHEMA_MISMATCH` atılır                          |
| `typeInference.test.ts`                | Shared Zod sxemlərinin TypeScript tipləri                  | `z.infer` nəticəsi `any` deyil, tam type-safe-dir             |
| `pimV2Migration.test.ts`               | 1x, 2x, 10x icra, staging fsync                            | 100% idempotent No-Op, `applied_at` dəyişmir                  |
| `pimV2RevisionsAndScheduled.test.ts`   | Strong ETag, HTTP 428/412, `productRepository`             | Missing If-Match -> 428, Stale -> 412, revision yaradılır     |
| `unassignedMediaAudit.test.ts`         | Dəqiq model matching (`HB-6` vs `HB-60`)                   | Ambiguity faylları sərbəst qalır və bildirilir                |
| `postgresCopyVerify.test.ts`           | PostgreSQL yoxlaması                                       | Yalnız `DEFERRED` qaytarır                                    |
| `browser/pimV2AdminE2E.spec.ts`        | Admin UI & Playwright browser                              | Status, Dry-run CSRF, Disabled Apply (403), 412 modal         |

---

## 5. Təsdiqləmə Qaydası

İcraya yalnız istifadəçinin bu vahid kumulyativ master planı təsdiq etməsindən sonra başlanılacaqdır. Real site bazalarına heç bir yazı edilməyəcək, `ENABLE_PIM_V2_LIVE_APPLY=false` qorunacaqdır.
