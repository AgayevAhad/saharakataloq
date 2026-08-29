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
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    setActiveMediaIndex(0);
    setIsFullscreenImage(false);
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

  // Reset zoom on close
  useEffect(() => {
    if (!isFullscreenImage) {
      setZoomScale(1);
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

  if (!visible || !product) return null;

  const mediaItems = product.media?.length
    ? product.media
    : [{ id: `${product.id}-main`, type: 'image' as const, url: product.image, alt: product.title }];
  const activeMedia = mediaItems[Math.min(activeMediaIndex, mediaItems.length - 1)];

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const toggleZoom = () => {
    setZoomScale((prev) => (prev === 1 ? 2 : prev === 2 ? 2.8 : 1));
  };

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

              {/* Close Button */}
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
            {/* Top Flex: Image + Summary */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              {/* Left: Image Card (Click to open Fullscreen) */}
              <div
                style={{
                  flex: '1 1 260px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  onClick={() => activeMedia?.type === 'image' && activeMedia.url && setIsFullscreenImage(true)}
                  style={{
                    width: '100%',
                    height: '240px',
                    backgroundColor: theme.mode === 'dark' ? '#0c101a' : '#f8fafc',
                    borderRadius: '12px',
                    border: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: activeMedia?.type === 'image' ? 'zoom-in' : 'default',
                  }}
                  title="Tam ekranda böyütmək üçün klikləyin"
                >
                  {activeMedia?.type === 'video' ? (
                    <video src={activeMedia.url} poster={activeMedia.poster} controls playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onClick={(event) => event.stopPropagation()} />
                  ) : activeMedia?.url ? (
                    <img src={activeMedia.url} alt={activeMedia.alt || product.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ color: theme.textMuted, fontSize: '12px' }}>Media daha sonra əlavə ediləcək</div>
                  )}
                  {product.badgeText && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        backgroundColor: theme.primary,
                        color: '#ffffff',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 700,
                      }}
                    >
                      {product.badgeText}
                    </div>
                  )}

                  {/* Click to Zoom Hint Icon */}
                  {activeMedia?.type === 'image' && activeMedia.url && <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: '#ffffff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <Maximize2 size={12} />
                    <span>Tam Ekran Bax</span>
                  </div>}
                </div>

                {mediaItems.length > 1 && <div className="product-media-strip no-scrollbar">{mediaItems.map((media, index) => <button key={media.id} className={activeMediaIndex === index ? 'active' : ''} onClick={() => setActiveMediaIndex(index)} style={{ borderColor: activeMediaIndex === index ? theme.primary : theme.border, background: theme.bgSecondary }}>{media.type === 'video' ? <span>▶ Video</span> : <img src={media.url} alt={media.alt || `${product.title} ${index + 1}`} />}</button>)}</div>}

                {/* Origin Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    padding: '8px 12px',
                    borderRadius: '10px',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🇮🇹</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: theme.text, fontSize: '12px', fontWeight: 700 }}>
                      {brand?.name || 'ARDO'}{brand?.originCountry ? ` — ${brand.originCountry} brendi` : ''}
                    </div>
                    <div style={{ color: theme.textMuted, fontSize: '10px' }}>
                      {product.manufacturingCountry ? `İstehsal: ${product.manufacturingCountry}` : 'Sahara Electronic Rəsmi Zəmanəti'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Info & CTAs */}
              <div
                style={{
                  flex: '1 1 280px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <h2
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: theme.text,
                      lineHeight: '24px',
                      marginBottom: '6px',
                    }}
                  >
                    {product.title}
                  </h2>
                  <p style={{ fontSize: '12px', color: theme.textSecondary, lineHeight: '18px', marginBottom: '10px' }}>
                    {product.shortDesc}
                  </p>

                  {/* Price & Discount in Modal */}
                  {product.price !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '22px', fontWeight: 900, color: theme.text }}>
                        {product.price} {product.currency || '₼'}
                      </span>
                      {product.oldPrice && product.oldPrice > product.price && (
                        <span style={{ fontSize: '14px', color: theme.textMuted, textDecoration: 'line-through' }}>
                          {product.oldPrice} {product.currency || '₼'}
                        </span>
                      )}
                      {product.oldPrice && product.oldPrice > product.price && (
                        <span style={{ backgroundColor: '#16a34a', color: '#ffffff', fontSize: '12px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                          -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* Selling Highlights */}
                  <div
                    style={{
                      backgroundColor: theme.bgSecondary,
                      border: `1px solid ${theme.border}`,
                      padding: '10px 12px',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                    }}
                  >
                    <div style={{ color: theme.text, fontSize: '11px', fontWeight: 700 }}>Əsas Üstünlüklər:</div>
                    {product.highlights.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Flame size={12} color={theme.primary} />
                        <span style={{ color: theme.textSecondary, fontSize: '11px' }}>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
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
                      padding: '11px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                    }}
                  >
                    <WhatsAppIcon size={19} color="#ffffff" />
                    <span>{whatsappButtonText}</span>
                  </button>

                  <button
                    onClick={() => onCall(product)}
                    className="modal-call-button"
                    style={{ backgroundColor: theme.primary }}
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
                      padding: '9px',
                      borderRadius: '10px',
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

            {/* Navigation Tabs */}
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

            {/* TAB 1: SPECS */}
            {activeTab === 'specs' && (
              <div>
                {Object.entries(specGroups).map(([groupName, items]) => (
                  <div key={groupName} style={{ marginBottom: '14px' }}>
                    <div
                      style={{
                        color: theme.primary,
                        fontSize: '11px',
                        fontWeight: 800,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        marginBottom: '6px',
                      }}
                    >
                      {groupName}
                    </div>
                    <div
                      style={{
                        backgroundColor: theme.bgSecondary,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '10px',
                        overflow: 'hidden',
                      }}
                    >
                      {items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            borderBottom: idx < items.length - 1 ? `1px solid ${theme.border}` : 'none',
                            backgroundColor: idx % 2 === 0 ? 'transparent' : (theme.mode === 'dark' ? '#101726' : '#ffffff'),
                          }}
                        >
                          <div style={{ flex: '1.2', paddingRight: '8px' }}>
                            <div style={{ color: theme.text, fontSize: '12px', fontWeight: 600 }}>{item.name}</div>
                            {item.description && (
                              <div style={{ color: theme.textMuted, fontSize: '10px', marginTop: '1px' }}>
                                {item.description}
                              </div>
                            )}
                          </div>
                          <div style={{ flex: '1', textAlign: 'right' }}>
                            <span
                              style={{
                                color: item.value ? (theme.mode === 'dark' ? '#38bdf8' : '#0284c7') : theme.textMuted,
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
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

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      {isFullscreenImage && (
        <div
          className="modal-backdrop-anim"
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100dvh',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            touchAction: 'none',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFullscreenImage(false);
          }}
        >
          {/* Top Control Bar */}
          <div
            style={{
              position: 'absolute',
              top: 'max(16px, env(safe-area-inset-top, 16px))',
              left: '16px',
              right: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                backdropFilter: 'blur(8px)',
              }}
            >
              {product.code} - {product.title}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={toggleZoom}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backdropFilter: 'blur(8px)',
                }}
              >
                {zoomScale > 1 ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                <span>{zoomScale > 1 ? `${zoomScale}x Sıfırla` : 'Böyüt'}</span>
              </button>

              <button
                onClick={() => setIsFullscreenImage(false)}
                style={{
                  backgroundColor: theme.primary,
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '13px',
                  fontWeight: 800,
                  boxShadow: '0 2px 10px rgba(220, 38, 38, 0.5)',
                }}
              >
                <X size={18} />
                <span>Bağla</span>
              </button>
            </div>
          </div>

          {/* Centered Zoomable Image */}
          <div
            style={{
              flex: 1,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: zoomScale > 1 ? 'zoom-out' : 'zoom-in',
            }}
            onClick={toggleZoom}
          >
            <img
              src={activeMedia?.url || product.image}
              alt={activeMedia?.alt || product.title}
              style={{
                maxWidth: '92vw',
                maxHeight: '82vh',
                objectFit: 'contain',
                borderRadius: '8px',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: `scale(${zoomScale})`,
                userSelect: 'none',
              }}
            />
          </div>

          {/* Bottom Zoom / Close Hint */}
          <div
            style={{
              position: 'absolute',
              bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#94a3b8',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 500,
              backdropFilter: 'blur(4px)',
            }}
          >
            🔍 Şəkilə toxunaraq böyüdüb-kiçildə bilərsiniz
          </div>
        </div>
      )}
    </>
  );
});
