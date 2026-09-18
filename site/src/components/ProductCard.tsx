import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Share2,
  Flame,
  Layers,
  Wind,
  Snowflake,
  Box,
  Refrigerator,
  Image as ImageIcon,
  PlayCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingCart,
  Scale,
} from 'lucide-react';
import { Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { WhatsAppIcon } from './WhatsAppIcon';
import { ShimmerImage } from './ShimmerImage';

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
  brandName: _brandName,
  brandOrigin: _brandOrigin,
  rank: _rank,
  whatsappButtonText = 'WhatsApp',
  callButtonText = 'Zəng et',
  shareButtonText = 'Paylaş',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileFocused, setIsMobileFocused] = useState(false);
  const [isMobileActionVisible, setIsMobileActionVisible] = useState(false);
  const [hasManuallySwiped, setHasManuallySwiped] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
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

  // Mobile center focus using native IntersectionObserver (0 main-thread layout thrashing)
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const isTouch =
      'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768;
    if (!isTouch || !cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsMobileFocused(true);
          } else {
            setIsMobileFocused(false);
            setHasManuallySwiped(false);
            setCurrentImageIdx(0);
          }
        });
      },
      {
        rootMargin: '-30% 0px -30% 0px',
        threshold: 0.1,
      }
    );

    const currentCard = cardRef.current;
    observer.observe(currentCard);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isMobileFocused) {
      setIsMobileActionVisible(true);
      const timer = setTimeout(() => {
        setIsMobileActionVisible(false);
      }, 2600);
      return () => clearTimeout(timer);
    } else {
      setIsMobileActionVisible(false);
    }
  }, [isMobileFocused]);

  const isActive = isHovered || isMobileFocused;
  const isActionClusterVisible = isHovered || (isMobileFocused && isMobileActionVisible);

  // Video Autoplay / Pause: Only decode/play on active hover/focus to prevent CPU/decoder saturation
  useEffect(() => {
    if (!videoItem || !videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive, videoItem]);

  // Slideshow Cycling on Desktop Hover or Single Focused Mobile Card
  useEffect(() => {
    if (!isActive || videoItem || imageList.length <= 1 || hasManuallySwiped) {
      if (!hasManuallySwiped && !isActive) setCurrentImageIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % imageList.length);
    }, 1600);
    return () => clearInterval(interval);
  }, [isActive, videoItem, imageList.length, hasManuallySwiped]);

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
      setHasManuallySwiped(true);
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

  const getCategoryIcon = () => {
    switch (product.category) {
      case 'cooktop':
        return <Flame size={13} color={theme.primary} />;
      case 'oven':
        return <Layers size={13} color="#0284c7" />;
      case 'hood':
        return <Wind size={13} color="#a855f7" />;
      case 'air_conditioner':
        return <Snowflake size={13} color="#0ea5e9" />;
      case 'microwave':
        return <Box size={13} color="#f59e0b" />;
      case 'refrigerator':
        return <Refrigerator size={13} color="#14b8a6" />;
      case 'airfryer':
        return <Flame size={13} color="#ea580c" />;
      case 'washer':
        return <Layers size={13} color="#3b82f6" />;
      case 'thermopot':
        return <Box size={13} color="#d97706" />;
      case 'vacuum_cleaner':
        return <Wind size={13} color="#6366f1" />;
      case 'tv':
        return <Box size={13} color="#8b5cf6" />;
      case 'meat_grinder':
        return <Box size={13} color="#dc2626" />;
      case 'iron':
        return <Wind size={13} color="#0284c7" />;
      default:
        return <Box size={13} color={theme.primary} />;
    }
  };

  const getBadgeBgColor = () => {
    switch (product.badgeColor) {
      case 'amber':
        return '#f97316';
      case 'green':
        return '#16a34a';
      case 'blue':
        return '#2563eb';
      case 'purple':
        return '#7c3aed';
      case 'red':
      default:
        return '#dc2626';
    }
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
        setHasManuallySwiped(false);
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
        padding: '16px 20px',
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        minHeight: '339px',
        maxHeight: '339px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        boxShadow: isActive
          ? '0 12px 32px rgba(0, 0, 0, 0.12)'
          : '0 4px 20px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
        overflow: 'hidden',
      }}
    >
      {/* Top Right: Favorite & Compare Action Buttons */}
      <div
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
            className="card-action-btn-compare"
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
              backgroundColor: isComparing
                ? '#2563eb'
                : theme.mode === 'dark'
                  ? 'rgba(15, 23, 42, 0.9)'
                  : 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${isComparing ? '#2563eb' : theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isComparing ? '#ffffff' : '#64748b',
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)',
              cursor: 'pointer',
              backdropFilter: 'blur(6px)',
              transition: 'all 0.15s ease',
            }}
          >
            <Scale size={15} color={isComparing ? '#ffffff' : '#64748b'} />
          </button>
        )}

        {/* Quick Favorite Heart Button */}
        <button
          type="button"
          className="card-action-btn-heart"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(product);
          }}
          title={isFavorite ? 'Seçilmişlərdən çıxart' : 'Seçilmişlərə əlavə et'}
          aria-label="Seçilmişlər"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isFavorite
              ? '#dc2626'
              : theme.mode === 'dark'
                ? 'rgba(15, 23, 42, 0.9)'
                : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${isFavorite ? '#dc2626' : theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isFavorite ? '#ffffff' : '#dc2626',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            backdropFilter: 'blur(6px)',
            transition: 'all 0.15s ease',
          }}
        >
          <Heart
            size={16}
            color={isFavorite ? '#ffffff' : '#dc2626'}
            fill={isFavorite ? '#ffffff' : 'none'}
            strokeWidth={2.2}
          />
        </button>
      </div>

      {/* Floating Category & Badge tags */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor:
              theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${theme.border}`,
            padding: '3px 7px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            color: theme.textSecondary,
            backdropFilter: 'blur(4px)',
          }}
        >
          {getCategoryIcon()}
          <span>{product.categoryName}</span>
        </div>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {product.manufacturingCountry && (
            <span
              style={{
                backgroundColor:
                  theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(241, 245, 249, 0.95)',
                color: theme.textSecondary,
                fontSize: '10px',
                fontWeight: 700,
                padding: '3px 6px',
                borderRadius: '6px',
                border: `1px solid ${theme.border}`,
                letterSpacing: '0.2px',
              }}
            >
              {product.manufacturingCountry}
            </span>
          )}
          {product.badgeText && (
            <span
              style={{
                backgroundColor: getBadgeBgColor(),
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
              {product.badgeText}
            </span>
          )}
        </div>
      </div>

      {/* Floating Hover Action Cluster: WhatsApp, Call, Cart, Details, Share */}
      <div
        className="card-hover-actions-cluster"
        style={{
          position: 'absolute',
          bottom: '42px',
          left: '50%',
          transform: `translateX(-50%) ${isActionClusterVisible ? 'translateY(0)' : 'translateY(10px)'}`,
          opacity: isActionClusterVisible ? 1 : 0,
          pointerEvents: isActionClusterVisible ? 'auto' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          borderRadius: '24px',
          backgroundColor:
            theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(226, 232, 240, 0.9)'}`,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.14)',
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
          title={whatsappButtonText}
          aria-label={whatsappButtonText}
        >
          <WhatsAppIcon size={16} color="#ffffff" />
          <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>{whatsappButtonText}</span>
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
          title={callButtonText}
          aria-label={callButtonText}
        >
          <Phone size={14} color="#ffffff" />
          <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>{callButtonText}</span>
        </button>

        {/* Cart Button */}
        {onAddToCart && (
          <button
            type="button"
            className="card-action-btn-cart card-action-btn-item"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
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
            title="Səbətə əlavə et"
            aria-label="Səbətə əlavə et"
          >
            <ShoppingCart size={15} color="#ffffff" />
            <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>Səbətə əlavə et</span>
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
            backgroundColor:
              theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)',
            color: theme.mode === 'dark' ? '#ffffff' : '#0f172a',
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
              backgroundColor: theme.mode === 'dark' ? '#1e293b' : '#f1f5f9',
              color: theme.textSecondary,
              border: `1px solid ${theme.border}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s ease',
            }}
          >
            <Share2 size={13} color={theme.textSecondary} />
            <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>{shareButtonText}</span>
          </button>
        )}
      </div>

      {/* Maximized Product Image / Media Frame Container with Touch Swiping */}
      <div
        className="product-card-img-wrap product-card-media"
        style={{
          width: '100%',
          flex: 1,
          minHeight: '260px',
          maxHeight: '272px',
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
              preload="none"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '4px',
                opacity: isActive ? 1 : 0,
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
                    opacity: isActive && videoItem ? 0 : undefined,
                    width: '100%',
                    height: '100%',
                  }}
                />
              );
            })()
          ) : (
            <div className="media-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
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
                setHasManuallySwiped(true);
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
                setHasManuallySwiped(true);
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
                  setHasManuallySwiped(true);
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
              backdropFilter: 'blur(4px)',
            }}
          >
            <PlayCircle size={12} color="#ffffff" />
            <span>Video</span>
          </div>
        )}
      </div>

      {/* Product Content Details - Clean, Single Row Title + Price */}
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
        <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
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
