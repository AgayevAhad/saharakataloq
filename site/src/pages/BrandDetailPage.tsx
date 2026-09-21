import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, Boxes, Factory, Globe2 } from 'lucide-react';
import { Brand, CatalogCategory, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from '../components/ShimmerImage';

interface BrandDetailPageProps {
  brand: Brand;
  products: Product[];
  categories: CatalogCategory[];
  theme: ThemeColors;
  onNavigate: (route: string, param?: string) => void;
}

export const BrandDetailPage: React.FC<BrandDetailPageProps> = ({
  brand,
  products = [],
  categories = [],
  theme,
  onNavigate,
}) => {
  const publishedProducts = useMemo(
    () =>
      (products || []).filter(
        (product) => product.brandId === brand.id && product.status !== 'draft'
      ),
    [brand.id, products]
  );
  const categoryRows = useMemo(
    () =>
      (categories || [])
        .map((category) => ({
          category,
          count: publishedProducts.filter((product) => product.category === category.id).length,
        }))
        .filter((row) => row.count > 0),
    [categories, publishedProducts]
  );

  return (
    <main
      className="brand-detail-page catalog-container"
      style={{ padding: '24px clamp(16px, 4vw, 56px) 80px' }}
    >
      <button
        type="button"
        onClick={() => onNavigate('brands')}
        style={{
          border: 0,
          padding: 0,
          background: 'transparent',
          color: theme.text,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 800,
          cursor: 'pointer',
          marginBottom: '24px',
        }}
      >
        <ArrowLeft size={16} /> Brendlərə qayıt
      </button>
      <section
        className="brand-detail-hero scroll-reveal-item"
        style={{
          padding: 'clamp(22px, 5vw, 52px)',
          borderRadius: '28px',
          border: `1px solid ${theme.border}`,
          background: theme.bgCard,
          display: 'grid',
          gridTemplateColumns: 'minmax(180px, 300px) 1fr',
          gap: 'clamp(24px, 5vw, 60px)',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            height: '190px',
            padding: '32px',
            borderRadius: '22px',
            border: `1px solid ${theme.border}`,
            background: '#ffffff',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {brand.logo ? (
            <ShimmerImage
              src={brand.logo}
              alt={`${brand.name} loqosu`}
              objectFit="contain"
              containerStyle={{ width: '100%', height: '100%' }}
            />
          ) : (
            <span className="brand-logo-text-fallback">{brand.name}</span>
          )}
        </div>
        <div>
          <p
            style={{
              margin: '0 0 8px',
              color: '#e31e24',
              fontSize: '12px',
              fontWeight: 850,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
            }}
          >
            Brend profili
          </p>
          <h1
            style={{
              margin: '0 0 12px',
              color: theme.text,
              fontSize: 'clamp(34px, 6vw, 62px)',
              lineHeight: 1,
              fontWeight: 900,
            }}
          >
            {brand.name}
          </h1>
          {brand.description ? (
            <p style={{ color: theme.textMuted, lineHeight: 1.7, maxWidth: '700px' }}>
              {brand.description}
            </p>
          ) : (
            <p style={{ color: theme.textMuted }}>
              Bu brend üçün təqdimat mətni əlavə edilməyib. Aşağıdakı məlumatlar aktiv kataloq
              qeydlərindən hesablanır.
            </p>
          )}
          <div
            className="brand-fact-row"
            style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}
          >
            {brand.originCountry && (
              <span>
                <Globe2 size={15} /> Mənşə: {brand.originCountry}
              </span>
            )}
            {brand.manufacturingCountries?.length > 0 && (
              <span>
                <Factory size={15} /> İstehsal: {brand.manufacturingCountries.join(', ')}
              </span>
            )}
            <span>
              <Boxes size={15} /> {publishedProducts.length} model
            </span>
          </div>
        </div>
      </section>

      <section className="scroll-reveal-item" style={{ marginTop: '28px' }}>
        <h2 style={{ color: theme.text, fontSize: '24px', marginBottom: '14px' }}>
          Kataloq bölgüsü
        </h2>
        {categoryRows.length ? (
          <div
            className="brand-category-summary"
            style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
          >
            {categoryRows.map(({ category, count }) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onNavigate('catalog', brand.id)}
                style={{
                  border: `1px solid ${theme.border}`,
                  background: theme.bgCard,
                  color: theme.text,
                  borderRadius: '999px',
                  padding: '9px 14px',
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                {category.name} · {count}
              </button>
            ))}
          </div>
        ) : (
          <p style={{ color: theme.textMuted }}>Bu brend üzrə dərc edilmiş model yoxdur.</p>
        )}
      </section>

      {publishedProducts.length > 0 && (
        <section style={{ marginTop: '34px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'end',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <h2 style={{ color: theme.text, fontSize: '24px', margin: 0 }}>
              Dərc edilmiş modellər
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('catalog', brand.id)}
              style={{
                border: 0,
                background: 'transparent',
                color: '#e31e24',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Hamısına bax <ArrowRight size={14} />
            </button>
          </div>
          <div className="brand-products-grid">
            {publishedProducts.slice(0, 8).map((product) => (
              <button
                key={product.id}
                type="button"
                className="brand-product-mini-card scroll-reveal-item"
                onClick={() => onNavigate('product', product.id)}
                style={{
                  border: `1px solid ${theme.border}`,
                  background: theme.bgCard,
                  color: theme.text,
                  borderRadius: '18px',
                  padding: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <ShimmerImage
                  src={product.image}
                  alt={product.title}
                  containerStyle={{ width: '100%', height: '180px', borderRadius: '12px' }}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <strong style={{ display: 'block', marginTop: '12px' }}>{product.title}</strong>
                {product.price ? (
                  <span
                    style={{
                      display: 'block',
                      marginTop: '6px',
                      color: '#e31e24',
                      fontWeight: 850,
                    }}
                  >
                    {product.price} ₼
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
