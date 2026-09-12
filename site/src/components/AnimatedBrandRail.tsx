import React, { useRef, useState, useEffect } from 'react';
import { BrandRailData, BrandRailItem } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from './ShimmerImage';

interface AnimatedBrandRailProps {
  data?: BrandRailData | null;
  theme: ThemeColors;
  onNavigateBrand?: (slug: string) => void;
  className?: string;
  isPausedOverride?: boolean;
}

export const AnimatedBrandRail: React.FC<AnimatedBrandRailProps> = ({
  data,
  theme,
  onNavigateBrand,
  className = '',
  isPausedOverride = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const dragStartXRef = useRef<number>(0);
  const dragMovedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (!data || !data.enabled || !data.items || data.items.length === 0) {
    return null;
  }

  const settings = data.settings || {
    id: 'default',
    enabled: true,
    title: 'Brendlər',
    animationEnabled: true,
    speedSeconds: 30,
    direction: 'left' as const,
    pauseOnHover: true,
    edgeFade: true,
    cardSize: 'md' as const,
    sectionOrder: 1,
    themeVariant: 'neutral' as const,
    version: 1,
  };

  const enabledItems = data.items.filter((item) => item.enabled);
  if (enabledItems.length === 0) return null;

  const isPaused =
    isPausedOverride ||
    (settings.pauseOnHover && isHovered) ||
    isFocused ||
    isDragging ||
    !settings.animationEnabled ||
    isReducedMotion;

  const speedDuration = Math.max(10, Math.min(120, settings.speedSeconds || 30));

  const handleCardClick = (item: BrandRailItem) => {
    if (dragMovedRef.current) return; // Prevent click on drag
    if (item.linkEnabled && item.hasPublishedProducts && onNavigateBrand) {
      onNavigateBrand(item.brandSlug || item.brandId);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartXRef.current = e.touches[0].clientX;
    dragMovedRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (Math.abs(e.touches[0].clientX - dragStartXRef.current) > 5) {
      dragMovedRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    setTimeout(() => {
      setIsDragging(false);
      dragMovedRef.current = false;
    }, 120);
  };

  const renderBrandCard = (item: BrandRailItem, isDuplicate = false) => {
    const isInteractive = item.linkEnabled && item.hasPublishedProducts;
    const displayName = item.optionalDisplayLabel || item.brandName;

    return (
      <div
        key={`${isDuplicate ? 'dup-' : 'orig-'}${item.id || item.brandId}-${item.brandId}`}
        className={`brand-rail-card ${isInteractive ? 'is-interactive' : 'is-static'}`}
        data-brand={item.brandSlug || item.brandId}
        data-interactive={isInteractive ? 'true' : 'false'}
        role={isInteractive ? 'button' : 'group'}
        tabIndex={isInteractive && !isDuplicate ? 0 : -1}
        aria-label={isInteractive ? `${displayName} brendi məhsulları` : displayName}
        aria-hidden={isDuplicate ? 'true' : undefined}
        onClick={() => handleCardClick(item)}
        onKeyDown={(e) => {
          if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleCardClick(item);
          }
        }}
        style={{
          backgroundColor: theme?.bgSecondary || 'transparent',
          borderColor: theme?.border || '#e2e8f0',
          color: theme?.text || '#0f172a',
        }}
      >
        {item.brandLogo ? (
          <div className="brand-rail-logo-box">
            <span className="brand-rail-name sr-only" style={{ display: 'none' }}>
              {displayName}
            </span>
            <ShimmerImage
              src={item.brandLogo}
              alt={displayName}
              objectFit="contain"
              className="brand-rail-logo-img"
              width={100}
              height={40}
              fallback={
                <span className="brand-rail-fallback-text" style={{ color: theme?.text }}>
                  {displayName}
                </span>
              }
            />
          </div>
        ) : (
          <div className="brand-rail-text-box">
            <span className="brand-rail-name brand-rail-name-text" style={{ color: theme?.text }}>
              {displayName}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      className={`brand-rail-section ${className}`}
      data-testid="animated-brand-rail"
      data-reduced-motion={isReducedMotion ? 'true' : 'false'}
      aria-label={settings.title || 'Brendlər'}
      style={{
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <div className="brand-rail-header">
        <h2 className="brand-rail-title" style={{ color: theme?.text }}>
          {settings.title || 'Brendlər'}
        </h2>
      </div>

      <div
        ref={containerRef}
        className={`brand-rail-viewport ${settings.edgeFade ? 'has-edge-fade' : ''} ${
          isReducedMotion ? 'is-reduced-motion' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="brand-rail-viewport"
      >
        <div
          className={`brand-rail-track ${settings.direction === 'right' ? 'direction-right' : 'direction-left'}`}
          style={{
            animationDuration: `${speedDuration}s`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
          data-testid="brand-rail-track"
        >
          {/* Primary Track */}
          <div className="brand-rail-track-group">
            {enabledItems.map((item) => renderBrandCard(item, false))}
          </div>

          {/* Seamless Duplicate Track for Infinite Loop (hidden from assistive tech) */}
          {!isReducedMotion && (
            <div className="brand-rail-track-group" aria-hidden="true">
              {enabledItems.map((item) => renderBrandCard(item, true))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
