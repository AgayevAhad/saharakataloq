# PROMPT 05 — Performans: Lazy Loading + Bundle Optimallaşdırması

> **Tətbiq yeri:** `site/src/App.tsx`, `site/vite.config.ts`  
> **Risk:** Aşağı — yalnız import strategiyası dəyişir, davranış eyni qalır  
> **Ön şərt:** PROMPT_01 və PROMPT_02 tamamlanmış olmalıdır  
> **Nəticə:** İlk yükləmə bundle-ı ~40-60% azalır; ağır komponentlər lazım olana kimi yüklənmir

---

## Kontekst

`site/src/App.tsx` içərisindəki bütün komponentlər hazırda statik import edilir. Bu o deməkdir ki, istifadəçi kataloqa baxanda admin panel kodu (7038 sətir), müqayisə paneli, axtarış overlay-i, bütün modal-lar da yüklənir. Bunların əksəriyyəti istifadəçi heç aça bilməz.

Hazırda yalnız bir lazy import var:
```typescript
const CatalogAdmin = lazy(() => import('./components/CatalogAdmin')...);
```

---

## Tapşırıqlar

### 1. `App.tsx`-dəki statik import-ları lazy-ə çevir

`site/src/App.tsx`-in yuxarısındakı bu komponent import-larını **statik** yerinə **lazy** et:

**Lazy ediləcəklər** (istifadəçi açmayan kimi):
```typescript
// Bunları SİL (statik import-lar):
import { ProductDetailModal } from './components/ProductDetailModal';
import { InverterInfoModal } from './components/InverterInfoModal';
import { ShareModal } from './components/ShareModal';
import { SmartSearchOverlay } from './components/SmartSearchOverlay';
import { SaharaMatchModal } from './components/site/SaharaMatchModal';
import { ComparePage } from './pages/ComparePage';
import { AccountPage } from './pages/AccountPage';
import { CartPage } from './pages/CartPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AboutPage } from './pages/AboutPage';
import { CareersPage } from './pages/CareersPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { CustomerCarePage } from './pages/CustomerCarePage';

// Bunları ƏLAVƏ ET (lazy import-lar):
const ProductDetailModal = lazy(() =>
  import('./components/ProductDetailModal').then((m) => ({ default: m.ProductDetailModal }))
);
const InverterInfoModal = lazy(() =>
  import('./components/InverterInfoModal').then((m) => ({ default: m.InverterInfoModal }))
);
const ShareModal = lazy(() =>
  import('./components/ShareModal').then((m) => ({ default: m.ShareModal }))
);
const SmartSearchOverlay = lazy(() =>
  import('./components/SmartSearchOverlay').then((m) => ({ default: m.SmartSearchOverlay }))
);
const SaharaMatchModal = lazy(() =>
  import('./components/site/SaharaMatchModal').then((m) => ({ default: m.SaharaMatchModal }))
);
const ComparePage = lazy(() =>
  import('./pages/ComparePage').then((m) => ({ default: m.ComparePage }))
);
const AccountPage = lazy(() =>
  import('./pages/AccountPage').then((m) => ({ default: m.AccountPage }))
);
const CartPage = lazy(() =>
  import('./pages/CartPage').then((m) => ({ default: m.CartPage }))
);
const FavoritesPage = lazy(() =>
  import('./pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage }))
);
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage }))
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const CareersPage = lazy(() =>
  import('./pages/CareersPage').then((m) => ({ default: m.CareersPage }))
);
const TermsPage = lazy(() =>
  import('./pages/TermsPage').then((m) => ({ default: m.TermsPage }))
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
);
const CustomerCarePage = lazy(() =>
  import('./pages/CustomerCarePage').then((m) => ({ default: m.CustomerCarePage }))
);
```

**Statik QALAN import-lar** (hər zaman göstərilən):
```typescript
// Bunlar statik qalır - həmişə görünür:
import { Header } from './components/Header';
import { SiteHeader } from './components/site/SiteHeader';
import { MobileBottomNav } from './components/site/MobileBottomNav';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { SaharaLogo } from './components/SaharaLogo';
import { BrandShowcase } from './components/BrandShowcase';
import { BannerHero } from './components/BannerHero';
import { ProductCard } from './components/ProductCard';
import { Skeletons } from './components/Skeletons';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { BrandsPage } from './pages/BrandsPage';
```

### 2. `Suspense` wrapper əlavə et

`App.tsx`-in return blokunun içərisindəki **modal və page** render kodunu `<Suspense>` ilə sar:

```tsx
// App.tsx return içərisindəki main blok
<main>
  <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
    {/* Bütün lazy page-lər bu Suspense içərisindədir */}
    {currentRoute === 'compare' && <ComparePage ... />}
    {currentRoute === 'account' && <AccountPage ... />}
    {currentRoute === 'cart' && <CartPage ... />}
    {/* ... digər lazy page-lər */}
  </Suspense>
</main>

{/* Modal-lar üçün ayrı Suspense */}
<Suspense fallback={null}>
  <ProductDetailModal ... />
  <InverterInfoModal ... />
  <ShareModal ... />
  <SmartSearchOverlay ... />
  <SaharaMatchModal ... />
</Suspense>
```

> **Qeyd:** Modal-lar `visible={false}` olduqda React onları render etmir — amma lazy import ilə birlikdə istifadəçi ilk açmağa çalışana kimi fayl yüklənməyəcək.

### 3. `vite.config.ts`-ə manual chunk-lar əlavə et

`site/vite.config.ts` faylında `build` bölməsini əlavə et:

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk - dəyişməz kitabxanalar
          'vendor-react': ['react', 'react-dom'],
          'vendor-lucide': ['lucide-react'],
          
          // Admin panel - yalnız admin istifadə edir
          'chunk-admin': [
            './src/components/admin/AdminShell',
            './src/components/admin/sections/ProductsSection',
            './src/components/admin/sections/BrandsSection',
            './src/components/admin/sections/CategoriesSection',
            './src/components/admin/sections/MediaSection',
            './src/components/admin/sections/SnapshotsSection',
            './src/components/admin/sections/AnalyticsSection',
            './src/components/admin/sections/LogsSection',
            './src/components/admin/sections/SettingsSection',
          ],
          
          // Modal-lar - istifadəçi tıkladıqda yüklənir
          'chunk-modals': [
            './src/components/ProductDetailModal',
            './src/components/ShareModal',
            './src/components/InverterInfoModal',
          ],
          
          // Yardımçı utility-lər
          'chunk-utils': [
            './src/utils/excel',
            './src/utils/csv',
            './src/utils/specNormalizer',
          ],
        },
      },
    },
    // Chunk ölçüsü xəbərdarlığı həddi
    chunkSizeWarningLimit: 800,
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    cors: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:3004',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:3004',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'happy-dom',
    env: {
      NODE_ENV: 'test',
      ALLOW_TEMP_DATA_DIR: '1',
    },
    include: ['tests/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    exclude: ['backend/**', 'node_modules/**', 'tests/browser/**', 'tests/**/*.mjs'],
  },
});
```

### 4. Şəkillərə `loading="lazy"` əlavə et

`site/src/components/ProductCard.tsx` faylındakı bütün `<img>` tag-larına `loading="lazy"` atributunu əlavə et:

```tsx
// Mövcud:
<img src={...} alt={...} className="..." />

// Yenisi:
<img src={...} alt={...} className="..." loading="lazy" decoding="async" />
```

Eyni şeyi `BrandShowcase.tsx`, `BrandMark.tsx`, `Footer.tsx` içindəki `<img>` tag-larına da tətbiq et.

---

## Uğur Meyarı

- [ ] `npm run build` uğurla tamamlanır
- [ ] Build çıxışında `chunk-admin`, `chunk-modals`, `chunk-utils` adlı ayrı chunk faylları görünür
- [ ] `vendor-react` chunk-u `node_modules/react` kodu saxlayır
- [ ] Brauzerdə Network tab-da: katalog ilk açıldıqda admin panel kodu yüklənmir
- [ ] Məhsul modalı ilk tıklandıqda yüklənir (lazy)
- [ ] `npm test` bütün testlər keçir
- [ ] Heç bir `Suspense` boundary xətası yoxdur
