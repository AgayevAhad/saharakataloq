import React, { useMemo } from 'react';
import { ProductCard } from '../../components/ProductCard';
import { Brand, CatalogSettings, Product } from '../../types/product';
import { ThemeColors } from '../../types/theme';

interface CatalogProductGridProps {
  products: Product[];
  brands: Brand[];
  viewMode: 'grid' | 'list';
  theme: ThemeColors;
  settings?: CatalogSettings;
  favoriteIds: string[];
  comparisonIds: string[];
  onSelectProduct: (product: Product) => void;
  onShare: (product: Product | null) => void;
  onWhatsApp: (product: Product | null) => void;
  onCall: (phone?: string) => void;
  onCopyLink: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  onToggleCompare?: (product: Product) => void;
}

export const CatalogProductGrid: React.FC<CatalogProductGridProps> = ({
  products,
  brands,
  viewMode,
  theme,
  settings: _settings,
  favoriteIds,
  comparisonIds,
  onSelectProduct,
  onShare,
  onWhatsApp,
  onCall,
  onCopyLink,
  onAddToCart,
  onToggleFavorite,
  onToggleCompare,
}) => {
  const brandsById = useMemo(() => new Map(brands.map((brand) => [brand.id, brand])), [brands]);
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const comparisonIdSet = useMemo(() => new Set(comparisonIds), [comparisonIds]);

  return (
    <div
      className={`catalog-products-container ${viewMode === 'list' ? 'is-list-view' : 'is-grid-view'}`}
      style={{
        display: 'grid',
        gridTemplateColumns:
          viewMode === 'list' ? '1fr' : 'repeat(auto-fill, minmax(339px, 339px))',
        gap: '16px',
        width: '100%',
        justifyItems: 'start',
        justifyContent: 'flex-start',
      }}
    >
      {products.map((product) => {
        const brand = brandsById.get(product.brandId);
        return (
          <div
            key={product.id}
            className="catalog-product-reveal scroll-reveal-item"
            data-catalog-product-reveal={product.id}
          >
            <ProductCard
              product={product}
              theme={theme}
              brand={brand}
              brandName={brand?.name}
              onSelect={onSelectProduct}
              onShare={onShare ? () => onShare(product) : undefined}
              onWhatsApp={onWhatsApp ? () => onWhatsApp(product) : undefined}
              onCall={onCall ? () => onCall() : undefined}
              onCopyLink={onCopyLink ? () => onCopyLink(product) : undefined}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favoriteIdSet.has(product.id)}
              onToggleCompare={onToggleCompare}
              isComparing={comparisonIdSet.has(product.id)}
            />
          </div>
        );
      })}
    </div>
  );
};
