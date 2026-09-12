import React from 'react';
import { Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import {
  Brand,
  CatalogCategory,
  Product,
  TechnologyArticle,
  CatalogSettings,
  BrandRailData,
} from '../types/product';
import { ThemeColors } from '../types/theme';
import { BrandShowcase } from '../components/BrandShowcase';
import { BannerHero } from '../components/BannerHero';
import { AnimatedBrandRail } from '../components/AnimatedBrandRail';
import { AnimatedBrandRailSkeleton } from '../components/AnimatedBrandRailSkeleton';
import { VisualCategoryCards } from '../components/VisualCategoryCards';
import { ThematicShowcase } from '../components/ThematicShowcase';
import { TrustHighlights } from '../components/TrustHighlights';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/Button';
import { featureFlags } from '../utils/featureFlags';

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

export const HomePage: React.FC<HomePageProps> = ({
  brands,
  categories,
  products,
  articles,
  settings,
  brandRail,
  isLoadingRail,
  theme,
  onNavigate,
  onSelectProduct,
  onOpenSaharaMatch,
  onOpenArticle,
  onWhatsApp,
  onCall,
  onShare,
  onCopyLink,
}) => {
  const publishedProducts = products.filter((p) => p.status === 'published');
  const featuredProducts = publishedProducts
    .filter((p) => p.isFeatured || p.status === 'published')
    .slice(0, 8);

  return (
    <div
      className="home-page-container"
      style={{ display: 'flex', flexDirection: 'column', gap: '36px', paddingBottom: '40px' }}
    >
      {/* 4. Multi-Brand Neutral Hero Banner */}
      <BannerHero
        theme={theme}
        articles={articles}
        heroTitle={settings?.heroBannerTitle}
        heroSubtitle={settings?.heroBannerSubtitle}
        onOpenArticle={onOpenArticle}
        onNavigateCatalog={() => onNavigate('catalog')}
        onNavigateContact={() => onNavigate('support')}
      />

      {/* 4.5. Animated Brand Rail */}
      {isLoadingRail ||
      (typeof window !== 'undefined' &&
        (new URLSearchParams(window.location.search).get('skeleton') === 'true' ||
          (window as any).__FORCE_SKELETON__)) ? (
        <AnimatedBrandRailSkeleton theme={theme} cardCount={10} />
      ) : (
        <AnimatedBrandRail
          data={brandRail}
          theme={theme}
          onNavigateBrand={(slug) => onNavigate('brand', slug)}
        />
      )}

      {/* 5. Visual Category Cards Carousel / Grid */}
      <VisualCategoryCards
        categories={categories}
        products={products}
        theme={theme}
        onSelectCategory={(catId) => onNavigate('catalog', catId)}
        onViewAll={() => onNavigate('catalog')}
      />

      {/* 6. Curated Thematic Showcase Trio (Fail-closed: completely hidden if no verified CMS items) */}
      <ThematicShowcase
        categories={categories}
        theme={theme}
        onNavigateCategory={(catId) => onNavigate('catalog', catId)}
      />

      {/* 7. Brand Registry Showcase Dock */}
      <BrandShowcase
        brands={brands}
        products={products}
        theme={theme}
        onSelect={(brandId) => onNavigate('catalog', brandId)}
      />

      {/* Interactive Sahara Match Banner (Feature Flagged) */}
      {featureFlags.isEnabled('enableSaharaMatch') && (
        <section className="catalog-container" aria-label="Ağıllı Seçim">
          <div
            style={{
              background:
                theme.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)'
                  : 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)',
              border: `1.5px solid ${theme.mode === 'dark' ? 'rgba(220, 38, 38, 0.4)' : '#fecdd3'}`,
              borderRadius: '20px',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 10px 28px -4px rgba(220, 38, 38, 0.08)',
            }}
          >
            <div style={{ maxWidth: '580px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(220, 38, 38, 0.12)',
                  color: '#dc2626',
                  fontSize: '11px',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                <Sparkles size={13} />
                <span>Ağıllı Məhsul Seçimi</span>
              </div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: theme.text,
                  marginBottom: '6px',
                }}
              >
                Məkanınıza və ailənizə ən uyğun modeli tapa bilmirsiniz?
              </h2>
              <p style={{ fontSize: '13px', color: theme.textMuted, margin: 0, lineHeight: 1.4 }}>
                Sahara Match ilə cəmi 3 sadə suala cavab verin, ehtiyaclarınıza cavab verən
                modelləri dərhal tövsiyə edək.
              </p>
            </div>

            <Button
              size="md"
              variant="primary"
              onClick={onOpenSaharaMatch}
              rightIcon={<ArrowRight size={15} />}
            >
              Seçimə Başla
            </Button>
          </div>
        </section>
      )}

      {/* 8. Featured Products Showcase Grid */}
      <section className="catalog-container" aria-label="Seçilmiş Modellər">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
                fontWeight: 800,
                color: theme.text,
                margin: 0,
              }}
            >
              Seçilmiş Modellər
            </h2>
            <p style={{ fontSize: '13px', color: theme.textMuted, margin: '3px 0 0 0' }}>
              Təsdiqlənmiş kataloq modelləri və texniki parametrlər
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
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
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            <span>Kataloqa keç</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="home-featured-grid">
          {featuredProducts.map((product) => {
            const brand = brands.find((b) => b.id === product.brandId);
            return (
              <ProductCard
                key={product.id}
                product={product}
                brandName={brand?.name}
                brandOrigin={brand?.originCountry ? `${brand.originCountry} brendi` : ''}
                whatsappButtonText={settings?.whatsappButtonText}
                callButtonText={settings?.callButtonText}
                shareButtonText={settings?.shareButtonText}
                theme={theme}
                onSelect={onSelectProduct}
                onShare={onShare}
                onWhatsApp={onWhatsApp}
                onCall={onCall}
                onCopyLink={onCopyLink}
              />
            );
          })}
        </div>
      </section>

      {/* 10. Verified Services & Trust Highlights (Fail-closed: completely hidden if no verified items) */}
      <TrustHighlights theme={theme} />
    </div>
  );
};
