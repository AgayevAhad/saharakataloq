import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Share2, Copy, Printer, Flame, Phone,
  ZoomIn, ZoomOut, Maximize2
} from 'lucide-react';
import { Brand, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { WhatsAppIcon } from './WhatsAppIcon';

interface ProductDetailModalProps {
  product: Product | null;
  brand?: Brand;
  theme: ThemeColors;
  visible: boolean;
  onClose: () => void;
  onShare: (product: Product) => void;
  onWhatsApp: (product: Product) => void;
  onCall: (product: Product) => void;
  onCopyLink: (product: Product) => void;
  whatsappButtonText?: string;
  callButtonText?: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = React.memo(({
  product,
  brand,
  theme,
  visible,
  onClose,
  onShare,
  onWhatsApp,
  onCall,
  onCopyLink,
  whatsappButtonText = 'WhatsApp ilə məlumat al',
  callButtonText = 'Zəng et',
}) => {
  const [activeTab, setActiveTab] = useState<'specs' | 'tech'>('specs');
  const [isFullscreenImage, setIsFullscreenImage] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    setActiveMediaIndex(0);
    setIsFullscreenImage(false);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, [product?.id]);

  // Prevent background scroll when modal or fullscreen image is open
  useEffect(() => {
    if (visible || isFullscreenImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible, isFullscreenImage]);

  // Reset zoom and pan on close
  useEffect(() => {
    if (!isFullscreenImage) {
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isFullscreenImage]);

  // Group specs with useMemo
  const specGroups = useMemo(() => {
    if (!product) return {};
    const groups: { [key: string]: typeof product.specs } = {};
    product.specs.forEach((item) => {
      const group = item.group || 'Əsas';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
    });
    return groups;
  }, [product]);

  const mediaItems = useMemo(() => {
    if (!product) return [];
    const items: Array<{ id: string; url: string; type?: 'image' | 'video'; alt?: string; poster?: string; objectPosition?: string; fitMode?: string }> = [];
    const seen = new Set<string>();

    if (product.media && product.media.length) {
      product.media.forEach((m, idx) => {
        if (m.url && !seen.has(m.url)) {
          seen.add(m.url);
          items.push({
            id: m.id || `media-${idx}`,
            url: m.url,
            type: m.type || 'image',
            alt: m.alt || product.title,
            poster: m.poster,
            objectPosition: m.objectPosition || product.imagePosition || 'center',
            fitMode: m.fitMode || product.imageFit || 'contain',
          });
        }
      });
    }

    if (product.image && !seen.has(product.image)) {
      seen.add(product.image);
      items.push({
        id: `main-${product.id}`,
        url: product.image,
        type: 'image',
        alt: product.title,
        objectPosition: product.imagePosition || 'center',
        fitMode: product.imageFit || 'contain',
      });
    }

    if (product.gallery && product.gallery.length) {
      product.gallery.forEach((url, idx) => {
        if (url && !seen.has(url)) {
          seen.add(url);
          items.push({
            id: `gal-${idx}`,
            url,
            type: 'image',
            alt: product.title,
            objectPosition: 'center',
            fitMode: 'contain',
          });
        }
      });
    }

    return items.length ? items : [{ id: 'empty', url: '', type: 'image' as const, alt: product?.title || '' }];
  }, [product]);

  const activeMedia = mediaItems[Math.min(activeMediaIndex, Math.max(0, mediaItems.length - 1))];

  const activeObjectPosition = (activeMedia as any)?.objectPosition || (product as any)?.imagePosition || 'center';
  const activeFitMode = (activeMedia as any)?.fitMode || (product as any)?.imageFit || 'contain';

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const zoomIn = () => {
    setZoomScale((prev) => Math.min(4, Number((prev + 0.5).toFixed(1))));
  };

  const zoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const resetZoom = () => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const toggleZoom = () => {
    setZoomScale((prev) => {
      if (prev === 1) return 2;
      setPanPosition({ x: 0, y: 0 });
      return 1;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setPanPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomScale <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoomScale <= 1 || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    setPanPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoomScale((prev) => {
      const next = Math.max(1, Math.min(4, Number((prev + delta).toFixed(2))));
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  if (!visible || !product) return null;

  return (
    <>
      <div
        className="modal-overlay-wrap modal-backdrop-anim"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="modal-content-card modal-dialog-anim"
          style={{
            backgroundColor: theme.bgCard,
            borderColor: theme.border,
            boxShadow: theme.mode === 'dark' ? '0 25px 50px -12px rgba(0, 0, 0, 0.85)' : '0 20px 40px -10px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Modal Sticky Header */}
          <div
            className="modal-header-sticky"
            style={{
              backgroundColor: theme.bgSecondary,
              borderBottom: `1px solid ${theme.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <span
                style={{
                  backgroundColor: theme.primary,
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {product.code}
              </span>
              <span
                style={{
                  color: theme.textMuted,
                  fontSize: '12px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {product.categoryName}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                onClick={handlePrint}
                style={{
                  background: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                  padding: '6px 8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: theme.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Çap et / PDF Saxla"
              >
                <Printer size={16} />
              </button>

              <button
                onClick={() => onShare(product)}
                style={{
                  background: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                  padding: '6px 8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: theme.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Paylaş"
              >
                <Share2 size={16} />
              </button>

              <button
                onClick={onClose}
                style={{
                  backgroundColor: theme.primary,
                  border: 'none',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  gap: '5px',
                  fontSize: '13px',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
                }}
              >
                <X size={16} />
                <span>Bağla</span>
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="modal-body-scroll">
            <div className="product-detail-modal-layout">
              {/* Sol Tərəf: Geniş və Ön Planda Olan Şəkil Kartı */}
              <div className="product-modal-image-col">
                <div
                  className="product-detail-image-stage"
                  onClick={() => activeMedia?.type === 'image' && activeMedia.url && setIsFullscreenImage(true)}
                  style={{
                    backgroundColor: theme.mode === 'dark' ? '#131926' : '#ffffff',
                    borderColor: theme.border,
                    cursor: activeMedia?.type === 'image' ? 'zoom-in' : 'default',
                  }}
                  title="Tam ekranda böyütmək və sürüşdürmək üçün klikləyin"
                >
                  {activeMedia?.type === 'video' ? (
                    <video
                      src={activeMedia.url}
                      poster={activeMedia.poster}
                      controls
                      playsInline
                      preload="metadata"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onClick={(event) => event.stopPropagation()}
                    />
                  ) : activeMedia?.url ? (
                    <img
                      src={activeMedia.url}
                      alt={activeMedia.alt || product.title}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: activeFitMode as any,
                        objectPosition: activeObjectPosition,
                      }}
                    />
                  ) : (
                    <div style={{ color: theme.textMuted, fontSize: '13px' }}>Media daha sonra əlavə ediləcək</div>
                  )}

                  {product.badgeText && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: theme.primary,
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 800,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      {product.badgeText}
                    </div>
                  )}

                  {activeMedia?.type === 'image' && activeMedia.url && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.72)',
                        color: '#ffffff',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backdropFilter: 'blur(6px)',
                      }}
                    >
                      <Maximize2 size={13} />
                      <span>Tam Ekran Bax</span>
                    </div>
                  )}
                </div>

                {mediaItems.length > 1 && (
                  <div className="product-media-strip no-scrollbar">
                    {mediaItems.map((media, index) => (
                      <button
                        key={media.id}
                        className={activeMediaIndex === index ? 'active' : ''}
                        onClick={() => setActiveMediaIndex(index)}
                        style={{
                          borderColor: activeMediaIndex === index ? theme.primary : theme.border,
                          background: theme.bgSecondary,
                        }}
                      >
                        {media.type === 'video' ? (
                          <span>▶ Video</span>
                        ) : (
                          <img
                            src={media.url}
                            alt={media.alt || `${product.title} ${index + 1}`}
                            style={{
                              objectFit: (media as any).fitMode || 'contain',
                              objectPosition: (media as any).objectPosition || 'center',
                            }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Origin & Warranty Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    padding: '10px 14px',
                    borderRadius: '12px',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>
                    {brand?.id === 'lotus' ? '🌐' : '🇮🇹'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: theme.text, fontSize: '13px', fontWeight: 700 }}>
                      {brand?.name || product.brandId.toUpperCase()}
                      {brand?.originCountry ? ` — ${brand.originCountry} brendi` : ''}
                    </div>
                    <div style={{ color: theme.textMuted, fontSize: '11px' }}>
                      {product.manufacturingCountry
                        ? `İstehsal: ${product.manufacturingCountry}`
                        : 'Sahara Electronic Rəsmi Zəmanəti'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sağ Tərəf: İncə və Aydın Detal & Əlaqə Paneli */}
              <div className="product-modal-info-col">
                <div>
                  <h2
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '20px',
                      fontWeight: 800,
                      color: theme.text,
                      lineHeight: '26px',
                      marginBottom: '8px',
                    }}
                  >
                    {product.title}
                  </h2>
                  {product.shortDesc && (
                    <p
                      style={{
                        fontSize: '13px',
                        color: theme.textSecondary,
                        lineHeight: '19px',
                        marginBottom: '12px',
                      }}
                    >
                      {product.shortDesc}
                    </p>
                  )}

                  {product.price !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
                      <span style={{ fontSize: '24px', fontWeight: 900, color: theme.text }}>
                        {product.price} {product.currency || '₼'}
                      </span>
                      {product.oldPrice && product.oldPrice > product.price && (
                        <span style={{ fontSize: '15px', color: theme.textMuted, textDecoration: 'line-through' }}>
                          {product.oldPrice} {product.currency || '₼'}
                        </span>
                      )}
                    </div>
                  )}

                  {product.highlights && product.highlights.length > 0 && (
                    <div
                      style={{
                        backgroundColor: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                        padding: '12px 14px',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ color: theme.text, fontSize: '12px', fontWeight: 800 }}>Əsas Üstünlüklər:</div>
                      {product.highlights.map((h, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Flame size={13} color={theme.primary} />
                          <span style={{ color: theme.textSecondary, fontSize: '12px' }}>{h}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                  <button
                    onClick={() => onWhatsApp(product)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(22, 163, 74, 0.28)',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <WhatsAppIcon size={20} color="#ffffff" />
                    <span>{whatsappButtonText}</span>
                  </button>

                  <button
                    onClick={() => onCall(product)}
                    className="modal-call-button"
                    style={{
                      backgroundColor: theme.primary,
                      padding: '12px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  >
                    <Phone size={18} />
                    <span>{callButtonText}</span>
                  </button>

                  <button
                    onClick={() => onCopyLink(product)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      backgroundColor: theme.bgSecondary,
                      border: `1px solid ${theme.border}`,
                      color: theme.primary,
                      padding: '10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Copy size={14} />
                    <span>Məhsul linki kopyala</span>
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                borderBottom: `1px solid ${theme.border}`,
                marginBottom: '12px',
              }}
            >
              <button
                onClick={() => setActiveTab('specs')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === 'specs' ? theme.primary : 'transparent'}`,
                  padding: '8px 4px',
                  color: activeTab === 'specs' ? theme.primary : theme.textMuted,
                  fontSize: '13px',
                  fontWeight: activeTab === 'specs' ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                Texniki Xüsusiyyətlər
              </button>
            </div>

            {activeTab === 'specs' && (
              <div>
                {Object.entries(specGroups).map(([groupName, items]) => (
                  <div key={groupName} style={{ marginBottom: '14px' }}>
                    <div style={{ color: theme.primary, fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {groupName}
                    </div>
                    <div style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                      {items.map((item, idx) => (
                        <div key={item.id || idx} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: idx < items.length - 1 ? `1px solid ${theme.border}` : 'none', backgroundColor: idx % 2 === 0 ? 'transparent' : (theme.mode === 'dark' ? '#101726' : '#ffffff') }}>
                          <div style={{ flex: '1.2', paddingRight: '8px' }}>
                            <div style={{ color: theme.text, fontSize: '12px', fontWeight: 600 }}>{item.name}</div>
                            {item.description && <div style={{ color: theme.textMuted, fontSize: '10px', marginTop: '1px' }}>{item.description}</div>}
                          </div>
                          <div style={{ flex: '1', textAlign: 'right' }}>
                            <span style={{ color: item.value ? (theme.mode === 'dark' ? '#38bdf8' : '#0284c7') : theme.textMuted, fontSize: '12px', fontWeight: 600 }}>
                              {item.value ? item.value : '[Qeyd edilməyib]'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULLSCREEN ZOOM & PAN LIGHTBOX VIEW */}
      {isFullscreenImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(5, 7, 12, 0.96)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDragging) setIsFullscreenImage(false);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(15, 23, 42, 0.6)', zIndex: 30 }}>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, backdropFilter: 'blur(8px)' }}>
              {product.code} — {product.title}
            </div>
            <button onClick={() => setIsFullscreenImage(false)} style={{ backgroundColor: theme.primary, border: 'none', color: '#ffffff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800 }}>
              <X size={18} /> <span>Bağla</span>
            </button>
          </div>

          <div className="zoom-floating-controls" style={{ position: 'absolute', top: '80px', right: '20px', zIndex: 40, display: 'flex', gap: '8px' }}>
            <button type="button" className="zoom-btn" onClick={zoomOut} disabled={zoomScale <= 1} title="Kiçilt (-)"><ZoomOut size={16} /></button>
            <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>{Math.round(zoomScale * 100)}%</span>
            <button type="button" className="zoom-btn" onClick={zoomIn} disabled={zoomScale >= 4} title="Böyüt (+)"><ZoomIn size={16} /></button>
            {zoomScale > 1 && <button type="button" onClick={resetZoom} title="1x Orijinal ölçüyə sıfırla" style={{ cursor: 'pointer', border: 'none', borderRadius: '8px', padding: '4px 8px' }}>1x Sıfırla</button>}
          </div>

          <div
            className={`zoom-pan-container ${zoomScale > 1 ? 'is-zoomed' : ''}`}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onWheel={handleWheel}
            onDoubleClick={toggleZoom}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <img
              src={activeMedia?.url || product.image}
              alt={activeMedia?.alt || product.title}
              draggable={false}
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                objectFit: activeFitMode as any,
                objectPosition: activeObjectPosition,
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
                transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                userSelect: 'none',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
});
