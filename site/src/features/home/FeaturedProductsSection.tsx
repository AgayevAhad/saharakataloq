import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { FeaturedProductCard } from '../../components/FeaturedProductCard';
import { Brand, CatalogCategory, Product } from '../../types/product';
import { ThemeColors } from '../../types/theme';
import {
  CURATED_FEATURED_TABS,
  CuratedTab,
  FEATURED_ROWS_PER_PAGE,
  getCuratedTabProducts,
  getFeaturedGridColumns,
} from '../../utils/storefrontCuration';

interface FeaturedProductsSectionProps {
  brands: Brand[];
  categories?: CatalogCategory[];
  products: Product[];
  theme: ThemeColors;
  onNavigateCatalog: () => void;
  onSelectProduct: (product: Product) => void;
  onWhatsApp: (product: Product) => void;
  onCall: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  favoriteIds?: string[];
  comparisonIds?: string[];
  onToggleCompare?: (product: Product) => void;
}

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const TAB_DURATION_MS = 5000;

export const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({
  brands,
  products,
  theme,
  onNavigateCatalog,
  onSelectProduct,
  onWhatsApp,
  onCall,
  onAddToCart,
  onToggleFavorite,
  favoriteIds = [],
  comparisonIds = [],
  onToggleCompare,
}) => {
  const [selectedTab, setSelectedTab] = useState<CuratedTab['id']>('featured');
  const [tabKey, setTabKey] = useState(0);
  const [visibleRows, setVisibleRows] = useState(FEATURED_ROWS_PER_PAGE);
  const [columns, setColumns] = useState(3);
  const gridRef = useRef<HTMLDivElement>(null);

  const publishedProducts = useMemo(
    () => products.filter((product) => product.status === 'published'),
    [products]
  );

  const sortedProducts = useMemo(
    () => getCuratedTabProducts(selectedTab, publishedProducts, brands),
    [selectedTab, publishedProducts, brands]
  );

  const visibleProducts = useMemo(
    () => sortedProducts.slice(0, visibleRows * columns),
    [sortedProducts, visibleRows, columns]
  );

  const hasMore = sortedProducts.length > visibleProducts.length;
  const brandsById = useMemo(() => new Map(brands.map((brand) => [brand.id, brand])), [brands]);
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const comparisonIdSet = useMemo(() => new Set(comparisonIds), [comparisonIds]);

  const sectionRef = useRef<HTMLElement>(null);
  const [isInViewport, setIsInViewport] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  // Viewport intersection observer: only rotate tabs when visible
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { rootMargin: '100px', threshold: 0.05 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Document tab visibility listener
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibility = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility, { passive: true });
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Responsive column detection
  useBrowserLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const width = grid.clientWidth;
      if (width > 0) setColumns(getFeaturedGridColumns(width));
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(grid);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', measure, { passive: true });
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Exact 5-second auto-rotation timer: advances tabs when in viewport and tab is active
  useEffect(() => {
    if (!isInViewport || !isTabVisible) return;

    const timer = setTimeout(() => {
      setSelectedTab((prevTab) => {
        const currentIdx = CURATED_FEATURED_TABS.findIndex((t) => t.id === prevTab);
        const nextIdx = (currentIdx + 1) % CURATED_FEATURED_TABS.length;
        return CURATED_FEATURED_TABS[nextIdx].id;
      });
      setVisibleRows(FEATURED_ROWS_PER_PAGE);
      setTabKey((k) => k + 1);
    }, TAB_DURATION_MS);

    return () => clearTimeout(timer);
  }, [selectedTab, tabKey, isInViewport, isTabVisible]);

  const selectTab = (tabId: CuratedTab['id']) => {
    setSelectedTab(tabId);
    setVisibleRows(FEATURED_ROWS_PER_PAGE);
    setTabKey((k) => k + 1);
  };

  return (
    <section
      ref={sectionRef}
      className="catalog-container featured-products-section"
      aria-label="Önə çıxan məhsullar"
      style={{
        contain: 'layout paint',
      }}
    >
      {/* 4 Curated Tabs in Section Header with 5s Progress Line */}
      <div
        className="featured-section-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div
          className="featured-curated-tabs"
          role="tablist"
          aria-label="Vitrin kateqoriya seçimləri"
        >
          {CURATED_FEATURED_TABS.map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectTab(tab.id)}
                className={`featured-tab-btn ${isActive ? 'is-active' : ''}`}
                style={{
                  color: isActive
                    ? '#dc2626'
                    : theme.mode === 'dark'
                      ? '#94a3b8'
                      : '#64748b',
                }}
              >
                <span>{tab.name}</span>
                <div
                  className="featured-tab-progress-track"
                  style={{
                    backgroundColor: isActive
                      ? 'rgba(220, 38, 38, 0.14)'
                      : 'transparent',
                  }}
                >
                  {isActive && (
                    <div
                      key={`${tab.id}-${tabKey}`}
                      className="featured-tab-progress-fill"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onNavigateCatalog}
          className="featured-view-all"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#e31e24',
            fontWeight: 800,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 6px',
          }}
        >
          <span>Hamısına bax</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Grid of Product Cards with Top-to-Bottom Staggered Cascade Entrance Animation */}
      <div
        key={selectedTab}
        ref={gridRef}
        className="featured-products-grid"
        data-visible-rows={visibleRows}
        data-column-count={columns}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(339px, 1fr))',
          gap: '16px',
          justifyItems: 'start',
          justifyContent: 'flex-start',
        }}
      >
        {visibleProducts.map((product, pIdx) => (
          <div
            key={product.id}
            className="featured-product-reveal featured-product-cascade"
            data-featured-product-reveal={product.id}
            style={{
              animationDelay: `${pIdx * 35}ms`,
            }}
          >
            <FeaturedProductCard
              product={product}
              theme={theme}
              onSelect={onSelectProduct}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favoriteIdSet.has(product.id)}
              onToggleCompare={onToggleCompare}
              isComparing={comparisonIdSet.has(product.id)}
              onWhatsApp={onWhatsApp}
              onCall={onCall}
              brand={brandsById.get(product.brandId || '')}
            />
          </div>
        ))}
      </div>

      {sortedProducts.length === 0 && (
        <p className="featured-products-empty" style={{ color: theme.textMuted }}>
          Hazırda bu bölmədə dərc edilmiş məhsul yoxdur.
        </p>
      )}

      <span className="sr-only" aria-live="polite">
        {visibleProducts.length} məhsul göstərilir.
      </span>

      {/* Load more ("Ardına bax") button expanding by 4 rows */}
      {(hasMore || visibleRows > FEATURED_ROWS_PER_PAGE) && (
        <div className="featured-load-more-wrap">
          <button
            type="button"
            className="featured-load-more"
            data-testid="featured-load-more"
            disabled={!hasMore}
            onClick={() => setVisibleRows((rows) => rows + FEATURED_ROWS_PER_PAGE)}
          >
            {hasMore ? 'Daha çox göstər' : 'Bütün məhsullar göstərildi'}
            {hasMore && <ChevronRight size={16} aria-hidden="true" />}
          </button>
        </div>
      )}
    </section>
  );
};
