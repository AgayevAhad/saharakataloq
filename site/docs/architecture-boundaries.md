# Sahara Electronics — Modular Architecture & Layer Boundaries

## 1. Məqsəd və Prinsiplər

Bu sənəd layihənin modular monolit arxitektura sərhədlərini, qatların (layers) məsuliyyətlərini və komponentlərin ayrılma planını müəyyən edir.

---

## 2. Qatların Məsuliyyətləri (Layer Responsibilities)

```text
┌────────────────────────────────────────────────────────┐
│                   UI / Components                      │
│   (Primitives, Skeletons, Design Tokens, Layouts)      │
├────────────────────────────────────────────────────────┤
│                   Application Layer                    │
│   (Hooks, State Management, Feature Flags, Navigation) │
├────────────────────────────────────────────────────────┤
│                     Domain Layer                       │
│   (Entities, Contracts, Runtime Schemas, Business Rules)│
├────────────────────────────────────────────────────────┤
│                Infrastructure / Services               │
│   (ApiClient, SQLite Database, Storage, CSV/Excel)     │
└────────────────────────────────────────────────────────┘
```

### 2.1 UI Layer (`src/components/`, `src/stories/`)

- **Məsuliyyət:** Təqdimat, istifadəçi qarşılıqlı əlaqəsi, visual vəziyyətlər (loading, empty, error), əlçatanlıq (ARIA, focus trap).
- **Qayda:** UI komponentləri birbaşa verilənlər bazası və ya şəbəkə IO-su etmir; yalnız `services` və ya `hooks` üzərindən işləyir.

### 2.2 Application Layer (`src/hooks/`, `src/utils/`, `src/pages/`)

- **Məsuliyyət:** Biznes proseslərinin idarəsi, feature flags (`FeatureFlagManager`), filtrləmə və axtarış orkestrasiyası.
- **Qayda:** Qlobal UI state və naviqasiya axınlarını tənzimləyir.

### 2.3 Domain Layer (`src/types/`, `src/types/schemas.ts`)

- **Məsuliyyət:** Məhsul, brend, kateqoriya, media və mağaza entity tərifləri, Zod schema-first runtime validasiyaları, dəyişməz biznes qaydaları.
- **Qayda:** Domain qatı heç bir UI və ya platformadan asılı deyil (Framework-agnostic).

### 2.4 Infrastructure / Services Layer (`src/services/`, `backend/`)

- **Məsuliyyət:** `apiClient` şəbəkə utility (timeout, retry, abort controller), SQLite public/draft repository, CSV/Excel import-export, fayl sistemi və backup/restore.

---

## 3. Böyük Komponentlərin Parçalanması və Migration Planı

Mövcud böyük idarəetmə komponenti (`CatalogAdmin.tsx`) tədricən və təhlükəsiz (additive strangler) şəkildə aşağıdakı sub-komponentlərə ayrılacaq:

1. `AdminProductTable.tsx` — Məhsul cədvəli və sürətli idarəetmə
2. `AdminProductEditorModal.tsx` — Məhsul redaktə və media bağlama forması
3. `AdminBrandCategoryManager.tsx` — Brend və kateqoriya ağacı
4. `AdminStoreLocationManager.tsx` — Çoxsaylı mağaza və filial ünvanları
5. `AdminAuditAnalyticsView.tsx` — Audit logları və analitika hesabatı

Mövcud stabil davranış qorunaraq növbəti mərhələlərdə (PIM v2) bu modullar addım-addım aktivləşdiriləcək.

---

## 4. Import Sərhədləri Qaydası

- `src/types` və `src/types/schemas` heç bir UI komponentini import edə bilməz.
- `src/services` UI komponentlərini import edə bilməz.
- `site/` kənarındakı root fayllarından runtime import qadağandır.
