import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Flame, ShieldCheck, Sparkles, Wind, Zap } from 'lucide-react';
import { Brand, TechnologyArticle } from '../types/product';
import { ThemeColors } from '../types/theme';

interface BannerHeroProps {
  theme: ThemeColors;
  brands?: Brand[];
  articles?: TechnologyArticle[];
  heroTitle?: string;
  heroSubtitle?: string;
  onOpenArticle: (article?: TechnologyArticle) => void;
  onSelectBrand?: (brandId: string) => void;
}

interface HeroSlide {
  id: string;
  brandId?: string;
  badge1: string;
  badge2: string;
  title: string;
  subtitle: string;
  ctaText: string;
  flag?: string;
  logo?: string;
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
  brands = [],
  articles = [],
  heroTitle,
  heroSubtitle,
  onOpenArticle,
  onSelectBrand,
}) => {
  // 1. Build Dynamic Multi-Brand Slides
  const heroSlides: HeroSlide[] = useMemo(() => {
    const slides: HeroSlide[] = [];

    const ardoBrand = brands.find((b) => b.id === 'ardo');
    const lotusBrand = brands.find((b) => b.id === 'lotus');

    // Slide 1: ARDO
    slides.push({
      id: 'slide-ardo',
      brandId: 'ardo',
      flag: '🇮🇹',
      badge1: ardoBrand?.originCountry ? `🇮🇹 ${ardoBrand.originCountry} brendi` : '🇮🇹 İtalyan brendi',
      badge2: '✨ Rəsmi Zəmanətli Satış',
      title: heroTitle || 'Premium İtalyan ARDO & Məişət Texnikası',
      subtitle: heroSubtitle || 'Eleqant italyan dizaynı, yüksək enerji səmərəliliyi və 3 ilə qədər rəsmi zəmanət.',
      ctaText: 'ARDO Modellərinə Bax',
      logo: ardoBrand?.logo || '/media/brands/ardo-logo.png',
    });

    // Slide 2: LOTUS
    if (lotusBrand && lotusBrand.active !== false) {
      slides.push({
        id: 'slide-lotus',
        brandId: 'lotus',
        flag: '🇹🇷',
        badge1: lotusBrand.originCountry ? `🇹🇷 ${lotusBrand.originCountry} brendi` : '🇹🇷 Türkiyə brendi',
        badge2: '🪷 190+ Model Çeşidi',
        title: 'Müasir Lotus Məişət Texnikası & Elektronika',
        subtitle: 'Fritöz, bişirmə paneli, soba, televizor, paltaryuyan və soyuducu modelləri ilə evinizə rahatlıq.',
        ctaText: 'Lotus Məhsullarına Bax',
        logo: lotusBrand.logo || '/media/brands/lotus-mark.svg',
      });
    }

    // Slide 3: Ümumi Sahara Electronics
    slides.push({
      id: 'slide-all',
      brandId: 'all',
      flag: '🌟',
      badge1: '🌟 Rəsmi Məhsul Kataloqu',
      badge2: '🛡️ Peşəkar Xidmət & Zəmanət',
      title: 'Sahara Electronics — ARDO, Lotus & Premium Texnika',
      subtitle: 'Məişət texnikasında keyfiyyət, etibarlı servis və geniş seçim imkanı bir ünvanda.',
      ctaText: 'Bütün Məhsulları Kəşf Et',
    });

    return slides;
  }, [brands, heroTitle, heroSubtitle]);

  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);

  // Auto-rotate hero slides every 5.5 seconds
  useEffect(() => {
    if (heroSlides.length <= 1 || isSlidePaused) return;
    const timer = setInterval(() => {
      setCurrentSlideIdx((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [heroSlides.length, isSlidePaused]);

  const currentSlide = heroSlides[currentSlideIdx] || heroSlides[0];

  // 2. Technology Articles Carousel
  const activeArticles = articles.filter((a) => a.active !== false);
  const [currentArticleIdx, setCurrentArticleIdx] = useState(0);
  const [isArticlePaused, setIsArticlePaused] = useState(false);

  useEffect(() => {
    if (activeArticles.length <= 1 || isArticlePaused) return;
    const timer = setInterval(() => {
      setCurrentArticleIdx((prev) => (prev + 1) % activeArticles.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeArticles.length, isArticlePaused]);

  const currentArticle = activeArticles[currentArticleIdx] || activeArticles[0];

  const handleSlideClick = () => {
    if (currentSlide.brandId && onSelectBrand) {
      onSelectBrand(currentSlide.brandId);
    }
  };

  return (
    <div style={{ padding: '16px 20px 8px 20px', width: '100%', boxSizing: 'border-box' }}>
      <div
        onMouseEnter={() => setIsSlidePaused(true)}
        onMouseLeave={() => setIsSlidePaused(false)}
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
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Top Slide Switcher Tabs & Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
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
                transition: 'all 0.3s ease',
              }}
            >
              {currentSlide.badge1}
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
                transition: 'all 0.3s ease',
              }}
            >
              <Sparkles size={13} color={theme.primary} />
              <span>{currentSlide.badge2}</span>
            </span>
          </div>

          {/* Slide Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {heroSlides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentSlideIdx(idx)}
                style={{
                  padding: '4px 9px',
                  borderRadius: '14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: `1px solid ${idx === currentSlideIdx ? theme.primary : theme.border}`,
                  backgroundColor: idx === currentSlideIdx ? `${theme.primary}18` : theme.bgSecondary,
                  color: idx === currentSlideIdx ? theme.primary : theme.textMuted,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{slide.flag}</span>
                <span>{slide.brandId === 'ardo' ? 'ARDO' : slide.brandId === 'lotus' ? 'LOTUS' : 'Hamısı'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hero Title & Dynamic Content */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <h2
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: 'clamp(18px, 4vw, 26px)',
                fontWeight: 800,
                color: theme.text,
                margin: '0 0 6px 0',
                lineHeight: 1.25,
                transition: 'all 0.3s ease',
              }}
            >
              {currentSlide.title}
            </h2>
            <p
              style={{
                fontSize: 'clamp(12px, 3vw, 14px)',
                color: theme.textSecondary,
                margin: 0,
                lineHeight: '22px',
                transition: 'all 0.3s ease',
              }}
            >
              {currentSlide.subtitle}
            </p>
          </div>

          {onSelectBrand && (
            <button
              type="button"
              onClick={handleSlideClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: theme.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${theme.primary}40`,
                transition: 'transform 0.2s ease, opacity 0.2s ease',
                flexShrink: 0,
              }}
            >
              <span>{currentSlide.ctaText}</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>

        {/* Dynamic Interactive Technology Carousel Bar */}
        {currentArticle && (
          <div
            onMouseEnter={() => setIsArticlePaused(true)}
            onMouseLeave={() => setIsArticlePaused(false)}
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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentArticleIdx((prev) => (prev - 1 + activeArticles.length) % activeArticles.length);
                  }}
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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentArticleIdx((prev) => (prev + 1) % activeArticles.length);
                  }}
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
      </div>
    </div>
  );
};
