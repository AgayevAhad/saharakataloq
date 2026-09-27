# PROMPT 12 — `SiteApp.tsx` Qalan State-lər + Kiçik Düzəltmələr

> **Tətbiq yeri:** `site/src/apps/SiteApp.tsx`, `site/src/hooks/`, `site/index.html`, `site/src/main.tsx`
> **Risk:** Aşağı — hook köçürməsi + kiçik konfiqurasiya düzəltmələri
> **Ön şərt:** PROMPT_01 (ilk hook-lar) tamamlanmış olmalıdır
> **Nəticə:** `SiteApp.tsx` 18 state-dən ~6-ya enər; font yükləmə optimallaşır; viewport düzəlir; NetworkState aktiv olur

---

## Kontekst

`SiteApp.tsx`-də PROMPT_01-dən sonra hələ **18 `useState`** qalıb. Bunların bir qismi hook-lara köçürülə bilər. Eyni zamanda analizdən aşkar olan 3 kiçik düzəltmə var.

---

## Tapşırıq 1: `useModalState` hook-u yarat

`site/src/hooks/useModalState.ts` faylını yarat:

```typescript
// site/src/hooks/useModalState.ts
import { useCallback, useState } from 'react';
import type { Product } from '../types/product';

interface ModalState {
  isInverterModalOpen: boolean;
  isShareModalOpen: boolean;
  shareTargetProduct: Product | null;
  isDrawerOpen: boolean;
  isUserDrawerOpen: boolean;
  mobileMenuOpenSignal: number;
  isSearchOverlayOpen: boolean;
  isSaharaMatchOpen: boolean;
}

interface ModalActions {
  openInverterModal: () => void;
  closeInverterModal: () => void;
  openShareModal: (product: Product) => void;
  closeShareModal: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  openUserDrawer: () => void;
  closeUserDrawer: () => void;
  triggerMobileMenu: () => void;
  openSearchOverlay: () => void;
  closeSearchOverlay: () => void;
  openSaharaMatch: () => void;
  closeSaharaMatch: () => void;
}

export function useModalState(): ModalState & ModalActions {
  const [isInverterModalOpen, setIsInverterModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetProduct, setShareTargetProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const [mobileMenuOpenSignal, setMobileMenuOpenSignal] = useState(0);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isSaharaMatchOpen, setIsSaharaMatchOpen] = useState(false);

  const openInverterModal = useCallback(() => setIsInverterModalOpen(true), []);
  const closeInverterModal = useCallback(() => setIsInverterModalOpen(false), []);

  const openShareModal = useCallback((product: Product) => {
    setShareTargetProduct(product);
    setIsShareModalOpen(true);
  }, []);
  const closeShareModal = useCallback(() => {
    setIsShareModalOpen(false);
    setShareTargetProduct(null);
  }, []);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const openUserDrawer = useCallback(() => setIsUserDrawerOpen(true), []);
  const closeUserDrawer = useCallback(() => setIsUserDrawerOpen(false), []);

  const triggerMobileMenu = useCallback(
    () => setMobileMenuOpenSignal((prev) => prev + 1),
    []
  );

  const openSearchOverlay = useCallback(() => setIsSearchOverlayOpen(true), []);
  const closeSearchOverlay = useCallback(() => setIsSearchOverlayOpen(false), []);

  const openSaharaMatch = useCallback(() => setIsSaharaMatchOpen(true), []);
  const closeSaharaMatch = useCallback(() => setIsSaharaMatchOpen(false), []);

  return {
    isInverterModalOpen,
    isShareModalOpen,
    shareTargetProduct,
    isDrawerOpen,
    isUserDrawerOpen,
    mobileMenuOpenSignal,
    isSearchOverlayOpen,
    isSaharaMatchOpen,
    openInverterModal,
    closeInverterModal,
    openShareModal,
    closeShareModal,
    openDrawer,
    closeDrawer,
    openUserDrawer,
    closeUserDrawer,
    triggerMobileMenu,
    openSearchOverlay,
    closeSearchOverlay,
    openSaharaMatch,
    closeSaharaMatch,
  };
}
```

---

## Tapşırıq 2: `useProductSelection` hook-u yarat

`site/src/hooks/useProductSelection.ts` faylını yarat:

```typescript
// site/src/hooks/useProductSelection.ts
import { useCallback, useState } from 'react';
import type { Product } from '../types/product';

interface ProductSelectionState {
  selectedProduct: Product | null;
  selectedCategory: string | null;
  selectedBrand: string | null;
  searchQuery: string;
  selectedArticleId: string | null;
}

interface ProductSelectionActions {
  setSelectedProduct: (product: Product | null) => void;
  setSelectedCategory: (cat: string | null) => void;
  setSelectedBrand: (brand: string | null) => void;
  setSearchQuery: (q: string) => void;
  setSelectedArticleId: (id: string | null) => void;
  clearFilters: () => void;
}

interface UseProductSelectionOptions {
  initialCategory?: string | null;
  initialBrand?: string | null;
}

export function useProductSelection(
  opts: UseProductSelectionOptions = {}
): ProductSelectionState & ProductSelectionActions {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    opts.initialCategory ?? null
  );
  const [selectedBrand, setSelectedBrand] = useState<string | null>(
    opts.initialBrand ?? null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  const clearFilters = useCallback(() => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSearchQuery('');
  }, []);

  return {
    selectedProduct,
    selectedCategory,
    selectedBrand,
    searchQuery,
    selectedArticleId,
    setSelectedProduct,
    setSelectedCategory,
    setSelectedBrand,
    setSearchQuery,
    setSelectedArticleId,
    clearFilters,
  };
}
```

---

## Tapşırıq 3: `SiteApp.tsx`-i yenilə

`site/src/apps/SiteApp.tsx`-i aç.

### 3a — Import-ları əlavə et

```typescript
import { useModalState } from '../hooks/useModalState';
import { useProductSelection } from '../hooks/useProductSelection';
```

### 3b — Köhnə state-ləri sil, hook-larla əvəz et

**Silinəcək state-lər** (sətir ~128–142):
```typescript
// BU SƏTİRLƏRİ SİL:
const [selectedCategory, setSelectedCategory] = useState<string | null>(...);
const [selectedBrand, setSelectedBrand] = useState<string | null>(...);
const [searchQuery, setSearchQuery] = useState('');
const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
const [isInverterModalOpen, setIsInverterModalOpen] = useState(false);
const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
const [isShareModalOpen, setIsShareModalOpen] = useState(false);
const [shareTargetProduct, setShareTargetProduct] = useState<Product | null>(null);
const [isDrawerOpen, setIsDrawerOpen] = useState(false);
const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
const [mobileMenuOpenSignal, setMobileMenuOpenSignal] = useState(0);
const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
const [isSaharaMatchOpen, setIsSaharaMatchOpen] = useState(false);
```

**Əvəzinə hook çağırışları əlavə et:**
```typescript
const {
  selectedProduct, setSelectedProduct,
  selectedCategory, setSelectedCategory,
  selectedBrand, setSelectedBrand,
  searchQuery, setSearchQuery,
  selectedArticleId, setSelectedArticleId,
  clearFilters,
} = useProductSelection({
  initialCategory: resolved.category ?? null,
  initialBrand: resolved.brand ?? null,
});

const {
  isInverterModalOpen, openInverterModal, closeInverterModal,
  isShareModalOpen, shareTargetProduct, openShareModal, closeShareModal,
  isDrawerOpen, openDrawer, closeDrawer,
  isUserDrawerOpen, openUserDrawer, closeUserDrawer,
  mobileMenuOpenSignal, triggerMobileMenu,
  isSearchOverlayOpen, openSearchOverlay, closeSearchOverlay,
  isSaharaMatchOpen, openSaharaMatch, closeSaharaMatch,
} = useModalState();
```

### 3c — `SiteApp.tsx`-dəki istifadə yerlərini yenilə

Hook-lardan gələn action funksiyalarını `SiteApp.tsx` içərisindəki müvafiq yerlərdə istifadə et. Məsələn:

```typescript
// ƏVVƏLİ:
setIsSearchOverlayOpen(true)
// YENİSİ:
openSearchOverlay()

// ƏVVƏLİ:
setIsShareModalOpen(true); setShareTargetProduct(product);
// YENİSİ:
openShareModal(product)

// ƏVVƏLİ:
setMobileMenuOpenSignal(prev => prev + 1)
// YENİSİ:
triggerMobileMenu()
```

---

## Tapşırıq 4: `index.html` — viewport + font optimallaşdırması

`site/index.html` faylını aç.

### 4a — viewport meta-nı yenilə

```html
<!-- ƏVVƏLİ: -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- YENİSİ: -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

### 4b — Google Fonts yükünü azalt

```html
<!-- ƏVVƏLİ — 10 font çəkisi: -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

<!-- YENİSİ — 4 font çəkisi (ən çox istifadə olunanlar): -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Outfit:wght@600;700&display=swap" rel="stylesheet" />
```

> **Qeyd:** Əgər `Inter:300` (light) stilini açıq şəkildə istifadə edən yer varsa, `400;600` yerinə `400;500;600` yaz. Lakin `300` çox nadir istifadə olunur — çıxarmaq təhlükəsizdir.

---

## Tapşırıq 5: `NetworkState` komponentini aktiv et

`site/src/apps/SiteApp.tsx`-ə `NetworkState` komponentini əlavə et:

### 5a — Import əlavə et

```typescript
import { NetworkState } from '../components/ui/NetworkState';
```

### 5b — `SiteApp` return blokuna əlavə et

`<Toast />` komponentindən dərhal əvvəl əlavə et:

```tsx
{/* İnternet bağlantısı kəsildikdə bildiriş */}
<NetworkState theme={theme} />

<Toast message={toast.message} visible={toast.visible} theme={theme} />
```

> **Qeyd:** `NetworkState` komponenti `online`/`offline` event-lərini dinləyir. İstifadəçi internet bağlantısını itirdikdə avtomatik bildiriş göstərər. Props-da `theme` lazım deyilsə, komponentin mövcud interface-inə bax.

---

## Tapşırıq 6: `hooks/index.ts`-i yenilə

`site/src/hooks/index.ts` faylını aç (əgər varsa). Yeni hook-ları export et:

```typescript
export { useModalState } from './useModalState';
export { useProductSelection } from './useProductSelection';
// ... mövcud export-lar saxlanılır
```

---

## Uğur Meyarı

- [ ] `site/src/hooks/useModalState.ts` yaradılıb
- [ ] `site/src/hooks/useProductSelection.ts` yaradılıb
- [ ] `SiteApp.tsx`-dəki `useState` sayı 18-dən maksimum 6-ya enib
- [ ] `SiteApp.tsx`-də `isInverterModalOpen`, `isShareModalOpen` adlı birbaşa `useState` yoxdur — hook-dan gəlir
- [ ] Modal-lar açılıb-bağlanır (brauzer testi)
- [ ] `viewport-fit=cover` `index.html`-də var
- [ ] Font link-i 2 family, 4 ağırlıq yükləyir (əvvəlki 10 əvəzinə)
- [ ] `NetworkState` komponenti göstərilir — brauzerdə network tab-dan offline etdikdə bildiriş görünür
- [ ] `npm run build` uğurla tamamlanır
- [ ] `npm test` heç bir test sınmır
