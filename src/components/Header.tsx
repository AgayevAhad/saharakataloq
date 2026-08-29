import React, { useEffect, useMemo, useState } from 'react';
import { Ellipsis, Info, Moon, Search, Share2, Sun, X } from 'lucide-react';
import { Brand, CatalogCategory, CatalogSettings, Product, ProductCategory } from '../types/product';
import { ThemeColors } from '../types/theme';
import { SaharaLogo } from './SaharaLogo';
import { BrandMark } from './BrandMark';
import { OfficialInstagramIcon, OfficialFacebookIcon, SocialPopoverButton } from './SocialIcons';

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
  onOpenInverterInfo, onOpenCatalogShare, totalCount, filteredCount,
}) => {
  const [compact, setCompact] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  useEffect(() => {
    let scheduled = false;
    const update = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => { setCompact(window.scrollY > 190); scheduled = false; });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const suggestions = useMemo(() => {
    const needle = searchQuery.trim().toLocaleLowerCase('az');
    const productOptions = products
      .filter((item) => !needle || `${item.code} ${item.title} ${item.categoryName}`.toLocaleLowerCase('az').includes(needle))
      .slice(0, 4)
      .map((item) => ({
        id: `p-${item.id}`,
        title: item.title,
        code: item.code,
        categoryName: item.categoryName,
        image: item.image || item.media?.find((m) => m.type === 'image')?.url || '',
        value: item.code,
      }));
    return productOptions;
  }, [products, searchQuery]);

  const selectCategory = (id: string) => { onSelectCategory(id); setCategoryMenuOpen(false); };

  const isQueryActive = searchQuery.trim().length > 0;

  return <header className={`catalog-header ${compact ? 'is-compact' : ''}`} style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
    <div className="header-top-row">
      <a href="/" className="brand-lockup" aria-label="Sahara Electronics kataloqu">
        <SaharaLogo className="header-sahara-logo" isDark={isDarkMode} />
        <span className="brand-caption" style={{ color: theme.textMuted }}>{settings?.headerCaption || 'Rəsmi məhsul kataloqu'}</span>
      </a>

      <div className="compact-brand-dock" aria-label="Brendlər">
        {brands.map((brand) => <button key={brand.id} disabled={brand.comingSoon} className={selectedBrand === brand.id ? 'active' : ''} onClick={() => onSelectBrand(brand.id)} title={brand.comingSoon ? `${brand.name} — tezliklə` : brand.name}><BrandMark brand={brand} compact /></button>)}
      </div>

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

    <div className="catalog-controls">
      <div className="search-and-menu">
        <div className={`catalog-search ${searchFocused ? 'is-focused' : ''} ${searchQuery ? 'has-query' : ''}`} style={{ background: theme.bgSecondary, borderColor: theme.border }} onFocus={() => setSearchFocused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchFocused(false); }}>
          <Search className="catalog-search-icon" size={16} color={isQueryActive ? theme.primary : theme.textMuted} style={{ transition: 'color 0.2s ease' }} />
          <input aria-label="Məhsul axtarışı" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Məhsul, model, brend və ya xüsusiyyət axtar..." style={{ color: theme.text }} />
          {searchQuery && <><span className="search-spinner" aria-hidden="true" /><button aria-label="Axtarışı təmizlə" onClick={() => onSearchChange('')}><X size={15} /></button></>}
          <span className="result-count" style={{ color: theme.textMuted }}><b style={{ color: theme.primary }}>{filteredCount}</b>/{totalCount}</span>
          {searchFocused && suggestions.length > 0 && <div className="search-suggestions" style={{ background: theme.bgCard, borderColor: theme.border }} role="listbox" aria-label="Axtarış təklifləri">
            {suggestions.map((item) => <button key={item.id} role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => { onSearchChange(item.value); setSearchFocused(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%', padding: '8px 12px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flex: 1, minWidth: 0 }}>
                <Search size={14} color={theme.textMuted} style={{ flexShrink: 0 }} />
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                  <b style={{ color: theme.text, fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</b>
                  <small style={{ color: theme.textMuted, fontSize: '11px' }}>{item.code}{item.categoryName ? ` · ${item.categoryName}` : ''}</small>
                </span>
              </div>
              {item.image ? <img src={item.image} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'contain', backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, flexShrink: 0 }} /> : null}
            </button>)}
          </div>}
        </div>
        <div className="compact-category-menu">
          <button aria-label="Kateqoriyalar" aria-expanded={categoryMenuOpen} onClick={() => setCategoryMenuOpen((value) => !value)} style={{ borderColor: theme.border, color: theme.text }}><Ellipsis /></button>
          {categoryMenuOpen && <div className="category-popover" style={{ background: theme.bgCard, borderColor: theme.border }}><button className={selectedCategory === 'all' ? 'active' : ''} onClick={() => selectCategory('all')}>Bütün məhsullar</button>{categories.map((category) => <button key={category.id} className={selectedCategory === category.id ? 'active' : ''} onClick={() => selectCategory(category.id)}>{category.name}</button>)}</div>}
        </div>
      </div>

      {brands.filter((brand) => !brand.comingSoon).length > 1 && <div className="filter-row brand-filter-row no-scrollbar" aria-label="Brend filtri"><button className={selectedBrand === 'all' ? 'filter-pill active' : 'filter-pill'} onClick={() => onSelectBrand('all')} style={pillStyle(theme)}>Bütün brendlər</button>{brands.filter((brand) => !brand.comingSoon).map((brand) => <button key={brand.id} className={selectedBrand === brand.id ? 'filter-pill active' : 'filter-pill'} onClick={() => onSelectBrand(brand.id)} style={pillStyle(theme)}>{brand.name}</button>)}</div>}
      <div className="filter-row category-filter-row no-scrollbar" aria-label="Kateqoriya filtri"><button className={selectedCategory === 'all' ? 'filter-pill active' : 'filter-pill'} onClick={() => onSelectCategory('all')} style={pillStyle(theme)}>Bütün məhsullar</button>{categories.map((category) => <button key={category.id} className={selectedCategory === category.id ? 'filter-pill active' : 'filter-pill'} onClick={() => onSelectCategory(category.id)} style={pillStyle(theme)}>{category.name}</button>)}</div>
    </div>
  </header>;
};
