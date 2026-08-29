import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface SaharaLogoProps {
  className?: string;
  compact?: boolean;
  isDark?: boolean;
  enableModal?: boolean;
}

export const SaharaLogo: React.FC<SaharaLogoProps> = ({
  className = '',
  compact = false,
  isDark = false,
  enableModal = true,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const logoSrc = isDark ? '/media/SaharaLogo-dark.png?v=3' : '/media/SaharaLogo.png?v=3';

  const handleClick = (e: React.MouseEvent) => {
    if (enableModal) {
      e.preventDefault();
      e.stopPropagation();
      setModalOpen(true);
    }
  };

  return (
    <>
      <span
        className={`sahara-logo-surface ${compact ? 'compact' : ''} ${className}`.trim()}
        onClick={handleClick}
        title="Böyütmək üçün toxunun / klikləyin"
        style={{
          cursor: enableModal ? 'pointer' : 'default',
        }}
      >
        <img
          src={logoSrc}
          alt="Sahara Electronics"
          className="sahara-logo-img"
        />
      </span>

      {/* Fullscreen Logo Lightbox Modal */}
      {modalOpen && (
        <div
          className="modal-backdrop-anim"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100dvh',
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box',
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="modal-dialog-anim"
            style={{
              position: 'relative',
              maxWidth: '560px',
              width: '100%',
              backgroundColor: isDark ? '#111726' : '#ffffff',
              border: isDark ? '1px solid #1f293d' : '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '36px 24px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalOpen(false)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: isDark ? '#1a2234' : '#f1f5f9',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                color: isDark ? '#ffffff' : '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Bağla"
            >
              <X size={20} />
            </button>

            <img
              src={logoSrc}
              alt="Sahara Electronics"
              style={{
                width: '100%',
                maxWidth: '420px',
                height: 'auto',
                objectFit: 'contain',
                margin: '10px 0 20px',
              }}
            />

            <div style={{ textAlign: 'center' }}>
              <h3
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: isDark ? '#ffffff' : '#0f172a',
                  margin: '0 0 4px 0',
                }}
              >
                Sahara Electronics
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: isDark ? '#94a3b8' : '#64748b',
                  margin: 0,
                }}
              >
                Məişət texnikasının rəsmi kataloqu və zəmanətli satış mərkəzi
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
