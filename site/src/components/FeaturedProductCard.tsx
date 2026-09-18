import React, { useState, useEffect, useRef } from 'react';
import { Heart, ShoppingCart, Scale, Phone } from 'lucide-react';
import { Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from './ShimmerImage';
import { WhatsAppIcon } from './WhatsAppIcon';

interface FeaturedProductCardProps {
  product: Product;
  theme: ThemeColors;
  onSelect: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
  onToggleCompare?: (product: Product) => void;
  isComparing?: boolean;
  onWhatsApp?: (product: Product) => void;
  onCall?: (product: Product) => void;
}

export const FeaturedProductCard: React.FC<FeaturedProductCardProps> = ({
  product,
  theme: _theme,
  onSelect,
  onAddToCart,
  onToggleFavorite,
  isFavorite: isFavoriteProp,
  onToggleCompare,
  isComparing = false,
  onWhatsApp,
  onCall,
}) => {
  const [internalFavorite, setInternalFavorite] = useState(false);
  const isFavorite = isFavoriteProp !== undefined ? isFavoriteProp : internalFavorite;
  const [isHovered, setIsHovered] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = cardRef.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
    if (onToggleFavorite) {
      onToggleFavorite(product);
    } else {
      setInternalFavorite((prev) => !prev);
    }
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCompare?.(product);
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      onSelect(product);
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onWhatsApp) {
      onWhatsApp(product);
    } else {
      onSelect(product);
    }
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCall) {
      onCall(product);
    } else {
      onSelect(product);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`featured-product-card product-card scroll-reveal-item ${isRevealed ? 'is-revealed' : ''} ${isHovered ? 'is-card-hovered' : ''}`}
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
      {/* Top Right: Favorite & Compare Action Buttons */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 6,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: isHovered || isFavorite || isComparing ? 1 : 0,
          pointerEvents: isHovered || isFavorite || isComparing ? 'auto' : 'none',
          transform: isHovered || isFavorite || isComparing ? 'scale(1)' : 'scale(0.85)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        {/* Compare Button */}
        {onToggleCompare && (
          <button
            type="button"
            onClick={handleCompareClick}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: isComparing ? '#2563eb' : 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${isComparing ? '#2563eb' : 'rgba(226, 232, 240, 0.9)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              color: isComparing ? '#ffffff' : '#64748b',
              transition: 'transform 0.15s ease, color 0.15s ease, background-color 0.15s ease',
            }}
            aria-label={isComparing ? 'Müqayisədən çıxar' : 'Müqayisə et'}
            title={isComparing ? 'Müqayisədən çıxar' : 'Müqayisə et'}
          >
            <Scale size={15} color={isComparing ? '#ffffff' : '#64748b'} />
          </button>
        )}

        {/* Heart/Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isFavorite ? '#ef4444' : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${isFavorite ? '#ef4444' : 'rgba(226, 232, 240, 0.9)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            color: isFavorite ? '#ffffff' : '#94a3b8',
            transition: 'transform 0.15s ease, color 0.15s ease, background-color 0.15s ease',
          }}
          aria-label={isFavorite ? 'Sevimlilərdən çıxar' : 'Sevimlilərə əlavə et'}
          title={isFavorite ? 'Sevimlilərdən çıxar' : 'Sevimlilərə əlavə et'}
        >
          <Heart size={16} fill={isFavorite ? '#ffffff' : 'none'} color={isFavorite ? '#ffffff' : '#64748b'} />
        </button>
      </div>

      {/* Floating Hover Action Cluster: WhatsApp, Call, Cart, and Details (Frosted Translucent Bar) */}
      <div
        className="card-hover-actions-cluster"
        style={{
          position: 'absolute',
          bottom: '42px',
          left: '50%',
          transform: `translateX(-50%) ${isHovered ? 'translateY(0)' : 'translateY(8px)'}`,
          zIndex: 6,
          opacity: isHovered ? 1 : 0,
          pointerEvents: isHovered ? 'auto' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          borderRadius: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* WhatsApp Icon */}
        <button
          type="button"
          className="card-action-btn-wa card-action-btn-item"
          onClick={handleWhatsAppClick}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#25D366',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)',
            transition: 'transform 0.15s ease',
          }}
          title="WhatsApp ilə soruş"
          aria-label="WhatsApp"
        >
          <WhatsAppIcon size={16} color="#ffffff" />
        </button>

        {/* Call Icon */}
        <button
          type="button"
          className="card-action-btn-call card-action-btn-item"
          onClick={handleCallClick}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
            transition: 'transform 0.15s ease',
          }}
          title="Zəng et"
          aria-label="Zəng et"
        >
          <Phone size={14} color="#ffffff" />
        </button>

        {/* Add to Cart Icon */}
        <button
          type="button"
          className="card-action-btn-cart card-action-btn-item"
          onClick={handleCartClick}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.35)',
            transition: 'transform 0.15s ease',
          }}
          aria-label="Səbətə əlavə et"
          title="Səbətə əlavə et"
        >
          <ShoppingCart size={15} color="#ffffff" />
        </button>

        {/* Details / Ətraflı Button */}
        <button
          type="button"
          className="card-action-btn-details card-action-btn-item"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product);
          }}
          style={{
            height: '32px',
            padding: '0 10px',
            borderRadius: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.08)',
            color: '#0f172a',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11.5px',
            fontWeight: 700,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
            transition: 'transform 0.15s ease, background-color 0.15s ease',
          }}
          title="Ətraflı bax"
          aria-label="Ətraflı bax"
        >
          <span>Ətraflı</span>
        </button>
      </div>

      {/* Maximized Product Image Stage */}
      <div
        className="featured-product-img-box"
        style={{
          width: '100%',
          flex: 1,
          minHeight: '265px',
          maxHeight: '275px',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 0,
          margin: 0,
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
          paddingTop: '2px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          width: '100%',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={product.title}
        >
          {product.title}
        </div>

        {displayPrice && (
          <div
            style={{
              fontSize: '14.5px',
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.2,
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

