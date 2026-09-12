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
  // Render placeholder cards matching the visible viewport width
  const placeholderCards = Array.from({ length: cardCount }, (_, i) => i);

  return (
    <section
      className={`brand-rail-section brand-rail-skeleton ${className}`}
      data-testid="brand-rail-skeleton"
      aria-hidden="true"
      style={{
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <div className="brand-rail-header">
        <div
          className="skeleton-box"
          style={{
            width: '120px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: theme.bgSecondary,
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
                backgroundColor: theme.bgSecondary,
                borderColor: theme.border,
              }}
            >
              <div
                className="skeleton-box"
                style={{
                  width: '70%',
                  height: '20px',
                  borderRadius: '4px',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
