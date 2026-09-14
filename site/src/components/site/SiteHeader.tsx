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
  const megaMenuBtnRef = useRef<HTMLButtonElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);
  const secondaryNavRef = useRef<HTMLDivElement>(null);

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
        <div className="catalog-container">
          {/* Desktop Layout (> 768px) */}
          <div
            className="site-header-desktop-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isCompact ? '10px 0' : '14px 0',
              gap: '24px',
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
                    height: isCompact ? '38px' : '44px',
                    width: 'auto',
                    maxWidth: '220px',
                    objectFit: 'contain',
                    display: 'block',
                    transition: 'height 0.2s ease',
                  }}
                />
              </button>
            </div>

            {/* Center: Long, Sleek Smart Search Trigger matching siteUI.png */}
            <div
              style={{
                flex: 1,
                maxWidth: '660px',
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
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0 18px',
                  borderRadius: '999px',
                  backgroundColor: themeMode === 'dark' ? '#121824' : '#f8fafc',
                  border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'}`,
                  color: theme.textMuted,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                aria-label="Axtarış pəncərəsini aç"
              >
                <Search size={16} style={{ color: theme.textMuted, flexShrink: 0 }} />
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
                    height: '32px',
                    width: 'auto',
                    maxWidth: '150px',
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

        {/* Secondary Navigation Row (Desktop: = Kateqoriyalar + Clean Category Links) */}
        <div
          ref={secondaryNavRef}
          className="header-secondary-nav hide-on-mobile"
          style={{
            position: 'relative',
            borderTop: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
            padding: '8px 0',
          }}
        >
          <div
            className="catalog-container"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '24px',
            }}
          >
            {/* Left: = Kateqoriyalar Trigger matching siteUI.png */}
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
                fontSize: '13.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                flexShrink: 0,
              }}
            >
              <Menu size={16} />
              <span>Kateqoriyalar</span>
            </button>

            {/* Horizontal Links matching siteUI.png */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                flex: 1,
              }}
            >
              {activeCategories.slice(0, 8).map((cat) => {
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setIsMegaMenuOpen(false);
                      onNavigate('catalog', cat.id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '4px 0',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: theme.text,
                      cursor: 'pointer',
                      transition: 'color 0.15s ease',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#e31e24')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = theme.text)}
                  >
                    {cat.name}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setIsMegaMenuOpen(false);
                  onNavigate('brands');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 0',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: currentRoute === 'brands' ? '#e31e24' : theme.text,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#e31e24')}
                onMouseLeave={(e) => (e.currentTarget.style.color = theme.text)}
              >
                Brendlər
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMegaMenuOpen(false);
                  onNavigate('catalog', 'discounts');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 0',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#e31e24',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                }}
              >
                <span>Endirimlər</span>
              </button>
            </div>
          </div>

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


