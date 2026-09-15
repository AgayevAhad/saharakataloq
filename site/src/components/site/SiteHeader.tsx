import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Moon,
  Sun,
  Scale,
  Heart,
  Sparkles,
  MapPin,
  ChevronDown,
  Layers,
  ShoppingCart,
  User,
  Home,
  Menu,
  Tag,
  ArrowRight,
  ShieldCheck,
  Phone,
  Clock,
  Wrench,
  CheckCircle2,
  Percent,
} from 'lucide-react';
import { Brand, CatalogCategory, Product, CatalogSettings } from '../../types/product';
import { ThemeColors, DESIGN_TOKENS } from '../../types/theme';
import { TopServiceBar } from './TopServiceBar';
import { MegaMenu } from './MegaMenu';
import { MobileCategoryDrawer } from './MobileCategoryDrawer';
import { featureFlags } from '../../utils/featureFlags';

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
  onOpenSaharaMatch: () => void;
  onOpenDrawer?: () => void;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  currentRoute,
  onNavigate,
  categories,
  brands,
  products,
  settings,
  theme,
  themeMode,
  onToggleTheme,
  searchQuery,
  onSearchChange: _onSearchChange,
  onOpenSearchModal,
  comparisonCount,
  favoritesCount,
  onOpenSaharaMatch,
  onOpenDrawer,
}) => {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [hoveredNavTab, setHoveredNavTab] = useState<string | null>(null);
  const hoverNavTimeoutRef = useRef<any>(null);
  const megaMenuBtnRef = useRef<HTMLButtonElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);
  const secondaryNavRef = useRef<HTMLDivElement>(null);

  const handleNavMouseEnter = (tab: string) => {
    if (hoverNavTimeoutRef.current) clearTimeout(hoverNavTimeoutRef.current);
    setHoveredNavTab(tab);
  };

  const handleNavMouseLeave = () => {
    if (hoverNavTimeoutRef.current) clearTimeout(hoverNavTimeoutRef.current);
    hoverNavTimeoutRef.current = setTimeout(() => {
      setHoveredNavTab(null);
    }, 180);
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
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sorted active categories for secondary navigation bar
  const activeCategories = [...categories]
    .filter((c) => c.active !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <>
      {/* Main Sticky Header (1:1 siteUI.png) */}
      <header
        className={`site-header-sticky sticky-header ${isCompact ? 'is-compact' : ''}`}
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor:
            themeMode === 'dark' ? 'rgba(8, 12, 18, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
          boxShadow: isCompact
            ? '0 4px 20px rgba(0, 0, 0, 0.1)'
            : 'none',
          zIndex: DESIGN_TOKENS.zIndex.sticky,
          transition:
            'padding 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, background-color 0.2s ease',
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
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
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
                    height: isCompact ? '46px' : '56px',
                    width: 'auto',
                    maxWidth: '280px',
                    objectFit: 'contain',
                    display: 'block',
                    transition: 'height 0.2s ease',
                  }}
                />
              </button>
            </div>

            {/* Center: Long, Sleek Smart Search Trigger */}
            <div
              style={{
                flex: 1,
                maxWidth: '920px',
                margin: '0 12px',
                position: 'relative',
              }}
              className="header-search-wrap"
            >
              <button
                type="button"
                onClick={onOpenSearchModal}
                data-testid="header-search-trigger"
                style={{
                  width: '100%',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0 20px',
                  borderRadius: '999px',
                  backgroundColor: themeMode === 'dark' ? '#121824' : '#f8fafc',
                  border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'}`,
                  color: theme.textMuted,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                aria-label="Axtarış pəncərəsini aç"
              >
                <Search size={17} style={{ color: theme.textMuted, flexShrink: 0 }} />
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: theme.textMuted,
                  }}
                >
                  {searchQuery || 'Məhsul, marka və ya model axtarın...'}
                </span>
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
              </button>
            </div>

            {/* Right Action Icons & Utilities matching siteUI.png */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
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
                  color: theme.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s ease',
                }}
                aria-label="Seçilmiş Məhsullar"
              >
                <Heart size={20} color={favoritesCount > 0 ? '#ef4444' : theme.text} fill={favoritesCount > 0 ? '#ef4444' : 'none'} />
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

              {/* Cart 🛒 (0) */}
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                style={{
                  position: 'relative',
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
                aria-label="Səbət"
              >
                <ShoppingCart size={20} />
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
                  0
                </span>
              </button>

              {/* Profile 👤 */}
              <button
                type="button"
                onClick={() => onNavigate('favorites')}
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
                aria-label="İstifadəçi Profili"
              >
                <User size={20} />
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

          {/* Mobile Layout (<= 768px) matching siteUI.png */}
          <div className="site-header-mobile-layout">
            {/* Row 1: Logo + 📍 Bakı + 🤍 Wishlist + 🛒 Cart + Theme Toggle */}
            <div className="site-header-mobile-top-row" style={{ padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    color: favoritesCount > 0 ? '#ef4444' : theme.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Seçilmişlər"
                >
                  <Heart size={18} fill={favoritesCount > 0 ? '#ef4444' : 'none'} />
                </button>

                {/* Mobile Cart Button 🛒 */}
                <button
                  type="button"
                  onClick={() => onNavigate('catalog')}
                  style={{
                    position: 'relative',
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    color: theme.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Səbət"
                >
                  <ShoppingCart size={18} />
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
                    0
                  </span>
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

            {/* Row 2: Search Trigger Bar */}
            <div className="site-header-mobile-search-row" style={{ paddingBottom: '10px' }}>
              <button
                type="button"
                onClick={onOpenSearchModal}
                data-testid="header-search-trigger-mobile"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  backgroundColor: themeMode === 'dark' ? '#121824' : '#f8fafc',
                  border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'}`,
                  color: theme.textMuted,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                aria-label="Axtarış pəncərəsini aç"
              >
                <Search size={14} style={{ color: theme.textMuted, flexShrink: 0 }} />
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {searchQuery || 'Məhsul axtarın...'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Navigation Row (Desktop: = Kateqoriyalar + Site Page Links; No separating top line) */}
        <div
          ref={secondaryNavRef}
          className="header-secondary-nav hide-on-mobile"
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
            {/* Left: = Kateqoriyalar Trigger */}
            <button
              ref={megaMenuBtnRef}
              type="button"
              onClick={() => setIsMegaMenuOpen((prev) => !prev)}
              aria-expanded={isMegaMenuOpen}
              aria-controls="mega-menu-overlay"
              className="mega-menu-trigger-btn"
              style={{
                background: 'transparent',
                color: theme.text,
                border: 'none',
                padding: '4px 0',
                fontSize: '14px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                flexShrink: 0,
              }}
            >
              <Menu size={17} />
              <span>Kateqoriyalar</span>
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
                  transition: 'color 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={() => handleNavMouseEnter('home')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = currentRoute === 'home' ? '#e31e24' : theme.text)
                }
              >
                Ana Səhifə
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
                  color: currentRoute === 'brands' || hoveredNavTab === 'brands' ? '#e31e24' : theme.text,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={() => handleNavMouseEnter('brands')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = currentRoute === 'brands' ? '#e31e24' : theme.text)
                }
              >
                Brendlər
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
                  color: currentRoute === 'stores' || hoveredNavTab === 'stores' ? '#e31e24' : theme.text,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={() => handleNavMouseEnter('stores')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = currentRoute === 'stores' ? '#e31e24' : theme.text)
                }
              >
                Mağazalarımız
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
                  fontWeight: currentRoute === 'services' || hoveredNavTab === 'services' ? 700 : 500,
                  color: currentRoute === 'services' || hoveredNavTab === 'services' ? '#e31e24' : theme.text,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={() => handleNavMouseEnter('services')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = currentRoute === 'services' ? '#e31e24' : theme.text)
                }
              >
                Servis və Zəmanət
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
                  color: currentRoute === 'support' || hoveredNavTab === 'support' ? '#e31e24' : theme.text,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={() => handleNavMouseEnter('support')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = currentRoute === 'support' ? '#e31e24' : theme.text)
                }
              >
                Müştəri Dəstəyi
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
                  gap: '4px',
                  flexShrink: 0,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={() => handleNavMouseEnter('discounts')}
                onMouseLeave={(e) => (e.currentTarget.style.color = theme.text)}
              >
                <span>Endirimlər</span>
              </button>
            </div>
          </div>

          {/* Nav Links Hover Mega-Preview Panel */}
          {hoveredNavTab && hoveredNavTab !== 'home' && (
            <div
              className="header-nav-preview-panel"
              onMouseEnter={() => {
                if (hoverNavTimeoutRef.current) clearTimeout(hoverNavTimeoutRef.current);
              }}
              onMouseLeave={handleNavMouseLeave}
              style={{
                backgroundColor: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                padding: '20px 0 24px',
              }}
            >
              <div className="catalog-container" style={{ padding: '0 clamp(24px, 4vw, 56px)' }}>
                {hoveredNavTab === 'brands' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', flexWrap: 'wrap' }}>
                    <div style={{ maxWidth: '320px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={16} color="#e31e24" />
                        <span>Rəsmi Tərəfdaş Brendlərimiz</span>
                      </div>
                      <p style={{ fontSize: '13px', color: theme.textMuted, margin: '6px 0 0 0', lineHeight: 1.4 }}>
                        İtaliya, Almaniya və dünya brendlərinin orijinal məişət texnikaları Sahara-da.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1, justifyContent: 'center' }}>
                      {brands.slice(0, 6).map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setHoveredNavTab(null);
                            onNavigate('brand', b.id);
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '10px',
                            backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                            border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                            fontSize: '13px',
                            fontWeight: 700,
                            color: theme.text,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span>{b.name}</span>
                        </button>
                      ))}
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
                        backgroundColor: '#e31e24',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 14px rgba(227, 30, 36, 0.35)',
                      }}
                    >
                      <span>Bütün brendlərə bax</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {hoveredNavTab === 'stores' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', flexWrap: 'wrap' }}>
                    <div style={{ maxWidth: '340px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="#e31e24" />
                        <span>Mağaza və Sərgi Salonlarımız</span>
                      </div>
                      <p style={{ fontSize: '13px', color: theme.textMuted, margin: '6px 0 0 0', lineHeight: 1.4 }}>
                        {settings?.address || 'Sədərək TM Şirniyyat bazarı, 1-ci sıranın arxası Kapital Bankla üzbəüz'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: theme.text }}>
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
                        backgroundColor: '#e31e24',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 14px rgba(227, 30, 36, 0.35)',
                      }}
                    >
                      <span>Bütün filiallar və xəritə</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {hoveredNavTab === 'services' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', flexWrap: 'wrap' }}>
                    <div style={{ maxWidth: '320px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={16} color="#e31e24" />
                        <span>Rəsmi Zəmanət və Servis</span>
                      </div>
                      <p style={{ fontSize: '13px', color: theme.textMuted, margin: '6px 0 0 0', lineHeight: 1.4 }}>
                        Peşəkar ustalar və orijinal ehtiyat hissələri ilə xidmətinizdəyik.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: theme.text }}>
                        <CheckCircle2 size={15} color="#16a34a" />
                        <span>1-3 İl Rəsmi Zəmanət</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: theme.text }}>
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
                        backgroundColor: '#e31e24',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 14px rgba(227, 30, 36, 0.35)',
                      }}
                    >
                      <span>Servis haqqında ətraflı</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {hoveredNavTab === 'support' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', flexWrap: 'wrap' }}>
                    <div style={{ maxWidth: '320px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={16} color="#e31e24" />
                        <span>Müştəri Dəstəyi</span>
                      </div>
                      <p style={{ fontSize: '13px', color: theme.textMuted, margin: '6px 0 0 0', lineHeight: 1.4 }}>
                        Sualınız var? Operativ dəstək komandamız 7/24 xidmətinizdədir.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
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
                        backgroundColor: '#e31e24',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 14px rgba(227, 30, 36, 0.35)',
                      }}
                    >
                      <span>Dəstək mərkəzinə keç</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {hoveredNavTab === 'discounts' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', flexWrap: 'wrap' }}>
                    <div style={{ maxWidth: '320px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Percent size={16} color="#e31e24" />
                        <span>Xüsusi Endirim Təklifləri</span>
                      </div>
                      <p style={{ fontSize: '13px', color: theme.textMuted, margin: '6px 0 0 0', lineHeight: 1.4 }}>
                        Məişət texnikalarına 50%-dək xüsusi mövsüm endirimləri və hədiyyələr.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#e31e24', backgroundColor: 'rgba(227, 30, 36, 0.1)', padding: '6px 12px', borderRadius: '8px' }}>
                        Məhdud sayda təkliflər
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
                        backgroundColor: '#e31e24',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 14px rgba(227, 30, 36, 0.35)',
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

          {/* Desktop MegaMenu Dropdown Panel */}
          <MegaMenu
            isOpen={isMegaMenuOpen}
            onClose={() => setIsMegaMenuOpen(false)}
            categories={categories}
            brands={brands}
            products={products}
            theme={theme}
            onSelectCategory={(catId) => onNavigate('catalog', catId)}
            onSelectBrand={(brandId) => onNavigate('catalog', brandId)}
            onNavigate={onNavigate}
            triggerRef={megaMenuBtnRef}
          />
        </div>
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
    </>
  );
};


