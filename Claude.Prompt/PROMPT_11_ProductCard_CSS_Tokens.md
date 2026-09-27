# PROMPT 11 — `ProductCard.tsx` + `Breadcrumbs.tsx`: Inline Style → CSS Token

> **Tətbiq yeri:** `site/src/components/ProductCard.tsx`, `site/src/components/Breadcrumbs.tsx`, `site/src/styles/tokens.css`, `site/src/styles/components/product-card.css`
> **Risk:** Aşağı — yalnız stil köçürmə, davranış dəyişmir
> **Ön şərt:** PROMPT_03 (CSS modullar) tamamlanmış olmalıdır
> **Nəticə:** 30 inline style CSS token-lərə köçür; dark tema düzgün işləyir; `Breadcrumbs.tsx` router-a qoşulur

---

## Kontekst

### Problem 1 — `ProductCard.tsx` hardcoded rənglər

`ProductCard.tsx` içərisindəki **30 inline style** bloku var. Bunların içərisindəki rənglər hardcoded yazılıb:

```tsx
backgroundColor: '#ffffff'   ← dark temada ağ qalır!
color: '#0f172a'             ← dark temada tünd qalır!
color: '#ffffff'             ← hardcoded ağ mətn
```

`site/src/styles/tokens.css`-də artıq token-lər mövcuddur:
```css
--bg: #ffffff;
--bg-card: #ffffff;
--text: #0f172a;
--radius-xl: 16px;
--shadow-md: ...;
--shadow-xl: ...;
```

Amma `ProductCard.tsx` bunları istifadə etmir — öz hardcoded dəyərlərini yazır.

### Problem 2 — `Breadcrumbs.tsx` köhnə `pushState`

```tsx
window.history.pushState({}, '', item.href);
window.dispatchEvent(new PopStateEvent('popstate'));
```
Bu 2 sətir `react-router-dom`-a keçildikdən sonra hələ dəyişdirilməyib.

---

## Tapşırıq 1: `ProductCard.tsx` inline style-ları köçür

### Addım 1: `site/src/styles/components/product-card.css`-ə yeni class-lar əlavə et

Mövcud `product-card.css` faylına (PROMPT_03-dən sonra mövcuddur) bu class-ları **əlavə et** (mövcud olanları silmə):

```css
/* ─── Məhsul Kartı Ana Konteyner ─── */
.product-card-root {
  background-color: var(--bg-card);
  border: none;
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-5);
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 339px;
  max-height: 339px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  box-shadow: var(--shadow-card-rest);
  transition:
    transform var(--duration-base) var(--ease-standard),
    box-shadow var(--duration-base) ease;
  overflow: visible;
}

.product-card-root.is-active {
  box-shadow: var(--shadow-card-hover);
}

/* ─── Şəkil Konteyneri ─── */
.product-card-image-wrap {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--radius-lg);
}

/* ─── Alt Məlumat Bloku ─── */
.product-card-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-top: var(--space-2);
  flex-shrink: 0;
}

/* ─── Brend + Kateqoriya Sətiri ─── */
.product-card-meta {
  display: flex;
  gap: var(--space-1);
  align-items: center;
}

/* ─── Məhsul Adı ─── */
.product-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ─── Qiymət Sətiri ─── */
.product-card-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-1);
}

.product-card-price {
  font-size: 15px;
  font-weight: 700;
  color: var(--sahara-red);
}

/* ─── Düymə Sırası ─── */
.product-card-actions {
  display: flex;
  gap: var(--space-1);
  align-items: center;
}
```

Eyni zamanda `site/src/styles/tokens.css`-ə kart shadow token-lərini əlavə et:

```css
/* tokens.css-in :root blokuna əlavə et */
--shadow-card-rest: 0 4px 20px rgba(0, 0, 0, 0.05);
--shadow-card-hover: 0 12px 32px rgba(0, 0, 0, 0.12);
```

Dark tema üçün `site/src/styles/theme.css`-ə əlavə et:

```css
[data-theme="dark"] {
  --bg-card: #1e2330;
  --shadow-card-rest: 0 4px 20px rgba(0, 0, 0, 0.25);
  --shadow-card-hover: 0 12px 32px rgba(0, 0, 0, 0.45);
}
```

### Addım 2: `ProductCard.tsx`-dəki inline style-ları yeni class-larla əvəz et

`ProductCard.tsx`-i aç. Hər `style={{...}}` blokunu tap. Aşağıdakı dəyişiklikləri et:

**Kart ana konteyneri (sətir ~261):**
```tsx
// ƏVVƏLİ:
<div
  style={{
    backgroundColor: '#ffffff',
    border: 'none',
    borderRadius: '16px',
    padding: '16px 20px',
    ...
    boxShadow: isActive ? '0 12px 32px rgba(0, 0, 0, 0.12)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
  }}
>

// YENİSİ:
<div className={`product-card-root ${isActive ? 'is-active' : ''}`}>
```

**Şəkil konteyneri (sətir ~300):**
```tsx
// ƏVVƏLİ:
<div style={{ position: 'relative', width: '100%', flex: 1, ... }}>

// YENİSİ:
<div className="product-card-image-wrap">
```

**Məhsul adı (sətir ~407 ətrafı):**
```tsx
// ƏVVƏLİ:
<span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', ... }}>

// YENİSİ:
<span className="product-card-title">
```

**Qiymət sətiri:**
```tsx
// ƏVVƏLİ:
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ... }}>

// YENİSİ:
<div className="product-card-price-row">
```

**Qiymət mətni:**
```tsx
// ƏVVƏLİ:
<span style={{ fontSize: '15px', fontWeight: 700, color: '#dc2626' }}>

// YENİSİ:
<span className="product-card-price">
```

> **Qayda:** Hər inline style bloku üçün ya mövcud CSS class-ı istifadə et, ya da yuxarıdakı `product-card.css`-ə yeni class əlavə et. `style={{color: '#ffffff'}}` kimi hardcoded rəng sətiri heç bir inline style-da qalmamalıdır. Rəngə ehtiyac varsa `var(--token-adı)` ilə CSS-də yaz.

---

## Tapşırıq 2: `Breadcrumbs.tsx` — `useNavigate`-ə keçir

`site/src/components/Breadcrumbs.tsx`-i aç. Sətir ~103–108-ə get:

```tsx
// ƏVVƏLİ (silinəcək):
onClick={(e) => {
  if (item.href?.startsWith('/') && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    e.preventDefault();
    window.history.pushState({}, '', item.href);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}}

// YENİSİ:
```

1. Faylın yuxarısına import əlavə et:
```typescript
import { useNavigate } from 'react-router-dom';
```

2. Komponentin içərisine əlavə et:
```typescript
const navigate = useNavigate();
```

3. onClick-i dəyiş:
```tsx
onClick={(e) => {
  if (item.href?.startsWith('/') && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    e.preventDefault();
    navigate(item.href);
  }
}}
```

---

## Uğur Meyarı

- [ ] `ProductCard.tsx`-də `'#ffffff'`, `'#0f172a'` kimi hardcoded rəng sətiri **sıfır** dəfədir
- [ ] `product-card.css`-də yeni class-lar əlavə edilib
- [ ] `tokens.css`-də `--shadow-card-rest` və `--shadow-card-hover` token-ləri var
- [ ] `theme.css`-də dark tema üçün `--bg-card: #1e2330` var
- [ ] Dark tema açıldıqda kart arxa fonu ağ qalmır, tünd olur
- [ ] `Breadcrumbs.tsx`-də `window.history.pushState` **yoxdur**
- [ ] `Breadcrumbs.tsx`-də `popstate` event **yoxdur**
- [ ] Breadcrumb link-lərinə klik etdikdə `useNavigate` işləyir
- [ ] `npm run build` uğurla tamamlanır
- [ ] `npm test` heç bir test sınmır
