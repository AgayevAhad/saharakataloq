import React, { useRef, useState } from 'react';
import { animateProductToCart, animateProductToFavorites } from '../utils/cartFlight';
import { Heart, ShoppingCart, Scale, Phone } from 'lucide-react';
import { Brand, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from './ShimmerImage';
import { WhatsAppIcon } from './WhatsAppIcon';
import { ProductBrandBadge } from './ProductBrandBadge';
import { CategoryGlyph } from './CategoryGlyph';
import { verifiedManufacturingCountry } from '../utils/manufacturingCountry';
import { manufacturingCountryFlag } from '../utils/countryFlag';
import { useCenteredMobileCard } from '../hooks/useCenteredMobileCard';
import { getProductBadgeColor, getVisibleBadgeText } from './productCardVisuals';

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
  brand?: Brand;
  transparentBg?: boolean;
  hideBrandAndCategoryMeta?: boolean;
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
  brand,
  transparentBg = false,
  hideBrandAndCategoryMeta = false,
}) => {
  const [internalFavorite, setInternalFavorite] = useState(false);
  const isFavorite = isFavoriteProp !== undefined ? isFavoriteProp : internalFavorite;
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isMobileFocused = useCenteredMobileCard(cardRef);
  const isActive = isHovered || isMobileFocused;

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
    if (!isFavorite) animateProductToFavorites(e.currentTarget as HTMLElement, coverImage);
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
      animateProductToCart(e.currentTarget as HTMLElement, coverImage);
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
      data-featured-product-card-id={product.id}
      className={`featured-product-card product-card ${isActive ? 'is-card-hovered' : ''} ${isMobileFocused ? 'mobile-focused' : ''}`}
      onClick={() => onSelect(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: transparentBg ? 'transparent' : '#ffffff',
        border: 'none',
        borderRadius: '16px',
        padding: '12px 14px 14px',
        width: '100%',
        maxWidth: '339px',
        height: '100%',
        minHeight: isActive ? '374px' : '339px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        transform: isActive ? 'translateY(-6px) scale(1.03)' : 'translateY(0) scale(1)',
        boxShadow: transparentBg
          ? 'none'
          : isActive
            ? '0 20px 40px -8px rgba(0, 0, 0, 0.22), 0 6px 16px rgba(0, 0, 0, 0.08)'
            : '0 4px 20px rgba(0, 0, 0, 0.05)',
        zIndex: isActive ? 20 : 1,
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), min-height 0.25s ease, z-index 0.15s ease',
        overflow: 'visible',
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
      {!hideBrandAndCategoryMeta && <ProductBrandBadge brand={brand} />}
      {!hideBrandAndCategoryMeta && (
        <div className="product-card-category-top" aria-label={`Kateqoriya: ${product.categoryName}`}>
          <CategoryGlyph id={product.category} compact plain />
          <span>{product.categoryName}</span>
        </div>
      )}
      {!hideBrandAndCategoryMeta && manufacturingCountryFlag(verifiedManufacturingCountry(product)) && (
        <span
          className="product-card-country-flag"
          data-country={verifiedManufacturingCountry(product)}
          title={`İstehsal ölkəsi: ${verifiedManufacturingCountry(product)}`}
          aria-label={`İstehsal ölkəsi: ${verifiedManufacturingCountry(product)}`}
        >
          {manufacturingCountryFlag(verifiedManufacturingCountry(product))}
        </span>
      )}

      {!hideBrandAndCategoryMeta && getVisibleBadgeText(product) && (
        <span
          className="featured-product-badge"
          style={{ backgroundColor: getProductBadgeColor(product.badgeColor) }}
        >
          {getVisibleBadgeText(product)}
        </span>
      )}

      {/* Top Right: Favorite & Compare Action Buttons */}
      <div
        className="product-card-top-actions"
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 6,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: isActive || isFavorite || isComparing ? 1 : 0,
          pointerEvents: isActive || isFavorite || isComparing ? 'auto' : 'none',
          transform: isActive || isFavorite || isComparing ? 'scale(1)' : 'scale(0.85)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        {/* Compare Button */}
        {onToggleCompare && (
          <button
            type="button"
            className={isComparing ? 'sahara-soft-blue-action' : undefined}
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
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)',
              color: isComparing ? '#ffffff' : '#64748b',
              transition: 'transform 0.15s ease, color 0.15s ease, background-color 0.15s ease',
            }}
            aria-label={isComparing ? 'Müqayisədən çıxar' : 'Müqayisə et'}
            title={isComparing ? 'Müqayisədən çıxar' : 'Müqayisə et'}
          >
            <Scale size={15} color="currentColor" />
          </button>
        )}

        {/* Heart/Favorite Button */}
        <button
          type="button"
          className={isFavorite ? 'sahara-soft-red-action' : undefined}
          onClick={handleFavoriteClick}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isFavorite ? '#dc2626' : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${isFavorite ? '#dc2626' : 'rgba(226, 232, 240, 0.9)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)',
            color: isFavorite ? '#ffffff' : '#dc2626',
            transition: 'transform 0.15s ease, color 0.15s ease, background-color 0.15s ease',
          }}
          aria-label={isFavorite ? 'Sevimlilərdən çıxar' : 'Sevimlilərə əlavə et'}
          title={isFavorite ? 'Sevimlilərdən çıxar' : 'Sevimlilərə əlavə et'}
        >
          <Heart
            size={16}
            fill={isFavorite ? 'currentColor' : 'none'}
            color="currentColor"
          />
        </button>
      </div>



      {/* Maximized Product Image Stage */}
      <div
        className="featured-product-img-box"
        style={{
          width: '100%',
          flex: 1,
          height: '232px',
          minHeight: '216px',
          maxHeight: '242px',
          borderRadius: '12px',
          backgroundColor: transparentBg ? 'transparent' : '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 0,
          margin: '0 0 2px 0',
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
              marginBottom: '1px',
              fontFamily: 'Outfit, -apple-system, sans-serif',
            }}
          >
            {displayPrice}
          </div>
        )}

        {/* Action Cluster at Bottom: WhatsApp, Call, Cart, and Details (Smooth Expansion on Hover/Active) */}
        <div
          className="card-hover-actions-cluster"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            paddingTop: '2px',
            paddingBottom: '2px',
            border: 'none',
            backgroundColor: 'transparent',
            boxShadow: 'none',
            marginTop: isActive ? '10px' : '0px',
            maxHeight: isActive ? '42px' : '0px',
            opacity: isActive ? 1 : 0,
            pointerEvents: isActive ? 'auto' : 'none',
            overflow: 'hidden',
            zIndex: 6,
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
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              color: '#16a34a',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'none',
              transition: 'transform 0.15s ease, background-color 0.15s ease',
            }}
            title="WhatsApp ilə soruş"
            aria-label="WhatsApp"
          >
            <WhatsAppIcon size={16} color="currentColor" />
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
              backgroundColor: 'rgba(220, 38, 38, 0.10)',
              color: '#dc2626',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'none',
              transition: 'transform 0.15s ease, background-color 0.15s ease',
            }}
            title="Zəng et"
            aria-label="Zəng et"
          >
            <Phone size={14} color="currentColor" />
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
              backgroundColor: 'rgba(220, 38, 38, 0.10)',
              color: '#dc2626',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'none',
              transition: 'transform 0.15s ease, background-color 0.15s ease',
            }}
            aria-label="Səbətə əlavə et"
            title="Səbətə əlavə et"
          >
            <ShoppingCart size={15} color="currentColor" />
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
              backgroundColor: 'rgba(220, 38, 38, 0.10)',
              color: '#dc2626',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11.5px',
              fontWeight: 800,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
              transition: 'transform 0.15s ease, background-color 0.15s ease',
            }}
            title="Ətraflı bax"
            aria-label="Ətraflı bax"
          >
            <span>Ətraflı</span>
          </button>
        </div>
      </div>
    </div>
  );
};
