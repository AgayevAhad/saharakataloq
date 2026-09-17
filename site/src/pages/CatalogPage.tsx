import React, { useState, useMemo, useEffect } from 'react';
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
  ArrowUpDown,
  LayoutGrid,
} from 'lucide-react';
import { Brand, CatalogCategory, CatalogSettings, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ProductCard } from '../components/ProductCard';
import { ShimmerImage } from '../components/ShimmerImage';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';

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
}

type SortOption = 'recommended' | 'price-asc' | 'price-desc' | 'newest' | 'discount';
type ViewMode = 'grid' | 'list';

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
  onSearchChange,
  onSelectProduct,
  onWhatsApp,
  onCall,
  onShare,
  onCopyLink,
  onNavigate,
}) => {
  // Published/active items only
  const activeProducts = useMemo(() => products.filter((p) => p.status !== 'draft'), [products]);
  const activeCategories = useMemo(
    () => [...categories].filter((c) => c.active).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories]
  );
  const activeBrands = useMemo(() => brands.filter((b) => b.active), [brands]);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    initialBrand && initialBrand !== 'all' ? [initialBrand] : []
  );
  const [onlyDiscounted, setOnlyDiscounted] = useState<boolean>(false);
  const [onlyWithVideo, setOnlyWithVideo] = useState<boolean>(false);
  const [selectedEnergyClass, setSelectedEnergyClass] = useState<string>('all');
  const [selectedMotorType, setSelectedMotorType] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Price range calculation
  const allPrices = useMemo(
    () => activeProducts.map((p) => p.price).filter((price): price is number => typeof price === 'number' && price > 0),
    [activeProducts]
  );
  const minAvailablePrice = allPrices.length ? Math.min(...allPrices) : 0;
  const maxAvailablePrice = allPrices.length ? Math.max(...allPrices) : 5000;

  const [minPrice, setMinPrice] = useState<number>(minAvailablePrice);
  const [maxPrice, setMaxPrice] = useState<number>(maxAvailablePrice);

  // Collapsible sidebar sections
  const [openSections, setOpenSections] = useState({
    categories: true,
    brands: true,
    price: true,
    specifications: true,
    special: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Sync initial props if changed from parent
  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (initialBrand && initialBrand !== 'all') {
      setSelectedBrands([initialBrand]);
    }
  }, [initialBrand]);

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

  // Filter products logic
  const filteredProducts = useMemo(() => {
    return activeProducts.filter((p) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = p.title?.toLowerCase().includes(q);
        const matchesModel = p.modelCode?.toLowerCase().includes(q);
        const matchesCategory = p.category?.toLowerCase().includes(q);
        const matchesBrand = p.brandId?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesModel && !matchesCategory && !matchesBrand) return false;
      }

      // Category
      if (selectedCategory && selectedCategory !== 'all') {
        if (p.category !== selectedCategory) return false;
      }

      // Brands (multi-select)
      if (selectedBrands.length > 0) {
        if (!selectedBrands.includes(p.brandId)) return false;
      }

      // Price filter
      if (typeof p.price === 'number') {
        if (p.price < minPrice || p.price > maxPrice) return false;
      }

      // Only Discounted
      if (onlyDiscounted && (!p.oldPrice || p.oldPrice <= (p.price || 0))) {
        return false;
      }

      // Only With Video
      if (onlyWithVideo) {
        const hasVid = !!p.videoUrl || (p.images && p.images.some((img) => img.endsWith('.mp4')));
        if (!hasVid) return false;
      }

      // Energy Class Spec
      if (selectedEnergyClass !== 'all') {
        const energySpec = p.specifications?.['Enerji sinfi'] || p.specifications?.['Enerji Sinfi'] || '';
        if (!energySpec.toLowerCase().includes(selectedEnergyClass.toLowerCase())) return false;
      }

      // Motor Type Spec
      if (selectedMotorType !== 'all') {
        const motorSpec = p.specifications?.['Mühərrik'] || p.specifications?.['Kompressor'] || p.title || '';
        if (!motorSpec.toLowerCase().includes(selectedMotorType.toLowerCase())) return false;
      }

      // Color Spec
      if (selectedColor !== 'all') {
        const colorSpec = p.specifications?.['Rəng'] || p.specifications?.['Material'] || p.title || '';
        if (!colorSpec.toLowerCase().includes(selectedColor.toLowerCase())) return false;
      }

      return true;
    });
  }, [
    activeProducts,
    searchQuery,
    selectedCategory,
    selectedBrands,
    minPrice,
    maxPrice,
    onlyDiscounted,
    onlyWithVideo,
    selectedEnergyClass,
    selectedMotorType,
    selectedColor,
  ]);

  // Sort products logic
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-desc':
        return list.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'newest':
        return list.reverse();
      case 'discount':
        return list.sort((a, b) => {
          const discA = a.oldPrice && a.price ? a.oldPrice - a.price : 0;
          const discB = b.oldPrice && b.price ? b.oldPrice - b.price : 0;
          return discB - discA;
        });
      case 'recommended':
      default:
        return list;
    }
  }, [filteredProducts, sortBy]);

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedBrands([]);
    setMinPrice(minAvailablePrice);
    setMaxPrice(maxAvailablePrice);
    setOnlyDiscounted(false);
    setOnlyWithVideo(false);
    setSelectedEnergyClass('all');
    setSelectedMotorType('all');
    setSelectedColor('all');
    if (onSearchChange) onSearchChange('');
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedBrands.length > 0 ||
    minPrice > minAvailablePrice ||
    maxPrice < maxAvailablePrice ||
    onlyDiscounted ||
    onlyWithVideo ||
    selectedEnergyClass !== 'all' ||
    selectedMotorType !== 'all' ||
    selectedColor !== 'all' ||
    Boolean(searchQuery.trim());

  // Active filter count for mobile badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (minPrice > minAvailablePrice || maxPrice < maxAvailablePrice) count++;
    if (onlyDiscounted) count++;
    if (onlyWithVideo) count++;
    if (selectedEnergyClass !== 'all') count++;
    if (selectedMotorType !== 'all') count++;
    if (selectedColor !== 'all') count++;
    return count;
  }, [
    selectedCategory,
    selectedBrands,
    minPrice,
    maxPrice,
    minAvailablePrice,
    maxAvailablePrice,
    onlyDiscounted,
    onlyWithVideo,
    selectedEnergyClass,
    selectedMotorType,
    selectedColor,
  ]);

  const toggleBrand = (brandId: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId]
    );
  };

  return (
    <div className="catalog-page-wrapper" style={{ minHeight: '100vh', padding: '16px 0 64px' }}>
      <div className="catalog-container" style={{ padding: '0 clamp(16px, 3.5vw, 48px)' }}>
        {/* Page Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
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
              }}
            >
              <span>Məhsul Kataloqu</span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                  color: '#e31e24',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                }}
              >
                {sortedProducts.length} model
              </span>
            </h1>
            <p style={{ fontSize: '13.5px', color: theme.textMuted, margin: '6px 0 0 0' }}>
              Bütün rəsmi dünya brendlərinin orijinal məişət texnikası modelləri və zəmanətli çeşidləri.
            </p>
          </div>

          {/* Search inside catalog */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '360px',
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.textMuted,
              }}
            />
            <input
              type="text"
              placeholder="Model və ya xüsusiyyət axtar..."
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px 10px 38px',
                borderRadius: '12px',
                border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
                backgroundColor: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.75)' : '#ffffff',
                color: theme.text,
                fontSize: '13.5px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#e31e24')}
              onBlur={(e) =>
                (e.target.style.borderColor = themeMode === 'dark' ? 'rgba(255,255,255,0.12)' : '#e2e8f0')
              }
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange && onSearchChange('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: theme.textMuted,
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

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
            paddingBottom: '14px',
            marginBottom: '16px',
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
              backgroundColor: selectedCategory === 'all' ? '#e31e24' : themeMode === 'dark' ? '#1e293b' : '#ffffff',
              color: selectedCategory === 'all' ? '#ffffff' : theme.text,
              border: `1px solid ${selectedCategory === 'all' ? '#e31e24' : themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              boxShadow: selectedCategory === 'all' ? '0 4px 12px rgba(227, 30, 36, 0.3)' : 'none',
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
                  backgroundColor: isSelected ? '#e31e24' : themeMode === 'dark' ? '#1e293b' : '#ffffff',
                  color: isSelected ? '#ffffff' : theme.text,
                  border: `1px solid ${isSelected ? '#e31e24' : themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(227, 30, 36, 0.3)' : 'none',
                }}
              >
                <span>{c.name}</span>
                {count > 0 && <span style={{ fontSize: '11px', opacity: 0.85 }}>({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Top Control Bar: Active Filter Chips, Sort Dropdown & View Mode Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '14px',
            backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
            border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
            marginBottom: '20px',
          }}
        >
          {/* Mobile Filter Drawer Trigger & Active Filter Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
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
                backgroundColor: '#e31e24',
                color: '#ffffff',
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
                <X size={13} style={{ cursor: 'pointer' }} onClick={() => setOnlyDiscounted(false)} />
              </span>
            )}
          </div>

          {/* Sort Selector & View Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpDown size={14} style={{ color: theme.textMuted }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                  border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                  color: theme.text,
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="recommended">Tövsiyə olunan</option>
                <option value="price-asc">Qiymət: Ucuzdan bahaya</option>
                <option value="price-desc">Qiymət: Bahadan ucuza</option>
                <option value="newest">Yeni modellər</option>
                <option value="discount">Ən böyük endirim</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                borderRadius: '8px',
                padding: '2px',
                border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Şəbəkə görünüşü"
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  backgroundColor: viewMode === 'grid' ? (themeMode === 'dark' ? '#334155' : '#ffffff') : 'transparent',
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
                  backgroundColor: viewMode === 'list' ? (themeMode === 'dark' ? '#334155' : '#ffffff') : 'transparent',
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

        {/* 2-Column Catalog Body: Left Sidebar Filters (Desktop) + Right Products Grid */}
        <div style={{ display: 'flex', gap: '28px', alignItems: 'start' }}>
          {/* Desktop Left Sidebar Filters (Hidden on small screens via CSS) */}
          <aside
            className="catalog-desktop-sidebar"
            style={{
              width: '280px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Filter Group: Kateqoriyalar */}
            <div
              style={{
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.45)' : '#ffffff',
                border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
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
                <span style={{ fontSize: '14px', fontWeight: 800, color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} color="#e31e24" />
                  Kateqoriyalar
                </span>
                {openSections.categories ? <ChevronUp size={16} color={theme.textMuted} /> : <ChevronDown size={16} color={theme.textMuted} />}
              </div>

              {openSections.categories && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      backgroundColor: selectedCategory === 'all' ? (themeMode === 'dark' ? '#334155' : '#f1f5f9') : 'transparent',
                      color: selectedCategory === 'all' ? '#e31e24' : theme.text,
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: selectedCategory === 'all' ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>Bütün Kateqoriyalar</span>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>{activeProducts.length}</span>
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
                          backgroundColor: isSelected ? (themeMode === 'dark' ? '#334155' : '#f1f5f9') : 'transparent',
                          color: isSelected ? '#e31e24' : theme.text,
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span>{cat.name}</span>
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
                <span style={{ fontSize: '14px', fontWeight: 800, color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={16} color="#e31e24" />
                  Rəsmi Brendlər
                </span>
                {openSections.brands ? <ChevronUp size={16} color={theme.textMuted} /> : <ChevronDown size={16} color={theme.textMuted} />}
              </div>

              {openSections.brands && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                          backgroundColor: isChecked ? (themeMode === 'dark' ? 'rgba(227, 30, 36, 0.1)' : 'rgba(227, 30, 36, 0.05)') : 'transparent',
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
                            <span style={{ fontSize: '11px', fontWeight: 800, color: theme.text }}>{brand.name}</span>
                          )}

                          <span style={{ fontSize: '13px', fontWeight: isChecked ? 700 : 500, color: theme.text }}>
                            {brand.name}
                          </span>
                        </div>

                        <span style={{ fontSize: '11.5px', color: theme.textMuted }}>({count})</span>
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
                <span style={{ fontSize: '14px', fontWeight: 800, color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SlidersHorizontal size={16} color="#e31e24" />
                  Qiymət Aralığı (₼)
                </span>
                {openSections.price ? <ChevronUp size={16} color={theme.textMuted} /> : <ChevronDown size={16} color={theme.textMuted} />}
              </div>

              {openSections.price && (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', color: theme.textMuted, display: 'block', marginBottom: '4px' }}>Min</label>
                      <input
                        type="number"
                        value={minPrice}
                        min={minAvailablePrice}
                        max={maxPrice}
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
                      <label style={{ fontSize: '11px', color: theme.textMuted, display: 'block', marginBottom: '4px' }}>Maks</label>
                      <input
                        type="number"
                        value={maxPrice}
                        min={minPrice}
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
                <span style={{ fontSize: '14px', fontWeight: 800, color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#e31e24" />
                  Xüsusi Təkliflər
                </span>
                {openSections.special ? <ChevronUp size={16} color={theme.textMuted} /> : <ChevronDown size={16} color={theme.textMuted} />}
              </div>

              {openSections.special && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                <span style={{ fontSize: '14px', fontWeight: 800, color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} color="#e31e24" />
                  Texniki Parametrlər
                </span>
                {openSections.specifications ? <ChevronUp size={16} color={theme.textMuted} /> : <ChevronDown size={16} color={theme.textMuted} />}
              </div>

              {openSections.specifications && (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Energy Class */}
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: theme.textMuted, display: 'block', marginBottom: '6px' }}>
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
                            backgroundColor: selectedEnergyClass === ec ? '#e31e24' : themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
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
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: theme.textMuted, display: 'block', marginBottom: '6px' }}>
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
                            backgroundColor: selectedMotorType === m ? '#e31e24' : themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
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
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: theme.textMuted, display: 'block', marginBottom: '6px' }}>
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
                            backgroundColor: selectedColor === c ? '#e31e24' : themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
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
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: theme.text, margin: '0 0 8px 0' }}>
                  Axtarışınıza uyğun məhsul tapılmadı
                </h3>
                <p style={{ fontSize: '13.5px', color: theme.textMuted, maxWidth: '420px', margin: '0 auto 20px' }}>
                  Seçilmiş kateqoriya, brend və ya qiymət aralığı üzrə heç bir model aşkar edilmədi. Zəhmət olmasa filtrləri dəyişin.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '12px',
                    backgroundColor: '#e31e24',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(227, 30, 36, 0.35)',
                  }}
                >
                  Bütün filtrləri sıfırla
                </button>
              </div>
            ) : (
              <div
                className={`catalog-products-container ${viewMode === 'list' ? 'is-list-view' : 'is-grid-view'}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    viewMode === 'list' ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '20px',
                }}
              >
                {sortedProducts.map((product, idx) => {
                  const brand = activeBrands.find((b) => b.id === product.brandId);
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      theme={theme}
                      brandName={brand?.name}
                      brandOrigin={brand?.originCountry ? `${brand.originCountry} brendi` : ''}
                      rank={idx + 1}
                      whatsappButtonText={settings?.whatsappButtonText}
                      callButtonText={settings?.callButtonText}
                      shareButtonText={settings?.shareButtonText}
                      onSelect={onSelectProduct}
                      onShare={onShare}
                      onWhatsApp={onWhatsApp}
                      onCall={onCall}
                      onCopyLink={onCopyLink}
                    />
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

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
                <span style={{ fontSize: '16px', fontWeight: 800, color: theme.text }}>Məhsul Filtrləri</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Filter Content: Categories, Brands, Price, Flags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              {/* Category selector */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 800, color: theme.text, display: 'block', marginBottom: '8px' }}>
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
                <label style={{ fontSize: '13px', fontWeight: 800, color: theme.text, display: 'block', marginBottom: '8px' }}>
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
                <label style={{ fontSize: '13px', fontWeight: 800, color: theme.text, display: 'block', marginBottom: '8px' }}>
                  Qiymət Aralığı (₼)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    value={minPrice}
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
                    value={maxPrice}
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
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: theme.text }}>
                  <input
                    type="checkbox"
                    checked={onlyDiscounted}
                    onChange={(e) => setOnlyDiscounted(e.target.checked)}
                    style={{ accentColor: '#e31e24' }}
                  />
                  <span>Yalnız endirimli</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: theme.text }}>
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
                  backgroundColor: '#e31e24',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(227, 30, 36, 0.35)',
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
