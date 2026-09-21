import { Scale, Trash2, X } from 'lucide-react';
import { Product } from '../../types/product';
import { ThemeColors } from '../../types/theme';
import { ShimmerImage } from '../../components/ShimmerImage';

interface CatalogCompareSidebarProps {
  products: Product[];
  theme: ThemeColors;
  onRemove: (product: Product) => void;
  onClear?: () => void;
  onOpen: () => void;
}

export const CatalogCompareSidebar = ({
  products,
  theme,
  onRemove,
  onClear,
  onOpen,
}: CatalogCompareSidebarProps) => (
  <section className="catalog-compare-sidebar" aria-label="Məhsul müqayisəsi">
    <div className="catalog-compare-sidebar-heading">
      <span>
        <Scale size={17} aria-hidden="true" /> Müqayisə
      </span>
      <span>{products.length}/4</span>
    </div>
    {products.length === 0 ? (
      <p style={{ color: theme.textMuted }}>
        Müqayisə üçün məhsul kartındakı tərəzi işarəsini seçin.
      </p>
    ) : (
      <>
        <div className="catalog-compare-sidebar-items">
          {products.map((product) => (
            <div className="catalog-compare-sidebar-item" key={product.id}>
              {product.image && (
                <ShimmerImage
                  src={product.image}
                  alt={product.title}
                  objectFit="contain"
                  spinnerSize={12}
                  containerStyle={{ width: 46, height: 46, flex: '0 0 46px' }}
                />
              )}
              <span title={product.title}>{product.title}</span>
              <button
                type="button"
                onClick={() => onRemove(product)}
                aria-label={`${product.title} müqayisədən çıxart`}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={`catalog-compare-sidebar-open ${products.length >= 2 ? 'sahara-soft-red-action' : ''}`}
          onClick={onOpen}
          disabled={products.length < 2}
        >
          {products.length < 2 ? 'Daha bir məhsul seçin' : 'Məhsulları müqayisə et'}
        </button>
        {onClear && (
          <button type="button" className="catalog-compare-sidebar-clear" onClick={onClear}>
            <Trash2 size={14} aria-hidden="true" /> Seçimi təmizlə
          </button>
        )}
      </>
    )}
  </section>
);
