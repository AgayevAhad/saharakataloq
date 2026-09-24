import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Truck, Wrench, Clock, CheckCircle2, Flame, Award, ChevronRight } from 'lucide-react';
import { Brand, CatalogCategory, Product, TechnologyArticle, CatalogSettings } from '../types/product';
import { ThemeColors } from '../types/theme';
import { BrandShowcase } from '../components/BrandShowcase';
import { BannerHero } from '../components/BannerHero';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/Button';

interface HomePageProps {
  brands: Brand[];
  categories: CatalogCategory[];
  products: Product[];
  articles: TechnologyArticle[];
  settings?: CatalogSettings;
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
  const featuredProducts = products.filter((p) => p.isFeatured || p.status === 'published').slice(0, 8);
  const newProducts = products.filter((p) => p.isNew || p.status === 'published').slice(0, 4);

  return (
    <div className="home-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '40px' }}>
      {/* 1. Official Brands Showcase Dock */}
      <BrandShowcase
        brands={brands}
        products={products}
        theme={theme}
        onSelect={(brandId) => onNavigate('brand_detail', brandId)}
      />

      {/* 2. Hero Technology & Multi-Brand Spotlight */}
      <BannerHero
        theme={theme}
        articles={articles}
        heroTitle={settings?.heroBannerTitle || 'Premium İtalyan ARDO & Məişət Texnikası'}
        heroSubtitle={settings?.heroBannerSubtitle || 'Eleqant dizayn, yüksək enerji səmərəliliyi və 3 ilə qədər rəsmi zəmanət'}
        onOpenArticle={onOpenArticle}
      />

      {/* 3. Sahara Match Interactive Assistant Banner */}
      <div className="catalog-container">
        <div
          style={{
            background: theme.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)'
              : 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)',
            border: `1.5px solid ${theme.mode === 'dark' ? 'rgba(220, 38, 38, 0.4)' : '#fecdd3'}`,
            borderRadius: '20px',
            padding: '28px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            boxShadow: '0 12px 32px -4px rgba(220, 38, 38, 0.1)',
          }}
        >
          <div style={{ maxWidth: '580px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor: 'rgba(220, 38, 38, 0.12)',
                color: '#dc2626',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '10px',
              }}
            >
              <Sparkles size={14} />
              <span>Ağıllı Məhsul Seçimi</span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, marginBottom: '8px' }}>
              Məkanınıza və ailənizə ən uyğun modeli tapa bilmirsiniz?
            </h2>
            <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>
              Sahara Match ilə cəmi 3 sadə suala cavab verin, ehtiyaclarınıza tam cavab verən rəsmi modelləri dərhal tövsiyə edək.
            </p>
          </div>

          <Button
            size="lg"
            variant="primary"
            onClick={onOpenSaharaMatch}
            rightIcon={<ArrowRight size={16} />}
          >
            Seçimə Başla
          </Button>
        </div>
      </div>

      {/* 4. Popular Electronic Categories Grid */}
      <div className="catalog-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: theme.text, margin: 0 }}>
              Populyar Kateqoriyalar
            </h2>
            <p style={{ fontSize: '13px', color: theme.textMuted, margin: '4px 0 0 0' }}>
              Zəmanətli məişət və mətbəx texnikası sahələri
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
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Hamısına bax</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '14px',
          }}
        >
          {categories.slice(0, 8).map((cat) => {
            const count = products.filter((p) => p.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onNavigate('catalog', cat.id)}
                style={{
                  backgroundColor: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '16px',
                  padding: '18px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: theme.text,
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(220, 38, 38, 0.08)',
                    color: theme.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Flame size={24} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{cat.name}</div>
                <div style={{ fontSize: '12px', color: theme.textMuted }}>{count} Model</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Featured Products Showcase */}
      <div className="catalog-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: theme.text, margin: 0 }}>
              Seçilmiş Modellər
            </h2>
            <p style={{ fontSize: '13px', color: theme.textMuted, margin: '4px 0 0 0' }}>
              Rəsmi distribütor zəmanəti ilə təsdiqlənmiş məhsullar
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
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
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
      </div>

      {/* 6. Sahara Care Ecosystem & Service Bar */}
      <div className="catalog-container">
        <div
          style={{
            backgroundColor: theme.mode === 'dark' ? '#0f172a' : '#f8fafc',
            border: `1px solid ${theme.border}`,
            borderRadius: '20px',
            padding: '32px 24px',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 28px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: theme.text, marginBottom: '6px' }}>
              Sahara Care — Zəmanət və Xidmət Ekosistemi
            </h2>
            <p style={{ fontSize: '13px', color: theme.textMuted, margin: 0 }}>
              Yalnız məhsul satmırıq; quraşdırma, rəsmi zəmanət və servis dəstəyini təmin edirik.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(22, 163, 74, 0.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: theme.text }}>3 İlə Qədər Zəmanət</h4>
                <p style={{ fontSize: '12px', color: theme.textMuted, margin: 0, lineHeight: 1.4 }}>Bütün ARDO, Lotus və Artel məhsullarına rəsmi istehsalçı zəmanəti.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Truck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: theme.text }}>Sürətli Çatdırılma</h4>
                <p style={{ fontSize: '12px', color: theme.textMuted, margin: 0, lineHeight: 1.4 }}>Bakı və bölgələrə zədəsiz və təhlükəsiz ünvana çatdırılma.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(234, 88, 12, 0.12)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Wrench size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: theme.text }}>Peşəkar Quraşdırma</h4>
                <p style={{ fontSize: '12px', color: theme.textMuted, margin: 0, lineHeight: 1.4 }}>Quraşdırılan soba, plitə və aspiratorların sertifikatlı ustalarla montajı.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(220, 38, 38, 0.12)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Award size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: theme.text }}>Orijinal Ehtiyat Hissələri</h4>
                <p style={{ fontSize: '12px', color: theme.textMuted, margin: 0, lineHeight: 1.4 }}>Rəsmi zavod detalları ilə zəmanətli təmir və servis xidməti.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
