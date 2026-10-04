import React from 'react';
import { ArrowRight, Clock3, Sparkles } from 'lucide-react';
import { Brand, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { BrandMark } from './BrandMark';
import { ShimmerImage } from './ShimmerImage';

interface BrandBackdrop {
  key: string;
  src: string;
  objectPosition?: string;
  fitMode?: 'contain' | 'cover';
  cropRect?: { x: number; y: number; w: number; h: number };
}

export const buildBrandBackdrops = (
  brandId: string,
  products: Product[],
  limit = 4
): BrandBackdrop[] => {
  const seen = new Set<string>();
  const backdrops: BrandBackdrop[] = [];

  for (const product of products) {
    if (
      product.status === 'draft' ||
      (product.brandId || '').toLocaleLowerCase('az') !== brandId.toLocaleLowerCase('az')
    ) {
      continue;
    }

    const imageMedia = (product.media || []).filter(
      (item) => item.type === 'image' && Boolean(item.url?.trim())
    );
    const candidateUrls = [
      imageMedia[0]?.url,
      product.image,
      product.images?.[0],
      product.gallery?.[0],
    ].filter((url): url is string => Boolean(url?.trim()));
    const src = candidateUrls.find((url) => !seen.has(url));
    if (!src) continue;

    const mediaItem = imageMedia.find((item) => item.url === src) || imageMedia[0];
    seen.add(src);
    backdrops.push({
      key: `${product.id}:${src}`,
      src,
      objectPosition: mediaItem?.objectPosition || product.imagePosition || 'center',
      fitMode: mediaItem?.fitMode || product.imageFit || 'contain',
      cropRect: mediaItem?.cropRect || product.cropRect,
    });
    if (backdrops.length >= limit) break;
  }

  return backdrops;
};

export const BrandShowcase: React.FC<{
  brands: Brand[];
  products: Product[];
  theme: ThemeColors;
  onSelect: (id: string) => void;
}> = ({ brands, products, theme, onSelect }) => {
  const [failedBackdropUrls, setFailedBackdropUrls] = React.useState<Set<string>>(() => new Set());
  const displayBrands = React.useMemo(() => {
    const coreIds = ['ardo', 'lotus', 'artel'];
    const matched = brands.filter((b) => coreIds.includes(b.id));
    return matched.length > 0 ? matched : brands.slice(0, 3);
  }, [brands]);

  return (
    <section className="brand-showcase" aria-labelledby="brand-showcase-title">
      <div className="brand-showcase-heading">
        <div>
          <span style={{ color: theme.primary }}>
            <Sparkles size={14} /> Brendlər
          </span>
          <h1 id="brand-showcase-title" style={{ color: theme.text }}>
            Məhsul ailələrimizi kəşf edin
          </h1>
        </div>
        <p style={{ color: theme.textMuted }}>
          Mövcud kataloqa baxın; hazırlanmaqda olan bölmələri tezliklə burada görəcəksiniz.
        </p>
      </div>
      <div className="brand-showcase-grid">
        {displayBrands.map((brand, index) => {
          const count = products.filter(
            (product) => product.brandId === brand.id && product.status !== 'draft'
          ).length;
          const soon = brand.comingSoon || count === 0;
          const backdrops = buildBrandBackdrops(brand.id, products).filter(
            (item) => !failedBackdropUrls.has(item.src)
          );
          return (
            <article
              key={brand.id}
              role={soon ? undefined : 'button'}
              tabIndex={soon ? undefined : 0}
              onClick={() => {
                if (!soon) onSelect(brand.id);
              }}
              onKeyDown={(e) => {
                if (!soon && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelect(brand.id);
                }
              }}
              aria-label={
                soon
                  ? `${brand.name} - Tezliklə`
                  : `${brand.name} məhsullarına bax (${count} model)`
              }
              className={`brand-showcase-card brand-${brand.id} brand-tone-${index % 3} ${soon ? 'coming-soon' : 'ready'}`}
              style={{
                border: `1px solid ${theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)'}`,
                background: theme.bgCard,
                color: theme.text,
              }}
            >
              {backdrops.length > 0 && (
                <div className="brand-card-backdrops" aria-hidden="true">
                  {backdrops.map((src, imageIndex) => (
                    <ShimmerImage
                      key={src.key}
                      src={src.src}
                      alt=""
                      objectFit={src.fitMode}
                      objectPosition={src.objectPosition}
                      cropRect={src.cropRect}
                      containerClassName="brand-card-backdrop-item"
                      containerStyle={{ animationDelay: `${imageIndex * 12}s` }}
                      spinnerSize={18}
                      fallback={<span className="brand-backdrop-fallback" aria-hidden="true" />}
                      onError={() => {
                        setFailedBackdropUrls((current) => {
                          if (current.has(src.src)) return current;
                          const next = new Set(current);
                          next.add(src.src);
                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
              )}
              <div className="brand-card-shade" aria-hidden="true" />
              {soon && (
                <div className="soon-atmosphere" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              )}
              <div className="brand-mark-shell">
                <BrandMark brand={brand} isDarkMode={theme.mode === 'dark'} />
              </div>
              <div className="brand-card-copy">
                <div className="brand-card-top">
                  <strong style={{ color: theme.text }}>{brand.name}</strong>
                  {soon ? (
                    <span className="soon-badge">
                      <Clock3 size={12} /> TEZLİKLƏ
                    </span>
                  ) : (
                    <span className="ready-badge">{count} məhsul</span>
                  )}
                </div>
                {soon ? (
                  <div className="soon-message">
                    <b>Tezliklə</b>
                    <span>
                      <i>Hazırlanır</i>
                      <i>Yenilənir</i>
                      <i>Çox yaxında</i>
                    </span>
                  </div>
                ) : (
                  <p>Mövcud modellər və texniki xüsusiyyətlər.</p>
                )}
                {!soon && (
                  <span className="brand-card-action" aria-hidden="true">
                    Məhsullara bax <ArrowRight size={15} />
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
