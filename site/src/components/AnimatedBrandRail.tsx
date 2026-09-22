import React, { useRef, useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
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

const LOGO_MAP: Record<string, string> = {
  ardo: '/media/brands/ardo-logo.png',
  lotus: '/media/brands/lotus-logo.png',
  artel: '/media/brands/artel-logo.svg',
  midea: '/media/brands/midea-logo.svg',
  samsung: '/media/brands/samsung-logo.svg',
  bosch: '/media/brands/bosch-logo.svg',
  lg: '/media/brands/lg-logo.svg',
  beko: '/media/brands/beko-logo.svg',
  arcelik: '/media/brands/arcelik-logo.svg',
  sharp: '/media/brands/sharp-logo.svg',
  siemens: '/media/brands/siemens-logo.svg',
  toshiba: '/media/brands/toshiba-logo.svg',
  hitachi: '/media/brands/hitachi-logo.svg',
  electrolux: '/media/brands/electrolux-logo.svg',
  whirlpool: '/media/brands/whirlpool-logo.svg',
  indesit: '/media/brands/indesit-logo.svg',
  hisense: '/media/brands/hisense-logo.svg',
  tcl: '/media/brands/tcl-logo.svg',
  daewoo: '/media/brands/daewoo-logo.svg',
  hotpoint: '/media/brands/hotpoint-logo.svg',
  zanussi: '/media/brands/zanussi-logo.svg',
  philips: '/media/brands/philips-logo.svg',
  tefal: '/media/brands/tefal-logo.svg',
  panasonic: '/media/brands/panasonic-logo.svg',
  sony: '/media/brands/sony-logo.svg',
  haier: '/media/brands/haier-logo.svg',
  braun: '/media/brands/braun-logo.svg',
  kenwood: '/media/brands/kenwood-logo.svg',
  ariston: '/media/brands/ariston-logo.svg',
  aeg: '/media/brands/aeg-logo.svg',
  vestel: '/media/brands/vestel-logo.svg',
  hoffmann: '/media/brands/hoffmann-logo.svg',
  goldmaster: '/media/brands/goldmaster-logo.svg',
  shivaki: '/media/brands/shivaki-logo.svg',
  skyworth: '/media/brands/skyworth-logo.svg',
  regal: '/media/brands/regal-logo.svg',
  tesla: '/media/brands/tesla-logo.svg',
  ardesto: '/media/brands/ardesto-logo.svg',
  eurolux: '/media/brands/eurolux-logo.svg',
  biryusa: '/media/brands/biryusa-logo.svg',
  pozis: '/media/brands/pozis-logo.svg',
  lanova: '/media/brands/lanova-logo.png',
  konka: '/media/brands/konka-logo.svg',
  hailang: '/media/brands/hailang-logo.svg',
  everest: '/media/brands/everest-logo.svg',
  finlux: '/media/brands/finlux-logo.svg',
  ficher: '/media/brands/ficher-logo.svg',
  winsor: '/media/brands/winsor-logo.svg',
  talberg: '/media/brands/talberg-logo.svg',
  darkin: '/media/brands/darkin-logo.svg',
  arlant: '/media/brands/arlant-logo.svg',
  es: '/media/brands/es-logo.svg',
  hayland: '/media/brands/hayland-logo.svg',
};

const PARTNER_PRIORITY: string[] = [
  'samsung',
  'bosch',
  'lg',
  'beko',
  'arcelik',
  'siemens',
  'philips',
  'tefal',
  'electrolux',
  'toshiba',
  'whirlpool',
  'sharp',
  'haier',
  'hitachi',
  'panasonic',
  'sony',
  'indesit',
  'tcl',
  'hisense',
  'daewoo',
  'braun',
  'kenwood',
  'hotpoint',
  'zanussi',
  'vestel',
  'aeg',
  'ariston',
  'hoffmann',
];

const resolveBrandLogo = (item: BrandRailItem): string => {
  const slug = (item.brandSlug || item.brandId || '').toLowerCase();
  if (LOGO_MAP[slug]) return LOGO_MAP[slug];
  if (item.brandLogo && !item.brandLogo.includes('placeholder')) return item.brandLogo;
  return '';
};

export const buildRhythmicBrandRailTrack = (items: BrandRailItem[]): BrandRailItem[] => {
  if (!items || items.length === 0) return [];
  const heroSlugs = ['ardo', 'lotus', 'artel'];

  const heroMap = new Map<string, BrandRailItem>();
  const partnerMap = new Map<string, BrandRailItem>();

  for (const item of items) {
    const slug = (item.brandSlug || item.brandId || '').toLowerCase();
    if (!slug || !item.enabled || !item.hasPublishedProducts || item.publishedProductCount <= 0)
      continue;
    const resolvedItem = { ...item, brandLogo: resolveBrandLogo(item) };
    if (heroSlugs.includes(slug)) {
      if (!heroMap.has(slug)) heroMap.set(slug, resolvedItem);
    } else if (!partnerMap.has(slug)) {
      partnerMap.set(slug, resolvedItem);
    }
  }

  const partnerItems = Array.from(partnerMap.values());
  partnerItems.sort((a, b) => {
    const slugA = (a.brandSlug || a.brandId || '').toLowerCase();
    const slugB = (b.brandSlug || b.brandId || '').toLowerCase();
    const idxA = PARTNER_PRIORITY.indexOf(slugA);
    const idxB = PARTNER_PRIORITY.indexOf(slugB);
    const scoreA = idxA === -1 ? 999 : idxA;
    const scoreB = idxB === -1 ? 999 : idxB;
    if (scoreA !== scoreB) return scoreA - scoreB;
    return a.sortOrder - b.sortOrder;
  });

  const heroList = heroSlugs.flatMap((slug) => {
    const item = heroMap.get(slug);
    return item ? [item] : [];
  });

  if (heroList.length === 0) return partnerItems;
  // Never place ARDO/LOTUS/ARTEL directly beside one another. If no partner
  // currently has a published product, one verified hero is safer than a fake sequence.
  if (partnerItems.length === 0) return [heroList[0]];

  const result: BrandRailItem[] = [];
  const slotCount = Math.max(partnerItems.length, heroList.length * 2);
  for (let index = 0; index < slotCount; index += 1) {
    const hero = heroList[index % heroList.length];
    const partner = partnerItems[index % partnerItems.length];
    result.push({ ...hero, id: `${hero.id || hero.brandId}-rhythm-${index}` });
    result.push({ ...partner, id: `${partner.id || partner.brandId}-partner-${index}` });
  }
  return result;
};

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
  const [dragOffset, setDragOffset] = useState(0);
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
    speedSeconds: 52,
    direction: 'left' as const,
    pauseOnHover: true,
    edgeFade: true,
    cardSize: 'md' as const,
    sectionOrder: 1,
    themeVariant: 'neutral' as const,
    version: 1,
  };

  const rawEnabledItems = data.items.filter(
    (item) => item.enabled && item.hasPublishedProducts && item.publishedProductCount > 0
  );
  if (rawEnabledItems.length === 0) return null;

  const enabledItems = buildRhythmicBrandRailTrack(rawEnabledItems);
  if (enabledItems.length === 0) return null;

  const isPaused =
    isPausedOverride ||
    (settings.pauseOnHover && isHovered) ||
    isFocused ||
    isDragging ||
    !settings.animationEnabled ||
    isReducedMotion;

  const speedDuration = Math.max(20, Math.min(120, settings.speedSeconds || 52));

  const handleCardClick = (item: BrandRailItem) => {
    if (dragMovedRef.current) return;
    if (item.linkEnabled && item.hasPublishedProducts && onNavigateBrand) {
      onNavigateBrand(item.brandSlug || item.brandId);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragStartXRef.current = e.clientX;
    dragMovedRef.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStartXRef.current;
    if (Math.abs(delta) > 5) {
      dragMovedRef.current = true;
    }
    setDragOffset(Math.max(-240, Math.min(240, delta)));
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setIsDragging(false);
    setDragOffset(0);
    setTimeout(() => {
      dragMovedRef.current = false;
    }, 180);
  };

  const renderBrandCard = (item: BrandRailItem, isDuplicate = false) => {
    const isInteractive = item.linkEnabled && item.hasPublishedProducts;
    const displayName = item.optionalDisplayLabel || item.brandName;
    const logoUrl = resolveBrandLogo(item);

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
      >
        {logoUrl ? (
          <div className="brand-rail-logo-box">
            <span className="brand-rail-name sr-only" style={{ display: 'none' }}>
              {displayName}
            </span>
            <ShimmerImage
              src={logoUrl}
              alt={displayName}
              draggable={false}
              objectFit="contain"
              className={`brand-rail-logo-img brand-logo-${item.brandSlug || item.brandId}`}
              width={90}
              height={30}
              fallback={<span className="brand-rail-name-text">{displayName}</span>}
            />
          </div>
        ) : (
          <div className="brand-rail-text-box">
            <span className="brand-rail-name-text">{displayName}</span>
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
      style={{ width: '100%', padding: '4px 0 12px 0' }}
    >
      <div
        className="brand-rail-unified-container brand-rail-fullwidth"
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          borderWidth: 0,
          borderRadius: 0,
          width: '100%',
          padding: '10px 0',
        }}
      >
        {/* Header Row with title & link */}
        <div className="brand-rail-header" style={{ padding: '0 24px', boxSizing: 'border-box' }}>
          <h2 className="brand-rail-title" style={{ color: theme?.text }}>
            {settings.title || 'Brendlər'}
          </h2>
          {onNavigateBrand && (
            <button
              type="button"
              className="brand-rail-view-all-link"
              onClick={() => onNavigateBrand('')}
              style={{ color: theme?.textMuted || '#64748b' }}
            >
              <span>Bütün brendlər</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* Marquee Viewport with Edge Masks */}
        <div
          ref={containerRef}
          className={`brand-rail-viewport ${settings.edgeFade ? 'has-edge-fade' : ''} ${
            isReducedMotion ? 'is-reduced-motion' : ''
          } ${isDragging ? 'is-dragging' : ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onDragStart={(event) => event.preventDefault()}
          data-testid="brand-rail-viewport"
        >
          <div
            className="brand-rail-drag-layer"
            style={{
              transform: `translate3d(${dragOffset}px, 0, 0)`,
            }}
            data-testid="brand-rail-drag-layer"
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
        </div>
      </div>
    </section>
  );
};
