import React, { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  Brand,
  CatalogCategory,
  Product,
  TechnologyArticle,
  CatalogSettings,
  BrandRailData,
} from '../types/product';
import { ThemeColors } from '../types/theme';
import { BannerHero } from '../components/BannerHero';
import { AnimatedBrandRail } from '../components/AnimatedBrandRail';
import { AnimatedBrandRailSkeleton } from '../components/AnimatedBrandRailSkeleton';
import { VisualCategoryCards } from '../components/VisualCategoryCards';
import { ThematicShowcase } from '../components/ThematicShowcase';
import { FeaturedProductCard } from '../components/FeaturedProductCard';
import { SpecialDiscountBanner } from '../components/SpecialDiscountBanner';
import { TrustHighlights } from '../components/TrustHighlights';

interface HomePageProps {
  brands: Brand[];
  categories: CatalogCategory[];
  products: Product[];
  articles: TechnologyArticle[];
  settings?: CatalogSettings;
  brandRail?: BrandRailData;
  isLoadingRail?: boolean;
  theme: ThemeColors;
  onNavigate: (route: string, param?: string) => void;
  onSelectProduct: (product: Product) => void;
  onOpenSaharaMatch: () => void;
  onOpenArticle: (article?: TechnologyArticle | null) => void;
  onWhatsApp: (product: Product) => void;
  onCall: (product: Product) => void;
  onShare: (product: Product) => void;
  onCopyLink: (product: Product) => void;
}

const FEATURED_TABS = [
  { id: 'all', name: 'Hamısı' },
  { id: 'tv', name: 'Televizor' },
  { id: 'notebook', name: 'Notebook' },
  { id: 'tablet', name: 'Planşet' },
  { id: 'washer', name: 'Paltaryuyan' },
  { id: 'refrigerator', name: 'Soyuducu' },
  { id: 'air_conditioner', name: 'Kondisioner' },
];

export const HomePage: React.FC<HomePageProps> = ({
  brands: _brands,
  categories,
  products,
  articles,
  settings,
  brandRail,
  isLoadingRail,
  theme,
  onNavigate,
  onSelectProduct,
  onOpenSaharaMatch: _onOpenSaharaMatch,
  onOpenArticle,
  onWhatsApp: _onWhatsApp,
  onCall: _onCall,
  onShare: _onShare,
  onCopyLink: _onCopyLink,
}) => {
  const [selectedTab, setSelectedTab] = useState('all');

  const publishedProducts = useMemo(() => {
    return products.filter((p) => p.status === 'published');
  }, [products]);

  const filteredFeaturedProducts = useMemo(() => {
    if (selectedTab === 'all') {
      return publishedProducts.slice(0, 12);
    }
    const filtered = publishedProducts.filter((p) => {
      const pCat = (p.category || '').toLowerCase();
      const pTitle = (p.title || '').toLowerCase();
      if (selectedTab === 'tv') return pCat.includes('tv') || pTitle.includes('tv') || pTitle.includes('televizor');
      if (selectedTab === 'notebook') return pCat.includes('laptop') || pCat.includes('notebook') || pTitle.includes('notebook');
      if (selectedTab === 'tablet') return pCat.includes('tablet') || pCat.includes('planşet');
      if (selectedTab === 'washer') return pCat.includes('washer') || pCat.includes('paltaryuyan');
      if (selectedTab === 'refrigerator') return pCat.includes('fridge') || pCat.includes('refrigerator') || pCat.includes('soyuducu');
      if (selectedTab === 'air_conditioner') return pCat.includes('conditioner') || pCat.includes('kondisioner');
      return pCat === selectedTab;
    });
    return filtered.length > 0 ? filtered.slice(0, 12) : publishedProducts.slice(0, 6);
  }, [publishedProducts, selectedTab]);

  return (
    <div
      className="home-page-container"
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '48px' }}
    >
      {/* 1. Hero Banner */}
      <BannerHero
        theme={theme}
        articles={articles}
        heroTitle={settings?.heroBannerTitle}
        heroSubtitle={settings?.heroBannerSubtitle}
        onOpenArticle={onOpenArticle}
        onNavigateCatalog={() => onNavigate('catalog')}
        onNavigateContact={() => onNavigate('support')}
      />

      {/* 2. Visual Category Cards */}
      <VisualCategoryCards
        categories={categories}
        products={products}
        theme={theme}
        onSelectCategory={(catId) => onNavigate('catalog', catId)}
        onViewAll={() => onNavigate('catalog')}
      />

      {/* 3. Brand Logos Carousel / Marquee Rail */}
      {isLoadingRail ||
      (typeof window !== 'undefined' &&
        (new URLSearchParams(window.location.search).get('skeleton') === 'true' ||
          (window as any).__FORCE_SKELETON__)) ? (
        <AnimatedBrandRailSkeleton theme={theme} cardCount={10} />
      ) : (
        <AnimatedBrandRail
          data={brandRail}
          theme={theme}
          onNavigateBrand={(slug) => onNavigate(slug ? 'brand' : 'brands', slug)}
        />
      )}

      {/* 4. Featured Products Section ("Seçilmiş məhsullar") */}
      <section className="catalog-container featured-products-section" aria-label="Seçilmiş Məhsullar">
        {/* Section Header with inline Category Filter Tabs */}
        <div
          className="featured-section-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <h2
              style={{
                fontSize: 'clamp(1.25rem, 2.2vw, 1.5rem)',
                fontWeight: 900,
                color: theme.text,
                margin: 0,
                fontFamily: 'Outfit, -apple-system, sans-serif',
                letterSpacing: '-0.02em',
              }}
            >
              Seçilmiş məhsullar
            </h2>

            {/* Horizontal Filter Tabs */}
            <div
              className="featured-filter-tabs hide-on-mobile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
              }}
            >
              {FEATURED_TABS.map((tab) => {
                const isActive = selectedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedTab(tab.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: isActive ? 800 : 500,
                      color: isActive ? '#e31e24' : theme.textMuted || '#64748b',
                      cursor: 'pointer',
                      borderBottom: isActive ? '2px solid #e31e24' : '2px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#e31e24',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 6px',
            }}
          >
            <span>Hamısına bax</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Responsive Product Grid */}
        <div
          className="featured-products-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(339px, 1fr))',
            gap: '24px',
            justifyItems: 'center',
          }}
        >
          {filteredFeaturedProducts.map((product) => (
            <FeaturedProductCard
              key={product.id}
              product={product}
              theme={theme}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      </section>

      {/* 6. Special Discount Promo Banner ("Xüsusi endirimlər sizi gözləyir!") */}
      <SpecialDiscountBanner
        theme={theme}
        onNavigateDiscounts={() => onNavigate('catalog', 'discounts')}
      />

      {/* 7. Trust Highlights / USP Bar */}
      <TrustHighlights theme={theme} />
    </div>
  );
};
