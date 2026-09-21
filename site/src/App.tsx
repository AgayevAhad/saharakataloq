import React, { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { catalogApi, AdminPayload } from './services/catalogApi';
import { CatalogData, Product, TechnologyArticle } from './types/product';
import { lightTheme, darkTheme, ThemeMode } from './types/theme';
import { DEFAULT_CATALOG, normalizeCatalog } from './data/catalog';
import { filterCatalogProducts } from './utils/filter';
import { phoneHref, whatsappHref } from './utils/contact';
import { ArrowLeft, Lock, MessageCircle, Moon, Phone, Sparkles, Sun, Loader2 } from 'lucide-react';
import { Header } from './components/Header';
import { SiteHeader } from './components/site/SiteHeader';
import { SaharaMatchModal } from './components/site/SaharaMatchModal';
import { MobileBottomNav } from './components/site/MobileBottomNav';
import { UserAccountDrawer } from './components/site/UserAccountDrawer';
import { CustomerChatWidget } from './components/site/CustomerChatWidget';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { BrandsPage } from './pages/BrandsPage';
import { BrandDetailPage } from './pages/BrandDetailPage';
import { ServicesPage } from './pages/ServicesPage';
import { StoresPage } from './pages/StoresPage';
import { ComparePage } from './pages/ComparePage';
import { SupportPage } from './pages/SupportPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CartPage, CartItem } from './pages/CartPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { SmartSearchOverlay } from './components/SmartSearchOverlay';
import { SaharaLogo } from './components/SaharaLogo';
import { BrandShowcase } from './components/BrandShowcase';
import { BannerHero } from './components/BannerHero';
import { ProductCard } from './components/ProductCard';
import { BrandCategoryFilter } from './components/BrandCategoryFilter';
import { FloatingActions } from './components/FloatingActions';
import { ProductDetailModal } from './components/ProductDetailModal';
import { InverterInfoModal } from './components/InverterInfoModal';
import { ShareModal } from './components/ShareModal';
import { Toast } from './components/Toast';
import { Drawer } from './components/ui/Drawer';
import { AdminLogin } from './components/AdminLogin';
import { Footer } from './components/Footer';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AccountPage } from './pages/AccountPage';
import { AboutPage } from './pages/AboutPage';
import { CareersPage } from './pages/CareersPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { CustomerCarePage } from './pages/CustomerCarePage';
import { AuthUser, LoginCredentials, RegisterCredentials } from './types/auth';
import { customerSupportApi } from './services/customerSupportApi';

const CatalogAdmin = lazy(() =>
  import('./components/CatalogAdmin').then((m) => ({ default: m.CatalogAdmin }))
);
import {
  BannerHeroSkeleton,
  ProductGridSkeleton,
  SiteHomePageSkeleton,
} from './components/Skeletons';
import { Breadcrumbs } from './components/Breadcrumbs';
import { featureFlags } from './utils/featureFlags';
import { useScrollReveal } from './hooks/useScrollReveal';

const THEME_KEY = 'sahara_theme_mode';
const COMPARE_KEY = 'sahara_compare_items';
const CART_KEY = 'sahara_cart_items';
const FAVORITES_KEY = 'sahara_favorite_items';

type RouteName =
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

export interface AppProps {
  initialRoute?: string;
  initialData?: any;
  isSsr?: boolean;
}

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

const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'light';
};

const getInitialCompare = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(COMPARE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const getInitialCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const getInitialFavorites = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
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
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_APP_MODE === 'catalog') return 'catalog';
    if (import.meta.env.VITE_APP_MODE === 'site') return 'site';
  }
  return 'site';
};

const isAdminPath = () => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/AdministratorNT');
};

export const App: React.FC<AppProps> = ({ initialRoute, initialData, isSsr = false }) => {
  const initialResolved = resolveRouteFromPath(
    initialRoute || (typeof window !== 'undefined' ? window.location.pathname : '/')
  );

  const [catalog, setCatalog] = useState<CatalogData>(() =>
    initialData?.catalog ? normalizeCatalog(initialData.catalog) : DEFAULT_CATALOG
  );
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(() =>
    initialData?.catalog ? false : !isSsr
  );
  const [currentRoute, setCurrentRoute] = useState<RouteName>(initialResolved.route);
  useScrollReveal([currentRoute, catalog.products.length]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialResolved.category || null
  );
  const [selectedBrand, setSelectedBrand] = useState<string | null>(initialResolved.brand || null);
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
  const [comparisonIds, setComparisonIds] = useState<string[]>(getInitialCompare);
  const [cartItems, setCartItems] = useState<CartItem[]>(getInitialCart);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(getInitialFavorites);
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  const [toast, setToast] = useState<{
    message: string;
    visible: boolean;
    type: 'success' | 'warning';
  }>({
    message: '',
    visible: false,
    type: 'success',
  });

  // Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // Admin state
  const [adminChecked, setAdminChecked] = useState(false);
  const [adminData, setAdminData] = useState<AdminPayload | null>(null);

  const _theme = themeMode === 'dark' ? darkTheme : lightTheme;
  const appMode = getAppMode();
  const isSiteMode = appMode === 'site';

  const showToast = useCallback((message: string, type: 'success' | 'warning' = 'success') => {
    setToast({ message, visible: true, type });
    window.setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 2600);
  }, []);

  useEffect(() => {
    if (!isSiteMode) return;
    // Legacy browser-only accounts stored plaintext passwords and cannot prove identity.
    try {
      localStorage.removeItem('sahara_registered_users');
      localStorage.removeItem('sahara_auth_user');
    } catch {}
    let active = true;
    customerSupportApi
      .session()
      .then((user) => {
        if (active) setAuthUser(user);
      })
      .catch(() => {
        if (active) setAuthUser(null);
      });
    return () => {
      active = false;
    };
  }, [isSiteMode]);

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        const user = await customerSupportApi.login(credentials);
        setAuthUser(user);
        showToast('Hesabınıza uğurla daxil oldunuz.');
        return true;
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Giriş alınmadı', 'warning');
        return false;
      }
    },
    [showToast]
  );

  const handleRegister = useCallback(
    async (credentials: RegisterCredentials) => {
      try {
        const user = await customerSupportApi.register(credentials);
        setAuthUser(user);
        showToast(`Xoş gəlmisiniz, ${user.fullName}! Qeydiyyat tamamlandı.`);
        return true;
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Qeydiyyat alınmadı', 'warning');
        return false;
      }
    },
    [showToast]
  );

  const handleLogout = useCallback(async () => {
    try {
      await customerSupportApi.logout();
      setAuthUser(null);
      showToast('Hesabdan çıxış edildi.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Çıxış alınmadı', 'warning');
    }
  }, [showToast]);

  const handleUpdateProfile = useCallback(
    async (updated: Partial<AuthUser>) => {
      if (!authUser) return;
      const next = { ...authUser, ...updated };
      if ('fullName' in updated || 'email' in updated || 'birthDate' in updated) {
        try {
          const saved = await customerSupportApi.updateProfile(next);
          setAuthUser({ ...next, ...saved });
          showToast('Profil məlumatları yeniləndi.');
          return true;
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Profil yenilənmədi', 'warning');
          return false;
        }
      } else {
        setAuthUser(next);
        return true;
      }
    },
    [authUser, showToast]
  );

  const handleChangeCustomerPassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        await customerSupportApi.changePassword(currentPassword, newPassword);
        showToast('Şifrəniz yeniləndi.');
        return true;
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Şifrə yenilənmədi', 'warning');
        return false;
      }
    },
    [showToast]
  );

  const parseDeepLink = useCallback(
    (items: Product[]) => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('product');
      if (id) {
        const found = items.find(
          (item) =>
            item.id === id || item.code.toLocaleLowerCase('az') === id.toLocaleLowerCase('az')
        );
        if (found) {
          setSelectedProduct(found);
          if (isSiteMode) setCurrentRoute('product');
        }
      }

      const pathParsed = resolveRouteFromPath(window.location.pathname);
      if (pathParsed.productId) {
        const found = items.find(
          (item) =>
            item.id === pathParsed.productId ||
            item.code.toLocaleLowerCase('az') === pathParsed.productId?.toLocaleLowerCase('az')
        );
        if (found) {
          setSelectedProduct(found);
          if (isSiteMode) setCurrentRoute('product');
        }
      }

      const page = params.get('page') || params.get('route');
      if (page) {
        const allowedRoutes: Record<string, boolean> = {
          home: true,
          catalog: true,
          brands: true,
          services: true,
          stores: true,
          support: true,
          delivery: true,
          warranty: true,
          returns: true,
          faq: true,
          favorites: true,
          cart: true,
          compare: featureFlags.isEnabled('enableCompare'),
          guides: featureFlags.isEnabled('enableGuides'),
          brandDetail: featureFlags.isEnabled('enableBrandDetail'),
          checkout: featureFlags.isEnabled('enableCheckout'),
          onlinePayment: featureFlags.isEnabled('enableOnlinePayment'),
          saharaMatch: featureFlags.isEnabled('enableSaharaMatch'),
          product: true,
        };
        if (allowedRoutes[page]) {
          setCurrentRoute(page as RouteName);
        } else {
          setCurrentRoute('404');
        }
      }
    },
    [isSiteMode]
  );

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
            const session = await catalogApi.getAdminSessionStatus();
            if (session?.authenticated) {
              const data = await catalogApi.getAdminData();
              if (isMounted) setAdminData(data);
            }
          } catch {}
          if (isMounted) setAdminChecked(true);
        }

        const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
        const elapsed = Date.now() - startTime;
        const splashDismissDelay = isTestEnv ? 0 : Math.max(300 - elapsed, 100);
        const _shimmerHoldTime = isTestEnv ? 0 : 800;

        setTimeout(() => {
          if (typeof document !== 'undefined') {
            if ((window as any).__hold_splash_for_test) return;
            const splash = document.getElementById('app-splash-screen');
            if (splash) {
              splash.classList.add('splash-fade-out');
              setTimeout(
                () => {
                  splash.remove();
                },
                isTestEnv ? 0 : 500
              );
            }
          }
          if (isMounted) {
            setIsLoadingCatalog(false);
          }
        }, splashDismissDelay);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [parseDeepLink]);

  const selectProduct = useCallback(
    (product: Product) => {
      setSelectedProduct(product);
      catalogApi.track('product_view', product.id);
      if (isSiteMode) {
        setCurrentRoute('product');
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', `/product/${product.id}`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        const url = new URL(window.location.href);
        url.searchParams.set('product', product.id);
        window.history.replaceState({}, '', url.toString());
      }
    },
    [isSiteMode]
  );

  const closeProduct = useCallback(() => {
    setSelectedProduct(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('product');
    window.history.replaceState({}, '', url.toString());
  }, []);

  const productUrl = (product: Product) =>
    `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(product.id)}`;
  const copyLink = useCallback(
    async (target?: Product | string) => {
      const value =
        typeof target === 'string' ? target : target ? productUrl(target) : window.location.href;
      try {
        await navigator.clipboard.writeText(value);
        showToast('Link kopyalandı!');
      } catch {
        showToast('Linki kopyalamaq mümkün olmadı.');
      }
    },
    [showToast]
  );

  const openWhatsApp = useCallback(
    (product?: Product | null) => {
      if (product) {
        const brand = catalog.brands.find((item) => item.id === product.brandId)?.name || '';
        const text = `Salam, Sahara Electronics! Bu məhsul haqqında məlumat almaq istəyirəm:\n\n📌 Model: ${product.code}\n🏷 Məhsul: ${product.title}\n🏢 Brend: ${brand}\n🗂 Kateqoriya: ${product.categoryName}\n\n🔗 ${productUrl(product)}`;
        const href = whatsappHref(catalog.settings.whatsappNumber, text);
        if (!href) return showToast('WhatsApp nömrəsi admin paneldə hələ əlavə edilməyib.');
        catalogApi.track('contact_whatsapp', product.id);
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        const href = whatsappHref(
          catalog.settings.whatsappNumber,
          'Salam, Sahara Electronics! Saytınızdan yazıram, məsləhət almaq istərdim.'
        );
        if (!href) return showToast('WhatsApp nömrəsi admin paneldə hələ əlavə edilməyib.');
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    },
    [catalog.brands, catalog.settings.whatsappNumber, showToast]
  );

  const openCall = useCallback(
    (productOrPhone?: Product | string) => {
      const phone =
        typeof productOrPhone === 'string'
          ? productOrPhone
          : catalog.settings.phoneNumber || catalog.settings.phoneNumbers?.[0];
      const href = phoneHref(phone);
      if (!href) return showToast('Zəng nömrəsi admin paneldə hələ əlavə edilməyib.');
      if (typeof productOrPhone !== 'string' && productOrPhone) {
        catalogApi.track('contact_call', productOrPhone.id);
      }
      window.open(href, '_self');
    },
    [catalog.settings.phoneNumber, catalog.settings.phoneNumbers, showToast]
  );

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

  // Compare functions
  const toggleCompare = useCallback(
    (product: Product) => {
      setComparisonIds((prev) => {
        let next: string[];
        if (prev.includes(product.id)) {
          next = prev.filter((id) => id !== product.id);
          showToast(`${product.code} müqayisədən çıxarıldı.`);
        } else {
          if (prev.length >= 4) {
            showToast('Maksimum 4 məhsul müqayisə edilə bilər.', 'warning');
            return prev;
          }
          next = [...prev, product.id];
          showToast(`${product.code} müqayisəyə əlavə edildi.`);
        }
        localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [showToast]
  );

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
          localStorage.setItem(CART_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      showToast(`${product.title} səbətə əlavə edildi!`);
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
        localStorage.setItem(CART_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const removeFromCart = useCallback(
    (productId: string) => {
      setCartItems((prev) => {
        const next = prev.filter((item) => item.product.id !== productId);
        try {
          localStorage.setItem(CART_KEY, JSON.stringify(next));
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
      localStorage.removeItem(CART_KEY);
    } catch {}
    showToast('Səbət təmizləndi.');
  }, [showToast]);

  // Favorites Handlers
  const toggleFavorite = useCallback(
    (product: Product) => {
      setFavoriteIds((prev) => {
        const exists = prev.includes(product.id);
        const next = exists ? prev.filter((id) => id !== product.id) : [...prev, product.id];
        try {
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
        } catch {}
        showToast(exists ? 'Seçilmişlərdən çıxarıldı' : 'Seçilmişlərə əlavə edildi!');
        return next;
      });
    },
    [showToast]
  );

  const clearFavorites = useCallback(() => {
    setFavoriteIds([]);
    try {
      localStorage.removeItem(FAVORITES_KEY);
    } catch {}
    showToast('Bütün seçilmişlər təmizləndi.');
  }, [showToast]);

  const addAllFavoritesToCart = useCallback(
    (products: Product[]) => {
      products.forEach((p) => {
        setCartItems((prev) => {
          const existingIdx = prev.findIndex((item) => item.product.id === p.id);
          let next: CartItem[];
          if (existingIdx >= 0) {
            next = prev.map((item, idx) =>
              idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
            );
          } else {
            next = [...prev, { product: p, quantity: 1 }];
          }
          try {
            localStorage.setItem(CART_KEY, JSON.stringify(next));
          } catch {}
          return next;
        });
      });
      showToast(`${products.length} məhsul səbətə əlavə edildi!`);
    },
    [showToast]
  );

  const handleWhatsAppCheckout = useCallback(
    (items: CartItem[], total: number, promo?: string) => {
      let message = `🛒 *Sahara Electronics — Yeni Sifariş*\n\n`;
      items.forEach((item, idx) => {
        const p = item.product;
        const priceStr = p.price
          ? `${p.price * item.quantity} AZN (${p.price} AZN x ${item.quantity})`
          : 'Qiymət sorğusu';
        message += `${idx + 1}. *${p.title}* (${p.code})\n   Say: ${item.quantity} ədəd | Məbləğ: ${priceStr}\n\n`;
      });
      if (promo) {
        message += `🎟 *Tətbiq olunan promo kod:* ${promo}\n`;
      }
      message += `💰 *Ümumi yekun məbləğ:* ${total.toFixed(2)} AZN\n\n`;
      message += `📍 Çatdırılma və rəsmiləşdirmə üçün əlaqə saxlamağınızı xahiş edirəm.`;

      const href = whatsappHref(catalog.settings.whatsappNumber, message);
      if (!href) return showToast('WhatsApp nömrəsi qeyd olunmayıb.');
      window.open(href, '_blank', 'noopener,noreferrer');
    },
    [catalog.settings.whatsappNumber, showToast]
  );

  const breadcrumbsList = useMemo(() => {
    if (currentRoute === 'home') {
      return [{ label: 'Ana Səhifə', href: '/' }];
    }
    if (currentRoute === 'catalog') {
      if (selectedCategory && selectedCategory !== 'all') {
        const cat = catalog.categories.find(
          (c) => c.id === selectedCategory || c.slug === selectedCategory
        );
        if (cat) {
          return [
            { label: 'Ana Səhifə', href: '/' },
            { label: 'Kataloq', href: '/catalog' },
            { label: cat.name, href: `/category/${cat.id}` },
          ];
        }
      }
      if (selectedBrand && selectedBrand !== 'all') {
        const br = catalog.brands.find(
          (b) => b.id === selectedBrand || b.name.toLowerCase() === selectedBrand.toLowerCase()
        );
        if (br) {
          return [
            { label: 'Ana Səhifə', href: '/' },
            { label: 'Brendlər', href: '/brands' },
            { label: br.name, href: `/brand/${br.id || br.name}` },
          ];
        }
      }
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Kataloq', href: '/catalog' },
      ];
    }
    if (currentRoute === 'brands') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Brendlər', href: '/brands' },
      ];
    }
    if (currentRoute === 'brand' && selectedBrand) {
      const brand = catalog.brands.find(
        (item) => item.id === selectedBrand || item.slug === selectedBrand
      );
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Brendlər', href: '/brands' },
        { label: brand?.name || selectedBrand, href: `/brand/${selectedBrand}` },
      ];
    }
    if (currentRoute === 'stores') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Mağazalarımız', href: '/stores' },
      ];
    }
    if (currentRoute === 'services') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Servis və Zəmanət', href: '/services' },
      ];
    }
    if (currentRoute === 'support') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Müştəri Dəstəyi', href: '/support' },
      ];
    }
    if (currentRoute === 'cart') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Səbətim', href: '/cart' },
      ];
    }
    if (currentRoute === 'favorites') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Seçilmişlər', href: '/favorites' },
      ];
    }
    if (currentRoute === 'account') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: authUser ? 'Şəxsi Kabinet / Profil' : 'Giriş və Qeydiyyat', href: '/account' },
      ];
    }
    if (currentRoute === 'compare') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Müqayisə', href: '/compare' },
      ];
    }
    if (currentRoute === 'product' && selectedProduct) {
      const cat = catalog.categories.find((c) => c.id === selectedProduct.category);
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Kataloq', href: '/catalog' },
        ...(cat ? [{ label: cat.name, href: `/category/${cat.id}` }] : []),
        {
          label: selectedProduct.title || selectedProduct.code,
          href: `/product/${selectedProduct.id}`,
        },
      ];
    }
    if (currentRoute === 'about') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Haqqımızda', href: '/about' },
      ];
    }
    if (currentRoute === 'careers') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Karyera', href: '/careers' },
      ];
    }
    if (currentRoute === 'terms') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'İstifadə Şərtləri', href: '/terms' },
      ];
    }
    if (currentRoute === 'privacy') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Məxfilik Siyasəti', href: '/privacy' },
      ];
    }
    if (currentRoute === 'delivery') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Çatdırılma', href: '/catdirilma' },
      ];
    }
    if (currentRoute === 'warranty') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Zəmanət', href: '/zemanet' },
      ];
    }
    if (currentRoute === 'returns') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Qaytarma', href: '/qaytarma' },
      ];
    }
    if (currentRoute === 'faq') {
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Tez-tez verilən suallar', href: '/faq' },
      ];
    }
    return [
      { label: 'Ana Səhifə', href: '/' },
      { label: 'Səhifə tapılmadı', href: '/404' },
    ];
  }, [
    currentRoute,
    selectedCategory,
    selectedBrand,
    selectedProduct,
    catalog.categories,
    catalog.brands,
    authUser,
  ]);

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
        guides: featureFlags.isEnabled('enableGuides'),
        brandDetail: featureFlags.isEnabled('enableBrandDetail'),
        checkout: featureFlags.isEnabled('enableCheckout'),
        onlinePayment: featureFlags.isEnabled('enableOnlinePayment'),
        saharaMatch: featureFlags.isEnabled('enableSaharaMatch'),
        product: true,
      };

      if (!allowedRoutes[route]) {
        setCurrentRoute('404');
        if (typeof window !== 'undefined') {
          if (window.location.pathname !== '/404') {
            window.history.pushState({}, '', '/404');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      let validRoute = route as RouteName;
      if (route === 'profile' || route === 'login' || route === 'register' || route === 'auth') {
        validRoute = 'account';
      }
      setCurrentRoute(validRoute);

      let cleanUrl = '/';
      if (validRoute === 'home') cleanUrl = '/';
      else if (validRoute === 'catalog') {
        if (param) {
          const isBrand = catalog.brands.some(
            (b) => b.id === param || b.name.toLowerCase() === param.toLowerCase()
          );
          if (isBrand) {
            setSelectedBrand(param);
            setSelectedCategory('all');
            cleanUrl = `/brand/${param}`;
          } else {
            setSelectedCategory(param);
            setSelectedBrand('all');
            cleanUrl = `/category/${param}`;
          }
        } else {
          setSelectedCategory(null);
          setSelectedBrand(null);
          cleanUrl = '/catalog';
        }
      } else if (validRoute === 'product') {
        if (param) {
          const found = catalog.products.find(
            (p) => p.id === param || p.code.toLowerCase() === param.toLowerCase()
          );
          if (found) setSelectedProduct(found);
          cleanUrl = `/product/${param}`;
        }
      } else if (validRoute === 'brands') cleanUrl = '/brands';
      else if (validRoute === 'brand') {
        if (param) setSelectedBrand(param);
        cleanUrl = `/brand/${param || selectedBrand || ''}`;
      } else if (validRoute === 'services') cleanUrl = '/services';
      else if (validRoute === 'stores') cleanUrl = '/stores';
      else if (validRoute === 'support') cleanUrl = '/support';
      else if (validRoute === 'cart') cleanUrl = '/cart';
      else if (validRoute === 'favorites') cleanUrl = '/favorites';
      else if (validRoute === 'account') cleanUrl = '/account';
      else if (validRoute === 'compare') cleanUrl = '/compare';
      else if (validRoute === 'about') cleanUrl = '/about';
      else if (validRoute === 'careers') cleanUrl = '/careers';
      else if (validRoute === 'terms') cleanUrl = '/terms';
      else if (validRoute === 'privacy') cleanUrl = '/privacy';
      else if (validRoute === 'delivery') cleanUrl = '/catdirilma';
      else if (validRoute === 'warranty') cleanUrl = '/zemanet';
      else if (validRoute === 'returns') cleanUrl = '/qaytarma';
      else if (validRoute === 'faq') cleanUrl = '/faq';
      else if (validRoute === '404') cleanUrl = '/404';

      if (typeof window !== 'undefined') {
        if (window.location.pathname !== cleanUrl) {
          window.history.pushState({}, '', cleanUrl);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [catalog.brands, catalog.products, selectedBrand]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const parsed = resolveRouteFromPath(window.location.pathname);
      setCurrentRoute(parsed.route);
      if (parsed.productId) {
        const found = catalog.products.find(
          (p) =>
            p.id === parsed.productId || p.code.toLowerCase() === parsed.productId?.toLowerCase()
        );
        if (found) setSelectedProduct(found);
      }
      if (parsed.category) setSelectedCategory(parsed.category);
      if (parsed.brand) setSelectedBrand(parsed.brand);
      parseDeepLink(catalog.products);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [catalog.products, parseDeepLink]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const heading = document.querySelector('h1, [role="heading"]');
      if (heading && heading instanceof HTMLElement) {
        heading.setAttribute('tabindex', '-1');
        heading.style.outline = 'none';
        heading.style.border = 'none';
        heading.style.boxShadow = 'none';
        heading.focus({ preventScroll: true });
      }
    }
  }, [currentRoute, selectedCategory, selectedBrand]);

  const isCatalogActive =
    selectedBrand !== null || selectedCategory !== null || searchQuery.trim().length > 0;
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

  const activeBrandObj =
    selectedBrand && selectedBrand !== 'all'
      ? catalog.brands.find((b) => b.id === selectedBrand)
      : null;

  const toggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    localStorage.setItem(THEME_KEY, next);
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
    if (!adminChecked)
      return (
        <div
          className="app-loading"
          style={{ background: activeTheme.bg, color: activeTheme.text }}
        >
          Admin panel hazırlanır...
        </div>
      );
    if (!adminData)
      return (
        <AdminLogin
          theme={activeTheme}
          onLogin={async (password) => {
            await catalogApi.login(password);
            setAdminData(await catalogApi.getAdminData());
          }}
        />
      );
    return (
      <>
        <Suspense
          fallback={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: activeTheme.bg,
                color: activeTheme.text,
              }}
            >
              <Loader2 className="img-spin" size={36} color={activeTheme.primary} />
            </div>
          }
        >
          <CatalogAdmin
            initial={adminData}
            theme={activeTheme}
            showToast={showToast}
            onSave={async (data) => {
              await catalogApi.saveCatalog(data, adminData.csrfToken);
            }}
            onPublish={async (data) => {
              await catalogApi.saveCatalog(data, adminData.csrfToken);
              await catalogApi.publishCatalog(adminData.csrfToken);
              const updated = await catalogApi.getCatalog();
              setCatalog(normalizeCatalog(updated));
            }}
            onUpload={(file) => catalogApi.uploadMedia(file, adminData.csrfToken)}
            onLogout={async () => {
              await catalogApi.logout(adminData.csrfToken);
              setAdminData(null);
            }}
          />
        </Suspense>
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          theme={activeTheme}
        />
      </>
    );
  }

  // Public Maintenance Mode (Paused by Admin)
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
      <BannerHero
        theme={activeTheme}
        articles={catalog.articles}
        heroTitle={catalog.settings?.heroBannerTitle}
        heroSubtitle={catalog.settings?.heroBannerSubtitle}
        onOpenArticle={openArticle}
      />

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
    <div
      id="catalog-top-anchor"
      style={{
        backgroundColor: activeTheme.bg,
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'clip',
      }}
    >
      <a href="#main-content" className="skip-to-content">
        Əsas məzmuna keç
      </a>

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
          favoritesCount={favoriteIds.length}
          cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
          onOpenSaharaMatch={() => setIsSaharaMatchOpen(true)}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onOpenUserDrawer={() => handleNavigate('account')}
          authUser={authUser}
          mobileMenuOpenSignal={mobileMenuOpenSignal}
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
          onOpenDrawer={() => setIsDrawerOpen(true)}
          totalCount={catalog.products.length}
          filteredCount={filteredProducts.length}
        />
      )}

      <main
        id="main-content"
        tabIndex={-1}
        className="catalog-main"
        style={{ minHeight: 'calc(100vh - 400px)', paddingBottom: isSiteMode ? '80px' : '0' }}
      >
        {isLoadingCatalog && !isSiteMode ? (
          <>
            <BannerHeroSkeleton theme={activeTheme} />
            {isCatalogActive && (
              <section className="catalog-section" style={{ marginTop: '16px' }}>
                <ProductGridSkeleton theme={activeTheme} count={8} />
              </section>
            )}
          </>
        ) : isSiteMode ? (
          <div className="site-page-container">
            {isLoadingCatalog && currentRoute === 'home' ? (
              <SiteHomePageSkeleton theme={activeTheme} />
            ) : (
              <>
                {currentRoute !== 'home' && currentRoute !== 'catalog' && (
                  <div className="catalog-container" style={{ padding: '0 16px' }}>
                    <Breadcrumbs items={breadcrumbsList} />
                  </div>
                )}
                {currentRoute === 'home' && (
                  <HomePage
                    brands={catalog.brands}
                    categories={catalog.categories}
                    products={catalog.products}
                    articles={catalog.articles}
                    settings={catalog.settings}
                    brandRail={catalog.brandRail}
                    isLoadingRail={isLoadingCatalog}
                    theme={activeTheme}
                    onNavigate={handleNavigate}
                    onSelectProduct={selectProduct}
                    onOpenSaharaMatch={() => setIsSaharaMatchOpen(true)}
                    onOpenArticle={openArticle}
                    onWhatsApp={openWhatsApp}
                    onCall={openCall}
                    onShare={openShare}
                    onCopyLink={copyLink}
                    onAddToCart={addToCart}
                    onToggleFavorite={toggleFavorite}
                    favoriteIds={favoriteIds}
                    comparisonIds={comparisonIds}
                    onToggleCompare={toggleCompare}
                  />
                )}
                {currentRoute === 'catalog' && (
                  <CatalogPage
                    products={catalog.products}
                    categories={catalog.categories}
                    brands={catalog.brands}
                    settings={catalog.settings}
                    theme={activeTheme}
                    themeMode={themeMode}
                    initialCategory={selectedCategory}
                    initialBrand={selectedBrand}
                    searchQuery={searchQuery}
                    onSelectProduct={selectProduct}
                    onWhatsApp={openWhatsApp}
                    onCall={openCall}
                    onShare={openShare}
                    onCopyLink={copyLink}
                    onNavigate={handleNavigate}
                    onAddToCart={addToCart}
                    onToggleFavorite={toggleFavorite}
                    favoriteIds={favoriteIds}
                    comparisonIds={comparisonIds}
                    onToggleCompare={toggleCompare}
                    onClearCompare={clearCompare}
                  />
                )}
                {currentRoute === 'brands' && (
                  <BrandsPage
                    brands={catalog.brands}
                    products={catalog.products}
                    theme={activeTheme}
                    onNavigate={handleNavigate}
                  />
                )}
                {currentRoute === 'brand' &&
                  (() => {
                    const brand = catalog.brands.find(
                      (item) => item.id === selectedBrand || item.slug === selectedBrand
                    );
                    return brand ? (
                      <BrandDetailPage
                        brand={brand}
                        products={catalog.products}
                        categories={catalog.categories}
                        theme={activeTheme}
                        onNavigate={handleNavigate}
                      />
                    ) : (
                      <NotFoundPage
                        theme={activeTheme}
                        onNavigate={handleNavigate}
                        message="Brend tapılmadı."
                      />
                    );
                  })()}
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
                {currentRoute === 'compare' &&
                  (featureFlags.isEnabled('enableCompare') ? (
                    <ComparePage
                      comparisonProducts={comparisonProducts}
                      theme={activeTheme}
                      onRemoveFromCompare={removeFromCompare}
                      onClearCompare={clearCompare}
                      onSelectProduct={selectProduct}
                      onNavigate={handleNavigate}
                    />
                  ) : (
                    <NotFoundPage
                      theme={activeTheme}
                      onNavigate={handleNavigate}
                      message="Müqayisə funksiyası hazırda aktivləşdirilməyib."
                    />
                  ))}
                {currentRoute === 'support' && (
                  <SupportPage
                    settings={catalog.settings}
                    theme={activeTheme}
                    onWhatsApp={() => openWhatsApp(null)}
                    onCall={() => openCall()}
                  />
                )}
                {currentRoute === 'cart' && (
                  <CartPage
                    cartItems={cartItems}
                    allProducts={catalog.products}
                    settings={catalog.settings}
                    theme={activeTheme}
                    themeMode={themeMode}
                    onUpdateQuantity={updateCartQuantity}
                    onRemoveItem={removeFromCart}
                    onClearCart={clearCart}
                    onNavigate={handleNavigate}
                    onSelectProduct={selectProduct}
                    onWhatsAppCheckout={handleWhatsAppCheckout}
                    onCall={openCall}
                  />
                )}
                {currentRoute === 'product' && selectedProduct && (
                  <ProductDetailPage
                    product={selectedProduct}
                    allProducts={catalog.products}
                    categories={catalog.categories}
                    brands={catalog.brands}
                    settings={catalog.settings}
                    theme={activeTheme}
                    themeMode={themeMode}
                    onNavigate={handleNavigate}
                    onSelectProduct={selectProduct}
                    onWhatsApp={openWhatsApp}
                    onCall={openCall}
                    onShare={openShare}
                    onCopyLink={copyLink}
                    onAddToCart={addToCart}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={favoriteIds.includes(selectedProduct.id)}
                    onToggleCompare={toggleCompare}
                    isComparing={comparisonIds.includes(selectedProduct.id)}
                    cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                    currentUser={authUser}
                    onOpenAuth={() => handleNavigate('account')}
                  />
                )}
                {currentRoute === 'account' && (
                  <AccountPage
                    authUser={authUser}
                    theme={activeTheme}
                    themeMode={themeMode}
                    cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                    favoritesCount={favoriteIds.length}
                    onLogin={handleLogin}
                    onRegister={handleRegister}
                    onLogout={handleLogout}
                    onUpdateProfile={handleUpdateProfile}
                    onChangePassword={handleChangeCustomerPassword}
                    onNavigate={handleNavigate}
                    onWhatsAppSupport={() => openWhatsApp(null)}
                    onCallSupport={openCall}
                  />
                )}
                {currentRoute === 'favorites' && (
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
                    onAddAllToCart={addAllFavoritesToCart}
                    onSelectProduct={selectProduct}
                    onWhatsApp={openWhatsApp}
                    onCall={openCall}
                    onShare={openShare}
                    onCopyLink={copyLink}
                    onNavigate={handleNavigate}
                  />
                )}
                {currentRoute === 'about' && (
                  <AboutPage
                    settings={catalog.settings}
                    theme={activeTheme}
                    themeMode={themeMode}
                    onNavigate={handleNavigate}
                    onWhatsApp={() => openWhatsApp(null)}
                    onCall={openCall}
                  />
                )}
                {currentRoute === 'careers' && (
                  <CareersPage
                    settings={catalog.settings}
                    theme={activeTheme}
                    themeMode={themeMode}
                    onNavigate={handleNavigate}
                    onWhatsApp={() => openWhatsApp(null)}
                  />
                )}
                {currentRoute === 'terms' && (
                  <TermsPage
                    theme={activeTheme}
                    themeMode={themeMode}
                    onNavigate={handleNavigate}
                  />
                )}
                {currentRoute === 'privacy' && (
                  <PrivacyPage
                    theme={activeTheme}
                    themeMode={themeMode}
                    onNavigate={handleNavigate}
                  />
                )}
                {(currentRoute === 'delivery' ||
                  currentRoute === 'warranty' ||
                  currentRoute === 'returns' ||
                  currentRoute === 'faq') && (
                  <CustomerCarePage
                    kind={currentRoute}
                    settings={catalog.settings}
                    theme={activeTheme}
                    themeMode={themeMode}
                    onNavigate={handleNavigate}
                    onWhatsApp={() => openWhatsApp(null)}
                    onCall={() => openCall()}
                  />
                )}
                {currentRoute === '404' && (
                  <NotFoundPage theme={activeTheme} onNavigate={handleNavigate} />
                )}
              </>
            )}
          </div>
        ) : (
          <div className="catalog-loaded-wrap">{renderCatalogView()}</div>
        )}
      </main>

      {/* Corporate Desktop & Mobile Footer */}
      <Footer
        settings={catalog.settings}
        categories={catalog.categories}
        theme={activeTheme}
        onNavigate={handleNavigate}
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
          onOpenUserDrawer={() => handleNavigate('account')}
          onOpenMenu={() => setMobileMenuOpenSignal((value) => value + 1)}
          comparisonCount={comparisonIds.length}
          cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
          favoritesCount={favoriteIds.length}
          authUser={authUser}
          theme={activeTheme}
        />
      )}

      {/* Modals & Overlays (Only in legacy standalone catalog mode) */}
      <ProductDetailModal
        product={selectedProduct}
        brand={selectedBrandInfo}
        theme={activeTheme}
        visible={!isSiteMode && !!selectedProduct}
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
      {/* App Level User Account Drawer */}
      <UserAccountDrawer
        isOpen={isUserDrawerOpen}
        onClose={() => setIsUserDrawerOpen(false)}
        theme={activeTheme}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        onNavigate={handleNavigate}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        favoritesCount={favoriteIds.length}
        onWhatsAppSupport={openWhatsApp}
        authUser={authUser}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
      />

      {isSiteMode && (
        <CustomerChatWidget user={authUser} onOpenAccount={() => handleNavigate('account')} />
      )}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        theme={activeTheme}
      />
    </div>
  );
};
