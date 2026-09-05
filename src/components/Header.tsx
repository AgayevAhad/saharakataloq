import React, { useState } from 'react';
import { Info, Moon, Search, Share2, Sun, X } from 'lucide-react';
import { Brand, CatalogCategory, CatalogSettings, Product, ProductCategory } from '../types/product';
import { ThemeColors } from '../types/theme';
import { SaharaLogo } from './SaharaLogo';
import { SocialPopoverButton } from './SocialIcons';
import { SmartSearchOverlay } from './SmartSearchOverlay';

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
  totalCount: number;
  filteredCount: number;
}

const pillStyle = (theme: ThemeColors) => ({
  '--pill-color': theme.primary, '--pill-border': theme.border, '--pill-bg': theme.bgSecondary, '--pill-text': theme.textSecondary,
} as React.CSSProperties);

export const Header: React.FC<HeaderProps> = ({
  theme, isDarkMode, onToggleTheme, selectedCategory, onSelectCategory,
  selectedBrand, onSelectBrand, brands, categories, products, settings, searchQuery, onSearchChange,
  onSelectProduct, onOpenInverterInfo, onOpenCatalogShare, totalCount, filteredCount,
}) => {
  const [searchFocused, setSearchFocused] = useState(false);

  const isQueryActive = searchQuery.trim().length > 0;

  return (
    <div className="catalog-header-wrapper">
      {/* 1. YALNIZ Yuxarı sətir (Logo, sosial ikonlar, paylaş və tema dəyişdirici) ekranda STICKY qalır */}
      <header
        className="catalog-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          borderColor: theme.border,
        }}
      >
        <div className="header-top-row">
          <a href="/" className="brand-lockup" aria-label="Sahara Electronics kataloqu">
            <SaharaLogo className="header-sahara-logo" isDark={isDarkMode} />
            <span className="brand-caption" style={{ color: theme.textMuted }}>{settings?.headerCaption || 'Rəsmi məhsul kataloqu'}</span>
          </a>

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
            <button className="icon-action" onClick={onOpenInverterInfo} style={{ color: theme.primary, borderColor: theme.border, background: theme.bgSecondary }} title="Texnologiyalar və bələdçi haqqında"><Info size={17} /></button>
            <button className="share-action" onClick={onOpenCatalogShare} style={{ background: theme.primary }}><Share2 size={16} /><span>{settings?.shareButtonText || 'Paylaş'}</span></button>
            <button className="icon-action" onClick={onToggleTheme} style={{ color: isDarkMode ? '#f59e0b' : '#475569', borderColor: theme.border, background: theme.bgSecondary }} title="Görünüşü dəyiş">{isDarkMode ? <Sun size={17} /> : <Moon size={17} />}</button>
          </div>
        </div>
      </header>

      {/* 2. Axtarış və kateqoriya filtrləri səhifə axınında yerləşir (sürüşdürəndə yuxarı hərəkət edir) */}
      <div className="catalog-controls-bar" style={{ backgroundColor: theme.bg }}>
        <div className="catalog-controls">
            <div
              className={`catalog-search ${searchFocused ? 'is-focused' : ''} ${searchQuery ? 'has-query' : ''}`}
              style={{ background: theme.bgSecondary, borderColor: theme.border }}
              onFocus={() => setSearchFocused(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setSearchFocused(false);
                }
              }}
            >
              <Search className="catalog-search-icon" size={16} color={isQueryActive ? theme.primary : theme.textMuted} style={{ transition: 'color 0.2s ease' }} />
              <input
                aria-label="Məhsul axtarışı"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Məhsul, model, brend və ya xüsusiyyət axtar..."
                style={{ color: theme.text }}
              />
              {searchQuery && (
                <>
                  <span className="search-spinner" aria-hidden="true" />
                  <button type="button" aria-label="Axtarışı təmizlə" onClick={() => onSearchChange('')}>
                    <X size={15} />
                  </button>
                </>
              )}
              <span className="result-count" style={{ color: theme.textMuted }}>
                <b style={{ color: theme.primary }}>{filteredCount}</b>/{totalCount}
              </span>

              {/* Axtarıs.png dizaynına uyğun ağıllı axtarış pəncərəsi */}
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

          <div className="filter-row category-filter-row no-scrollbar" aria-label="Kateqoriya filtri">
            <button
              className={selectedCategory === 'all' ? 'filter-pill active' : 'filter-pill'}
              onClick={() => onSelectCategory('all')}
              style={pillStyle(theme)}
            >
              Bütün məhsullar
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={selectedCategory === category.id ? 'filter-pill active' : 'filter-pill'}
                onClick={() => onSelectCategory(category.id)}
                style={pillStyle(theme)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
