import React from 'react';
import { ChevronRight, Flame, Wind, Refrigerator, Box, Layers, Sparkles, Zap } from 'lucide-react';
import { CatalogCategory, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from './ShimmerImage';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';

interface VisualCategoryCardsProps {
  categories: CatalogCategory[];
  products: Product[];
  selectedCategory?: string;
  onSelectCategory: (categoryId: string) => void;
  onViewAll?: () => void;
  theme: ThemeColors;
}

const getCategoryIcon = (iconName?: string, categoryId?: string, size = 28, color = '#dc2626') => {
  const normalized = (iconName || categoryId || '').toLowerCase();
  if (
    normalized.includes('flame') ||
    normalized.includes('hob') ||
    normalized.includes('cook') ||
    normalized.includes('soba')
  ) {
    return <Flame size={size} color={color} />;
  }
  if (
    normalized.includes('wind') ||
    normalized.includes('hood') ||
    normalized.includes('aspirator')
  ) {
    return <Wind size={size} color={color} />;
  }
  if (
    normalized.includes('fridge') ||
    normalized.includes('refrigerator') ||
    normalized.includes('soyuducu')
  ) {
    return <Refrigerator size={size} color={color} />;
  }
  if (
    normalized.includes('zap') ||
    normalized.includes('micro') ||
    normalized.includes('electronic')
  ) {
    return <Zap size={size} color={color} />;
  }
  if (normalized.includes('sparkle')) {
    return <Sparkles size={size} color={color} />;
  }
  if (normalized.includes('box') || normalized.includes('package')) {
    return <Box size={size} color={color} />;
  }
  return <Layers size={size} color={color} />;
};

function resolveCategoryRepresentativeImage(products: Product[]): string {
  for (const p of products) {
    // 1. product.image
    if (p.image && !p.image.includes('placeholder') && p.image.trim() !== '') {
      return p.image;
    }
    // 2. product.gallery first real image
    if (Array.isArray(p.gallery) && p.gallery.length > 0) {
      const gImg = p.gallery.find((g) => g && !g.includes('placeholder') && g.trim() !== '');
      if (gImg) return gImg;
    }
    // 3. product.media first image
    if (Array.isArray(p.media) && p.media.length > 0) {
      const mImg = p.media.find(
        (m) => m.type === 'image' && m.url && !m.url.includes('placeholder')
      );
      if (mImg?.url) return mImg.url;
    }
  }
  return '';
}

export const VisualCategoryCards: React.FC<VisualCategoryCardsProps> = ({
  categories,
  products,
  selectedCategory,
  onSelectCategory,
  onViewAll,
  theme,
}) => {
  const { containerRef, scrollItemIntoView, hasMoved, dragProps } =
    useHorizontalScroll<HTMLDivElement>({
      activeSelector: '.visual-category-card.is-selected',
      activeDependency: selectedCategory,
    });

  // Calculate product counts and get representative product image per category
  const activeCategoryCards = categories
    .map((cat) => {
      const categoryProducts = products.filter(
        (p) => p.category === cat.id && p.status === 'published'
      );
      const count = categoryProducts.length;
      const imageUrl = resolveCategoryRepresentativeImage(categoryProducts);

      return {
        ...cat,
        count,
        imageUrl,
      };
    })
    // Strictly filter out categories with 0 active models (Rule 4 / AC-2)
    .filter((cat) => cat.count > 0 && cat.active !== false);

  if (activeCategoryCards.length === 0) {
    return null;
  }

  const handleCategoryClick = (catId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (typeof hasMoved === 'function' && hasMoved()) return;
    onSelectCategory(catId);
    try {
      if (typeof scrollItemIntoView === 'function') {
        scrollItemIntoView(event);
      }
    } catch {
      // safe fallback for test/mock DOM
    }
  };

  return (
    <section
      className="catalog-container visual-categories-section"
      aria-label="Məhsul Kateqoriyaları"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
              fontWeight: 800,
              color: theme.text,
              margin: 0,
            }}
          >
            Məhsul Kateqoriyaları
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: theme.textMuted,
              margin: '3px 0 0 0',
            }}
          >
            Aktiv kataloq bölmələri və modellər
          </p>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.primary,
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            <span>Hamısına bax</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Carousel Track */}
      <div
        ref={containerRef}
        {...dragProps}
        className="visual-category-scroll-track"
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          paddingTop: '2px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          scrollSnapType: 'x mandatory',
          cursor: 'grab',
        }}
        role="region"
        aria-label="Kateqoriyalar karuseli"
      >
        {activeCategoryCards.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={(e) => handleCategoryClick(cat.id, e)}
              className={`visual-category-card ${isSelected ? 'is-selected' : ''}`}
              style={{
                flexShrink: 0,
                width: '339px',
                height: '339px',
                backgroundColor: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: isSelected
                  ? '0 12px 32px rgba(220, 38, 38, 0.15)'
                  : '0 4px 20px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
                scrollSnapAlign: 'start',
                position: 'relative',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
              aria-pressed={isSelected}
            >
              {/* Category Visual Media Box */}
              <div
                className="visual-category-img-box"
                style={{
                  width: '100%',
                  flex: 1,
                  minHeight: '215px',
                  maxHeight: '235px',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '4px',
                  position: 'relative',
                }}
              >
                <div
                  className="visual-category-img-inner"
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {cat.imageUrl ? (
                    <ShimmerImage
                      src={cat.imageUrl}
                      alt={cat.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    getCategoryIcon(cat.icon, cat.id, 48, '#dc2626')
                  )}
                </div>
              </div>

              {/* Category Name & Count */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: isSelected ? '#dc2626' : '#0f172a',
                    lineHeight: 1.35,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.name}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#64748b',
                  }}
                >
                  {cat.count} Model
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
