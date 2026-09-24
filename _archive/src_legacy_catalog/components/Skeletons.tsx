import React from 'react';
import { Sparkles } from 'lucide-react';
import { ThemeColors } from '../types/theme';

interface SkeletonProps {
  theme: ThemeColors;
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonBox: React.FC<{
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ width = '100%', height = '16px', borderRadius = '8px', className = '', style }) => {
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export const ProductCardSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  return (
    <div
      className="product-card skeleton-card"
      style={{
        backgroundColor: theme.bgCard,
        border: `1px solid ${theme.border}`,
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: `0 2px 8px -2px ${theme.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.06)'}`,
      }}
      aria-busy="true"
      aria-label="Məhsul yüklənir..."
    >
      {/* Product Image Frame Placeholder */}
      <div
        className="product-card-img-wrap product-card-media"
        style={{
          backgroundColor: theme.mode === 'dark' ? '#0c101a' : '#f8fafc',
          position: 'relative',
          height: '220px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 4,
          }}
        >
          <SkeletonBox width="90px" height="24px" borderRadius="6px" />
          <SkeletonBox width="70px" height="22px" borderRadius="6px" />
        </div>
      </div>

      {/* Product Content Details */}
      <div
        style={{
          padding: '16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Code & Origin Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <SkeletonBox width="85px" height="16px" borderRadius="6px" />
            <SkeletonBox width="75px" height="14px" borderRadius="6px" />
          </div>

          {/* Product Title (2 lines) */}
          <SkeletonBox width="100%" height="18px" borderRadius="6px" style={{ marginBottom: '6px' }} />
          <SkeletonBox width="65%" height="18px" borderRadius="6px" style={{ marginBottom: '10px' }} />

          {/* Pricing Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <SkeletonBox width="90px" height="24px" borderRadius="6px" />
            <SkeletonBox width="55px" height="16px" borderRadius="6px" />
          </div>

          {/* Highlights Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SkeletonBox width="14px" height="14px" borderRadius="4px" />
              <SkeletonBox width="80%" height="12px" borderRadius="4px" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SkeletonBox width="14px" height="14px" borderRadius="4px" />
              <SkeletonBox width="65%" height="12px" borderRadius="4px" />
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
          <SkeletonBox width="100%" height="38px" borderRadius="8px" style={{ flex: 1 }} />
          <SkeletonBox width="100%" height="38px" borderRadius="8px" style={{ flex: 1 }} />
          <SkeletonBox width="40px" height="38px" borderRadius="8px" style={{ flexShrink: 0 }} />
        </div>
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ theme: ThemeColors; count?: number }> = ({
  theme,
  count = 8,
}) => {
  return (
    <div className="product-grid-container" aria-label="Kataloq məhsulları yüklənir">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={`skeleton-card-${idx}`} theme={theme} />
      ))}
    </div>
  );
};

export const BrandShowcaseSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  return (
    <section className="brand-showcase" aria-busy="true" aria-label="Brendlər bölməsi yüklənir">
      <div className="brand-showcase-heading">
        <div>
          <span style={{ color: theme.primary, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={14} /> Brendlər
          </span>
          <h1 style={{ color: theme.text }}>Məhsul ailələrimizi kəşf edin</h1>
        </div>
        <p style={{ color: theme.textMuted }}>
          Mövcud kataloqa baxın; hazırlanmaqda olan bölmələri tezliklə burada görəcəksiniz.
        </p>
      </div>

      <div className="brand-showcase-grid">
        {[1, 2, 3].map((idx) => (
          <article
            key={`brand-skel-${idx}`}
            className={`brand-showcase-card brand-skel-card brand-tone-${idx % 3}`}
            style={{
              borderColor: theme.border,
              background: '#111827',
              minHeight: '176px',
            }}
          >
            {/* White/Dark Rounded Brand Logo Shell */}
            <div className="brand-mark-shell">
              <SkeletonBox width="100%" height="100%" borderRadius="10px" />
            </div>

            {/* Brand Card Copy */}
            <div className="brand-card-copy" style={{ flex: 1 }}>
              <div className="brand-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <SkeletonBox width="85px" height="22px" borderRadius="6px" />
                <SkeletonBox width="74px" height="22px" borderRadius="999px" />
              </div>
              <SkeletonBox width="92%" height="14px" borderRadius="6px" style={{ margin: '8px 0 10px' }} />
              <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                <SkeletonBox width="115px" height="18px" borderRadius="6px" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export const BannerHeroSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  return (
    <div className="banner-hero-wrapper" aria-busy="true" aria-label="Banner bölməsi yüklənir">
      <div
        className="banner-hero-card"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.border,
          boxShadow: theme.mode === 'dark' ? '0 10px 30px rgba(0, 0, 0, 0.4)' : '0 6px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Top Badges & Tagline */}
        <div className="banner-hero-header-row">
          <div className="banner-hero-badges">
            <span
              className="banner-hero-brand-pill"
              style={{
                backgroundColor: theme.primary,
                color: '#ffffff',
              }}
            >
              🇮🇹 ARDO & 🇹🇷 LOTUS
            </span>
            <span
              className="banner-hero-guarantee-pill"
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.badgeText,
                borderColor: theme.primaryLight,
              }}
            >
              <Sparkles size={13} color={theme.primary} />
              <span>Rəsmi Zəmanətli Satış</span>
            </span>
          </div>

          <span className="banner-hero-counter" style={{ color: theme.textMuted }}>
            Texnologiya bələdçisi (1/5)
          </span>
        </div>

        {/* Title & Description */}
        <div className="banner-hero-text-block">
          <h2 className="banner-hero-title" style={{ color: theme.text }}>
            <span>Premium <span style={{ color: theme.primary }}>ARDO & LOTUS</span> Məişət Texnikası</span>
          </h2>
          <p className="banner-hero-subtitle" style={{ color: theme.textSecondary }}>
            Eleqant italyan dizaynı, müasir Lotus həlləri və 3 ilə qədər rəsmi zəmanətli orijinal məhsullar.
          </p>
        </div>

        {/* Dynamic Interactive Auto-Rotating Technology Carousel Bar Placeholder */}
        <div
          className="tech-spotlight-card"
          style={{
            backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.09)' : '#fef2f2',
            borderColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.22)' : '#fee2e2',
          }}
        >
          <div className="tech-spotlight-main">
            <div
              className="tech-spotlight-icon-box"
              style={{
                backgroundColor: theme.mode === 'dark' ? '#2e0e0e' : '#fee2e2',
              }}
            >
              <SkeletonBox width="24px" height="24px" borderRadius="6px" />
            </div>

            <div className="tech-spotlight-content">
              <div className="tech-spotlight-title-row">
                <SkeletonBox width="160px" height="20px" borderRadius="6px" />
                <SkeletonBox width="65px" height="18px" borderRadius="6px" />
              </div>
              <SkeletonBox width="280px" height="14px" borderRadius="4px" style={{ marginTop: '4px' }} />
            </div>
          </div>

          <div className="tech-spotlight-actions" style={{ borderTopColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2' }}>
            <div className="tech-spotlight-nav-group">
              <div style={{ width: '32px', height: '32px' }}>
                <SkeletonBox width="32px" height="32px" borderRadius="8px" />
              </div>
              <div style={{ width: '32px', height: '32px' }}>
                <SkeletonBox width="32px" height="32px" borderRadius="8px" />
              </div>
            </div>

            <div
              className="tech-spotlight-cta"
              style={{
                backgroundColor: theme.primary,
                color: '#ffffff',
                opacity: 0.85,
              }}
            >
              <span>Ətraflı Bax</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SmartSearchSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  return (
    <div className="smart-search-main-grid skeleton-search-grid" aria-busy="true">
      <div className="smart-search-left-col">
        <SkeletonBox width="120px" height="14px" borderRadius="4px" style={{ marginBottom: '12px' }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`search-skel-item-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
            <SkeletonBox width="16px" height="16px" borderRadius="4px" />
            <SkeletonBox width={`${55 + (i % 3) * 15}%`} height="14px" borderRadius="4px" />
          </div>
        ))}
      </div>
      <div className="smart-search-right-col" style={{ borderLeftColor: theme.border }}>
        <SkeletonBox width="110px" height="14px" borderRadius="4px" style={{ marginBottom: '12px' }} />
        <div className="smart-search-products-grid">
          {[1, 2].map((i) => (
            <div key={`search-card-skel-${i}`} className="smart-search-product-card" style={{ borderColor: theme.border }}>
              <SkeletonBox width="100%" height="95px" borderRadius="8px" />
              <SkeletonBox width="80%" height="14px" borderRadius="4px" style={{ marginTop: '8px' }} />
              <SkeletonBox width="50%" height="14px" borderRadius="4px" style={{ marginTop: '4px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

