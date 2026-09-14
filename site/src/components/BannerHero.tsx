import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  ShieldCheck,
  Sparkles,
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
    <div className="banner-hero-wrapper">
      <div
        className="banner-hero-card"
        style={{
          backgroundColor: theme.mode === 'dark' ? '#0d1117' : '#f8f9fa',
          borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
          borderRadius: '24px',
          boxShadow:
            theme.mode === 'dark'
              ? '0 12px 36px -4px rgba(0, 0, 0, 0.5)'
              : '0 8px 24px -4px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div className="banner-hero-grid">
          {/* Left Column: Typography, Actions & Dynamic Tech Spotlight */}
          <div className="banner-hero-col-left">
            <div className="banner-hero-text-block">
              <h1
                className="banner-hero-title"
                style={{
                  color: theme.text,
                  fontFamily: 'Outfit, -apple-system, sans-serif',
                  fontWeight: 900,
                  lineHeight: 1.15,
                  fontSize: 'clamp(1.9rem, 3.6vw, 3.1rem)',
                  letterSpacing: '-0.02em',
                  margin: '0 0 14px 0',
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
                  fontSize: 'clamp(0.88rem, 1.1vw, 1rem)',
                  lineHeight: 1.5,
                  margin: '0 0 20px 0',
                  maxWidth: '440px',
                }}
              >
                Seçilmiş brendlər, rəsmi zəmanət, etibarlı seçim – Sahara Electronics-də.
              </p>

              <div className="banner-hero-actions-row" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => (onNavigateCatalog ? onNavigateCatalog() : null)}
                  className="hero-primary-btn"
                  style={{
                    backgroundColor: '#e31e24',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '11px 22px',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(227, 30, 36, 0.35)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  <span>Məhsullara bax</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* Dynamic Interactive Auto-Rotating Technology Carousel Bar when articles provided */}
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
                  backgroundColor: theme.mode === 'dark' ? 'rgba(227, 30, 36, 0.08)' : '#fef2f2',
                  border: `1px solid ${theme.mode === 'dark' ? 'rgba(227, 30, 36, 0.2)' : '#fee2e2'}`,
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginTop: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: theme.mode === 'dark' ? '#2e0e0e' : '#fee2e2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getArticleIcon(currentArticle.icon, '#e31e24', 16)}
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

            {/* Pagination / Slide indicator (01 — 02 03) */}
            <div
              className="banner-hero-pagination-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: 'auto',
                paddingTop: '16px',
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
                          width: '18px',
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

          {/* Right Column: TV Living Room Media Stage */}
          <div className="banner-hero-col-right">
            <div
              className="banner-hero-showcase-stage"
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '340px',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.mode === 'dark' ? '#090d13' : '#f1f5f9',
              }}
            >
              <img
                src="/media/hero-livingroom.jpg"
                alt="Sahara Electronics Müasir Qonaq Otağı və Ağıllı TV"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                }}
              />

              {/* Top-Right Calligraphy Script Badge: "Daha çox imkan, sənə yaxın!" */}
              <div
                className="banner-hero-script-tag"
                style={{
                  position: 'absolute',
                  top: '18px',
                  right: '20px',
                  textAlign: 'right',
                  fontFamily: "'Playfair Display', 'Georgia', cursive, serif",
                  fontStyle: 'italic',
                  color: '#ffffff',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.75), 0 1px 3px rgba(0, 0, 0, 0.9)',
                  pointerEvents: 'none',
                  lineHeight: 1.2,
                  zIndex: 2,
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 600 }}>Daha çox imkan,</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#fca5a5' }}>sənə yaxın!</div>
              </div>

              {/* Ambient Edge Glow */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    theme.mode === 'dark'
                      ? 'linear-gradient(to right, rgba(13, 17, 23, 0.75) 0%, transparent 40%, rgba(0,0,0,0.4) 100%)'
                      : 'linear-gradient(to right, rgba(248, 249, 250, 0.6) 0%, transparent 35%)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
