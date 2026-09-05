import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, ShieldCheck, Sparkles, Wind, Zap } from 'lucide-react';
import { TechnologyArticle } from '../types/product';
import { ThemeColors } from '../types/theme';

interface BannerHeroProps {
  theme: ThemeColors;
  articles?: TechnologyArticle[];
  heroTitle?: string;
  heroSubtitle?: string;
  onOpenArticle: (article?: TechnologyArticle) => void;
}

const getArticleIcon = (iconName?: string, color?: string, size = 20) => {
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
  heroTitle,
  heroSubtitle,
  onOpenArticle,
}) => {
  const activeArticles = articles.filter((a) => a.active !== false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (activeArticles.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activeArticles.length);
        setAnimating(false);
      }, 200);
    }, 4200);
    return () => clearInterval(timer);
  }, [activeArticles.length, isPaused]);

  const currentArticle = activeArticles[currentIndex] || activeArticles[0];

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + activeArticles.length) % activeArticles.length);
      setAnimating(false);
    }, 150);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % activeArticles.length);
      setAnimating(false);
    }, 150);
  };

  return (
    <div className="banner-hero-wrapper">
      <div
        className="banner-hero-card"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.border,
          boxShadow: theme.mode === 'dark' ? '0 10px 30px rgba(0, 0, 0, 0.4)' : '0 6px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Top Badges & Tagline */}
        <div className="banner-hero-header-row">
          <div className="banner-hero-badges">
            <span
              className="banner-hero-brand-pill"
              style={{
                backgroundColor: theme.primary,
                color: '#ffffff',
              }}
            >
              🇮🇹 ARDO & 🇹🇷 LOTUS
            </span>
            <span
              className="banner-hero-guarantee-pill"
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.badgeText,
                borderColor: theme.primaryLight,
              }}
            >
              <Sparkles size={13} color={theme.primary} />
              <span>Rəsmi Zəmanətli Satış</span>
            </span>
          </div>

          {activeArticles.length > 1 && (
            <span className="banner-hero-counter" style={{ color: theme.textMuted }}>
              Texnologiya bələdçisi ({currentIndex + 1}/{activeArticles.length})
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div className="banner-hero-text-block">
          <h2 className="banner-hero-title" style={{ color: theme.text }}>
            {heroTitle ? (
              <span>{heroTitle}</span>
            ) : (
              <>Premium <span style={{ color: theme.primary }}>ARDO & LOTUS</span> Məişət Texnikası</>
            )}
          </h2>
          <p className="banner-hero-subtitle" style={{ color: theme.textSecondary }}>
            {heroSubtitle || 'Eleqant italyan dizaynı, müasir Lotus həlləri və 3 ilə qədər rəsmi zəmanətli orijinal məhsullar.'}
          </p>
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
              backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.09)' : '#fef2f2',
              borderColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.22)' : '#fee2e2',
            }}
          >
            <div className="tech-spotlight-main">
              <div
                className="tech-spotlight-icon-box"
                style={{
                  backgroundColor: theme.mode === 'dark' ? '#2e0e0e' : '#fee2e2',
                }}
              >
                {getArticleIcon(currentArticle.icon, theme.primary, 22)}
              </div>

              <div className="tech-spotlight-content">
                <div className="tech-spotlight-title-row">
                  <h3
                    className="tech-spotlight-title"
                    style={{
                      color: theme.mode === 'dark' ? '#fecaca' : '#991b1b',
                    }}
                  >
                    {currentArticle.title}
                  </h3>
                  {currentArticle.badge && (
                    <span
                      className="tech-spotlight-badge"
                      style={{
                        backgroundColor: theme.primary,
                        color: '#ffffff',
                      }}
                    >
                      {currentArticle.badge}
                    </span>
                  )}
                </div>
                <p className="tech-spotlight-desc" style={{ color: theme.textSecondary }}>
                  {currentArticle.subtitle}
                </p>
              </div>
            </div>

            {/* Actions & Carousel Controls */}
            <div className="tech-spotlight-actions" style={{ borderTopColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2' }}>
              <div className="tech-spotlight-nav-group">
                {activeArticles.length > 1 && (
                  <button
                    type="button"
                    className="tech-spotlight-nav-btn"
                    onClick={prevSlide}
                    title="Əvvəlki texnologiya"
                    aria-label="Əvvəlki texnologiya"
                    style={{
                      background: theme.bgCard,
                      borderColor: theme.border,
                      color: theme.text,
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}

                {activeArticles.length > 1 && (
                  <button
                    type="button"
                    className="tech-spotlight-nav-btn"
                    onClick={nextSlide}
                    title="Növbəti texnologiya"
                    aria-label="Növbəti texnologiya"
                    style={{
                      background: theme.bgCard,
                      borderColor: theme.border,
                      color: theme.text,
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>

              <div
                className="tech-spotlight-cta"
                style={{
                  backgroundColor: theme.primary,
                  color: '#ffffff',
                }}
              >
                <span>Ətraflı Bax</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        )}

        {/* Carousel Indicator Dots */}
        {activeArticles.length > 1 && (
          <div className="tech-spotlight-dots">
            {activeArticles.map((art, idx) => (
              <button
                key={art.id}
                type="button"
                className="tech-spotlight-dot"
                onClick={() => {
                  setAnimating(true);
                  setTimeout(() => {
                    setCurrentIndex(idx);
                    setAnimating(false);
                  }, 150);
                }}
                style={{
                  width: idx === currentIndex ? '22px' : '8px',
                  backgroundColor: idx === currentIndex ? theme.primary : theme.border,
                }}
                aria-label={`Slayd ${idx + 1}: ${art.title}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
