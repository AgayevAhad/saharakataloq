import React from 'react';
import { Brand, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ArrowRight, Boxes, Globe, Sparkles } from 'lucide-react';
import { ShimmerImage } from '../components/ShimmerImage';

interface BrandsPageProps {
  brands: Brand[];
  products: Product[];
  theme: ThemeColors;
  onNavigate: (route: string, param?: string) => void;
}

export const BrandsPage: React.FC<BrandsPageProps> = ({ brands, products, theme, onNavigate }) => {
  return (
    <div className="catalog-container" style={{ padding: '24px 16px 48px' }}>
      <div
        style={{
          marginBottom: '32px',
          textAlign: 'center',
          maxWidth: '640px',
          margin: '0 auto 32px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            backgroundColor: 'rgba(220, 38, 38, 0.12)',
            color: '#dc2626',
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '12px',
          }}
        >
          <Sparkles size={14} />
          <span>Kataloq Brendləri</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: theme.text, marginBottom: '8px' }}>
          Elektronika və Məişət Texnikası Brendləri
        </h1>
        <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>
          Aktiv kataloqda dərc edilmiş brendləri, modelləri və mövcud istehsal məlumatlarını
          nəzərdən keçirin.
        </p>
      </div>

      <div
        className="brands-card-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))',
          gap: '20px',
        }}
      >
        {brands
          .filter((brand) => brand.active)
          .map((brand) => {
            const brandProducts = products.filter((p) => p.brandId === brand.id);
            const publishedCount = brandProducts.filter((p) => p.status !== 'draft').length;

            return (
              <article
                key={brand.id}
                className="brand-directory-card scroll-reveal-item"
                style={{
                  backgroundColor: theme.bgCard,
                  border: `1.5px solid ${theme.border}`,
                  borderRadius: '20px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                  minHeight: '330px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                  <div
                    className="brand-card-logo-box"
                    style={{
                      width: '100%',
                      height: '150px',
                      borderRadius: '16px',
                      backgroundColor: '#ffffff',
                      border: `1px solid ${theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}`,
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow:
                        theme.mode === 'dark'
                          ? '0 4px 16px rgba(0,0,0,0.3)'
                          : '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                  >
                    {brand.logo ? (
                      <ShimmerImage
                        src={brand.logo}
                        alt={brand.name}
                        objectFit="contain"
                        containerStyle={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <span className="brand-logo-text-fallback">{brand.name}</span>
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '6px',
                      }}
                    >
                      <h2
                        style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: 0 }}
                      >
                        {brand.name}
                      </h2>
                      {brand.originCountry && (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(220, 38, 38, 0.1)',
                            color: theme.primary,
                          }}
                        >
                          {brand.originCountry} Mənşəli
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: '13px',
                        color: theme.textMuted,
                        margin: '0 0 10px 0',
                        lineHeight: 1.5,
                      }}
                    >
                      {brand.description || 'Brend haqqında əlavə təqdimat mətni daxil edilməyib.'}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '12px',
                        color: theme.text,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Boxes size={15} style={{ color: '#16a34a' }} />
                        <span>
                          {publishedCount > 0
                            ? `${publishedCount} dərc edilmiş model`
                            : 'Modellər tezliklə'}
                        </span>
                      </div>
                      {brand.manufacturingCountries && brand.manufacturingCountries.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: theme.textMuted,
                          }}
                        >
                          <Globe size={14} />
                          <span>İstehsal: {brand.manufacturingCountries.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('brand', brand.id)}
                  style={{
                    minHeight: '44px',
                    width: '100%',
                    border: 0,
                    borderRadius: '12px',
                    background: 'rgba(220, 38, 38, 0.10)',
                    color: '#dc2626',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.15s ease, transform 0.15s ease',
                  }}
                >
                  Brend haqqında <ArrowRight size={15} />
                </button>
              </article>
            );
          })}
      </div>
    </div>
  );
};
