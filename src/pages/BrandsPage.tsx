import React from 'react';
import { Brand, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ArrowRight, ShieldCheck, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface BrandsPageProps {
  brands: Brand[];
  products: Product[];
  theme: ThemeColors;
  onNavigate: (route: string, param?: string) => void;
}

export const BrandsPage: React.FC<BrandsPageProps> = ({
  brands,
  products,
  theme,
  onNavigate,
}) => {
  return (
    <div className="catalog-container" style={{ padding: '24px 16px 48px' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center', maxWidth: '640px', margin: '0 auto 32px' }}>
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
          <span>Rəsmi Partnyorlar</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: theme.text, marginBottom: '8px' }}>
          Rəsmi Elektronika və Məişət Texnikası Brendləri
        </h1>
        <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>
          Sahara Electronics beynəlxalq standartlara cavab verən, sertifikatlaşdırılmış və zəmanətli dünya brendlərinin rəsmi təmsilçisidir.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {brands.map((brand) => {
          const brandProducts = products.filter((p) => p.brandId === brand.id);
          const publishedCount = brandProducts.filter((p) => p.status === 'published').length;

          return (
            <div
              key={brand.id}
              style={{
                backgroundColor: theme.bgCard,
                border: `1.5px solid ${theme.border}`,
                borderRadius: '20px',
                padding: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '24px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '16px',
                    backgroundColor: theme.mode === 'dark' ? '#0f172a' : '#f8fafc',
                    border: `1px solid ${theme.border}`,
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={brand.logo || '/media/placeholder.png'}
                    alt={brand.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                <div style={{ maxWidth: '480px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: 0 }}>
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

                  <p style={{ fontSize: '13px', color: theme.textMuted, margin: '0 0 10px 0', lineHeight: 1.5 }}>
                    {brand.description || `${brand.name} məişət texnikası və elektronika məhsulları.`}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: theme.text }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={15} style={{ color: '#16a34a' }} />
                      <span>{publishedCount > 0 ? `${publishedCount} Təsdiqlənmiş Model` : 'Modellər tezliklə'}</span>
                    </div>
                    {brand.manufacturingCountries && brand.manufacturingCountries.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.textMuted }}>
                        <Globe size={14} />
                        <span>İstehsal: {brand.manufacturingCountries.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant={brand.comingSoon ? 'outline' : 'primary'}
                size="md"
                disabled={brand.comingSoon || publishedCount === 0}
                onClick={() => onNavigate('catalog', brand.id)}
                rightIcon={<ArrowRight size={15} />}
              >
                {brand.comingSoon ? 'Tezliklə Xidmətinizdə' : `${brand.name} Modellərinə Bax`}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
