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

const pillStyle = (theme: ThemeColors) =>
  ({
    '--pill-color': theme.primary,
    '--pill-border': 'transparent',
    '--pill-bg': theme.bgSecondary,
    '--pill-text': theme.textSecondary,
    border: 'none',
  }) as React.CSSProperties;

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
        const count = products.filter(
          (p) => p.category === cat.id && p.status !== 'draft'
        ).length;
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

  return (
    <header
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
          <a href="/" className="brand-lockup" aria-label="Sahara Electronics kataloqu">
            <SaharaLogo className="header-sahara-logo" isDark={isDarkMode} />
            {settings?.headerCaption && (
              <span className="brand-caption" style={{ color: theme.textMuted }}>
                {settings.headerCaption}
              </span>
            )}
          </a>

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
            <span className="result-count" style={{ color: theme.textMuted, borderColor: theme.border }}>
              <b style={{ color: theme.primary }}>{filteredCount}</b>/{totalCount}
            </span>
          </div>

          {/* Sağ İdarəetmə Paneli (Arxa plansız və çərçivəsiz təmiz ikonlar) */}
          <div className="header-actions">
            {/* Seçilmişlər / Favorites ❤️ */}
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
                }}
                title={favoritesCount > 0 ? `Seçilmişlər (${favoritesCount})` : 'Seçilmişlər'}
                aria-label={favoritesCount > 0 ? `Seçilmişlər (${favoritesCount})` : 'Seçilmişlər'}
              >
                <Heart
                  size={20}
                  fill={favoritesCount > 0 || currentView === 'favorites' ? '#ef4444' : 'none'}
                  color={favoritesCount > 0 || currentView === 'favorites' ? '#ef4444' : 'currentColor'}
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

            {/* Səbət / Cart 🛒 */}
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
                }}
                title={cartCount > 0 ? `Səbət (${cartCount})` : 'Səbət'}
                aria-label={cartCount > 0 ? `Səbət (${cartCount})` : 'Səbət'}
              >
                <ShoppingCart size={20} color={currentView === 'cart' || cartCount > 0 ? '#dc2626' : 'currentColor'} />
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
            <button
              className="icon-action"
              onClick={onOpenInverterInfo}
              style={{
                color: theme.primary,
                border: 'none',
                background: 'transparent',
              }}
              title="Texnologiyalar və bələdçi haqqında"
            >
              <Info size={20} />
            </button>
            {onOpenDrawer && (
              <button
                className="icon-action drawer-trigger-btn"
                data-testid="drawer-trigger"
                onClick={onOpenDrawer}
                style={{
                  color: theme.primary,
                  border: 'none',
                  background: 'transparent',
                }}
                title="Sərgi salonları və ünvanlar"
                aria-label="Sərgi salonları və ünvanlar"
              >
                <MapPin size={20} />
              </button>
            )}
            <button
              className="share-action"
              onClick={onOpenCatalogShare}
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.10)',
                color: '#dc2626',
                border: 'none',
              }}
            >
              <Share2 size={17} color="#dc2626" />
              <span style={{ color: '#dc2626' }}>{settings?.shareButtonText || 'Paylaş'}</span>
            </button>
            <button
              className="icon-action"
              onClick={onToggleTheme}
              style={{
                color: isDarkMode ? '#f59e0b' : '#475569',
                border: 'none',
                background: 'transparent',
              }}
              title="Görünüşü dəyiş"
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
            className={selectedCategory === 'all' ? 'filter-pill active' : 'filter-pill'}
            onClick={(e) => {
              if (hasMoved()) return;
              scrollItemIntoView(e);
              onSelectCategory('all');
            }}
            style={pillStyle(theme)}
          >
            <CategoryGlyph id="all" compact plain />
            <span>Bütün məhsullar</span>
            <small style={{ opacity: 0.85, fontSize: '11px', marginLeft: '4px', fontWeight: 700 }}>
              ({products.filter((p) => p.status !== 'draft').length || totalCount})
            </small>
          </button>
          {availableCategories.map((category) => (
            <button
              key={category.id}
              className={selectedCategory === category.id ? 'filter-pill active' : 'filter-pill'}
              onClick={(e) => {
                if (hasMoved()) return;
                scrollItemIntoView(e);
                onSelectCategory(category.id);
              }}
              style={pillStyle(theme)}
            >
              <CategoryGlyph id={category.id} slug={category.slug || category.id} compact plain />
              <span>{category.name}</span>
              <small style={{ opacity: 0.85, fontSize: '11px', marginLeft: '4px', fontWeight: 700 }}>
                ({category.count})
              </small>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
