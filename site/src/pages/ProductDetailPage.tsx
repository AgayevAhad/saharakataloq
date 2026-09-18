import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  ExternalLink,
  MapPin,
  Flame,
  CheckCircle2,
  Star,
  FileText,
  Send,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { Product, Brand, CatalogCategory, CatalogSettings } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from '../components/ShimmerImage';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { ProductCard } from '../components/ProductCard';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';

export interface ProductReview {
  id: string;
  author: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  isVerified?: boolean;
}

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

const getDefaultReviews = (productId: string): ProductReview[] => [
  {
    id: `rev-1-${productId}`,
    author: 'Kamran M.',
    rating: 5,
    comment: 'Məhsulu çox bəyəndik, dizaynı və keyfiyyəti əladır. Çatdırılma da vaxtında gəldi.',
    date: '12 sentyabr 2026',
    isVerified: true,
  },
  {
    id: `rev-2-${productId}`,
    author: 'Leyla Ə.',
    rating: 5,
    comment: 'İstifadəsi çox rahatdır və olduqca səssiz işləyir. Sahara Electronics komandasına təşəkkürlər!',
    date: '5 sentyabr 2026',
    isVerified: true,
  },
  {
    id: `rev-3-${productId}`,
    author: 'Rəşad Q.',
    rating: 5,
    comment: 'Rəsmi zəmanətli və orijinal məhsuldur. Quraşdırma və servis xidməti də operativ oldu.',
    date: '28 avqust 2026',
    isVerified: true,
  },
];

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
  // Default tab: 'description' (Təsvir & İcmal first)
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews' | 'tech' | 'delivery'>('description');
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isFullscreenGallery, setIsFullscreenGallery] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isCopied, setIsCopied] = useState(false);

  // Reviews state & form
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    try {
      const saved = localStorage.getItem(`sahara_product_reviews_${product.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return getDefaultReviews(product.id);
  });

  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const { dragProps: _thumbDragProps } = useHorizontalScroll({
    scrollRef: thumbnailScrollRef,
  });

  // Reset states on product change
  useEffect(() => {
    setActiveMediaIndex(0);
    setActiveTab('description');
    setIsVideoMuted(true);
    setIsFullscreenGallery(false);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setReviewSuccessMessage('');
    try {
      const saved = localStorage.getItem(`sahara_product_reviews_${product.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReviews(parsed);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    } catch {
      // ignore
    }
    setReviews(getDefaultReviews(product.id));
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

  // Recommended Products
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

  // Rating calculations
  const averageRating = useMemo(() => {
    if (!reviews.length) return 5.0;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return Number((total / reviews.length).toFixed(1));
  }, [reviews]);

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [reviews]);

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

  // Review submission handler
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newComment.trim()) return;

    const newRev: ProductReview = {
      id: `review-${Date.now()}`,
      author: newAuthor.trim(),
      rating: newRating,
      comment: newComment.trim(),
      date: new Date().toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' }),
      isVerified: true,
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem(`sahara_product_reviews_${product.id}`, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setNewAuthor('');
    setNewComment('');
    setNewRating(5);
    setReviewSuccessMessage('Təşəkkür edirik! Rəyiniz uğurla əlavə edildi.');
    setTimeout(() => setReviewSuccessMessage(''), 4000);
  };

  const scrollToTabs = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Lightbox Drag and Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoomScale <= 1) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    },
    [zoomScale, panPosition]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || zoomScale <= 1) return;
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, zoomScale, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (zoomScale <= 1 || e.touches.length !== 1) return;
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - panPosition.x, y: touch.clientY - panPosition.y });
    },
    [zoomScale, panPosition]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || zoomScale <= 1 || e.touches.length !== 1) return;
      const touch = e.touches[0];
      setPanPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    },
    [isDragging, zoomScale, dragStart]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Lightbox Click-to-Zoom Toggle
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomScale === 1) {
      setZoomScale(2);
    } else {
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
    }
  };

  // Lightbox Double Click Zoom
  const handleImageDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomScale > 1) {
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
    } else {
      setZoomScale(2.5);
    }
  };

  // Mouse wheel zoom in lightbox
  const handleLightboxWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoomScale((prev) => {
      const next = Math.min(3.5, Math.max(1, prev + delta));
      if (next === 1) setPanPosition({ x: 0, y: 0 });
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
      {/* Top Action Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 0 18px',
          borderBottom: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)'}`,
          marginBottom: '28px',
        }}
      >
        {/* Borderless "Kataloqa qayıt" Button */}
        <button
          type="button"
          onClick={() => onNavigate('catalog')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 0',
            backgroundColor: 'transparent',
            border: 'none',
            color: theme.text,
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <ArrowLeft size={16} />
          <span>Kataloqa qayıt</span>
        </button>

        {/* Quick Actions: Linki Kopyala & Paylaş */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '10px',
              backgroundColor: isCopied
                ? '#16a34a'
                : themeMode === 'dark'
                  ? 'rgba(30, 41, 59, 0.6)'
                  : '#ffffff',
              color: isCopied ? '#ffffff' : theme.text,
              border: `1px solid ${isCopied ? '#16a34a' : theme.border}`,
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isCopied ? <Check size={14} /> : <ExternalLink size={14} />}
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
                padding: '7px 14px',
                borderRadius: '10px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : '#ffffff',
                color: theme.text,
                border: `1px solid ${theme.border}`,
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Share2 size={14} />
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '40px',
          alignItems: 'start',
          marginBottom: '52px',
        }}
      >
        {/* Left Column: Enlarged Mega Media Stage & Carousel */}
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
              height: '520px',
              borderRadius: '24px',
              backgroundColor: '#ffffff',
              border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)'}`,
              boxShadow:
                themeMode === 'dark'
                  ? '0 16px 40px rgba(0, 0, 0, 0.4)'
                  : '0 12px 36px rgba(0, 0, 0, 0.05)',
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
                    padding: '5px 12px',
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
                      style={{ height: '20px', maxWidth: '60px', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                      {brand.name}
                    </span>
                  )}
                  {brand.originCountry && (
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>
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

            {/* Top Right Floating Actions */}
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
                    width: '38px',
                    height: '38px',
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
                  {isVideoMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setZoomScale(1);
                  setPanPosition({ x: 0, y: 0 });
                  setIsFullscreenGallery(true);
                }}
                style={{
                  width: '38px',
                  height: '38px',
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
                <Maximize2 size={17} />
              </button>
            </div>

            {/* Media Content Stage */}
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
                onClick={() => {
                  setZoomScale(1);
                  setPanPosition({ x: 0, y: 0 });
                  setIsFullscreenGallery(true);
                }}
              >
                <ShimmerImage
                  src={activeMedia.url}
                  alt={activeMedia.alt || product.title}
                  objectFit={(activeMedia.fitMode as any) || 'contain'}
                  objectPosition={activeMedia.objectPosition || 'center'}
                  spinnerSize={36}
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '480px',
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
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 5,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                  }}
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMediaIndex((prev) => (prev + 1) % mediaList.length);
                  }}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 5,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                  }}
                >
                  <ChevronRight size={20} />
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
                gap: '12px',
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
                      width: '78px',
                      height: '78px',
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
                        <PlayCircle size={24} color="#dc2626" />
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

        {/* Right Column: Title, Clean Price, Action Buttons & Borderless Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Info Header */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '10px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: theme.textSecondary,
                    backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                    padding: '4px 10px',
                    borderRadius: '8px',
                  }}
                >
                  {category?.name || product.categoryName}
                </span>

                {/* Rating Badge with Direct Scroll to Reviews */}
                <button
                  type="button"
                  onClick={() => scrollToTabs('reviews')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'rgba(234, 179, 8, 0.12)',
                    color: '#ca8a04',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '4px 9px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'opacity 0.15s ease',
                  }}
                  title="Müştəri rəylərinə bax"
                >
                  <Star size={13} fill="#eab308" color="#eab308" />
                  <span>{averageRating}</span>
                  <span style={{ color: theme.textMuted, fontWeight: 600 }}>({reviews.length} rəy)</span>
                </button>
              </div>

              {/* Status without "Rəsmi" */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#16a34a',
                  backgroundColor: 'rgba(22, 163, 74, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                }}
              >
                <CheckCircle2 size={13} />
                <span>Anbarda mövcuddur</span>
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(24px, 2.6vw, 32px)',
                fontWeight: 900,
                color: theme.text,
                lineHeight: 1.25,
                margin: '4px 0 10px 0',
                letterSpacing: '-0.02em',
              }}
            >
              {product.title}
            </h1>

            {product.shortDesc && (
              <p
                style={{
                  fontSize: '14.5px',
                  color: theme.textSecondary,
                  lineHeight: 1.6,
                  margin: '0 0 14px 0',
                }}
              >
                {product.shortDesc}
              </p>
            )}
          </div>

          {/* Clean Borderless Price Section */}
          <div style={{ padding: '2px 0 6px', display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
            {currentPrice ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '34px',
                    fontWeight: 900,
                    color: theme.text,
                    fontFamily: 'Outfit, -apple-system, sans-serif',
                  }}
                >
                  {currentPrice.toLocaleString('az-AZ')} ₼
                </span>

                {oldPrice && (
                  <span
                    style={{
                      fontSize: '19px',
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
                      padding: '4px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    -{discountPercent}%
                  </span>
                )}
              </div>
            ) : (
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#dc2626' }}>
                Qiymət üçün əlaqə saxlayın
              </span>
            )}
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
                      backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
                      border: 'none',
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

          {/* Action Buttons: WhatsApp & Call Side-by-Side, Səbət Below, Compare & Favorite Bottom */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Row 1: WhatsApp & Zəng et Side by Side */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {/* WhatsApp Direct Button */}
              <button
                type="button"
                onClick={() => onWhatsApp(product)}
                style={{
                  padding: '14px 18px',
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

              {/* Zəng et Button */}
              <button
                type="button"
                onClick={() => onCall(product)}
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(2, 132, 199, 0.35)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <Phone size={17} color="#ffffff" />
                <span>Zəng et</span>
              </button>
            </div>

            {/* Row 2: Səbətə əlavə et Button (Full Width Below) */}
            {onAddToCart && (
              <button
                type="button"
                onClick={() => onAddToCart(product)}
                style={{
                  width: '100%',
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

            {/* Row 3: Favorite & Compare Side by Side */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(product)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: isFavorite ? '#dc2626' : themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                    color: isFavorite ? '#ffffff' : theme.text,
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Scale size={15} color={isComparing ? '#ffffff' : '#64748b'} />
                  <span>{isComparing ? 'Müqayisədədir' : 'Müqayisə et'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Borderless Trust Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              paddingTop: '6px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
                border: 'none',
              }}
            >
              <Truck size={20} color="#e31e24" />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: theme.text }}>
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
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
                border: 'none',
              }}
            >
              <ShieldCheck size={20} color="#16a34a" />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: theme.text }}>
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
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
                border: 'none',
              }}
            >
              <RotateCcw size={20} color="#0284c7" />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: theme.text }}>
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
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
                border: 'none',
              }}
            >
              <CreditCard size={20} color="#8b5cf6" />
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: theme.text }}>
                  Ödəniş
                </div>
                <div style={{ fontSize: '11px', color: theme.textMuted }}>
                  Nağd və ya Kartla
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Detail Tabs: Description First, Specs, Reviews, Technologies, Delivery */}
      <div ref={tabsContainerRef} style={{ marginBottom: '56px' }}>
        {/* Tabs Control Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            borderBottom: `2px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
            marginBottom: '24px',
            overflowX: 'auto',
          }}
          className="no-scrollbar"
        >
          {/* Tab 1: Description First */}
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              fontSize: '14.5px',
              fontWeight: 800,
              color: activeTab === 'description' ? '#dc2626' : theme.textSecondary,
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <FileText size={16} />
            <span>Təsvir & İcmal</span>
            {activeTab === 'description' && (
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

          {/* Tab 2: Specifications */}
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              fontSize: '14.5px',
              fontWeight: 800,
              color: activeTab === 'specs' ? '#dc2626' : theme.textSecondary,
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
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

          {/* Tab 3: Reviews & Ratings */}
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              fontSize: '14.5px',
              fontWeight: 800,
              color: activeTab === 'reviews' ? '#dc2626' : theme.textSecondary,
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Star size={16} />
            <span>Müştəri Rəyləri ({reviews.length})</span>
            {activeTab === 'reviews' && (
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

          {/* Tab 4: Technologies */}
          <button
            type="button"
            onClick={() => setActiveTab('tech')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              fontSize: '14.5px',
              fontWeight: 800,
              color: activeTab === 'tech' ? '#dc2626' : theme.textSecondary,
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Sparkles size={16} />
            <span>Üstünlüklər</span>
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

          {/* Tab 5: Delivery */}
          <button
            type="button"
            onClick={() => setActiveTab('delivery')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              fontSize: '14.5px',
              fontWeight: 800,
              color: activeTab === 'delivery' ? '#dc2626' : theme.textSecondary,
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
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

        {/* Tab 1 Content: Description & Overview (Default View) */}
        {activeTab === 'description' && (
          <div
            style={{
              backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
              borderRadius: '20px',
              border: `1px solid ${theme.border}`,
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: theme.text,
                  margin: '0 0 12px 0',
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ width: '4px', height: '18px', backgroundColor: '#dc2626', borderRadius: '4px' }} />
                <span>Məhsul Haqqında Ətraflı Məlumat</span>
              </h3>

              {product.description ? (
                <div
                  style={{
                    fontSize: '15.5px',
                    color: theme.text,
                    lineHeight: 1.8,
                    whiteSpace: 'pre-line',
                    padding: '16px 20px',
                    borderRadius: '14px',
                    backgroundColor: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
                    borderLeft: '4px solid #dc2626',
                  }}
                >
                  {product.description}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '14.5px',
                    color: theme.textSecondary,
                    lineHeight: 1.7,
                    padding: '16px 20px',
                    borderRadius: '14px',
                    backgroundColor: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
                    borderLeft: '4px solid #94a3b8',
                  }}
                >
                  {product.title} modeli üçün ətraflı təsvir mətni administrator tərəfindən tənzimlənir. Bütün texniki göstəricilər və parametrlər rəsmi istehsalçı zəmanəti ilə təmin olunur.
                </div>
              )}
            </div>

            {/* Key Advantages Summary */}
            {product.highlights && product.highlights.length > 0 && (
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: theme.text, margin: '0 0 12px 0' }}>
                  Fərqləndirici Xüsusiyyətlər
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  {product.highlights.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc',
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <CheckCircle2 size={16} color="#16a34a" />
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: theme.text }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Switcher to Full Specs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                paddingTop: '16px',
                borderTop: `1px solid ${theme.border}`,
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: theme.text }}>
                  Bütün texniki parametrləri müqayisə etmək istəyirsiniz?
                </div>
                <div style={{ fontSize: '12.5px', color: theme.textMuted }}>
                  Ölçülər, enerji sinfi, material və funksiyaların tam siyahısı
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <span>Bütün Texniki Xüsusiyyətlərə Bax</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2 Content: Specifications Matrix Table */}
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

        {/* Tab 3 Content: Customer Reviews & Ratings */}
        {activeTab === 'reviews' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
            }}
          >
            {/* Reviews Summary & Write Form Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
              }}
            >
              {/* Rating Summary Card */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                  border: `1px solid ${theme.border}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: theme.text, margin: 0 }}>
                  Qiymətləndirmə və Reytinq
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '44px', fontWeight: 900, color: theme.text, lineHeight: 1 }}>
                      {averageRating}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', margin: '6px 0 4px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={16}
                          fill={s <= Math.round(averageRating) ? '#eab308' : 'none'}
                          color={s <= Math.round(averageRating) ? '#eab308' : '#cbd5e1'}
                        />
                      ))}
                    </div>
                    <div style={{ fontSize: '12px', color: theme.textMuted }}>
                      {reviews.length} müştəri rəyi
                    </div>
                  </div>

                  {/* Star Distribution Progress Bars */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[5, 4, 3, 2, 1].map((starNum) => {
                      const count = (ratingCounts as any)[starNum] || 0;
                      const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                      return (
                        <div key={starNum} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                          <span style={{ width: '28px', color: theme.textSecondary, fontWeight: 700 }}>
                            {starNum} ★
                          </span>
                          <div
                            style={{
                              flex: 1,
                              height: '7px',
                              borderRadius: '4px',
                              backgroundColor: themeMode === 'dark' ? '#334155' : '#e2e8f0',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                backgroundColor: '#eab308',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <span style={{ width: '24px', textAlign: 'right', color: theme.textMuted, fontSize: '11px' }}>
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    color: '#16a34a',
                    fontSize: '12.5px',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>100% alıcılar bu modeli tövsiyə edir</span>
                </div>
              </div>

              {/* Add New Review Form */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                  border: `1px solid ${theme.border}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: theme.text, margin: '0 0 14px 0' }}>
                  Məhsula Rəy və Ulduz Bildirin
                </h3>

                {reviewSuccessMessage && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(22, 163, 74, 0.15)',
                      color: '#16a34a',
                      fontSize: '13px',
                      fontWeight: 700,
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Check size={16} />
                    <span>{reviewSuccessMessage}</span>
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Interactive Star Rating Selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: theme.text, marginBottom: '6px' }}>
                      Qiymətiniz (Ulduz seçin) *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const isFilled = starVal <= (hoverRating !== null ? hoverRating : newRating);
                        return (
                          <button
                            key={starVal}
                            type="button"
                            onClick={() => setNewRating(starVal)}
                            onMouseEnter={() => setHoverRating(starVal)}
                            onMouseLeave={() => setHoverRating(null)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title={`${starVal} ulduz`}
                          >
                            <Star
                              size={24}
                              fill={isFilled ? '#eab308' : 'none'}
                              color={isFilled ? '#eab308' : '#cbd5e1'}
                              strokeWidth={2}
                            />
                          </button>
                        );
                      })}
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#ca8a04', marginLeft: '6px' }}>
                        {newRating === 5
                          ? 'Əla (5/5)'
                          : newRating === 4
                            ? 'Çox yaxşı (4/5)'
                            : newRating === 3
                              ? 'Yaxşı (3/5)'
                              : newRating === 2
                                ? 'Kafi (2/5)'
                                : 'Zəif (1/5)'}
                      </span>
                    </div>
                  </div>

                  {/* Author Name */}
                  <div>
                    <input
                      type="text"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="Adınız və Soyadınız *"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${theme.border}`,
                        backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                        color: theme.text,
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Comment Textarea */}
                  <div>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Məhsul haqqında təcrübənizi və fikirlərinizi bölüşün... *"
                      rows={3}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${theme.border}`,
                        backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f8fafc',
                        color: theme.text,
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '11px 20px',
                      borderRadius: '10px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
                    }}
                  >
                    <Send size={15} />
                    <span>Rəyi Göndər</span>
                  </button>
                </form>
              </div>
            </div>

            {/* List of Existing Customer Reviews */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: theme.text, margin: 0 }}>
                Müştəri Şərhləri ({reviews.length})
              </h4>

              {reviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '18px 22px',
                    borderRadius: '16px',
                    backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                    border: `1px solid ${theme.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14.5px', fontWeight: 800, color: theme.text }}>
                        {r.author}
                      </span>
                      {r.isVerified && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#16a34a',
                            backgroundColor: 'rgba(22, 163, 74, 0.1)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          <UserCheck size={12} />
                          <span>Təsdiqlənmiş Alıcı</span>
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((st) => (
                          <Star
                            key={st}
                            size={14}
                            fill={st <= r.rating ? '#eab308' : 'none'}
                            color={st <= r.rating ? '#eab308' : '#cbd5e1'}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '12px', color: theme.textMuted }}>
                        {r.date}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '14px', color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>
                    {r.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4 Content: Technologies and Highlights */}
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

        {/* Tab 5 Content: Delivery and Service Terms */}
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
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
                border: 'none',
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

      {/* Fullscreen Interactive Lightbox Modal with Studio White Canvas, Click-to-Zoom & Drag/Pan */}
      {isFullscreenGallery && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px 20px',
            boxSizing: 'border-box',
          }}
          onClick={() => setIsFullscreenGallery(false)}
          onWheel={handleLightboxWheel}
        >
          {/* Lightbox Top Header (Clean Light Design) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#0f172a',
              zIndex: 10,
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              backdropFilter: 'blur(10px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '15px', fontWeight: 800, maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.title} {mediaList.length > 1 && `(${activeMediaIndex + 1} / ${mediaList.length})`}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Zoom Out Button */}
              <button
                type="button"
                onClick={() => {
                  setZoomScale((z) => {
                    const next = Math.max(z - 0.4, 1);
                    if (next === 1) setPanPosition({ x: 0, y: 0 });
                    return next;
                  });
                }}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Uzaqlaşdır"
              >
                <ZoomOut size={17} />
              </button>

              {/* Zoom Level Indicator / Reset Button */}
              <button
                type="button"
                onClick={() => {
                  setZoomScale(1);
                  setPanPosition({ x: 0, y: 0 });
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: '10px',
                  backgroundColor: zoomScale > 1 ? '#fee2e2' : '#f1f5f9',
                  color: zoomScale > 1 ? '#dc2626' : '#475569',
                  border: `1px solid ${zoomScale > 1 ? '#fca5a5' : '#e2e8f0'}`,
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Zoom-u sıfırla (100%)"
              >
                <RefreshCw size={12} />
                <span>{Math.round(zoomScale * 100)}%</span>
              </button>

              {/* Zoom In Button */}
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(z + 0.4, 3.5))}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Böyüt (Kliklə yaxınlaşdır)"
              >
                <ZoomIn size={17} />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsFullscreenGallery(false)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                }}
                title="Bağla"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lightbox Center Content with Click-to-Zoom and Pan & Drag */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
              backgroundColor: '#ffffff',
            }}
            onClick={activeMedia?.type === 'image' ? handleImageClick : (e) => e.stopPropagation()}
            onDoubleClick={activeMedia?.type === 'image' ? handleImageDoubleClick : undefined}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {activeMedia?.type === 'video' ? (
              <video
                ref={fullscreenVideoRef}
                src={activeMedia.url}
                autoPlay
                controls
                muted={isVideoMuted}
                style={{ maxHeight: '80vh', maxWidth: '88vw', borderRadius: '16px' }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={activeMedia?.url}
                alt={activeMedia?.alt || product.title}
                draggable={false}
                style={{
                  maxHeight: '82vh',
                  maxWidth: '88vw',
                  objectFit: 'contain',
                  transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
                  transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
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
                gap: '10px',
                zIndex: 10,
                padding: '8px 0',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                maxWidth: 'fit-content',
                margin: '0 auto',
                paddingLeft: '14px',
                paddingRight: '14px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {mediaList.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setActiveMediaIndex(idx);
                    setZoomScale(1);
                    setPanPosition({ x: 0, y: 0 });
                  }}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    border: `2px solid ${idx === activeMediaIndex ? '#dc2626' : '#e2e8f0'}`,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    padding: 0,
                    boxShadow: idx === activeMediaIndex ? '0 2px 8px rgba(220, 38, 38, 0.25)' : 'none',
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
