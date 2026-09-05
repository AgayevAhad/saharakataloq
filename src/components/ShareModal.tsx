import React from 'react';
import { X, Copy, Send, Globe, Share2 } from 'lucide-react';
import { Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { WhatsAppIcon } from './WhatsAppIcon';

interface ShareModalProps {
  product: Product | null;
  theme: ThemeColors;
  visible: boolean;
  onClose: () => void;
  onCopyLink: (customText?: string) => void;
  onWhatsAppShare: () => void;
  onTelegramShare: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  product,
  theme,
  visible,
  onClose,
  onCopyLink,
  onWhatsAppShare,
  onTelegramShare,
}) => {
  if (!visible) return null;

  const isSingleProduct = !!product;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareUrl = isSingleProduct
    ? `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}?product=${product.id}`
    : currentUrl;

  const title = isSingleProduct
    ? `${product.code} - ${product.title}`
    : 'SAHARA ELECTRONICS – Rəsmi Məhsul Kataloqu';
  const desc = isSingleProduct
    ? `${product.title} | ${product.categoryName}`
    : 'Məişət texnikası modelləri və təsdiqlənmiş texniki göstəricilər.';

  return (
    <div
      className="modal-overlay-wrap modal-backdrop-anim share-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        maxWidth: '100%',
        height: '100dvh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1000005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-dialog-anim"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.65)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            backgroundColor: theme.bgSecondary,
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={18} color={theme.primary} />
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 800,
                color: theme.text,
                fontFamily: 'Outfit, sans-serif',
                margin: 0,
              }}
            >
              {isSingleProduct ? 'Məhsulu Paylaş' : 'Bütün Kataloqu Paylaş'}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: theme.bgCard,
              border: `1px solid ${theme.border}`,
              padding: '6px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: theme.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Bağla"
            aria-label="Bağla"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 750, color: theme.text, marginBottom: '4px' }}>
              {title}
            </div>
            <div style={{ fontSize: '12px', color: theme.textMuted, lineHeight: '18px' }}>
              {desc}
            </div>
          </div>

          {/* URL Display */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: theme.bg,
              border: `1px solid ${theme.border}`,
              overflow: 'hidden',
            }}
          >
            <Globe size={16} color={theme.textMuted} style={{ flexShrink: 0 }} />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: theme.primary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
              }}
            >
              {shareUrl}
            </span>
          </div>

          {/* Action Buttons with Interactive Hover Pop Effect */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              className="share-action-btn share-btn-wa"
              onClick={onWhatsAppShare}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
              }}
            >
              <WhatsAppIcon size={20} color="#ffffff" />
              <span>WhatsApp ilə Göndər</span>
            </button>

            <button
              type="button"
              className="share-action-btn share-btn-tg"
              onClick={onTelegramShare}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              }}
            >
              <Send size={18} color="#ffffff" />
              <span>Telegram ilə Göndər</span>
            </button>

            <button
              type="button"
              className="share-action-btn share-btn-copy"
              onClick={() => onCopyLink(shareUrl)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: theme.badgeBg,
                color: theme.primary,
                border: `1px solid ${theme.primaryLight}`,
                padding: '12px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              }}
            >
              <Copy size={18} color={theme.primary} />
              <span>Linki Kopyala</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
