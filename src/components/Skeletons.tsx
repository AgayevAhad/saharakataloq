import React from 'react';
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
        borderColor: theme.border,
      }}
      aria-busy="true"
      aria-label="Məhsul yüklənir..."
    >
      {/* Media Image Box Placeholder */}
      <div className="skeleton-media-box">
        <SkeletonBox width="100%" height="100%" borderRadius="12px" />
        <div className="skeleton-badge-pill">
          <SkeletonBox width="45px" height="18px" borderRadius="6px" />
        </div>
      </div>

      {/* Product Information Placeholder */}
      <div className="skeleton-card-body">
        <div className="skeleton-row-between">
          <SkeletonBox width="35%" height="16px" borderRadius="6px" />
          <SkeletonBox width="25%" height="14px" borderRadius="6px" />
        </div>

        <SkeletonBox width="85%" height="18px" borderRadius="6px" style={{ margin: '6px 0 2px' }} />
        <SkeletonBox width="60%" height="14px" borderRadius="6px" />

        {/* Specs highlights */}
        <div className="skeleton-specs-list">
          <SkeletonBox width="90%" height="12px" borderRadius="4px" />
          <SkeletonBox width="75%" height="12px" borderRadius="4px" />
        </div>

        {/* Price & Action Buttons */}
        <div className="skeleton-footer">
          <SkeletonBox width="40%" height="22px" borderRadius="6px" />
          <div className="skeleton-btn-row">
            <SkeletonBox width="48%" height="36px" borderRadius="8px" />
            <SkeletonBox width="48%" height="36px" borderRadius="8px" />
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
    <div className="brand-showcase" aria-busy="true">
      <div className="brand-showcase-heading">
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <SkeletonBox width="140px" height="14px" borderRadius="4px" style={{ marginBottom: '8px' }} />
          <SkeletonBox width="240px" height="28px" borderRadius="8px" />
        </div>
      </div>

      <div className="brand-showcase-grid">
        {[1, 2].map((idx) => (
          <div
            key={`brand-skel-${idx}`}
            className="brand-showcase-card skeleton-brand-card"
            style={{
              backgroundColor: theme.mode === 'dark' ? '#111827' : '#f8fafc',
              borderColor: theme.border,
            }}
          >
            <div className="skeleton-brand-header">
              <SkeletonBox width="110px" height="32px" borderRadius="8px" />
              <SkeletonBox width="70px" height="20px" borderRadius="6px" />
            </div>
            <SkeletonBox width="85%" height="14px" borderRadius="6px" style={{ margin: '14px 0 8px' }} />
            <SkeletonBox width="55%" height="14px" borderRadius="6px" />
            <div className="skeleton-brand-footer">
              <SkeletonBox width="80px" height="24px" borderRadius="6px" />
              <SkeletonBox width="100px" height="28px" borderRadius="8px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BannerHeroSkeleton: React.FC<SkeletonProps> = ({ theme }) => {
  return (
    <div className="banner-hero-wrapper" aria-busy="true">
      <div
        className="banner-hero-card skeleton-hero-card"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.border,
        }}
      >
        <div className="banner-hero-header-row">
          <div style={{ display: 'flex', gap: '8px' }}>
            <SkeletonBox width="110px" height="22px" borderRadius="6px" />
            <SkeletonBox width="130px" height="22px" borderRadius="6px" />
          </div>
          <SkeletonBox width="120px" height="16px" borderRadius="6px" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '4px 0' }}>
          <SkeletonBox width="60%" height="26px" borderRadius="8px" />
          <SkeletonBox width="80%" height="16px" borderRadius="6px" />
        </div>

        <div
          className="tech-spotlight-card"
          style={{
            backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(254, 242, 242, 0.6)',
            borderColor: theme.border,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <SkeletonBox width="42px" height="42px" borderRadius="10px" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <SkeletonBox width="50%" height="16px" borderRadius="6px" />
              <SkeletonBox width="70%" height="12px" borderRadius="4px" />
            </div>
            <SkeletonBox width="90px" height="30px" borderRadius="8px" />
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
