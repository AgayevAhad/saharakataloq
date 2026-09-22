import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, CheckCircle2, Sparkles } from 'lucide-react';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from './ShimmerImage';

export interface VideoReviewItem {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  views?: string;
}

export const SAHARA_OFFICIAL_YOUTUBE_URL = 'https://www.youtube.com/@SaharaElectronics2013';

export const DEFAULT_SAHARA_VIDEO_REVIEWS: VideoReviewItem[] = [
  {
    id: 'vid-lotus-fridge',
    videoId: 'f4gaecGGKNE',
    title: 'Lotus Soyuducu – Mətbəxində təravətin ünvanı!',
    thumbnailUrl: 'https://i.ytimg.com/vi/f4gaecGGKNE/maxresdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/shorts/f4gaecGGKNE',
    views: '1.9K+',
  },
  {
    id: 'vid-lotus-stove',
    videoId: 'U1aTKkXEkDs',
    title: 'Lotus qaz sobası – Mətbəxinizin yeni gücü',
    thumbnailUrl: 'https://i.ytimg.com/vi/U1aTKkXEkDs/maxresdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/shorts/U1aTKkXEkDs',
    views: '570+',
  },
  {
    id: 'vid-lotus-meat',
    videoId: 'WHF-oeOoNfc',
    title: 'Lotus ətçəkən – 1800 Vt güc və paslanmayan korpus',
    thumbnailUrl: 'https://i.ytimg.com/vi/WHF-oeOoNfc/maxresdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/shorts/WHF-oeOoNfc',
    views: '2.1K+',
  },
  {
    id: 'vid-artel-vacuum',
    videoId: 'SKTVHhtYSRg',
    title: 'Artel VCC 0220 Blue Tozsoranı – Yüksək sovurma gücü',
    thumbnailUrl: 'https://i.ytimg.com/vi/SKTVHhtYSRg/maxresdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/shorts/SKTVHhtYSRg',
    views: '2.9K+',
  },
  {
    id: 'vid-lotus-wash',
    videoId: '_DTxCC7h8vA',
    title: 'Lotus Ağıllı Paltaryuyan maşın icmalı',
    thumbnailUrl: 'https://i.ytimg.com/vi/_DTxCC7h8vA/maxresdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/shorts/_DTxCC7h8vA',
    views: '480+',
  },
  {
    id: 'vid-toshiba-micro',
    videoId: 'veFsT5A5zLk',
    title: 'Toshiba mikrodalğalı soba — hər yeməyə uyğun rejim!',
    thumbnailUrl: 'https://i.ytimg.com/vi/veFsT5A5zLk/maxresdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/shorts/veFsT5A5zLk',
    views: '190+',
  },
  {
    id: 'vid-artel-tv',
    videoId: 'S5XvVDjf7T8',
    title: 'Artel Smart TV: Sürətli, Aydın və Sərfəli!',
    thumbnailUrl: 'https://i.ytimg.com/vi/S5XvVDjf7T8/maxresdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/shorts/S5XvVDjf7T8',
    views: '180+',
  },
  {
    id: 'vid-delonghi-coffee',
    videoId: 'mEJ_E77ERBs',
    title: 'Delonghi Qəhvə bişirən – Peşəkar qəhvə dadı',
    thumbnailUrl: 'https://i.ytimg.com/vi/mEJ_E77ERBs/maxresdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/shorts/mEJ_E77ERBs',
    views: '170+',
  },
];

export const OfficialYouTubeIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <path
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
      fill="#FF0000"
    />
    <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF" />
  </svg>
);

interface ProductVideoReviewsSectionProps {
  theme: ThemeColors;
  videos?: VideoReviewItem[];
  stepIntervalMs?: number;
}

export const ProductVideoReviewsSection: React.FC<ProductVideoReviewsSectionProps> = ({
  theme,
  videos = DEFAULT_SAHARA_VIDEO_REVIEWS,
  stepIntervalMs = 4200,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isInViewport, setIsInViewport] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isPointerDownRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragRafIdRef = useRef<number | null>(null);
  const targetScrollLeftRef = useRef(0);

  // Viewport intersection observer: only animate when in view
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { rootMargin: '100px', threshold: 0.05 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Document tab visibility listener
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibility = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility, { passive: true });
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Helper to get step distance
  const getStepDistance = (): number => {
    const container = scrollContainerRef.current;
    if (!container) return 396;
    const firstCard = container.querySelector<HTMLElement>('.video-review-item, .video-review-card');
    if (firstCard) {
      return firstCard.offsetWidth + 18;
    }
    return 396;
  };

  // Step-and-Pause Carousel Movement: smooth advance by 1 card, pause, advance, pause
  useEffect(() => {
    if (isHovered || isDragging || playingVideoId !== null || !isInViewport || !isTabVisible) return;

    const timer = setInterval(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const step = getStepDistance();
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (container.scrollLeft >= maxScroll - 15) {
        // Loop back to beginning smoothly
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, stepIntervalMs);

    return () => clearInterval(timer);
  }, [isHovered, isDragging, playingVideoId, stepIntervalMs, isInViewport, isTabVisible]);

  const scrollManual = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const step = getStepDistance();
    const amount = direction === 'left' ? -step : step;
    container.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Pointer drag handling for touch and desktop mouse grabbing with rAF
  const handlePointerDown = (e: React.PointerEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
    targetScrollLeftRef.current = container.scrollLeft;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const x = e.pageX - container.offsetLeft;
    const walk = x - startXRef.current;

    if (Math.abs(walk) > 6) {
      hasDraggedRef.current = true;
      setIsDragging(true);
      targetScrollLeftRef.current = scrollLeftRef.current - walk;

      if (dragRafIdRef.current === null) {
        dragRafIdRef.current = requestAnimationFrame(() => {
          dragRafIdRef.current = null;
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = targetScrollLeftRef.current;
          }
        });
      }
    }
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    if (dragRafIdRef.current !== null) {
      cancelAnimationFrame(dragRafIdRef.current);
      dragRafIdRef.current = null;
    }
    setTimeout(() => {
      setIsDragging(false);
      hasDraggedRef.current = false;
    }, 80);
  };

  return (
    <section
      ref={sectionRef}
      className="video-reviews-section scroll-reveal-item"
      aria-label="Sahara-da məhsul icmalı"
      style={{
        width: '100vw',
        marginLeft: 'calc(50% - 50vw)',
        marginRight: 'calc(50% - 50vw)',
        maxWidth: '100vw',
        backgroundColor: 'transparent',
        padding: '24px 0 32px',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        contain: 'layout paint',
      }}
    >
      {/* Section Header with Luxurious Spacing */}
      <div
        className="catalog-container video-reviews-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          padding: '0 clamp(16px, 3.2vw, 32px)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(220, 38, 38, 0.1)',
              color: '#dc2626',
              flexShrink: 0,
            }}
          >
            <Sparkles size={17} />
          </span>
          <h2
            className="video-reviews-title"
            style={{
              fontSize: 'clamp(1.3rem, 2.4vw, 1.75rem)',
              fontWeight: 850,
              color: theme.mode === 'dark' ? '#f8fafc' : '#0f172a',
              fontFamily: 'Outfit, -apple-system, sans-serif',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Sahara-da məhsul icmalı
          </h2>
        </div>

        {/* Right Actions: Subscribe button (styled like 'Daha çox göstər') */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <a
            href={SAHARA_OFFICIAL_YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="youtube-subscribe-btn"
          >
            <OfficialYouTubeIcon size={18} />
            <span>Kanalımıza abunə olun</span>
          </a>
        </div>
      </div>

      {/* Video Carousel Wrapper with Floating Global Navigation Arrows */}
      <div
        className="video-reviews-carousel-wrapper"
        style={{
          position: 'relative',
          width: '100%',
        }}
      >
        {/* Floating Left Arrow */}
        <button
          type="button"
          onClick={() => scrollManual('left')}
          aria-label="Əvvəlki videolar"
          className="video-carousel-floating-btn video-carousel-floating-left"
          style={{
            position: 'absolute',
            left: 'max(16px, calc((100vw - 1340px) / 2 + 12px))',
            top: 'calc(50% - 24px)',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: `1px solid ${theme.border}`,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
            color: theme.mode === 'dark' ? '#f8fafc' : '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={24} />
        </button>

        {/* Floating Right Arrow */}
        <button
          type="button"
          onClick={() => scrollManual('right')}
          aria-label="Növbəti videolar"
          className="video-carousel-floating-btn video-carousel-floating-right"
          style={{
            position: 'absolute',
            right: 'max(16px, calc((100vw - 1340px) / 2 + 12px))',
            top: 'calc(50% - 24px)',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: `1px solid ${theme.border}`,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
            color: theme.mode === 'dark' ? '#f8fafc' : '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronRight size={24} />
        </button>

        {/* Video Cards Row: Full Width Edge-to-Edge Step Carousel */}
        <div
          ref={scrollContainerRef}
          className={`video-reviews-row-track ${isDragging ? 'is-dragging' : ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            display: 'flex',
            gap: '18px',
            overflowX: 'auto',
            scrollSnapType: isDragging ? 'none' : 'x mandatory',
            paddingBottom: '14px',
            paddingTop: '4px',
            paddingLeft: 'max(24px, calc((100vw - 1340px) / 2 + 24px))',
            paddingRight: 'max(24px, calc((100vw - 1340px) / 2 + 24px))',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'pan-y',
          }}
        >
        {videos.map((item) => {
          const isPlaying = playingVideoId === item.videoId;
          return (
            <div
              key={item.id}
              className="video-review-item"
              style={{
                flex: '0 0 320px',
                width: '320px',
                maxWidth: '85vw',
                scrollSnapAlign: 'start',
                display: 'flex',
                flexDirection: 'column',
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                position: 'relative',
              }}
            >
              {/* Tall Vertical Video Media Frame (9:16 Shorts/Reel Aspect Ratio) */}
              <div
                className="video-review-media-wrapper"
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '9 / 16',
                  minHeight: '480px',
                  borderRadius: '22px',
                  backgroundColor: '#000000',
                  overflow: 'hidden',
                  cursor: isPlaying ? 'default' : 'pointer',
                  boxShadow:
                    theme.mode === 'dark'
                      ? '0 8px 30px rgba(0,0,0,0.6)'
                      : '0 8px 26px rgba(0,0,0,0.12)',
                  transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
                onClick={() => {
                  if (!hasDraggedRef.current && !isPlaying) {
                    setPlayingVideoId(item.videoId);
                  }
                }}
              >
                {isPlaying ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${item.videoId}?autoplay=1&rel=0&modestbranding=1`}
                    title={item.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                  />
                ) : (
                  <>
                    <ShimmerImage
                      src={item.thumbnailUrl}
                      alt={item.title}
                      containerStyle={{ width: '100%', height: '100%' }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                      }}
                    />

                    {/* Subtle vignette gradient */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.35) 100%)',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Center Play Button Overlay */}
                    <div
                      className="video-review-play-btn"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(220, 38, 38, 0.95)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        boxShadow: '0 6px 20px rgba(220, 38, 38, 0.55)',
                        transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      }}
                    >
                      <Play size={24} fill="#ffffff" style={{ marginLeft: '4px' }} />
                    </div>
                  </>
                )}
              </div>

              {/* Simple Video Title Directly Underneath */}
              <h3
                style={{
                  fontSize: '14.5px',
                  fontWeight: 700,
                  color: theme.mode === 'dark' ? '#f8fafc' : '#0f172a',
                  margin: '10px 0 0 0',
                  lineHeight: 1.45,
                  fontFamily: 'Outfit, -apple-system, sans-serif',
                  letterSpacing: '-0.01em',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
                title={item.title}
                onClick={() => {
                  if (!hasDraggedRef.current) {
                    setPlayingVideoId(isPlaying ? null : item.videoId);
                  }
                }}
              >
                {item.title}
              </h3>
            </div>
          );
        })}
        </div>
      </div>
    </section>
  );
};
