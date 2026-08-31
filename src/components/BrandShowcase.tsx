import React from 'react';
import { ArrowRight, Clock3, Sparkles } from 'lucide-react';
import { Brand, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { BrandMark } from './BrandMark';

const ardoBackdrops = [
  '/media/products/ardo-604b.jpg',
  '/media/products/ardo-c640e-inox.jpg',
];

export const BrandShowcase: React.FC<{
  brands: Brand[];
  products: Product[];
  theme: ThemeColors;
  onSelect: (id: string) => void;
}> = ({ brands, products, theme, onSelect }) => (
  <section className="brand-showcase" aria-labelledby="brand-showcase-title">
    <div className="brand-showcase-heading">
      <div>
        <span style={{ color: theme.primary }}><Sparkles size={14} /> Brendlər</span>
        <h1 id="brand-showcase-title" style={{ color: theme.text }}>Məhsul ailələrimizi kəşf edin</h1>
      </div>
      <p style={{ color: theme.textMuted }}>Mövcud kataloqa baxın; hazırlanmaqda olan bölmələri tezliklə burada görəcəksiniz.</p>
    </div>
    <div className="brand-showcase-grid">
      {brands.map((brand, index) => {
        const count = products.filter((product) => product.brandId === brand.id && product.status !== 'draft').length;
        const soon = brand.comingSoon || count === 0;
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
            aria-label={soon ? `${brand.name} - Tezliklə` : `${brand.name} məhsullarına bax (${count} model)`}
            className={`brand-showcase-card brand-${brand.id} brand-tone-${index % 3} ${soon ? 'coming-soon' : 'ready'}`}
            style={{ borderColor: theme.border, background: theme.bgCard }}
          >
            {brand.id === 'ardo' && (
              <div className="brand-card-backdrops" aria-hidden="true">
                {ardoBackdrops.map((src, imageIndex) => (
                  <img key={src} src={src} alt="" style={{ animationDelay: `${imageIndex * 5}s` }} />
                ))}
              </div>
            )}
            <div className="brand-card-shade" aria-hidden="true" />
            {soon && <div className="soon-atmosphere" aria-hidden="true"><i /><i /><i /></div>}
            <div className="brand-mark-shell"><BrandMark brand={brand} /></div>
            <div className="brand-card-copy">
              <div className="brand-card-top">
                <strong>{brand.name}</strong>
                {soon ? (
                  <span className="soon-badge"><Clock3 size={12} /> TEZLİKLƏ</span>
                ) : (
                  <span className="ready-badge">{count} məhsul</span>
                )}
              </div>
              {soon ? (
                <div className="soon-message">
                  <b>Tezliklə</b>
                  <span><i>Hazırlanır</i><i>Yenilənir</i><i>Çox yaxında</i></span>
                </div>
              ) : (
                <p>Mövcud modellər və texniki xüsusiyyətlər.</p>
              )}
              {!soon && (
                <button type="button" tabIndex={-1} aria-hidden="true">
                  Məhsullara bax <ArrowRight size={15} />
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  </section>
);
