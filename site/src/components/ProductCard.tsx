import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Share2,
  Check,
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
} from 'lucide-react';
import { Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { WhatsAppIcon } from './WhatsAppIcon';
import { ShimmerImage } from './ShimmerImage';

interface ProductCardProps {
  product: Product;
  theme: ThemeColors;
  onSelect: (product: Product) => void;
  onShare: (product: Product) => void;
  onWhatsApp: (product: Product) => void;
  onCall: (product: Product) => void;
  onCopyLink: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
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
  brandName: _brandName,
  brandOrigin,
  rank,
  whatsappButtonText = 'WhatsApp',
  callButtonText = 'Zəng et',
  shareButtonText = 'Paylaş',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileFocused, setIsMobileFocused] = useState(false);
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

  const isActive = isHovered || isMobileFocused;

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
          target.closest('.card-media-nav-btn')
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

  const _discountPercent =
    product.price && product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null;

  return (
    <div
      ref={cardRef}
      data-product-card-id={product.id}
      tabIndex={0}
      aria-label={`${product.title} - ${product.code}`}
      className={`netflix-card-pop product-card ${isActive ? 'hovered is-focused' : ''} ${isMobileFocused ? 'mobile-focused' : ''}`}
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
            target.closest('.card-media-nav-btn')
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
            target.closest('.card-media-nav-btn')
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
          target.closest('.card-media-nav-btn')
        ) {
          return;
        }
        onSelect(product);
      }}
      style={{
        backgroundColor: '#ffffff',
        border: 'none',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        boxShadow: isActive
          ? '0 12px 32px rgba(0, 0, 0, 0.09)'
          : '0 4px 20px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
      }}
    >
      {/* Product Image / Video Frame Container with Touch Swiping */}
      <div
        className="product-card-img-wrap product-card-media"
        style={{
          backgroundColor: '#ffffff',
          cursor: 'pointer',
          position: 'relative',
          borderRadius: '16px 16px 0 0',
          overflow: 'hidden',
        }}
        onClick={() => onSelect(product)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
              padding: '8px',
              opacity: isActive ? 1 : 0,
              transition: 'opacity 0.25s ease',
              zIndex: 2,
              pointerEvents: 'none',
              borderRadius: '12px 12px 0 0',
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
                }}
              />
            );
          })()
        ) : (
          <div className="media-placeholder">
            <ImageIcon size={34} />
            <span>Şəkil hazırlanır</span>
          </div>
        )}

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

        {/* Netflix Stylized Rank Number if provided */}
        {typeof rank === 'number' && (
          <div className="netflix-rank-badge" aria-hidden="true">
            <span className="netflix-rank-text">{rank}</span>
          </div>
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
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isFavorite
              ? '#dc2626'
              : theme.mode === 'dark'
                ? 'rgba(15, 23, 42, 0.9)'
                : 'rgba(255, 255, 255, 0.92)',
            border: `1px solid ${isFavorite ? '#dc2626' : theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isFavorite ? '#ffffff' : '#dc2626',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            zIndex: 7,
            opacity: isActive || isFavorite ? 1 : 0,
            transform: isActive || isFavorite ? 'scale(1)' : 'scale(0.8)',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <Heart
            size={16}
            color={isFavorite ? '#ffffff' : '#dc2626'}
            fill={isFavorite ? '#ffffff' : 'none'}
            strokeWidth={2.2}
          />
        </button>

        {/* Quick Add To Cart Hover Button */}
        {onAddToCart && (
          <button
            type="button"
            className="card-action-btn-cart"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            title="Səbətə əlavə et"
            aria-label="Səbətə at"
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: `translateX(-50%) ${isActive ? 'translateY(0)' : 'translateY(12px)'}`,
              opacity: isActive ? 1 : 0,
              backgroundColor: '#e31e24',
              color: '#ffffff',
              border: 'none',
              borderRadius: '24px',
              padding: '7px 16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(227, 30, 36, 0.35)',
              cursor: 'pointer',
              zIndex: 7,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: isActive ? 'auto' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <ShoppingCart size={14} color="#ffffff" strokeWidth={2.2} />
            <span>Səbətə at</span>
          </button>
        )}

        {/* Floating Category & Badge tags */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '48px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none',
            zIndex: 4,
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
              padding: '4px 8px',
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
                  padding: '3px 7px',
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
                  padding: '3px 8px',
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
      </div>

      {/* Product Content Details */}
      <div style={styles.cardContent}>
        <div>
          <div style={styles.codeRow}>
            <span style={{ ...styles.modelCode, color: theme.primary }}>{product.code}</span>
            {brandOrigin && (
              <span style={{ ...styles.originTag, color: theme.textMuted }}>{brandOrigin}</span>
            )}
          </div>

          <div style={{ ...styles.productTitle, color: theme.text }}>{product.title}</div>

          {/* Highlights Checklist / Key Specs */}
          {product.highlights && product.highlights.length > 0 ? (
            <div style={styles.highlightsBox}>
              {product.highlights.slice(0, 2).map((highlight, index) => (
                <div key={index} style={styles.highlightRow}>
                  <Check size={13} color="#16a34a" strokeWidth={2.5} />
                  <span style={{ ...styles.highlightText, color: theme.textSecondary }}>
                    {highlight}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ minHeight: '36px' }} />
          )}
        </div>

        {/* Action Buttons: "Ətraflı bax" + WhatsApp/Call */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          {/* Primary View Details Button */}
          <button
            type="button"
            className="card-action-btn-details"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.mode === 'dark' ? '#1f2937' : '#f1f5f9',
              color: theme.text,
              border: `1px solid ${theme.border}`,
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <span>Ətraflı bax</span>
          </button>

          {/* WhatsApp, Call & Share Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="card-action-btn-wa"
              onClick={(e) => {
                e.stopPropagation();
                onWhatsApp(product);
              }}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                padding: '8px 6px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.2)',
              }}
            >
              <WhatsAppIcon size={15} color="#ffffff" />
              <span style={{ whiteSpace: 'nowrap' }}>{whatsappButtonText}</span>
            </button>

            <button
              type="button"
              className="card-action-btn-call"
              onClick={(e) => {
                e.stopPropagation();
                onCall(product);
              }}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                backgroundColor: theme.primary,
                color: '#ffffff',
                border: 'none',
                padding: '8px 6px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.2)',
              }}
            >
              <Phone size={14} color="#ffffff" />
              <span style={{ whiteSpace: 'nowrap' }}>{callButtonText}</span>
            </button>

            <button
              type="button"
              className="card-action-btn-share"
              onClick={(e) => {
                e.stopPropagation();
                onShare(product);
              }}
              title={shareButtonText}
              style={{
                width: '34px',
                height: '34px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.bgSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                color: theme.textSecondary,
                flexShrink: 0,
              }}
            >
              <Share2 size={15} color={theme.textSecondary} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  cardContent: {
    padding: '20px 24px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  codeRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  modelCode: {
    fontSize: '13px',
    fontWeight: 800,
    letterSpacing: '0.5px',
  },
  originTag: {
    fontSize: '11px',
    fontWeight: 600,
  },
  productTitle: {
    fontSize: '15px',
    fontWeight: 700,
    lineHeight: '20px',
    marginBottom: '8px',
    cursor: 'pointer',
  },
  highlightsBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    margin: '4px 0',
  },
  highlightRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6px',
  },
  highlightText: {
    fontSize: '12px',
    flex: 1,
  },
};
