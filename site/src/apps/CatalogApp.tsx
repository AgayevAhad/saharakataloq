import React, { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { catalogApi } from '../services/catalogApi';
import { Product, TechnologyArticle } from '../types/product';
import { filterCatalogProducts } from '../utils/filter';
import {
  CatalogSortOption,
  filterCatalogPageProducts,
  sortCatalogPageProducts,
} from '../features/catalog/catalogSelection';
import { phoneHref, whatsappHref } from '../utils/contact';
import { ArrowLeft, Filter, Lock, MessageCircle, Moon, Phone, RotateCcw, Sparkles, Sun, X } from 'lucide-react';
import { Header } from '../components/Header';
import { SaharaLogo } from '../components/SaharaLogo';
import { BrandShowcase } from '../components/BrandShowcase';
import { ProductCard } from '../components/ProductCard';
import { BrandCategoryFilter } from '../components/BrandCategoryFilter';
import { CatalogSidebarFilter } from '../components/CatalogSidebarFilter';
import { FloatingActions } from '../components/FloatingActions';
import { Toast } from '../components/Toast';
import { Drawer } from '../components/ui/Drawer';
import { Footer } from '../components/Footer';
import { ProductGridSkeleton } from '../components/Skeletons';
import type { CartItem } from '../pages/CartPage';
import {
  useTheme,
  useToast,
  useCatalog,
  useContact,
  useFavorites,
} from '../hooks';

// Lazy Loaded Pages & Modals
const CartPage = lazy(() =>
  import('../pages/CartPage').then((m) => ({ default: m.CartPage }))
);
const FavoritesPage = lazy(() =>
  import('../pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage }))
);
const ProductDetailModal = lazy(() =>
  import('../components/ProductDetailModal').then((m) => ({ default: m.ProductDetailModal }))
);
const InverterInfoModal = lazy(() =>
  import('../components/InverterInfoModal').then((m) => ({ default: m.InverterInfoModal }))
);
const ShareModal = lazy(() =>
  import('../components/ShareModal').then((m) => ({ default: m.ShareModal }))
);
const SmartSearchOverlay = lazy(() =>
  import('../components/SmartSearchOverlay').then((m) => ({ default: m.SmartSearchOverlay }))
);

export interface CatalogAppProps {
  initialRoute?: string;
  initialData?: any;
  isSsr?: boolean;
}

export const CatalogApp: React.FC<CatalogAppProps> = ({ initialData, isSsr = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [onlyWithVideo, setOnlyWithVideo] = useState(false);
  const [selectedEnergyClass, setSelectedEnergyClass] = useState('all');
  const [selectedMotorType, setSelectedMotorType] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [sortBy, setSortBy] = useState<CatalogSortOption>('recommended');
  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isInverterModalOpen, setIsInverterModalOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetProduct, setShareTargetProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeView, setActiveView] = useState<'catalog' | 'cart' | 'favorites'>('catalog');
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('sahara_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toast Hook
  const { toast, showToast } = useToast();

  // Favorites Hook
  const { favoriteIds, toggleFavorite, clearFavorites } = useFavorites({ showToast });

  // Cart Handlers
  const addToCart = useCallback(
    (product: Product, qty: number = 1) => {
      setCartItems((prev) => {
        const existingIdx = prev.findIndex((item) => item.product.id === product.id);
        let next: CartItem[];
        if (existingIdx >= 0) {
          next = prev.map((item, idx) =>
            idx === existingIdx ? { ...item, quantity: item.quantity + qty } : item
          );
        } else {
          next = [...prev, { product, quantity: qty }];
        }
        try {
          localStorage.setItem('sahara_cart_items', JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast(`${product.title} səbətə əlavə edildi!`);
    },
    [showToast]
  );

  const addAllToCart = useCallback(
    (products: Product[]) => {
      setCartItems((prev) => {
        let next = [...prev];
        for (const product of products) {
          const existingIdx = next.findIndex((item) => item.product.id === product.id);
          if (existingIdx >= 0) {
            next = next.map((item, idx) =>
              idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
            );
          } else {
            next.push({ product, quantity: 1 });
          }
        }
        try {
          localStorage.setItem('sahara_cart_items', JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast(`${products.length} məhsul səbətə əlavə edildi!`);
    },
    [showToast]
  );

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems((prev) => {
      let next: CartItem[];
      if (quantity <= 0) {
        next = prev.filter((item) => item.product.id !== productId);
      } else {
        next = prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item));
      }
      try {
        localStorage.setItem('sahara_cart_items', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const removeItemFromCart = useCallback(
    (productId: string) => {
      setCartItems((prev) => {
        const next = prev.filter((item) => item.product.id !== productId);
        try {
          localStorage.setItem('sahara_cart_items', JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast('Məhsul səbətdən silindi.');
    },
    [showToast]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    try {
      localStorage.removeItem('sahara_cart_items');
    } catch {}
    showToast('Səbət təmizləndi.');
  }, [showToast]);

  // Catalog Deep Link Callback
  const parseDeepLink = useCallback((items: Product[]) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('product');
    if (id) {
      const found = items.find(
        (item) =>
          item.id === id || item.code.toLocaleLowerCase('az') === id.toLocaleLowerCase('az')
      );
      if (found) {
        setSelectedProduct(found);
      }
    }
  }, []);

  const { catalog, isLoadingCatalog } = useCatalog({
    initialCatalog: initialData?.catalog,
    isSsr,
    onLoaded: parseDeepLink,
  });

  // Theme Hook
  const { themeMode, toggleTheme, activeTheme } = useTheme(catalog.settings?.primaryColor);

  // Product URL generator
  const productUrl = useCallback(
    (product: Product) =>
      `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(product.id)}`,
    []
  );

  // Contact Hook
  const { openWhatsApp, openCall, copyLink } = useContact({
    settings: catalog.settings,
    brands: catalog.brands,
    getProductUrl: productUrl,
    showToast,
  });

  useEffect(() => {
    const handleGlobalSpace = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space' || e.key === 'Spacebar') {
        const target = (e.target || document.activeElement) as HTMLElement | null;
        if (
          target &&
          (target.classList?.contains('product-card') || target.closest?.('.product-card')) &&
          !target.closest('button, a, input, textarea, select')
        ) {
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalSpace, { capture: true, passive: false });
    return () => {
      window.removeEventListener('keydown', handleGlobalSpace, { capture: true });
    };
  }, []);

  const selectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    catalogApi.track('product_view', product.id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('product', product.id);
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const closeProduct = useCallback(() => {
    setSelectedProduct(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('product');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const openShare = (product: Product | null) => {
    setShareTargetProduct(product);
    setIsShareModalOpen(true);
  };

  const shareWhatsApp = () => {
    const text = shareTargetProduct
      ? `${shareTargetProduct.code} — ${shareTargetProduct.title}\n${productUrl(shareTargetProduct)}`
      : `Sahara Electronics məhsul kataloqu:\n${window.location.origin}${window.location.pathname}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const shareTelegram = () => {
    const text = shareTargetProduct
      ? `${shareTargetProduct.code} — ${shareTargetProduct.title}`
      : 'Sahara Electronics məhsul kataloqu';
    const url = shareTargetProduct ? productUrl(shareTargetProduct) : window.location.href;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const openArticle = (article?: TechnologyArticle | null) => {
    setSelectedArticleId(article?.id || null);
    setIsInverterModalOpen(true);
  };

  const activeCatalogProducts = useMemo(() => {
    return catalog.products.filter((p) => p.status !== 'draft');
  }, [catalog.products]);

  const { minAvailablePrice, maxAvailablePrice } = useMemo(() => {
    const prices = activeCatalogProducts
      .map((p) => p.price)
      .filter((price): price is number => typeof price === 'number' && price > 0);
    return {
      minAvailablePrice: prices.length ? Math.min(...prices) : 0,
      maxAvailablePrice: prices.length ? Math.max(...prices) : 5000,
    };
  }, [activeCatalogProducts]);

  const selectedMinPrice = minPrice ?? minAvailablePrice;
  const selectedMaxPrice = maxPrice ?? maxAvailablePrice;
  const priceFilterActive =
    selectedMinPrice > minAvailablePrice || selectedMaxPrice < maxAvailablePrice;

  const isCatalogActive =
    selectedBrand !== null ||
    (selectedCategory !== null && selectedCategory !== 'all') ||
    searchQuery.trim().length > 0 ||
    priceFilterActive ||
    onlyDiscounted ||
    onlyWithVideo ||
    selectedEnergyClass !== 'all' ||
    selectedMotorType !== 'all' ||
    selectedColor !== 'all';

  const resetFilters = useCallback(() => {
    setSelectedCategory('all');
    setMinPrice(null);
    setMaxPrice(null);
    setOnlyDiscounted(false);
    setOnlyWithVideo(false);
    setSelectedEnergyClass('all');
    setSelectedMotorType('all');
    setSelectedColor('all');
    setSearchQuery('');
  }, []);

  const hasActiveFilters =
    (selectedCategory !== null && selectedCategory !== 'all') ||
    priceFilterActive ||
    onlyDiscounted ||
    onlyWithVideo ||
    selectedEnergyClass !== 'all' ||
    selectedMotorType !== 'all' ||
    selectedColor !== 'all' ||
    Boolean(searchQuery.trim());

  const activeFiltersCount =
    Number(selectedCategory !== null && selectedCategory !== 'all') +
    Number(priceFilterActive) +
    Number(onlyDiscounted) +
    Number(onlyWithVideo) +
    Number(selectedEnergyClass !== 'all') +
    Number(selectedMotorType !== 'all') +
    Number(selectedColor !== 'all');

  const filteredProducts = useMemo(() => {
    if (!isCatalogActive) return [];
    const brandsFilter = selectedBrand && selectedBrand !== 'all' ? [selectedBrand] : [];
    const filtered = filterCatalogPageProducts(catalog.products, {
      query: searchQuery,
      category: selectedCategory || 'all',
      brands: brandsFilter,
      minPrice: selectedMinPrice,
      maxPrice: selectedMaxPrice,
      priceActive: priceFilterActive,
      onlyDiscounted,
      onlyWithVideo,
      energyClass: selectedEnergyClass,
      motorType: selectedMotorType,
      color: selectedColor,
    });
    return sortCatalogPageProducts(filtered, sortBy);
  }, [
    catalog.products,
    isCatalogActive,
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedMinPrice,
    selectedMaxPrice,
    priceFilterActive,
    onlyDiscounted,
    onlyWithVideo,
    selectedEnergyClass,
    selectedMotorType,
    selectedColor,
    sortBy,
  ]);

  const activeBrandObj =
    selectedBrand && selectedBrand !== 'all'
      ? catalog.brands.find((b) => b.id === selectedBrand)
      : null;

  useEffect(() => {
    if (catalog.settings?.siteTitle) {
      document.title = catalog.settings.siteTitle;
    }
    if (catalog.settings?.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', catalog.settings.primaryColor);
    }
  }, [catalog.settings?.primaryColor, catalog.settings?.siteTitle]);

  // Public Maintenance Mode
  if (catalog.settings?.catalogActive === false) {
    const waNumber = catalog.settings.whatsappNumber || '';
    const phNumber = catalog.settings.phoneNumber || '';
    return (
      <div
        className="maintenance-screen-wrap"
        style={{ background: activeTheme.bg, color: activeTheme.text }}
      >
        <div
          className="maintenance-screen-card"
          style={{ background: activeTheme.bgCard, borderColor: activeTheme.border }}
        >
          <header className="maintenance-header">
            <SaharaLogo isDark={themeMode === 'dark'} />
            <button
              onClick={toggleTheme}
              className="theme-toggle-mini"
              style={{ borderColor: activeTheme.border, color: activeTheme.text }}
              title="Görünüşü dəyiş"
            >
              {themeMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </header>

          <div className="maintenance-badge">
            <Sparkles size={14} color="#d97706" />
            <span>Kataloqda Profilaktik Yenilənmə</span>
          </div>

          <h1 className="maintenance-title" style={{ color: activeTheme.text }}>
            Tezliklə Xidmətinizdəyik
          </h1>

          <p className="maintenance-desc" style={{ color: activeTheme.textSecondary }}>
            {catalog.settings.maintenanceMessage ||
              'Kataloqda profilaktik yenilənmə aparılır. Tezliklə yeni məhsul və qiymətlərlə xidmətinizdəyik.'}
          </p>

          <div className="maintenance-contacts">
            {waNumber && (
              <a
                href={whatsappHref(waNumber, 'Salam! Kataloq haqqında məlumat almaq istəyirəm.')}
                target="_blank"
                rel="noreferrer"
                className="maintenance-btn wa-btn"
              >
                <MessageCircle size={17} />
                <span>WhatsApp ilə Əlaqə</span>
              </a>
            )}

            {phNumber && (
              <a
                href={phoneHref(phNumber)}
                className="maintenance-btn call-btn"
                style={{ background: activeTheme.primary }}
              >
                <Phone size={17} />
                <span>Zəng et ({phNumber})</span>
              </a>
            )}
          </div>

          <footer className="maintenance-footer" style={{ borderColor: activeTheme.border }}>
            <span>{catalog.settings.companyName || 'Sahara Electronics'}</span>
            <a href="/AdministratorNT" className="maintenance-admin-link">
              <Lock size={12} />
              <span>Admin Girişi</span>
            </a>
          </footer>
        </div>
      </div>
    );
  }

  const selectedBrandInfo = selectedProduct
    ? catalog.brands.find((brand) => brand.id === selectedProduct.brandId)
    : undefined;

  return (
    <div className="catalog-shell" style={{ backgroundColor: activeTheme.bg, minHeight: '100vh' }}>
      <Header
        categories={catalog.categories}
        brands={catalog.brands}
        products={catalog.products}
        selectedCategory={selectedCategory || 'all'}
        selectedBrand={selectedBrand || 'all'}
        searchQuery={searchQuery}
        filteredCount={filteredProducts.length}
        totalCount={catalog.products.length}
        favoritesCount={favoriteIds.length}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenFavorites={() => {
          setActiveView('favorites');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCart={() => {
          setActiveView('cart');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentView={activeView}
        theme={activeTheme}
        isDarkMode={themeMode === 'dark'}
        onToggleTheme={toggleTheme}
        onSelectCategory={(catId) => {
          setActiveView('catalog');
          setSelectedCategory(catId);
          setTimeout(() => {
            document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
        onSelectBrand={(brandId) => {
          setActiveView('catalog');
          setSelectedBrand(brandId);
          setTimeout(() => {
            document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
        onSearchChange={(query) => {
          if (activeView !== 'catalog') setActiveView('catalog');
          setSearchQuery(query);
        }}
        onOpenInverterInfo={() => {
          setSelectedArticleId(null);
          setIsInverterModalOpen(true);
        }}
        onOpenCatalogShare={() => {
          setShareTargetProduct(null);
          setIsShareModalOpen(true);
        }}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      <main>
        {isLoadingCatalog ? (
          <div className="catalog-loading-skeleton-wrap">
            <ProductGridSkeleton theme={activeTheme} count={8} />
          </div>
        ) : activeView === 'cart' ? (
          <Suspense
            fallback={
              <div style={{ padding: '60px 24px', maxWidth: '1440px', margin: '0 auto' }}>
                <ProductGridSkeleton theme={activeTheme} count={4} />
              </div>
            }
          >
            <CartPage
              cartItems={cartItems}
              allProducts={catalog.products}
              settings={catalog.settings}
              theme={activeTheme}
              themeMode={themeMode}
              onUpdateQuantity={updateCartQuantity}
              onRemoveItem={removeItemFromCart}
              onClearCart={clearCart}
              onNavigate={(route) => {
                if (route === 'favorites') {
                  setActiveView('favorites');
                } else {
                  setActiveView('catalog');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectProduct={selectProduct}
              onWhatsAppCheckout={(items, totalAmount) => {
                const lines = items.map(
                  (item, idx) =>
                    `${idx + 1}. ${item.product.title} (${item.product.modelCode || item.product.code}) x ${item.quantity} ədəd — ${((item.product.price || 0) * item.quantity).toLocaleString('az-AZ')} ₼`
                );
                const text = `Salam, Sahara Electronics topdansatış kataloqundan sifariş vermək istəyirəm:\n\n${lines.join('\n')}\n\nCəmi Məbləğ: ${totalAmount.toLocaleString('az-AZ')} ₼\n\nZəhmət olmasa sifarişi qəbul edib çatdırılma və ödəmə şərtlərini dəqiqləşdirərdiniz.`;
                const phone = catalog.settings?.whatsappNumber || '994502047700';
                const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              onCall={() => openCall()}
            />
          </Suspense>
        ) : activeView === 'favorites' ? (
          <Suspense
            fallback={
              <div style={{ padding: '60px 24px', maxWidth: '1440px', margin: '0 auto' }}>
                <ProductGridSkeleton theme={activeTheme} count={4} />
              </div>
            }
          >
            <FavoritesPage
              favoriteIds={favoriteIds}
              allProducts={catalog.products}
              categories={catalog.categories}
              settings={catalog.settings}
              theme={activeTheme}
              themeMode={themeMode}
              onToggleFavorite={toggleFavorite}
              onClearFavorites={clearFavorites}
              onAddToCart={addToCart}
              onAddAllToCart={addAllToCart}
              onSelectProduct={selectProduct}
              onWhatsApp={openWhatsApp}
              onCall={() => openCall()}
              onShare={openShare}
              onCopyLink={copyLink}
              onNavigate={(route) => {
                if (route === 'cart') {
                  setActiveView('cart');
                } else {
                  setActiveView('catalog');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </Suspense>
        ) : (
          <div className="catalog-loaded-wrap">
            <BrandShowcase
              brands={catalog.brands}
              products={catalog.products}
              theme={activeTheme}
              onSelect={(brandId) => {
                setSelectedBrand(brandId);
                setSelectedCategory('all');
                setTimeout(() => {
                  document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 60);
              }}
            />

            {isCatalogActive && (
              <section className="catalog-section">
                {activeBrandObj ? (
                  <BrandCategoryFilter
                    brand={activeBrandObj}
                    categories={catalog.categories}
                    products={catalog.products}
                    selectedCategory={selectedCategory || 'all'}
                    onSelectCategory={(catId) => setSelectedCategory(catId)}
                    onBackToBrands={() => {
                      setSelectedBrand(null);
                      setSelectedCategory(null);
                      setSearchQuery('');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    theme={activeTheme}
                  />
                ) : (
                  <div className="catalog-section-heading">
                    <div>
                      <h1 style={{ color: activeTheme.text }}>
                        {searchQuery
                          ? `"${searchQuery}" axtarış nəticələri`
                          : selectedCategory === 'all'
                            ? catalog.settings?.catalogHeading || 'Bütün məhsullar (Bütün brendlər)'
                            : `${catalog.categories.find((item) => item.id === selectedCategory)?.name || 'Məhsullar'} (Bütün brendlər)`}
                      </h1>
                      <p style={{ color: activeTheme.textMuted }}>
                        {catalog.settings?.catalogSubheading ||
                          'Modellərə və texniki xüsusiyyət sahələrinə baxın'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBrand(null);
                        setSelectedCategory(null);
                        setSearchQuery('');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="brand-back-btn"
                      style={{
                        borderColor: activeTheme.border,
                        color: activeTheme.text,
                        backgroundColor: activeTheme.bgSecondary,
                      }}
                    >
                      <ArrowLeft size={15} />
                      <span>Vitrinə qayıt</span>
                    </button>
                  </div>
                )}

                <div
                  className="catalog-body-layout"
                  style={{
                    display: 'flex',
                    gap: '24px',
                    alignItems: 'flex-start',
                    width: '100%',
                    marginTop: '20px',
                  }}
                >
                  {/* Desktop Left Sidebar Filters */}
                  <aside className="catalog-desktop-sidebar">
                    <CatalogSidebarFilter
                      categories={
                        activeBrandObj
                          ? catalog.categories.filter((cat) =>
                              catalog.products.some(
                                (p) =>
                                  p.brandId === activeBrandObj.id &&
                                  p.category === cat.id &&
                                  p.status !== 'draft'
                              )
                            )
                          : catalog.categories
                      }
                      activeProducts={
                        activeBrandObj
                          ? catalog.products.filter(
                              (p) => p.brandId === activeBrandObj.id && p.status !== 'draft'
                            )
                          : activeCatalogProducts
                      }
                      selectedCategory={selectedCategory || 'all'}
                      onSelectCategory={(catId) => setSelectedCategory(catId)}
                      minPrice={selectedMinPrice}
                      maxPrice={selectedMaxPrice}
                      minAvailablePrice={minAvailablePrice}
                      maxAvailablePrice={maxAvailablePrice}
                      onMinPriceChange={(val) => setMinPrice(val)}
                      onMaxPriceChange={(val) => setMaxPrice(val)}
                      onlyDiscounted={onlyDiscounted}
                      onToggleDiscounted={setOnlyDiscounted}
                      onlyWithVideo={onlyWithVideo}
                      onToggleWithVideo={setOnlyWithVideo}
                      selectedEnergyClass={selectedEnergyClass}
                      onSelectEnergyClass={setSelectedEnergyClass}
                      selectedMotorType={selectedMotorType}
                      onSelectMotorType={setSelectedMotorType}
                      selectedColor={selectedColor}
                      onSelectColor={setSelectedColor}
                      hasActiveFilters={hasActiveFilters}
                      onResetFilters={resetFilters}
                      theme={activeTheme}
                      isDarkMode={themeMode === 'dark'}
                    />
                  </aside>

                  {/* Right Area: Products Grid & Controls */}
                  <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                    {/* Top Controls Toolbar */}
                    <div
                      className="catalog-top-controls"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        padding: '10px 16px',
                        borderRadius: '14px',
                        backgroundColor: activeTheme.bgCard,
                        border: `1px solid ${activeTheme.border}`,
                        marginBottom: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setIsMobileFilterDrawerOpen(true)}
                          className="catalog-mobile-filter-btn"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(220, 38, 38, 0.10)',
                            color: '#dc2626',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Filter size={15} />
                          <span>Filtrlər</span>
                          {activeFiltersCount > 0 && (
                            <span
                              style={{
                                backgroundColor: activeTheme.primary,
                                color: '#ffffff',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                fontSize: '11px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {activeFiltersCount}
                            </span>
                          )}
                        </button>

                        <span style={{ fontSize: '13px', fontWeight: 700, color: activeTheme.textMuted }}>
                          Tapılan: <b style={{ color: activeTheme.text }}>{filteredProducts.length}</b> model
                        </span>

                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={resetFilters}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              backgroundColor: 'transparent',
                              color: activeTheme.primary,
                              border: `1px dashed ${activeTheme.primary}`,
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <RotateCcw size={12} />
                            <span>Sıfırla</span>
                          </button>
                        )}
                      </div>

                      {/* Sort Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: activeTheme.textMuted, fontWeight: 600 }}>
                          Sırala:
                        </span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as CatalogSortOption)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            backgroundColor: activeTheme.bgSecondary,
                            border: `1px solid ${activeTheme.border}`,
                            color: activeTheme.text,
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <option value="recommended">Tövsiyə olunan</option>
                          <option value="price-asc">Əvvəlcə ucuz</option>
                          <option value="price-desc">Əvvəlcə baha</option>
                          <option value="newest">Ən yenilər</option>
                          <option value="discount">Endirimli</option>
                        </select>
                      </div>
                    </div>

                    {!filteredProducts.length ? (
                      <div
                        className="empty-state"
                        style={{ background: activeTheme.bgCard, borderColor: activeTheme.border }}
                      >
                        <p style={{ color: activeTheme.text }}>
                          Axtarışa və seçilmiş filtrlərə uyğun məhsul tapılmadı.
                        </p>
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="brand-back-btn"
                            style={{
                              marginTop: '12px',
                              borderColor: activeTheme.primary,
                              color: '#ffffff',
                              backgroundColor: activeTheme.primary,
                            }}
                          >
                            <RotateCcw size={14} />
                            <span>Filtrləri sıfırla</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="product-grid">
                        {filteredProducts.map((p) => {
                          const brandObj = catalog.brands.find((b) => b.id === p.brandId);
                          return (
                            <ProductCard
                              key={p.id}
                              product={p}
                              brand={brandObj}
                              brandName={brandObj?.name || p.brandId || ''}
                              theme={activeTheme}
                              onSelect={selectProduct}
                              onShare={openShare}
                              onWhatsApp={openWhatsApp}
                              onCall={openCall}
                              onCopyLink={copyLink}
                              onAddToCart={addToCart}
                              onToggleFavorite={toggleFavorite}
                              isFavorite={favoriteIds.includes(p.id)}
                              whatsappButtonText={catalog.settings?.whatsappButtonText}
                              callButtonText={catalog.settings?.callButtonText}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Filter Drawer */}
                {isMobileFilterDrawerOpen && (
                  <div
                    className="catalog-mobile-filter-backdrop"
                    onClick={() => setIsMobileFilterDrawerOpen(false)}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 200,
                      backgroundColor: 'rgba(0, 0, 0, 0.65)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <div
                      className="catalog-mobile-filter-drawer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '85%',
                        maxWidth: '340px',
                        height: '100%',
                        backgroundColor: activeTheme.bg,
                        padding: '20px',
                        overflowY: 'auto',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: activeTheme.text }}>
                          Filtrlər
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsMobileFilterDrawerOpen(false)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: activeTheme.text,
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <CatalogSidebarFilter
                        categories={
                          activeBrandObj
                            ? catalog.categories.filter((cat) =>
                                catalog.products.some(
                                  (p) =>
                                    p.brandId === activeBrandObj.id &&
                                    p.category === cat.id &&
                                    p.status !== 'draft'
                                )
                              )
                            : catalog.categories
                        }
                        activeProducts={
                          activeBrandObj
                            ? catalog.products.filter(
                                (p) => p.brandId === activeBrandObj.id && p.status !== 'draft'
                              )
                            : activeCatalogProducts
                        }
                        selectedCategory={selectedCategory || 'all'}
                        onSelectCategory={(catId) => setSelectedCategory(catId)}
                        minPrice={selectedMinPrice}
                        maxPrice={selectedMaxPrice}
                        minAvailablePrice={minAvailablePrice}
                        maxAvailablePrice={maxAvailablePrice}
                        onMinPriceChange={(val) => setMinPrice(val)}
                        onMaxPriceChange={(val) => setMaxPrice(val)}
                        onlyDiscounted={onlyDiscounted}
                        onToggleDiscounted={setOnlyDiscounted}
                        onlyWithVideo={onlyWithVideo}
                        onToggleWithVideo={setOnlyWithVideo}
                        selectedEnergyClass={selectedEnergyClass}
                        onSelectEnergyClass={setSelectedEnergyClass}
                        selectedMotorType={selectedMotorType}
                        onSelectMotorType={setSelectedMotorType}
                        selectedColor={selectedColor}
                        onSelectColor={setSelectedColor}
                        hasActiveFilters={hasActiveFilters}
                        onResetFilters={resetFilters}
                        theme={activeTheme}
                        isDarkMode={themeMode === 'dark'}
                      />

                      <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={resetFilters}
                          style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            backgroundColor: activeTheme.bgSecondary,
                            color: activeTheme.text,
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Sıfırla
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsMobileFilterDrawerOpen(false)}
                          style={{
                            flex: 2,
                            padding: '10px',
                            borderRadius: '8px',
                            backgroundColor: activeTheme.primary,
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Göstər ({filteredProducts.length})
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>

      <Footer
        settings={catalog.settings}
        categories={catalog.categories}
        theme={activeTheme}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          setSelectedBrand('all');
          setTimeout(() => {
            document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
      />

      <FloatingActions
        settings={catalog.settings}
        theme={activeTheme}
        showToast={showToast}
        onTrack={(type) => catalogApi.track(type)}
      />

      <Suspense fallback={null}>
        <ProductDetailModal
          product={selectedProduct}
          brand={selectedBrandInfo}
          theme={activeTheme}
          visible={!!selectedProduct}
          whatsappButtonText={catalog.settings?.whatsappButtonText}
          callButtonText={catalog.settings?.callButtonText}
          onClose={closeProduct}
          onShare={(item) => openShare(item)}
          onWhatsApp={openWhatsApp}
          onCall={openCall}
          onCopyLink={copyLink}
          onAddToCart={addToCart}
          onToggleFavorite={toggleFavorite}
          isFavorite={selectedProduct ? favoriteIds.includes(selectedProduct.id) : false}
        />
        <InverterInfoModal
          theme={activeTheme}
          visible={isInverterModalOpen}
          onClose={() => setIsInverterModalOpen(false)}
          articles={catalog.articles}
          initialArticleId={selectedArticleId}
        />
        <ShareModal
          product={shareTargetProduct}
          theme={activeTheme}
          visible={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onCopyLink={copyLink}
          onWhatsAppShare={shareWhatsApp}
          onTelegramShare={shareTelegram}
        />
      </Suspense>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Sərgi Salonları və Müştəri Dəstəyi"
        position="right"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
              Ünvanlarımız:
            </h4>
            {catalog.settings?.addresses && catalog.settings.addresses.length > 0 ? (
              catalog.settings.addresses.map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    padding: '10px',
                    border: `1px solid ${activeTheme.border}`,
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{addr.title}</div>
                  <div style={{ fontSize: '12px', color: activeTheme.textMuted, marginTop: '2px' }}>
                    {addr.address}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '12px', color: activeTheme.textMuted }}>
                {catalog.settings?.address || 'Sahara Electronics filialları'}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              style={{
                backgroundColor: activeTheme.primary,
                color: '#ffffff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Bağla
            </button>
          </div>
        </div>
      </Drawer>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        theme={activeTheme}
      />
    </div>
  );
};
