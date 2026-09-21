import React from 'react';
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
import { FeaturedProductsSection } from '../features/home/FeaturedProductsSection';
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
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  favoriteIds?: string[];
  comparisonIds?: string[];
  onToggleCompare?: (product: Product) => void;
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
  onOpenSaharaMatch: _onOpenSaharaMatch,
  onOpenArticle,
  onWhatsApp,
  onCall,
  onShare: _onShare,
  onCopyLink: _onCopyLink,
  onAddToCart,
  onToggleFavorite,
  favoriteIds = [],
  comparisonIds = [],
  onToggleCompare,
}) => {
  return (
    <div
      className="home-page-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        paddingTop: '6px',
        paddingBottom: '48px',
      }}
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

      {/* 2. Brand Logos Carousel / Marquee Rail */}
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

      {/* 3. Visual Category Cards */}
      <VisualCategoryCards
        categories={categories}
        products={products}
        theme={theme}
        onSelectCategory={(catId) => onNavigate('catalog', catId)}
        onViewAll={() => onNavigate('catalog')}
      />

      {/* 4. Featured products: responsive eight-row window with in-place expansion. */}
      <FeaturedProductsSection
        brands={brands}
        categories={categories}
        products={products}
        theme={theme}
        onNavigateCatalog={() => onNavigate('catalog')}
        onSelectProduct={onSelectProduct}
        onWhatsApp={onWhatsApp}
        onCall={onCall}
        onAddToCart={onAddToCart}
        onToggleFavorite={onToggleFavorite}
        favoriteIds={favoriteIds}
        comparisonIds={comparisonIds}
        onToggleCompare={onToggleCompare}
      />

      {/* 6. Special Discount Promo Banner ("Xüsusi endirimlər sizi gözləyir!") */}
      <SpecialDiscountBanner
        theme={theme}
        onNavigateDiscounts={() => onNavigate('catalog', 'discounts')}
      />

      {/* 7. Trust Highlights / USP Bar */}
      <TrustHighlights theme={theme} onNavigate={onNavigate} />
    </div>
  );
};
