import React, { useState } from 'react';
import { Search, Menu, Moon, Sun, Scale, Heart, Sparkles, MapPin, ShieldCheck, ChevronDown, Layers } from 'lucide-react';
import { Brand, CatalogCategory, Product, CatalogSettings } from '../../types/product';
import { ThemeColors } from '../../types/theme';
import { TopServiceBar } from './TopServiceBar';
import { MegaMenu } from './MegaMenu';
import { SaharaLogo } from '../SaharaLogo';

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
  onSearchChange,
  onOpenSearchModal,
  comparisonCount,
  favoritesCount,
  onOpenSaharaMatch,
}) => {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  return (
    <div className="site-header-wrapper" style={{ position: 'relative', zIndex: 1000 }}>
      {/* Top Utilities Bar */}
      <TopServiceBar settings={settings} theme={theme} onNavigate={onNavigate} />

      {/* Main Sticky Header */}
      <header
        className="site-header-sticky"
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: theme.mode === 'dark' ? 'rgba(13, 17, 23, 0.95)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${theme.border}`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.25s ease',
        }}
      >
        <div
          className="catalog-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '12px 16px',
          }}
        >
          {/* Logo & Brand Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: 0,
              }}
              aria-label="Sahara Electronics Əsas Səhifə"
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                }}
              >
                <img src="/media/SaharaLogo.png" alt="Sahara" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1.1, color: theme.text }}>
                  SAHARA
                </div>
                <div style={{ fontSize: '10px', color: theme.textMuted, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Electronics
                </div>
              </div>
            </button>

            {/* "Bütün Kateqoriyalar" Mega-Menu Trigger */}
            <button
              type="button"
              onClick={() => setIsMegaMenuOpen((prev) => !prev)}
              aria-expanded={isMegaMenuOpen}
              className="mega-menu-trigger-btn"
              style={{
                backgroundColor: isMegaMenuOpen ? theme.primary : (theme.mode === 'dark' ? '#1e293b' : '#f1f5f9'),
                color: isMegaMenuOpen ? '#ffffff' : theme.text,
                border: `1px solid ${isMegaMenuOpen ? theme.primary : theme.border}`,
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Layers size={16} />
              <span>Kateqoriyalar</span>
              <ChevronDown size={14} style={{ transform: isMegaMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
            </button>
          </div>

          {/* Center: Smart Search Input Bar */}
          <div style={{ flex: 1, maxWidth: '480px', position: 'relative' }} className="header-search-wrap">
            <button
              type="button"
              onClick={onOpenSearchModal}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                borderRadius: '12px',
                backgroundColor: theme.mode === 'dark' ? '#161d2b' : '#f8fafc',
                border: `1px solid ${theme.border}`,
                color: theme.textMuted,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
              aria-label="Axtarış pəncərəsini aç"
            >
              <Search size={16} style={{ color: theme.primary }} />
              <span style={{ flex: 1 }}>{searchQuery || 'Model, xüsusiyyət və ya brend axtarın (məs: 201GC, SABAF)...'}</span>
              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: theme.mode === 'dark' ? '#273549' : '#e2e8f0', color: theme.text }}>
                ⌘K
              </span>
            </button>
          </div>

          {/* Right Action Icons Dock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Sahara Match Button */}
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
              <span className="hide-on-mobile">Sahara Match</span>
            </button>

            {/* Comparison */}
            <button
              type="button"
              onClick={() => onNavigate('compare')}
              style={{
                position: 'relative',
                background: theme.mode === 'dark' ? '#161d2b' : '#f1f5f9',
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

            {/* Favorites */}
            <button
              type="button"
              onClick={() => onNavigate('favorites')}
              style={{
                position: 'relative',
                background: theme.mode === 'dark' ? '#161d2b' : '#f1f5f9',
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

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              style={{
                background: theme.mode === 'dark' ? '#161d2b' : '#f1f5f9',
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

        {/* Secondary Navigation Row (Quick Tabs) */}
        <div
          style={{
            borderTop: `1px solid ${theme.border}`,
            backgroundColor: theme.mode === 'dark' ? 'rgba(11, 15, 23, 0.6)' : 'rgba(248, 250, 252, 0.8)',
            padding: '4px 0',
          }}
          className="header-secondary-nav"
        >
          <div
            className="catalog-container"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {[
              { id: 'home', label: 'Ana Səhifə' },
              { id: 'catalog', label: 'Məhsul Kataloqu' },
              { id: 'brands', label: 'Rəsmi Brendlər' },
              { id: 'services', label: 'Xidmətlər & Sahara Care' },
              { id: 'stores', label: 'Sərgi Salonları & Əlaqə' },
              { id: 'guides', label: 'Seçim Bələdçisi' },
              { id: 'support', label: 'Müştəri Dəstəyi & FAQ' },
            ].map((tab) => {
              const isActive = currentRoute === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setIsMegaMenuOpen(false);
                    onNavigate(tab.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 4px',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? theme.primary : theme.text,
                    borderBottom: isActive ? `2px solid ${theme.primary}` : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* MegaMenu Dropdown Panel */}
      <MegaMenu
        isOpen={isMegaMenuOpen}
        onClose={() => setIsMegaMenuOpen(false)}
        categories={categories}
        brands={brands}
        theme={theme}
        onSelectCategory={(catId) => onNavigate('catalog', catId)}
        onSelectBrand={(brandId) => onNavigate('brand_detail', brandId)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
