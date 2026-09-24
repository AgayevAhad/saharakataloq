import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Filter,
  SlidersHorizontal,
  X,
  RotateCcw,
  Grid,
  List,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
  Tag,
  Flame,
  Layers,
  Zap,
  Check,
  LayoutGrid,
  Scale,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ArrowRight,
  ShoppingCart,
  Phone,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { Brand, CatalogCategory, CatalogSettings, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from '../components/ShimmerImage';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';
import { CatalogProductGrid } from '../features/catalog/CatalogProductGrid';
import { CatalogLocalSearch } from '../features/catalog/CatalogLocalSearch';
import { CatalogCompareSidebar } from '../features/catalog/CatalogCompareSidebar';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { CategoryGlyph } from '../components/CategoryGlyph';
import { verifiedManufacturingCountry } from '../utils/manufacturingCountry';
import { CatalogSortOption } from '../features/catalog/catalogSelection';
import { useCatalogFilters } from '../features/catalog/useCatalogFilters';
import { useCatalogPagination } from '../features/catalog/useCatalogPagination';

const getCategoryIcon = (id: string, slug?: string) => {
  return <CategoryGlyph id={id} slug={slug} compact plain />;
};

export interface CatalogPageProps {
  products: Product[];
  categories: CatalogCategory[];
  brands: Brand[];
  settings?: CatalogSettings;
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  initialCategory?: string | null;
  initialBrand?: string | null;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSelectProduct: (product: Product) => void;
  onWhatsApp: (product: Product | null) => void;
  onCall: (phone?: string) => void;
  onShare: (product: Product | null) => void;
  onCopyLink: (product: Product) => void;
  onNavigate: (route: string, param?: string) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  favoriteIds?: string[];
  comparisonIds?: string[];
  onToggleCompare?: (product: Product) => void;
  onClearCompare?: () => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  products,
  categories,
  brands,
  settings,
  theme,
  themeMode,
  initialCategory,
  initialBrand,
  searchQuery = '',
  onSelectProduct,
  onWhatsApp,
  onCall,
  onShare,
  onCopyLink,
  onNavigate: _onNavigate,
  onAddToCart,
  onToggleFavorite,
  favoriteIds = [],
  comparisonIds = [],
  onToggleCompare,
  onClearCompare,
}) => {
  const {
    activeProducts,
    activeCategories,
    activeBrands,
    selectedCategory,
    setSelectedCategory,
    selectedBrands,
    onlyDiscounted,
    setOnlyDiscounted,
    onlyWithVideo,
    setOnlyWithVideo,
    selectedEnergyClass,
    setSelectedEnergyClass,
    selectedMotorType,
    setSelectedMotorType,
    selectedColor,
    setSelectedColor,
    sortBy,
    setSortBy,
    catalogSearchQuery,
    setCatalogSearchQuery,
    minAvailablePrice,
    maxAvailablePrice,
    selectedMinPrice,
    selectedMaxPrice,
    setMinPrice,
    setMaxPrice,
    sortedProducts,
    resetFilters,
    toggleBrand,
    hasActiveFilters,
    activeFiltersCount,
  } = useCatalogFilters({
    products,
    categories,
    brands,
    initialCategory,
    initialBrand,
    initialSearch: searchQuery,
  });
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const catalogWrapperRef = useRef<HTMLDivElement>(null);

  // In-Catalog Comparison Modal States
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [onlyDifferencesInModal, setOnlyDifferencesInModal] = useState<boolean>(false);

  const comparedProducts = useMemo(() => {
    return (comparisonIds || [])
      .map((id) => activeProducts.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [comparisonIds, activeProducts]);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Collapsible sidebar sections - Official brands collapsed by default per Item 20
  const [openSections, setOpenSections] = useState({
    categories: true,
    brands: false,
    price: true,
    specifications: true,
    special: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Horizontal Quick Pill Scrolling
  const {
    containerRef: pillsContainerRef,
    scrollItemIntoView,
    dragProps,
    hasMoved,
  } = useHorizontalScroll({
    activeSelector: '.catalog-quick-pill.active',
    activeDependency: selectedCategory,
  });

  const { viewMode, setViewMode, viewportColumns, visibleProductCount, showMore } =
    useCatalogPagination({
      resetKey: [
        selectedCategory,
        selectedBrands.join(','),
        Number(onlyDiscounted),
        Number(onlyWithVideo),
        selectedEnergyClass,
        selectedMotorType,
        selectedColor,
        sortBy,
        catalogSearchQuery,
      ].join('|'),
    });

  return (
    <div
      ref={catalogWrapperRef}
      className="catalog-page-wrapper"
      style={{ minHeight: '100vh', padding: '12px 0 48px', width: '100%', boxSizing: 'border-box' }}
    >
      <div
        className="catalog-container"
        style={{
          maxWidth: '1760px',
          margin: '0 auto',
          padding: '0 clamp(16px, 1.5vw, 24px)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div className="catalog-sticky-toolbar">
          <div className="catalog-inline-breadcrumbs">
            <Breadcrumbs items={[{ label: 'Kataloq', current: true }]} />
          </div>
        </div>
        {/* Page Header Bar */}
        <div
          className="catalog-page-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'clamp(22px, 3vw, 32px)',
                fontWeight: 900,
                color: theme.text,
                margin: 0,
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
              }}
            >
              <span>Məhsul Kataloqu</span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor:
                    themeMode === 'dark' ? 'rgba(239, 68, 68, 0.16)' : 'rgba(220, 38, 38, 0.08)',
                  color: themeMode === 'dark' ? '#ef4444' : '#dc2626',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: 'none',
                }}
              >
                {sortedProducts.length} model
              </span>
            </h1>
            <p style={{ fontSize: '13.5px', color: theme.textMuted, margin: '4px 0 0 0' }}>
              Aktiv kataloqda dərc edilmiş brendləri və məhsul məlumatlarını müqayisə edin.
            </p>
          </div>

          {/* Search inside catalog */}
          <CatalogLocalSearch
            value={catalogSearchQuery}
            onChange={setCatalogSearchQuery}
            products={activeProducts}
            categories={activeCategories}
            brands={activeBrands}
            theme={theme}
          />
        </div>

        {/* 2-Column Catalog Body: Left Sidebar Filters (Desktop) + Right Products Grid */}
        <div
          className="catalog-body-layout"
          style={{ display: 'flex', gap: '20px', alignItems: 'start', width: '100%' }}
        >
          {/* Desktop Left Sidebar Filters (Hidden on small screens via CSS) */}
          <aside
            className="catalog-desktop-sidebar"
            style={{
              width: '240px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {onToggleCompare && (
              <CatalogCompareSidebar
                products={comparedProducts}
                theme={theme}
                onRemove={onToggleCompare}
                onClear={onClearCompare}
                onOpen={() => setIsCompareModalOpen(true)}
              />
            )}
            {/* Filter Group: Kateqoriyalar */}
            <div
              style={{
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.45)' : '#ffffff',
                border: 'none',
                borderRadius: '16px',
                padding: '16px',
              }}
            >
              <div
                onClick={() => toggleSection('categories')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Layers size={16} color="#e31e24" />
                  Kateqoriyalar
                </span>
                {openSections.categories ? (
                  <ChevronUp size={16} color={theme.textMuted} />
                ) : (
                  <ChevronDown size={16} color={theme.textMuted} />
                )}
              </div>

              {openSections.categories && (
                <div
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      backgroundColor:
                        selectedCategory === 'all'
                          ? themeMode === 'dark'
                            ? '#334155'
                            : '#f1f5f9'
                          : 'transparent',
                      color: selectedCategory === 'all' ? '#e31e24' : theme.text,
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: selectedCategory === 'all' ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LayoutGrid size={14} style={{ color: '#e31e24' }} />
                      <span>Bütün Kateqoriyalar</span>
                    </span>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>
                      {activeProducts.length}
                    </span>
                  </button>

                  {activeCategories.map((cat) => {
                    const count = activeProducts.filter((p) => p.category === cat.id).length;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          backgroundColor: isSelected
                            ? themeMode === 'dark'
                              ? '#334155'
                              : '#f1f5f9'
                            : 'transparent',
                          color: isSelected ? '#e31e24' : theme.text,
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CategoryGlyph id={cat.id} slug={cat.slug} compact />
                          <span>{cat.name}</span>
                        </span>
                        <span style={{ fontSize: '11px', color: theme.textMuted }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter Group: Rəsmi Brendlər (with original logos) */}
            <div
              style={{
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.45)' : '#ffffff',
                border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                borderRadius: '16px',
                padding: '16px',
              }}
            >
              <div
                onClick={() => toggleSection('brands')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Tag size={16} color="#e31e24" />
                  Rəsmi Brendlər
                </span>
                {openSections.brands ? (
                  <ChevronUp size={16} color={theme.textMuted} />
                ) : (
                  <ChevronDown size={16} color={theme.textMuted} />
                )}
              </div>

              {openSections.brands && (
                <div
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {activeBrands.map((brand) => {
                    const count = activeProducts.filter((p) => p.brandId === brand.id).length;
                    const isChecked = selectedBrands.includes(brand.id);
                    return (
                      <div
                        key={brand.id}
                        role="checkbox"
                        aria-checked={isChecked}
                        aria-label={`${brand.name} brendini seç`}
                        tabIndex={0}
                        onClick={() => toggleBrand(brand.id)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            toggleBrand(brand.id);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: isChecked
                            ? themeMode === 'dark'
                              ? 'rgba(227, 30, 36, 0.1)'
                              : 'rgba(227, 30, 36, 0.05)'
                            : 'transparent',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '5px',
                              border: `2px solid ${isChecked ? '#e31e24' : themeMode === 'dark' ? 'rgba(255,255,255,0.2)' : '#cbd5e1'}`,
                              backgroundColor: isChecked ? '#e31e24' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isChecked && <Check size={13} color="#ffffff" strokeWidth={3} />}
                          </div>

                          {brand.logo ? (
                            <ShimmerImage
                              src={brand.logo}
                              alt={brand.name}
                              spinnerSize={10}
                              containerStyle={{ width: '36px', height: '18px' }}
                              style={{ objectFit: 'contain' }}
                            />
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 800, color: theme.text }}>
                              {brand.name}
                            </span>
                          )}

                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: isChecked ? 700 : 500,
                              color: theme.text,
                            }}
                          >
                            {brand.name}
                          </span>
                        </div>

                        <span style={{ fontSize: '11.5px', color: theme.textMuted }}>
                          ({count})
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter Group: Qiymət Aralığı (AZN) */}
            <div
              style={{
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.45)' : '#ffffff',
                border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                borderRadius: '16px',
                padding: '16px',
              }}
            >
              <div
                onClick={() => toggleSection('price')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <SlidersHorizontal size={16} color="#e31e24" />
                  Qiymət Aralığı (₼)
                </span>
                {openSections.price ? (
                  <ChevronUp size={16} color={theme.textMuted} />
                ) : (
                  <ChevronDown size={16} color={theme.textMuted} />
                )}
              </div>

              {openSections.price && (
                <div
                  style={{
                    marginTop: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          fontSize: '11px',
                          color: theme.textMuted,
                          display: 'block',
                          marginBottom: '4px',
                        }}
                      >
                        Min
                      </label>
                      <input
                        type="number"
                        value={selectedMinPrice}
                        min={minAvailablePrice}
                        max={selectedMaxPrice}
                        onChange={(e) => setMinPrice(Number(e.target.value))}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                          border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                          color: theme.text,
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      />
                    </div>
                    <span style={{ color: theme.textMuted, paddingTop: '18px' }}>—</span>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          fontSize: '11px',
                          color: theme.textMuted,
                          display: 'block',
                          marginBottom: '4px',
                        }}
                      >
                        Maks
                      </label>
                      <input
                        type="number"
                        value={selectedMaxPrice}
                        min={selectedMinPrice}
                        max={maxAvailablePrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                          border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                          color: theme.text,
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Price Presets */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      { label: '< 500 ₼', min: 0, max: 500 },
                      { label: '500 - 1000 ₼', min: 500, max: 1000 },
                      { label: '1000 - 2000 ₼', min: 1000, max: 2000 },
                      { label: '2000 ₼ +', min: 2000, max: maxAvailablePrice },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setMinPrice(preset.min);
                          setMaxPrice(preset.max);
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                          border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                          color: theme.text,
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filter Group: Xüsusi Seçimlər (Discounts & Video) */}
            <div
              style={{
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.45)' : '#ffffff',
                border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                borderRadius: '16px',
                padding: '16px',
              }}
            >
              <div
                onClick={() => toggleSection('special')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Sparkles size={16} color="#e31e24" />
                  Xüsusi Təkliflər
                </span>
                {openSections.special ? (
                  <ChevronUp size={16} color={theme.textMuted} />
                ) : (
                  <ChevronDown size={16} color={theme.textMuted} />
                )}
              </div>

              {openSections.special && (
                <div
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: theme.text,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={onlyDiscounted}
                      onChange={(e) => setOnlyDiscounted(e.target.checked)}
                      style={{ accentColor: '#e31e24', width: '16px', height: '16px' }}
                    />
                    <span>Yalnız endirimli modellər</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: theme.text,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={onlyWithVideo}
                      onChange={(e) => setOnlyWithVideo(e.target.checked)}
                      style={{ accentColor: '#e31e24', width: '16px', height: '16px' }}
                    />
                    <span>Video icmalı olanlar</span>
                  </label>
                </div>
              )}
            </div>

            {/* Filter Group: Texniki Xüsusiyyətlər (Enerji sinfi, Mühərrik, Rəng) */}
            <div
              style={{
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.45)' : '#ffffff',
                border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                borderRadius: '16px',
                padding: '16px',
              }}
            >
              <div
                onClick={() => toggleSection('specifications')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Zap size={16} color="#e31e24" />
                  Texniki Parametrlər
                </span>
                {openSections.specifications ? (
                  <ChevronUp size={16} color={theme.textMuted} />
                ) : (
                  <ChevronDown size={16} color={theme.textMuted} />
                )}
              </div>

              {openSections.specifications && (
                <div
                  style={{
                    marginTop: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  {/* Energy Class */}
                  <div>
                    <label
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: theme.textMuted,
                        display: 'block',
                        marginBottom: '6px',
                      }}
                    >
                      Enerji Sinfi
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['all', 'A+++', 'A++', 'A+', 'A', 'B'].map((ec) => (
                        <button
                          key={ec}
                          type="button"
                          onClick={() => setSelectedEnergyClass(ec)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor:
                              selectedEnergyClass === ec
                                ? '#e31e24'
                                : themeMode === 'dark'
                                  ? '#1e293b'
                                  : '#f1f5f9',
                            color: selectedEnergyClass === ec ? '#ffffff' : theme.text,
                            border: `1px solid ${selectedEnergyClass === ec ? '#e31e24' : themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {ec === 'all' ? 'Hamısı' : ec}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Motor type */}
                  <div>
                    <label
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: theme.textMuted,
                        display: 'block',
                        marginBottom: '6px',
                      }}
                    >
                      Mühərrik / Kompressor
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['all', 'Inverter', 'Standart'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSelectedMotorType(m)}
                          style={{
                            flex: 1,
                            padding: '5px 8px',
                            borderRadius: '6px',
                            backgroundColor:
                              selectedMotorType === m
                                ? '#e31e24'
                                : themeMode === 'dark'
                                  ? '#1e293b'
                                  : '#f1f5f9',
                            color: selectedMotorType === m ? '#ffffff' : theme.text,
                            border: `1px solid ${selectedMotorType === m ? '#e31e24' : themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {m === 'all' ? 'Hamısı' : m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color/Material */}
                  <div>
                    <label
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: theme.textMuted,
                        display: 'block',
                        marginBottom: '6px',
                      }}
                    >
                      Rəng / Material
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['all', 'Inox', 'Qara', 'Ağ', 'Qrafit'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor:
                              selectedColor === c
                                ? '#e31e24'
                                : themeMode === 'dark'
                                  ? '#1e293b'
                                  : '#f1f5f9',
                            color: selectedColor === c ? '#ffffff' : theme.text,
                            border: `1px solid ${selectedColor === c ? '#e31e24' : themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {c === 'all' ? 'Hamısı' : c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Right Area: Products Grid / List */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {/* Horizontal Quick Category Pills with Auto-Centering */}
            <div
              ref={pillsContainerRef}
              {...dragProps}
              className="catalog-quick-pills-row no-scrollbar"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '8px',
                marginBottom: '12px',
                cursor: 'grab',
              }}
            >
              <button
                type="button"
                className={`catalog-quick-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={(e) => {
                  if (hasMoved()) return;
                  scrollItemIntoView(e);
                  setSelectedCategory('all');
                }}
                style={{
                  flexShrink: 0,
                  padding: '8px 16px',
                  borderRadius: '20px',
                  backgroundColor:
                    selectedCategory === 'all'
                      ? themeMode === 'dark'
                        ? 'rgba(239, 68, 68, 0.18)'
                        : 'rgba(220, 38, 38, 0.12)'
                      : themeMode === 'dark'
                        ? '#1e293b'
                        : '#f1f5f9',
                  color:
                    selectedCategory === 'all'
                      ? themeMode === 'dark'
                        ? '#ef4444'
                        : '#dc2626'
                      : theme.text,
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow:
                    selectedCategory === 'all'
                      ? themeMode === 'dark'
                        ? '0 4px 12px rgba(239, 68, 68, 0.2)'
                        : '0 4px 12px rgba(220, 38, 38, 0.08)'
                      : 'none',
                }}
              >
                <LayoutGrid size={14} />
                <span>Bütün Məhsullar</span>
                <span style={{ fontSize: '11px', opacity: 0.85 }}>({activeProducts.length})</span>
              </button>

              {activeCategories.map((c) => {
                const count = activeProducts.filter((p) => p.category === c.id).length;
                const isSelected = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`catalog-quick-pill ${isSelected ? 'active' : ''}`}
                    onClick={(e) => {
                      if (hasMoved()) return;
                      scrollItemIntoView(e);
                      setSelectedCategory(c.id);
                    }}
                    style={{
                      flexShrink: 0,
                      padding: '8px 16px',
                      borderRadius: '20px',
                      backgroundColor: isSelected
                        ? themeMode === 'dark'
                          ? 'rgba(239, 68, 68, 0.18)'
                          : 'rgba(220, 38, 38, 0.12)'
                        : themeMode === 'dark'
                          ? '#1e293b'
                          : '#f1f5f9',
                      color: isSelected
                        ? themeMode === 'dark'
                          ? '#ef4444'
                          : '#dc2626'
                        : theme.text,
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected
                        ? themeMode === 'dark'
                          ? '0 4px 12px rgba(239, 68, 68, 0.2)'
                          : '0 4px 12px rgba(220, 38, 38, 0.08)'
                        : 'none',
                    }}
                  >
                    {getCategoryIcon(c.id, c.slug)}
                    <span>{c.name}</span>
                    {count > 0 && (
                      <span style={{ fontSize: '11px', opacity: 0.85 }}>({count})</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Top Control Bar: Active Filter Chips, Sort Dropdown & View Mode Switcher */}
            <div
              className="catalog-top-controls"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '10px 16px',
                borderRadius: '14px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
                border: 'none',
                marginBottom: '14px',
              }}
            >
              {/* Mobile Filter Drawer Trigger & Active Filter Tags */}
              <div
                className="catalog-filter-actions"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  flex: 1,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="catalog-mobile-filter-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(220, 38, 38, 0.10)',
                    color: '#dc2626',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Filter size={15} />
                  <span>Filtrlər</span>
                  {activeFiltersCount > 0 && (
                    <span
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#e31e24',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '11px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: '#e31e24',
                      border: '1px dashed #e31e24',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>Sıfırla</span>
                  </button>
                )}

                {/* Selected Brand Badges */}
                {selectedBrands.map((bId) => {
                  const brand = activeBrands.find((b) => b.id === bId);
                  return (
                    <span
                      key={bId}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                        border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                        fontSize: '12px',
                        fontWeight: 600,
                        color: theme.text,
                      }}
                    >
                      <span>{brand?.name || bId}</span>
                      <X size={13} style={{ cursor: 'pointer' }} onClick={() => toggleBrand(bId)} />
                    </span>
                  );
                })}

                {onlyDiscounted && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(227, 30, 36, 0.1)',
                      color: '#e31e24',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    <span>Endirimli</span>
                    <X
                      size={13}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setOnlyDiscounted(false)}
                    />
                  </span>
                )}
              </div>

              {/* Sort Selector & View Mode Switcher */}
              <div
                className="catalog-sort-controls"
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                {/* Custom Interactive Sort Dropdown */}
                <div ref={sortRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setIsSortDropdownOpen((prev) => !prev)}
                    className="catalog-sort-custom-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '12px',
                      backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                      border: 'none',
                      color: theme.text,
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.15s ease',
                    }}
                    aria-haspopup="listbox"
                    aria-expanded={isSortDropdownOpen}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {sortBy === 'recommended' && <Sparkles size={14} color="#e31e24" />}
                      {sortBy === 'price-asc' && <ArrowDownNarrowWide size={14} color="#10b981" />}
                      {sortBy === 'price-desc' && <ArrowUpNarrowWide size={14} color="#3b82f6" />}
                      {sortBy === 'newest' && <Flame size={14} color="#f97316" />}
                      {sortBy === 'discount' && <Tag size={14} color="#ec4899" />}
                      <span>
                        {sortBy === 'recommended' && 'Tövsiyə olunan'}
                        {sortBy === 'price-asc' && 'Qiymət: Ucuzdan bahaya'}
                        {sortBy === 'price-desc' && 'Qiymət: Bahadan ucuza'}
                        {sortBy === 'newest' && 'Yeni modellər'}
                        {sortBy === 'discount' && 'Ən böyük endirim'}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      style={{
                        transform: isSortDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: theme.textMuted,
                      }}
                    />
                  </button>

                  {/* Popover Menu */}
                  {isSortDropdownOpen && (
                    <div
                      className="catalog-sort-popover"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        minWidth: '220px',
                        backgroundColor: themeMode === 'dark' ? '#0f172a' : '#ffffff',
                        border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'}`,
                        borderRadius: '14px',
                        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
                        padding: '6px',
                        zIndex: 50,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      {[
                        {
                          value: 'recommended' as CatalogSortOption,
                          label: 'Tövsiyə olunan',
                          icon: <Sparkles size={14} color="#e31e24" />,
                        },
                        {
                          value: 'price-asc' as CatalogSortOption,
                          label: 'Qiymət: Ucuzdan bahaya',
                          icon: <ArrowDownNarrowWide size={14} color="#10b981" />,
                        },
                        {
                          value: 'price-desc' as CatalogSortOption,
                          label: 'Qiymət: Bahadan ucuza',
                          icon: <ArrowUpNarrowWide size={14} color="#3b82f6" />,
                        },
                        {
                          value: 'newest' as CatalogSortOption,
                          label: 'Yeni modellər',
                          icon: <Flame size={14} color="#f97316" />,
                        },
                        {
                          value: 'discount' as CatalogSortOption,
                          label: 'Ən böyük endirim',
                          icon: <Tag size={14} color="#ec4899" />,
                        },
                      ].map((opt) => {
                        const isSelected = sortBy === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setSortBy(opt.value);
                              setIsSortDropdownOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '9px 12px',
                              borderRadius: '8px',
                              backgroundColor: isSelected
                                ? themeMode === 'dark'
                                  ? 'rgba(227, 30, 36, 0.15)'
                                  : 'rgba(227, 30, 36, 0.08)'
                                : 'transparent',
                              color: isSelected ? '#e31e24' : theme.text,
                              border: 'none',
                              fontSize: '13px',
                              fontWeight: isSelected ? 700 : 500,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'background-color 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {opt.icon}
                              <span>{opt.label}</span>
                            </div>
                            {isSelected && <Check size={14} color="#e31e24" strokeWidth={2.5} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* View Mode Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                    borderRadius: '8px',
                    padding: '2px',
                    border: 'none',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    title="Şəbəkə görünüşü"
                    style={{
                      padding: '6px',
                      borderRadius: '6px',
                      backgroundColor:
                        viewMode === 'grid'
                          ? themeMode === 'dark'
                            ? '#334155'
                            : '#ffffff'
                          : 'transparent',
                      color: viewMode === 'grid' ? '#e31e24' : theme.textMuted,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    <Grid size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    title="Siyahı görünüşü"
                    style={{
                      padding: '6px',
                      borderRadius: '6px',
                      backgroundColor:
                        viewMode === 'list'
                          ? themeMode === 'dark'
                            ? '#334155'
                            : '#ffffff'
                          : 'transparent',
                      color: viewMode === 'list' ? '#e31e24' : theme.textMuted,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    <List size={15} />
                  </button>
                </div>
              </div>
            </div>

            {!sortedProducts.length ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '64px 24px',
                  backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                  borderRadius: '20px',
                  border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(227, 30, 36, 0.1)',
                    color: '#e31e24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Search size={28} />
                </div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: theme.text,
                    margin: '0 0 8px 0',
                  }}
                >
                  Axtarışınıza uyğun məhsul tapılmadı
                </h3>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: theme.textMuted,
                    maxWidth: '420px',
                    margin: '0 auto 20px',
                  }}
                >
                  Seçilmiş kateqoriya, brend və ya qiymət aralığı üzrə heç bir model aşkar edilmədi.
                  Zəhmət olmasa filtrləri dəyişin.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(220, 38, 38, 0.10)',
                    color: '#dc2626',
                    border: 'none',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                >
                  Bütün filtrləri sıfırla
                </button>
              </div>
            ) : (
              <>
                <CatalogProductGrid
                  products={sortedProducts.slice(0, visibleProductCount)}
                  brands={activeBrands}
                  viewMode={viewMode}
                  theme={theme}
                  settings={settings}
                  favoriteIds={favoriteIds}
                  comparisonIds={comparisonIds}
                  onSelectProduct={onSelectProduct}
                  onShare={onShare}
                  onWhatsApp={onWhatsApp}
                  onCall={onCall}
                  onCopyLink={onCopyLink}
                  onAddToCart={onAddToCart}
                  onToggleFavorite={onToggleFavorite}
                  onToggleCompare={onToggleCompare}
                />
                {sortedProducts.length > visibleProductCount && (
                  <button type="button" className="catalog-load-more" onClick={showMore}>
                    Daha çox bax{' '}
                    <span>
                      (
                      {Math.min(
                        sortedProducts.length - visibleProductCount,
                        8 * (viewMode === 'list' ? 1 : viewportColumns)
                      )}{' '}
                      model)
                    </span>
                  </button>
                )}
              </>
            )}
          </main>
        </div>
      </div>
      {/* Floating Bottom Comparison Dock */}
      {comparisonIds && comparisonIds.length > 0 && (
        <div
          className="catalog-floating-compare-dock"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 90,
            maxWidth: '94vw',
            width: '680px',
            backgroundColor:
              themeMode === 'dark' ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(226, 232, 240, 0.95)'}`,
            borderRadius: '20px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.22)',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxSizing: 'border-box',
          }}
        >
          {/* Left: Badge & Thumbnail List */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                color: '#2563eb',
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}
            >
              <Scale size={16} />
              <span>Müqayisə ({comparisonIds.length}/4)</span>
            </div>

            {/* Thumbnail previews */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {comparedProducts.map((cp) => (
                <div
                  key={cp.id}
                  style={{
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  title={cp.title}
                >
                  <ShimmerImage
                    src={cp.image || (Array.isArray(cp.gallery) && cp.gallery[0]) || ''}
                    alt={cp.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCompare?.(cp);
                    }}
                    style={{
                      position: 'absolute',
                      top: '1px',
                      right: '1px',
                      width: '15px',
                      height: '15px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.65)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                    aria-label="Müqayisədən çıxar"
                  >
                    <X size={9} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {onClearCompare && (
              <button
                type="button"
                onClick={onClearCompare}
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  color: theme.textMuted,
                  border: `1px solid ${theme.border}`,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Təmizlə
              </button>
            )}

            <button
              type="button"
              className="catalog-open-compare-btn"
              onClick={() => setIsCompareModalOpen(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              }}
            >
              <span>Müqayisə et</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Full In-Catalog Comparison Modal */}
      {isCompareModalOpen && (
        <div
          className="catalog-compare-modal-backdrop"
          onClick={() => setIsCompareModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 220,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="catalog-compare-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '1080px',
              maxHeight: '90vh',
              backgroundColor: themeMode === 'dark' ? '#0f172a' : '#ffffff',
              borderRadius: '24px',
              border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'}`,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Scale size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: theme.text }}>
                    Məhsul Müqayisəsi ({comparedProducts.length} Model)
                  </h3>
                  <span style={{ fontSize: '12px', color: theme.textMuted }}>
                    Texniki göstəricilər və fərqlər
                  </span>
                </div>
              </div>

              {/* Header Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Difference toggle */}
                <button
                  type="button"
                  onClick={() => setOnlyDifferencesInModal((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    backgroundColor: onlyDifferencesInModal
                      ? 'rgba(37, 99, 235, 0.15)'
                      : themeMode === 'dark'
                        ? '#1e293b'
                        : '#f1f5f9',
                    color: onlyDifferencesInModal ? '#2563eb' : theme.text,
                    border: `1px solid ${onlyDifferencesInModal ? '#2563eb' : theme.border}`,
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {onlyDifferencesInModal ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>Yalnız fərqləri göstər</span>
                </button>

                {/* Clear all */}
                {onClearCompare && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearCompare();
                      setIsCompareModalOpen(false);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Təmizlə</span>
                  </button>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                    border: 'none',
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Comparison Table */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {comparedProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: theme.textMuted }}>Müqayisə üçün heç bir məhsul seçilməyib.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      minWidth: `${Math.max(600, comparedProducts.length * 220 + 160)}px`,
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            width: '160px',
                            padding: '12px',
                            textAlign: 'left',
                            fontSize: '13px',
                            fontWeight: 800,
                            color: theme.textMuted,
                            borderBottom: `2px solid ${theme.border}`,
                            verticalAlign: 'bottom',
                          }}
                        >
                          Məhsul
                        </th>
                        {comparedProducts.map((p) => {
                          const rawP = p.price ?? (p as any).priceCash;
                          const pPrice =
                            rawP !== undefined && rawP !== null && Number(rawP) > 0
                              ? `${Number(rawP).toLocaleString('az-AZ')} ₼`
                              : null;
                          return (
                            <th
                              key={p.id}
                              style={{
                                padding: '12px',
                                textAlign: 'center',
                                borderBottom: `2px solid ${theme.border}`,
                                width: `${100 / comparedProducts.length}%`,
                                minWidth: '200px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '8px',
                                }}
                              >
                                {/* Product Image */}
                                <div
                                  style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '12px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    padding: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                  }}
                                >
                                  <ShimmerImage
                                    src={
                                      p.image || (Array.isArray(p.gallery) && p.gallery[0]) || ''
                                    }
                                    alt={p.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => onToggleCompare?.(p)}
                                    style={{
                                      position: 'absolute',
                                      top: '4px',
                                      right: '4px',
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '50%',
                                      backgroundColor: 'rgba(239, 68, 68, 0.9)',
                                      color: '#ffffff',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: 0,
                                    }}
                                    title="Sil"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>

                                {/* Code & Title */}
                                <span
                                  style={{ fontSize: '11px', fontWeight: 800, color: '#e31e24' }}
                                >
                                  {p.code}
                                </span>
                                <span
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: theme.text,
                                    lineHeight: 1.3,
                                    maxHeight: '34px',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {p.title}
                                </span>

                                {pPrice && (
                                  <span
                                    style={{ fontSize: '15px', fontWeight: 900, color: theme.text }}
                                  >
                                    {pPrice}
                                  </span>
                                )}

                                {/* Quick Action Cluster */}
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginTop: '4px',
                                  }}
                                >
                                  {onAddToCart && (
                                    <button
                                      type="button"
                                      onClick={() => onAddToCart(p)}
                                      className="sahara-soft-red-action"
                                      style={{
                                        padding: '5px 10px',
                                        borderRadius: '8px',
                                        backgroundColor: '#dc2626',
                                        color: '#ffffff',
                                        border: 'none',
                                        fontSize: '11.5px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                    >
                                      <ShoppingCart size={13} />
                                      <span>Səbətə at</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onWhatsApp(p)}
                                    className="sahara-soft-green-action"
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '50%',
                                      backgroundColor: '#25D366',
                                      color: '#ffffff',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                    title="WhatsApp"
                                  >
                                    <WhatsAppIcon size={14} color="currentColor" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onCall()}
                                    className="sahara-soft-red-action"
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '50%',
                                      backgroundColor: '#dc2626',
                                      color: '#ffffff',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                    title="Zəng et"
                                  >
                                    <Phone size={12} color="currentColor" />
                                  </button>
                                </div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Brand Row */}
                      {(!onlyDifferencesInModal ||
                        new Set(comparedProducts.map((p) => p.brandId || '')).size > 1) && (
                        <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <td
                            style={{
                              padding: '10px 12px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              color: theme.textMuted,
                            }}
                          >
                            Brend
                          </td>
                          {comparedProducts.map((p) => {
                            const b = activeBrands.find((br) => br.id === p.brandId);
                            return (
                              <td
                                key={p.id}
                                style={{
                                  padding: '10px 12px',
                                  textAlign: 'center',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: theme.text,
                                }}
                              >
                                {b?.name || p.brandId || '-'}
                              </td>
                            );
                          })}
                        </tr>
                      )}

                      {/* Origin Country */}
                      {(!onlyDifferencesInModal ||
                        new Set(comparedProducts.map((p) => verifiedManufacturingCountry(p))).size >
                          1) && (
                        <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <td
                            style={{
                              padding: '10px 12px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              color: theme.textMuted,
                            }}
                          >
                            Mənşə ölkəsi
                          </td>
                          {comparedProducts.map((p) => (
                            <td
                              key={p.id}
                              style={{
                                padding: '10px 12px',
                                textAlign: 'center',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: theme.text,
                              }}
                            >
                              {verifiedManufacturingCountry(p) || '-'}
                            </td>
                          ))}
                        </tr>
                      )}

                      {/* Category */}
                      {(!onlyDifferencesInModal ||
                        new Set(comparedProducts.map((p) => p.categoryName || p.category || ''))
                          .size > 1) && (
                        <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <td
                            style={{
                              padding: '10px 12px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              color: theme.textMuted,
                            }}
                          >
                            Kateqoriya
                          </td>
                          {comparedProducts.map((p) => (
                            <td
                              key={p.id}
                              style={{
                                padding: '10px 12px',
                                textAlign: 'center',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: theme.text,
                              }}
                            >
                              {p.categoryName || p.category || '-'}
                            </td>
                          ))}
                        </tr>
                      )}

                      {/* Energy Class */}
                      {(!onlyDifferencesInModal ||
                        new Set(comparedProducts.map((p) => p.energyClass || '')).size > 1) && (
                        <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <td
                            style={{
                              padding: '10px 12px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              color: theme.textMuted,
                            }}
                          >
                            Enerji Sinfi
                          </td>
                          {comparedProducts.map((p) => (
                            <td
                              key={p.id}
                              style={{
                                padding: '10px 12px',
                                textAlign: 'center',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: theme.text,
                              }}
                            >
                              {p.energyClass || '-'}
                            </td>
                          ))}
                        </tr>
                      )}

                      {/* Motor Type */}
                      {(!onlyDifferencesInModal ||
                        new Set(comparedProducts.map((p) => p.motorType || '')).size > 1) && (
                        <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <td
                            style={{
                              padding: '10px 12px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              color: theme.textMuted,
                            }}
                          >
                            Mühərrik Növü
                          </td>
                          {comparedProducts.map((p) => (
                            <td
                              key={p.id}
                              style={{
                                padding: '10px 12px',
                                textAlign: 'center',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: theme.text,
                              }}
                            >
                              {p.motorType || '-'}
                            </td>
                          ))}
                        </tr>
                      )}

                      {/* Dynamic Specs */}
                      {Array.from(
                        new Set(comparedProducts.flatMap((p) => (p.specs || []).map((s) => s.name)))
                      )
                        .filter((specName) => {
                          if (!onlyDifferencesInModal) return true;
                          const vals = comparedProducts.map((p) => {
                            const found = (p.specs || []).find((s) => s.name === specName);
                            return found ? found.value : '-';
                          });
                          return new Set(vals).size > 1;
                        })
                        .map((specName) => (
                          <tr key={specName} style={{ borderBottom: `1px solid ${theme.border}` }}>
                            <td
                              style={{
                                padding: '10px 12px',
                                fontSize: '12.5px',
                                fontWeight: 700,
                                color: theme.textMuted,
                              }}
                            >
                              {specName}
                            </td>
                            {comparedProducts.map((p) => {
                              const found = (p.specs || []).find((s) => s.name === specName);
                              return (
                                <td
                                  key={p.id}
                                  style={{
                                    padding: '10px 12px',
                                    textAlign: 'center',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: theme.text,
                                  }}
                                >
                                  {found ? found.value : '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Responsive Filter Drawer */}
      {isMobileDrawerOpen && (
        <div
          className="catalog-filter-drawer-backdrop"
          onClick={() => setIsMobileDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 180,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            className="catalog-filter-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '340px',
              height: '100%',
              backgroundColor: themeMode === 'dark' ? '#0f172a' : '#ffffff',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              padding: '20px',
              boxSizing: 'border-box',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={18} color="#e31e24" />
                <span style={{ fontSize: '16px', fontWeight: 800, color: theme.text }}>
                  Məhsul Filtrləri
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.textMuted,
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Filter Content: Categories, Brands, Price, Flags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              {/* Category selector */}
              <div>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: theme.text,
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Kateqoriyalar
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                    border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                    color: theme.text,
                    fontSize: '13.5px',
                    fontWeight: 600,
                  }}
                >
                  <option value="all">Bütün Kateqoriyalar ({activeProducts.length})</option>
                  {activeCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({activeProducts.filter((p) => p.category === cat.id).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Brands selection */}
              <div>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: theme.text,
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Rəsmi Brendlər
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeBrands.map((b) => (
                    <label
                      key={b.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        color: theme.text,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        aria-label={`${b.name} brendini seç`}
                        checked={selectedBrands.includes(b.id)}
                        onChange={() => toggleBrand(b.id)}
                        style={{ accentColor: '#e31e24', width: '16px', height: '16px' }}
                      />
                      <span>{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: theme.text,
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Qiymət Aralığı (₼)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    value={selectedMinPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    placeholder="Min"
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                      border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                      color: theme.text,
                    }}
                  />
                  <input
                    type="number"
                    value={selectedMaxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    placeholder="Maks"
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                      border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                      color: theme.text,
                    }}
                  />
                </div>
              </div>

              {/* Switches */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    color: theme.text,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={onlyDiscounted}
                    onChange={(e) => setOnlyDiscounted(e.target.checked)}
                    style={{ accentColor: '#e31e24' }}
                  />
                  <span>Yalnız endirimli</span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    color: theme.text,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={onlyWithVideo}
                    onChange={(e) => setOnlyWithVideo(e.target.checked)}
                    style={{ accentColor: '#e31e24' }}
                  />
                  <span>Video icmalı olan</span>
                </label>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div
              style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                display: 'flex',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                  color: theme.text,
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Sıfırla
              </button>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(220, 38, 38, 0.10)',
                  color: '#dc2626',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'none',
                }}
              >
                Göstər ({sortedProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
