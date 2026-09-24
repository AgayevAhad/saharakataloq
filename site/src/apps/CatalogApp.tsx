import React, { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { catalogApi } from '../services/catalogApi';
import { Product, TechnologyArticle } from '../types/product';
import { filterCatalogProducts } from '../utils/filter';
import { phoneHref, whatsappHref } from '../utils/contact';
import { ArrowLeft, Lock, MessageCircle, Moon, Phone, Sparkles, Sun } from 'lucide-react';
import { Header } from '../components/Header';
import { SaharaLogo } from '../components/SaharaLogo';
import { BrandShowcase } from '../components/BrandShowcase';
import { BannerHero } from '../components/BannerHero';
import { ProductCard } from '../components/ProductCard';
import { BrandCategoryFilter } from '../components/BrandCategoryFilter';
import { FloatingActions } from '../components/FloatingActions';
import { Toast } from '../components/Toast';
import { Drawer } from '../components/ui/Drawer';
import { Footer } from '../components/Footer';
import { BannerHeroSkeleton, ProductGridSkeleton } from '../components/Skeletons';
import {
  useTheme,
  useToast,
  useCatalog,
  useContact,
} from '../hooks';

// Lazy Loaded Modals
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isInverterModalOpen, setIsInverterModalOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetProduct, setShareTargetProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Toast Hook
  const { toast, showToast } = useToast();

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

  const isCatalogActive =
    selectedBrand !== null || selectedCategory !== null || searchQuery.trim().length > 0;

  const filteredProducts = useMemo(() => {
    if (!isCatalogActive) return [];
    return filterCatalogProducts(
      catalog.products,
      selectedCategory || 'all',
      selectedBrand || 'all',
      searchQuery
    );
  }, [catalog.products, isCatalogActive, searchQuery, selectedBrand, selectedCategory]);

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
        theme={activeTheme}
        isDarkMode={themeMode === 'dark'}
        onToggleTheme={toggleTheme}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          setTimeout(() => {
            document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
        onSelectBrand={(brandId) => {
          setSelectedBrand(brandId);
          setTimeout(() => {
            document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
        onSearchChange={setSearchQuery}
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
            <BannerHeroSkeleton theme={activeTheme} />
            <ProductGridSkeleton theme={activeTheme} count={8} />
          </div>
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
            <BannerHero
              theme={activeTheme}
              articles={catalog.articles}
              heroTitle={catalog.settings?.heroBannerTitle}
              heroSubtitle={catalog.settings?.heroBannerSubtitle}
              onOpenArticle={openArticle}
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

                {!filteredProducts.length ? (
                  <div
                    className="empty-state"
                    style={{ background: activeTheme.bgCard, borderColor: activeTheme.border }}
                  >
                    <p style={{ color: activeTheme.text }}>Axtarışa uyğun məhsul tapılmadı.</p>
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
                          whatsappButtonText={catalog.settings?.whatsappButtonText}
                          callButtonText={catalog.settings?.callButtonText}
                        />
                      );
                    })}
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
