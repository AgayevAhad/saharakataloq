# ArdoKataloq Refaktorinq — Master İndeks v2

> **Yenilənmə tarixi:** Sentyabr 2026
> **Vəziyyət:** PROMPT_00–09 tamamlanıb. PROMPT_10–12 yeni əlavədir.

---

## TAM PROMPT XƏRİTƏSİ

```
✅ PROMPT_00  Köklü src/ arxivlə, react-native-web sil
     ↓
✅ PROMPT_01  App.tsx → 6 hook
     ↓
✅ PROMPT_02  CatalogAdmin.tsx → 9 fayl
     ↓
✅ PROMPT_03  index.css → 11 fayl
     ↓
✅ PROMPT_04  server.mjs → 6 API router
     ↓
✅ PROMPT_05  Lazy loading + Vite chunk
     ↓
✅ PROMPT_06  SiteApp + CatalogApp ayrılması
     ↓
✅ PROMPT_07  Yekun yoxlama (birinci tur)
     ↓
✅ PROMPT_08  react-router-dom v6
     ↓
✅ PROMPT_09  Hook testləri (84→92 test)
     ↓
🔲 PROMPT_10  ProductDetailPage.tsx → 5 fayl   ← İNDİ
     ↓
🔲 PROMPT_11  ProductCard inline style → token  ← İNDİ
     ↓
🔲 PROMPT_12  SiteApp qalan 18 state → hook    ← İNDİ
     ↓
🔲 PROMPT_13  Yekun yoxlama (ikinci tur)        ← SONRA
```

---

## YENİ 3 PROMPT — XÜLASƏ

| # | Fayl | Nə edir | Hədəf | Risk |
|---|------|---------|-------|------|
| **10** | `PROMPT_10_ProductDetailPage_Bolunme.md` | 3057 sətiri 5 komponentə böl | `pages/product/*.tsx` | 🟡 Orta |
| **11** | `PROMPT_11_ProductCard_CSS_Tokens.md` | 30 inline style → CSS token; Breadcrumbs fix | `ProductCard.tsx`, `Breadcrumbs.tsx` | 🟢 Aşağı |
| **12** | `PROMPT_12_SiteApp_Hooks_Ve_Kicik_Duzeltmeler.md` | 18 state → 2 hook; viewport; font; NetworkState | `SiteApp.tsx`, `index.html` | 🟢 Aşağı |

---

## PROMPT_10 — `ProductDetailPage.tsx` Bölünməsi

**Niyə vacibdir:** 3057 sətirlik tək fayl — ən böyük qalan problem.

**Yaradılacaqlar:**
```
site/src/pages/product/
├── ProductGallery.tsx        ← zoom, drag, fullscreen, video (8 state)
├── ProductTabs.tsx           ← tab naviqasiyası + təsvir tab
├── ProductSpecs.tsx          ← spesifikasiya cədvəli
├── ProductReviews.tsx        ← rəylər + yazma formu (5 state)
└── ProductRecommendations.tsx ← tövsiyə olunan məhsullar
```

**Nəticə:** `ProductDetailPage.tsx` 3057 → ~300 sətir.

---

## PROMPT_11 — `ProductCard.tsx` Inline Style → CSS Token

**Niyə vacibdir:** 30 inline style içərisindəki `'#ffffff'`, `'#0f172a'` hardcoded rənglər dark temada düzgün görünmür.

**Dəyişikliklər:**
- `product-card.css`-ə `.product-card-root`, `.product-card-image-wrap`, `.product-card-title`, `.product-card-price` class-ları əlavə et
- `tokens.css`-ə `--shadow-card-rest`, `--shadow-card-hover` token-ləri əlavə et
- `theme.css`-ə dark tema üçün `--bg-card: #1e2330` əlavə et
- `Breadcrumbs.tsx`-dəki `window.history.pushState` → `useNavigate()` (2 sətir düzəliş)

**Nəticə:** Dark tema tam işləyir; Breadcrumbs router ilə sinxrondur.

---

## PROMPT_12 — `SiteApp.tsx` Qalan 18 State

**Niyə vacibdir:** PROMPT_01-dən sonra hələ 18 `useState` qalmışdı.

**Yaradılacaq hook-lar:**
```
hooks/
├── useModalState.ts       ← 8 modal state + 13 action funksiyası
└── useProductSelection.ts ← selectedProduct, selectedCategory, selectedBrand, searchQuery
```

**Əlavə düzəltmələr eyni promptda:**
- `index.html` viewport: `viewport-fit=cover` əlavə et
- `index.html` font: 10 çəki → 4 çəki (yükləmə ~40% sürətlənir)
- `NetworkState` komponentini `SiteApp.tsx`-ə qoş

**Nəticə:** `SiteApp.tsx` 18 → ~6 `useState`; font yükləmə optimallaşır.

---

## İCRA SIRASI

```
PROMPT_10  →  PROMPT_11  →  PROMPT_12
```

Bu 3 prompt bir-birindən müstəqildir — paralel icra edilə bilər.
Amma hər birindən sonra `npm run build` + brauzer testi tövsiyə olunur.

---

## PROMPT_13 — İKİNCİ YEKun YOXLAMA (Sonra)

PROMPT_10–12 tamamlandıqdan sonra:

```bash
# Fayl ölçüsü yoxlama
wc -l site/src/pages/ProductDetailPage.tsx
# Gözlənilən: < 500 sətir

wc -l site/src/apps/SiteApp.tsx
# Gözlənilən: < 600 sətir (18 state azaldıqdan sonra)

grep -c "useState" site/src/apps/SiteApp.tsx
# Gözlənilən: ≤ 6

grep -c "style={{" site/src/components/ProductCard.tsx
# Gözlənilən: 0 (hardcoded rəng yox)

grep "viewport-fit" site/index.html
# Gözlənilən: viewport-fit=cover tapılır

grep "pushState\|popstate" site/src/components/Breadcrumbs.tsx
# Gözlənilən: heç bir nəticə

# Build
cd site && npm run build 2>&1 | tail -5
# Gözlənilən: uğurlu

# Testlər
npm test 2>&1 | tail -5
# Gözlənilən: 92+ keçir, 0 sınır
```

---

## LAYİHƏNİN YEKun VƏZİYYƏTİ (12 Prompt sonrası)

| Göstərici | Başlanğıc | İndi | Hədəf (12 sonrası) |
|---|---|---|---|
| `CatalogAdmin.tsx` | 7038 sətir | 49 sətir ✅ | 49 sətir |
| `App.tsx` | 2029 sətir | 75 sətir ✅ | 75 sətir |
| `server.mjs` | 3105 sətir | 683 sətir ✅ | 683 sətir |
| `index.css` | 10820 sətir | 12 sətir ✅ | 12 sətir |
| `ProductDetailPage.tsx` | — | 3057 sətir ❌ | ~300 sətir |
| `SiteApp.tsx` useState | — | 18 ❌ | ~6 |
| `ProductCard` inline style | — | 30 ❌ | 0 |
| Dark tema doğruluğu | — | ⚠️ | ✅ |
| `Breadcrumbs` pushState | — | ❌ | ✅ |
| Font yük | — | 10 çəki ⚠️ | 4 çəki |
| `NetworkState` aktiv | — | ❌ | ✅ |
| `viewport-fit=cover` | — | ❌ | ✅ |
| Test sayı | 84 | 92 ✅ | 92+ |
