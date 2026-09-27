# PROMPT 10 — `ProductDetailPage.tsx` 3057 Sətiri Bölmək

> **Tətbiq yeri:** `site/src/pages/` və `site/src/pages/product/`
> **Risk:** Orta — komponent parçalanır, props interfeysi saxlanır
> **Ön şərt:** Heç biri — müstəqil promptdur
> **Nəticə:** 3057 sətirlik bir fayl 5 ayrı komponentə bölünür

---

## Kontekst

`site/src/pages/ProductDetailPage.tsx` hazırda **3057 sətirdir** və içərisində tam müstəqil 5 fərqli mövzu var:

| Mövzu | State-lər |
|---|---|
| Qalereya + Zoom + Drag + Fullscreen | `activeMediaIndex`, `isFullscreenGallery`, `zoomScale`, `rotation`, `panPosition`, `isDragging`, `dragStart`, `isVideoMuted` |
| Tab naviqasiyası + Təsvir | `activeTab` |
| Spesifikasiyalar | `specGroups` (useMemo) |
| Müşteri rəyləri | `reviews`, `newRating`, `hoverRating`, `newComment`, `reviewSuccessMessage` |
| Tövsiyə olunan məhsullar | `recommendedProducts` (useMemo) |

---

## Yaradılacaq Fayl Strukturu

```
site/src/pages/product/
├── ProductGallery.tsx          ← şəkil/video karusel + zoom + drag + fullscreen
├── ProductTabs.tsx             ← tab naviqasiyası + təsvir + çatdırılma + zəmanət
├── ProductSpecs.tsx            ← spesifikasiya cədvəli
├── ProductReviews.tsx          ← rəylər + rəy formu
└── ProductRecommendations.tsx  ← tövsiyə olunan məhsullar grid

site/src/pages/ProductDetailPage.tsx  ← ~200 sətirə enər (koordinator)
```

---

## İcra Qaydası

### Addım 1: Qovluq yarat

```bash
mkdir -p site/src/pages/product
```

### Addım 2: `ProductGallery.tsx` yarat

`ProductDetailPage.tsx`-dən aşağıdakıları bu fayla köçür:

**Props interfeysi:**
```typescript
interface ProductGalleryProps {
  product: Product;
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
}
```

**Bu komponent öz state-lərini saxlayır:**
```typescript
const [activeMediaIndex, setActiveMediaIndex] = useState(0);
const [isVideoMuted, setIsVideoMuted] = useState(true);
const [isFullscreenGallery, setIsFullscreenGallery] = useState(false);
const [zoomScale, setZoomScale] = useState(1);
const [rotation, setRotation] = useState(0);
const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
```

**Köçürüləcək məntiq:**
- `mediaList` useMemo hesablaması
- `activeMedia` hesablaması
- thumbnail scroll ref + `useHorizontalScroll`
- video ref-ləri (`videoRef`, `fullscreenVideoRef`, `thumbnailScrollRef`)
- zoom/pan/drag handler-ları (`handleLightboxWheel`, `handlePinchStart`, `handlePinchMove`, `handleMouseDown`, `handleMouseMove`, `handleMouseUp`)
- Ana şəkil/video göstərmə + thumbnail karusel render bloku
- Fullscreen lightbox modal render bloku (faylın sonundakı `isFullscreenGallery && (...)` bloku)

**`product` dəyişdikdə state reset:**
```typescript
useEffect(() => {
  setActiveMediaIndex(0);
  setIsVideoMuted(true);
  setIsFullscreenGallery(false);
  setZoomScale(1);
  setRotation(0);
  setPanPosition({ x: 0, y: 0 });
}, [product.id]);
```

---

### Addım 3: `ProductReviews.tsx` yarat

**Props interfeysi:**
```typescript
interface ProductReviewsProps {
  productId: string;
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  currentUser?: AuthUser | null;
  onOpenAuth?: () => void;
}
```

**Bu komponent öz state-lərini saxlayır:**
```typescript
const [reviews, setReviews] = useState<ProductReview[]>(() => {
  try {
    const saved = localStorage.getItem(`sahara_product_reviews_${productId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
});
const [newRating, setNewRating] = useState(5);
const [hoverRating, setHoverRating] = useState<number | null>(null);
const [newComment, setNewComment] = useState('');
const [reviewSuccessMessage, setReviewSuccessMessage] = useState('');
```

**Köçürüləcək məntiq:**
- `averageRating` useMemo
- `ratingDistribution` useMemo
- `handleReviewSubmit` funksiyası (localStorage-a yazma daxil)
- `productId` dəyişdikdə reviews reset `useEffect`
- Rəy siyahısı render bloku + rəy formu render bloku

**`ProductReview` interface-ni bu fayla köçür** — əgər başqa yerlərdə lazımdırsa `site/src/types/product.ts`-ə əlavə et:
```typescript
export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  isVerified?: boolean;
}
```

---

### Addım 4: `ProductSpecs.tsx` yarat

**Props interfeysi:**
```typescript
interface ProductSpecsProps {
  product: Product;
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
}
```

**Köçürüləcək məntiq:**
- `specGroups` useMemo hesablaması
- Spesifikasiya cədvəli render bloku

---

### Addım 5: `ProductRecommendations.tsx` yarat

**Props interfeysi:**
```typescript
interface ProductRecommendationsProps {
  product: Product;
  allProducts: Product[];
  brands: Brand[];
  categories: CatalogCategory[];
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  onSelectProduct: (product: Product) => void;
  onWhatsApp: (product?: Product | null) => void;
  onCall: (productOrPhone?: Product | string) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: (id: string) => boolean;
  onToggleCompare?: (product: Product) => void;
  isComparing?: (id: string) => boolean;
}
```

**Köçürüləcək məntiq:**
- `recommendedProducts` useMemo hesablaması
- Tövsiyə olunan məhsullar grid render bloku

---

### Addım 6: `ProductTabs.tsx` yarat

**Props interfeysi:**
```typescript
type TabName = 'description' | 'specs' | 'reviews' | 'tech' | 'delivery';

interface ProductTabsProps {
  product: Product;
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  currentUser?: AuthUser | null;
  onOpenAuth?: () => void;
}
```

**State-lər:**
```typescript
const [activeTab, setActiveTab] = useState<TabName>('description');
```

**Köçürüləcək məntiq:**
- Tab naviqasiya bar render bloku
- Təsvir tab məzmunu
- Çatdırılma, zəmanət, texniki tab-lar

**Alt komponentləri daxil edir:**
```typescript
import { ProductSpecs } from './ProductSpecs';
import { ProductReviews } from './ProductReviews';

// Render içərisində:
{activeTab === 'specs' && (
  <ProductSpecs product={product} theme={theme} themeMode={themeMode} />
)}
{activeTab === 'reviews' && (
  <ProductReviews
    productId={product.id}
    theme={theme}
    themeMode={themeMode}
    currentUser={currentUser}
    onOpenAuth={onOpenAuth}
  />
)}
```

---

### Addım 7: `ProductDetailPage.tsx`-i koordinator et

Bütün köçürmə tamamlandıqdan sonra `ProductDetailPage.tsx` yalnız bunları saxlayır:
1. Props interfeysi (dəyişmir)
2. Brend adı, kateqoriya adı useMemo-ları
3. `isCopied` state (link kopyalama)
4. Sağ sütun: ad, qiymət, WhatsApp/zəng/favorit/müqayisə düymələri
5. Yeni komponentlərin render-i

```typescript
// site/src/pages/ProductDetailPage.tsx (yenilənmiş)
import { ProductGallery } from './product/ProductGallery';
import { ProductTabs } from './product/ProductTabs';
import { ProductRecommendations } from './product/ProductRecommendations';

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product, ... }) => {
  const [isCopied, setIsCopied] = useState(false);
  const brand = useMemo(...);
  const category = useMemo(...);

  return (
    <div>
      {/* Geri düyməsi + breadcrumb */}

      <div className="product-detail-grid">
        {/* Sol sütun */}
        <ProductGallery product={product} theme={theme} themeMode={themeMode} />

        {/* Sağ sütun — ad, qiymət, düymələr BURADIR */}
        <div>
          {/* Mövcud sağ sütun məzmunu — dəyişdirilmir */}
        </div>
      </div>

      <ProductTabs
        product={product}
        theme={theme}
        themeMode={themeMode}
        currentUser={currentUser}
        onOpenAuth={onOpenAuth}
      />

      <ProductRecommendations
        product={product}
        allProducts={allProducts}
        brands={brands}
        categories={categories}
        theme={theme}
        themeMode={themeMode}
        onSelectProduct={onSelectProduct}
        onWhatsApp={onWhatsApp}
        onCall={onCall}
        onAddToCart={onAddToCart}
        onToggleFavorite={onToggleFavorite}
        onToggleCompare={onToggleCompare}
      />
    </div>
  );
};
```

---

## Uğur Meyarı

- [ ] `site/src/pages/product/` qovluğunda 4 yeni fayl var
- [ ] `ProductDetailPage.tsx` 3057 sətirdən maksimum 500 sətirə enib
- [ ] Məhsul detail səhifəsi brauzerdə açılır
- [ ] Şəkil qalereyası işləyir — şəkillər arasında keçid, thumbnail klik
- [ ] Zoom, drag, fullscreen işləyir
- [ ] Tab keçidləri işləyir (Təsvir, Spesifikasiya, Rəylər)
- [ ] Rəy yazma formu işləyir — refresh-dən sonra rəylər qalır
- [ ] Tövsiyə olunan məhsullar göstərilir
- [ ] `npm run build` uğurla tamamlanır
- [ ] `npm test` heç bir test sınmır
