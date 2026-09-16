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
  ardo: '/media/brands/ardo-logo.svg',
  lotus: '/media/brands/lotus-logo.svg',
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
  lanova: '/media/brands/lanova-logo.svg',
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
  konko: '/media/brands/konko-logo.svg',
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

const buildRhythmicBrandRailTrack = (items: BrandRailItem[]): BrandRailItem[] => {
  if (!items || items.length === 0) return [];
  const heroSlugs = ['ardo', 'lotus', 'artel', 'midea'];

  const heroMap = new Map<string, BrandRailItem>();
  const partnerItems: BrandRailItem[] = [];

  for (const item of items) {
    const slug = (item.brandSlug || item.brandId || '').toLowerCase();
    const resolvedItem = { ...item, brandLogo: resolveBrandLogo(item) };
    if (heroSlugs.includes(slug)) {
      if (!heroMap.has(slug)) {
        heroMap.set(slug, resolvedItem);
      }
    } else {
      partnerItems.push(resolvedItem);
    }
  }

  // Sort partner items to prioritize world-class recognized brands
  partnerItems.sort((a, b) => {
    const slugA = (a.brandSlug || a.brandId || '').toLowerCase();
    const slugB = (b.brandSlug || b.brandId || '').toLowerCase();
    const idxA = PARTNER_PRIORITY.indexOf(slugA);
    const idxB = PARTNER_PRIORITY.indexOf(slugB);
    const scoreA = idxA === -1 ? 999 : idxA;
    const scoreB = idxB === -1 ? 999 : idxB;
    return scoreA - scoreB;
  });

  // Ensure all 4 heroes are available
  if (!heroMap.has('ardo')) {
    heroMap.set('ardo', {
      id: 'rail_item_ardo',
      brandId: 'ardo',
      brandName: 'ARDO',
      brandSlug: 'ardo',
      brandLogo: '/media/brands/ardo-logo.svg',
      enabled: true,
      sortOrder: 1,
      linkEnabled: true,
    } as BrandRailItem);
  }
  if (!heroMap.has('lotus')) {
    heroMap.set('lotus', {
      id: 'rail_item_lotus',
      brandId: 'lotus',
      brandName: 'LOTUS',
      brandSlug: 'lotus',
      brandLogo: '/media/brands/lotus-logo.svg',
      enabled: true,
      sortOrder: 2,
      linkEnabled: true,
    } as BrandRailItem);
  }
  if (!heroMap.has('artel')) {
    heroMap.set('artel', {
      id: 'rail_item_artel',
      brandId: 'artel',
      brandName: 'ARTEL',
      brandSlug: 'artel',
      brandLogo: '/media/brands/artel-logo.svg',
      enabled: true,
      sortOrder: 3,
      linkEnabled: true,
    } as BrandRailItem);
  }
  if (!heroMap.has('midea')) {
    heroMap.set('midea', {
      id: 'rail_item_midea',
      brandId: 'midea',
      brandName: 'Midea',
      brandSlug: 'midea',
      brandLogo: '/media/brands/midea-logo.svg',
      enabled: true,
      sortOrder: 4,
      linkEnabled: true,
    } as BrandRailItem);
  }

  const heroList = heroSlugs.map((s) => heroMap.get(s)!);
  const result: BrandRailItem[] = [];
  let heroIdx = 0;
  let partnerIdx = 0;

  // We want to interleave all 4 hero brands repeatedly throughout the partner brands.
  // We ensure every hero brand appears at least once, and repeats cyclically every 2 partner brands.
  const totalPartnerSlots = Math.max(partnerItems.length, heroList.length * 2);
  let pCursor = 0;

  while (pCursor < totalPartnerSlots || heroIdx < heroList.length) {
    const hero = heroList[heroIdx % heroList.length];
    result.push({
      ...hero,
      id: `${hero.id || hero.brandId}-rhythm-${result.length}`,
    });
    heroIdx++;

    for (let k = 0; k < 2; k++) {
      if (partnerItems.length > 0) {
        const partner = partnerItems[pCursor % partnerItems.length];
        result.push({
          ...partner,
          id: `${partner.id || partner.brandId}-track-${result.length}`,
        });
        pCursor++;
      }
    }

    if (pCursor >= totalPartnerSlots && heroIdx >= heroList.length) {
      break;
    }
  }

  // Final hero cap for smooth infinite marquee loop
  const lastHero = heroList[heroIdx % heroList.length];
  result.push({
    ...lastHero,
    id: `${lastHero.id || lastHero.brandId}-rhythm-${result.length}`,
  });

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
    speedSeconds: 32,
    direction: 'left' as const,
    pauseOnHover: true,
    edgeFade: true,
    cardSize: 'md' as const,
    sectionOrder: 1,
    themeVariant: 'neutral' as const,
    version: 1,
  };

  const rawEnabledItems = data.items.filter((item) => item.enabled);
  if (rawEnabledItems.length === 0) return null;

  const enabledItems = buildRhythmicBrandRailTrack(rawEnabledItems);

  const isPaused =
    isPausedOverride ||
    (settings.pauseOnHover && isHovered) ||
    isFocused ||
    isDragging ||
    !settings.animationEnabled ||
    isReducedMotion;

  const speedDuration = Math.max(10, Math.min(120, settings.speedSeconds || 32));

  const handleCardClick = (item: BrandRailItem) => {
    if (dragMovedRef.current) return;
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
          backgroundColor: theme?.bgCard || '#ffffff',
          borderColor: theme?.border || '#e2e8f0',
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
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
      </div>
    </section>
  );
};
