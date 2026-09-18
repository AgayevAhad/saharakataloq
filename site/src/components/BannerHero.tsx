import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  ShieldCheck,
  Wind,
  Zap,
} from 'lucide-react';
import { TechnologyArticle } from '../types/product';
import { ThemeColors } from '../types/theme';

interface BannerHeroProps {
  theme: ThemeColors;
  articles?: TechnologyArticle[];
  heroTitle?: string;
  heroSubtitle?: string;
  onOpenArticle: (article?: TechnologyArticle) => void;
  onNavigateCatalog?: () => void;
  onNavigateContact?: () => void;
}

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

interface HeroSlide {
  type: 'video' | 'image';
  src: string;
  poster?: string;
  duration: number; // in seconds
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

export const BannerHero: React.FC<BannerHeroProps> = ({
  theme,
  articles = [],
  heroTitle: _heroTitle,
  heroSubtitle: _heroSubtitle,
  onOpenArticle,
  onNavigateCatalog,
  onNavigateContact: _onNavigateContact,
}) => {
  const activeArticles = articles.filter((a) => a.active !== false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);
  const [animating, setAnimating] = useState(false);
  const isMountedRef = useRef(true);
  const animTimeoutRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentSlide = HERO_SLIDES[currentIndex % HERO_SLIDES.length];

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Handle slide progression and smooth red progress bar fill
  useEffect(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setSlideProgress(0);

    const stepMs = 50;

    if (currentSlide.type === 'video') {
      if (videoRef.current) {
        try {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        } catch {
          // ignore
        }
      }

      progressIntervalRef.current = setInterval(() => {
        if (!isMountedRef.current) return;
        if (videoRef.current) {
          const cur = videoRef.current.currentTime || 0;
          const dur = currentSlide.duration || 20;
          const progress = Math.min(100, Math.max(0, (cur / dur) * 100));
          setSlideProgress(progress);

          if (cur >= dur || videoRef.current.ended) {
            videoRef.current.currentTime = 0;
            goToSlide((currentIndex + 1) % HERO_SLIDES.length);
          }
        }
      }, stepMs);
    } else {
      const totalSteps = (currentSlide.duration * 1000) / stepMs;
      const progressIncrement = 100 / totalSteps;

      progressIntervalRef.current = setInterval(() => {
        if (!isMountedRef.current) return;
        setSlideProgress((prev) => {
          if (prev >= 99.5) {
            goToSlide((currentIndex + 1) % HERO_SLIDES.length);
            return 0;
          }
          return Math.min(100, prev + progressIncrement);
        });
      }, stepMs);
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentIndex, currentSlide.type, currentSlide.duration]);

  const goToSlide = (targetIdx: number) => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    setAnimating(true);
    setSlideProgress(0);
    animTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setCurrentIndex(targetIdx);
      setAnimating(false);
    }, 150);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToSlide((currentIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToSlide((currentIndex + 1) % HERO_SLIDES.length);
  };

  const currentArticle = activeArticles[currentIndex % activeArticles.length] || activeArticles[0];

  return (
    <div
      className="banner-hero-wrapper"
      style={{
        width: '100%',
        maxWidth: '100%',
        padding: '0 0 12px 0',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        className="banner-hero-card"
        style={{
          width: '100%',
          maxWidth: '100%',
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          minHeight: '540px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: 'none',
          boxShadow: theme.mode === 'dark' ? '0 24px 60px rgba(0, 0, 0, 0.45)' : '0 16px 45px rgba(0, 0, 0, 0.10)',
          backgroundColor: '#0a0e17',
          padding: 0,
          margin: '0 auto',
        }}
      >
        {/* Visual Media Layer: Clear, bright, natural video for slide 0, high-res images for slides 1 & 2 */}
        {currentSlide.type === 'video' ? (
          <video
            ref={videoRef}
            key="hero-video-slide"
            src={currentSlide.src}
            poster={currentSlide.poster}
            autoPlay
            muted
            loop={false}
            playsInline
            onTimeUpdate={() => {
              if (videoRef.current) {
                const cur = videoRef.current.currentTime;
                const dur = currentSlide.duration || 20;
                setSlideProgress(Math.min(100, Math.max(0, (cur / dur) * 100)));
                if (cur >= dur || videoRef.current.ended) {
                  videoRef.current.currentTime = 0;
                  goToSlide((currentIndex + 1) % HERO_SLIDES.length);
                }
              }
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 40%',
              zIndex: 0,
            }}
          />
        ) : (
          <img
            key={`hero-img-slide-${currentIndex}`}
            src={currentSlide.src}
            alt={currentSlide.titlePart1}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
              zIndex: 0,
              transition: 'opacity 0.4s ease, transform 0.8s ease',
            }}
          />
        )}

        {/* Cinematic Scrim Gradient (Left side only for text legibility, zero edge glare on borders) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            background:
              'linear-gradient(90deg, rgba(7, 10, 15, 0.85) 0%, rgba(7, 10, 15, 0.55) 36%, rgba(7, 10, 15, 0.10) 60%, transparent 80%)',
          }}
        />

        {/* Top-Right Calligraphy Script Badge: "Daha çox imkan, sənə yaxın!" */}
        <div
          className="banner-hero-script-tag"
          style={{
            position: 'absolute',
            top: '24px',
            right: 'clamp(24px, 4vw, 56px)',
            textAlign: 'right',
            fontFamily: "'Playfair Display', 'Georgia', cursive, serif",
            fontStyle: 'italic',
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.8)',
            pointerEvents: 'none',
            lineHeight: 1.25,
            zIndex: 3,
          }}
        >
          <div style={{ fontSize: 'clamp(15px, 1.8vw, 20px)', fontWeight: 600, color: '#ffffff' }}>
            Daha çox imkan,
          </div>
          <div style={{ fontSize: 'clamp(18px, 2.2vw, 24px)', fontWeight: 800, color: '#e31e24' }}>
            sənə yaxın!
          </div>
        </div>

        {/* Hero Content Overlay (Left Half) */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '620px',
            padding: 'clamp(36px, 5vw, 64px) clamp(24px, 4vw, 56px) 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <h1
            className="banner-hero-title"
            style={{
              color: '#ffffff',
              textShadow: '0 2px 14px rgba(0, 0, 0, 0.65)',
              fontFamily: 'Outfit, -apple-system, sans-serif',
              fontWeight: 900,
              lineHeight: 1.15,
              fontSize: 'clamp(2rem, 4vw, 3.4rem)',
              letterSpacing: '-0.02em',
              margin: '0 0 16px 0',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              opacity: animating ? 0.3 : 1,
              transform: animating ? 'translateY(4px)' : 'none',
            }}
          >
            <span>{currentSlide.titlePart1}</span>
            <br />
            <span>{currentSlide.titlePart2}</span>
            <br />
            <span style={{ color: '#e31e24' }}>{currentSlide.titleAccent}</span>
          </h1>

          <p
            className="banner-hero-subtitle"
            style={{
              color: 'rgba(255, 255, 255, 0.85)',
              textShadow: '0 1px 8px rgba(0, 0, 0, 0.6)',
              fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)',
              lineHeight: 1.5,
              margin: '0 0 24px 0',
              maxWidth: '460px',
              fontWeight: 500,
              transition: 'opacity 0.2s ease',
              opacity: animating ? 0.3 : 1,
            }}
          >
            {currentSlide.subtitle}
          </p>


          <div className="banner-hero-actions-row" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => (onNavigateCatalog ? onNavigateCatalog() : null)}
              className="hero-primary-btn"
              style={{
                backgroundColor: '#e31e24',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 26px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(227, 30, 36, 0.4)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <span>Məhsullara bax</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Dynamic Interactive Auto-Rotating Technology Carousel Bar */}
          {currentArticle && (
            <div
              className={`tech-spotlight-card ${animating ? 'is-animating' : ''}`}
              onClick={() => onOpenArticle(currentArticle)}
              role="button"
              tabIndex={0}
              aria-label={`Texnologiya: ${currentArticle.title}`}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.72)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '14px',
                padding: '10px 16px',
                marginTop: '20px',
                maxWidth: '480px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(227, 30, 36, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getArticleIcon(currentArticle.icon, '#e31e24', 18)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3
                      className="tech-spotlight-title"
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#ffffff',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {currentArticle.title}
                    </h3>
                    {currentArticle.badge && (
                      <span
                        style={{
                          backgroundColor: '#e31e24',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          flexShrink: 0,
                        }}
                      >
                        {currentArticle.badge}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: '11.5px',
                      color: 'rgba(255, 255, 255, 0.72)',
                      margin: '2px 0 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {currentArticle.subtitle}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span
                  className="tech-spotlight-cta-text"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#e31e24',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Ətraflı Bax
                </span>

                {activeArticles.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      className="tech-spotlight-nav-btn"
                      onClick={prevSlide}
                      title="Əvvəlki texnologiya"
                      aria-label="Əvvəlki texnologiya"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        padding: '4px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      className="tech-spotlight-nav-btn"
                      onClick={nextSlide}
                      title="Növbəti texnologiya"
                      aria-label="Növbəti texnologiya"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        padding: '4px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pagination / Real-Time Progress Bar indicator (01 — 02 — 03) */}
        <div
          className="banner-hero-pagination-row"
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '0 clamp(24px, 4vw, 56px) 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '13px',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          {HERO_SLIDES.map((slide, idx) => {
            const isActive = (currentIndex % HERO_SLIDES.length) === idx;
            const isPassed = (currentIndex % HERO_SLIDES.length) > idx;
            const formattedNum = String(idx + 1).padStart(2, '0');
            const fillWidth = isActive ? `${slideProgress}%` : isPassed ? '100%' : '0%';

            return (
              <button
                key={idx}
                type="button"
                className={`hero-pagination-btn ${isActive ? 'active' : ''}`}
                onClick={() => goToSlide(idx)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px 4px',
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
                  fontWeight: isActive ? 800 : 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                aria-label={`Slayd ${idx + 1}: ${slide.titlePart1}`}
              >
                <span>{formattedNum}</span>
                <div
                  style={{
                    width: '38px',
                    height: '3px',
                    backgroundColor: 'rgba(255, 255, 255, 0.22)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    className="hero-progress-fill"
                    style={{
                      width: fillWidth,
                      height: '100%',
                      backgroundColor: '#e31e24',
                      borderRadius: '3px',
                      transition: isActive ? 'width 0.08s linear' : 'none',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

