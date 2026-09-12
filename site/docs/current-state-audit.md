# Sahara Electronics — Cari Vəziyyət Auditi (Current State Audit)

> **Sənəd tarixi:** 06.09.2026  
> **Məqsəd:** Mərhələ 0 çərçivəsində müstəqil `site/` alt sisteminin tam inventarizasiyası, risk təhlili, API endpoint-ləri və arxitektur təcrid bazasının müəyyənləşdirilməsi.

---

## 1. Kod Bazası və Qovluq İnventarı (`site/`)

| Qovluq / Fayl                          | Təsvir və Məsuliyyət                                                     | Risk Səviyyəsi                                                 |
| :------------------------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------------- |
| `site/src/components/` (28 fayl)       | Public vitrin və admin panel UI komponentləri.                           | Aşağı                                                          |
| `site/src/components/CatalogAdmin.tsx` | Admin panel idarəetmə mərkəzi.                                           | Orta (Mərhələ 2-də modullara bölünməlidir)                     |
| `site/backend/catalogDatabase.mjs`     | SQLite bazası üzərində CRUD, snapshot, miqrasiya və analitika mühərriki. | Yüksək (Bütün dəyişikliklər transaction və backup ilə qorunur) |
| `site/backend/resolvePort.mjs`         | Port konfliktlərinin qarşısını alan dinamik port həlli.                  | Aşağı                                                          |
| `site/server.mjs`                      | Node.js HTTP serveri, API endpoint-ləri, media upload və SPA fallback.   | Orta                                                           |
| `site/data/catalog.sqlite`             | Public təsdiqlənmiş kataloq məlumatları (350 məhsul, 4532 parametr).     | Kritik (Müstəqil nüsxə, root bazaya toxunmur)                  |
| `site/data/catalog-draft.sqlite`       | Admin qaralama bazası.                                                   | Kritik                                                         |
| `site/public/media/`                   | Web-optimallaşdırılmış məhsul və brend vizualları.                       | Orta                                                           |
| `site/scripts/`                        | Ayrılma sərhədi (Boundary check), SHA-256 manifest və köməkçi skriptlər. | Aşağı/Orta                                                     |

---

## 2. API Endpoint İnventarı (`site/server.mjs`)

| Metod    | Endpoint                           | Təyinatı                                                                           | Autentifikasiya / Qorunma                             |
| :------- | :--------------------------------- | :--------------------------------------------------------------------------------- | :---------------------------------------------------- |
| `GET`    | `/api/health`                      | Sistem və verilənlər bazası sağlamlıq yoxlanışı                                    | Açıq                                                  |
| `GET`    | `/api/catalog`                     | Public təsdiqlənmiş kataloq məlumatları (aktiv brendlər, kateqoriyalar, məhsullar) | Açıq (Cache-Control: max-age=60)                      |
| `POST`   | `/api/events`                      | Baxış və əlaqə analitika hadisələri                                                | Açıq (IP əsaslı rate limiting: 240/saat)              |
| `POST`   | `/api/admin/login`                 | Admin sessiyası girişi                                                             | Şifrə ilə qorunur (Lokal şəbəkə, max 8 cəhd / 15 dəq) |
| `GET`    | `/api/admin/data`                  | Qaralama kataloq məlumatları və ümumi analitika                                    | Admin Session + CSRF Token                            |
| `GET`    | `/api/admin/analytics`             | Tarix aralığına görə süzgəclənmiş analitika                                        | Admin Session                                         |
| `GET`    | `/api/admin/logs`                  | Audit loglarının axtarış və səhifələnmə ilə oxunması                               | Admin Session                                         |
| `POST`   | `/api/admin/logs/clear`            | Bütün audit loglarının təmizlənməsi                                                | Admin Session + CSRF Token                            |
| `GET`    | `/api/admin/logs/export`           | Audit loglarının CSV və ya JSON ixracı                                             | Admin Session                                         |
| `POST`   | `/api/admin/catalog/toggle-status` | Kataloq fəaliyyətinin dayandırılması (Profilaktika) və ya bərpası                  | Admin Session + CSRF Token                            |
| `PUT`    | `/api/admin/catalog`               | Qaralama kataloq məlumatlarının yadda saxlanması                                   | Admin Session + CSRF Token                            |
| `POST`   | `/api/admin/publish`               | Qaralamanı canlı ictimai bazaya köçürmə və avtomatik snapshot                      | Admin Session + CSRF Token                            |
| `GET`    | `/api/admin/snapshots`             | Baza snapshot-larının siyahısı                                                     | Admin Session                                         |
| `POST`   | `/api/admin/snapshots`             | Əllə yeni snapshot yaradılması                                                     | Admin Session + CSRF Token                            |
| `POST`   | `/api/admin/snapshots/restore`     | Seçilmiş snapshot-dan qaralamanın bərpa edilməsi                                   | Admin Session + CSRF Token                            |
| `DELETE` | `/api/admin/snapshots/:id`         | Mövcud snapshot-un silinməsi                                                       | Admin Session + CSRF Token                            |
| `POST`   | `/api/admin/media`                 | Şəkil və video fayllarının yüklənməsi                                              | Admin Session + MIME Magic Signature Check            |
| `POST`   | `/api/admin/change-password`       | Admin şifrəsinin dəyişdirilməsi                                                    | Admin Session + CSRF Token                            |
| `POST`   | `/api/admin/logout`                | Admin sessiyasının sonlandırılması                                                 | Admin Session + CSRF Token                            |
| `GET`    | `/uploads/:file`                   | Yüklənmiş media fayllarının paylanması                                             | Açıq (MIME type tənzimləməsi ilə)                     |

---

## 3. Verilənlər Bazası Cədvəl İnventarı (`site/data/catalog.sqlite`)

1. **`schema_migrations`** (5 sətir): Tətbiq olunmuş DB miqrasiya versiyaları.
2. **`catalog_meta`** (1 sətir): Kataloq versiyası və son yenilənmə vaxtı.
3. **`brands`** (3 sətir): ARDO, LOTUS, ARTEL brendləri.
4. **`brand_manufacturing_countries`** (4 sətir): Brendlər üzrə istehsal ölkəsi siyahısı.
5. **`categories`** (13 sətir): Məhsul kateqoriyaları.
6. **`products`** (350 sətir): Əsas məhsul modelləri.
7. **`product_media`** (174 sətir): Məhsul şəkilləri və videoları (crop, order, alt).
8. **`product_highlights`** (630 sətir): Məhsulun əsas üstünlükləri.
9. **`product_specs`** (4532 sətir): Texniki parametrlər.
10. **`catalog_settings`** (1 sətir): Əlaqə məlumatları, təmizlənmiş başlıqlar və parametrlər.
11. **`catalog_snapshots`** (1 sətir): Geri qayıtma nöqtələri (rollbacks).
12. **`audit_logs`** (31 sətir): Admin tərəfindən icra edilmiş əməliyyatların tarixi.
13. **`analytics_events`** (998 sətir): İstifadəçi qarşılıqlı əlaqələri.
14. **`product_view_stats`** (66 sətir): Məhsul baxış statistikası.
15. **`contact_action_stats`** (6 sətir): Zəng və WhatsApp müraciət statistikası.

---

## 4. Test Əhatəsi Faktiki Göstəriciləri

- **Site Alt Sistemi (`site/`):**
  - **Vitest**: 38 test faylı, 161 test keçdi.
  - **Boundary & Integrity**: 1 test faylı (`site/tests/boundary.test.ts`), 5 test keçdi (SHA-256 manifest, negative tampering test, realpath isolation, root-write isolation integration test).
  - **Backup & Snapshot**: 1 test faylı (`site/tests/backupRestore.test.mjs`), 1 test keçdi.
  - **Ümumi Site Testləri**: 39 test faylı, 167 test (100% Pass).

- **Root Kataloq Sistemi:**
  - **Vitest**: 44 test faylı, 246 test keçdi.
  - **Node.js Backend**: 7 test keçdi.
