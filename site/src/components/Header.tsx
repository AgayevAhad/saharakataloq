import React, { useState, useRef, useMemo } from 'react';
import { Info, Moon, Search, Share2, Sun, X, MapPin, Heart, ShoppingCart } from 'lucide-react';
import {
  Brand,
  CatalogCategory,
  CatalogSettings,
  Product,
  ProductCategory,
} from '../types/product';
import { ThemeColors, DESIGN_TOKENS } from '../types/theme';
import { SaharaLogo } from './SaharaLogo';
import { SocialPopoverButton } from './SocialIcons';
import { CategoryGlyph } from './CategoryGlyph';

import { useHorizontalScroll } from '../hooks/useHorizontalScroll';

interface HeaderProps {
  theme: ThemeColors;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  selectedCategory: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  brands: Brand[];
  categories: CatalogCategory[];
  products: Product[];
  settings?: CatalogSettings;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSelectProduct?: (product: Product) => void;
  onOpenInverterInfo: () => void;
  onOpenCatalogShare: () => void;
  onOpenDrawer?: () => void;
  totalCount: number;
  filteredCount: number;
  favoritesCount?: number;
  cartCount?: number;
  onOpenFavorites?: () => void;
  onOpenCart?: () => void;
  currentView?: 'catalog' | 'cart' | 'favorites';
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  isDarkMode,
  onToggleTheme,
  selectedCategory,
  onSelectCategory,
  selectedBrand: _selectedBrand,
  onSelectBrand: _onSelectBrand,
  brands: _brands,
  categories,
  products = [],
  settings,
  searchQuery,
  onSearchChange,
  onSelectProduct: _onSelectProduct,
  onOpenInverterInfo,
  onOpenCatalogShare,
  onOpenDrawer,
  totalCount,
  filteredCount,
  favoritesCount = 0,
  cartCount = 0,
  onOpenFavorites,
  onOpenCart,
  currentView = 'catalog',
}) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const availableCategories = useMemo(() => {
    if (!products || products.length === 0) {
      return categories.map((cat) => ({ ...cat, count: 0 }));
    }
    return categories
      .map((cat) => {
        const count = products.filter((p) => p.category === cat.id && p.status !== 'draft').length;
        return { ...cat, count };
      })
      .filter((cat) => cat.count > 0);
  }, [categories, products]);

  const {
    containerRef: filterRowRef,
    scrollItemIntoView,
    dragProps,
    hasMoved,
  } = useHorizontalScroll({
    activeSelector: '.filter-pill.active',
    activeDependency: selectedCategory,
  });

  const isQueryActive = searchQuery.trim().length > 0;
  const headerRef = useRef<HTMLElement>(null);

  React.useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.getBoundingClientRect().height;
        if (height > 0) {
          document.documentElement.style.setProperty(
            '--catalog-site-header-height',
            `${Math.round(height)}px`
          );
        }
      }
    };
    updateHeaderHeight();
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => updateHeaderHeight()) : null;
    if (headerRef.current && ro) {
      ro.observe(headerRef.current);
    }
    window.addEventListener('resize', updateHeaderHeight, { passive: true });
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className="catalog-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: DESIGN_TOKENS.zIndex.sticky,
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${theme.border}`,
        boxShadow: isDarkMode ? '0 4px 24px rgba(0, 0, 0, 0.45)' : '0 4px 20px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div className="catalog-header-inner">
        {/* 1. Yuxarı Sətir: Böyüdülmüş Sol Logo - Mərkəzdə Sadə Axtarış - Sağda İkonlar */}
        <div className="header-top-row">
          <div className="brand-lockup" aria-label="Sahara Electronics kataloqu">
            <SaharaLogo className="header-sahara-logo" isDark={isDarkMode} />
            {settings?.headerCaption && (
              <span className="brand-caption" style={{ color: theme.textMuted }}>
                {settings.headerCaption}
              </span>
            )}
          </div>

          {/* Mərkəzi Sadə Axtarış Sahəsi */}
          <div
            className={`catalog-search ${searchFocused ? 'is-focused' : ''} ${searchQuery ? 'has-query' : ''}`}
            style={{
              background: theme.bgSecondary,
              borderColor: theme.border,
            }}
          >
            <Search
              className="catalog-search-icon"
              size={18}
              color={isQueryActive ? theme.primary : theme.textMuted}
              style={{ transition: 'color 0.2s ease', flexShrink: 0 }}
            />
            <input
              ref={searchInputRef}
              aria-label="Məhsul axtarışı"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Məhsul, model, brend və ya xüsusiyyət axtar..."
              style={{ color: theme.text }}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Axtarışı təmizlə"
                onClick={() => {
                  onSearchChange('');
                  searchInputRef.current?.focus();
                }}
                className="search-clear-btn"
              >
                <X size={16} />
              </button>
            )}
            <span
              className="result-count"
              style={{ color: theme.textMuted, borderColor: theme.border }}
            >
              <b style={{ color: theme.primary }}>{filteredCount}</b>/{totalCount}
            </span>
          </div>

          {/* Sağ İdarəetmə Paneli: Seçilmiş -> Səbət -> Paylaş -> Konum -> Gecə/Gündüz */}
          <div
            className="header-actions"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {/* 1. Seçilmişlər / Favorites ❤️ */}
            {onOpenFavorites && (
              <button
                type="button"
                className="icon-action favorite-header-btn"
                data-favorite-target
                onClick={onOpenFavorites}
                style={{
                  position: 'relative',
                  color: currentView === 'favorites' || favoritesCount > 0 ? '#ef4444' : theme.text,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease, transform 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color =
                    currentView === 'favorites' || favoritesCount > 0 ? '#ef4444' : theme.text)
                }
                title={favoritesCount > 0 ? `Seçilmişlər (${favoritesCount})` : 'Seçilmişlər'}
                aria-label={favoritesCount > 0 ? `Seçilmişlər (${favoritesCount})` : 'Seçilmişlər'}
              >
                <Heart
                  size={20}
                  fill={favoritesCount > 0 || currentView === 'favorites' ? '#ef4444' : 'none'}
                  color={
                    favoritesCount > 0 || currentView === 'favorites' ? '#ef4444' : 'currentColor'
                  }
                />
                {favoritesCount > 0 && (
                  <span
                    className="header-badge header-favorite-badge"
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      padding: '0 4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    {favoritesCount}
                  </span>
                )}
              </button>
            )}

            {/* 2. Səbət / Cart 🛒 */}
            {onOpenCart && (
              <button
                type="button"
                className="icon-action cart-header-btn"
                data-cart-target
                onClick={onOpenCart}
                style={{
                  position: 'relative',
                  color: currentView === 'cart' || cartCount > 0 ? '#dc2626' : theme.text,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease, transform 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color =
                    currentView === 'cart' || cartCount > 0 ? '#dc2626' : theme.text)
                }
                title={cartCount > 0 ? `Səbət (${cartCount})` : 'Səbət'}
                aria-label={cartCount > 0 ? `Səbət (${cartCount})` : 'Səbət'}
              >
                <ShoppingCart
                  size={20}
                  color={currentView === 'cart' || cartCount > 0 ? '#dc2626' : 'currentColor'}
                />
                {cartCount > 0 && (
                  <span
                    className="header-badge header-cart-badge"
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      padding: '0 4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)',
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* 3. Paylaş / Share 🔗 (Qutusuz, səbət rəngində və hover effekti ilə) */}
            <button
              type="button"
              className="icon-action header-share-btn"
              onClick={onOpenCatalogShare}
              style={{
                color: theme.text,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'color 0.15s ease, transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.color = theme.text)}
              title={settings?.shareButtonText || 'Kataloqu paylaş'}
              aria-label={settings?.shareButtonText || 'Kataloqu paylaş'}
            >
              <Share2 size={20} color="currentColor" />
            </button>

            {/* 4. Konum / Location 📍 (Səbət rəngində və hover effekti ilə) */}
            {onOpenDrawer && (
              <button
                type="button"
                className="icon-action drawer-trigger-btn"
                data-testid="drawer-trigger"
                onClick={onOpenDrawer}
                style={{
                  color: theme.text,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease, transform 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                onMouseLeave={(e) => (e.currentTarget.style.color = theme.text)}
                title="Sərgi salonları və ünvanlar"
                aria-label="Sərgi salonları və ünvanlar"
              >
                <MapPin size={20} color="currentColor" />
              </button>
            )}

            {/* Texnologiya Məlumatı / Info "i" */}
            <button
              type="button"
              className="icon-action header-info-btn"
              onClick={onOpenInverterInfo}
              style={{
                color: theme.text,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'color 0.15s ease, transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.color = theme.text)}
              title="Texnologiyalar və bələdçi haqqında"
              aria-label="Texnologiyalar və bələdçi haqqında"
            >
              <Info size={20} color="currentColor" />
            </button>

            {/* Sosial Popover Düymələri */}
            {settings?.instagramUrl && (
              <SocialPopoverButton
                platform="instagram"
                url={settings.instagramUrl}
                username={settings.instagramUsername}
                theme={theme}
                position="bottom"
              />
            )}
            {settings?.facebookUrl && (
              <SocialPopoverButton
                platform="facebook"
                url={settings.facebookUrl}
                username={settings.facebookUsername}
                theme={theme}
                position="bottom"
              />
            )}

            {/* 5. Gecə / Gündüz Rejim Dəyişdirici ☀️ / 🌙 */}
            <button
              type="button"
              className="icon-action"
              onClick={onToggleTheme}
              style={{
                color: isDarkMode ? '#f59e0b' : theme.text,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'color 0.15s ease, transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = isDarkMode ? '#f59e0b' : theme.text)
              }
              title="Görünüşü dəyiş"
              aria-label="Görünüşü dəyiş"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* 2. Alt Sətir: Panel daxilində yerləşən Kateqoriya Seçimləri */}
        <div
          ref={filterRowRef}
          {...dragProps}
          className="filter-row category-filter-row no-scrollbar"
          aria-label="Kateqoriya filtri"
          style={{ cursor: 'grab' }}
        >
          <button
            type="button"
            className={selectedCategory === 'all' ? 'filter-pill active' : 'filter-pill'}
            onClick={(e) => {
              if (hasMoved()) return;
              scrollItemIntoView(e);
              onSelectCategory('all');
            }}
            style={{
              backgroundColor:
                selectedCategory === 'all'
                  ? isDarkMode
                    ? 'rgba(227, 30, 36, 0.20)'
                    : 'rgba(220, 38, 38, 0.12)'
                  : isDarkMode
                    ? '#1e293b'
                    : '#f1f5f9',
              color: selectedCategory === 'all' ? theme.primary : theme.text,
              border: 'none',
              fontWeight: selectedCategory === 'all' ? 750 : 600,
            }}
          >
            <CategoryGlyph id="all" compact plain />
            <span>Bütün məhsullar</span>
            <small
              style={{
                color: selectedCategory === 'all' ? theme.primary : theme.textMuted,
                fontSize: '11px',
                marginLeft: '4px',
                fontWeight: 700,
              }}
            >
              ({products.filter((p) => p.status !== 'draft').length || totalCount})
            </small>
          </button>
          {availableCategories.map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                className={isActive ? 'filter-pill active' : 'filter-pill'}
                onClick={(e) => {
                  if (hasMoved()) return;
                  scrollItemIntoView(e);
                  onSelectCategory(category.id);
                }}
                style={{
                  backgroundColor: isActive
                    ? isDarkMode
                      ? 'rgba(227, 30, 36, 0.20)'
                      : 'rgba(220, 38, 38, 0.12)'
                    : isDarkMode
                      ? '#1e293b'
                      : '#f1f5f9',
                  color: isActive ? theme.primary : theme.text,
                  border: 'none',
                  fontWeight: isActive ? 750 : 600,
                }}
              >
                <CategoryGlyph id={category.id} slug={category.slug || category.id} compact plain />
                <span>{category.name}</span>
                <small
                  style={{
                    color: isActive ? theme.primary : theme.textMuted,
                    fontSize: '11px',
                    marginLeft: '4px',
                    fontWeight: 700,
                  }}
                >
                  ({category.count})
                </small>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
