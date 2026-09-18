import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Share2,
  Heart,
  ShoppingCart,
  Scale,
  Phone,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  PlayCircle,
  Layers,
  Sparkles,
  Info,
  ExternalLink,
  MapPin,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { Product, Brand, CatalogCategory, CatalogSettings } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from '../components/ShimmerImage';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { ProductCard } from '../components/ProductCard';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  categories: CatalogCategory[];
  brands: Brand[];
  settings: CatalogSettings;
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  onNavigate: (route: string, param?: string) => void;
  onSelectProduct: (product: Product) => void;
  onWhatsApp: (product?: Product | null) => void;
  onCall: (productOrPhone?: Product | string) => void;
  onShare?: (product: Product) => void;
  onCopyLink?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
  onToggleCompare?: (product: Product) => void;
  isComparing?: boolean;
  cartCount?: number;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  categories,
  brands,
  settings,
  theme,
  themeMode,
  onNavigate,
  onSelectProduct,
  onWhatsApp,
  onCall,
  onShare,
  onCopyLink,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  onToggleCompare,
  isComparing = false,
  cartCount: _cartCount,
}) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'tech' | 'delivery'>('specs');
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isFullscreenGallery, setIsFullscreenGallery] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [isCopied, setIsCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);

  const { dragProps: _thumbDragProps } = useHorizontalScroll({
    scrollRef: thumbnailScrollRef,
  });

  // Reset states on product change
  useEffect(() => {
    setActiveMediaIndex(0);
    setActiveTab('specs');
    setIsVideoMuted(true);
    setIsFullscreenGallery(false);
    setZoomScale(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.id]);

  // Brand and category info
  const brand = useMemo(
    () => brands.find((b) => b.id === product.brandId),
    [brands, product.brandId]
  );
  const category = useMemo(
    () => categories.find((c) => c.id === product.category),
    [categories, product.category]
  );

  // Gallery and media list
  const mediaList = useMemo(() => {
    const list: Array<{
      id: string;
      url: string;
      type: 'image' | 'video';
      poster?: string;
      alt?: string;
      objectPosition?: string;
      fitMode?: string;
    }> = [];

    const seenUrls = new Set<string>();

    if (Array.isArray(product.media) && product.media.length > 0) {
      product.media.forEach((m, idx) => {
        if (m.url && !seenUrls.has(m.url)) {
          seenUrls.add(m.url);
          list.push({
            id: m.id || `media-${idx}`,
            url: m.url,
            type: m.type || 'image',
            poster: m.poster,
            alt: m.alt || `${product.title} - ${idx + 1}`,
            objectPosition: m.objectPosition,
            fitMode: m.fitMode,
          });
        }
      });
    }

    if (product.image && !seenUrls.has(product.image)) {
      seenUrls.add(product.image);
      list.unshift({
        id: 'cover-image',
        url: product.image,
        type: 'image',
        alt: product.title,
        objectPosition: product.imagePosition,
        fitMode: product.imageFit,
      });
    }

    if (Array.isArray(product.gallery)) {
      product.gallery.forEach((gUrl, idx) => {
        if (gUrl && !seenUrls.has(gUrl)) {
          seenUrls.add(gUrl);
          list.push({
            id: `gallery-${idx}`,
            url: gUrl,
            type: 'image',
            alt: `${product.title} - ${idx + 1}`,
          });
        }
      });
    }

    return list;
  }, [product]);

  const activeMedia = mediaList[activeMediaIndex] || mediaList[0];

  // Grouped Specs
  const specGroups = useMemo(() => {
    if (!product.specs || product.specs.length === 0) return {};
    const groups: Record<string, Array<{ name: string; value: string }>> = {};
    product.specs.forEach((spec) => {
      const groupName = spec.group || 'Əsas Parametrlər';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push({ name: spec.name, value: spec.value });
    });
    return groups;
  }, [product.specs]);

  // Recommended Products (same category or brand, excluding current product)
  const recommendedProducts = useMemo(() => {
    const sameCategory = allProducts.filter(
      (p) => p.id !== product.id && p.category === product.category
    );
    const sameBrand = allProducts.filter(
      (p) => p.id !== product.id && p.brandId === product.brandId && p.category !== product.category
    );
    const otherProducts = allProducts.filter(
      (p) => p.id !== product.id && p.category !== product.category && p.brandId !== product.brandId
    );

    const pool = [...sameCategory, ...sameBrand, ...otherProducts];
    return pool.slice(0, 6);
  }, [allProducts, product.id, product.category, product.brandId]);

  // Price calculations
  const rawPrice = product.price ?? (product as any).priceCash;
  const currentPrice =
    rawPrice !== undefined && rawPrice !== null && Number(rawPrice) > 0 ? Number(rawPrice) : null;
  const oldPrice =
    product.oldPrice && product.oldPrice > (currentPrice || 0) ? product.oldPrice : null;
  const discountPercent =
    currentPrice && oldPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : null;

  const handleCopyLink = () => {
    if (onCopyLink) {
      onCopyLink(product);
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleVideoMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsVideoMuted((prev) => {
      const next = !prev;
      if (videoRef.current) videoRef.current.muted = next;
      if (fullscreenVideoRef.current) fullscreenVideoRef.current.muted = next;
      return next;
    });
  };

  return (
    <div
      className="product-detail-page-container"
      style={{
        width: '100%',
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '0 clamp(16px, 2.5vw, 36px) 80px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header & Breadcrumbs Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px 0 20px',
          borderBottom: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)'}`,
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '10px',
              backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
              color: theme.text,
              border: `1px solid ${theme.border}`,
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={14} />
            <span>Kataloqa qayıt</span>
          </button>

          <span style={{ color: theme.textMuted, fontSize: '13px' }}>/</span>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            style={{
              background: 'none',
              border: 'none',
              color: theme.textMuted,
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Ana Səhifə
          </button>

          <span style={{ color: theme.textMuted, fontSize: '13px' }}>/</span>

          <button
            type="button"
            onClick={() => onNavigate('catalog', product.category)}
            style={{
              background: 'none',
              border: 'none',
              color: theme.textMuted,
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {category?.name || product.categoryName || 'Kateqoriya'}
          </button>

          <span style={{ color: theme.textMuted, fontSize: '13px' }}>/</span>

          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: theme.primary,
              maxWidth: '220px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {product.code}
          </span>
        </div>

        {/* Quick Action Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '10px',
              backgroundColor: isCopied
                ? '#16a34a'
                : themeMode === 'dark'
                  ? 'rgba(30, 41, 59, 0.6)'
                  : '#ffffff',
              color: isCopied ? '#ffffff' : theme.text,
              border: `1px solid ${isCopied ? '#16a34a' : theme.border}`,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isCopied ? <Check size={13} /> : <ExternalLink size={13} />}
            <span>{isCopied ? 'Kopyalandı' : 'Linki Kopyala'}</span>
          </button>

          {onShare && (
            <button
              type="button"
              onClick={() => onShare(product)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '10px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : '#ffffff',
                color: theme.text,
                border: `1px solid ${theme.border}`,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Share2 size={13} />
              <span>Paylaş</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Product Showcase Section */}
      <div
        className="product-detail-hero-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '36px',
          alignItems: 'start',
          marginBottom: '48px',
        }}
      >
        {/* Left Column: Mega Media Stage & Interactive Carousel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'sticky',
            top: '88px',
          }}
        >
          {/* Main Large Media Viewport */}
          <div
            className="product-detail-main-stage"
            style={{
              width: '100%',
              height: '460px',
              borderRadius: '24px',
              backgroundColor: '#ffffff',
              border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 232, 240, 0.9)'}`,
              boxShadow:
                themeMode === 'dark'
                  ? '0 16px 40px rgba(0, 0, 0, 0.4)'
                  : '0 12px 36px rgba(0, 0, 0, 0.06)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              boxSizing: 'border-box',
            }}
          >
            {/* Top Left Badges */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                zIndex: 6,
                pointerEvents: 'none',
              }}
            >
              {brand && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      style={{ height: '18px', maxWidth: '50px', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                      {brand.name}
                    </span>
                  )}
                  {brand.originCountry && (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                      · {brand.originCountry}
                    </span>
                  )}
                </div>
              )}

              {product.badgeText && (
                <div
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Flame size={12} />
                  <span>{product.badgeText}</span>
                </div>
              )}
            </div>

            {/* Top Right Floating Stage Actions */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 6,
              }}
            >
              {activeMedia?.type === 'video' && (
                <button
                  type="button"
                  onClick={toggleVideoMute}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: isVideoMuted ? 'rgba(0, 0, 0, 0.7)' : '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backdropFilter: 'blur(6px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                  title={isVideoMuted ? 'Səsi aç' : 'Səsi bağla'}
                >
                  {isVideoMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsFullscreenGallery(true)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#0f172a',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(6px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                title="Böyük ekranda bax"
              >
                <Maximize2 size={16} />
              </button>
            </div>

            {/* Media Content Stage (Video or Image) */}
            {activeMedia?.type === 'video' ? (
              <video
                ref={videoRef}
                src={activeMedia.url}
                poster={activeMedia.poster || product.image}
                autoPlay
                loop
                muted={isVideoMuted}
                playsInline
                controls={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '16px',
                }}
              />
            ) : activeMedia?.url ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'zoom-in',
                }}
                onClick={() => setIsFullscreenGallery(true)}
              >
                <ShimmerImage
                  src={activeMedia.url}
                  alt={activeMedia.alt || product.title}
                  objectFit={(activeMedia.fitMode as any) || 'contain'}
                  objectPosition={activeMedia.objectPosition || 'center'}
                  spinnerSize={32}
                  style={{
                    width: '100%',
                    height: '100%',
                    transition: 'transform 0.3s ease',
                  }}
                />
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>
                Şəkil mövcud deyil
              </div>
            )}

            {/* Previous / Next Arrow Controls */}
            {mediaList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
                  }}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 5,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMediaIndex((prev) => (prev + 1) % mediaList.length);
                  }}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 5,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Horizontal Navigation Strip */}
          {mediaList.length > 1 && (
            <div
              ref={thumbnailScrollRef}
              className="no-scrollbar"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                overflowX: 'auto',
                padding: '4px 2px',
              }}
            >
              {mediaList.map((m, idx) => {
                const isActive = idx === activeMediaIndex;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMediaIndex(idx)}
                    style={{
                      width: '74px',
                      height: '74px',
                      flexShrink: 0,
                      borderRadius: '14px',
                      backgroundColor: '#ffffff',
                      border: `2px solid ${isActive ? '#dc2626' : themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                      padding: '4px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: isActive ? '0 4px 12px rgba(220, 38, 38, 0.25)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {m.type === 'video' ? (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          borderRadius: '8px',
                        }}
                      >
                        <PlayCircle size={22} color="#dc2626" />
                      </div>
                    ) : (
                      <img
                        src={m.url}
                        alt={m.alt || ''}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          borderRadius: '8px',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Product Title, Pricing, Actions & Trust Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Info Header */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  color: '#dc2626',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                {product.code}
              </span>

              <span style={{ color: theme.textMuted }}>•</span>

              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: theme.textSecondary,
                  backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                {category?.name || product.categoryName}
              </span>

              <span
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#16a34a',
                  backgroundColor: 'rgba(22, 163, 74, 0.1)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                <CheckCircle2 size={13} />
                <span>Rəsmi Anbarda mövcuddur</span>
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(22px, 2.5vw, 30px)',
                fontWeight: 900,
                color: theme.text,
                lineHeight: 1.25,
                margin: '0 0 12px 0',
                letterSpacing: '-0.02em',
              }}
            >
              {product.title}
            </h1>

            {product.description && (
              <p
                style={{
                  fontSize: '14px',
                  color: theme.textSecondary,
                  lineHeight: 1.6,
                  margin: '0 0 16px 0',
                }}
              >
                {product.description}
              </p>
            )}
          </div>

          {/* Pricing Box */}
          <div
            style={{
              padding: '20px',
              borderRadius: '20px',
              backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
              border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                Xüsusi Kataloq Qiyməti
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                {currentPrice ? (
                  <span
                    style={{
                      fontSize: '32px',
                      fontWeight: 900,
                      color: theme.text,
                      fontFamily: 'Outfit, -apple-system, sans-serif',
                    }}
                  >
                    {currentPrice.toLocaleString('az-AZ')} ₼
                  </span>
                ) : (
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626' }}>
                    Qiymət üçün əlaqə saxlayın
                  </span>
                )}

                {oldPrice && (
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: theme.textMuted,
                      textDecoration: 'line-through',
                    }}
                  >
                    {oldPrice.toLocaleString('az-AZ')} ₼
                  </span>
                )}

                {discountPercent && (
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 900,
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    -{discountPercent}%
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: themeMode === 'dark' ? '#0f172a' : '#ffffff',
                padding: '8px 14px',
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
              }}
            >
              <CreditCard size={18} color="#0284c7" />
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: theme.text }}>
                  Hissə-hissə ödəniş
                </div>
                <div style={{ fontSize: '10.5px', color: theme.textMuted }}>
                  Birkart / Tamkart ilə
                </div>
              </div>
            </div>
          </div>

          {/* Key Highlights Checklist */}
          {product.highlights && product.highlights.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: theme.text, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Əsas Üstünlüklər
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {product.highlights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <Check size={14} color="#16a34a" strokeWidth={3} />
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: theme.text }}>
                      {h}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Primary Action Buttons Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {/* WhatsApp Direct Order Button */}
              <button
                type="button"
                onClick={() => onWhatsApp(product)}
                style={{
                  padding: '14px 20px',
                  borderRadius: '14px',
                  backgroundColor: '#25D366',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(37, 211, 102, 0.35)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <WhatsAppIcon size={18} color="#ffffff" />
                <span>WhatsApp ilə Sifariş et</span>
              </button>

              {/* Add to Cart Button */}
              {onAddToCart && (
                <button
                  type="button"
                  onClick={() => onAddToCart(product)}
                  style={{
                    padding: '14px 20px',
                    borderRadius: '14px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 20px rgba(220, 38, 38, 0.35)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <ShoppingCart size={18} color="#ffffff" />
                  <span>Səbətə əlavə et</span>
                </button>
              )}
            </div>

            {/* Secondary Actions: Call, Favorite, Compare */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => onCall(product)}
                style={{
                  flex: 1,
                  minWidth: '130px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Phone size={15} color="#0284c7" />
                <span>Zəng et</span>
              </button>

              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(product)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: isFavorite ? '#dc2626' : themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                    color: isFavorite ? '#ffffff' : theme.text,
                    border: `1px solid ${isFavorite ? '#dc2626' : theme.border}`,
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Heart size={15} fill={isFavorite ? '#ffffff' : 'none'} color={isFavorite ? '#ffffff' : '#dc2626'} />
                  <span>{isFavorite ? 'Seçilmişlərdədir' : 'Seçilmişlərə at'}</span>
                </button>
              )}

              {onToggleCompare && (
                <button
                  type="button"
                  onClick={() => onToggleCompare(product)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: isComparing ? '#2563eb' : themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                    color: isComparing ? '#ffffff' : theme.text,
                    border: `1px solid ${isComparing ? '#2563eb' : theme.border}`,
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Scale size={15} color={isComparing ? '#ffffff' : '#64748b'} />
                  <span>{isComparing ? 'Müqayisədədir' : 'Müqayisə et'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Trust / Value Proposition Badges */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              paddingTop: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '14px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
                border: `1px solid ${theme.border}`,
              }}
            >
              <Truck size={20} color="#e31e24" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: theme.text }}>
                  Sürətli Çatdırılma
                </div>
                <div style={{ fontSize: '11px', color: theme.textMuted }}>
                  Bakı və Abşeron ərazisi
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '14px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
                border: `1px solid ${theme.border}`,
              }}
            >
              <ShieldCheck size={20} color="#16a34a" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: theme.text }}>
                  Rəsmi Zəmanət
                </div>
                <div style={{ fontSize: '11px', color: theme.textMuted }}>
                  3 İl Rəsmi Servis
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '14px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
                border: `1px solid ${theme.border}`,
              }}
            >
              <RotateCcw size={20} color="#0284c7" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: theme.text }}>
                  14 Gün Zəmanət
                </div>
                <div style={{ fontSize: '11px', color: theme.textMuted }}>
                  Rahat Dəyişdirmə
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '14px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
                border: `1px solid ${theme.border}`,
              }}
            >
              <CreditCard size={20} color="#8b5cf6" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: theme.text }}>
                  Qapıda Ödəniş
                </div>
                <div style={{ fontSize: '11px', color: theme.textMuted }}>
                  Nağd və ya Kartla
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Detail Tabs: Specifications, Technologies, Services */}
      <div style={{ marginBottom: '56px' }}>
        {/* Tabs Control Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: `2px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
            marginBottom: '24px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              fontSize: '15px',
              fontWeight: 800,
              color: activeTab === 'specs' ? '#dc2626' : theme.textSecondary,
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Layers size={16} />
            <span>Texniki Xüsusiyyətlər</span>
            {activeTab === 'specs' && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: '#dc2626',
                }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tech')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              fontSize: '15px',
              fontWeight: 800,
              color: activeTab === 'tech' ? '#dc2626' : theme.textSecondary,
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Sparkles size={16} />
            <span>Üstünlüklər & Texnologiyalar</span>
            {activeTab === 'tech' && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: '#dc2626',
                }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('delivery')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              fontSize: '15px',
              fontWeight: 800,
              color: activeTab === 'delivery' ? '#dc2626' : theme.textSecondary,
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Truck size={16} />
            <span>Çatdırılma & Zəmanət</span>
            {activeTab === 'delivery' && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: '#dc2626',
                }}
              />
            )}
          </button>
        </div>

        {/* Tab 1: Specifications Matrix Table */}
        {activeTab === 'specs' && (
          <div
            style={{
              backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
              borderRadius: '20px',
              border: `1px solid ${theme.border}`,
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}
          >
            {Object.keys(specGroups).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {Object.entries(specGroups).map(([groupTitle, specs]) => (
                  <div key={groupTitle}>
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: theme.text,
                        margin: '0 0 12px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span style={{ width: '4px', height: '16px', backgroundColor: '#dc2626', borderRadius: '4px' }} />
                      <span>{groupTitle}</span>
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', border: `1px solid ${theme.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                      {specs.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            backgroundColor: index % 2 === 0 ? (themeMode === 'dark' ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc') : 'transparent',
                            borderBottom: index === specs.length - 1 ? 'none' : `1px solid ${theme.border}`,
                          }}
                        >
                          <span style={{ fontSize: '13.5px', color: theme.textSecondary, fontWeight: 500 }}>
                            {item.name}
                          </span>
                          <span style={{ fontSize: '13.5px', color: theme.text, fontWeight: 700, textAlign: 'right' }}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: theme.textMuted, fontSize: '14px', textAlign: 'center', padding: '24px' }}>
                Bu model üçün əlavə texniki parametr göstəricisi qeyd edilməyib.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Technologies and Highlights */}
        {activeTab === 'tech' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            <div
              style={{
                padding: '24px',
                borderRadius: '20px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Sparkles size={20} color="#dc2626" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: theme.text, margin: '0 0 8px 0' }}>
                Rəsmi İtaliya & Avropa Texnologiyası
              </h4>
              <p style={{ fontSize: '13.5px', color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>
                {brand?.name} məişət texnikası beynəlxalq keyfiyyət və təhlükəsizlik standartlarına tam uyğundur. Yüksək dərəcəli materiallardan və mühəndislik həllərindən istifadə edilmişdir.
              </p>
            </div>

            <div
              style={{
                padding: '24px',
                borderRadius: '20px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <CheckCircle2 size={20} color="#16a34a" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: theme.text, margin: '0 0 8px 0' }}>
                Enerji Səmərəliliyi və Səssiz İşləmə
              </h4>
              <p style={{ fontSize: '13.5px', color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>
                Aparat ekoloji təhlükəsizlik qaydalarına uyğun minimum enerji və resurs sərfiyyatı ilə maksimal məhsuldarlıq təmin edir.
              </p>
            </div>

            <div
              style={{
                padding: '24px',
                borderRadius: '20px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(2, 132, 199, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <ShieldCheck size={20} color="#0284c7" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: theme.text, margin: '0 0 8px 0' }}>
                Uzunömürlü İstifadə və Servis
              </h4>
              <p style={{ fontSize: '13.5px', color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>
                Sahara Electronics tərəfindən rəsmi ehtiyat hissələri və sertifikatlı ustalar vasitəsilə daimi texniki dəstək zəmanəti verilir.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Delivery and Service Terms */}
        {activeTab === 'delivery' && (
          <div
            style={{
              padding: '28px',
              borderRadius: '20px',
              backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
              border: `1px solid ${theme.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Truck size={22} color="#dc2626" />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: theme.text, margin: '0 0 4px 0' }}>
                  Çatdırılma Şərtləri
                </h4>
                <p style={{ fontSize: '14px', color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>
                  Sifarişləriniz Bakı və Abşeron yarımadası ərazisinə gün ərzində sürətli və təhlükəsiz şəkildə çatdırılır. Bölgələrə çatdırılma poçt və ya xüsusi kuryer xidməti ilə həyata keçirilir.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={22} color="#16a34a" />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: theme.text, margin: '0 0 4px 0' }}>
                  Rəsmi Zəmanət və Quraşdırma
                </h4>
                <p style={{ fontSize: '14px', color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>
                  Bütün məhsullara rəsmi distribütor tərəfindən 36 ay (3 il) müddətinə tam zəmanət verilir. İstehsal qüsuru aşkar edildikdə məhsul 14 gün ərzində dərhal yenisi ilə əvəzlənir.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(2, 132, 199, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={22} color="#0284c7" />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: theme.text, margin: '0 0 4px 0' }}>
                  Mağaza və Showroom Ünvanlarımız
                </h4>
                <p style={{ fontSize: '14px', color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>
                  {settings.addresses && settings.addresses.length > 0
                    ? settings.addresses.join(' • ')
                    : 'Sədərək Ticarət Mərkəzi, Şirniyyat bazarı ilə üzbəüz, 5-ci sıra, Mağaza 40'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommended Products Section */}
      {recommendedProducts.length > 0 && (
        <section style={{ marginTop: '32px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: theme.text,
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Tövsiyə Olunan Modellər
              </h2>
              <p style={{ fontSize: '13.5px', color: theme.textMuted, margin: '4px 0 0 0' }}>
                Bu kateqoriyada ən çox seçilən və uyğun alternativ çeşidlər
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('catalog', product.category)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '12px',
                backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                color: theme.text,
                border: `1px solid ${theme.border}`,
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>Bütün oxşar modellərə bax</span>
              <ChevronRight size={15} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 339px))',
              gap: '20px',
              justifyContent: 'start',
            }}
          >
            {recommendedProducts.map((p) => {
              const brandObj = brands.find((b) => b.id === p.brandId);
              return (
                <ProductCard
                  key={p.id}
                  product={p}
                  theme={theme}
                  brandName={brandObj?.name}
                  brandOrigin={brandObj?.originCountry ? `${brandObj.originCountry} brendi` : ''}
                  whatsappButtonText={settings?.whatsappButtonText}
                  callButtonText={settings?.callButtonText}
                  shareButtonText={settings?.shareButtonText}
                  onSelect={onSelectProduct}
                  onWhatsApp={onWhatsApp}
                  onCall={onCall}
                  onShare={onShare}
                  onCopyLink={onCopyLink}
                  onAddToCart={onAddToCart}
                  onToggleFavorite={onToggleFavorite}
                  isFavorite={isFavorite}
                  onToggleCompare={onToggleCompare}
                  isComparing={isComparing}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Fullscreen Lightbox Image Modal */}
      {isFullscreenGallery && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px',
            boxSizing: 'border-box',
          }}
          onClick={() => setIsFullscreenGallery(false)}
        >
          {/* Lightbox Top Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff',
              zIndex: 10,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '14px', fontWeight: 700 }}>
              {product.title} ({activeMediaIndex + 1} / {mediaList.length})
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(z - 0.25, 0.75))}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ZoomOut size={18} />
              </button>

              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(z + 0.25, 2.5))}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ZoomIn size={18} />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreenGallery(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(220, 38, 38, 0.85)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lightbox Center Content */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {activeMedia?.type === 'video' ? (
              <video
                ref={fullscreenVideoRef}
                src={activeMedia.url}
                autoPlay
                controls
                muted={isVideoMuted}
                style={{ maxHeight: '80vh', maxWidth: '90vw', borderRadius: '16px' }}
              />
            ) : (
              <img
                src={activeMedia?.url}
                alt={activeMedia?.alt || product.title}
                style={{
                  maxHeight: '80vh',
                  maxWidth: '90vw',
                  objectFit: 'contain',
                  transform: `scale(${zoomScale})`,
                  transition: 'transform 0.2s ease',
                  userSelect: 'none',
                }}
              />
            )}
          </div>

          {/* Lightbox Bottom Thumbnails */}
          {mediaList.length > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                zIndex: 10,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {mediaList.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMediaIndex(idx)}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: `2px solid ${idx === activeMediaIndex ? '#dc2626' : 'rgba(255,255,255,0.4)'}`,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <img
                    src={m.url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
