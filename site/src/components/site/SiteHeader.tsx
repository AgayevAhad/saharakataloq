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
    // Check initial scroll position
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sorted active categories for secondary navigation bar
  const activeCategories = [...categories]
    .filter((c) => c.active)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <>
      {/* Top Utilities Bar */}
      <TopServiceBar settings={settings} theme={theme} onNavigate={onNavigate} />

      {/* Main Sticky Header */}
      <header
        className={`site-header-sticky sticky-header ${isCompact ? 'is-compact' : ''}`}
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor:
            themeMode === 'dark' ? 'rgba(11, 15, 23, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${theme.border}`,
          boxShadow: isCompact
            ? '0 6px 24px rgba(0, 0, 0, 0.12)'
            : '0 2px 12px rgba(0, 0, 0, 0.04)',
          zIndex: DESIGN_TOKENS.zIndex.sticky,
          transition:
            'padding 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, background-color 0.2s ease',
        }}
      >
        <div className="catalog-container">
          {/* Desktop Layout (> 768px) */}
          <div
            className="site-header-desktop-row"
            style={{ padding: isCompact ? '8px 0' : '12px 0' }}
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
                    height: isCompact ? '40px' : '46px',
                    width: 'auto',
                    maxWidth: '240px',
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
                maxWidth: '680px',
                minWidth: '260px',
                marginLeft: '24px',
                marginRight: '20px',
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
                  height: isCompact ? '38px' : '42px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0 18px',
                  borderRadius: '999px',
                  backgroundColor: themeMode === 'dark' ? '#161d2b' : '#f8fafc',
                  border: `1px solid ${theme.border}`,
                  color: theme.textMuted,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                aria-label="Axtarış pəncərəsini aç"
              >
                <Search size={16} style={{ color: theme.primary, flexShrink: 0 }} />
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {searchQuery || 'Məhsul, marka və ya model axtarın...'}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: themeMode === 'dark' ? '#273549' : '#e2e8f0',
                    color: theme.text,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  ⌘K
                </span>
              </button>
            </div>

            {/* Right Action Icons & Utilities */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {featureFlags.isEnabled('enableSaharaMatch') && (
                <button
                  type="button"
                  onClick={onOpenSaharaMatch}
                  className="sahara-match-header-btn"
                  style={{
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    color: '#dc2626',
                    border: '1px solid rgba(220, 38, 38, 0.25)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Sparkles size={14} />
                  <span>Sahara Match</span>
                </button>
              )}

              {/* Sərgi Salonları Button */}
              <button
                type="button"
                onClick={() => (onOpenDrawer ? onOpenDrawer() : onNavigate('stores'))}
                data-testid="drawer-trigger"
                className="drawer-trigger-btn"
                style={{
                  background: themeMode === 'dark' ? '#161d2b' : '#f1f5f9',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '10px',
                  padding: '8px 12px',
                  color: theme.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
                aria-label="Sərgi salonları və ünvanlar"
                title="Sərgi salonları və ünvanlar"
              >
                <MapPin size={16} style={{ color: theme.primary }} />
                <span>Salonlar</span>
              </button>

              {/* Compare Button */}
              {featureFlags.isEnabled('enableCompare') && (
                <button
                  type="button"
                  onClick={() => onNavigate('compare')}
                  style={{
                    position: 'relative',
                    background: themeMode === 'dark' ? '#161d2b' : '#f1f5f9',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '10px',
                    padding: '8px',
                    color: theme.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Məhsul Müqayisəsi"
                >
                  <Scale size={18} />
                  {comparisonCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        backgroundColor: theme.primary,
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 800,
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {comparisonCount}
                    </span>
                  )}
                </button>
              )}

              {/* Favorites Button */}
              {featureFlags.isEnabled('enableFavorites') && (
                <button
                  type="button"
                  onClick={() => onNavigate('favorites')}
                  style={{
                    position: 'relative',
                    background: themeMode === 'dark' ? '#161d2b' : '#f1f5f9',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '10px',
                    padding: '8px',
                    color: theme.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Seçilmiş Məhsullar"
                >
                  <Heart size={18} />
                  {favoritesCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 800,
                        width: '18px',
                        height: '18px',
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
              )}

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={onToggleTheme}
                style={{
                  background: themeMode === 'dark' ? '#161d2b' : '#f1f5f9',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '10px',
                  padding: '8px',
                  color: theme.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={themeMode === 'dark' ? 'İşıqlı rejimə keç' : 'Qaranlıq rejimə keç'}
              >
                {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile Layout (<= 768px) */}
          <div className="site-header-mobile-layout">
            {/* Row 1: Large crisp mobile logo & utility buttons */}
            <div className="site-header-mobile-top-row">
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
                  minWidth: 0,
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Mobile Drawer Menu Trigger */}
                <button
                  ref={mobileMenuBtnRef}
                  type="button"
                  onClick={() => setIsMobileDrawerOpen((prev) => !prev)}
                  aria-expanded={isMobileDrawerOpen}
                  aria-label="Kateqoriyalar menyusu"
                  data-testid="mobile-menu-trigger"
                  style={{
                    backgroundColor: isMobileDrawerOpen
                      ? theme.primary
                      : themeMode === 'dark'
                        ? '#1e293b'
                        : '#f1f5f9',
                    color: isMobileDrawerOpen ? '#ffffff' : theme.text,
                    border: `1px solid ${isMobileDrawerOpen ? theme.primary : theme.border}`,
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Layers size={14} />
                  <span>Menyu</span>
                </button>

                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={onToggleTheme}
                  style={{
                    background: themeMode === 'dark' ? '#161d2b' : '#f1f5f9',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    padding: '6px 8px',
                    color: theme.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={themeMode === 'dark' ? 'İşıqlı rejim' : 'Qaranlıq rejim'}
                >
                  {themeMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                {/* Showrooms / Stores Trigger */}
                <button
                  type="button"
                  onClick={() => (onOpenDrawer ? onOpenDrawer() : onNavigate('stores'))}
                  data-testid="drawer-trigger-mobile"
                  style={{
                    background: themeMode === 'dark' ? '#161d2b' : '#f1f5f9',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    padding: '6px 8px',
                    color: theme.primary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Sərgi salonları"
                >
                  <MapPin size={16} />
                </button>
              </div>
            </div>

            {/* Row 2: 100% Full-Width Search Trigger Bar */}
            <div className="site-header-mobile-search-row">
              <button
                type="button"
                onClick={onOpenSearchModal}
                data-testid="header-search-trigger"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '999px',
                  backgroundColor: themeMode === 'dark' ? '#161d2b' : '#f8fafc',
                  border: `1px solid ${theme.border}`,
                  color: theme.textMuted,
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                aria-label="Axtarış pəncərəsini aç"
              >
                <Search size={14} style={{ color: theme.primary, flexShrink: 0 }} />
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {searchQuery || 'Məhsul, marka və ya model axtarın...'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Navigation Row (Desktop: Categories from DB) */}
        <div
          ref={secondaryNavRef}
          className="header-secondary-nav hide-on-mobile"
          style={{
            position: 'relative',
            borderTop: `1px solid ${theme.border}`,
            backgroundColor:
              themeMode === 'dark' ? 'rgba(11, 15, 23, 0.7)' : 'rgba(248, 250, 252, 0.9)',
            padding: '4px 0',
          }}
        >
          <div
            className="catalog-container"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            {/* Left: MegaMenu Trigger + Category Quick Tabs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                flex: 1,
              }}
            >
              {/* Mega-Menu Trigger Button */}
              <button
                ref={megaMenuBtnRef}
                type="button"
                onClick={() => setIsMegaMenuOpen((prev) => !prev)}
                aria-expanded={isMegaMenuOpen}
                aria-controls="mega-menu-overlay"
                className="mega-menu-trigger-btn"
                style={{
                  backgroundColor: isMegaMenuOpen
                    ? theme.primary
                    : themeMode === 'dark'
                      ? '#1e293b'
                      : '#f1f5f9',
                  color: isMegaMenuOpen ? '#ffffff' : theme.text,
                  border: `1px solid ${isMegaMenuOpen ? theme.primary : theme.border}`,
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <Layers size={15} />
                <span>Kateqoriyalar</span>
                <ChevronDown
                  size={13}
                  style={{
                    transform: isMegaMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>

              {/* Dynamic DB Categories */}
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
                      padding: '8px 4px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: theme.text,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Right: Quick Links */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsMegaMenuOpen(false);
                  onNavigate('brands');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: currentRoute === 'brands' ? 700 : 500,
                  color: currentRoute === 'brands' ? theme.primary : theme.textMuted,
                  cursor: 'pointer',
                }}
              >
                Brendlər
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMegaMenuOpen(false);
                  onNavigate('services');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: currentRoute === 'services' ? 700 : 500,
                  color: currentRoute === 'services' ? theme.primary : theme.textMuted,
                  cursor: 'pointer',
                }}
              >
                Xidmətlər
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMegaMenuOpen(false);
                  onNavigate('stores');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: currentRoute === 'stores' ? 700 : 500,
                  color: currentRoute === 'stores' ? theme.primary : theme.textMuted,
                  cursor: 'pointer',
                }}
              >
                Sərgi Salonları
              </button>
            </div>
          </div>

          {/* Desktop MegaMenu Dropdown Panel inside relative secondaryNav */}
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

      {/* Mobile Category & Navigation Drawer (rendered on mobile when Menyu clicked) */}
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
