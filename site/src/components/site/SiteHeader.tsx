import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Moon,
  Sun,
  Heart,
  Sparkles,
  MapPin,
  ShoppingCart,
  User,
  Home,
  LayoutGrid,
  ArrowRight,
  ShieldCheck,
  Phone,
  Clock,
  Wrench,
  CheckCircle2,
  Percent,
  X,
  Loader2,
} from 'lucide-react';
import { Brand, CatalogCategory, Product, CatalogSettings } from '../../types/product';
import { AuthUser } from '../../types/auth';
import { ThemeColors, DESIGN_TOKENS } from '../../types/theme';

import { MegaMenu } from './MegaMenu';
import { MobileCategoryDrawer } from './MobileCategoryDrawer';
import { SmartSearchOverlay } from '../SmartSearchOverlay';
import { ShimmerImage } from '../ShimmerImage';
import { useMobileSearchHistory } from '../../hooks/useMobileSearchHistory';

const HEADER_BRAND_LOGOS = [
  { slug: 'ardo', name: 'ARDO', logo: '/media/brands/ardo-logo.png' },
  { slug: 'artel', name: 'ARTEL', logo: '/media/brands/artel-logo.svg' },
  { slug: 'lotus', name: 'LOTUS', logo: '/media/brands/lotus-logo.png' },
  { slug: 'bosch', name: 'Bosch', logo: '/media/brands/bosch-logo.svg' },
  { slug: 'samsung', name: 'Samsung', logo: '/media/brands/samsung-logo.svg' },
  { slug: 'lg', name: 'LG', logo: '/media/brands/lg-logo.svg' },
] as const;

const normalizeBrandKey = (brand: Brand) => (brand.slug || brand.id || brand.name).toLowerCase();

interface SiteHeaderProps {
  currentRoute: string;
  onNavigate: (route: string, param?: string) => void;
  categories: CatalogCategory[];
  brands: Brand[];
  products: Product[];
  settings?: CatalogSettings;
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSearchModal: () => void;
  comparisonCount: number;
  favoritesCount: number;
  cartCount?: number;
  onOpenSaharaMatch: () => void;
  onOpenDrawer?: () => void;
  onOpenUserDrawer?: () => void;
  authUser?: AuthUser | null;
  mobileMenuOpenSignal?: number;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  currentRoute,
  onNavigate,
  categories = [],
  brands = [],
  products = [],
  settings,
  theme,
  themeMode,
  onToggleTheme,
  searchQuery = '',
  onSearchChange,
  favoritesCount,
  cartCount = 0,
  onOpenDrawer,
  onOpenUserDrawer,
  authUser,
  mobileMenuOpenSignal = 0,
}) => {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const dismissSearch = useCallback(() => setIsSearchExpanded(false), []);
  const closeSearch = useMobileSearchHistory(isSearchExpanded, dismissSearch);
  const [hoveredNavTab, setHoveredNavTab] = useState<string | null>(null);
  const hoverNavTimeoutRef = useRef<any>(null);
  const megaMenuBtnRef = useRef<HTMLButtonElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);
  const secondaryNavRef = useRef<HTMLDivElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const [searchBoxBounds, setSearchBoxBounds] = useState<{ left: number; width: number } | null>(
    null
  );
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mobileMenuOpenSignal > 0) setIsMobileDrawerOpen(true);
  }, [mobileMenuOpenSignal]);

  // Dynamically measure search input pill bounds relative to catalog container for exact 1:1 alignment
  useEffect(() => {
    if (!isSearchExpanded) return;
    const updateBounds = () => {
      if (searchWrapRef.current) {
        const parent = searchWrapRef.current.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const selfRect = searchWrapRef.current.getBoundingClientRect();
          const left = Math.max(0, selfRect.left - parentRect.left);
          const availableWidth = Math.max(selfRect.width, parentRect.width - left);
          setSearchBoxBounds({
            left,
            width: availableWidth,
          });
        }
      }
    };
    updateBounds();
    const timer = setTimeout(updateBounds, 30);
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => updateBounds()) : null;
    if (searchWrapRef.current && ro) {
      ro.observe(searchWrapRef.current);
    }
    window.addEventListener('resize', updateBounds, { passive: true });
    return () => {
      clearTimeout(timer);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateBounds);
    };
  }, [isSearchExpanded, isCompact]);

  // ⌘K / Ctrl+K and Escape keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchExpanded(true);
        setTimeout(() => desktopSearchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isSearchExpanded) {
        e.preventDefault();
        closeSearch();
        desktopSearchInputRef.current?.blur();
        mobileSearchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchExpanded, closeSearch]);

  const handleNavMouseEnter = (tab: string) => {
    if (hoverNavTimeoutRef.current) clearTimeout(hoverNavTimeoutRef.current);
    setHoveredNavTab(tab);
    setIsMegaMenuOpen(false);
  };

  const handleNavMouseLeave = () => {
    if (hoverNavTimeoutRef.current) clearTimeout(hoverNavTimeoutRef.current);
    hoverNavTimeoutRef.current = setTimeout(() => {
      setHoveredNavTab(null);
      setIsMegaMenuOpen(false);
    }, 280);
  };

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
          setIsCompact((prev) => {
            if (!prev && scrollY > 64) return true;
            if (prev && scrollY < 16) return false;
            return prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hoverNavTimeoutRef.current) clearTimeout(hoverNavTimeoutRef.current);
    };
  }, []);

  return (
    <>
      {/* Main Sticky Header (1:1 siteUI.png) */}
      <header
        ref={headerRef}
        className={`site-header-sticky sticky-header ${isCompact ? 'is-compact' : ''} ${isMegaMenuOpen || hoveredNavTab ? 'has-nav-overlay' : ''}`}
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor:
            themeMode === 'dark'
              ? 'rgba(15, 23, 42, 0.88)'
              : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          border: 'none',
          borderBottom:
            isMegaMenuOpen || hoveredNavTab || isSearchExpanded || isCompact
              ? themeMode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : '1px solid rgba(0, 0, 0, 0.08)'
              : 'none',
          boxShadow:
            isMegaMenuOpen || hoveredNavTab || isSearchExpanded
              ? themeMode === 'dark'
                ? '0 28px 56px -10px rgba(0, 0, 0, 0.8)'
                : '0 24px 48px -10px rgba(0, 0, 0, 0.14)'
              : isCompact
                ? themeMode === 'dark'
                  ? '0 20px 48px -8px rgba(0, 0, 0, 0.7)'
                  : '0 16px 40px -8px rgba(0, 0, 0, 0.12)'
                : 'none',
          zIndex:
            isSearchExpanded || isMegaMenuOpen || hoveredNavTab
              ? DESIGN_TOKENS.zIndex.modal + 15
              : DESIGN_TOKENS.zIndex.sticky,
          transition: 'box-shadow 0.2s ease, background-color 0.2s ease',
        }}
      >
        <div className="catalog-container" style={{ padding: '0 clamp(24px, 4vw, 56px)' }}>
          {/* Desktop Layout (> 768px) */}
          <div
            className="site-header-desktop-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isCompact ? '10px 0' : '16px 0',
              gap: '20px',
            }}
          >
            {/* Logo: Smoothly enlarges, glides down & away from left edge with discovery tagline */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                minWidth: isSearchExpanded ? '280px' : isCompact ? '160px' : '200px',
                height: '56px',
                position: 'relative',
                zIndex: 10,
                transform: isSearchExpanded
                  ? 'translate(24px, 128px) scale(1.46)'
                  : 'translate(0px, 0px) scale(1)',
                transformOrigin: 'center center',
                transition:
                  'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <button
                type="button"
                onClick={() => onNavigate('home')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  flexShrink: 0,
                }}
                aria-label="Sahara Electronics Əsas Səhifə"
              >
                <ShimmerImage
                  src={
                    themeMode === 'dark' ? '/media/SaharaLogo-dark.png' : '/media/SaharaLogo.png'
                  }
                  alt="Sahara Electronics"
                  loading="eager"
                  objectFit="contain"
                  spinnerSize={16}
                  containerStyle={{
                    height: isSearchExpanded ? '96px' : isCompact ? '46px' : '56px',
                    width: isSearchExpanded ? '270px' : isCompact ? '160px' : '200px',
                    maxWidth: '100%',
                    transition: 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  fallback={<span className="sahara-logo-fallback">Sahara Electronics</span>}
                />
              </button>

              {/* Discovery Tagline under Logo when search is open */}
              {isSearchExpanded && (
                <div
                  style={{
                    marginTop: '10px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: themeMode === 'dark' ? '#94a3b8' : '#64748b',
                    textAlign: 'center',
                    letterSpacing: '0.01em',
                    whiteSpace: 'nowrap',
                    animation: 'smartSearchFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                >
                  <Sparkles size={15} color="#e31e24" aria-hidden="true" />
                  <span>Arzuladığınız texnologiyanı asanlıqla kəşf edin</span>
                </div>
              )}
            </div>

            {/* Center: Long, Sleek Smart Search Input with Attached Expanding Dropdown */}
            <div
              ref={searchWrapRef}
              style={{
                flex: 1,
                maxWidth: '920px',
                margin: '0 12px',
                position: 'relative',
                zIndex: isSearchExpanded ? DESIGN_TOKENS.zIndex.modal + 1 : 2,
              }}
              className="header-search-wrap"
            >
              <div
                data-testid="header-search-trigger"
                style={{
                  width: '100%',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0 18px',
                  borderRadius: '999px',
                  backgroundColor: themeMode === 'dark' ? '#121824' : '#f8fafc',
                  border: isSearchExpanded
                    ? '1px solid #e31e24'
                    : `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'}`,
                  boxShadow: isSearchExpanded ? '0 0 0 1px rgba(227, 30, 36, 0.15)' : 'none',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
                className={`header-search-input-box ${isSearchExpanded ? 'is-focused' : ''}`}
                onClick={() => {
                  setIsSearchExpanded(true);
                  desktopSearchInputRef.current?.focus();
                }}
              >
                <Search
                  size={17}
                  style={{
                    color:
                      (searchQuery || '').trim().length > 0
                        ? '#e31e24'
                        : theme?.textMuted || '#94a3b8',
                    transition: 'color 0.2s ease',
                    flexShrink: 0,
                  }}
                />

                <input
                  ref={desktopSearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setIsSearchExpanded(true)}
                  placeholder="Məhsul, marka və ya model axtarın..."
                  data-testid="header-search-input"
                  aria-label="Məhsul, marka və ya model axtarın"
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: theme.text,
                    fontSize: '13.5px',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    width: '100%',
                  }}
                />

                {/* Spinning red loader when typing or loading */}
                {searchQuery.trim().length > 0 && (
                  <Loader2
                    size={16}
                    className="img-spin"
                    style={{
                      color: '#e31e24',
                      animation: 'imgSpinAnim 0.8s linear infinite',
                      flexShrink: 0,
                    }}
                    aria-label="Axtarılır..."
                  />
                )}

                {/* Clear search query button */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSearchChange('');
                      desktopSearchInputRef.current?.focus();
                    }}
                    aria-label="Axtarışı təmizlə"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '2px',
                      color: theme.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                    }}
                  >
                    <X size={15} />
                  </button>
                )}

                {/* ⌘K Shortcut badge when empty */}
                {!searchQuery && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: themeMode === 'dark' ? '#1f2937' : '#e2e8f0',
                      color: theme.text,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    ⌘K
                  </span>
                )}
              </div>
            </div>

            {/* Right Action Icons & Utilities matching siteUI.png */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexShrink: 0,
                minWidth: '240px',
                justifyContent: 'flex-end',
              }}
            >
              {/* Location: 📍 Bakı */}
              <button
                type="button"
                onClick={() => (onOpenDrawer ? onOpenDrawer() : onNavigate('stores'))}
                data-testid="drawer-trigger"
                className="header-location-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 6px',
                  color: theme.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  transition: 'color 0.15s ease',
                }}
                aria-label="Şəhər seçimi: Bakı"
                title="Sərgi salonları və ünvanlar"
              >
                <MapPin size={16} style={{ color: theme.text }} />
                <span>Bakı</span>
              </button>

              {/* Wishlist 🤍 */}
              <button
                type="button"
                onClick={() => onNavigate('favorites')}
                style={{
                  position: 'relative',
                  background: 'transparent',
                  border: 'none',
                  padding: '6px',
                  color:
                    currentRoute === 'favorites' || favoritesCount > 0 ? '#ef4444' : theme.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s ease',
                }}
                aria-label="Seçilmiş Məhsullar"
                title="Seçilmiş Məhsullar"
                className="header-favorites-btn"
                data-favorite-target
              >
                <Heart
                  size={20}
                  color={
                    currentRoute === 'favorites' || favoritesCount > 0 ? '#ef4444' : theme?.text
                  }
                  fill="none"
                />
                {favoritesCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '0px',
                      right: '0px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '9.5px',
                      fontWeight: 800,
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {favoritesCount}
                  </span>
                )}
              </button>

              {/* Cart 🛒 */}
              <button
                type="button"
                onClick={() => onNavigate('cart')}
                style={{
                  position: 'relative',
                  background: 'transparent',
                  border: 'none',
                  padding: '6px',
                  color: currentRoute === 'cart' ? '#e31e24' : theme.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s ease',
                }}
                aria-label={cartCount > 0 ? `Səbət (${cartCount})` : 'Səbət'}
                data-cart-target
              >
                <ShoppingCart size={20} color={currentRoute === 'cart' ? '#e31e24' : theme.text} />
                {cartCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-4px',
                      backgroundColor: '#e31e24',
                      color: '#ffffff',
                      fontSize: '9.5px',
                      fontWeight: 800,
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Profile 👤 / Logged-in User Pill */}
              <button
                type="button"
                data-testid="header-user-btn"
                onClick={() => {
                  if (onOpenUserDrawer) onOpenUserDrawer();
                  else onNavigate('account');
                }}
                style={{
                  background: authUser
                    ? themeMode === 'dark'
                      ? 'rgba(220, 38, 38, 0.15)'
                      : 'rgba(220, 38, 38, 0.08)'
                    : 'transparent',
                  border: 'none',
                  borderRadius: authUser ? '999px' : '8px',
                  padding: authUser ? '4px 12px 4px 6px' : '6px',
                  color: currentRoute === 'account' ? '#e31e24' : theme.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  maxWidth: '180px',
                }}
                aria-label={
                  authUser ? `İstifadəçi: ${authUser.fullName}` : 'İstifadəçi Kabineti və Hesab'
                }
                title={authUser ? authUser.fullName : 'Giriş və Qeydiyyat'}
              >
                <div
                  style={{
                    width: authUser ? '26px' : 'auto',
                    height: authUser ? '26px' : 'auto',
                    borderRadius: authUser ? '50%' : '0',
                    backgroundColor: authUser ? '#dc2626' : 'transparent',
                    color: authUser
                      ? '#ffffff'
                      : currentRoute === 'account'
                        ? '#e31e24'
                        : theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {authUser ? (
                    authUser.fullName.charAt(0).toUpperCase()
                  ) : (
                    <User size={20} color={currentRoute === 'account' ? '#e31e24' : theme.text} />
                  )}
                </div>

                {authUser && (
                  <span
                    data-testid="header-user-name"
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: theme.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '110px',
                    }}
                  >
                    {authUser.fullName.split(' ')[0]}
                  </span>
                )}
              </button>

              {/* Theme Toggle ☀️ / 🌙 */}
              <button
                type="button"
                onClick={onToggleTheme}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px',
                  color: theme.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s ease',
                }}
                aria-label={themeMode === 'dark' ? 'İşıqlı rejimə keç' : 'Qaranlıq rejimə keç'}
              >
                {themeMode === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
              </button>
            </div>
          </div>

          {/* Desktop In-Panel Expanded Search Section: Exactly aligned 1:1 with search input above */}
          {isSearchExpanded && (
            <div
              className="desktop-header-search-expand-wrap hide-on-mobile"
              style={{
                width: '100%',
                maxHeight: 'calc(100vh - 180px)',
                overflowY: 'auto',
                padding: '2px 0 16px',
                position: 'relative',
                animation: 'smartSearchSlideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                style={{
                  marginLeft: searchBoxBounds ? `${searchBoxBounds.left}px` : 'auto',
                  marginRight: 'auto',
                  width: searchBoxBounds ? `${searchBoxBounds.width}px` : '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <SmartSearchOverlay
                  visible={true}
                  inline={true}
                  embeddedInHeader={true}
                  searchQuery={searchQuery}
                  onSearchChange={onSearchChange}
                  onClose={() => closeSearch()}
                  products={products}
                  categories={categories}
                  brands={brands}
                  theme={theme}
                  isDarkMode={themeMode === 'dark'}
                  onSelectCategory={(catId) => {
                    closeSearch(() =>
                      onNavigate('catalog', typeof catId === 'string' ? catId : (catId as any))
                    );
                  }}
                  onSelectBrand={(brandId) => {
                    closeSearch(() => onNavigate('catalog', brandId));
                  }}
                />
              </div>
            </div>
          )}

          {/* Mobile Layout (<= 768px) matching siteUI.png */}
          <div className="site-header-mobile-layout">
            {/* Row 1: Logo + 📍 Bakı + 🤍 Wishlist + 🛒 Cart + Theme Toggle */}
            <div
              className="site-header-mobile-top-row"
              style={{
                padding: '8px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <button
                type="button"
                onClick={() => onNavigate('home')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                  flexShrink: 0,
                }}
                aria-label="Sahara Electronics Əsas Səhifə"
              >
                <img
                  src={
                    themeMode === 'dark' ? '/media/SaharaLogo-dark.png' : '/media/SaharaLogo.png'
                  }
                  alt="Sahara Electronics"
                  style={{
                    height: '36px',
                    width: 'auto',
                    maxWidth: '180px',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Mobile Location Badge: 📍 Bakı */}
                <button
                  type="button"
                  onClick={() => (onOpenDrawer ? onOpenDrawer() : onNavigate('stores'))}
                  data-testid="drawer-trigger-mobile"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    color: theme.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                  aria-label="Sərgi salonları"
                >
                  <MapPin size={14} />
                  <span>Bakı</span>
                </button>

                {/* Mobile Favorites Button 🤍 */}
                <button
                  type="button"
                  onClick={() => onNavigate('favorites')}
                  style={{
                    position: 'relative',
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    color:
                      currentRoute === 'favorites' || favoritesCount > 0 ? '#ef4444' : theme.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Seçilmişlər"
                  title="Seçilmişlər"
                  className="header-favorites-btn mobile-favorites-btn"
                  data-favorite-target
                >
                  <Heart
                    size={18}
                    color={
                      currentRoute === 'favorites' || favoritesCount > 0 ? '#ef4444' : theme?.text
                    }
                    fill="none"
                  />
                </button>

                {/* Mobile Cart Button 🛒 */}
                <button
                  type="button"
                  onClick={() => onNavigate('cart')}
                  style={{
                    position: 'relative',
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    color: currentRoute === 'cart' ? '#e31e24' : theme.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Səbət"
                  data-cart-target
                >
                  <ShoppingCart
                    size={18}
                    color={currentRoute === 'cart' ? '#e31e24' : theme.text}
                  />
                  {cartCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-4px',
                        backgroundColor: '#e31e24',
                        color: '#ffffff',
                        fontSize: '8.5px',
                        fontWeight: 800,
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* Mobile Theme Toggle */}
                <button
                  type="button"
                  onClick={onToggleTheme}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    color: theme.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={themeMode === 'dark' ? 'İşıqlı rejim' : 'Qaranlıq rejim'}
                >
                  {themeMode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                </button>
              </div>
            </div>

            {/* Row 2: Search Input & Attached Expanding Dropdown (Mobile) */}
            <div
              className="site-header-mobile-search-row"
              style={{
                position: 'relative',
                paddingBottom: '10px',
                zIndex: isSearchExpanded ? DESIGN_TOKENS.zIndex.modal + 1 : 2,
              }}
            >
              <div
                data-testid="header-search-trigger-mobile"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  backgroundColor: themeMode === 'dark' ? '#121824' : '#f8fafc',
                  border: isSearchExpanded
                    ? '1px solid #e31e24'
                    : `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'}`,
                  boxShadow: isSearchExpanded ? '0 0 0 1px rgba(227, 30, 36, 0.15)' : 'none',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
                onClick={() => {
                  setIsSearchExpanded(true);
                  mobileSearchInputRef.current?.focus();
                }}
              >
                <Search
                  size={14}
                  style={{
                    color: searchQuery.trim().length > 0 ? '#e31e24' : theme.textMuted || '#94a3b8',
                    transition: 'color 0.2s ease',
                    flexShrink: 0,
                  }}
                />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setIsSearchExpanded(true)}
                  placeholder="Məhsul, marka və ya model axtarın..."
                  data-testid="header-search-input-mobile"
                  aria-label="Məhsul axtarın"
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: theme.text,
                    fontSize: '12.5px',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    width: '100%',
                  }}
                />
                {searchQuery.trim().length > 0 && (
                  <Loader2
                    size={14}
                    className="img-spin"
                    style={{
                      color: '#e31e24',
                      animation: 'imgSpinAnim 0.8s linear infinite',
                      flexShrink: 0,
                    }}
                  />
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSearchChange('');
                      mobileSearchInputRef.current?.focus();
                    }}
                    aria-label="Axtarışı təmizlə"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '2px',
                      color: theme.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
                {isSearchExpanded && (
                  <button
                    type="button"
                    className="mobile-search-dismiss"
                    onClick={(event) => {
                      event.stopPropagation();
                      closeSearch();
                    }}
                    aria-label="Axtarışı bağla"
                    title="Axtarışı bağla"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile In-Panel Expanded Search Section */}
            {isSearchExpanded && (
              <div
                className="mobile-header-search-expand-wrap"
                style={{
                  width: '100%',
                  maxHeight: 'min(64dvh, calc(100dvh - 240px))',
                  overflowY: 'auto',
                  padding: '6px 0 10px',
                  animation: 'smartSearchSlideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <SmartSearchOverlay
                  visible={true}
                  inline={true}
                  embeddedInHeader={true}
                  searchQuery={searchQuery}
                  onSearchChange={onSearchChange}
                  onClose={() => closeSearch()}
                  products={products}
                  categories={categories}
                  brands={brands}
                  theme={theme}
                  isDarkMode={themeMode === 'dark'}
                  onSelectCategory={(catId) => {
                    closeSearch(() =>
                      onNavigate('catalog', typeof catId === 'string' ? catId : (catId as any))
                    );
                  }}
                  onSelectBrand={(brandId) => {
                    closeSearch(() => onNavigate('catalog', brandId));
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Secondary Navigation Row (Desktop: = Kataloq + Site Page Links; No separating top line) */}
        <div
          ref={secondaryNavRef}
          className="header-secondary-nav hide-on-mobile"
          onMouseEnter={() => {
            if (hoverNavTimeoutRef.current) clearTimeout(hoverNavTimeoutRef.current);
          }}
          onMouseLeave={handleNavMouseLeave}
          style={{
            position: 'relative',
            borderTop: 'none',
            padding: '6px 0 10px',
          }}
        >
          <div
            className="catalog-container"
            style={{
              padding: '0 clamp(24px, 4vw, 56px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '28px',
            }}
          >
            {/* Left: Kataloq Trigger */}
            <button
              ref={megaMenuBtnRef}
              type="button"
              onClick={() => {
                setIsSearchExpanded(false);
                setHoveredNavTab(null);
                setIsMegaMenuOpen(false);
                onNavigate('catalog');
              }}
              onMouseEnter={() => {
                handleNavMouseEnter('catalog');
                setIsMegaMenuOpen(true);
              }}
              onMouseLeave={handleNavMouseLeave}
              className={`mega-menu-trigger-btn ${isMegaMenuOpen || hoveredNavTab === 'catalog' ? 'is-active' : ''}`}
              style={{
                background: 'transparent',
                color:
                  currentRoute === 'catalog' || hoveredNavTab === 'catalog'
                    ? '#e31e24'
                    : theme.text,
                border: 'none',
                padding: '4px 0',
                fontSize: '13.5px',
                fontWeight: currentRoute === 'catalog' || hoveredNavTab === 'catalog' ? 700 : 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                flexShrink: 0,
              }}
            >
              <LayoutGrid size={15} />
              <span>Kataloq</span>
            </button>

            {/* General Site Navigation Links */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '22px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                flex: 1,
              }}
              onMouseLeave={handleNavMouseLeave}
            >
              <button
                type="button"
                onClick={() => {
                  setIsMegaMenuOpen(false);
                  setHoveredNavTab(null);
                  onNavigate('home');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 0',
                  fontSize: '13.5px',
                  fontWeight: currentRoute === 'home' ? 700 : 500,
                  color: currentRoute === 'home' ? '#e31e24' : theme.text,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={() => handleNavMouseEnter('home')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = currentRoute === 'home' ? '#e31e24' : theme.text)
                }
              >
                <Home size={15} />
                <span>Ana Səhifə</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMegaMenuOpen(false);
                  setHoveredNavTab(null);
                  onNavigate('brands');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 0',
                  fontSize: '13.5px',
                  fontWeight: currentRoute === 'brands' || hoveredNavTab === 'brands' ? 700 : 500,
                  color:
                    currentRoute === 'brands' || hoveredNavTab === 'brands'
                      ? '#e31e24'
                      : theme.text,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={() => handleNavMouseEnter('brands')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = currentRoute === 'brands' ? '#e31e24' : theme.text)
                }
              >
                <Sparkles size={15} />
                <span>Brendlər</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMegaMenuOpen(false);
                  setHoveredNavTab(null);
                  onNavigate('stores');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 0',
                  fontSize: '13.5px',
                  fontWeight: currentRoute === 'stores' || hoveredNavTab === 'stores' ? 700 : 500,
                  color:
                    currentRoute === 'stores' || hoveredNavTab === 'stores'
                      ? '#e31e24'
                      : theme.text,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={() => handleNavMouseEnter('stores')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = currentRoute === 'stores' ? '#e31e24' : theme.text)
                }
              >
                <MapPin size={15} />
                <span>Mağazalarımız</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMegaMenuOpen(false);
                  setHoveredNavTab(null);
                  onNavigate('services');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 0',
                  fontSize: '13.5px',
                  fontWeight:
                    currentRoute === 'services' || hoveredNavTab === 'services' ? 700 : 500,
                  color:
                    currentRoute === 'services' || hoveredNavTab === 'services'
                      ? '#e31e24'
                      : theme.text,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={() => handleNavMouseEnter('services')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color =
                    currentRoute === 'services' ? '#e31e24' : theme.text)
                }
              >
                <ShieldCheck size={15} />
                <span>Servis və Zəmanət</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMegaMenuOpen(false);
                  setHoveredNavTab(null);
                  onNavigate('support');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 0',
                  fontSize: '13.5px',
                  fontWeight: currentRoute === 'support' || hoveredNavTab === 'support' ? 700 : 500,
                  color:
                    currentRoute === 'support' || hoveredNavTab === 'support'
                      ? '#e31e24'
                      : theme.text,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={() => handleNavMouseEnter('support')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color =
                    currentRoute === 'support' ? '#e31e24' : theme.text)
                }
              >
                <Phone size={15} />
                <span>Müştəri Dəstəyi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMegaMenuOpen(false);
                  setHoveredNavTab(null);
                  onNavigate('catalog', 'discounts');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 0',
                  fontSize: '13.5px',
                  fontWeight: hoveredNavTab === 'discounts' ? 700 : 500,
                  color: hoveredNavTab === 'discounts' ? '#e31e24' : theme.text,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={() => handleNavMouseEnter('discounts')}
                onMouseLeave={(e) => (e.currentTarget.style.color = theme.text)}
              >
                <Percent size={15} />
                <span>Endirimlər</span>
              </button>
            </div>
          </div>
        </div>
        {/* Desktop MegaMenu Dropdown Panel */}
        <MegaMenu
          isOpen={isMegaMenuOpen || hoveredNavTab === 'catalog'}
          onClose={() => {
            setIsMegaMenuOpen(false);
            setHoveredNavTab(null);
          }}
          categories={categories}
          brands={brands}
          products={products}
          theme={theme}
          onSelectCategory={(catId) => {
            setIsMegaMenuOpen(false);
            setHoveredNavTab(null);
            onNavigate('catalog', catId);
          }}
          onSelectBrand={(brandId) => {
            setIsMegaMenuOpen(false);
            setHoveredNavTab(null);
            onNavigate('catalog', brandId);
          }}
          onSelectProduct={(product) => {
            setIsMegaMenuOpen(false);
            setHoveredNavTab(null);
            onNavigate('product', product.id);
          }}
          onNavigate={(route, param) => {
            setIsMegaMenuOpen(false);
            setHoveredNavTab(null);
            onNavigate(route, param);
          }}
          triggerRef={megaMenuBtnRef}
          onMouseEnter={() => {
            if (hoverNavTimeoutRef.current) clearTimeout(hoverNavTimeoutRef.current);
          }}
          onMouseLeave={handleNavMouseLeave}
        />

        {/* Nav Links Hover Mega-Preview Panel (In-flow monolithic expansion for non-catalog tabs) */}
        {hoveredNavTab && hoveredNavTab !== 'home' && hoveredNavTab !== 'catalog' && (
          <div
            className="header-nav-preview-panel"
            onMouseEnter={() => {
              if (hoverNavTimeoutRef.current) clearTimeout(hoverNavTimeoutRef.current);
            }}
            onMouseLeave={handleNavMouseLeave}
            style={{
              position: 'relative',
              width: '100%',
              backgroundColor: 'transparent',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              border: 'none',
              borderTop:
                themeMode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : '1px solid rgba(0, 0, 0, 0.06)',
              borderBottom: 'none',
              boxShadow: 'none',
              padding: '20px 0 24px',
            }}
          >
            <div className="catalog-container" style={{ padding: '0 clamp(24px, 4vw, 56px)' }}>
              {hoveredNavTab === 'brands' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '32px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ maxWidth: '320px' }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: theme.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Sparkles size={16} color="#e31e24" />
                      <span>Rəsmi Tərəfdaş Brendlərimiz</span>
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        color: theme.textMuted,
                        margin: '6px 0 0 0',
                        lineHeight: 1.4,
                      }}
                    >
                      Aktiv kataloqda yer alan brendlərin loqolarına və dərc edilmiş modellərinə
                      baxın.
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                      flex: 1,
                      justifyContent: 'center',
                    }}
                  >
                    {HEADER_BRAND_LOGOS.map((featured) => {
                      const brand = brands.find(
                        (item) => normalizeBrandKey(item) === featured.slug
                      );
                      return (
                        <button
                          key={featured.slug}
                          type="button"
                          onClick={() => {
                            setHoveredNavTab(null);
                            onNavigate(brand ? 'brand' : 'brands', brand?.id);
                          }}
                          style={{
                            padding: '10px 14px',
                            minWidth: '112px',
                            minHeight: '54px',
                            borderRadius: '10px',
                            backgroundColor: '#ffffff',
                            border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e2e8f0'}`,
                            fontSize: '13px',
                            fontWeight: 700,
                            color: theme.text,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <ShimmerImage
                            src={brand?.logo || featured.logo}
                            alt={featured.name}
                            spinnerSize={10}
                            containerStyle={{ width: '84px', height: '28px' }}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setHoveredNavTab(null);
                      onNavigate('brands');
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(220, 38, 38, 0.10)',
                      color: '#dc2626',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: 'none',
                    }}
                  >
                    <span>Bütün brendlərə bax</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {hoveredNavTab === 'stores' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '32px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ maxWidth: '340px' }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: theme.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <MapPin size={16} color="#e31e24" />
                      <span>Mağaza və Sərgi Salonlarımız</span>
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        color: theme.textMuted,
                        margin: '6px 0 0 0',
                        lineHeight: 1.4,
                      }}
                    >
                      {settings?.address ||
                        'Sədərək TM Şirniyyat bazarı, 1-ci sıranın arxası Kapital Bankla üzbəüz'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        color: theme.text,
                      }}
                    >
                      <Clock size={15} color="#e31e24" />
                      <span>Hər gün: 09:00 - 19:00</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setHoveredNavTab(null);
                      onNavigate('stores');
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(220, 38, 38, 0.10)',
                      color: '#dc2626',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: 'none',
                    }}
                  >
                    <span>Bütün filiallar və xəritə</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {hoveredNavTab === 'services' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '32px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ maxWidth: '320px' }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: theme.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <ShieldCheck size={16} color="#e31e24" />
                      <span>Rəsmi Zəmanət və Servis</span>
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        color: theme.textMuted,
                        margin: '6px 0 0 0',
                        lineHeight: 1.4,
                      }}
                    >
                      Zəmanət və servis şərtlərini məhsul sənədlərinə uyğun olaraq dəqiqləşdirin.
                    </p>
                  </div>

                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: theme.text,
                      }}
                    >
                      <CheckCircle2 size={15} color="#16a34a" />
                      <span>Məhsula uyğun zəmanət məlumatı</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: theme.text,
                      }}
                    >
                      <Wrench size={15} color="#0284c7" />
                      <span>Orijinal Detallar</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setHoveredNavTab(null);
                      onNavigate('services');
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(220, 38, 38, 0.10)',
                      color: '#dc2626',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: 'none',
                    }}
                  >
                    <span>Servis haqqında ətraflı</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {hoveredNavTab === 'support' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '32px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ maxWidth: '320px' }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: theme.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Phone size={16} color="#e31e24" />
                      <span>Müştəri Dəstəyi</span>
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        color: theme.textMuted,
                        margin: '6px 0 0 0',
                        lineHeight: 1.4,
                      }}
                    >
                      Məhsul seçimi, sifariş və servis mövzularında mövcud əlaqə kanallarından bizə
                      yaza və ya zəng edə bilərsiniz.
                    </p>
                  </div>

                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}
                  >
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: theme.text }}>
                      {settings?.phoneNumber || '+994 50 261 30 41'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setHoveredNavTab(null);
                      onNavigate('support');
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(220, 38, 38, 0.10)',
                      color: '#dc2626',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: 'none',
                    }}
                  >
                    <span>Dəstək mərkəzinə keç</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {hoveredNavTab === 'discounts' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '32px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ maxWidth: '320px' }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: theme.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Percent size={16} color="#e31e24" />
                      <span>Xüsusi Endirim Təklifləri</span>
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        color: theme.textMuted,
                        margin: '6px 0 0 0',
                        lineHeight: 1.4,
                      }}
                    >
                      Qiyməti əvvəlki kataloq qiymətindən aşağı olan aktual modelləri bir səhifədə
                      müqayisə edin.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#e31e24',
                        backgroundColor: 'rgba(227, 30, 36, 0.1)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                      }}
                    >
                      Kataloq məlumatlarına əsasən
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setHoveredNavTab(null);
                      onNavigate('catalog', 'discounts');
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(220, 38, 38, 0.10)',
                      color: '#dc2626',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: 'none',
                    }}
                  >
                    <span>Bütün endirimlərə bax</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Category & Navigation Drawer (rendered on mobile when Menyu/Kateqoriyalar clicked) */}
      <MobileCategoryDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        categories={categories}
        brands={brands}
        products={products}
        theme={theme}
        themeMode={themeMode}
        onSelectCategory={(catId) => onNavigate('catalog', catId)}
        onSelectBrand={(brandId) => onNavigate('catalog', brandId)}
        onNavigate={onNavigate}
        triggerRef={mobileMenuBtnRef}
      />

      {/* Search & MegaMenu Dropdown Clickaway Backdrop */}
      {(isSearchExpanded || isMegaMenuOpen || Boolean(hoveredNavTab)) && (
        <div
          className="header-search-clickaway"
          onClick={() => {
            if (isSearchExpanded) closeSearch();
            if (isMegaMenuOpen) setIsMegaMenuOpen(false);
            if (hoveredNavTab) setHoveredNavTab(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: DESIGN_TOKENS.zIndex.modal,
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            backdropFilter: 'none',
          }}
        />
      )}
    </>
  );
};
