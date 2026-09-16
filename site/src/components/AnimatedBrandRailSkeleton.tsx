import React from 'react';
import { ThemeColors } from '../types/theme';

interface AnimatedBrandRailSkeletonProps {
  theme: ThemeColors;
  className?: string;
  cardCount?: number;
}

export const AnimatedBrandRailSkeleton: React.FC<AnimatedBrandRailSkeletonProps> = ({
  theme,
  className = '',
  cardCount = 10,
}) => {
  const placeholderCards = Array.from({ length: cardCount }, (_, i) => i);

  return (
    <section
      className={`brand-rail-section brand-rail-skeleton ${className}`}
      data-testid="brand-rail-skeleton"
      aria-hidden="true"
      style={{ width: '100%', padding: '4px 0 12px 0' }}
    >
      <div
        className="brand-rail-unified-container brand-rail-fullwidth"
        style={{
          backgroundColor: theme?.bgCard || '#ffffff',
          border: 'none',
          borderWidth: 0,
          borderRadius: 0,
          width: '100%',
          padding: '10px 0',
        }}
      >
        <div className="brand-rail-header" style={{ padding: '0 24px', boxSizing: 'border-box' }}>
          <div
            className="skeleton-box"
            style={{
              width: '90px',
              height: '18px',
              borderRadius: '4px',
              backgroundColor: theme?.bgSecondary || 'rgba(0,0,0,0.06)',
            }}
          />
          <div
            className="skeleton-box"
            style={{
              width: '80px',
              height: '14px',
              borderRadius: '4px',
              backgroundColor: theme?.bgSecondary || 'rgba(0,0,0,0.06)',
            }}
          />
        </div>

        <div className="brand-rail-viewport has-edge-fade">
          <div className="brand-rail-track-group">
            {placeholderCards.map((id) => (
              <div
                key={`skel-${id}`}
                className="brand-rail-card brand-rail-skeleton-card"
                style={{
                  backgroundColor: theme?.bgSecondary || 'rgba(0,0,0,0.04)',
                  borderColor: 'transparent',
                }}
              >
                <div
                  className="skeleton-box"
                  style={{
                    width: '60px',
                    height: '14px',
                    borderRadius: '4px',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
