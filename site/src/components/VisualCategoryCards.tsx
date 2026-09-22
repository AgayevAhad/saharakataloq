import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Brand, CatalogCategory, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { FeaturedProductCard } from './FeaturedProductCard';
import { CategoryGlyph } from './CategoryGlyph';

export type CategoryCollageStyle = 'bento' | 'facet' | 'frames' | 'cluster';

export interface CategoryCardData extends CatalogCategory {
  count: number;
  imageUrls: string[];
}

export interface CollageSlideItem {
  id: string;
  title: string;
  style: CategoryCollageStyle;
  categories: CategoryCardData[];
}

export interface VisualCategoryCardsProps {
  categories: CatalogCategory[];
  products: Product[];
  brands?: Brand[];
  selectedCategory?: string;
  onSelectCategory: (categoryId: string) => void;
  onSelectProduct?: (product: Product) => void;
  onViewAll?: () => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  favoriteIds?: string[];
  comparisonIds?: string[];
  onToggleCompare?: (product: Product) => void;
  onWhatsApp?: (product: Product) => void;
  onCall?: (product: Product) => void;
  theme: ThemeColors;
  autoPlayIntervalMs?: number;
}

/**
 * High-Performance Lightweight Category Unit:
 * Displays exactly 2 products side-by-side (339px x 339px) with zero internal timers
 * and zero DOM churn, utilizing CSS containment for 60-120fps smooth scrolling.
 */
const CategoryUnitCard: React.FC<{
  category: CatalogCategory;
  categoryProducts: Product[];
  brandsById: Map<string, Brand>;
  theme: ThemeColors;
  onSelectCategory: (categoryId: string) => void;
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  favoriteIdSet: Set<string>;
  comparisonIdSet: Set<string>;
  onToggleCompare?: (product: Product) => void;
  onWhatsApp?: (product: Product) => void;
  onCall?: (product: Product) => void;
  isSelected?: boolean;
  hasDraggedRef?: React.MutableRefObject<boolean>;
}> = React.memo(({
  category,
  categoryProducts,
  brandsById,
  theme,
  onSelectCategory,
  onSelectProduct,
  onAddToCart,
  onToggleFavorite,
  favoriteIdSet,
  comparisonIdSet,
  onToggleCompare,
  onWhatsApp,
  onCall,
  isSelected,
  hasDraggedRef,
}) => {
  const visibleProducts = useMemo(
    () => categoryProducts.slice(0, 2),
    [categoryProducts]
  );

  const handleCategoryClick = () => {
    if (hasDraggedRef?.current) return;
    onSelectCategory(category.id);
  };

  const handleProductClick = (prod: Product) => {
    if (hasDraggedRef?.current) return;
    if (onSelectProduct) onSelectProduct(prod);
    else onSelectCategory(category.id);
  };

  return (
    <div
      className={`category-unit-box category-unit-card visual-category-card ${isSelected ? 'is-selected' : ''}`}
      style={{
        flexShrink: 0,
        width: '694px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
        boxSizing: 'border-box',
        contain: 'paint layout',
      }}
    >
      {/* Category Unit Header */}
      <div
        className="category-unit-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px',
        }}
      >
        <button
          type="button"
          onClick={handleCategoryClick}
          data-category-id={category.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                theme.mode === 'dark'
                  ? 'rgba(239, 48, 56, 0.16)'
                  : 'rgba(239, 48, 56, 0.08)',
              color: '#e31e24',
              flexShrink: 0,
            }}
          >
            <CategoryGlyph id={category.id} slug={category.slug || category.id} compact plain />
          </div>
          <span
            className="visual-category-title"
            style={{
              fontSize: '15.5px',
              fontWeight: 850,
              color: theme.text,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'visible',
              textOverflow: 'clip',
              maxWidth: 'none',
            }}
          >
            {category.name}
          </span>
        </button>

        <button
          type="button"
          onClick={handleCategoryClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: '#e31e24',
            fontSize: '12px',
            fontWeight: 750,
            cursor: 'pointer',
            padding: '2px 6px',
          }}
        >
          <span>Hamısı</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* 2 FeaturedProductCards Side by Side */}
      <div
        className="category-unit-products-viewport"
        style={{
          width: '694px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          className="category-unit-products-slide"
          style={{
            width: '694px',
            display: 'grid',
            gridTemplateColumns: '339px 339px',
            gap: '16px',
          }}
        >
          {visibleProducts.map((prod, pIdx) => {
            if (!prod) return null;
            return (
              <div
                key={`${prod.id}-${pIdx}`}
                className="category-product-subcard category-carousel-product-card"
                role="button"
                tabIndex={0}
                onClick={() => handleProductClick(prod)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleProductClick(prod);
                  }
                }}
                style={{
                  width: '339px',
                  minWidth: '339px',
                  maxWidth: '339px',
                  height: '339px',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              >
                <FeaturedProductCard
                  product={prod}
                  theme={theme}
                  transparentBg={true}
                  hideBrandAndCategoryMeta={true}
                  onSelect={(p) => {
                    if (hasDraggedRef?.current) return;
                    if (onSelectProduct) onSelectProduct(p);
                    else onSelectCategory(category.id);
                  }}
                  onAddToCart={onAddToCart}
                  onToggleFavorite={onToggleFavorite}
                  isFavorite={favoriteIdSet.has(prod.id)}
                  onToggleCompare={onToggleCompare}
                  isComparing={comparisonIdSet.has(prod.id)}
                  onWhatsApp={onWhatsApp}
                  onCall={onCall}
                  brand={brandsById.get(prod.brandId || '')}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export const VisualCategoryCards: React.FC<VisualCategoryCardsProps> = ({
  categories = [],
  products = [],
  brands = [],
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
  onAddToCart,
  onToggleFavorite,
  favoriteIds = [],
  comparisonIds = [],
  onToggleCompare,
  onWhatsApp,
  onCall,
  theme,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isInViewport, setIsInViewport] = useState(true);

  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentIndex;

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const currentDragDeltaRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  const brandsById = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const comparisonIdSet = useMemo(() => new Set(comparisonIds), [comparisonIds]);

  // Group published products by category ID
  const publishedProductsByCategory = useMemo(() => {
    const grouped = new Map<string, Product[]>();
    for (const product of products) {
      if (product.status !== 'published') continue;
      const catId = product.category;
      const items = grouped.get(catId) || [];
      items.push(product);
      grouped.set(catId, items);
    }
    return grouped;
  }, [products]);

  // Active categories with published products
  const activePopulatedCategories = useMemo(() => {
    return categories
      .filter((cat) => cat.active !== false)
      .map((cat) => {
        const catProducts = publishedProductsByCategory.get(cat.id) || [];
        return {
          category: cat,
          products:
            catProducts.length > 0
              ? catProducts
              : products.filter((p) => p.status !== 'draft').slice(0, 4),
          count: catProducts.length,
        };
      })
      .filter((item) => item.count > 0);
  }, [categories, publishedProductsByCategory, products]);

  const totalCategories = activePopulatedCategories.length;

  // Measure dynamic unit step width (unit width + gap)
  const getUnitStep = (): number => {
    const track = trackRef.current;
    if (!track) return 710;
    const firstUnit = track.querySelector<HTMLElement>('.category-unit-box');
    if (firstUnit) {
      return firstUnit.offsetWidth + 16;
    }
    return 710;
  };

  // IntersectionObserver to pause carousel when offscreen
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

  // Listen to browser tab visibility to pause timers
  const [isTabVisible, setIsTabVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // High-performance Step-and-Pause Carousel interval (paused if offscreen/hidden/hovered/dragging)
  useEffect(() => {
    if (totalCategories <= 1 || isHovered || isDragging || !isInViewport || !isTabVisible) return;

    const intervalTimer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 4500);

    return () => clearInterval(intervalTimer);
  }, [totalCategories, isHovered, isDragging, isInViewport, isTabVisible]);

  // Seamless infinite loop wrap-around handler
  useEffect(() => {
    if (currentIndex >= totalCategories && totalCategories > 0) {
      const resetTimeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(0);
      }, 1100);

      return () => clearTimeout(resetTimeout);
    }
  }, [currentIndex, totalCategories]);

  // Hardware-accelerated direct GPU pointer drag & touch swipe
  const handlePointerDown = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.clientX;
    currentDragDeltaRef.current = 0;
    setIsDragging(true);
    setIsTransitioning(false);

    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 5) {
      hasDraggedRef.current = true;
    }

    currentDragDeltaRef.current = delta;

    // Direct GPU transform update via requestAnimationFrame without triggering React re-renders
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (!isDraggingRef.current || !trackRef.current) return;
        const step = getUnitStep();
        const baseOffset = -currentIndexRef.current * step;
        trackRef.current.style.transform = `translate3d(${baseOffset + currentDragDeltaRef.current}px, 0, 0)`;
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const unitStep = getUnitStep();
    const draggedUnits = -currentDragDeltaRef.current / unitStep;
    let newIndex = Math.round(currentIndexRef.current + draggedUnits);

    if (newIndex < 0) newIndex = 0;
    if (newIndex > totalCategories) newIndex = totalCategories;

    setIsTransitioning(true);
    setCurrentIndex(newIndex);

    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 1.05s cubic-bezier(0.22, 1, 0.36, 1)';
      trackRef.current.style.transform = `translate3d(${-newIndex * unitStep}px, 0, 0)`;
    }

    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 100);
  };

  if (activePopulatedCategories.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="visual-category-infinite-section visual-categories-section scroll-reveal-item"
      aria-label="Məhsul Kateqoriyaları Karuseli"
      style={{
        width: '100vw',
        marginLeft: 'calc(50% - 50vw)',
        marginRight: 'calc(50% - 50vw)',
        maxWidth: '100vw',
        backgroundColor: 'transparent',
        padding: '24px 0 32px',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        contain: 'layout paint',
      }}
    >
      {/* Centered Section Header - Side by Side in Single Row */}
      <div
        className="catalog-container visual-categories-header"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          marginBottom: '20px',
          gap: '12px',
          flexWrap: 'nowrap',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <Sparkles size={18} color="#e31e24" />
          <h2
            className="visual-categories-title"
            style={{
              fontSize: '20px',
              fontWeight: 850,
              letterSpacing: '-0.02em',
              color: theme.text,
              margin: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Məhsul Kateqoriyaları
          </h2>
        </div>
        <span
          className="category-swipe-hint"
          style={{
            fontSize: '13px',
            color: theme.textMuted,
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Sürüşdürərək digər kateqoriyalara baxın <ChevronRight size={14} />
        </span>
      </div>

      {/* Master Outer Carousel with GPU Marquee, Hover Pause, Direct Drag & Touch Swiping */}
      <div
        className={`category-master-marquee-container ${isDragging ? 'is-dragging' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: 'transparent',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'pan-y',
          contain: 'layout paint',
        }}
      >
        <div
          ref={trackRef}
          className="category-master-marquee-track"
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            alignItems: 'stretch',
            gap: '16px',
            width: 'max-content',
            transform: `translate3d(${-currentIndex * getUnitStep()}px, 0, 0)`,
            transition:
              isTransitioning && !isDragging
                ? 'transform 1.05s cubic-bezier(0.22, 1, 0.36, 1)'
                : 'none',
            willChange: 'transform',
            backgroundColor: 'transparent',
            paddingLeft: 0,
            paddingRight: 0,
          }}
        >
          {/* Group 1: Original Category Units Side by Side */}
          {activePopulatedCategories.map(({ category, products: catProds }) => (
            <CategoryUnitCard
              key={`cat-g1-${category.id}`}
              category={category}
              categoryProducts={catProds}
              brandsById={brandsById}
              theme={theme}
              onSelectCategory={onSelectCategory}
              onSelectProduct={onSelectProduct}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
              favoriteIdSet={favoriteIdSet}
              comparisonIdSet={comparisonIdSet}
              onToggleCompare={onToggleCompare}
              onWhatsApp={onWhatsApp}
              onCall={onCall}
              isSelected={selectedCategory === category.id}
              hasDraggedRef={hasDraggedRef}
            />
          ))}

          {/* Group 2: Cloned Category Units for Seamless Infinite Loop */}
          {activePopulatedCategories.map(({ category, products: catProds }) => (
            <CategoryUnitCard
              key={`cat-g2-${category.id}`}
              category={category}
              categoryProducts={catProds}
              brandsById={brandsById}
              theme={theme}
              onSelectCategory={onSelectCategory}
              onSelectProduct={onSelectProduct}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
              favoriteIdSet={favoriteIdSet}
              comparisonIdSet={comparisonIdSet}
              onToggleCompare={onToggleCompare}
              onWhatsApp={onWhatsApp}
              onCall={onCall}
              isSelected={selectedCategory === category.id}
              hasDraggedRef={hasDraggedRef}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
