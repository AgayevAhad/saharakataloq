import React, { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { catalogApi, AdminPayload } from '../services/catalogApi';
import { Product, TechnologyArticle } from '../types/product';
import { DEFAULT_CATALOG, normalizeCatalog } from '../data/catalog';
import { phoneHref, whatsappHref } from '../utils/contact';
import { Lock, MessageCircle, Moon, Phone, Sparkles, Sun, Loader2 } from 'lucide-react';
import { SiteHeader } from '../components/site/SiteHeader';
import { MobileBottomNav } from '../components/site/MobileBottomNav';
import { UserAccountDrawer } from '../components/site/UserAccountDrawer';
import { CustomerChatWidget } from '../components/site/CustomerChatWidget';
import { HomePage } from '../pages/HomePage';
import { CatalogPage } from '../pages/CatalogPage';
import { BrandsPage } from '../pages/BrandsPage';
import { BrandDetailPage } from '../pages/BrandDetailPage';
import { ServicesPage } from '../pages/ServicesPage';
import { StoresPage } from '../pages/StoresPage';
import { SupportPage } from '../pages/SupportPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import type { CartItem } from '../pages/CartPage';
import { SaharaLogo } from '../components/SaharaLogo';
import { Toast } from '../components/Toast';
import { Drawer } from '../components/ui/Drawer';
import { AdminLogin } from '../components/AdminLogin';
import { Footer } from '../components/Footer';
import { AuthUser, LoginCredentials, RegisterCredentials } from '../types/auth';
import { customerSupportApi } from '../services/customerSupportApi';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { featureFlags } from '../utils/featureFlags';
import {
  useTheme,
  useToast,
  useFavorites,
  useCompare,
  useCatalog,
  useContact,
  useScrollReveal,
} from '../hooks';

// Lazy Loaded Pages & Components
const CatalogAdmin = lazy(() =>
  import('../components/CatalogAdmin').then((m) => ({ default: m.CatalogAdmin }))
);
const ComparePage = lazy(() =>
  import('../pages/ComparePage').then((m) => ({ default: m.ComparePage }))
);
const CartPage = lazy(() =>
  import('../pages/CartPage').then((m) => ({ default: m.CartPage }))
);
const FavoritesPage = lazy(() =>
  import('../pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage }))
);
const ProductDetailPage = lazy(() =>
  import('../pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage }))
);
const AccountPage = lazy(() =>
  import('../pages/AccountPage').then((m) => ({ default: m.AccountPage }))
);
const AboutPage = lazy(() =>
  import('../pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const CareersPage = lazy(() =>
  import('../pages/CareersPage').then((m) => ({ default: m.CareersPage }))
);
const TermsPage = lazy(() =>
  import('../pages/TermsPage').then((m) => ({ default: m.TermsPage }))
);
const PrivacyPage = lazy(() =>
  import('../pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
);
const CustomerCarePage = lazy(() =>
  import('../pages/CustomerCarePage').then((m) => ({ default: m.CustomerCarePage }))
);

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
const SaharaMatchModal = lazy(() =>
  import('../components/site/SaharaMatchModal').then((m) => ({ default: m.SaharaMatchModal }))
);

import { useNavigate, useLocation } from 'react-router-dom';
import { RouteName, resolveRouteFromPath, ROUTE_TO_PATH } from '../types/routes';

export type { RouteName };
export { resolveRouteFromPath, ROUTE_TO_PATH };

export interface SiteAppProps {
  initialRoute?: string;
  initialData?: any;
  isSsr?: boolean;
}

const CART_KEY = 'sahara_cart_items';

const getInitialCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const isAdminPath = () => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/AdministratorNT');
};

export const SiteApp: React.FC<SiteAppProps> = ({ initialRoute: _initialRoute, initialData, isSsr = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const resolved = useMemo(() => resolveRouteFromPath(currentPath), [currentPath]);
  const currentRoute: RouteName = resolved.route;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    resolved.category || null
  );
  const [selectedBrand, setSelectedBrand] = useState<string | null>(resolved.brand || null);
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
  const [cartItems, setCartItems] = useState<CartItem[]>(getInitialCart);

  // Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // Admin state
  const [adminChecked, setAdminChecked] = useState(false);
  const [adminData, setAdminData] = useState<AdminPayload | null>(null);

  // 1. Toast Hook
  const { toast, showToast } = useToast();

  // 2. Catalog Deep Link & Loading Hook
  const parseDeepLink = useCallback(
    (items: Product[]) => {
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
          navigate(`/product/${found.id}`);
        }
      }

      const page = params.get('page') || params.get('route');
      if (page) {
        navigate(ROUTE_TO_PATH[page as RouteName] || '/404');
      }
    },
    [navigate]
  );

  const { catalog, setCatalog } = useCatalog({
    initialCatalog: initialData?.catalog,
    isSsr,
    onLoaded: parseDeepLink,
  });

  // Sync route parameters (category, brand, productId) from URL location
  useEffect(() => {
    if (resolved.category) {
      setSelectedCategory(resolved.category);
    }
    if (resolved.brand) {
      setSelectedBrand(resolved.brand);
    }
    if (resolved.productId) {
      const found = catalog.products.find(
        (p) =>
          p.id === resolved.productId ||
          p.code.toLowerCase() === resolved.productId?.toLowerCase()
      );
      if (found) {
        setSelectedProduct(found);
      }
    }
  }, [resolved, catalog.products]);

  useScrollReveal([currentRoute, catalog.products.length]);

  // 3. Theme Hook
  const { themeMode, toggleTheme, activeTheme } = useTheme(catalog.settings?.primaryColor);

  // 4. Compare Hook
  const {
    comparisonIds,
    comparisonProducts,
    toggleCompare,
    removeFromCompare,
    clearCompare,
  } = useCompare(catalog.products, { showToast });

  // 5. Favorites Hook
  const {
    favoriteIds,
    toggleFavorite,
    clearFavorites,
  } = useFavorites({ showToast });

  // 6. Contact & Link Hook
  const productUrl = useCallback(
    (product: Product) =>
      `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(product.id)}`,
    []
  );

  const { openWhatsApp, openCall, copyLink } = useContact({
    settings: catalog.settings,
    brands: catalog.brands,
    getProductUrl: productUrl,
    showToast,
  });

  useEffect(() => {
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
  }, []);

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

  // Admin session check
  useEffect(() => {
    if (!isAdminPath()) return;
    let isMounted = true;
    const checkAdmin = async () => {
      try {
        const session = await catalogApi.getAdminSessionStatus();
        if (session?.authenticated) {
          const data = await catalogApi.getAdminData();
          if (isMounted) setAdminData(data);
        }
      } catch {}
      if (isMounted) setAdminChecked(true);
    };
    checkAdmin();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectProduct = useCallback(
    (product: Product) => {
      setSelectedProduct(product);
      catalogApi.track('product_view', product.id);
      navigate(`/product/${product.id}`);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [navigate]
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
      const norm = selectedBrand.trim().toLowerCase();
      const brand =
        catalog.brands.find(
          (item) =>
            item.id.toLowerCase() === norm ||
            (item.slug && item.slug.toLowerCase() === norm) ||
            item.name.toLowerCase() === norm
        ) ||
        catalog.brandRail?.items.find(
          (it) =>
            (it.brandSlug && it.brandSlug.toLowerCase() === norm) ||
            (it.brandId && it.brandId.toLowerCase() === norm) ||
            (it.brandName && it.brandName.toLowerCase() === norm)
        );
      return [
        { label: 'Ana Səhifə', href: '/' },
        { label: 'Brendlər', href: '/brands' },
        { label: (brand as any)?.name || (brand as any)?.brandName || selectedBrand, href: `/brand/${selectedBrand}` },
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
        navigate('/404');
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      let validRoute = route as RouteName;
      if (route === 'profile' || route === 'login' || route === 'register' || route === 'auth') {
        validRoute = 'account';
      }

      let targetPath = ROUTE_TO_PATH[validRoute] ?? '/404';

      if (validRoute === 'catalog' && param) {
        const isBrand = catalog.brands.some(
          (b) => b.id === param || b.name.toLowerCase() === param.toLowerCase()
        );
        if (isBrand) {
          setSelectedBrand(param);
          setSelectedCategory('all');
          targetPath = `/brand/${param}`;
        } else {
          setSelectedCategory(param);
          setSelectedBrand('all');
          targetPath = `/category/${param}`;
        }
      } else if (validRoute === 'product' && param) {
        const found = catalog.products.find(
          (p) => p.id === param || p.code.toLowerCase() === param.toLowerCase()
        );
        if (found) setSelectedProduct(found);
        targetPath = `/product/${param}`;
      } else if (validRoute === 'brand' && param) {
        setSelectedBrand(param);
        targetPath = `/brand/${param}`;
      }

      navigate(targetPath);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [catalog.brands, catalog.products, navigate]
  );

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

  return (
    <div className="app-shell" style={{ backgroundColor: activeTheme.bg, color: activeTheme.text }}>
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
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        favoritesCount={favoriteIds.length}
        authUser={authUser}
        onOpenSaharaMatch={() => setIsSaharaMatchOpen(true)}
      />

      <main className="site-main-content">
        <div className="site-page-container">
          <Breadcrumbs items={breadcrumbsList} />

          <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
            {currentRoute === 'home' && (
              <HomePage
                brands={catalog.brands}
                categories={catalog.categories}
                products={catalog.products}
                settings={catalog.settings}
                articles={catalog.articles}
                brandRail={catalog.brandRail}
                theme={activeTheme}
                onNavigate={handleNavigate}
                onSelectProduct={selectProduct}
                onOpenSaharaMatch={() => setIsSaharaMatchOpen(true)}
                onAddToCart={addToCart}
                onToggleFavorite={toggleFavorite}
                favoriteIds={favoriteIds}
                comparisonIds={comparisonIds}
                onToggleCompare={toggleCompare}
                onOpenArticle={openArticle}
                onWhatsApp={openWhatsApp}
                onCall={openCall}
                onShare={openShare}
                onCopyLink={copyLink}
              />
            )}
            {currentRoute === 'catalog' && (
              <CatalogPage
                categories={catalog.categories}
                brands={catalog.brands}
                products={catalog.products}
                settings={catalog.settings}
                theme={activeTheme}
                themeMode={themeMode}
                initialCategory={selectedCategory}
                initialBrand={selectedBrand}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onNavigate={handleNavigate}
                onSelectProduct={selectProduct}
                onWhatsApp={openWhatsApp}
                onCall={openCall}
                onShare={openShare}
                onCopyLink={copyLink}
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
                const normSelected = (selectedBrand || '').trim().toLowerCase();
                let brand = catalog.brands.find(
                  (item) =>
                    item.id.toLowerCase() === normSelected ||
                    (item.slug && item.slug.toLowerCase() === normSelected) ||
                    item.name.toLowerCase() === normSelected
                );
                if (!brand && catalog.brandRail?.items) {
                  const railItem = catalog.brandRail.items.find(
                    (it) =>
                      (it.brandSlug && it.brandSlug.toLowerCase() === normSelected) ||
                      (it.brandId && it.brandId.toLowerCase() === normSelected) ||
                      (it.brandName && it.brandName.toLowerCase() === normSelected)
                  );
                  if (railItem) {
                    brand = {
                      id: railItem.brandSlug || railItem.brandId,
                      name: railItem.brandName || railItem.brandSlug.toUpperCase(),
                      slug: railItem.brandSlug || railItem.brandId,
                      logo: railItem.brandLogo,
                      originCountry: railItem.originCountry || '',
                      manufacturingCountries: [],
                      description: '',
                      active: true,
                      comingSoon: false,
                    };
                  }
                }
                return brand ? (
                  <BrandDetailPage
                    brand={brand}
                    products={catalog.products}
                    categories={catalog.categories}
                    theme={activeTheme}
                    onNavigate={handleNavigate}
                    onSelectProduct={selectProduct}
                    onAddToCart={addToCart}
                    onToggleFavorite={toggleFavorite}
                    favoriteIds={favoriteIds}
                    comparisonIds={comparisonIds}
                    onToggleCompare={toggleCompare}
                    onWhatsApp={openWhatsApp}
                    onCall={openCall}
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
          </Suspense>
        </div>
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
          handleNavigate('catalog', catId);
        }}
      />

      {/* Mobile App-like Bottom Navigation Dock for Site Mode */}
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

      <Suspense fallback={null}>
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

      <CustomerChatWidget user={authUser} onOpenAccount={() => handleNavigate('account')} />
      
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        theme={activeTheme}
      />
    </div>
  );
};
