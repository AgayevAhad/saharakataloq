# Sahara Electronics — Cari Vəziyyət Auditi (Current State Audit)

> **Sənəd tarixi:** 06.09.2026  
> **Məqsəd:** Mərhələ 0 çərçivəsində mövcud sistemin tam inventarizasiyası, risk təhlili və transformasiya bazasının müəyyənləşdirilməsi.

---

## 1. Kod Bazası və Qovluq İnventarı

| Qovluq / Fayl | Təsvir və Məsuliyyət | Risk Səviyyəsi |
| :--- | :--- | :--- |
| `src/components/` (24 fayl) | Public vitrin və admin panel UI komponentləri. | Aşağı |
| `src/components/CatalogAdmin.tsx` | Admin panel idarəetmə mərkəzi (5000+ sətir). | Orta (Mərhələ 1-də modullara bölünməlidir) |
| `backend/catalogDatabase.mjs` | SQLite bazası üzərində CRUD, snapshot, miqrasiya və analitika mühərriki. | Yüksək (Bütün dəyişikliklər transaction və backup ilə qorunmalıdır) |
| `backend/resolvePort.mjs` | Port konfliktlərinin qarşısını alan dinamik port həlli. | Aşağı |
| `server.mjs` | Node.js Express/HTTP serveri, API endpoint-ləri, media upload və SPA fallback. | Orta |
| `data/catalog.sqlite` | Public təsdiqlənmiş kataloq məlumatları (350 məhsul, 4532 parametr). | Kritik (User customizations müqəddəsdir) |
| `data/catalog-draft.sqlite` | Admin qaralama bazası. | Kritik |
| `public/media/` | Web-optimallaşdırılmış məhsul və brend vizualları. | Orta |
| `scripts/` (13 fayl) | Məlumat idxalı, şəkil uyğunlaşdırma və köməkçi skriptlər. | Aşağı/Orta (Aşağıda audit edilib) |

---

## 2. API Endpoint İnventarı (`server.mjs`)

| Metod | Endpoint | Təyinatı | Autentifikasiya |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/catalog` | Public təsdiqlənmiş kataloq məlumatları | Açıq |
| `POST` | `/api/catalog/track` | Baxış və əlaqə analitika hadisələri | Açıq (Rate-limited) |
| `POST` | `/api/admin/login` | Admin sessiyası girişi | Şifrə ilə qorunur |
| `GET` | `/api/admin/catalog` | Qaralama kataloq məlumatları | Admin Token |
| `POST` | `/api/admin/catalog` | Qaralama məlumatlarının yenilənməsi | Admin Token |
| `POST` | `/api/admin/catalog/publish` | Qaralamanı public bazaya köçürmə və snapshot yaratma | Admin Token |
| `POST` | `/api/admin/catalog/revert` | Əvvəlki snapshot-a geri qayıtma (Rollback) | Admin Token |
| `GET` | `/api/admin/snapshots` | Baza snapshot-larının siyahısı | Admin Token |
| `POST` | `/api/admin/media/upload` | Şəkil və video yüklənməsi | Admin Token (MIME yoxlanışı) |
| `GET` | `/api/admin/logs` | Audit qeydlərinin oxunması | Admin Token |
| `GET` | `/api/admin/analytics` | Ətraflı analitika göstəriciləri | Admin Token |

---

## 3. Verilənlər Bazası Cədvəl İnventarı (`data/catalog.sqlite`)

1. **`schema_migrations`** (5 sətir): Tətbiq olunmuş DB miqrasiya versiyaları.
2. **`catalog_meta`** (1 sətir): Kataloq versiyası və son yenilənmə vaxtı.
3. **`brands`** (3 sətir): ARDO, LOTUS, ARTEL brendləri.
4. **`brand_manufacturing_countries`** (4 sətir): Brendlər üzrə istehsal ölkəsi siyahısı.
5. **`categories`** (13 sətir): Məhsul kateqoriyaları (Plitələr, Aspiratorlar, Sobalar, TV və s.).
6. **`products`** (350 sətir): Əsas məhsul modelləri.
7. **`product_media`** (174 sətir): Məhsul şəkilləri və videoları (crop, order, alt).
8. **`product_highlights`** (630 sətir): Məhsulun əsas üstünlükləri.
9. **`product_specs`** (4532 sətir): Texniki parametrlər.
10. **`catalog_settings`** (1 sətir): Şirkət əlaqə məlumatları, WhatsApp, zəng nömrələri, çoxsaylı ünvanlar, sosial şəbəkələr və banner mətnləri.
11. **`catalog_snapshots`** (1 sətir): Geri qayıtma nöqtələri (rollbacks).
12. **`audit_logs`** (31 sətir): Admin tərəfindən icra edilmiş əməliyyatların tarixi.
13. **`analytics_events`** (970 sətir): İstifadəçi qarşılıqlı əlaqələri.
14. **`product_view_stats`** (66 sətir): Məhsul baxış statistikası.
15. **`contact_action_stats`** (6 sətir): Zəng və WhatsApp müraciət statistikası.

---

## 4. Mövcud Skriptlərin Risk və Dağıdıcılıq Auditi

| Skript | Məqsəd | Status / Təhlükəsizlik Rejimi |
| :--- | :--- | :--- |
| `scripts/import_all_lotus_photos.mjs` | Lotus fotoşəkillərinin 1:1 model adı ilə bağlanması | **Merge-Safe** (Mövcud parametrləri və crop-ları qoruyur) |
| `scripts/importLotusVideos.mjs` | Lotus video fayllarının bağlanması | **Merge-Safe** |
| `scripts/fixExactMediaMappings.mjs` | Dəqiq 1:1 model yoxlanışı və uyğunsuz media təmizlənməsi | **Merge-Safe** (Yalnız 1:1 ad uyğunluğunu saxlayır) |
| `scripts/extract_ardo_catalog.py` | Excel fayllarından ARDO spesifikasiyalarının oxunması | **Merge-Safe** (Oxuma və parse skripti) |
| `scripts/importArdoCatalog.mjs` | ARDO məlumatlarının DB-yə ötürülməsi | **Merge-Safe** |
| `scripts/update_articles_db.mjs` | Texnologiya və məlumat məqalələrinin yenilənməsi | **Merge-Safe** |

> **Qayda:** Heç bir skript birbaşa `data/catalog.sqlite` faylını DROP TABLE ilə yenidən yazmamalıdır; bütün skriptlər transaction daxilində və `ON CONFLICT DO UPDATE` ilə işləməlidir.

---

## 5. Test Əhatəsi Baseline

- **Unit & Integration Testlər:** 42 test faylı, 220 test (Vitest) + 6 Node.js backend testi.
- **Əhatə sahələri:**
  - Responsive layout və horizontal overflow (`overflowAndSmoothScroll.test.tsx`)
  - 1:1 Skeleton Shimmer və Splash transition (`skeletonsAndLoading.test.tsx`, `splashScreen.test.tsx`)
  - Admin təhlükəsizlik və icazələr (`security.test.ts`, `adminLogin.test.tsx`)
  - Media video idarəetməsi və audio nəzarəti (`productCardVideo.test.tsx`, `adminVideoManagement.test.tsx`)
  - Çoxsaylı ünvanlar və sticky header (`multiAddressAndSticky.test.tsx`)
  - Axtarış və normalizasiya (`filtering.test.ts`, `normalization.test.ts`, `smartMultiBrandSearch.test.tsx`)
