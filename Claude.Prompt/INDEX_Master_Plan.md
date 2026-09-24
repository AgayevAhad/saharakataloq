# ArdoKataloq Refaktorinq — Master İndeks

> **Layihə:** ArdoKataloq / Sahara Electronics  
> **Hazırlanma tarixi:** Sentyabr 2026  
> **Məqsəd:** 7 prompt ilə layihəni professional arxitekturaya gətirmək

---

## Ümumi Mənzərə

```
PROMPT_00  →  PROMPT_01  →  PROMPT_02
                ↓               ↓
             PROMPT_05      PROMPT_03
                ↓               
             PROMPT_06      PROMPT_04  ← PROMPT_00-dan sonra başlaya bilər
                ↓
             PROMPT_08  (URL Routing)
                ↓
             PROMPT_09  (Hook Testləri)
                ↓
             PROMPT_07  (Yekun Yoxlama)
```

**PROMPT_00** hər şeyin əsasıdır — birinci icra edilməlidir.  
**PROMPT_04** backend-dir, frontend işindən müstəqildir — paralel başlaya bilər.  
**PROMPT_08** PROMPT_06-dan sonra gəlir — `SiteApp.tsx` hazır olmalıdır.  
**PROMPT_09** PROMPT_01 və PROMPT_08-dən sonra gəlir.  
**PROMPT_07** ən sonda — hamısı bitdikdən sonra.

---

## Prompt Siyahısı

| # | Fayl | Mövzu | Hədəf fayl | Cari sətir | Sonrakı sətir | Risk |
|---|------|--------|------------|------------|---------------|------|
| 00 | `PROMPT_00_Baslanqic_Temizlik.md` | Köklü `src/` arxivlə, `react-native-web` sil | `src/`, `package.json`, `vite.config.ts` | — | — | 🟢 Aşağı |
| 01 | `PROMPT_01_AppTsx_Hooks.md` | `App.tsx` state-lərini 6 hook-a köçür | `App.tsx` → `hooks/*.ts` | 2029 sətir | ~1000 sətir | 🟡 Orta |
| 02 | `PROMPT_02_CatalogAdmin_Bolunme.md` | `CatalogAdmin.tsx`-i 9 fayla böl | `CatalogAdmin.tsx` → `admin/*` | 7038 sətir | 3 sətir | 🟡 Orta |
| 03 | `PROMPT_03_CSS_Modullar.md` | `index.css`-i 8 fayla böl | `index.css` → `styles/*` | 10820 sətir | ~15 sətir | 🟢 Aşağı |
| 04 | `PROMPT_04_Server_Bolunme.md` | `server.mjs`-i 6 API router faylına böl | `server.mjs` → `api/*` | 3105 sətir | ~150 sətir | 🔴 Yüksək |
| 05 | `PROMPT_05_Performans_LazyLoad.md` | Lazy loading + Vite chunk bölmə | `App.tsx`, `vite.config.ts` | — | — | 🟢 Aşağı |
| 06 | `PROMPT_06_AppTsx_Mode_Ayirma.md` | `SiteApp` + `CatalogApp` ayrı fayllar | `App.tsx` → `apps/*` | 2029→~25 sətir | ~15 sətir | 🟡 Orta |
| 08 | `PROMPT_08_URL_Routing.md` | `react-router-dom` v6 əlavə et | `SiteApp.tsx`, `main.tsx`, `server.mjs` | — | — | 🟡 Orta |
| 09 | `PROMPT_09_Hook_Testleri.md` | 6 yeni hook + routing üçün testlər | `src/__tests__/use*.test.ts` | 84 test | 90+ test | 🟢 Aşağı |
| 07 | `PROMPT_07_Yekun_Yoxlama.md` | Bütün dəyişiklikləri yoxla | Hamısı | — | — | 🟢 Sıfır |

---

## Hər Promtda Nə Dəyişəcək

### PROMPT_00 — Başlanğıc Təmizlik
**Əvvəl:**
```
ArdoKataloq/
├── src/              ← köhnə versiya (işlənmir)
├── site/             ← aktiv versiya
└── package.json
```
**Sonra:**
```
ArdoKataloq/
├── _archive/src_legacy_catalog/   ← köçürüldü
├── site/             ← aktiv versiya
└── package.json      ← site/-ə yönləndirildi
```
`react-native-web` paketi silinir. Bundle ölçüsü ~15% azalır.

---

### PROMPT_01 — Hook-lar
**Əvvəl:** `App.tsx`-də 25 `useState`

**Sonra:**
```
hooks/
├── useCatalog.ts    ← yükləmə, splash, normalizasiya
├── useTheme.ts      ← tema, localStorage, CSS dəyişənləri
├── useCompare.ts    ← müqayisə siyahısı
├── useFavorites.ts  ← favoritlər
├── useToast.ts      ← bildiriş göstər/gizlət
└── useContact.ts    ← WhatsApp, zəng
```
`App.tsx` 2029 → ~1000 sətirə enər.

---

### PROMPT_02 — Admin Bölmə
**Əvvəl:** `CatalogAdmin.tsx` → 7038 sətir, tək fayl

**Sonra:**
```
components/admin/
├── AdminShell.tsx              ← ~120 sətir
├── sections/
│   ├── ProductsSection.tsx     ← ~800 sətir
│   ├── BrandsSection.tsx       ← ~400 sətir
│   ├── CategoriesSection.tsx   ← ~350 sətir
│   ├── MediaSection.tsx        ← ~500 sətir
│   ├── SnapshotsSection.tsx    ← ~400 sətir
│   ├── AnalyticsSection.tsx    ← ~600 sətir
│   ├── LogsSection.tsx         ← ~300 sətir
│   └── SettingsSection.tsx     ← ~450 sətir
└── index.ts                    ← 1 sətir
```
`CatalogAdmin.tsx` → 3 sətir (yalnız re-export).

---

### PROMPT_03 — CSS Modullar
**Əvvəl:** `index.css` → 10820 sətir, tək fayl

**Sonra:**
```
styles/
├── reset.css         ← ~30 sətir
├── tokens.css        ← ~80 sətir
├── theme.css         ← ~120 sətir
├── animations.css    ← ~150 sətir
├── layout.css        ← ~200 sətir
├── components/
│   ├── product-card.css  ← ~300 sətir
│   ├── modal.css         ← ~400 sətir
│   ├── navigation.css    ← ~500 sətir
│   ├── admin.css         ← ~600 sətir
│   ├── forms.css         ← ~200 sətir
│   └── skeleton.css      ← ~150 sətir
└── index.css         ← ~12 sətir (yalnız @import)
```

---

### PROMPT_04 — Server Bölmə
**Əvvəl:** `server.mjs` → 3105 sətir, tək fayl

**Sonra:**
```
api/
├── router.mjs    ← ~50 sətir
├── auth.mjs      ← ~300 sətir
├── catalog.mjs   ← ~200 sətir
├── products.mjs  ← ~600 sətir
├── media.mjs     ← ~400 sətir
├── snapshots.mjs ← ~300 sətir
└── settings.mjs  ← ~400 sətir
```
`server.mjs` → ~150 sətir (yalnız başlatma).

---

### PROMPT_05 — Performans
**Əvvəl:** Hamısı eyni anda yüklənir (~1.8MB JavaScript)

**Sonra:** Chunk-lara bölünür:
- `vendor-react` — React kitabxanası (dəyişməz, cache-lənir)
- `chunk-admin` — Yalnız admin açdıqda yüklənir
- `chunk-modals` — Yalnız modal açıldıqda yüklənir
- `chunk-utils` — Yalnız excel/csv lazım olduqda

Gözlənilən nəticə: İlk yükləmə ~40-60% sürətlənir.

---

### PROMPT_06 — Mod Ayrılması
**Əvvəl:** `App.tsx`-də 22 dəfə `isSiteMode ? ... : ...`

**Sonra:**
```
apps/
├── SiteApp.tsx     ← müştəri saytı məntiqi
└── CatalogApp.tsx  ← topdan kataloq məntiqi
```
`App.tsx` → 15 sətir (yalnız seçici).

---

### PROMPT_07 — Yekun Yoxlama
Kodun doğruluğunu, build-i, testləri, brauzer funksionallığını yoxlayan hesabat.

---

## Promtları AI-ya Necə Verəcəksən

### Tövsiyə olunan AI: Claude Sonnet (bu sessiya) və ya Claude Code

### Metod 1 — Hər prompt ayrı sessiyada
Hər prompt faylının məzmununu yeni söhbətdə ver. Fayl konteksti saxlanır, qarışıqlıq olmur.

### Metod 2 — Claude Code (ən yaxşı)
```bash
cd ArdoKataloq
# Prompt faylını birbaşa Claude Code-a ver:
cat Promptlar/PROMPT_00_Baslanqic_Temizlik.md | claude
```

### Vacib Qeyd
Hər promptdan sonra:
1. `npm run build` uğurla keçməlidir
2. Brauzerda test et
3. Sonra növbəti prompta keç

**Heç vaxt iki promptu eyni anda tətbiq etmə.**

---

## Gözlənilən Yekun Nəticə

| Göstərici | İndiki | Hədəf |
|---|---|---|
| `CatalogAdmin.tsx` | 7038 sətir | 3 sətir |
| `App.tsx` | 2029 sətir | ~15 sətir |
| `server.mjs` | 3105 sətir | ~150 sətir |
| `index.css` | 10820 sətir | ~12 sətir |
| Dublikat komponent | 24 fayl | 0 fayl |
| `react-native-web` | Var | Yox |
| `isSiteMode` şərtləri | 22 dəfə | 0 dəfə |
| Hook sayı | 4 | 10 |
| İlk yükləmə sürəti | Yavaş | ~50% sürətli |
| Admin panel tab sayı | 1 fayl (7038 sətir) | 9 ayrı fayl |
| URL routing | `pushState` əl işi | `react-router-dom` v6 |
| "Geri" düyməsi | Bəzən işləmir | Həmişə işləyir |
| Link paylaşmaq | Mümkün deyil | `/product/:id` işləyir |
| Hook test əhatəsi | 0 test | 6 hook, 40+ yeni test |
| Toplam test sayı | 84 | 90+ |
