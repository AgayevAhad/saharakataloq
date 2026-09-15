import React, { useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from './ShimmerImage';

interface FeaturedProductCardProps {
  product: Product;
  theme: ThemeColors;
  onSelect: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const FeaturedProductCard: React.FC<FeaturedProductCardProps> = ({
  product,
  theme,
  onSelect,
  onAddToCart,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const rawPrice = product.price ?? (product as any).priceCash;
  const displayPrice = rawPrice
    ? `${Number(rawPrice).toLocaleString('az-AZ')} ₼`
    : '1,299 ₼';

  const coverImage =
    product.image ||
    (Array.isArray(product.gallery) && product.gallery[0]) ||
    (Array.isArray(product.media) && product.media.find((m) => m.type === 'image')?.url) ||
    '/media/products/lotus-tv-43lt2025.jpg';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite((prev) => !prev);
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      onSelect(product);
    }
  };

  return (
    <div
      className="featured-product-card product-card"
      onClick={() => onSelect(product)}
      style={{
        backgroundColor: '#ffffff',
        border: 'none',
        borderRadius: '16px',
        padding: '20px 24px',
        width: '100%',
        maxWidth: '339px',
        height: '339px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(product);
        }
      }}
    >
      {/* Top Row: Favorite Heart Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 3,
        }}
      >
        <button
          type="button"
          onClick={handleFavoriteClick}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: isFavorite ? '#ef4444' : '#94a3b8',
            transition: 'transform 0.15s ease, color 0.15s ease',
          }}
          aria-label={isFavorite ? 'Sevimlilərdən çıxar' : 'Sevimlilərə əlavə et'}
        >
          <Heart size={20} fill={isFavorite ? '#ef4444' : 'none'} />
        </button>
      </div>

      {/* Product Image Stage with Hover Zoom */}
      <div
        className="featured-product-img-box"
        style={{
          width: '100%',
          height: '190px',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          overflow: 'hidden',
          padding: '8px',
        }}
      >
        <div
          className="featured-product-img-inner"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <ShimmerImage
            src={coverImage}
            alt={product.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      </div>

      {/* Product Title */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#0f172a',
          lineHeight: 1.4,
          marginBottom: '14px',
          minHeight: '40px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {product.title}
      </div>

      {/* Bottom Row: Price & Red Cart Button */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontSize: '17px',
            fontWeight: 900,
            color: '#0f172a',
            fontFamily: 'Outfit, -apple-system, sans-serif',
          }}
        >
          {displayPrice}
        </span>

        <button
          type="button"
          onClick={handleCartClick}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: '#e31e24',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(227, 30, 36, 0.35)',
            transition: 'transform 0.15s ease, background-color 0.15s ease',
            flexShrink: 0,
          }}
          aria-label="Səbətə əlavə et"
          title="Səbətə əlavə et"
        >
          <ShoppingCart size={17} color="#ffffff" />
        </button>
      </div>
    </div>
  );
};
