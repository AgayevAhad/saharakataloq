import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Wind,
  Refrigerator,
  Box,
  Layers,
  Sparkles,
  Zap,
  Tv,
  Shirt,
  Waves,
  CookingPot,
} from 'lucide-react';
import { CatalogCategory, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from './ShimmerImage';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';

export type CategoryCollageStyle = 'bento' | 'facet' | 'frames' | 'cluster';

interface VisualCategoryCardsProps {
  categories: CatalogCategory[];
  products: Product[];
  selectedCategory?: string;
  onSelectCategory: (categoryId: string) => void;
  onViewAll?: () => void;
  theme: ThemeColors;
  autoPlayIntervalMs?: number;
}

export interface CategoryCardData extends CatalogCategory {
  count: number;
  imageUrls: string[];
}

export interface CollageSlideItem {
  id: string;
  title: string;
  style: CategoryCollageStyle;
  categories: CategoryCardData[];
}

const getCategoryIcon = (iconName?: string, categoryId?: string, size = 26, color = '#475569') => {
  const normalized = (iconName || categoryId || '').toLowerCase();
  if (
    normalized.includes('flame') ||
    normalized.includes('hob') ||
    normalized.includes('cook') ||
    normalized.includes('piltə') ||
    normalized.includes('cooktop')
  ) {
    return <Flame size={size} color={color} />;
  }
  if (normalized.includes('soba') || normalized.includes('oven')) {
    return <CookingPot size={size} color={color} />;
  }
  if (
    normalized.includes('wind') ||
    normalized.includes('hood') ||
    normalized.includes('aspirator') ||
    normalized.includes('kondisioner') ||
    normalized.includes('air_conditioner')
  ) {
    return <Wind size={size} color={color} />;
  }
  if (
    normalized.includes('fridge') ||
    normalized.includes('refrigerator') ||
    normalized.includes('soyuducu')
  ) {
    return <Refrigerator size={size} color={color} />;
  }
  if (normalized.includes('tv') || normalized.includes('televizor')) {
    return <Tv size={size} color={color} />;
  }
  if (normalized.includes('washer') || normalized.includes('paltaryuyan')) {
    return <Shirt size={size} color={color} />;
  }
  if (normalized.includes('dishwasher') || normalized.includes('qabyuyan')) {
    return <Waves size={size} color={color} />;
  }
  if (
    normalized.includes('zap') ||
    normalized.includes('micro') ||
    normalized.includes('electronic')
  ) {
    return <Zap size={size} color={color} />;
  }
  if (normalized.includes('sparkle')) {
    return <Sparkles size={size} color={color} />;
  }
  if (normalized.includes('box') || normalized.includes('package')) {
    return <Box size={size} color={color} />;
  }
  return <Layers size={size} color={color} />;
};

const DEFAULT_CATEGORY_IMAGES: Record<string, string[]> = {
  hood: ['/media/products/ardo-6331-gb.jpg', '/media/products/ardo-6001-b.jpg'],
  cooktop: ['/media/products/ardo-6046-bc.jpg', '/media/products/ardo-604b.jpg'],
  oven: ['/media/products/beko/beko-bbim17300bpsea_01.webp', '/media/products/ardo-6032-b.jpg'],
  refrigerator: ['/media/products/ardesto/ardesto-dfm-90x_01.webp'],
  air_conditioner: [
    '/media/products/lotus/lotus-air-conditioner-li09410_li09410.jpg',
    '/media/products/ardo-ar12ws.jpg',
  ],
  washer: ['/media/products/ardesto/ardesto-wmw-6103dgbdi_01.webp'],
  dryer: ['/media/products/beko/beko-b3t68110_01.webp'],
  dishwasher: ['/media/products/beko/beko-bdin36530_01.webp', '/media/products/ardo-6342w.jpg'],
  tv: ['/media/products/haier/haier-hqled_01.webp'],
  audio: ['/media/products/lg/lg-s75traarellk_01.webp'],
  microwave: ['/media/products/ardo-d680b.jpg'],
  vacuum_cleaner: ['/media/products/artel/artel-vcc-0220-blue_01.jpg'],
  airfryer: [
    '/media/products/lotus-airfryer-5-5-black.jpg',
    '/media/products/lotus/lotus-5-5-black_01.jpg',
  ],
  thermopot: [
    '/media/products/lotus-thermopot-lt-50-eb.jpg',
    '/media/products/lotus/lotus-lt-50-eb-1010-black_01.jpg',
  ],
  meat_grinder: [
    '/media/products/lotus-meat-grinder-lt-02003.jpg',
    '/media/products/lotus/lotus-meat-grinder-lt-02003-pro_01.jpg',
  ],
  iron: [
    '/media/products/lotus-iron-lt-8801.jpg',
    '/media/products/lotus/lotus-iron-lt-8801_01.jpg',
  ],
};

function resolveCategoryRepresentativeImages(products: Product[], categoryId?: string): string[] {
  const isUsableImage = (url?: string) =>
    Boolean(url && url.trim() !== '' && !url.includes('placeholder') && !url.startsWith('blob:'));

  const candidates: string[] = [];
  // Prioritize one admin-selected cover per distinct product, so a collage does
  // not accidentally become four angles of the same model.
  for (const product of products) {
    if (isUsableImage(product.image) && !candidates.includes(product.image))
      candidates.push(product.image);
  }
  for (const product of products) {
    const sources = [
      ...(Array.isArray(product.gallery) ? product.gallery : []),
      ...(Array.isArray(product.media)
        ? product.media.filter((media) => media.type === 'image').map((media) => media.url)
        : []),
    ];
    for (const source of sources) {
      if (isUsableImage(source) && !candidates.includes(source)) candidates.push(source);
    }
  }

  if (categoryId && DEFAULT_CATEGORY_IMAGES[categoryId]) {
    for (const def of DEFAULT_CATEGORY_IMAGES[categoryId]) {
      if (!candidates.includes(def)) candidates.push(def);
    }
  }

  return candidates;
}

const CategoryCover: React.FC<{
  sources: string[];
  name: string;
  icon?: string;
  categoryId: string;
  collage: boolean;
}> = ({ sources, name, icon, categoryId, collage }) => {
  const [failedIndex, setFailedIndex] = useState(0);
  const src = sources[failedIndex];
  const fallback = getCategoryIcon(icon, categoryId, 44, '#64748b');
  if (!src) return fallback;
  if (collage && sources.length > 1) {
    return (
      <div className="category-cover-collage" aria-label={`${name} məhsul kolajı`}>
        {sources.slice(0, 4).map((source, index) => (
          <div className={`category-cover-tile category-cover-tile-${index + 1}`} key={source}>
            <ShimmerImage
              src={source}
              alt={`${name} — məhsul ${index + 1}`}
              fallback={getCategoryIcon(icon, categoryId, 22, '#64748b')}
              containerStyle={{ width: '100%', height: '100%' }}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        ))}
      </div>
    );
  }
  return (
    <ShimmerImage
      src={src}
      alt={name}
      fallback={fallback}
      onError={() => setFailedIndex((index) => index + 1)}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
};

export const VisualCategoryCards: React.FC<VisualCategoryCardsProps> = ({
  categories,
  products,
  selectedCategory,
  onSelectCategory,
  onViewAll,
  theme,
  autoPlayIntervalMs = 5000,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const didHintSwipe = useRef(false);

  const { containerRef, scrollItemIntoView, hasMoved, dragProps } =
    useHorizontalScroll<HTMLDivElement>({
      activeSelector: '.visual-category-card.is-selected',
      activeDependency: selectedCategory,
    });

  const publishedProductsByCategory = useMemo(() => {
    const grouped = new Map<string, Product[]>();
    for (const product of products) {
      if (product.status !== 'published') continue;
      const items = grouped.get(product.category) || [];
      items.push(product);
      grouped.set(product.category, items);
    }
    return grouped;
  }, [products]);

  // Extract all active populated categories (AC-2 strict published count)
  const allActiveCategories = useMemo<CategoryCardData[]>(() => {
    return categories
      .map((cat) => {
        const categoryProducts = publishedProductsByCategory.get(cat.id) || [];
        const count = categoryProducts.length;
        const imageUrls = resolveCategoryRepresentativeImages(categoryProducts, cat.id);
        return {
          ...cat,
          count,
          imageUrls,
        };
      })
      .filter((cat) => cat.count > 0 && cat.active !== false)
      .sort((a, b) => b.count - a.count);
  }, [categories, publishedProductsByCategory]);

  // Keep the mobile selector aligned with the site's real catalog groups.
  const collageSlides = useMemo<CollageSlideItem[]>(() => {
    if (allActiveCategories.length === 0) return [];
    const group = (ids: string[]) => allActiveCategories.filter((cat) => ids.includes(cat.id));

    const slides: CollageSlideItem[] = [
      {
        id: 'slide-large-appliances',
        title: 'Böyük Məişət Texnikası',
        style: 'bento',
        categories: group(['refrigerator', 'washer', 'dryer', 'dishwasher', 'tv']).length
          ? group(['refrigerator', 'washer', 'dryer', 'dishwasher', 'tv'])
          : allActiveCategories.slice(0, 5),
      },
      {
        id: 'slide-built-in',
        title: 'Quraşdırılan Texnika',
        style: 'facet',
        categories: group(['hood', 'oven', 'cooktop', 'microwave']),
      },
      {
        id: 'slide-small-appliances',
        title: 'Kiçik Məişət Texnikası',
        style: 'frames',
        categories: group([
          'airfryer',
          'vacuum_cleaner',
          'iron',
          'meat_grinder',
          'thermopot',
          'audio',
        ]),
      },
      {
        id: 'slide-climate',
        title: 'İqlim Texnikası',
        style: 'cluster',
        categories: group(['air_conditioner']),
      },
      {
        id: 'slide-all-categories',
        title: 'Bütün Kateqoriyalar',
        style: 'bento',
        categories: allActiveCategories,
      },
    ];

    return slides.filter((slide) => slide.categories.length > 0);
  }, [allActiveCategories]);

  useEffect(() => {
    const section = sectionRef.current;
    const track = containerRef.current;
    if (
      !section ||
      !track ||
      didHintSwipe.current ||
      collageSlides.length < 1 ||
      window.matchMedia('(min-width: 769px), (prefers-reduced-motion: reduce)').matches
    )
      return;
    let outboundTimer: number | undefined;
    let returnTimer: number | undefined;
    let restoreTimer: number | undefined;
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
      window.clearTimeout(outboundTimer);
      window.clearTimeout(returnTimer);
      window.clearTimeout(restoreTimer);
      track.style.removeProperty('scroll-snap-type');
    };
    const hint = () => {
      if (didHintSwipe.current || track.scrollWidth <= track.clientWidth + 20) return;
      outboundTimer = window.setTimeout(() => {
        if (cancelled) return;
        didHintSwipe.current = true;
        track.style.setProperty('scroll-snap-type', 'none', 'important');
        track.scrollTo({ left: Math.min(track.clientWidth * 0.48, 170), behavior: 'smooth' });
        returnTimer = window.setTimeout(() => {
          if (cancelled) return;
          track.scrollTo({ left: 0, behavior: 'smooth' });
          restoreTimer = window.setTimeout(() => {
            track.style.removeProperty('scroll-snap-type');
          }, 500);
        }, 1250);
      }, 300);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          hint();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(section);
    track.addEventListener('touchstart', cancel, { passive: true, once: true });
    track.addEventListener('pointerdown', cancel, { passive: true, once: true });
    return () => {
      observer.disconnect();
      cancel();
      track.removeEventListener('touchstart', cancel);
      track.removeEventListener('pointerdown', cancel);
    };
  }, [collageSlides.length, containerRef]);

  // Handle slide change with progress key reset
  const changeSlide = (newIndex: number) => {
    setActiveSlideIndex(newIndex);
    setProgressKey((k) => k + 1);
  };

  // Auto-play timer rotation (5 seconds)
  useEffect(() => {
    if (
      collageSlides.length <= 1 ||
      isHovered ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    )
      return;

    const timer = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setActiveSlideIndex((prev) => (prev + 1) % collageSlides.length);
      setProgressKey((k) => k + 1);
    }, autoPlayIntervalMs);

    return () => clearInterval(timer);
  }, [collageSlides.length, isHovered, autoPlayIntervalMs]);

  if (
    collageSlides.length === 0 ||
    allActiveCategories.length === 0 ||
    allActiveCategories.every((cat) => cat.count === 0)
  ) {
    return null;
  }

  const currentSlide = collageSlides[activeSlideIndex] || collageSlides[0];

  const handleNextSlide = () => {
    changeSlide((activeSlideIndex + 1) % collageSlides.length);
  };

  const handlePrevSlide = () => {
    changeSlide((activeSlideIndex - 1 + collageSlides.length) % collageSlides.length);
  };

  const handleCategoryClick = (catId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (typeof hasMoved === 'function' && hasMoved()) return;
    onSelectCategory(catId);
    try {
      if (typeof scrollItemIntoView === 'function') {
        scrollItemIntoView(event);
      }
    } catch {
      // safe fallback for test/mock DOM
    }
  };

  return (
    <section
      ref={sectionRef}
      className="catalog-container visual-categories-section scroll-reveal-item"
      aria-label="Məhsul Kateqoriyaları"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsHovered(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsHovered(false);
      }}
      onTouchStart={() => setIsHovered(true)}
    >
      {/* Header with Title, 4 Slide Indicators, Prev/Next Navigation */}
      <div className="visual-categories-header">
        <div className="visual-categories-title-wrap">
          <h2 className="visual-categories-title">Məhsul Kateqoriyaları</h2>
          <span className="category-swipe-hint">
            Sürüşdürərək digər kateqoriyalara baxın <ChevronRight size={13} />
          </span>
        </div>

        <div className="visual-categories-controls">
          {/* Real catalog groups; the final item opens the complete catalog. */}
          <div
            className={`collage-slide-indicators ${isHovered ? 'is-paused' : ''}`}
            role="tablist"
            aria-label="Kolaj slayd göstəriciləri"
          >
            {collageSlides.map((slide, idx) => {
              const isActive = idx === activeSlideIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`collage-slide-tab ${isActive ? 'active' : ''}`}
                  onClick={() => changeSlide(idx)}
                  title={slide.title}
                >
                  <span className="collage-tab-num">0{idx + 1}</span>
                  <span className="collage-tab-title">{slide.title}</span>
                  {/* YouTube-style 5-second progress fill line */}
                  <div className="collage-tab-progress-bar">
                    {isActive && (
                      <div
                        key={`prog-${progressKey}-${idx}`}
                        className="collage-tab-progress-fill"
                        style={{
                          animationDuration: `${autoPlayIntervalMs}ms`,
                        }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Prev / Next Slide Arrow Buttons */}
          <div className="collage-nav-arrows">
            <button
              type="button"
              className="collage-arrow-btn collage-prev-btn"
              onClick={handlePrevSlide}
              aria-label="Əvvəlki kolaj slaydı"
              title="Əvvəlki kolaj"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="collage-arrow-btn collage-next-btn"
              onClick={handleNextSlide}
              aria-label="Növbəti kolaj slaydı"
              title="Növbəti kolaj"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="visual-category-view-all-btn"
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.primary,
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
              }}
            >
              <span>Hamısına bax</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Grand Live Collage Slide Container */}
      <div
        key={`slide-${activeSlideIndex}-${currentSlide.id}`}
        ref={containerRef}
        {...dragProps}
        className={`visual-category-scroll-track collage-track-${currentSlide.style} collage-slide-animate-in`}
        data-category-count={currentSlide.categories.length}
        style={{ gap: '16px' }}
        role="region"
        aria-label={`Kateqoriyalar kolajı: ${currentSlide.title}`}
      >
        {currentSlide.categories.map((cat, index) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              className={`visual-category-reveal visual-category-card-${index + 1} collage-item-${currentSlide.style}-${index + 1}`}
            >
              <button
                data-category-id={cat.id}
                type="button"
                onClick={(e) => handleCategoryClick(cat.id, e)}
                className={`visual-category-card visual-category-card-style-${currentSlide.style} ${isSelected ? 'is-selected' : ''}`}
                aria-pressed={isSelected}
              >
                {/* Decorative Mosaic Pixel Clusters for Cluster Style (Kolak1.jpeg Matrix) */}
                {currentSlide.style === 'cluster' && (
                  <div className="mosaic-cluster-accents" aria-hidden="true">
                    <span className="cluster-dot dot-1" />
                    <span className="cluster-dot dot-2" />
                    <span className="cluster-dot dot-3" />
                  </div>
                )}

                {/* Top Badge: Product Count & Icon */}
                <div className="visual-category-top-badge">
                  <div className="visual-category-icon-pill">
                    {getCategoryIcon(cat.icon, cat.id, 16, '#64748b')}
                  </div>
                </div>

                {/* Category Visual Media Box */}
                <div className="visual-category-img-box">
                  <div className="visual-category-img-inner">
                    <CategoryCover
                      sources={cat.imageUrls}
                      name={cat.name}
                      icon={cat.icon}
                      categoryId={cat.id}
                      collage={cat.count > 1}
                    />
                  </div>
                </div>

                {/* Category Name & Action Footer */}
                <div className="visual-category-card-footer">
                  <div className="visual-category-title" title={cat.name}>
                    {cat.name}
                  </div>
                  <div className="visual-category-meta">
                    <span className="visual-category-explore">
                      Kəşf et <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
