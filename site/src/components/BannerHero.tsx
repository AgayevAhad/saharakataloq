import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  ShieldCheck,
  Wind,
  Zap,
} from 'lucide-react';
import { TechnologyArticle } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from './ShimmerImage';

interface BannerHeroProps {
  theme: ThemeColors;
  articles?: TechnologyArticle[];
  heroTitle?: string;
  heroSubtitle?: string;
  onOpenArticle: (article?: TechnologyArticle) => void;
  onNavigateCatalog?: () => void;
  onNavigateContact?: () => void;
}

interface HeroSlide {
  type: 'video' | 'image';
  src: string;
  poster?: string;
  duration: number;
  titlePart1: string;
  titlePart2: string;
  titleAccent: string;
  subtitle: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    type: 'video',
    src: '/media/Videosahara.mp4',
    poster: '/media/hero-livingroom.jpg',
    duration: 20,
    titlePart1: 'Texnologiya',
    titlePart2: 'həyatınızı',
    titleAccent: 'daha gözəl edir',
    subtitle: 'Seçilmiş brendlər, rəsmi zəmanət, etibarlı seçim – Sahara Electronics-də.',
  },
  {
    type: 'image',
    src: '/media/promo-fridge.jpg',
    duration: 6,
    titlePart1: 'Mətbəxinizdə',
    titlePart2: 'italyan zərifliyi və',
    titleAccent: 'inverter gücü',
    subtitle: 'A+++ enerji effektivliyi, NoFrost dondurma və rəsmi zəmanətli premium texnika.',
  },
  {
    type: 'image',
    src: '/media/promo-washer.jpg',
    duration: 6,
    titlePart1: 'Ağıllı qulluq və',
    titlePart2: 'hər parçada',
    titleAccent: 'maksimum təmizlik',
    subtitle: 'Buxarla yuma, səssiz birbaşa ötürücülü mühərrik və intuitiv sensor idarəetmə.',
  },
];

const COMPANION_SLIDES = [
  {
    src: '/media/hero/kitchen-counter.webm',
    label: 'Müasir mətbəx və ağıllı texnika',
    duration: 7,
    sourceUrl:
      'https://www.pexels.com/video/modern-kitchen-counter-with-appliances-and-faucet-34822125/',
  },
  {
    src: '/media/hero/black-kitchen.webm',
    label: 'Qara rəngli premium mətbəx interyeri',
    duration: 7,
    sourceUrl:
      'https://www.pexels.com/video/modern-black-kitchen-interior-with-appliances-34231474/',
  },
  {
    src: '/media/hero/wood-kitchen.webm',
    label: 'Taxta detallı işıqlı mətbəx interyeri',
    duration: 7,
    sourceUrl:
      'https://www.pexels.com/video/modern-kitchen-with-wooden-cabinets-and-appliances-36991695/',
  },
];

const getArticleIcon = (iconName?: string, color?: string, size = 18) => {
  switch (iconName?.toLowerCase()) {
    case 'flame':
    case 'fire':
      return <Flame size={size} color={color || '#ef4444'} />;
    case 'wind':
      return <Wind size={size} color={color || '#0284c7'} />;
    case 'shieldcheck':
    case 'shield':
      return <ShieldCheck size={size} color={color || '#16a34a'} />;
    case 'zap':
    default:
      return <Zap size={size} color={color || '#ef4444'} />;
  }
};

export const BannerHero: React.FC<BannerHeroProps> = ({
  theme,
  articles = [],
  heroTitle: _heroTitle,
  heroSubtitle: _heroSubtitle,
  onOpenArticle,
  onNavigateCatalog,
  onNavigateContact: _onNavigateContact,
}) => {
  const activeArticles = articles.filter((article) => article.active !== false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [companionIndex, setCompanionIndex] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);
  const [companionProgress, setCompanionProgress] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [mainVideoReady, setMainVideoReady] = useState(false);
  const [readyCompanions, setReadyCompanions] = useState<Set<number>>(() => new Set());
  const videoRef = useRef<HTMLVideoElement>(null);
  const companionVideoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const companionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSlide = HERO_SLIDES[currentIndex];
  const currentArticle = activeArticles[currentIndex % activeArticles.length] || activeArticles[0];

  const goToSlide = (targetIndex: number) => {
    const normalized = (targetIndex + HERO_SLIDES.length) % HERO_SLIDES.length;
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    setAnimating(true);
    setSlideProgress(0);
    setCurrentIndex(normalized);
    animationTimerRef.current = setTimeout(() => setAnimating(false), 520);
  };

  const goToCompanionSlide = (targetIndex: number) => {
    if (companionTimerRef.current) clearTimeout(companionTimerRef.current);
    const normalized = (targetIndex + COMPANION_SLIDES.length) % COMPANION_SLIDES.length;
    setCompanionProgress(0);
    setCompanionIndex(normalized);
  };

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
      if (companionTimerRef.current) clearTimeout(companionTimerRef.current);
    };
  }, []);

  // The smaller visual follows the large stage exactly one second later.
  useEffect(() => {
    if (companionTimerRef.current) clearTimeout(companionTimerRef.current);
    companionTimerRef.current = setTimeout(() => {
      setCompanionIndex(currentIndex % COMPANION_SLIDES.length);
      setCompanionProgress(0);
    }, 1000);
    return () => {
      if (companionTimerRef.current) clearTimeout(companionTimerRef.current);
    };
  }, [currentIndex]);

  useEffect(() => {
    companionVideoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === companionIndex) video.play().catch(() => undefined);
      else video.pause();
    });
  }, [companionIndex]);

  // Companion progress fill timer (YouTube story style)
  useEffect(() => {
    let disposed = false;
    const stepMs = 50;
    setCompanionProgress(0);
    const companionSlide = COMPANION_SLIDES[companionIndex];
    const duration = companionSlide?.duration || 7;
    const activeVideo = companionVideoRefs.current[companionIndex];

    if (activeVideo) {
      activeVideo.currentTime = 0;
      activeVideo.play().catch(() => undefined);
    }

    const startedAt = Date.now();
    const interval = setInterval(() => {
      if (disposed || typeof window === 'undefined') return;
      const video = companionVideoRefs.current[companionIndex];
      let progress = 0;
      if (video && video.duration && !isNaN(video.duration) && video.duration > 0) {
        progress = Math.min(100, (video.currentTime / Math.min(video.duration, duration)) * 100);
        if (video.currentTime >= Math.min(video.duration, duration) || video.ended) {
          goToCompanionSlide(companionIndex + 1);
          return;
        }
      } else {
        const elapsed = (Date.now() - startedAt) / 1000;
        progress = Math.min(100, (elapsed / duration) * 100);
        if (progress >= 100) {
          goToCompanionSlide(companionIndex + 1);
          return;
        }
      }
      setCompanionProgress(progress);
    }, stepMs);

    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [companionIndex]);

  useEffect(() => {
    let disposed = false;
    const stepMs = 50;
    setSlideProgress(0);

    if (currentSlide.type === 'video') {
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        video.play().catch(() => undefined);
      }
      const interval = setInterval(() => {
        if (disposed || typeof window === 'undefined') return;
        const activeVideo = videoRef.current;
        const elapsed = activeVideo?.currentTime || 0;
        setSlideProgress(Math.min(100, (elapsed / currentSlide.duration) * 100));
        if (elapsed >= currentSlide.duration || activeVideo?.ended) goToSlide(currentIndex + 1);
      }, stepMs);
      return () => {
        disposed = true;
        clearInterval(interval);
      };
    }

    const startedAt = Date.now();
    const interval = setInterval(() => {
      if (disposed || typeof window === 'undefined') return;
      const progress = ((Date.now() - startedAt) / (currentSlide.duration * 1000)) * 100;
      if (progress >= 100) goToSlide(currentIndex + 1);
      else setSlideProgress(progress);
    }, stepMs);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [currentIndex, currentSlide.duration, currentSlide.type]);

  const markCompanionReady = (index: number) => {
    setReadyCompanions((previous) => {
      if (previous.has(index)) return previous;
      const next = new Set(previous);
      next.add(index);
      return next;
    });
  };

  return (
    <section
      className="banner-hero-wrapper catalog-container"
      aria-label="Sahara Electronics təqdimatı"
      style={{
        width: '100%',
        maxWidth: '1560px',
        paddingTop: '8px',
        paddingBottom: '8px',
        paddingLeft: 'clamp(16px, 2vw, 28px)',
        paddingRight: 'clamp(16px, 2vw, 28px)',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div className="banner-hero-stage">
        <div
          className={`banner-hero-card ${currentSlide.type === 'video' ? 'is-video' : ''}`}
          style={{
            width: '100%',
            maxWidth: '100%',
            borderRadius: '24px',
            overflow: 'hidden',
            position: 'relative',
            aspectRatio: '16 / 9',
            minHeight: '540px',
            height: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: 'none',
            boxShadow:
              theme?.mode === 'dark'
                ? '0 18px 46px rgba(0, 0, 0, 0.38)'
                : '0 16px 38px rgba(15, 23, 42, 0.12)',
            backgroundColor: '#0a0e17',
            padding: 0,
            margin: '0 auto',
          }}
        >
          <div className="banner-hero-media-viewport" aria-hidden="true">
            <div
              className="banner-hero-media-track"
              data-active-index={currentIndex}
              style={{ transform: `translate3d(-${currentIndex * 100}%, 0, 0)` }}
            >
              {HERO_SLIDES.map((slide) => (
                <div className="banner-hero-media-slide" key={slide.src}>
                  {slide.type === 'video' ? (
                    <>
                      {!mainVideoReady && (
                        <div className="hero-media-loading skeleton-box">
                          <Loader2 className="img-spin" size={25} />
                        </div>
                      )}
                      <video
                        ref={videoRef}
                        className="hero-main-video"
                        src={slide.src}
                        poster={slide.poster}
                        autoPlay
                        muted
                        loop={false}
                        playsInline
                        preload="metadata"
                        onCanPlay={() => setMainVideoReady(true)}
                        onTimeUpdate={(e) => {
                          const target = e.currentTarget;
                          if (target.currentTime >= 20) {
                            target.currentTime = 0;
                          }
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          objectPosition: 'center center',
                          opacity: mainVideoReady ? 1 : 0,
                        }}
                      />
                    </>
                  ) : (
                    <ShimmerImage
                      src={slide.src}
                      alt=""
                      loading="eager"
                      objectFit="cover"
                      objectPosition="center center"
                      containerStyle={{ width: '100%', height: '100%' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="banner-hero-scrim" aria-hidden="true" />
          <div className="banner-hero-script-tag" aria-hidden="true">
            <span>Daha çox imkan,</span>
            <strong>sənə yaxın!</strong>
          </div>

          <div className={`banner-hero-content ${animating ? 'is-animating' : ''}`}>
            <h1 className="banner-hero-title">
              <span>{currentSlide.titlePart1}</span>
              <br />
              <span>{currentSlide.titlePart2}</span>
              <br />
              <span className="banner-hero-title-accent">{currentSlide.titleAccent}</span>
            </h1>
            <p className="banner-hero-subtitle">{currentSlide.subtitle}</p>
            <div className="banner-hero-actions-row">
              <button type="button" onClick={onNavigateCatalog} className="hero-primary-btn">
                <span>Məhsullara bax</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {currentArticle && (
              <div
                className={`tech-spotlight-card ${animating ? 'is-animating' : ''}`}
                onClick={() => onOpenArticle(currentArticle)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenArticle(currentArticle);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Texnologiya: ${currentArticle.title}`}
              >
                <div className="tech-spotlight-main">
                  <div className="tech-spotlight-icon-box">
                    {getArticleIcon(currentArticle.icon, '#e31e24', 18)}
                  </div>
                  <div className="tech-spotlight-content">
                    <div className="tech-spotlight-title-row">
                      <h3 className="tech-spotlight-title">{currentArticle.title}</h3>
                      {currentArticle.badge && (
                        <span className="tech-spotlight-badge">{currentArticle.badge}</span>
                      )}
                    </div>
                    <p className="tech-spotlight-desc">{currentArticle.subtitle}</p>
                  </div>
                </div>
                <div className="tech-spotlight-actions">
                  <span className="tech-spotlight-cta-text">Ətraflı Bax</span>
                  {activeArticles.length > 1 && (
                    <div className="tech-spotlight-nav-group">
                      <button
                        type="button"
                        className="tech-spotlight-nav-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          goToSlide(currentIndex - 1);
                        }}
                        title="Əvvəlki texnologiya"
                        aria-label="Əvvəlki texnologiya"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        className="tech-spotlight-nav-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          goToSlide(currentIndex + 1);
                        }}
                        title="Növbəti texnologiya"
                        aria-label="Növbəti texnologiya"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="banner-hero-pagination-row">
            {HERO_SLIDES.map((slide, index) => {
              const active = index === currentIndex;
              const passed = index < currentIndex;
              return (
                <button
                  key={slide.src}
                  type="button"
                  className={`hero-pagination-btn ${active ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Slayd ${index + 1}: ${slide.titlePart1}`}
                >
                  <span className="hero-progress-track" aria-hidden="true">
                    <span
                      className="hero-progress-fill"
                      style={{ width: active ? `${slideProgress}%` : passed ? '100%' : '0%' }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="banner-hero-companion" aria-label="İnteryer ilhamı">
          <div
            className="banner-hero-companion-track"
            data-active-index={companionIndex}
            data-delay-ms="1000"
            style={{ transform: `translate3d(-${companionIndex * 100}%, 0, 0)` }}
          >
            {COMPANION_SLIDES.map((slide, index) => {
              const ready = readyCompanions.has(index);
              return (
                <div
                  className="banner-hero-companion-slide"
                  key={slide.src}
                  aria-hidden={index !== companionIndex}
                >
                  {!ready && (
                    <div className="hero-media-loading skeleton-box">
                      <Loader2 className="img-spin" size={24} />
                    </div>
                  )}
                  <video
                    ref={(node) => {
                      companionVideoRefs.current[index] = node;
                    }}
                    src={slide.src}
                    muted
                    loop
                    playsInline
                    preload={index === 0 ? 'auto' : 'metadata'}
                    autoPlay={index === companionIndex}
                    onCanPlay={() => markCompanionReady(index)}
                    aria-label={slide.label}
                    style={{ opacity: ready ? 1 : 0 }}
                  />
                  <div className="banner-hero-companion-shade" aria-hidden="true" />
                  <div className="banner-hero-companion-copy">
                    <span>Yaşam məkanına uyğun seçim</span>
                    <strong>{slide.label}</strong>
                  </div>
                </div>
              );
            })}
          </div>
          <div
            className="banner-hero-companion-dots banner-hero-companion-progress-row"
            aria-label="Köməkçi karusel slaydları"
          >
            {COMPANION_SLIDES.map((slide, index) => {
              const active = index === companionIndex;
              const passed = index < companionIndex;
              return (
                <button
                  key={slide.sourceUrl}
                  type="button"
                  className={`companion-progress-btn ${active ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToCompanionSlide(index);
                  }}
                  aria-label={`Köməkçi slayd ${index + 1}: ${slide.label}`}
                >
                  <span className="companion-progress-track" aria-hidden="true">
                    <span
                      className="companion-progress-fill"
                      style={{ width: active ? `${companionProgress}%` : passed ? '100%' : '0%' }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
};
