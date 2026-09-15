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
  theme: _theme,
  onSelect,
  onAddToCart,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const rawPrice = product.price ?? (product as any).priceCash;
  const displayPrice =
    rawPrice !== undefined && rawPrice !== null && Number(rawPrice) > 0
      ? `${Number(rawPrice).toLocaleString('az-AZ')} ₼`
      : null;

  const coverImage =
    product.image ||
    (Array.isArray(product.gallery) && product.gallery[0]) ||
    (Array.isArray(product.media) && product.media.find((m) => m.type === 'image')?.url) ||
    '';

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
      className={`featured-product-card product-card ${isHovered ? 'is-card-hovered' : ''}`}
      onClick={() => onSelect(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#ffffff',
        border: 'none',
        borderRadius: '16px',
        padding: '16px 20px',
        width: '100%',
        maxWidth: '339px',
        height: '339px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        boxShadow: isHovered
          ? '0 12px 32px rgba(0, 0, 0, 0.12)'
          : '0 4px 20px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
        overflow: 'hidden',
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
      {/* Top Right: Heart/Favorite Button (Appears on Hover or if Favorited) */}
      <div
        className="card-hover-heart"
        style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          zIndex: 6,
          opacity: isHovered || isFavorite ? 1 : 0,
          pointerEvents: isHovered || isFavorite ? 'auto' : 'none',
          transform: isHovered || isFavorite ? 'scale(1)' : 'scale(0.85)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        <button
          type="button"
          onClick={handleFavoriteClick}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            color: isFavorite ? '#ef4444' : '#94a3b8',
            transition: 'transform 0.15s ease, color 0.15s ease, background-color 0.15s ease',
          }}
          aria-label={isFavorite ? 'Sevimlilərdən çıxar' : 'Sevimlilərə əlavə et'}
        >
          <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} color={isFavorite ? '#ef4444' : '#64748b'} />
        </button>
      </div>

      {/* Floating Bottom Right: Red Cart Button (Appears on Hover) */}
      <div
        className="card-hover-cart"
        style={{
          position: 'absolute',
          bottom: '42px',
          right: '12px',
          zIndex: 6,
          opacity: isHovered ? 1 : 0,
          pointerEvents: isHovered ? 'auto' : 'none',
          transform: isHovered ? 'scale(1)' : 'scale(0.85)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        <button
          type="button"
          onClick={handleCartClick}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
            transition: 'transform 0.15s ease, background-color 0.15s ease',
          }}
          aria-label="Səbətə əlavə et"
          title="Səbətə əlavə et"
        >
          <ShoppingCart size={17} color="#ffffff" />
        </button>
      </div>

      {/* Maximized Product Image Stage */}
      <div
        className="featured-product-img-box"
        style={{
          width: '100%',
          flex: 1,
          minHeight: '255px',
          maxHeight: '275px',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 0,
          position: 'relative',
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
            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {coverImage ? (
            <ShimmerImage
              src={coverImage}
              alt={product.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                fontSize: '13px',
              }}
            >
              Şəkil yoxdur
            </div>
          )}
        </div>
      </div>

      {/* Product Title and Price Row */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          width: '100%',
        }}
      >
        <div
          style={{
            fontSize: '13.5px',
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: 1.25,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {product.title}
        </div>

        {displayPrice && (
          <div
            style={{
              fontSize: '15px',
              fontWeight: 900,
              color: '#0f172a',
              fontFamily: 'Outfit, -apple-system, sans-serif',
            }}
          >
            {displayPrice}
          </div>
        )}
      </div>
    </div>
  );
};

