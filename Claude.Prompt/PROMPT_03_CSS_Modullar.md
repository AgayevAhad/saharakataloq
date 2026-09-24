# PROMPT 03 — `index.css` 10820 Sətiri Modullara Böl

> **Tətbiq yeri:** `site/src/`  
> **Risk:** Aşağı-Orta — vizual görünüş dəyişmirər, yalnız fayl strukturu  
> **Ön şərt:** PROMPT_01 tamamlanmış olmalıdır  
> **Nəticə:** 10820 sətirlik bir CSS faylı 8 idarəolunan fayla bölünür

---

## Kontekst

`site/src/index.css` hazırda **10820 sətirdir**. Bu faylda hər şey birlikdədir:
- CSS dəyişənləri (color tokens)
- Tema (light/dark)
- Reset/normalize
- Layout utilities
- Animasiyalar
- Hər komponentin öz stilləri
- Responsive breakpoint-lər
- Admin panel stilləri

Bu bölünmə yalnız fayl strukturunu dəyişdirir — CSS-in özü dəyişmir.

---

## Yaradılacaq Fayl Strukturu

```
site/src/styles/
├── tokens.css          ← CSS dəyişənləri: --primary, --bg, --text, --border
├── theme.css           ← light/dark tema class-ları
├── reset.css           ← normalize, box-sizing
├── animations.css      ← keyframes, transitions, splash, shimmer
├── layout.css          ← grid, flex utilities, max-width
├── components/
│   ├── product-card.css
│   ├── modal.css
│   ├── navigation.css
│   ├── admin.css
│   ├── forms.css
│   └── skeleton.css
└── index.css           ← yalnız @import siyahısı (yeni, kiçik)
```

---

## İcra Qaydası

### Addım 1: Mövcud `index.css`-i analiz et

`site/src/index.css` faylını tam oxu. Aşağıdakıları müəyyənləşdir:

1. **Token blokları** — `:root { --primary-color: ...; --bg: ...; }` kimi dəyişənlər
2. **Tema blokları** — `[data-theme="dark"] { ... }` və ya `.theme-dark { ... }`
3. **Reset/normalize blokları** — `*, *::before, *::after { box-sizing: ... }` kimi
4. **Animasiya blokları** — `@keyframes` ifadələri
5. **Layout blokları** — `.container`, `.grid`, `.flex-center` kimi utility class-lar
6. **Komponent blokları** — `.product-card`, `.modal`, `.admin-panel` kimi
7. **Skeleton blokları** — `.shimmer`, `.skeleton-*` kimi
8. **Navigation blokları** — `.header`, `.site-header`, `.mobile-nav` kimi
9. **Admin blokları** — `.admin-*`, `.catalog-admin-*` kimi
10. **Form blokları** — `input`, `select`, `button`, `.form-*` kimi

### Addım 2: `site/src/styles/` qovluğunu yarat

```bash
mkdir -p site/src/styles/components
```

### Addım 3: Hər faylı yarat

**`site/src/styles/tokens.css`** — Yalnız `:root {}` dəyişən bloklarını köçür:

```css
/* Rəng və dizayn token-ları */
:root {
  --primary-color: /* mövcud dəyər */;
  --bg: /* mövcud dəyər */;
  /* ... hamısını köçür */
}
```

**`site/src/styles/theme.css`** — `[data-theme]` və ya `.theme-*` bloklarını köçür:

```css
/* Light tema */
:root,
[data-theme="light"],
.theme-light {
  /* ... */
}

/* Dark tema */
[data-theme="dark"],
.theme-dark {
  /* ... */
}
```

**`site/src/styles/reset.css`** — Normalize, box-sizing blokları:

```css
*, *::before, *::after {
  box-sizing: border-box;
}
/* ... digər reset qaydaları */
```

**`site/src/styles/animations.css`** — Bütün `@keyframes` blokları:

```css
@keyframes shimmer { /* ... */ }
@keyframes fadeIn { /* ... */ }
@keyframes splash-fade-out { /* ... */ }
/* ... hamısını köçür */
```

**`site/src/styles/layout.css`** — Utility class-lar, grid, container:

```css
.container { /* ... */ }
.product-grid-container { /* ... */ }
/* ... */
```

**`site/src/styles/components/product-card.css`** — `.product-card*` class-larının hamısı

**`site/src/styles/components/modal.css`** — `.modal*`, `.product-detail-modal*`, `.share-modal*`

**`site/src/styles/components/navigation.css`** — `.header*`, `.site-header*`, `.mobile-nav*`, `.mobile-bottom-nav*`

**`site/src/styles/components/admin.css`** — `.admin-*`, `.catalog-admin-*`

**`site/src/styles/components/forms.css`** — `input`, `select`, `textarea`, `button`, `.form-*`

**`site/src/styles/components/skeleton.css`** — `.shimmer*`, `.skeleton-*`, splash ekranı stilləri

### Addım 4: `site/src/styles/index.css` yeni faylını yarat

Bu yeni fayl yalnız import siyahısı olacaq:

```css
/* ArdoKataloq — CSS modulları */
@import './reset.css';
@import './tokens.css';
@import './theme.css';
@import './animations.css';
@import './layout.css';
@import './components/product-card.css';
@import './components/modal.css';
@import './components/navigation.css';
@import './components/admin.css';
@import './components/forms.css';
@import './components/skeleton.css';
```

### Addım 5: `site/src/main.tsx`-dəki import-u yenilə

`site/src/main.tsx` (və ya `entry-client.tsx`) içərisindəki:
```typescript
import './index.css';
```
sətirini:
```typescript
import './styles/index.css';
```
ilə əvəz et.

### Addım 6: Köhnə `index.css`-i sil

```bash
rm site/src/index.css
```

> **DİQQƏT:** Əvvəlcə build-in uğurla tamamlandığını yoxla, sonra sil.

---

## Vacib Qeydlər

**CSS-in məzmununu dəyişmə** — Yalnız fayllar arasında köçür. Heç bir selector, dəyər, ya da property dəyişdirilməməlidir.

**CSS sırasını qoru** — `reset.css` həmişə birinci import olunmalıdır. `tokens.css` tema faylından əvvəl gəlməlidir.

**Ağ boş fayllara dikkat** — Əgər bir kateqoriya üçün CSS tapılmırsa, faylı boş yarat amma silistxo (gələcəkdə əlavə ediləcək).

**`@media` query-ləri** — Responsive media query-lər aid olduqları komponent faylının sonuna əlavə edilməlidir. Əgər qlobal responsive query varsa, `layout.css`-ə əlavə et.

---

## Uğur Meyarı

- [ ] `site/src/styles/` qovluğunda 11 fayl yaranıb
- [ ] Köhnə `site/src/index.css` silinib
- [ ] `npm run build` uğurla tamamlanır
- [ ] Brauzerdə saytın görünüşü əvvəlki ilə eynidir — heç bir vizual dəyişiklik yoxdur
- [ ] Dark/light tema keçidi işləyir
- [ ] Admin panel stilləri düzgün görunür
