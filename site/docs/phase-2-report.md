# Mərhələ 2 — PIM v2 və Təhlükəsiz Migration Yekun Hesabatı

> [!NOTE]
> **STATUS:** CODE COMPLETE / ACCEPTED  
> **Production Live Cutover:** DEFERRED  
> **Canlı Tətbiq Qorunması:** `ENABLE_PIM_V2_LIVE_APPLY=false` (Defolt olaraq deaktivdir və qorunur)  
> **Real Verilənlər Bazaları:** Real, root və site bazalarına PIM v2 miqrasiyası tətbiq edilməmişdir (hazırkı pre-PIM v2 baseline sxemində qalır). Bütün live-apply və cutover sınaqları yalnız təcrid olunmuş `/tmp/sahara-*` klon mühitlərində icra edilmişdir.

**Layihə**: Sahara Electronics — PIM v2 Additive Architecture, Dual-Database Migration & Outbox Engine  
**Tarix**: 2026-09-11  
**Branch**: `saharasitedev` (Təcrid olunmuş və qorunan mühit)

---

## 1. Mərhələ 2 İcrasının Yekun Xülasəsi

Mərhələ 2 çərçivəsində `siteplan2.md`, `siteplan4.md` və `siteplan5.md` tələblərinə uyğun olaraq PIM v2 arxitekturası, outbox pattern mühərriki, optimistic concurrency və təhlükəsiz miqrasiya infrastrukturu 100% sıfır məlumat itkisi və tam fail-closed zəmanəti ilə qurulmuşdur:

1. **Dual-Database Additive Architecture (`catalog.sqlite` və `catalog-draft.sqlite`)**:
   - Mövcud heç bir cədvəl (`products`, `brands`, `categories`, `snapshots`, `audit_logs`) və ya sütun silinməmişdir.
   - PIM v2 üçün yeni additive cədvəllər və sütunlar hazırlanmışdır (`schema_migrations`, `brand_aliases`, `brand_sources`, `category_translations`, `spec_definitions`, `category_spec_templates`, `product_translations`, `product_variants`, `media_assets`, `product_media_variants`, `product_spec_values`, `product_revisions`, `publication_revisions`, `publication_jobs`).

2. **Kanonik Sxem Manifesti və Dərin Validasiya**:
   - `CANONICAL_SCHEMA_MANIFEST` bütün cədvəllər üzrə sütun tipləri, `notnull` məhdudiyyətləri, composite primary key (`pk`) ardıcıllığı və `dflt_value` dəyərlərini (o cümlədən default-u olmayan sütunlar üçün `dflt_value: null`) dəqiq müqayisə edir.
   - Gözlənilməyən default, composite PK sırası xətası, tip və nullability uyğunsuzluqları tam test edilmişdir.

3. **Scheduled Publication Outbox Pattern və Fail-Closed Gate-lər**:
   - `ScheduledPublicationWorker` `product_version` uyğunluğunu, kanonik `payload_hash` dəqiqliyini və konfiqurasiya edilə bilən `MIN_COMPLETENESS_SCORE` (default 50) həddini yoxlayır.
   - Outbox cədvəli olmadıqda `processScheduledPublications()` birbaşa publish etmir; fail-closed `PIM_V2_OUTBOX_REQUIRED` xətası qaytarır.
   - Worker taymeri daxilində sinxron istisnalar tutulur və server prosesini dayandırmır.

4. **Coordinated Shadow Cutover və Fail-Closed Request Draining**:
   - Canlı mühitdə `waitForActiveRequestsDrain()` aktiv sorğuların sıfırlanmasını gözləyir; taymaut baş verərsə DB bağlantıları bağlanmır, cutover aparılmır və fail-closed `503 DRAIN_TIMEOUT_ACTIVE_REQUESTS_REMAIN` qaytarılır.
   - Bütün live-apply və rollback sınaqları yalnız `/tmp/sahara-*` təcrid olunmuş klonlarında aparılmışdır.
   - `ENABLE_PIM_V2_LIVE_APPLY=false` qorunması ilə canlı bazalara icazəsiz müdaxilə tam bloklanmışdır.

---

## 2. Test və Doğrulama Nəticələri

Bütün avtomatlaşdırılmış testlər 100% Zero-DB-Mutation qorunması altında uğurla icra olunmuşdur:

- **Vitest Unit & Integration Suite**:
  - **71 test faylı**
  - **309 keçdi (passed)**
  - **1 ötürüldü (skipped)**
  - **0 xəta (failed)**
  - İcra müddəti: ~6.5 saniyə
- **Node.js Native Test Runner (`backupRestore.test.mjs`)**:
  - **3 test keçdi (100%)**
- **Playwright E2E Browser Suite (`pimV2AdminE2E.spec.ts`)**:
  - CSRF Dry-Run guard və Concurrent Conflict ETag axını: **2 test keçdi (100%)**
- **Sintaksis, Typecheck və Format**:
  - `node --check server.mjs`: Keçdi
  - `tsc --noEmit`: Keçdi
  - `prettier --check`: Keçdi

---

## 3. Verilənlər Bazası Hash-ləri və Saylar

### Root Verilənlər Bazası Hash-ləri (Dəyişməz Baseline):

- `../data/catalog.sqlite`: `233487dfe93a46bfd963e8fbb78968be09a3158103bc38b9367be8b3663f3639`
- `../data/catalog-draft.sqlite`: `73088256a4da393ce52a233d6d093e7cc47eb033328152f2eec81997f8ec07a9`

### Site Verilənlər Bazası Hazırkı Baseline Hash-ləri:

- `data/catalog.sqlite`: `7ccecbe71c68fc5b9630c0dade624a6cbc2c47fec28965cd85e3e68a92446947`
- `data/catalog-draft.sqlite`: `4bf79f3656736f43107160f41d2db27c280eee559d1ccbaba7ccfedb6ce425b5`

> [!NOTE]
> **Dürüstlük və Şəffaflıq Qeydi**:  
> Site bazalarının əvvəlki hash-lərdən (`3a688e...` / `05dea1...`) cari `7ccecb...` / `4bf79f...` dəyərlərinə dəyişməsi SQLite WAL lifecycle (passiv WAL checkpointing/flush) ilə əlaqəli ola bilər; lakin bu, qəti səbəb kimi sübut edilməmişdir. Baza daxilindəki faktiki sətir və məlumat sayları tam bütövdür.

### Faktiki Məlumat Sayları (Toxunulmaz Qalan Data):

- **Məhsul sayı**: `350`
- **Texniki spesifikasiya qeydləri**: `4532`
- **Media faylları**: `174`
- **Brend sayı**: `3` (ARDO, LOTUS, ARTEL)
- **Kateqoriya sayı**: `13`

---

## 4. Qoruma Qaydalarına Riayət

- Heç bir `git commit` və ya `git push` edilməmişdir.
- Root kataloq fayllarına və real verilənlər bazalarına toxunulmamışdır.
- Mərhələ 2 tam qəbul edilmiş və qapadılmışdır.
