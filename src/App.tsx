import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { catalogApi, AdminPayload } from './services/catalogApi';
import { CatalogData, Product, ProductCategory, TechnologyArticle } from './types/product';
import { lightTheme, darkTheme, ThemeMode } from './types/theme';
import { DEFAULT_CATALOG, normalizeCatalog } from './data/catalog';
import { filterCatalogProducts } from './utils/filter';
import { phoneHref, whatsappHref } from './utils/contact';
import { Header } from './components/Header';
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

  if (isAdminPath()) {
    if (!adminChecked) return <div className="app-loading" style={{ background: theme.bg, color: theme.text }}>Admin panel hazırlanır...</div>;
    if (!adminData) return <AdminLogin theme={theme} onLogin={async (password) => { await catalogApi.login(password); setAdminData(await catalogApi.getAdminData()); }} />;
    return <><CatalogAdmin initial={adminData} theme={theme} showToast={showToast} onSave={async (data) => { await catalogApi.saveCatalog(data, adminData.csrfToken); }} onPublish={async (data) => { await catalogApi.saveCatalog(data, adminData.csrfToken); await catalogApi.publishCatalog(adminData.csrfToken); const updated = await catalogApi.getCatalog(); setCatalog(normalizeCatalog(updated)); }} onUpload={(file) => catalogApi.uploadMedia(file, adminData.csrfToken)} onLogout={async () => { await catalogApi.logout(adminData.csrfToken); setAdminData(null); }} /><Toast message={toast.message} visible={toast.visible} theme={theme} /></>;
  }

  const selectedBrandInfo = selectedProduct ? catalog.brands.find((brand) => brand.id === selectedProduct.brandId) : undefined;
  return (
    <div id="catalog-top-anchor" style={{ backgroundColor: theme.bg, minHeight: '100vh' }}>
      <Header theme={theme} isDarkMode={themeMode === 'dark'} onToggleTheme={toggleTheme} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} selectedBrand={selectedBrand} onSelectBrand={setSelectedBrand} brands={catalog.brands} categories={catalog.categories} products={catalog.products} settings={catalog.settings} searchQuery={searchQuery} onSearchChange={setSearchQuery} onOpenInverterInfo={() => openArticle()} onOpenCatalogShare={() => openShare(null)} totalCount={catalog.products.length} filteredCount={filteredProducts.length} />
      <main className="catalog-main">
        <BrandShowcase brands={catalog.brands} products={catalog.products} theme={theme} onSelect={(brandId) => { setSelectedBrand(brandId); document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' }); }} />
        <BannerHero theme={theme} articles={catalog.articles} onOpenArticle={openArticle} />
        <section className="catalog-section">
          <div className="catalog-section-heading"><div><h1 style={{ color: theme.text }}>{selectedCategory === 'all' ? 'Bütün məhsullar' : catalog.categories.find((item) => item.id === selectedCategory)?.name}</h1><p style={{ color: theme.textMuted }}>Modellərə və texniki xüsusiyyət sahələrinə baxın</p></div></div>
          {!filteredProducts.length ? <div className="empty-catalog" style={{ color: theme.textMuted }}>Axtarışınıza uyğun məhsul tapılmadı.<button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedBrand('all'); }} style={{ background: theme.primary }}>Filtrləri sıfırla</button></div> : <div className="product-grid-container">{filteredProducts.map((product) => { const brand = catalog.brands.find((item) => item.id === product.brandId); return <ProductCard key={product.id} product={product} theme={theme} brandName={brand?.name} brandOrigin={brand?.originCountry ? `${brand.originCountry} brendi` : ''} onSelect={selectProduct} onShare={(item) => openShare(item)} onWhatsApp={openWhatsApp} onCall={openCall} onCopyLink={copyLink} />; })}</div>}
        </section>
      </main>
      
      {/* Corporate Desktop & Mobile Footer */}
      <Footer
        settings={catalog.settings}
        categories={catalog.categories}
        theme={theme}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          setSelectedBrand('all');
          document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Floating Translucent Action Buttons on Mobile */}
      <FloatingActions
        settings={catalog.settings}
        theme={theme}
        showToast={showToast}
        onTrack={(type) => catalogApi.track(type)}
      />

      <ProductDetailModal product={selectedProduct} brand={selectedBrandInfo} theme={theme} visible={!!selectedProduct} onClose={closeProduct} onShare={(item) => openShare(item)} onWhatsApp={openWhatsApp} onCall={openCall} onCopyLink={copyLink} />
      <InverterInfoModal theme={theme} visible={isInverterModalOpen} onClose={() => setIsInverterModalOpen(false)} articles={catalog.articles} initialArticleId={selectedArticleId} />
      <ShareModal product={shareTargetProduct} theme={theme} visible={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onCopyLink={copyLink} onWhatsAppShare={shareWhatsApp} onTelegramShare={shareTelegram} />
      <Toast message={toast.message} visible={toast.visible} theme={theme} />
    </div>
  );
};
