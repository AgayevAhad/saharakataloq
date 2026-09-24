import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Share2,
  Image as ImageIcon,
  PlayCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingCart,
  Scale,
} from 'lucide-react';
import { Brand, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { WhatsAppIcon } from './WhatsAppIcon';
import { ShimmerImage } from './ShimmerImage';
import { ProductBrandBadge } from './ProductBrandBadge';
import { getProductBadgeColor, getVisibleBadgeText } from './productCardVisuals';
import { CategoryGlyph } from './CategoryGlyph';
import { animateProductToCart, animateProductToFavorites } from '../utils/cartFlight';
import { verifiedManufacturingCountry } from '../utils/manufacturingCountry';
import { manufacturingCountryFlag } from '../utils/countryFlag';
import { useCenteredMobileCard } from '../hooks/useCenteredMobileCard';

interface ProductCardProps {
  product: Product;
  theme: ThemeColors;
  onSelect: (product: Product) => void;
  onShare?: (product: Product) => void;
  onWhatsApp?: (product: Product) => void;
  onCall?: (product: Product) => void;
  onCopyLink?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
  onToggleCompare?: (product: Product) => void;
  isComparing?: boolean;
  brandName?: string;
  brand?: Brand;
  brandOrigin?: string;
  rank?: number;
  whatsappButtonText?: string;
  callButtonText?: string;
  shareButtonText?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  theme,
  onSelect,
  onShare,
  onWhatsApp,
  onCall,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  onToggleCompare,
  isComparing = false,
  brandName,
  brand,
  brandOrigin: _brandOrigin,
  rank: _rank,
  whatsappButtonText = 'WhatsApp',
  callButtonText = 'Zəng et',
  shareButtonText = 'Paylaş',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMediaVisible, setIsMediaVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isMobileFocused = useCenteredMobileCard(cardRef);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Touch Swipe tracking
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isSwipingHoriz, setIsSwipingHoriz] = useState(false);

  const videoItem = product.media?.find((item) => item.type === 'video');

  const imageList = useMemo(() => {
    const list: string[] = [];
    if (product.image) list.push(product.image);
    if (Array.isArray(product.gallery)) list.push(...product.gallery);
    if (Array.isArray(product.media)) {
      product.media.forEach((m) => {
        if (m.type === 'image' && m.url) list.push(m.url);
      });
    }
    return Array.from(new Set(list.filter(Boolean)));
  }, [product.image, product.gallery, product.media]);

  const coverImage = imageList[0] || product.image || '';

  const isActive = isHovered || isMobileFocused;
  const isActionClusterVisible = isActive;

  // Visible video covers keep moving without hover. Offscreen cards stop decoding.
  useEffect(() => {
    if (!videoItem || !cardRef.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsMediaVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsMediaVisible(Boolean(entry?.isIntersecting)),
      { rootMargin: '150px 0px', threshold: 0.01 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [videoItem]);

  useEffect(() => {
    if (!videoItem || !videoRef.current) return;
    if (isMediaVisible) {
      videoRef.current.play().catch(() => setIsVideoPlaying(false));
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  }, [isMediaVisible, videoItem]);

  // Direct synchronous keydown listener to prevent Space scrolling at native browser layer
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space' || e.key === 'Spacebar' || e.key === 'Enter') {
        const target = e.target as HTMLElement;
        if (
          target.closest('button') ||
          target.closest('a') ||
          target.closest('.card-action-btn-wa') ||
          target.closest('.card-action-btn-call') ||
          target.closest('.card-action-btn-share') ||
          target.closest('.card-media-nav-btn') ||
          target.closest('.card-action-btn-details')
        ) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        onSelect(product);
      }
    };

    card.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => {
      card.removeEventListener('keydown', handleKeyDown);
    };
  }, [product, onSelect]);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setIsSwipingHoriz(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      setIsSwipingHoriz(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const dx = touchEndX - touchStartX;

    if (isSwipingHoriz && Math.abs(dx) >= 30 && imageList.length > 1) {
      e.stopPropagation();
      if (dx < 0) {
        // Swiped Left -> Next Image
        setCurrentImageIdx((prev) => (prev + 1) % imageList.length);
      } else {
        // Swiped Right -> Previous Image
        setCurrentImageIdx((prev) => (prev - 1 + imageList.length) % imageList.length);
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
    setIsSwipingHoriz(false);
  };

  const rawPrice = product.price ?? (product as any).priceCash;
  const displayPrice =
    rawPrice !== undefined && rawPrice !== null && Number(rawPrice) > 0
      ? `${Number(rawPrice).toLocaleString('az-AZ')} ₼`
      : null;

  return (
    <div
      ref={cardRef}
      data-product-card-id={product.id}
      tabIndex={0}
      aria-label={`${product.title} - ${product.code}`}
      className={`netflix-card-pop product-card ${isActive ? 'hovered is-focused is-card-hovered' : ''} ${isMobileFocused ? 'mobile-focused' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
      onKeyDownCapture={(e) => {
        if (e.key === ' ' || e.code === 'Space' || e.key === 'Spacebar') {
          const target = e.target as HTMLElement;
          if (
            target.closest('button') ||
            target.closest('a') ||
            target.closest('.card-action-btn-wa') ||
            target.closest('.card-action-btn-call') ||
            target.closest('.card-action-btn-share') ||
            target.closest('.card-media-nav-btn') ||
            target.closest('.card-action-btn-details')
          ) {
            return;
          }
          e.preventDefault();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space' || e.key === 'Spacebar') {
          const target = e.target as HTMLElement;
          if (
            target.closest('button') ||
            target.closest('a') ||
            target.closest('.card-action-btn-wa') ||
            target.closest('.card-action-btn-call') ||
            target.closest('.card-action-btn-share') ||
            target.closest('.card-media-nav-btn') ||
            target.closest('.card-action-btn-details')
          ) {
            return;
          }
          e.preventDefault();
          onSelect(product);
        }
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest('button') ||
          target.closest('a') ||
          target.closest('.card-action-btn-wa') ||
          target.closest('.card-action-btn-call') ||
          target.closest('.card-action-btn-share') ||
          target.closest('.card-media-nav-btn') ||
          target.closest('.card-action-btn-details')
        ) {
          return;
        }
        onSelect(product);
      }}
      style={{
        backgroundColor: '#ffffff',
        border: 'none',
        borderRadius: '16px',
        padding: '12px 14px 14px',
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        minHeight: isActive ? '374px' : '339px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        transform: isActive ? 'translateY(-6px) scale(1.03)' : 'translateY(0) scale(1)',
        boxShadow: isActive
          ? '0 20px 40px -8px rgba(0, 0, 0, 0.22), 0 6px 16px rgba(0, 0, 0, 0.08)'
          : '0 4px 20px rgba(0, 0, 0, 0.05)',
        zIndex: isActive ? 20 : 1,
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), min-height 0.25s ease, z-index 0.15s ease',
        overflow: 'visible',
      }}
    >
      <ProductBrandBadge brand={brand} brandName={brandName} />
      <div className="product-card-category-top" aria-label={`Kateqoriya: ${product.categoryName}`}>
        <CategoryGlyph id={product.category} compact plain />
        <span>{product.categoryName}</span>
      </div>
      {manufacturingCountryFlag(verifiedManufacturingCountry(product)) && (
        <span
          className="product-card-country-flag"
          data-country={verifiedManufacturingCountry(product)}
          title={`İstehsal ölkəsi: ${verifiedManufacturingCountry(product)}`}
          aria-label={`İstehsal ölkəsi: ${verifiedManufacturingCountry(product)}`}
        >
          {manufacturingCountryFlag(verifiedManufacturingCountry(product))}
        </span>
      )}

      {/* Top Right: Favorite & Compare Action Buttons */}
      <div
        className="product-card-top-actions"
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 7,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: isActive || isFavorite || isComparing ? 1 : 0,
          pointerEvents: isActive || isFavorite || isComparing ? 'auto' : 'none',
          transform: isActive || isFavorite || isComparing ? 'scale(1)' : 'scale(0.85)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Compare Scale Button */}
        {onToggleCompare && (
          <button
            type="button"
            className={`card-action-btn-compare ${isComparing ? 'sahara-soft-blue-action' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(product);
            }}
            title={isComparing ? 'Müqayisədən çıxart' : 'Müqayisəyə əlavə et'}
            aria-label="Müqayisə et"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: isComparing ? '#2563eb' : 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${isComparing ? '#2563eb' : 'rgba(226, 232, 240, 0.9)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isComparing ? '#ffffff' : '#64748b',
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)',
              cursor: 'pointer',
              backdropFilter: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Scale size={15} color="currentColor" />
          </button>
        )}

        {/* Quick Favorite Heart Button */}
        <button
          type="button"
          className={`card-action-btn-heart ${isFavorite ? 'sahara-soft-red-action' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isFavorite) animateProductToFavorites(e.currentTarget, coverImage);
            onToggleFavorite?.(product);
          }}
          title={isFavorite ? 'Seçilmişlərdən çıxart' : 'Seçilmişlərə əlavə et'}
          aria-label="Seçilmişlər"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isFavorite ? '#dc2626' : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${isFavorite ? '#dc2626' : 'rgba(226, 232, 240, 0.9)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isFavorite ? '#ffffff' : '#dc2626',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            backdropFilter: 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Heart
            size={16}
            color="currentColor"
            fill={isFavorite ? 'currentColor' : 'none'}
            strokeWidth={2.2}
          />
        </button>
      </div>

      {/* Floating Category & Badge tags */}
      <div
        style={{
          position: 'absolute',
          top: '44px',
          left: '10px',
          right: '88px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {getVisibleBadgeText(product) && (
            <span
              style={{
                backgroundColor: getProductBadgeColor(product.badgeColor),
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                padding: '3px 7px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              {getVisibleBadgeText(product)}
            </span>
          )}
        </div>
      </div>



      {/* Maximized Product Image / Media Frame Container with Touch Swiping */}
      <div
        className="product-card-img-wrap product-card-media"
        style={{
          width: '100%',
          flex: 1,
          height: '232px',
          minHeight: '216px',
          maxHeight: '242px',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 0,
          margin: '0 0 2px 0',
          position: 'relative',
        }}
        onClick={() => onSelect(product)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Inner Zoom Wrap */}
        <div
          className="product-card-img-inner"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isActive ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Video Preview Player if available */}
          {videoItem && (
            <video
              ref={videoRef}
              src={videoItem.url}
              poster={videoItem.poster || coverImage}
              muted
              loop
              playsInline
              autoPlay={isMediaVisible}
              preload={isMediaVisible ? 'metadata' : 'none'}
              onPlaying={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              onError={() => setIsVideoPlaying(false)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '4px',
                opacity: isVideoPlaying ? 1 : 0,
                transition: 'opacity 0.25s ease',
                zIndex: 2,
                pointerEvents: 'none',
                borderRadius: '12px',
              }}
            />
          )}

          {/* Product Image / Slideshow */}
          {coverImage ? (
            (() => {
              const currentImgUrl = imageList[currentImageIdx] || coverImage;
              const activeMediaObj =
                (product.media || []).find((m) => m.url === currentImgUrl) || product.media?.[0];
              const cardObjectPosition =
                activeMediaObj?.objectPosition || product.imagePosition || 'center';
              const cardFitMode = activeMediaObj?.fitMode || product.imageFit || 'contain';

              return (
                <ShimmerImage
                  src={currentImgUrl}
                  alt={product.title}
                  loading="lazy"
                  objectFit={cardFitMode as any}
                  objectPosition={cardObjectPosition}
                  spinnerSize={24}
                  style={{
                    opacity: isVideoPlaying ? 0 : undefined,
                    width: '100%',
                    height: '100%',
                  }}
                />
              );
            })()
          ) : (
            <div
              className="media-placeholder"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
              }}
            >
              <ImageIcon size={34} />
              <span style={{ fontSize: '12px', marginTop: '4px' }}>Şəkil hazırlanır</span>
            </div>
          )}
        </div>

        {/* Mini Touch / Click Arrows for Multi-image Products */}
        {imageList.length > 1 && !videoItem && (
          <>
            <button
              type="button"
              className="card-media-nav-btn prev"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIdx((prev) => (prev - 1 + imageList.length) % imageList.length);
              }}
              title="Əvvəlki şəkil"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="card-media-nav-btn next"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIdx((prev) => (prev + 1) % imageList.length);
              }}
              title="Növbəti şəkil"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Slideshow Media Indicator Dots (Clickable) */}
        {imageList.length > 1 && !videoItem && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '0',
              right: '0',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '5px',
              zIndex: 6,
            }}
          >
            {imageList.map((_, idx) => (
              <span
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIdx(idx);
                }}
                style={{
                  width: idx === currentImageIdx ? '16px' : '6px',
                  height: '4px',
                  borderRadius: '4px',
                  backgroundColor:
                    idx === currentImageIdx ? theme.primary : 'rgba(255, 255, 255, 0.65)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </div>
        )}

        {/* Video Icon Badge when video is attached */}
        {videoItem && (
          <div
            className="card-video-indicator-badge"
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.72)',
              color: '#ffffff',
              padding: '3px 7px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 800,
              zIndex: 4,
              backdropFilter: 'none',
            }}
          >
            <PlayCircle size={12} color="#ffffff" />
            <span>Video</span>
          </div>
        )}
      </div>

      {/* Product Content Details - Clean, Single Row Title + Price */}
      <div
        className="product-card-details"
        style={{
          marginTop: 'auto',
          paddingTop: '2px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          width: '100%',
        }}
      >
        <span
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {product.code}
        </span>
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

        {/* Action Cluster at Bottom: WhatsApp, Call, Cart, Ətraflı, Share (Smooth Expansion on Hover/Active) */}
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
            marginTop: isActionClusterVisible ? '10px' : '0px',
            maxHeight: isActionClusterVisible ? '42px' : '0px',
            opacity: isActionClusterVisible ? 1 : 0,
            pointerEvents: isActionClusterVisible ? 'auto' : 'none',
            overflow: 'hidden',
            zIndex: 8,
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* WhatsApp Button */}
          <button
            type="button"
            className="card-action-btn-wa card-action-btn-item"
            onClick={(e) => {
              e.stopPropagation();
              onWhatsApp?.(product);
            }}
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
            title={whatsappButtonText}
            aria-label={whatsappButtonText}
          >
            <WhatsAppIcon size={16} color="currentColor" />
            <span
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            >
              {whatsappButtonText}
            </span>
          </button>

          {/* Call Button */}
          <button
            type="button"
            className="card-action-btn-call card-action-btn-item"
            onClick={(e) => {
              e.stopPropagation();
              onCall?.(product);
            }}
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
            title={callButtonText}
            aria-label={callButtonText}
          >
            <Phone size={14} color="currentColor" />
            <span
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            >
              {callButtonText}
            </span>
          </button>

          {/* Cart Button */}
          {onAddToCart && (
            <button
              type="button"
              className="card-action-btn-cart card-action-btn-item"
              onClick={(e) => {
                e.stopPropagation();
                animateProductToCart(e.currentTarget, coverImage);
                onAddToCart(product);
              }}
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
              title="Səbətə əlavə et"
              aria-label="Səbətə əlavə et"
            >
              <ShoppingCart size={15} color="currentColor" />
              <span
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  padding: 0,
                  margin: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  border: 0,
                }}
              >
                Səbətə əlavə et
              </span>
            </button>
          )}

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

          {/* Share Button */}
          {onShare && (
            <button
              type="button"
              className="card-action-btn-share card-action-btn-item"
              onClick={(e) => {
                e.stopPropagation();
                onShare(product);
              }}
              title={shareButtonText}
              aria-label={shareButtonText}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: '#2563eb',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
              }}
            >
              <Share2 size={13} color="currentColor" />
              <span
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  padding: 0,
                  margin: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  border: 0,
                }}
              >
                {shareButtonText}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
