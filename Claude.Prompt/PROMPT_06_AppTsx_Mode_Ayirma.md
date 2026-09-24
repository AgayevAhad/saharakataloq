# PROMPT 06 — `App.tsx`-dəki İki Rejimi Ayır: `SiteApp` + `CatalogApp`

> **Tətbiq yeri:** `site/src/`  
> **Risk:** Orta — əsas routing məntiqi yenidən strukturlaşdırılır  
> **Ön şərt:** PROMPT_01 tamamlanmış olmalıdır  
> **Nəticə:** `App.tsx`-dəki `isSiteMode ? ... : ...` şərtlərinin hamısı aradan qalxır; hər rejim öz faylında olur

---

## Kontekst

Hazırda `site/src/App.tsx`-in hər yerindəki **22 dəfə** `isSiteMode`, `appMode` şərti yoxlaması var:

```tsx
{isSiteMode ? <SiteHeader ... /> : <Header ... />}
{isSiteMode ? <div className="site-page-container">...</div> : <div className="catalog-loaded-wrap">...</div>}
{!isSiteMode && <FloatingActions ... />}
{isSiteMode && <MobileBottomNav ... />}
// ... davam edir
```

Bu iki fərqli tətbiqin eyni faylda olması deməkdir:
- **Site modu** (`VITE_APP_MODE=site`): Müştəri saytı — tam naviqasiya, səhifələr, hesab, səbət
- **Katalog modu** (`VITE_APP_MODE=catalog`): Topdan kataloq — yalnız məhsul vitrin

---

## Yaradılacaq Fayl Strukturu

```
site/src/
├── apps/
│   ├── SiteApp.tsx        ← yalnız site modu məntiqi
│   └── CatalogApp.tsx     ← yalnız katalog modu məntiqi
├── App.tsx                ← artıq sadəcə seçici (~15 sətir)
└── hooks/                 ← PROMPT_01-dən gələn hook-lar
```

---

## İcra Qaydası

### Addım 1: `site/src/apps/` qovluğunu yarat

```bash
mkdir -p site/src/apps
```

### Addım 2: `site/src/apps/CatalogApp.tsx` yarat

Bu fayl `App.tsx`-dən yalnız **katalog modu** (`isSiteMode === false`) bölməsini götürür:

```tsx
// site/src/apps/CatalogApp.tsx
import React, { Suspense } from 'react';
import { Header } from '../components/Header';
import { BrandShowcase } from '../components/BrandShowcase';
import { BannerHero } from '../components/BannerHero';
import { ProductCard } from '../components/ProductCard';
import { BrandCategoryFilter } from '../components/BrandCategoryFilter';
import { FloatingActions } from '../components/FloatingActions';
import { Footer } from '../components/Footer';
import { Toast } from '../components/Toast';
import { AdminLogin } from '../components/AdminLogin';
import { BannerHeroSkeleton, ProductGridSkeleton } from '../components/Skeletons';
import { useCatalog } from '../hooks/useCatalog';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { useContact } from '../hooks/useContact';
// ... digər lazımi import-lar

const CatalogAdmin = lazy(() =>
  import('../components/CatalogAdmin').then((m) => ({ default: m.CatalogAdmin }))
);
const ProductDetailModal = lazy(() =>
  import('../components/ProductDetailModal').then((m) => ({ default: m.ProductDetailModal }))
);
// ... digər lazy import-lar

export const CatalogApp: React.FC = () => {
  // Yalnız katalog moduna aid state-lər
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { catalog, isLoading } = useCatalog();
  const { themeMode, toggleTheme, activeTheme } = useTheme(catalog.settings?.primaryColor);
  const { toast, showToast } = useToast();
  const { openWhatsApp, openCall } = useContact({
    settings: catalog.settings,
    getProductUrl: productUrl,
    showToast,
  });

  // ... kataloqa aid mövcud məntiq

  return (
    <div style={{ backgroundColor: activeTheme.bg, minHeight: '100vh' }}>
      <Header
        theme={activeTheme}
        // ... katalog header prop-ları
      />
      <main>
        {isLoading ? (
          <>
            <BannerHeroSkeleton theme={activeTheme} />
            <ProductGridSkeleton theme={activeTheme} count={8} />
          </>
        ) : (
          <>
            <BrandShowcase ... />
            <BannerHero ... />
            {/* Katalog məhsul grid */}
          </>
        )}
      </main>
      <Footer ... />
      <FloatingActions ... />

      <Suspense fallback={null}>
        <ProductDetailModal ... />
        {/* Katalog modal-ları */}
      </Suspense>
      <Toast ... />
    </div>
  );
};
```

### Addım 3: `site/src/apps/SiteApp.tsx` yarat

Bu fayl `App.tsx`-dən yalnız **site modu** (`isSiteMode === true`) bölməsini götürür:

```tsx
// site/src/apps/SiteApp.tsx
import React, { lazy, Suspense, useState } from 'react';
import { SiteHeader } from '../components/site/SiteHeader';
import { MobileBottomNav } from '../components/site/MobileBottomNav';
import { Footer } from '../components/Footer';
import { Toast } from '../components/Toast';
import { AdminLogin } from '../components/AdminLogin';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SiteHomePageSkeleton } from '../components/Skeletons';
import { useCatalog } from '../hooks/useCatalog';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { useCompare } from '../hooks/useCompare';
import { useFavorites } from '../hooks/useFavorites';
import { useContact } from '../hooks/useContact';

// Statik import-lar (həmişə görünür)
import { HomePage } from '../pages/HomePage';
import { CatalogPage } from '../pages/CatalogPage';
import { BrandsPage } from '../pages/BrandsPage';
import { ServicesPage } from '../pages/ServicesPage';
import { StoresPage } from '../pages/StoresPage';
import { SupportPage } from '../pages/SupportPage';

// Lazy import-lar (lazım olduqda yüklənir)
const ComparePage = lazy(() => import('../pages/ComparePage').then((m) => ({ default: m.ComparePage })));
const AccountPage = lazy(() => import('../pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const CartPage = lazy(() => import('../pages/CartPage').then((m) => ({ default: m.CartPage })));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const AboutPage = lazy(() => import('../pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const CareersPage = lazy(() => import('../pages/CareersPage').then((m) => ({ default: m.CareersPage })));
const TermsPage = lazy(() => import('../pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('../pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const CatalogAdmin = lazy(() => import('../components/CatalogAdmin').then((m) => ({ default: m.CatalogAdmin })));
const SmartSearchOverlay = lazy(() => import('../components/SmartSearchOverlay').then((m) => ({ default: m.SmartSearchOverlay })));
const ProductDetailModal = lazy(() => import('../components/ProductDetailModal').then((m) => ({ default: m.ProductDetailModal })));
const SaharaMatchModal = lazy(() => import('../components/site/SaharaMatchModal').then((m) => ({ default: m.SaharaMatchModal })));

export const SiteApp: React.FC = () => {
  // Yalnız site moduna aid state-lər (PROMPT_01-dən gələn hook-larla)
  const [currentRoute, setCurrentRoute] = useState<RouteName>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSaharaMatchOpen, setIsSaharaMatchOpen] = useState(false);

  const { catalog, isLoading } = useCatalog({ onLoaded: parseDeepLink });
  const { themeMode, toggleTheme, activeTheme } = useTheme(catalog.settings?.primaryColor);
  const { toast, showToast } = useToast();
  const { comparisonIds, comparisonProducts, addToCompare, removeFromCompare, clearCompare } = useCompare(catalog.products);
  const { favorites, toggleFavorite } = useFavorites();
  const { openWhatsApp, openCall } = useContact({ settings: catalog.settings, getProductUrl: productUrl, showToast });

  // ... mövcud site modu məntiqi — handleNavigate, selectProduct, parseDeepLink və s.

  if (isAdminPath()) {
    // Admin panel render məntiqi
  }

  return (
    <div style={{ backgroundColor: activeTheme.bg, minHeight: '100vh' }}>
      <SiteHeader
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        // ... prop-lar
      />

      <main>
        <Suspense fallback={<SiteHomePageSkeleton theme={activeTheme} />}>
          {currentRoute === 'home' && <HomePage ... />}
          {currentRoute === 'catalog' && <CatalogPage ... />}
          {currentRoute === 'brands' && <BrandsPage ... />}
          {currentRoute === 'services' && <ServicesPage ... />}
          {currentRoute === 'stores' && <StoresPage ... />}
          {currentRoute === 'support' && <SupportPage ... />}
          {currentRoute === 'compare' && <ComparePage ... />}
          {currentRoute === 'account' && <AccountPage ... />}
          {currentRoute === 'cart' && <CartPage ... />}
          {currentRoute === 'favorites' && <FavoritesPage ... />}
          {currentRoute === 'product' && <ProductDetailPage ... />}
          {currentRoute === 'about' && <AboutPage ... />}
          {currentRoute === 'careers' && <CareersPage ... />}
          {currentRoute === 'terms' && <TermsPage ... />}
          {currentRoute === 'privacy' && <PrivacyPage ... />}
        </Suspense>
      </main>

      <Footer ... />
      <MobileBottomNav ... />

      <Suspense fallback={null}>
        <SmartSearchOverlay visible={isSearchOpen} ... />
        <SaharaMatchModal isOpen={isSaharaMatchOpen} ... />
        <ProductDetailModal product={selectedProduct} ... />
      </Suspense>

      <Toast ... />
    </div>
  );
};
```

### Addım 4: `site/src/App.tsx`-i sadəcə seçici et

Bütün mövcud `App.tsx` məzmununu **sil** və aşağıdakı ilə **əvəz et**:

```tsx
// site/src/App.tsx
// Bu fayl yalnız hansı App-ın render ediləcəyini seçir.
// İş məntiqi SiteApp.tsx və CatalogApp.tsx-dədir.

import React from 'react';
import { SiteApp } from './apps/SiteApp';
import { CatalogApp } from './apps/CatalogApp';

const getAppMode = (): 'catalog' | 'site' => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode') || params.get('app_mode');
    if (modeParam === 'catalog' || modeParam === 'site') return modeParam;
  }
  if (import.meta.env.VITE_APP_MODE === 'catalog') return 'catalog';
  return 'site';
};

export const App: React.FC = () => {
  const mode = getAppMode();
  return mode === 'catalog' ? <CatalogApp /> : <SiteApp />;
};
```

---

## Vacib Qeydlər

**Mövcud məntiqi itirmə** — `CatalogApp.tsx` və `SiteApp.tsx`-i yaradarkən `App.tsx`-dəki bütün mövcud məntiqi müvafiq fayllara köçür. Heç bir funksiya, callback, və ya state itirilməməlidir.

**Hook-ları hər iki app-da istifadə et** — PROMPT_01-dən gələn hook-lar (`useCatalog`, `useTheme`, `useToast`, `useCompare`, `useFavorites`, `useContact`) həm `SiteApp`, həm də `CatalogApp`-da istifadə edilir.

**Admin məntiqi `SiteApp`-dadır** — `isAdminPath()` yoxlaması və admin panel render etmə yalnız `SiteApp.tsx`-dədir (katalog modunda admin panel lazım deyil).

**Maintenance mode hər iki app-da var** — `catalog.settings?.catalogActive === false` yoxlaması hər iki app-da olmalıdır.

---

## Uğur Meyarı

- [ ] `site/src/apps/SiteApp.tsx` yaranıb
- [ ] `site/src/apps/CatalogApp.tsx` yaranıb
- [ ] `site/src/App.tsx` artıq yalnız ~15 sətirdir
- [ ] `App.tsx`-də `isSiteMode` ifadəsi **sıfır** dəfə var
- [ ] `VITE_APP_MODE=site` ilə build edilən sayt işləyir
- [ ] `VITE_APP_MODE=catalog` ilə build edilən katalog işləyir
- [ ] `npm run build` uğurla tamamlanır
- [ ] `npm test` bütün testlər keçir
