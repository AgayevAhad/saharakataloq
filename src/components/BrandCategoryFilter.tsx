import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Brand, CatalogCategory, Product } from '../types/product';
import { ThemeColors } from '../types/theme';

interface BrandCategoryFilterProps {
  brand: Brand;
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
  categories,
  products,
  selectedCategory,
  onSelectCategory,
  onBackToBrands,
  theme,
}) => {
  const brandProducts = products.filter((p) => p.brandId === brand.id && p.status !== 'draft');
  const totalCount = brandProducts.length;

  // Calculate only categories that actually have products for this brand
  const availableCategories = categories
    .map((cat) => {
      const count = brandProducts.filter((p) => p.category === cat.id).length;
      return { ...cat, count };
    })
    .filter((cat) => cat.count > 0);

  const coverImage = brandCoverImages[brand.id];

  return (
    <div
      className="brand-category-filter-bar"
      style={{
        backgroundColor: theme.bgCard,
        borderColor: theme.border,
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
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.bgSecondary,
            }}
          >
            <ArrowLeft size={16} />
            <span>Brendlər</span>
          </button>

          <div className="brand-title-badge">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt={brand.name}
                className="brand-filter-logo"
              />
            ) : (
              <span className="brand-filter-name-text">{brand.name}</span>
            )}
            <span
              className="brand-filter-count-badge"
              style={{
                backgroundColor: `${theme.primary}18`,
                color: theme.primary,
                borderColor: `${theme.primary}40`,
              }}
            >
              <Sparkles size={12} /> {totalCount} model
            </span>
          </div>
        </div>

        {brand.originCountry && (
          <span className="brand-origin-badge" style={{ color: theme.textMuted }}>
            {brand.originCountry} brendi
          </span>
        )}
      </div>

      <div className="brand-category-pills-wrap no-scrollbar" role="tablist" aria-label={`${brand.name} kateqoriyaları`}>
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategory === 'all'}
          className={`brand-category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => onSelectCategory('all')}
          style={{
            backgroundColor: selectedCategory === 'all' ? theme.primary : theme.bgSecondary,
            color: selectedCategory === 'all' ? '#ffffff' : theme.text,
            borderColor: selectedCategory === 'all' ? theme.primary : theme.border,
          }}
        >
          <span>Hamısı</span>
          <small className="pill-count">({totalCount})</small>
        </button>

        {availableCategories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`brand-category-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
              style={{
                backgroundColor: isActive ? theme.primary : theme.bgSecondary,
                color: isActive ? '#ffffff' : theme.text,
                borderColor: isActive ? theme.primary : theme.border,
              }}
            >
              <span>{cat.name}</span>
              <small className="pill-count">({cat.count})</small>
            </button>
          );
        })}
      </div>
    </div>
  );
};
