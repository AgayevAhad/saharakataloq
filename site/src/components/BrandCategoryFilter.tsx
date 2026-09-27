import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Brand, CatalogCategory, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from './ShimmerImage';
import { CategoryGlyph } from './CategoryGlyph';

import { useHorizontalScroll } from '../hooks/useHorizontalScroll';

interface BrandCategoryFilterProps {
  brand?: Brand;
  brands?: Brand[];
  categories: CatalogCategory[];
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onBackToBrands: () => void;
  theme: ThemeColors;
}

const brandCoverImages: Record<string, string> = {
  ardo: '/media/products/ardo-6331-gb.jpg',
  lotus: '/media/products/lotus-oven-lt-829-full-touch-black.jpg',
};

export const BrandCategoryFilter: React.FC<BrandCategoryFilterProps> = ({
  brand,
  brands,
  categories,
  products,
  selectedCategory,
  onSelectCategory,
  onBackToBrands,
  theme,
}) => {
  const activeBrandsList = React.useMemo(() => {
    if (brands && brands.length > 0) return brands;
    if (brand) return [brand];
    return [];
  }, [brands, brand]);

  const activeBrandIds = React.useMemo(
    () => activeBrandsList.map((b) => b.id.toLowerCase()),
    [activeBrandsList]
  );

  const brandProducts = React.useMemo(
    () =>
      products.filter(
        (p) => activeBrandIds.includes((p.brandId || '').toLowerCase()) && p.status !== 'draft'
      ),
    [products, activeBrandIds]
  );
  const totalCount = brandProducts.length;

  const {
    containerRef: pillsRef,
    scrollItemIntoView,
    dragProps,
    hasMoved,
  } = useHorizontalScroll({
    activeSelector: '.brand-category-pill.active',
    activeDependency: selectedCategory,
  });

  // Calculate only categories that actually have products for the selected brands
  const availableCategories = React.useMemo(
    () =>
      categories
        .map((cat) => {
          const count = brandProducts.filter((p) => p.category === cat.id).length;
          return { ...cat, count };
        })
        .filter((cat) => cat.count > 0),
    [categories, brandProducts]
  );

  const primaryBrand = activeBrandsList[0];
  const coverImage = primaryBrand ? brandCoverImages[primaryBrand.id.toLowerCase()] : undefined;

  const originsText = activeBrandsList
    .map((b) => b.originCountry)
    .filter(Boolean)
    .join(' / ');

  const brandsLabel = activeBrandsList.map((b) => b.name).join(', ');

  return (
    <div
      className="brand-category-filter-bar"
      style={{
        backgroundColor: theme.bgCard,
        border: 'none',
      }}
    >
      {coverImage && (
        <div
          className="brand-filter-bar-backdrop"
          style={{
            backgroundImage: `url(${coverImage})`,
          }}
          aria-hidden="true"
        />
      )}
      <div className="brand-category-filter-header">
        <div className="brand-category-title-wrap">
          <button
            type="button"
            className="brand-back-btn"
            onClick={onBackToBrands}
            title="Bütün brendlərə qayıt"
            style={{
              border: 'none',
              color: theme.text,
              backgroundColor: 'transparent',
            }}
          >
            <ArrowLeft size={16} />
            <span>Brendlər</span>
          </button>

          <div
            className="brand-title-badge"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}
          >
            {activeBrandsList.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
                }}
              >
                {b.logo ? (
                  <ShimmerImage
                    src={b.logo}
                    alt={b.name}
                    spinnerSize={14}
                    className="brand-filter-logo"
                    containerStyle={{ width: '80px', height: '32px' }}
                  />
                ) : (
                  <span className="brand-filter-name-text" style={{ color: '#0f172a' }}>
                    {b.name}
                  </span>
                )}
              </div>
            ))}
            <span
              className="brand-filter-count-badge"
              style={{
                backgroundColor: `${theme.primary}18`,
                color: theme.primary,
                border: 'none',
              }}
            >
              <Sparkles size={12} /> {totalCount} model
            </span>
          </div>
        </div>

        {originsText && (
          <span className="brand-origin-badge" style={{ color: theme.textMuted }}>
            {originsText} {activeBrandsList.length > 1 ? 'brendləri' : 'brendi'}
          </span>
        )}
      </div>

      <div
        ref={pillsRef}
        {...dragProps}
        className="brand-category-pills-wrap no-scrollbar"
        role="tablist"
        aria-label={`${brandsLabel || 'Brend'} kateqoriyaları`}
        style={{ cursor: 'grab' }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategory === 'all'}
          className={`brand-category-pill ${selectedCategory === 'all' ? 'active sahara-soft-red-action' : ''}`}
          onClick={(e) => {
            if (hasMoved()) return;
            scrollItemIntoView(e);
            onSelectCategory('all');
          }}
          style={{
            backgroundColor: selectedCategory === 'all' ? `${theme.primary}18` : theme.bgSecondary,
            color: selectedCategory === 'all' ? theme.primary : theme.text,
            border: 'none',
            fontWeight: selectedCategory === 'all' ? 750 : 600,
          }}
        >
          <CategoryGlyph id="all" compact plain />
          <span>Hamısı</span>
          <small
            className="pill-count"
            style={{
              color: selectedCategory === 'all' ? theme.primary : theme.textMuted,
              fontWeight: 700,
              marginLeft: '4px',
            }}
          >
            ({totalCount})
          </small>
        </button>

        {availableCategories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`brand-category-pill ${isActive ? 'active sahara-soft-red-action' : ''}`}
              onClick={(e) => {
                if (hasMoved()) return;
                scrollItemIntoView(e);
                onSelectCategory(cat.id);
              }}
              style={{
                backgroundColor: isActive ? `${theme.primary}18` : theme.bgSecondary,
                color: isActive ? theme.primary : theme.text,
                border: 'none',
                fontWeight: isActive ? 750 : 600,
              }}
            >
              <CategoryGlyph id={cat.id} slug={cat.slug} compact plain />
              <span>{cat.name}</span>
              <small
                className="pill-count"
                style={{
                  color: isActive ? theme.primary : theme.textMuted,
                  fontWeight: 700,
                  marginLeft: '4px',
                }}
              >
                ({cat.count})
              </small>
            </button>
          );
        })}
      </div>
    </div>
  );
};
