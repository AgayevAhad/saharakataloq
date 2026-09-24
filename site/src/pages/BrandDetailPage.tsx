import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Boxes, Factory, Globe2 } from 'lucide-react';
import { Brand, CatalogCategory, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from '../components/ShimmerImage';
import { CategoryGlyph } from '../components/CategoryGlyph';
import { FeaturedProductCard } from '../components/FeaturedProductCard';

interface BrandDetailPageProps {
  brand: Brand;
  products: Product[];
  categories: CatalogCategory[];
  theme: ThemeColors;
  onNavigate: (route: string, param?: string) => void;
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  favoriteIds?: string[];
  comparisonIds?: string[];
  onToggleCompare?: (product: Product) => void;
  onWhatsApp?: (product: Product) => void;
  onCall?: (product: Product) => void;
}

export const BrandDetailPage: React.FC<BrandDetailPageProps> = ({
  brand,
  products = [],
  categories = [],
  theme,
  onNavigate,
  onSelectProduct,
  onAddToCart,
  onToggleFavorite,
  favoriteIds = [],
  comparisonIds = [],
  onToggleCompare,
  onWhatsApp,
  onCall,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(12);

  useEffect(() => {
    setSelectedCategory('all');
    setVisibleCount(12);
  }, [brand.id]);

  useEffect(() => {
    setVisibleCount(12);
  }, [selectedCategory]);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const comparisonIdSet = useMemo(() => new Set(comparisonIds), [comparisonIds]);
  const publishedProducts = useMemo(
    () =>
      (products || []).filter(
        (product) => product.brandId === brand.id && product.status !== 'draft'
      ),
    [brand.id, products]
  );

  // Mixed/interleaved products across categories so items appear mixed in 'Hamısı' view
  const mixedProducts = useMemo(() => {
    if (!publishedProducts.length) return [];
    const categoryBuckets: { [cat: string]: Product[] } = {};
    for (const prod of publishedProducts) {
      const catKey = prod.category || 'other';
      if (!categoryBuckets[catKey]) categoryBuckets[catKey] = [];
      categoryBuckets[catKey].push(prod);
    }
    const bucketKeys = Object.keys(categoryBuckets);
    const mixed: Product[] = [];
    let hasMore = true;
    let index = 0;
    while (hasMore) {
      hasMore = false;
      for (const key of bucketKeys) {
        if (index < categoryBuckets[key].length) {
          mixed.push(categoryBuckets[key][index]);
          hasMore = true;
        }
      }
      index++;
    }
    return mixed;
  }, [publishedProducts]);

  const displayedProducts = useMemo(() => {
    if (selectedCategory === 'all') {
      return mixedProducts;
    }
    return publishedProducts.filter((product) => product.category === selectedCategory);
  }, [selectedCategory, mixedProducts, publishedProducts]);

  const visibleProducts = useMemo(
    () => displayedProducts.slice(0, visibleCount),
    [displayedProducts, visibleCount]
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
            <p style={{ color: theme.textMuted, lineHeight: 1.7, maxWidth: '700px', margin: '0 0 10px 0' }}>
              {brand.description}
            </p>
          ) : null}
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
            {/* 1st Option: Hamısı */}
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              style={{
                border: selectedCategory === 'all' ? '1px solid #e31e24' : `1px solid ${theme.border}`,
                background: selectedCategory === 'all' ? '#e31e24' : theme.bgCard,
                color: selectedCategory === 'all' ? '#ffffff' : theme.text,
                borderRadius: '999px',
                padding: '8px 16px',
                fontWeight: 750,
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: selectedCategory === 'all' ? '0 4px 14px rgba(227, 30, 36, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: selectedCategory === 'all' ? '#ffffff' : '#e31e24',
                  width: '18px',
                  height: '18px',
                  flexShrink: 0,
                }}
              >
                <Boxes size={15} />
              </span>
              <span>Hamısı</span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: selectedCategory === 'all' ? 'rgba(255, 255, 255, 0.85)' : theme.textMuted,
                  marginLeft: '2px',
                }}
              >
                · {publishedProducts.length}
              </span>
            </button>

            {categoryRows.map(({ category, count }) => {
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  style={{
                    border: isSelected ? '1px solid #e31e24' : `1px solid ${theme.border}`,
                    background: isSelected ? '#e31e24' : theme.bgCard,
                    color: isSelected ? '#ffffff' : theme.text,
                    borderRadius: '999px',
                    padding: '8px 16px',
                    fontWeight: 750,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: isSelected ? '0 4px 14px rgba(227, 30, 36, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? '#ffffff' : '#e31e24',
                      width: '18px',
                      height: '18px',
                      flexShrink: 0,
                    }}
                  >
                    <CategoryGlyph id={category.id} slug={category.slug || category.id} compact plain />
                  </span>
                  <span>{category.name}</span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: isSelected ? 'rgba(255, 255, 255, 0.85)' : theme.textMuted,
                      marginLeft: '2px',
                    }}
                  >
                    · {count}
                  </span>
                </button>
              );
            })}
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
              maxWidth: '1060px',
              margin: '0 auto 16px auto',
              width: '100%',
              boxSizing: 'border-box',
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Kataloqa keçid et <ArrowRight size={14} />
            </button>
          </div>
          {visibleProducts.length > 0 ? (
            <>
              <div className="brand-detail-products-grid">
                {visibleProducts.map((product) => (
                  <div
                    key={product.id}
                    className="featured-product-reveal"
                    style={{ width: '100%', maxWidth: '339px' }}
                  >
                    <FeaturedProductCard
                      product={product}
                      theme={theme}
                      onSelect={(p) => {
                        if (onSelectProduct) onSelectProduct(p);
                        else onNavigate('product', p.id);
                      }}
                      onAddToCart={onAddToCart}
                      onToggleFavorite={onToggleFavorite}
                      isFavorite={favoriteIdSet.has(product.id)}
                      onToggleCompare={onToggleCompare}
                      isComparing={comparisonIdSet.has(product.id)}
                      onWhatsApp={onWhatsApp}
                      onCall={onCall}
                      brand={brand}
                    />
                  </div>
                ))}
              </div>

              {displayedProducts.length > visibleCount && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '32px',
                    width: '100%',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    style={{
                      border: `1px solid ${theme.border}`,
                      background: theme.bgCard,
                      color: theme.text,
                      padding: '12px 32px',
                      borderRadius: '999px',
                      fontWeight: 800,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#e31e24';
                      e.currentTarget.style.color = '#e31e24';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.border;
                      e.currentTarget.style.color = theme.text;
                    }}
                  >
                    Daha çox göstər
                  </button>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: theme.textMuted, textAlign: 'center', margin: '40px 0' }}>
              Bu kateqoriya üzrə model tapılmadı.
            </p>
          )}
        </section>
      )}
    </main>
  );
};
