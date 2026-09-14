import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ThemeColors } from '../types/theme';

interface SpecialDiscountBannerProps {
  theme: ThemeColors;
  onNavigateDiscounts?: () => void;
}

export const SpecialDiscountBanner: React.FC<SpecialDiscountBannerProps> = ({
  theme: _theme,
  onNavigateDiscounts,
}) => {
  return (
    <section className="catalog-container special-discount-section" aria-label="Xüsusi Endirimlər">
      <div
        className="special-discount-card"
        style={{
          width: '100%',
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          background: 'linear-gradient(135deg, #780206 0%, #b91c1c 45%, #e31e24 100%)',
          boxShadow: '0 12px 36px -4px rgba(220, 38, 38, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '220px',
          padding: '32px 40px',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        {/* Background Visual Overlay */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '60%',
            opacity: 0.45,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
          className="hide-on-mobile"
        >
          <img
            src="/media/promo-discount.jpg"
            alt="Endirimli texnikalar"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center right',
              mixBlendMode: 'luminosity',
            }}
          />
        </div>

        {/* Left Typography & CTA Button */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '520px' }}>
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 2.8vw, 2.25rem)',
              fontWeight: 900,
              color: '#ffffff',
              margin: '0 0 16px 0',
              lineHeight: 1.2,
              fontFamily: 'Outfit, -apple-system, sans-serif',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            }}
          >
            Xüsusi endirimlər
            <br />
            sizi gözləyir!
          </h2>

          <button
            type="button"
            onClick={() => (onNavigateDiscounts ? onNavigateDiscounts() : null)}
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: 'none',
              borderRadius: '999px',
              padding: '12px 26px',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <span>Endirimlərə bax</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Right 3D Appliance Imagery on Desktop */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flex: 1,
            minWidth: '280px',
            maxHeight: '180px',
          }}
          className="hide-on-mobile"
        >
          <img
            src="/media/promo-discount.jpg"
            alt="Sahara Xüsusi Endirimlər"
            style={{
              maxHeight: '180px',
              width: 'auto',
              borderRadius: '16px',
              objectFit: 'contain',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          />
        </div>
      </div>
    </section>
  );
};
