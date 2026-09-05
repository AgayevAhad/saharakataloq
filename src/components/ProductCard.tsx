import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  PackageCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
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
  brandName?: string;
  brandOrigin?: string;
  rank?: number;
  whatsappButtonText?: string;
  callButtonText?: string;
  shareButtonText?: string;
}

// Global Single Mobile Center Focus Coordinator
let currentActiveMobileCardId: string | null = null;
const mobileFocusListeners = new Set<(id: string | null) => void>();

const updateActiveMobileCard = (id: string | null) => {
  if (currentActiveMobileCardId === id) return;
  currentActiveMobileCardId = id;
  mobileFocusListeners.forEach((fn) => fn(id));
};

if (typeof window !== 'undefined') {
  let scrollThrottle: any = null;
  const onMobileCenterScroll = () => {
    if (scrollThrottle) return;
    scrollThrottle = setTimeout(() => {
      scrollThrottle = null;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768;
      if (!isTouch) {
        if (currentActiveMobileCardId !== null) updateActiveMobileCard(null);
        return;
      }

      const elements = Array.from(document.querySelectorAll('[data-product-card-id]'));
      if (!elements.length) return;

      const screenCenterY = window.innerHeight / 2;
      let closestId: string | null = null;
      let minDistance = Infinity;

      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        // Check if element is within the active middle 50% viewport band
        if (rect.bottom >= window.innerHeight * 0.25 && rect.top <= window.innerHeight * 0.75) {
          const cardCenterY = rect.top + rect.height / 2;
          const dist = Math.abs(cardCenterY - screenCenterY);
          if (dist < minDistance) {
            minDistance = dist;
            closestId = el.getAttribute('data-product-card-id');
          }
        }
      }

      updateActiveMobileCard(closestId);
    }, 60);
  };

  window.addEventListener('scroll', onMobileCenterScroll, { passive: true });
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  theme,
  onSelect,
  onShare,
  onWhatsApp,
  onCall,
  brandName,
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

  // Listen to single mobile center focus
  useEffect(() => {
    const handler = (activeId: string | null) => {
      const isThisCard = activeId === product.id;
      setIsMobileFocused(isThisCard);
      if (!isThisCard) {
        setHasManuallySwiped(false);
        setCurrentImageIdx(0);
      }
    };
    mobileFocusListeners.add(handler);
    return () => {
      mobileFocusListeners.delete(handler);
    };
  }, [product.id]);

  const isActive = isHovered || isMobileFocused;

  // Video Autoplay / Pause
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

  const discountPercent =
    product.price && product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null;

  return (
    <div
      ref={cardRef}
      data-product-card-id={product.id}
      className={`netflix-card-pop product-card ${isActive ? 'hovered is-focused' : ''} ${isMobileFocused ? 'mobile-focused' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setHasManuallySwiped(false);
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a') || target.closest('.card-action-btn-wa') || target.closest('.card-action-btn-call') || target.closest('.card-action-btn-share')) {
          return;
        }
        onSelect(product);
      }}
      style={{
        backgroundColor: theme.bgCard,
        border: `1px solid ${theme.border}`,
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        boxShadow: isActive
          ? `0 14px 34px -10px ${theme.mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.18)'}`
          : `0 2px 8px -2px ${theme.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.06)'}`,
      }}
    >
      {/* Product Image / Video Frame Container with Touch Swiping */}
      <div
        className="product-card-img-wrap product-card-media"
        style={{
          backgroundColor: theme.mode === 'dark' ? '#0c101a' : '#f8fafc',
          cursor: 'pointer',
          position: 'relative',
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
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              padding: '8px',
              opacity: isActive ? 1 : 0,
              transition: 'opacity 0.3s ease',
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
            const activeMediaObj = (product.media || []).find((m) => m.url === currentImgUrl) || product.media?.[0];
            const cardObjectPosition = activeMediaObj?.objectPosition || product.imagePosition || 'center';
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
                  backgroundColor: idx === currentImageIdx ? theme.primary : 'rgba(255, 255, 255, 0.65)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </div>
        )}

        {/* Video Icon Badge when video is attached */}
        {videoItem && !isActive && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              color: '#ffffff',
              padding: '3px 6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 700,
              zIndex: 4,
              backdropFilter: 'blur(4px)',
            }}
          >
            <PlayCircle size={12} color="#ffffff" />
            <span>Video</span>
          </div>
        )}

        {/* Floating Category & Badge tags */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
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
      <View style={styles.cardContent}>
        <View>
          <View style={styles.codeRow}>
            <Text style={[styles.modelCode, { color: theme.primary }]}>{product.code}</Text>
            {brandOrigin && (
              <Text style={[styles.originTag, { color: theme.textMuted }]}>{brandOrigin}</Text>
            )}
          </View>

          <Text
            style={[styles.productTitle, { color: theme.text }]}
            numberOfLines={2}
            onPress={() => onSelect(product)}
          >
            {product.title}
          </Text>

          {/* Pricing Row if configured */}
          {product.price !== undefined && (
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
                margin: '6px 0 8px 0',
              }}
            >
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: theme.text,
                  letterSpacing: '-0.3px',
                }}
              >
                {product.price} {product.currency || '₼'}
              </span>

              {product.oldPrice && product.oldPrice > product.price && (
                <span
                  style={{
                    fontSize: '13px',
                    color: theme.textMuted,
                    textDecoration: 'line-through',
                  }}
                >
                  {product.oldPrice} {product.currency || '₼'}
                </span>
              )}

              {discountPercent && (
                <span
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  -{discountPercent}%
                </span>
              )}
            </div>
          )}

          {/* Stock Availability indicator */}
          {product.stockStatus === 'preorder' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', color: '#d97706', fontSize: '11px', fontWeight: 700 }}>
              <Clock size={12} />
              <span>Sifarişlə çatdırılma</span>
            </div>
          )}
          {product.stockStatus === 'out_of_stock' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', color: '#ef4444', fontSize: '11px', fontWeight: 700 }}>
              <span>Müvəqqəti bitib</span>
            </div>
          )}

          {/* Highlights Checklist */}
          {product.highlights && product.highlights.length > 0 && (
            <View style={styles.highlightsBox}>
              {product.highlights.slice(0, 2).map((highlight, index) => (
                <View key={index} style={styles.highlightRow}>
                  <Check size={13} color="#16a34a" strokeWidth={2.5} />
                  <Text
                    style={[styles.highlightText, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    {highlight}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons: WhatsApp order, Call & Share */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
          <button
            type="button"
            className="card-action-btn-wa"
            onClick={() => onWhatsApp(product)}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '10px 8px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
            }}
          >
            <WhatsAppIcon size={16} color="#ffffff" />
            <span style={{ whiteSpace: 'nowrap' }}>{whatsappButtonText}</span>
          </button>

          <button
            type="button"
            className="card-action-btn-call"
            onClick={() => onCall(product)}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              backgroundColor: theme.primary,
              color: '#ffffff',
              border: 'none',
              padding: '10px 8px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
            }}
          >
            <Phone size={15} color="#ffffff" />
            <span style={{ whiteSpace: 'nowrap' }}>{callButtonText}</span>
          </button>

          <button
            type="button"
            className="card-action-btn-share"
            onClick={() => onShare(product)}
            title={shareButtonText}
            style={{
              width: '40px',
              height: '40px',
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
            <Share2 size={16} color={theme.textSecondary} />
          </button>
        </div>
      </View>
    </div>
  );
};

const styles = StyleSheet.create({
  cardContent: {
    padding: 16,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modelCode: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  originTag: {
    fontSize: 11,
    fontWeight: '600',
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 8,
    cursor: 'pointer',
  },
  highlightsBox: {
    gap: 4,
    marginVertical: 4,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  highlightText: {
    fontSize: 12,
    flex: 1,
  },
});
