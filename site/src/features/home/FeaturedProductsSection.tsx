import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { FeaturedProductCard } from '../../components/FeaturedProductCard';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { Brand, CatalogCategory, Product } from '../../types/product';
import { ThemeColors } from '../../types/theme';
import {
  buildFeaturedTabs,
  FEATURED_ROWS_PER_PAGE,
  getFeaturedGridColumns,
  sortFeaturedProducts,
} from '../../utils/storefrontCuration';

interface FeaturedProductsSectionProps {
  brands: Brand[];
  categories: CatalogCategory[];
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

export const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({
  brands,
  categories,
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
  const [selectedTab, setSelectedTab] = useState('all');
  const [visibleRows, setVisibleRows] = useState(FEATURED_ROWS_PER_PAGE);
  const [columns, setColumns] = useState(3);
  const gridRef = useRef<HTMLDivElement>(null);

  const publishedProducts = useMemo(
    () => products.filter((product) => product.status === 'published'),
    [products]
  );
  const featuredTabs = useMemo(
    () => buildFeaturedTabs(categories, publishedProducts),
    [categories, publishedProducts]
  );
  const sortedProducts = useMemo(() => {
    const matching =
      selectedTab === 'all'
        ? publishedProducts
        : publishedProducts.filter((product) => product.category === selectedTab);
    return sortFeaturedProducts(matching, brands);
  }, [publishedProducts, selectedTab, brands]);
  const visibleProducts = useMemo(
    () => sortedProducts.slice(0, visibleRows * columns),
    [sortedProducts, visibleRows, columns]
  );
  const hasMore = sortedProducts.length > visibleProducts.length;

  const brandsById = useMemo(() => new Map(brands.map((brand) => [brand.id, brand])), [brands]);
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const comparisonIdSet = useMemo(() => new Set(comparisonIds), [comparisonIds]);

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

  useScrollReveal(
    [selectedTab, visibleProducts.map((product) => product.id).join('|')],
    '.featured-products-grid .scroll-reveal-item'
  );

  const selectTab = (tabId: string) => {
    setSelectedTab(tabId);
    setVisibleRows(FEATURED_ROWS_PER_PAGE);
  };

  return (
    <section
      className="catalog-container featured-products-section"
      aria-label="Önə çıxan məhsullar"
    >
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <h2
            style={{
              fontSize: 'clamp(1.25rem, 2.2vw, 1.5rem)',
              fontWeight: 900,
              color: theme.text,
              margin: 0,
              fontFamily: 'Outfit, -apple-system, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            Önə çıxan məhsullar
          </h2>

          <div
            className="featured-filter-tabs hide-on-mobile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {featuredTabs.map((tab) => {
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => selectTab(tab.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: isActive ? 800 : 500,
                    color: isActive ? '#e31e24' : theme.textMuted || '#64748b',
                    cursor: 'pointer',
                    borderBottom: isActive ? '2px solid #e31e24' : '2px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.name}
                </button>
              );
            })}
          </div>
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
            fontSize: '13px',
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

      <div
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
        {visibleProducts.map((product) => (
          <div
            key={product.id}
            className="featured-product-reveal scroll-reveal-item"
            data-featured-product-reveal={product.id}
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
          Hazırda bu kateqoriyada dərc edilmiş məhsul yoxdur.
        </p>
      )}
      <span className="sr-only" aria-live="polite">
        {visibleProducts.length} məhsul göstərilir.
      </span>
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
