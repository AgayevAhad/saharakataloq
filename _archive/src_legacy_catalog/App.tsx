import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { catalogApi, AdminPayload } from './services/catalogApi';
import { CatalogData, Product, CatalogCategory, TechnologyArticle } from './types/product';
import { lightTheme, darkTheme, ThemeMode, ThemeColors } from './types/theme';
import { DEFAULT_CATALOG, normalizeCatalog } from './data/catalog';
import { filterCatalogProducts } from './utils/filter';
import { phoneHref, whatsappHref } from './utils/contact';
import { ArrowLeft, Lock, MessageCircle, Moon, Phone, Sparkles, Sun } from 'lucide-react';
import { Header } from './components/Header';
import { SiteHeader } from './components/site/SiteHeader';
import { SaharaMatchModal } from './components/site/SaharaMatchModal';
import { MobileBottomNav } from './components/site/MobileBottomNav';
import { HomePage } from './pages/HomePage';
import { BrandsPage } from './pages/BrandsPage';
import { ServicesPage } from './pages/ServicesPage';
import { StoresPage } from './pages/StoresPage';
import { ComparePage } from './pages/ComparePage';
import { SupportPage } from './pages/SupportPage';
import { SmartSearchOverlay } from './components/SmartSearchOverlay';
import { SaharaLogo } from './components/SaharaLogo';
import { BrandShowcase } from './components/BrandShowcase';
import { BannerHero } from './components/BannerHero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { InverterInfoModal } from './components/InverterInfoModal';
import { ShareModal } from './components/ShareModal';
import { Toast } from './components/Toast';
import { AdminLogin } from './components/AdminLogin';
import { CatalogAdmin } from './components/CatalogAdmin';
import { Footer } from './components/Footer';
import { FloatingActions } from './components/FloatingActions';
import { BrandCategoryFilter } from './components/BrandCategoryFilter';
import { BannerHeroSkeleton, BrandShowcaseSkeleton, ProductGridSkeleton } from './components/Skeletons';

const THEME_KEY = 'sahara_theme_mode';
const COMPARE_KEY = 'sahara_compare_items';

type RouteName = 'home' | 'catalog' | 'brands' | 'services' | 'stores' | 'compare' | 'support';

const getInitialThemeMode = (): ThemeMode => {
  const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
  if (saved === 'light' || saved === 'dark') return saved;
  return 'light';
};

const getInitialCompare = (): string[] => {
  try {
    const saved = localStorage.getItem(COMPARE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const getAppMode = (): 'catalog' | 'site' => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode') || params.get('app_mode');
    if (modeParam === 'catalog' || modeParam === 'site') {
      return modeParam;
    }
  }
  if (import.meta.env.VITE_APP_MODE === 'catalog') return 'catalog';
  if (import.meta.env.VITE_APP_MODE === 'site') return 'site';
  return 'site';
};

const isAdminPath = () => window.location.pathname.startsWith('/AdministratorNT');

export const App: React.FC = () => {
  const [catalog, setCatalog] = useState<CatalogData>(DEFAULT_CATALOG);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [currentRoute, setCurrentRoute] = useState<RouteName>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isInverterModalOpen, setIsInverterModalOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetProduct, setShareTargetProduct] = useState<Product | null>(null);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isSaharaMatchOpen, setIsSaharaMatchOpen] = useState(false);
  const [comparisonIds, setComparisonIds] = useState<string[]>(getInitialCompare);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Admin state
  const [adminChecked, setAdminChecked] = useState(false);
  const [adminData, setAdminData] = useState<AdminPayload | null>(null);

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;
  const appMode = getAppMode();
  const isSiteMode = appMode === 'site';

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    window.setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 2600);
  }, []);

  const parseDeepLink = useCallback((items: Product[]) => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('product');
    if (!id) return;
    const found = items.find((item) => item.id === id || item.code.toLocaleLowerCase('az') === id.toLocaleLowerCase('az'));
    if (found) setSelectedProduct(found);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const startTime = Date.now();
      try {
        const publicCatalog = await catalogApi.getCatalog();
        const normalized = normalizeCatalog(publicCatalog);
        if (isMounted) {
          setCatalog(normalized);
          parseDeepLink(normalized.products);
          catalogApi.track('catalog_view');
        }
      } catch {
        const fallback = normalizeCatalog(DEFAULT_CATALOG);
        if (isMounted) {
          setCatalog(fallback);
          parseDeepLink(fallback.products);
        }
      } finally {
        if (isAdminPath()) {
          try {
            const data = await catalogApi.getAdminData();
            if (isMounted) setAdminData(data);
          } catch {}
          if (isMounted) setAdminChecked(true);
        }

        const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
        const elapsed = Date.now() - startTime;
        const splashDismissDelay = isTestEnv ? 0 : Math.max(300 - elapsed, 100);
        const shimmerHoldTime = isTestEnv ? 0 : 800;

        setTimeout(() => {
          if (typeof document !== 'undefined') {
            const splash = document.getElementById('app-splash-screen');
            if (splash) {
              splash.classList.add('splash-fade-out');
              setTimeout(() => {
                splash.remove();
              }, isTestEnv ? 0 : 800);
            }
          }
        }, splashDismissDelay);

        setTimeout(() => {
          if (isMounted) {
            setIsLoadingCatalog(false);
          }
        }, splashDismissDelay + shimmerHoldTime);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [parseDeepLink]);

  const selectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    catalogApi.track('product_view', product.id);
    const url = new URL(window.location.href);
    url.searchParams.set('product', product.id);
    window.history.replaceState({}, '', url.toString());
  }, []);

  const closeProduct = useCallback(() => {
    setSelectedProduct(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('product');
    window.history.replaceState({}, '', url.toString());
  }, []);

  const productUrl = (product: Product) => `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(product.id)}`;
  const copyLink = useCallback(async (target?: Product | string) => {
    const value = typeof target === 'string' ? target : target ? productUrl(target) : window.location.href;
    try { await navigator.clipboard.writeText(value); showToast('Link kopyalandı!'); }
    catch { showToast('Linki kopyalamaq mümkün olmadı.'); }
  }, [showToast]);

  const openWhatsApp = useCallback((product?: Product | null) => {
    if (product) {
      const brand = catalog.brands.find((item) => item.id === product.brandId)?.name || '';
      const text = `Salam, Sahara Electronics! Bu məhsul haqqında məlumat almaq istəyirəm:\n\n📌 Model: ${product.code}\n🏷 Məhsul: ${product.title}\n🏢 Brend: ${brand}\n🗂 Kateqoriya: ${product.categoryName}\n\n🔗 ${productUrl(product)}`;
      const href = whatsappHref(catalog.settings.whatsappNumber, text);
      if (!href) return showToast('WhatsApp nömrəsi admin paneldə hələ əlavə edilməyib.');
      catalogApi.track('contact_whatsapp', product.id);
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      const href = whatsappHref(catalog.settings.whatsappNumber, 'Salam, Sahara Electronics! Saytınızdan yazıram, məsləhət almaq istərdim.');
      if (!href) return showToast('WhatsApp nömrəsi admin paneldə hələ əlavə edilməyib.');
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }, [catalog.brands, catalog.settings.whatsappNumber, showToast]);

  const openCall = useCallback((productOrPhone?: Product | string) => {
    const phone = typeof productOrPhone === 'string'
      ? productOrPhone
      : catalog.settings.phoneNumber || catalog.settings.phoneNumbers?.[0];
    const href = phoneHref(phone);
    if (!href) return showToast('Zəng nömrəsi admin paneldə hələ əlavə edilməyib.');
    if (typeof productOrPhone !== 'string' && productOrPhone) {
      catalogApi.track('contact_call', productOrPhone.id);
    }
    window.open(href, '_self');
  }, [catalog.settings.phoneNumber, catalog.settings.phoneNumbers, showToast]);

  const openShare = (product: Product | null) => { setShareTargetProduct(product); setIsShareModalOpen(true); };
  const shareWhatsApp = () => {
    const text = shareTargetProduct
      ? `${shareTargetProduct.code} — ${shareTargetProduct.title}\n${productUrl(shareTargetProduct)}`
      : `Sahara Electronics məhsul kataloqu:\n${window.location.origin}${window.location.pathname}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };
  const shareTelegram = () => {
    const text = shareTargetProduct
      ? `${shareTargetProduct.code} — ${shareTargetProduct.title}`
      : 'Sahara Electronics rəsmi kataloq';
    const url = shareTargetProduct ? productUrl(shareTargetProduct) : window.location.href;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const openArticle = (article?: TechnologyArticle | null) => {
    setSelectedArticleId(article?.id || null);
    setIsInverterModalOpen(true);
  };

  // Compare functions
  const removeFromCompare = useCallback((productId: string) => {
    setComparisonIds((prev) => {
      const next = prev.filter((id) => id !== productId);
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setComparisonIds([]);
    localStorage.removeItem(COMPARE_KEY);
    showToast('Müqayisə siyahısı təmizləndi.');
  }, [showToast]);

  const comparisonProducts = useMemo(() => {
    return comparisonIds
      .map((id) => catalog.products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [catalog.products, comparisonIds]);

  const handleNavigate = useCallback((route: string, param?: string) => {
    const validRoute = (['home', 'catalog', 'brands', 'services', 'stores', 'compare', 'support'].includes(route)
      ? route
      : 'home') as RouteName;
    setCurrentRoute(validRoute);

    if (validRoute === 'catalog') {
      if (param) {
        const isBrand = catalog.brands.some((b) => b.id === param);
        if (isBrand) {
          setSelectedBrand(param);
          setSelectedCategory('all');
        } else {
          setSelectedCategory(param);
          setSelectedBrand('all');
        }
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [catalog.brands]);

  const isCatalogActive = selectedBrand !== null || selectedCategory !== null || searchQuery.trim().length > 0;
  const showCatalogProducts = isSiteMode ? true : isCatalogActive;

  const filteredProducts = useMemo(() => {
    if (!showCatalogProducts) return [];
    return filterCatalogProducts(
      catalog.products,
      selectedCategory || 'all',
      selectedBrand || 'all',
      searchQuery
    );
  }, [catalog.products, showCatalogProducts, searchQuery, selectedBrand, selectedCategory]);

  const activeBrandObj = selectedBrand && selectedBrand !== 'all'
    ? catalog.brands.find((b) => b.id === selectedBrand)
    : null;

  const toggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next); localStorage.setItem(THEME_KEY, next);
  };

  const activeTheme = useMemo(() => {
    const base = themeMode === 'dark' ? darkTheme : lightTheme;
    if (catalog.settings?.primaryColor) {
      return { ...base, primary: catalog.settings.primaryColor };
    }
    return base;
  }, [catalog.settings?.primaryColor, themeMode]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeMode);
      document.documentElement.classList.remove('theme-light', 'theme-dark');
      document.documentElement.classList.add(`theme-${themeMode}`);
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', themeMode === 'dark' ? '#0d0f14' : '#f8fafc');
      }
    }
  }, [themeMode]);

  useEffect(() => {
    if (catalog.settings?.siteTitle) {
      document.title = catalog.settings.siteTitle;
    }
    if (catalog.settings?.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', catalog.settings.primaryColor);
    }
  }, [catalog.settings?.primaryColor, catalog.settings?.siteTitle]);

  if (isAdminPath()) {
    if (!adminChecked) return <div className="app-loading" style={{ background: activeTheme.bg, color: activeTheme.text }}>Admin panel hazırlanır...</div>;
    if (!adminData) return <AdminLogin theme={activeTheme} onLogin={async (password) => { await catalogApi.login(password); setAdminData(await catalogApi.getAdminData()); }} />;
    return <><CatalogAdmin initial={adminData} theme={activeTheme} showToast={showToast} onSave={async (data) => { await catalogApi.saveCatalog(data, adminData.csrfToken); }} onPublish={async (data) => { await catalogApi.saveCatalog(data, adminData.csrfToken); await catalogApi.publishCatalog(adminData.csrfToken); const updated = await catalogApi.getCatalog(); setCatalog(normalizeCatalog(updated)); }} onUpload={(file) => catalogApi.uploadMedia(file, adminData.csrfToken)} onLogout={async () => { await catalogApi.logout(adminData.csrfToken); setAdminData(null); }} /><Toast message={toast.message} visible={toast.visible} theme={activeTheme} /></>;
  }

  // Public Maintenance Mode (Paused by Admin)
  if (catalog.settings?.catalogActive === false) {
    const waNumber = catalog.settings.whatsappNumber || '';
    const phNumber = catalog.settings.phoneNumber || '';
    return (
      <div className="maintenance-screen-wrap" style={{ background: activeTheme.bg, color: activeTheme.text }}>
        <div className="maintenance-screen-card" style={{ background: activeTheme.bgCard, borderColor: activeTheme.border }}>
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
            {catalog.settings.maintenanceMessage || 'Kataloqda profilaktik yenilənmə aparılır. Tezliklə yeni məhsul və qiymətlərlə xidmətinizdəyik.'}
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

  const selectedBrandInfo = selectedProduct ? catalog.brands.find((brand) => brand.id === selectedProduct.brandId) : undefined;

  // Render Catalog View Content
  const renderCatalogView = () => (
    <>
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
      <BannerHero theme={activeTheme} articles={catalog.articles} heroTitle={catalog.settings?.heroBannerTitle} heroSubtitle={catalog.settings?.heroBannerSubtitle} onOpenArticle={openArticle} />

      {showCatalogProducts && (
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
                    ? (catalog.settings?.catalogHeading || 'Bütün məhsullar (Bütün brendlər)')
                    : `${catalog.categories.find((item) => item.id === selectedCategory)?.name || 'Məhsullar'} (Bütün brendlər)`}
                </h1>
                <p style={{ color: activeTheme.textMuted }}>
                  {catalog.settings?.catalogSubheading || 'Modellərə və texniki xüsusiyyət sahələrinə baxın'}
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

          {!filteredProducts.length ? (
            <div className="empty-catalog" style={{ color: activeTheme.textMuted }}>
              Axtarışınıza uyğun məhsul tapılmadı.
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  if (selectedBrand) setSelectedBrand(selectedBrand);
                }}
                style={{ background: activeTheme.primary }}
              >
                Filtrləri sıfırla
              </button>
            </div>
          ) : (
            <div className="product-grid-container">
              {filteredProducts.map((product) => {
                const brand = catalog.brands.find((item) => item.id === product.brandId);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    theme={activeTheme}
                    brandName={brand?.name}
                    brandOrigin={brand?.originCountry ? `${brand.originCountry} brendi` : ''}
                    whatsappButtonText={catalog.settings?.whatsappButtonText}
                    callButtonText={catalog.settings?.callButtonText}
                    shareButtonText={catalog.settings?.shareButtonText}
                    onSelect={selectProduct}
                    onShare={(item) => openShare(item)}
                    onWhatsApp={openWhatsApp}
                    onCall={openCall}
                    onCopyLink={copyLink}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}
    </>
  );

  return (
    <div id="catalog-top-anchor" style={{ backgroundColor: activeTheme.bg, minHeight: '100vh', width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {isSiteMode ? (
        <SiteHeader
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          categories={catalog.categories}
          brands={catalog.brands}
          products={catalog.products}
          settings={catalog.settings}
          theme={activeTheme}
          themeMode={themeMode}
          onToggleTheme={toggleTheme}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenSearchModal={() => setIsSearchOverlayOpen(true)}
          comparisonCount={comparisonIds.length}
          favoritesCount={favorites.length}
          onOpenSaharaMatch={() => setIsSaharaMatchOpen(true)}
        />
      ) : (
        <Header
          theme={activeTheme}
          isDarkMode={themeMode === 'dark'}
          onToggleTheme={toggleTheme}
          selectedCategory={selectedCategory || ''}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            setSelectedBrand('all');
            setTimeout(() => {
              document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          }}
          selectedBrand={selectedBrand || ''}
          onSelectBrand={(brandId) => {
            setSelectedBrand(brandId);
            setSelectedCategory('all');
          }}
          brands={catalog.brands}
          categories={catalog.categories}
          products={catalog.products}
          settings={catalog.settings}
          searchQuery={searchQuery}
          onSearchChange={(query) => {
            setSearchQuery(query);
            if (query.trim() && !selectedBrand) {
              setSelectedBrand('all');
            }
          }}
          onSelectProduct={selectProduct}
          onOpenInverterInfo={() => openArticle()}
          onOpenCatalogShare={() => openShare(null)}
          totalCount={catalog.products.length}
          filteredCount={filteredProducts.length}
        />
      )}

      <main className="catalog-main" style={{ minHeight: 'calc(100vh - 400px)', paddingBottom: isSiteMode ? '80px' : '0' }}>
        {isLoadingCatalog ? (
          <>
            <BrandShowcaseSkeleton theme={activeTheme} />
            <BannerHeroSkeleton theme={activeTheme} />
            {isCatalogActive && (
              <section className="catalog-section" style={{ marginTop: '16px' }}>
                <ProductGridSkeleton theme={activeTheme} count={8} />
              </section>
            )}
          </>
        ) : isSiteMode ? (
          <div className="site-page-container">
            {currentRoute === 'home' && (
              <HomePage
                brands={catalog.brands}
                categories={catalog.categories}
                products={catalog.products}
                articles={catalog.articles}
                settings={catalog.settings}
                theme={activeTheme}
                onNavigate={handleNavigate}
                onSelectProduct={selectProduct}
                onOpenSaharaMatch={() => setIsSaharaMatchOpen(true)}
                onOpenArticle={openArticle}
                onWhatsApp={openWhatsApp}
                onCall={openCall}
                onShare={openShare}
                onCopyLink={copyLink}
              />
            )}
            {currentRoute === 'catalog' && renderCatalogView()}
            {currentRoute === 'brands' && (
              <BrandsPage
                brands={catalog.brands}
                products={catalog.products}
                theme={activeTheme}
                onNavigate={handleNavigate}
              />
            )}
            {currentRoute === 'services' && (
              <ServicesPage
                settings={catalog.settings}
                theme={activeTheme}
                onWhatsApp={() => openWhatsApp(null)}
                onCall={() => openCall()}
              />
            )}
            {currentRoute === 'stores' && (
              <StoresPage
                settings={catalog.settings}
                theme={activeTheme}
                onWhatsApp={() => openWhatsApp(null)}
                onCall={(ph) => openCall(ph)}
              />
            )}
            {currentRoute === 'compare' && (
              <ComparePage
                comparisonProducts={comparisonProducts}
                theme={activeTheme}
                onRemoveFromCompare={removeFromCompare}
                onClearCompare={clearCompare}
                onSelectProduct={selectProduct}
                onNavigate={handleNavigate}
              />
            )}
            {currentRoute === 'support' && (
              <SupportPage
                settings={catalog.settings}
                theme={activeTheme}
                onWhatsApp={() => openWhatsApp(null)}
                onCall={() => openCall()}
              />
            )}
          </div>
        ) : (
          <div className="catalog-loaded-wrap">
            {renderCatalogView()}
          </div>
        )}
      </main>

      {/* Corporate Desktop & Mobile Footer */}
      <Footer
        settings={catalog.settings}
        categories={catalog.categories}
        theme={activeTheme}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          setSelectedBrand('all');
          if (isSiteMode) {
            handleNavigate('catalog', catId);
          } else {
            setTimeout(() => {
              document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          }
        }}
      />

      {/* Floating Translucent Action Buttons on Mobile */}
      {!isSiteMode && (
        <FloatingActions
          settings={catalog.settings}
          theme={activeTheme}
          showToast={showToast}
          onTrack={(type) => catalogApi.track(type)}
        />
      )}

      {/* Mobile App-like Bottom Navigation Dock for Site Mode */}
      {isSiteMode && (
        <MobileBottomNav
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          onOpenSearch={() => setIsSearchOverlayOpen(true)}
          comparisonCount={comparisonIds.length}
          theme={activeTheme}
        />
      )}

      {/* Modals & Overlays */}
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
      />
      <InverterInfoModal theme={activeTheme} visible={isInverterModalOpen} onClose={() => setIsInverterModalOpen(false)} articles={catalog.articles} initialArticleId={selectedArticleId} />
      <ShareModal product={shareTargetProduct} theme={activeTheme} visible={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onCopyLink={copyLink} onWhatsAppShare={shareWhatsApp} onTelegramShare={shareTelegram} />
      <SaharaMatchModal
        isOpen={isSaharaMatchOpen}
        onClose={() => setIsSaharaMatchOpen(false)}
        products={catalog.products}
        theme={activeTheme}
        onSelectProduct={(product) => {
          setIsSaharaMatchOpen(false);
          selectProduct(product);
        }}
      />
      <SmartSearchOverlay
        visible={isSearchOverlayOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClose={() => setIsSearchOverlayOpen(false)}
        products={catalog.products}
        categories={catalog.categories}
        brands={catalog.brands}
        theme={activeTheme}
        isDarkMode={themeMode === 'dark'}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          setSelectedBrand('all');
          setIsSearchOverlayOpen(false);
          handleNavigate('catalog', catId);
        }}
        onSelectBrand={(brandId) => {
          setSelectedBrand(brandId);
          setSelectedCategory('all');
          setIsSearchOverlayOpen(false);
          handleNavigate('catalog', brandId);
        }}
        onSelectProduct={(product) => {
          setIsSearchOverlayOpen(false);
          selectProduct(product);
        }}
      />
      <Toast message={toast.message} visible={toast.visible} theme={activeTheme} />
    </div>
  );
};
