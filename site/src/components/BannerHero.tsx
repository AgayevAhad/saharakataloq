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
  const [isPaused, setIsPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const isMountedRef = useRef(true);
  const animTimeoutRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeArticles.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      if (!isMountedRef.current) return;
      setAnimating(true);
      animTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        setCurrentIndex((prev) => (prev + 1) % activeArticles.length);
        setAnimating(false);
      }, 200);
    }, 5000);
    return () => {
      clearInterval(timer);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, [activeArticles.length, isPaused]);

  const currentArticle = activeArticles[currentIndex] || activeArticles[0];

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setCurrentIndex((prev) => (prev - 1 + activeArticles.length) % activeArticles.length);
      setAnimating(false);
    }, 150);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setCurrentIndex((prev) => (prev + 1) % activeArticles.length);
      setAnimating(false);
    }, 150);
  };

  return (
    <div className="banner-hero-wrapper catalog-container" style={{ padding: '8px 0 16px' }}>
      <div
        className="banner-hero-card"
        style={{
          borderRadius: '0',
          overflow: 'hidden',
          position: 'relative',
          minHeight: '560px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: 'none',
          boxShadow: 'none',
          backgroundColor: 'transparent',
        }}
      >
        {/* Full-Bleed Expanded Video Background (Videosahara) with Soft Edge-Fade Masking */}
        <video
          ref={videoRef}
          src="/media/Videosahara.mp4"
          poster="/media/hero-livingroom.jpg"
          autoPlay
          muted
          loop
          playsInline
          onTimeUpdate={() => {
            if (videoRef.current && videoRef.current.currentTime >= 20) {
              videoRef.current.currentTime = 0;
            }
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '65% center',
            zIndex: 0,
            maskImage:
              'radial-gradient(ellipse 92% 88% at 68% 50%, black 30%, rgba(0, 0, 0, 0.65) 60%, transparent 95%), linear-gradient(to right, transparent 0%, black 24%, black 86%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 92% 88% at 68% 50%, black 30%, rgba(0, 0, 0, 0.65) 60%, transparent 95%), linear-gradient(to right, transparent 0%, black 24%, black 86%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
          }}
        />

        {/* Ambient Gradient Overlay for text readability (Dark/Moody left vignette) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            background:
              theme.mode === 'dark'
                ? 'linear-gradient(90deg, rgba(8, 12, 18, 0.98) 0%, rgba(8, 12, 18, 0.85) 34%, rgba(8, 12, 18, 0.15) 64%, transparent 100%)'
                : 'linear-gradient(90deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.88) 34%, rgba(255, 255, 255, 0.15) 64%, transparent 100%)',
          }}
        />

        {/* Misty atmospheric edge diffusion overlay (Dissolves edges seamlessly into page canvas) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            background:
              theme.mode === 'dark'
                ? 'linear-gradient(to bottom, rgba(8, 12, 18, 0.6) 0%, transparent 12%, transparent 88%, rgba(8, 12, 18, 0.7) 100%), linear-gradient(to right, rgba(8, 12, 18, 0.5) 0%, transparent 16%, transparent 84%, rgba(8, 12, 18, 0.6) 100%)'
                : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.6) 0%, transparent 12%, transparent 88%, rgba(255, 255, 255, 0.7) 100%), linear-gradient(to right, rgba(255, 255, 255, 0.5) 0%, transparent 16%, transparent 84%, rgba(255, 255, 255, 0.6) 100%)',
          }}
        />

        {/* Top-Right Calligraphy Script Badge: "Daha çox imkan, sənə yaxın!" */}
        <div
          className="banner-hero-script-tag"
          style={{
            position: 'absolute',
            top: '24px',
            right: '28px',
            textAlign: 'right',
            fontFamily: "'Playfair Display', 'Georgia', cursive, serif",
            fontStyle: 'italic',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.65)',
            pointerEvents: 'none',
            lineHeight: 1.25,
            zIndex: 3,
          }}
        >
          <div style={{ fontSize: 'clamp(15px, 1.8vw, 20px)', fontWeight: 600, color: theme.mode === 'dark' ? '#ffffff' : '#1e293b' }}>
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
            maxWidth: '580px',
            padding: 'clamp(24px, 4vw, 44px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <h1
            className="banner-hero-title"
            style={{
              color: theme.text,
              fontFamily: 'Outfit, -apple-system, sans-serif',
              fontWeight: 900,
              lineHeight: 1.15,
              fontSize: 'clamp(2rem, 4vw, 3.4rem)',
              letterSpacing: '-0.02em',
              margin: '0 0 16px 0',
            }}
          >
            <span>Texnologiya</span>
            <br />
            <span>həyatınızı</span>
            <br />
            <span style={{ color: '#e31e24' }}>daha gözəl edir</span>
          </h1>

          <p
            className="banner-hero-subtitle"
            style={{
              color: theme.textMuted || '#64748b',
              fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)',
              lineHeight: 1.5,
              margin: '0 0 24px 0',
              maxWidth: '460px',
              fontWeight: 500,
            }}
          >
            Seçilmiş brendlər, rəsmi zəmanət, etibarlı seçim – Sahara Electronics-də.
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
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onClick={() => onOpenArticle(currentArticle)}
              role="button"
              tabIndex={0}
              aria-label={`Texnologiya: ${currentArticle.title}`}
              style={{
                backgroundColor: theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: `1px solid ${theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(227, 30, 36, 0.2)'}`,
                borderRadius: '14px',
                padding: '10px 16px',
                marginTop: '20px',
                maxWidth: '480px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: theme.mode === 'dark' ? '#2e0e0e' : '#fee2e2',
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
                        color: theme.text,
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
                      color: theme.textMuted || '#64748b',
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
                        background: theme.bgCard,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        padding: '4px',
                        color: theme.text,
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
                        background: theme.bgCard,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        padding: '4px',
                        color: theme.text,
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

        {/* Pagination / Slide indicator (01 — 02 03) */}
        <div
          className="banner-hero-pagination-row"
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '0 clamp(24px, 4vw, 44px) 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '13px',
            fontWeight: 700,
            color: theme.textMuted || '#64748b',
          }}
        >
          {[0, 1, 2].map((idx) => {
            const isActive = (currentIndex % 3) === idx;
            const formattedNum = String(idx + 1).padStart(2, '0');
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 2px',
                  color: isActive ? theme.text : theme.textMuted || '#94a3b8',
                  fontWeight: isActive ? 800 : 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                aria-label={`Slayd ${idx + 1}`}
              >
                <span>{formattedNum}</span>
                {isActive && (
                  <span
                    style={{
                      width: '24px',
                      height: '2px',
                      backgroundColor: '#e31e24',
                      display: 'inline-block',
                      borderRadius: '2px',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

