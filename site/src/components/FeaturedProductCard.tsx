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
        backgroundColor: theme.mode === 'dark' ? '#11141a' : '#ffffff',
        border: `1px solid ${theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#eaecf0'}`,
        borderRadius: '16px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        boxShadow:
          theme.mode === 'dark'
            ? '0 6px 18px -3px rgba(0, 0, 0, 0.35)'
            : '0 4px 14px -3px rgba(0, 0, 0, 0.04)',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease',
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
          top: '12px',
          right: '12px',
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
            color: isFavorite ? '#ef4444' : theme.textMuted || '#94a3b8',
            transition: 'transform 0.15s ease, color 0.15s ease',
          }}
          aria-label={isFavorite ? 'Sevimlilərdən çıxar' : 'Sevimlilərə əlavə et'}
        >
          <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} />
        </button>
      </div>

      {/* Product Image Stage */}
      <div
        style={{
          width: '100%',
          height: '140px',
          borderRadius: '10px',
          backgroundColor: theme.mode === 'dark' ? '#0a0d13' : '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
          overflow: 'hidden',
          padding: '8px',
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

      {/* Product Title */}
      <div
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: theme.text,
          lineHeight: 1.35,
          marginBottom: '12px',
          minHeight: '35px',
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
            fontSize: '15px',
            fontWeight: 900,
            color: theme.text,
            fontFamily: 'Outfit, -apple-system, sans-serif',
          }}
        >
          {displayPrice}
        </span>

        <button
          type="button"
          onClick={handleCartClick}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
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
          <ShoppingCart size={15} color="#ffffff" />
        </button>
      </div>
    </div>
  );
};
