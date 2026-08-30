import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { catalogApi, AdminPayload } from './services/catalogApi';
import { CatalogData, Product, ProductCategory, TechnologyArticle } from './types/product';
import { lightTheme, darkTheme, ThemeMode } from './types/theme';
import { DEFAULT_CATALOG, normalizeCatalog } from './data/catalog';
import { filterCatalogProducts } from './utils/filter';
import { phoneHref, whatsappHref } from './utils/contact';
import { Lock, MessageCircle, Moon, Phone, Sparkles, Sun } from 'lucide-react';
import { Header } from './components/Header';
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

const THEME_KEY = 'sahara_theme_mode';
const getInitialThemeMode = (): ThemeMode => {
  const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const isAdminPath = () => window.location.pathname.startsWith('/AdministratorNT');

export const App: React.FC = () => {
  const [catalog, setCatalog] = useState<CatalogData>(DEFAULT_CATALOG);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isInverterModalOpen, setIsInverterModalOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetProduct, setShareTargetProduct] = useState<Product | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Admin state
  const [adminChecked, setAdminChecked] = useState(false);
  const [adminData, setAdminData] = useState<AdminPayload | null>(null);

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

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
    const init = async () => {
      try {
        const publicCatalog = await catalogApi.getCatalog();
        const normalized = normalizeCatalog(publicCatalog);
        setCatalog(normalized);
        parseDeepLink(normalized.products);
        catalogApi.track('catalog_view');
      } catch {
        const fallback = normalizeCatalog(DEFAULT_CATALOG);
        setCatalog(fallback);
        parseDeepLink(fallback.products);
      }
      if (isAdminPath()) {
        try {
          const data = await catalogApi.getAdminData();
          setAdminData(data);
        } catch {}
        setAdminChecked(true);
      }
    };
    init();
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

  const openWhatsApp = useCallback((product: Product) => {
    const brand = catalog.brands.find((item) => item.id === product.brandId)?.name || '';
    const text = `Salam, Sahara Electronics! Bu məhsul haqqında məlumat almaq istəyirəm:\n\n📌 Model: ${product.code}\n🏷 Məhsul: ${product.title}\n🏢 Brend: ${brand}\n🗂 Kateqoriya: ${product.categoryName}\n\n🔗 ${productUrl(product)}`;
    const href = whatsappHref(catalog.settings.whatsappNumber, text);
    if (!href) return showToast('WhatsApp nömrəsi admin paneldə hələ əlavə edilməyib.');
    catalogApi.track('contact_whatsapp', product.id);
    window.open(href, '_blank', 'noopener,noreferrer');
  }, [catalog.brands, catalog.settings.whatsappNumber, showToast]);

  const openCall = useCallback((product: Product) => {
    const phone = catalog.settings.phoneNumber || catalog.settings.phoneNumbers?.[0];
    const href = phoneHref(phone);
    if (!href) return showToast('Zəng nömrəsi admin paneldə hələ əlavə edilməyib.');
    catalogApi.track('contact_call', product.id);
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

  const openArticle = (article?: TechnologyArticle) => {
    setSelectedArticleId(article?.id || null);
    setIsInverterModalOpen(true);
  };

  const filteredProducts = useMemo(() => {
    return filterCatalogProducts(catalog.products, selectedCategory, selectedBrand, searchQuery);
  }, [catalog.products, searchQuery, selectedBrand, selectedCategory]);

  const toggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next); localStorage.setItem(THEME_KEY, next);
  };

  const customPrimaryColor = catalog.settings?.primaryColor || theme.primary;
  const activeTheme = useMemo(() => {
    const base = themeMode === 'dark' ? darkTheme : lightTheme;
    if (catalog.settings?.primaryColor) {
      return { ...base, primary: catalog.settings.primaryColor };
    }
    return base;
  }, [catalog.settings?.primaryColor, themeMode]);

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

  // Public Catalog Maintenance Mode (Paused by Admin)
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
  return (
    <div id="catalog-top-anchor" style={{ backgroundColor: activeTheme.bg, minHeight: '100vh' }}>
      <Header theme={activeTheme} isDarkMode={themeMode === 'dark'} onToggleTheme={toggleTheme} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} selectedBrand={selectedBrand} onSelectBrand={setSelectedBrand} brands={catalog.brands} categories={catalog.categories} products={catalog.products} settings={catalog.settings} searchQuery={searchQuery} onSearchChange={setSearchQuery} onOpenInverterInfo={() => openArticle()} onOpenCatalogShare={() => openShare(null)} totalCount={catalog.products.length} filteredCount={filteredProducts.length} />
      <main className="catalog-main">
        <BrandShowcase brands={catalog.brands} products={catalog.products} theme={activeTheme} onSelect={(brandId) => { setSelectedBrand(brandId); document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' }); }} />
        <BannerHero theme={activeTheme} articles={catalog.articles} heroTitle={catalog.settings?.heroBannerTitle} heroSubtitle={catalog.settings?.heroBannerSubtitle} onOpenArticle={openArticle} />
        <section className="catalog-section">
          <div className="catalog-section-heading">
            <div>
              <h1 style={{ color: activeTheme.text }}>
                {selectedCategory === 'all' ? (catalog.settings?.catalogHeading || 'Bütün məhsullar') : catalog.categories.find((item) => item.id === selectedCategory)?.name}
              </h1>
              <p style={{ color: activeTheme.textMuted }}>
                {catalog.settings?.catalogSubheading || 'Modellərə və texniki xüsusiyyət sahələrinə baxın'}
              </p>
            </div>
          </div>
          {!filteredProducts.length ? (
            <div className="empty-catalog" style={{ color: activeTheme.textMuted }}>
              Axtarışınıza uyğun məhsul tapılmadı.
              <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedBrand('all'); }} style={{ background: activeTheme.primary }}>
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
      </main>
      
      {/* Corporate Desktop & Mobile Footer */}
      <Footer
        settings={catalog.settings}
        categories={catalog.categories}
        theme={activeTheme}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          setSelectedBrand('all');
          document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Floating Translucent Action Buttons on Mobile */}
      <FloatingActions
        settings={catalog.settings}
        theme={activeTheme}
        showToast={showToast}
        onTrack={(type) => catalogApi.track(type)}
      />

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
      <Toast message={toast.message} visible={toast.visible} theme={activeTheme} />
    </div>
  );
};
