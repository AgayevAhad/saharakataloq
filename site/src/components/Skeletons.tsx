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
          <SkeletonBox
            width="100%"
            height="18px"
            borderRadius="6px"
            style={{ marginBottom: '6px' }}
          />
          <SkeletonBox
            width="65%"
            height="18px"
            borderRadius="6px"
            style={{ marginBottom: '10px' }}
          />

          {/* Highlights Checklist */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0 10px' }}
          >
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

        {/* Action Buttons Row: "Ətraflı bax" + WA/Call */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          <SkeletonBox width="100%" height="36px" borderRadius="8px" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SkeletonBox width="100%" height="32px" borderRadius="8px" style={{ flex: 1 }} />
            <SkeletonBox width="100%" height="32px" borderRadius="8px" style={{ flex: 1 }} />
            <SkeletonBox width="34px" height="32px" borderRadius="8px" style={{ flexShrink: 0 }} />
          </div>
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
          <span
            style={{
              color: theme.primary,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
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
              <div
                className="brand-card-top"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <SkeletonBox width="85px" height="22px" borderRadius="6px" />
                <SkeletonBox width="74px" height="22px" borderRadius="999px" />
              </div>
              <SkeletonBox
                width="92%"
                height="14px"
                borderRadius="6px"
                style={{ margin: '8px 0 10px' }}
              />
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
          boxShadow:
            theme.mode === 'dark'
              ? '0 10px 30px rgba(0, 0, 0, 0.4)'
              : '0 6px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Top Badges & Tagline */}
        <div className="banner-hero-header-row">
          <div className="banner-hero-badges">
            <span
              className="banner-hero-guarantee-pill"
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.badgeText,
                borderColor: theme.primaryLight,
              }}
            >
              <Sparkles size={13} color={theme.primary} />
              <span>Kataloq Platforması</span>
            </span>
          </div>

          <span className="banner-hero-counter" style={{ color: theme.textMuted }}>
            Texnologiya bələdçisi (1/5)
          </span>
        </div>

        {/* Title & Description */}
        <div className="banner-hero-text-block">
          <h2 className="banner-hero-title" style={{ color: theme.text }}>
            <span>Sahara Electronics — Məhsul Kataloqu</span>
          </h2>
          <p className="banner-hero-subtitle" style={{ color: theme.textSecondary }}>
            Məişət və mətbəx texnikası modelləri, texniki parametrlər və rəsmi məhsul seçimi.
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
              <SkeletonBox
                width="280px"
                height="14px"
                borderRadius="4px"
                style={{ marginTop: '4px' }}
              />
            </div>
          </div>

          <div
            className="tech-spotlight-actions"
            style={{ borderTopColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2' }}
          >
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
        <SkeletonBox
          width="120px"
          height="14px"
          borderRadius="4px"
          style={{ marginBottom: '12px' }}
        />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`search-skel-item-${i}`}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}
          >
            <SkeletonBox width="16px" height="16px" borderRadius="4px" />
            <SkeletonBox width={`${55 + (i % 3) * 15}%`} height="14px" borderRadius="4px" />
          </div>
        ))}
      </div>
      <div className="smart-search-right-col" style={{ borderLeftColor: theme.border }}>
        <SkeletonBox
          width="110px"
          height="14px"
          borderRadius="4px"
          style={{ marginBottom: '12px' }}
        />
        <div className="smart-search-products-grid">
          {[1, 2].map((i) => (
            <div
              key={`search-card-skel-${i}`}
              className="smart-search-product-card"
              style={{ borderColor: theme.border }}
            >
              <SkeletonBox width="100%" height="95px" borderRadius="8px" />
              <SkeletonBox
                width="80%"
                height="14px"
                borderRadius="4px"
                style={{ marginTop: '8px' }}
              />
              <SkeletonBox
                width="50%"
                height="14px"
                borderRadius="4px"
                style={{ marginTop: '4px' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TopServiceBarSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  return (
    <div
      className="top-service-bar skeleton-service-bar no-print"
      style={{
        backgroundColor: theme.mode === 'dark' ? '#090c12' : '#f1f5f9',
        borderBottom: `1px solid ${theme.border}`,
        padding: '6px 0',
        minHeight: '32px',
      }}
      aria-busy="true"
    >
      <div
        className="catalog-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <SkeletonBox width="140px" height="16px" borderRadius="6px" />
          <SkeletonBox width="180px" height="16px" borderRadius="6px" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <SkeletonBox width="130px" height="16px" borderRadius="6px" />
          <SkeletonBox width="110px" height="16px" borderRadius="6px" />
        </div>
      </div>
    </div>
  );
};

export const SiteHeaderSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  return (
    <div
      className="site-header-wrapper skeleton-header-wrapper"
      style={{ minHeight: '110px' }}
      aria-busy="true"
    >
      <TopServiceBarSkeleton theme={theme} />
      <div
        className="site-header-sticky"
        style={{
          backgroundColor:
            theme.mode === 'dark' ? 'rgba(13, 17, 23, 0.95)' : 'rgba(255, 255, 255, 0.96)',
          borderBottom: `1px solid ${theme.border}`,
          padding: '12px 16px',
        }}
      >
        <div
          className="catalog-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <SkeletonBox width="38px" height="38px" borderRadius="10px" />
              <div>
                <SkeletonBox width="80px" height="16px" borderRadius="4px" />
                <SkeletonBox
                  width="60px"
                  height="10px"
                  borderRadius="3px"
                  style={{ marginTop: '4px' }}
                />
              </div>
            </div>
            <SkeletonBox width="130px" height="36px" borderRadius="10px" />
          </div>

          <div style={{ flex: 1, maxWidth: '480px' }}>
            <SkeletonBox width="100%" height="40px" borderRadius="12px" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SkeletonBox width="36px" height="36px" borderRadius="10px" />
            <SkeletonBox width="36px" height="36px" borderRadius="10px" />
            <SkeletonBox width="36px" height="36px" borderRadius="10px" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const BreadcrumbsSkeleton: React.FC<SkeletonProps> = ({ theme: _theme }) => {
  return (
    <div
      className="breadcrumbs-container skeleton-breadcrumbs"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 0',
        minHeight: '40px',
      }}
      aria-busy="true"
    >
      <SkeletonBox width="70px" height="14px" borderRadius="4px" />
      <SkeletonBox width="12px" height="12px" borderRadius="2px" />
      <SkeletonBox width="110px" height="14px" borderRadius="4px" />
      <SkeletonBox width="12px" height="12px" borderRadius="2px" />
      <SkeletonBox width="140px" height="14px" borderRadius="4px" />
    </div>
  );
};

export const MobileBottomNavSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  return (
    <div
      className="mobile-bottom-nav skeleton-mobile-nav no-print"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor:
          theme.mode === 'dark' ? 'rgba(13, 17, 23, 0.95)' : 'rgba(255, 255, 255, 0.96)',
        borderTop: `1px solid ${theme.border}`,
        padding: '6px 12px calc(6px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        minHeight: '56px',
        zIndex: 50,
      }}
      aria-busy="true"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={`mob-skel-${i}`}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
        >
          <SkeletonBox width="22px" height="22px" borderRadius="6px" />
          <SkeletonBox width="45px" height="10px" borderRadius="3px" />
        </div>
      ))}
    </div>
  );
};

export const FeaturedProductCardSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  return (
    <div
      className="featured-product-card skeleton-card"
      style={{
        backgroundColor: '#ffffff',
        border: 'none',
        borderRadius: '16px',
        padding: '20px 24px',
        width: '100%',
        maxWidth: '339px',
        height: '339px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
      }}
      aria-busy="true"
      aria-label="Məhsul yüklənir..."
    >
      {/* Product Image Stage */}
      <div
        style={{
          width: '100%',
          flex: 1,
          minHeight: '215px',
          maxHeight: '235px',
          borderRadius: '12px',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
        }}
      >
        <SkeletonBox width="65%" height="80%" borderRadius="10px" />
      </div>

      {/* Title and Price */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <SkeletonBox width="85%" height="16px" borderRadius="4px" />
        <SkeletonBox width="45%" height="18px" borderRadius="4px" />
      </div>
    </div>
  );
};

export const VisualCategoryCardsSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  return (
    <section className="catalog-container visual-categories-section" aria-busy="true">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div>
          <SkeletonBox width="180px" height="24px" borderRadius="6px" style={{ marginBottom: '6px' }} />
          <SkeletonBox width="140px" height="14px" borderRadius="4px" />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'hidden',
          paddingBottom: '8px',
        }}
      >
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={`cat-skel-${idx}`}
            style={{
              flexShrink: 0,
              width: '339px',
              height: '339px',
              backgroundColor: '#ffffff',
              border: 'none',
              borderRadius: '16px',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxSizing: 'border-box',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                width: '100%',
                flex: 1,
                minHeight: '215px',
                maxHeight: '235px',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
              }}
            >
              <SkeletonBox width="60%" height="75%" borderRadius="10px" />
            </div>
            <div
              style={{
                marginTop: 'auto',
                paddingTop: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                width: '100%',
              }}
            >
              <SkeletonBox width="60%" height="16px" borderRadius="4px" />
              <SkeletonBox width="35%" height="13px" borderRadius="4px" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const SiteHomePageSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  return (
    <div
      className="home-page-container"
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '48px' }}
      aria-busy="true"
    >
      <BannerHeroSkeleton theme={theme} />
      <VisualCategoryCardsSkeleton theme={theme} />
      <section className="catalog-container featured-products-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <SkeletonBox width="200px" height="26px" borderRadius="6px" />
          <SkeletonBox width="100px" height="20px" borderRadius="6px" />
        </div>
        <div
          className="featured-products-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(339px, 1fr))',
            gap: '24px',
            justifyItems: 'center',
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <FeaturedProductCardSkeleton key={`feat-skel-${i}`} theme={theme} />
          ))}
        </div>
      </section>
    </div>
  );
};

