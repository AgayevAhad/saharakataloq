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

  useEffect(() => {
    if (activeArticles.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeArticles.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeArticles.length, isPaused]);

  const currentArticle = activeArticles[currentIndex] || activeArticles[0];

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeArticles.length) % activeArticles.length);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeArticles.length);
  };

  return (
    <div style={{ padding: '16px 20px 8px 20px', width: '100%', boxSizing: 'border-box' }}>
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          backgroundColor: theme.bgCard,
          borderColor: theme.border,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderRadius: '16px',
          padding: 'clamp(16px, 3vw, 24px)',
          boxShadow: theme.mode === 'dark' ? '0 10px 30px rgba(0, 0, 0, 0.4)' : '0 6px 20px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Top Badges & Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                backgroundColor: theme.primary,
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 750,
                padding: '4px 10px',
                borderRadius: '6px',
                letterSpacing: '0.3px',
              }}
            >
              🇮🇹 İtalyan brendi
            </span>
            <span
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.badgeText,
                border: `1px solid ${theme.primaryLight}`,
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={13} color={theme.primary} />
              <span>Rəsmi Zəmanətli Satış</span>
            </span>
          </div>

          {activeArticles.length > 1 && (
            <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 600 }}>
              Texnologiya bələdçisi ({currentIndex + 1}/{activeArticles.length})
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h2
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 'clamp(18px, 4vw, 26px)',
              fontWeight: 800,
              color: theme.text,
              margin: '0 0 6px 0',
              lineHeight: 1.25,
            }}
          >
            {heroTitle ? (
              <span>{heroTitle}</span>
            ) : (
              <>Eviniz üçün seçilmiş <span style={{ color: theme.primary }}>məişət texnikası</span></>
            )}
          </h2>
          <p
            style={{
              fontSize: 'clamp(12px, 3vw, 14px)',
              color: theme.textSecondary,
              margin: 0,
              lineHeight: '22px',
            }}
          >
            {heroSubtitle || 'Sahara Electronics — İtalyan ARDO məhsullarının və innovativ texnologiyaların rəsmi kataloqu.'}
          </p>
        </div>

        {/* Dynamic Interactive Technology Carousel Bar */}
        {currentArticle && (
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onClick={() => onOpenArticle(currentArticle)}
            style={{
              backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              transition: 'transform 0.2s ease, background-color 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: theme.mode === 'dark' ? '#2e0e0e' : '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getArticleIcon(currentArticle.icon, theme.primary, 22)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                  <h3
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: 'clamp(13px, 3.5vw, 15px)',
                      fontWeight: 800,
                      color: theme.mode === 'dark' ? '#fecaca' : '#991b1b',
                      margin: 0,
                    }}
                  >
                    {currentArticle.title}
                  </h3>
                  {currentArticle.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: theme.primary,
                        color: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {currentArticle.badge}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: '12px',
                    color: theme.textSecondary,
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentArticle.subtitle}
                </p>
              </div>
            </div>

            {/* Right Action & Carousel Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {activeArticles.length > 1 && (
                <button
                  onClick={prevSlide}
                  title="Əvvəlki"
                  style={{
                    background: theme.bgCard,
                    border: `1px solid ${theme.border}`,
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: theme.primary,
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                <span>Ətraflı Bax</span>
                <ChevronRight size={14} />
              </div>

              {activeArticles.length > 1 && (
                <button
                  onClick={nextSlide}
                  title="Növbəti"
                  style={{
                    background: theme.bgCard,
                    border: `1px solid ${theme.border}`,
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Carousel Indicator Dots */}
        {activeArticles.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '-4px' }}>
            {activeArticles.map((art, idx) => (
              <button
                key={art.id}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: idx === currentIndex ? '22px' : '8px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: idx === currentIndex ? theme.primary : theme.border,
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                aria-label={`Slayd ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
