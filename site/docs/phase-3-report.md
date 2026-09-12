# Mərhələ 3 — Brend Reyestri, Kateqoriya İyerarxiyası və Xüsusiyyət Şablonları Yekun Hesabatı

> [!NOTE]
> **STATUS:** CODE COMPLETE / ACCEPTED / CLOSED  
> **Tarix:** 2026-09-12  
> **Branch:** `saharasitedev` (Təcrid olunmuş və qorunan mühit)  
> **Real Verilənlər Bazası Qorunması:** 4 SQLite bazasının SHA-256 imzası 100% dəyişməzdir. Bütün test və E2E ssenariləri yalnız `/tmp/sahara-*` snapshot mühitində icra olunmuşdur.

---

## 1. Mərhələ 3 İcrasının Yekun Xülasəsi

Mərhələ 3 çərçivəsində `siteplan2.md`, `siteplan4.md`, `siteplan5.md` və stakeholder qərarlarına uyğun olaraq çoxbrendli idarəetmə, iyerarxik taksonomiya və dinamik xüsusiyyət şablonları tam vertical-slice (Schema → Backend API → Admin UI → Public Storefront → Observability/Audit → Testlər) olaraq qurulmuş və bağlanmışdır:

### 1.1 Çoxbrendli Brend Reyestri və Doğrulama Sistemi (`BrandRegistryStudio`)

- **Vəziyyət Maşını (Status State Machine):** `candidate` $\rightarrow$ `verified` $\rightarrow$ `content_ready` $\rightarrow$ `published` (həmçinin `rejected` və `archived`). Birbaşa `candidate` $\rightarrow$ `published` keçidi qadağandır (`400 BRAND_VERIFICATION_ERROR`).
- **Rəsmi Mənbə Doğrulama Qapısı (Source Proof Gate):** Rəsmi istehsalçı mənbəsi (`official_website` / `press_kit`) təsdiqlənmədən brend dərc edilə bilməz (`400 BRAND_REQUIRES_VERIFIED_OFFICIAL_SOURCE`).
- **Logo Hüquqları (Logo Rights Workflow):** `unreviewed`, `approved`, `rejected` hüquqi statusları, mənbə linki və audit qeydləri.
- **İctimai Görünüş Sərhədləri:** Dərc olunmamış (namizəd və ya rədd edilmiş) brendlər `/api/catalog` və `/api/brands` daxilində tamamilə gizlidir. Məhsulsuz brendlər default olaraq gizlədilir (`comingSoon` istisna olmaqla).
- **Alias İdarəetməsi və Toqquşma Qorunması:** Brend üçün alternativ adlar (məsələn, "Ardo Italy", "Lotus Home") əlavə edilə bilər; digər brendlə toqquşma olduqda `400 BRAND_ALIAS_ERROR` ilə bloklanır.

### 1.2 Çoxsəviyyəli Kateqoriya Ağacı İdarəetməsi (`CategoryTreeManager`)

- **İyerarxiya və Yollar:** Limitsiz dərinlik dəstəyi (`depth`, `/root/sub` kanonik yolları), kök və alt kateqoriyaların yaradılması.
- **Təhlükəsiz Köçürmə (Move):** Dövri asılılıq (cycle detection) və valideynin öz övladının altına köçürülməsi qadağandır (`400 CATEGORY_CYCLE_ERROR`).
- **Qardaş Kateqoriyaların Sıralanması (Sibling Reorder):** Eyni valideyn altındakı kateqoriyaların `sortOrder` ardıcıllığı atomik batch yenilənməsi ilə tənzimlənir və ortaq ETag ilə qorunur.
- **Təsir Xülasəsi (Impact Preview):** Kateqoriya dəyişdirilməzdən və ya arxivlənməzdən əvvəl birbaşa və alt kateqoriyalardakı bütün təsirlənən məhsulların sayı təhlil olunur (`GET /api/admin/categories/:id/impact`).
- **Arxivləmə və Məhsulların Təhlükəsiz Köçürülməsi (Subtree Archive & Reassign):** Sərt silinmə (`DELETE`) deaktiv edilib (`405 CATEGORY_HARD_DELETE_DISABLED`). Arxivləmə zamanı bütün alt ağac `is_archived = 1` olur və mövcud məhsullar seçilmiş təhlükəsiz hədəf kateqoriyaya atomik köçürülür (`reassignToCategoryId`).
- **Bərpa (Restore):** Arxivlənmiş kateqoriya və onun alt ağacı istənilən vaxt bərpa oluna bilər.

### 1.3 Kateqoriya Xüsusiyyət Şablonları (`CategorySpecTemplateEditor`)

- **İrsiyyət və Override:** Alt kateqoriyalar valideyn kateqoriyanın xüsusiyyət şablonlarını (`required`, `unit`, `group_name`, `filterable`) avtomatik miras alır və istədikdə yerli olaraq override edə bilir.
- **Lossless Table Rebuild & Nullable FK:** `category_spec_templates` cədvəli transaction daxilində lossless table rebuild ilə yenilənmiş və `FOREIGN KEY (spec_definition_id) REFERENCES spec_definitions(id) ON DELETE SET NULL` dəstəyi təmin edilmişdir.
- **Deterministik SHA-256 Field Hash:** Rebuild-dən əvvəl və sonra legacy sahələr (`category_id`, `spec_definition_id`, `group_name`, `required`, `filterable`, `sort_order`) üzrə SHA-256 field-level hash hesablanaraq 100% bərabərliyi təsdiq olunmuşdur.

### 1.4 Optimistic Concurrency və Konkret ETag Mexanizmi (Wildcard `*` Bypass Qadağası)

- Bütün Phase 3 mutasiyalarında (`source`, `alias`, `logo-rights`, `verification-status`, `category move/archive/restore`, `reorder`, `spec-templates`) wildcard `If-Match: *` qadağan edilmişdir:
  - Missing ETag $\rightarrow$ `428 Precondition Required`
  - `If-Match: *` və ya `If-Match: "*"` $\rightarrow$ `412 Precondition Failed`
  - Köhnəlmiş (stale) ETag $\rightarrow$ `412 Precondition Failed`
  - Düzgün konkret ETag $\rightarrow$ `200/201` + təzə `ETag` cavab başlığı.

### 1.5 Dəqiq Strukturlaşdırılmış Audit Logu

- Hər bir inzibati əməliyyat (`brand`, `category`, `spec_template`, `alias`, `source`) üzrə `action`, `actor`, `entityId`, `ipAddress`, `userAgent`, `beforeVersion` və `afterVersion` sahələri ilə audit cədvəlinə yazılır.

### 1.6 Fail-Closed Screenshot Reqressiyası və Əlçatanlıq (A11y)

- Bütün `try/catch` fail-open screenshot mexanizmləri ləğv edilmişdir.
- 4 fərqli deterministik baseline ayrılmışdır:
  - Brand Registry 390px Mobile
  - Brand Registry 1440px Desktop
  - Category Manager 390px Mobile
  - Category Manager 1440px Desktop
- WCAG AA (rəng kontrastı daxil olmaqla) qaydaları deaktiv edilmədən qorunmuşdur.

---

## 2. Test Komandalarının Faktiki Nəticələri və Exit Code-lar

| Komanda                           | Əhatə Dairəsi                                        | Exit Code | Nəticə                                           |
| :-------------------------------- | :--------------------------------------------------- | :-------: | :----------------------------------------------- |
| `npm run check:syntax`            | Node.js `server.mjs` sintaksis yoxlanışı             |   **0**   | ✅ Keçdi (0 syntax error)                        |
| `npm run format:check`            | Prettier kod formatlama yoxlanışı                    |   **0**   | ✅ Keçdi (0 mismatch)                            |
| `npm run lint`                    | ESLint (`--max-warnings=0`)                          |   **0**   | ✅ Keçdi (**0 errors, 0 warnings**)              |
| `npm run typecheck`               | TypeScript `tsc --noEmit` tip yoxlanışı              |   **0**   | ✅ Keçdi (0 type errors)                         |
| `npm test`                        | Vitest vahid və inteqrasiya testləri + Root DB Guard |   **0**   | ✅ Keçdi (**75 test faylı, 342 passed, 3 node**) |
| `npm run test:a11y`               | axe-core WCAG AA komponent testi                     |   **0**   | ✅ Keçdi (**8 test, 0 violations**)              |
| `npm run test:browser`            | Playwright real Chromium testləri (E2E & Responsive) |   **0**   | ✅ Keçdi (**51 browser testi, 100%**)            |
| `npm run test:browser:production` | Playwright production dist mühiti                    |   **0**   | ✅ Keçdi (**3 test, 0 console errors**)          |
| `npm run build:stories`           | Ladle komponent hekayələri build-i                   |   **0**   | ✅ Keçdi (0 errors)                              |
| `npm run build`                   | Vite production bundle generasiyası                  |   **0**   | ✅ Keçdi (0 errors)                              |
| `npm run test:repo-boundary`      | 332 root faylın SHA-256 bütövlüyü                    |   **0**   | ✅ Keçdi (100% təcrid)                           |
| `npm run check:quality`           | Bütün yuxarıdakı testləri birləşdirən master gate    |   **0**   | ✅ Keçdi (**100% uğurlu**)                       |

---

## 3. Real Verilənlər Bazası Bütövlüyü (4 SQLite DB Hashes)

| Verilənlər Bazası              | Əvvəlki SHA-256                                                    | Hazırkı SHA-256                                                    | Vəziyyət        |
| ------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ | --------------- |
| `../data/catalog.sqlite`       | `233487dfe93a46bfd963e8fbb78968be09a3158103bc38b9367be8b3663f3639` | `233487dfe93a46bfd963e8fbb78968be09a3158103bc38b9367be8b3663f3639` | **Dəyişməz** ✅ |
| `../data/catalog-draft.sqlite` | `73088256a4da393ce52a233d6d093e7cc47eb033328152f2eec81997f8ec07a9` | `73088256a4da393ce52a233d6d093e7cc47eb033328152f2eec81997f8ec07a9` | **Dəyişməz** ✅ |
| `data/catalog.sqlite`          | `7ccecbe71c68fc5b9630c0dade624a6cbc2c47fec28965cd85e3e68a92446947` | `7ccecbe71c68fc5b9630c0dade624a6cbc2c47fec28965cd85e3e68a92446947` | **Dəyişməz** ✅ |
| `data/catalog-draft.sqlite`    | `4bf79f3656736f43107160f41d2db27c280eee559d1ccbaba7ccfedb6ce425b5` | `4bf79f3656736f43107160f41d2db27c280eee559d1ccbaba7ccfedb6ce425b5` | **Dəyişməz** ✅ |

---

## 4. Qoruma və Branch Qaydalarına Riayət

- Bütün işlər yalnız `saharasitedev` branch-də aparılmışdır.
- Heç bir `git commit` və ya `git push` icra edilməmişdir.
- Root kataloq fayllarına və real verilənlər bazalarına toxunulmamışdır.
- **Mərhələ 3 rəsmi olaraq CLOSED elan edilmişdir.**
