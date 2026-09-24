import React, { useState } from 'react';
import { Info, Moon, Search, Share2, Sun, X, MapPin } from 'lucide-react';
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
import { SmartSearchOverlay } from './SmartSearchOverlay';
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
}

const pillStyle = (theme: ThemeColors) =>
  ({
    '--pill-color': theme.primary,
    '--pill-border': theme.border,
    '--pill-bg': theme.bgSecondary,
    '--pill-text': theme.textSecondary,
  }) as React.CSSProperties;

export const Header: React.FC<HeaderProps> = ({
  theme,
  isDarkMode,
  onToggleTheme,
  selectedCategory,
  onSelectCategory,
  selectedBrand: _selectedBrand,
  onSelectBrand,
  brands,
  categories,
  products,
  settings,
  searchQuery,
  onSearchChange,
  onSelectProduct,
  onOpenInverterInfo,
  onOpenCatalogShare,
  onOpenDrawer,
  totalCount,
  filteredCount,
}) => {
  const [searchFocused, setSearchFocused] = useState(false);

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
        {/* 1. Yuxarı Sətir: Böyüdülmüş Sol Logo - Mərkəzdə Axtarış - Sağda İkonlar */}
        <div className="header-top-row">
          <a href="/" className="brand-lockup" aria-label="Sahara Electronics kataloqu">
            <SaharaLogo className="header-sahara-logo" isDark={isDarkMode} />
            {settings?.headerCaption && (
              <span className="brand-caption" style={{ color: theme.textMuted }}>
                {settings.headerCaption}
              </span>
            )}
          </a>

          {/* Mərkəzi Geniş Axtarış */}
          <div
            className={`catalog-search ${searchFocused ? 'is-focused' : ''} ${searchQuery ? 'has-query' : ''}`}
            style={{
              background: theme.bgSecondary,
              borderColor: theme.border,
            }}
            onFocus={() => setSearchFocused(true)}
          >
            <Search
              className="catalog-search-icon"
              size={18}
              color={isQueryActive ? theme.primary : theme.textMuted}
              style={{ transition: 'color 0.2s ease', flexShrink: 0 }}
            />
            <input
              aria-label="Məhsul axtarışı"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Məhsul, model, brend və ya xüsusiyyət axtar..."
              style={{ color: theme.text }}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Axtarışı təmizlə"
                onClick={() => onSearchChange('')}
                className="search-clear-btn"
              >
                <X size={16} />
              </button>
            )}
            <span className="result-count" style={{ color: theme.textMuted, borderColor: theme.border }}>
              <b style={{ color: theme.primary }}>{filteredCount}</b>/{totalCount}
            </span>

            {/* Smart Search Overlay */}
            <SmartSearchOverlay
              visible={searchFocused}
              searchQuery={searchQuery}
              onSearchChange={(query) => {
                onSearchChange(query);
                setSearchFocused(false);
              }}
              onClose={() => setSearchFocused(false)}
              products={products}
              categories={categories}
              brands={brands}
              theme={theme}
              isDarkMode={isDarkMode}
              onSelectCategory={onSelectCategory}
              onSelectBrand={onSelectBrand}
              onSelectProduct={onSelectProduct}
            />
          </div>

          {/* Sağ İdarəetmə Paneli (Böyüdülmüş İkonlar və Düymələr) */}
          <div className="header-actions">
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
                borderColor: theme.border,
                background: theme.bgSecondary,
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
                  borderColor: theme.border,
                  background: theme.bgSecondary,
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
              style={{ background: theme.primary }}
            >
              <Share2 size={17} />
              <span>{settings?.shareButtonText || 'Paylaş'}</span>
            </button>
            <button
              className="icon-action"
              onClick={onToggleTheme}
              style={{
                color: isDarkMode ? '#f59e0b' : '#475569',
                borderColor: theme.border,
                background: theme.bgSecondary,
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
          </button>
          {categories.map((category) => (
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
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
