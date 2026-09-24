# PROMPT 08 — URL Routing: `react-router-dom` v6 Əlavə Et

> **Tətbiq yeri:** `site/src/`  
> **Risk:** Orta-Yüksək — naviqasiya məntiqinin əsası dəyişir  
> **Ön şərt:** PROMPT_06 tamamlanmış olmalıdır (`SiteApp.tsx` mövcud olmalıdır)  
> **Nəticə:** "Geri" düyməsi işləyir; hər səhifənin real URL-i var; refresh işləyir; link paylaşmaq mümkündür

---

## Kontekst

Hazırda naviqasiya `window.history.pushState()` ilə əl ilə idarə olunur. `resolveRouteFromPath` funksiyası URL-dən route çıxarır, `handleNavigate` URL yazır — amma React bundan xəbərsizdir. Brauzerin "Geri" düyməsi `popstate` event-ini tutur amma bəzən state uyğunsuzluğu yaranır. `react-router-dom` bu işi standart, etibarlı şəkildə görür.

**Mövcud URL strukturu artıq düzgündür** — `resolveRouteFromPath` funksiyasında hər route üçün URL artıq müəyyən edilib. Biz onu qoruyacağıq, yalnız `pushState` əl işini `react-router-dom`-a həvalə edəcəyik.

---

## Addım 1: Paketi yüklə

```bash
cd site
npm install react-router-dom@6
```

TypeScript tipi ayrıca lazım deyil — `react-router-dom@6` öz tip fayllarını daxil edir.

---

## Addım 2: `site/src/types/routes.ts` yarat

`App.tsx`-dəki `RouteName` tipini və `resolveRouteFromPath` funksiyasını bu fayla köçür. `App.tsx`-dəki orijinal versiyaları **sil** — bu fayl onları export edəcək:

```typescript
// site/src/types/routes.ts
import { featureFlags } from '../utils/featureFlags';

export type RouteName =
  | 'home'
  | 'catalog'
  | 'brands'
  | 'brand'
  | 'services'
  | 'stores'
  | 'compare'
  | 'support'
  | 'cart'
  | 'favorites'
  | 'account'
  | 'product'
  | 'about'
  | 'careers'
  | 'terms'
  | 'privacy'
  | 'delivery'
  | 'warranty'
  | 'returns'
  | 'faq'
  | '404';

// Route adından URL-ə çevirmə xəritəsi
export const ROUTE_TO_PATH: Record<RouteName, string> = {
  home:      '/',
  catalog:   '/catalog',
  brands:    '/brands',
  brand:     '/brand',        // + /:slug əlavə edilir
  services:  '/services',
  stores:    '/stores',
  compare:   '/compare',
  support:   '/support',
  cart:      '/cart',
  favorites: '/favorites',
  account:   '/account',
  product:   '/product',      // + /:id əlavə edilir
  about:     '/about',
  careers:   '/careers',
  terms:     '/terms',
  privacy:   '/privacy',
  delivery:  '/catdirilma',
  warranty:  '/zemanet',
  returns:   '/qaytarma',
  faq:       '/faq',
  '404':     '/404',
};

// URL yolundan route resolve etmə — mövcud resolveRouteFromPath funksiyası
export const resolveRouteFromPath = (
  path: string
): { route: RouteName; category?: string; brand?: string; productId?: string } => {
  if (!path) return { route: 'home' };
  const clean = path.split('?')[0].replace(/\/$/, '') || '/';
  if (clean === '/' || clean === '') return { route: 'home' };
  if (clean === '/catalog' || clean === '/kataloq') return { route: 'catalog' };
  if (clean === '/brands' || clean === '/brendler' || clean === '/brend')
    return { route: 'brands' };
  if (clean === '/services' || clean === '/xidmetler') return { route: 'services' };
  if (
    clean === '/support' ||
    clean === '/elaqe' ||
    clean === '/komek' ||
    clean === '/destek' ||
    clean === '/musteri-desteyi' ||
    clean === '/musteri-xidmetleri'
  )
    return { route: 'support' };
  if (clean === '/faq' || clean === '/tez-tez-verilen-suallar' || clean === '/suallar')
    return { route: 'faq' };
  if (clean === '/qaytarma' || clean === '/geri-qaytarma' || clean === '/returns')
    return { route: 'returns' };
  if (clean === '/stores' || clean === '/magazalar' || clean === '/magaza')
    return { route: 'stores' };
  if (clean === '/catdirilma' || clean === '/delivery') return { route: 'delivery' };
  if (clean === '/zemanet' || clean === '/warranty') return { route: 'warranty' };
  if (clean === '/cart' || clean === '/sebet') return { route: 'cart' };
  if (
    clean === '/favorites' ||
    clean === '/wishlist' ||
    clean === '/secilmisler' ||
    clean === '/sevimliler' ||
    clean === '/beyenilenler'
  )
    return { route: 'favorites' };
  if (clean === '/about' || clean === '/haqqimizda' || clean === '/haqqinda')
    return { route: 'about' };
  if (clean === '/careers' || clean === '/karyera' || clean === '/vakansiyalar')
    return { route: 'careers' };
  if (clean === '/terms' || clean === '/istifade-sertleri' || clean === '/qaydalar')
    return { route: 'terms' };
  if (clean === '/privacy' || clean === '/mexfilik-siyaseti' || clean === '/mexfilik')
    return { route: 'privacy' };
  if (
    clean === '/account' ||
    clean === '/profile' ||
    clean === '/login' ||
    clean === '/register' ||
    clean === '/auth'
  )
    return { route: 'account' };
  if (clean === '/compare')
    return { route: featureFlags.isEnabled('enableCompare') ? 'compare' : '404' };
  if (clean.startsWith('/product/')) {
    const id = clean.replace('/product/', '');
    return { route: 'product', productId: id };
  }
  if (clean.startsWith('/category/')) {
    const slug = clean.replace('/category/', '');
    return { route: 'catalog', category: slug };
  }
  if (clean.startsWith('/brand/')) {
    const slug = clean.replace('/brand/', '');
    return { route: 'brand', brand: slug };
  }
  if (clean === '/404') return { route: '404' };
  return { route: '404' };
};
```

---

## Addım 3: `site/src/main.tsx`-i `BrowserRouter` ilə sar

`site/src/main.tsx` (və ya `entry-client.tsx`) faylını tap. `<App />` komponentini `<BrowserRouter>` ilə sar:

```tsx
// site/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './styles/index.css'; // PROMPT_03-dən sonrakı yol

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

> **Qeyd:** SSR (Server-Side Rendering) istifadə edirsənsə `BrowserRouter` yerinə `StaticRouter` lazımdır — bu halda `entry-server.tsx` faylını da uyğun şəkildə yenilə.

---

## Addım 4: `site/src/apps/SiteApp.tsx`-i yenilə

`SiteApp.tsx`-dəki əl ilə `pushState` və `popstate` kodunu çıxar, `react-router-dom` hook-larını istifadə et.

### 4a — Import-ları əlavə et

```tsx
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { resolveRouteFromPath, ROUTE_TO_PATH, RouteName } from '../types/routes';
```

### 4b — `useState<RouteName>` + `useEffect(popstate)` BLOKlarını SİL

`SiteApp.tsx`-dən bu iki bloku tamamilə çıxar:

```tsx
// SİL — artıq lazım deyil:
const [currentRoute, setCurrentRoute] = useState<RouteName>(initialResolved.route);

// SİL — artıq lazım deyil:
useEffect(() => {
  const handlePopState = () => { ... window.history ... };
  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, [...]);
```

### 4c — Router hook-larını əlavə et

`SiteApp` funksiyasının əvvəlinə əlavə et:

```tsx
const navigate = useNavigate();
const location = useLocation();

// URL dəyişdikdə route resolve et
const resolved = resolveRouteFromPath(location.pathname);
const currentRoute = resolved.route;
```

### 4d — `handleNavigate` funksiyasını yenilə

Mövcud `handleNavigate` funksiyasındakı `window.history.pushState` çağırışlarını `navigate()` ilə əvəz et:

```tsx
const handleNavigate = useCallback(
  (route: string, param?: string) => {
    const allowedRoutes: Record<string, boolean> = {
      home: true,
      catalog: true,
      brands: true,
      brand: true,
      services: true,
      stores: true,
      support: true,
      favorites: true,
      cart: true,
      account: true,
      profile: true,
      login: true,
      register: true,
      auth: true,
      about: true,
      careers: true,
      terms: true,
      privacy: true,
      delivery: true,
      warranty: true,
      returns: true,
      faq: true,
      compare: featureFlags.isEnabled('enableCompare'),
      product: true,
    };

    if (!allowedRoutes[route]) {
      navigate('/404');
      return;
    }

    let validRoute = route as RouteName;
    if (route === 'profile' || route === 'login' || route === 'register' || route === 'auth') {
      validRoute = 'account';
    }

    // URL-i hesabla
    let targetPath = ROUTE_TO_PATH[validRoute] ?? '/404';

    if (validRoute === 'catalog' && param) {
      const isBrand = catalog.brands.some(
        (b) => b.id === param || b.name.toLowerCase() === param.toLowerCase()
      );
      if (isBrand) {
        setSelectedBrand(param);
        setSelectedCategory('all');
        targetPath = `/brand/${param}`;
      } else {
        setSelectedCategory(param);
        setSelectedBrand('all');
        targetPath = `/category/${param}`;
      }
    } else if (validRoute === 'product' && param) {
      const found = catalog.products.find(
        (p) => p.id === param || p.code.toLowerCase() === param.toLowerCase()
      );
      if (found) setSelectedProduct(found);
      targetPath = `/product/${param}`;
    } else if (validRoute === 'brand' && param) {
      setSelectedBrand(param);
      targetPath = `/brand/${param}`;
    }

    // react-router navigate — pushState yerinə
    navigate(targetPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  [catalog.brands, catalog.products, selectedBrand, navigate]
);
```

### 4e — URL parametrlərini location-dan oxu

`SiteApp` render blokunun əvvəlinə əlavə et — `location.pathname`-dən başlanğıc parametrləri çıxar:

```tsx
// URL-dən başlanğıc kateqoriya/brend/məhsul parametrini oxu
useEffect(() => {
  const resolved = resolveRouteFromPath(location.pathname);
  if (resolved.category) setSelectedCategory(resolved.category);
  if (resolved.brand) setSelectedBrand(resolved.brand);
  if (resolved.productId) {
    const found = catalog.products.find(
      (p) => p.id === resolved.productId || p.code.toLowerCase() === resolved.productId!.toLowerCase()
    );
    if (found) setSelectedProduct(found);
  }
}, [location.pathname, catalog.products]);
```

---

## Addım 5: `site/server.mjs`-ə SPA fallback əlavə et

`site/server.mjs` içərisindəki statik fayl handler-ını tap. Bilinməyən URL-lər üçün `index.html` qaytarılmasını təmin et (SPA-nın tələbidir):

Mövcud statik fayl handler-ında bu bloku tap və yoxla:

```javascript
// Bu blok artıq mövcuddursa — dəyişdirmə, yalnız yoxla:
// Bilinməyən path-lər üçün index.html qaytarılır
if (!req.url.startsWith('/api/') && !req.url.startsWith('/uploads/')) {
  // Statik fayl tapılmadıqda:
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(indexPath));
    return;
  }
}
```

Əgər bu blok **yoxdursa**, `404` qaytaran bloku tapıb ondan əvvəl bu kodu əlavə et.

---

## Addım 6: `CatalogApp.tsx`-də routing

`CatalogApp.tsx` (topdan kataloq modu) üçün routing daha sadədir — çünki kataloqda çox sayda səhifə yoxdur. Orada yalnız bu dəyişikliyi et:

```tsx
// CatalogApp.tsx-dəki window.history.pushState çağırışlarını
// navigate() ilə əvəz et — eyni PROMPT_04d pattern-ini tətbiq et
```

Əgər `CatalogApp.tsx`-də `window.history.pushState` yoxdursa, bu addımı keç.

---

## Addım 7: Köhnə `resolveRouteFromPath` import-larını yenilə

`App.tsx` və ya digər fayllar `resolveRouteFromPath`-i `App.tsx`-dən import edirsə, artıq `types/routes.ts`-dən import edilməlidir:

```typescript
// Köhnə (dəyiş):
import { resolveRouteFromPath } from '../App';

// Yeni:
import { resolveRouteFromPath } from '../types/routes';
```

---

## Uğur Meyarı

- [ ] `npm install` uğurla tamamlanır, `react-router-dom` `package.json`-da var
- [ ] `npm run build` xətasız tamamlanır
- [ ] `npm test` bütün testlər keçir
- [ ] Brauzerdə: `/catalog` URL-inə keçdikdə kataloq açılır
- [ ] Brauzerdə: `/product/ARDO-WS60S` URL-inə getdikdə məhsul açılır
- [ ] Brauzerdə: "Geri" düyməsinə basdıqda əvvəlki səhifəyə qayıdır
- [ ] Brauzerdə: `/catalog` səhifəsini refresh etdikdə yenidən kataloq açılır (404 deyil)
- [ ] Brauzerdə: `/brands` refresh etdikdə brendlər açılır
- [ ] `window.history.pushState` çağırışı `SiteApp.tsx`-də **sıfır** dəfədir
- [ ] `popstate` event listener `SiteApp.tsx`-də **yoxdur**
