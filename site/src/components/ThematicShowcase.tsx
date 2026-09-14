import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CatalogCategory } from '../types/product';
import { ThemeColors } from '../types/theme';

export interface ThematicItem {
  id: string;
  title: string;
  description?: string;
  buttonText?: string;
  categoryId?: string;
  imageUrl?: string;
  active?: boolean;
}

interface ThematicShowcaseProps {
  items?: ThematicItem[];
  categories?: CatalogCategory[];
  theme: ThemeColors;
  onNavigateCategory: (categoryId: string) => void;
}

const DEFAULT_THEMATIC_ITEMS: ThematicItem[] = [
  {
    id: 'thematic-tv',
    title: 'Eviniz üçün ən yaxşı seçim',
    buttonText: 'Televizorlar',
    categoryId: 'tv',
    imageUrl: '/media/hero-livingroom.jpg',
    active: true,
  },
  {
    id: 'thematic-washer',
    title: 'Gündəlik rahatlıq',
    buttonText: 'Paltaryuyanlar',
    categoryId: 'washing-machine',
    imageUrl: '/media/promo-washer.jpg',
    active: true,
  },
  {
    id: 'thematic-fridge',
    title: 'Müasir mətbəxlər',
    buttonText: 'Soyuducular',
    categoryId: 'refrigerator',
    imageUrl: '/media/promo-fridge.jpg',
    active: true,
  },
];

export const ThematicShowcase: React.FC<ThematicShowcaseProps> = ({
  items,
  categories = [],
  theme,
  onNavigateCategory,
}) => {
  if (items !== undefined && items.length === 0) {
    return null;
  }

  const rawItems = items && items.length > 0 ? items : DEFAULT_THEMATIC_ITEMS;
  const activeItems = rawItems.filter((it) => it.active !== false && (it.imageUrl || it.title));

  if (activeItems.length === 0) {
    return null;
  }

  const handleCardClick = (item: ThematicItem) => {
    if (item.categoryId) {
      const matched = categories.find(
        (c) => c.id === item.categoryId || c.slug === item.categoryId
      );
      onNavigateCategory(matched ? matched.id : item.categoryId);
    } else {
      onNavigateCategory('catalog');
    }
  };

  return (
    <section className="catalog-container thematic-showcase-section" aria-label="Seçilmiş Bölmələr">
      <div
        className="thematic-showcase-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          width: '100%',
        }}
      >
        {activeItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleCardClick(item)}
            className="thematic-feature-card"
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              backgroundColor: theme.mode === 'dark' ? '#11141a' : '#f8f9fa',
              border: `1px solid ${theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              boxShadow:
                theme.mode === 'dark'
                  ? '0 10px 28px -4px rgba(0, 0, 0, 0.4)'
                  : '0 6px 20px -4px rgba(0, 0, 0, 0.04)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '280px',
              transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(item);
              }
            }}
          >
            {/* Card Content Top */}
            <div style={{ padding: '24px 24px 12px 24px', zIndex: 2 }}>
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 900,
                  color: theme.text,
                  margin: '0 0 8px 0',
                  lineHeight: 1.25,
                  letterSpacing: '-0.01em',
                  fontFamily: 'Outfit, -apple-system, sans-serif',
                }}
              >
                {item.title}
              </h3>

              {item.description && (
                <p
                  style={{
                    fontSize: '13px',
                    color: theme.textMuted || '#64748b',
                    margin: '0 0 12px 0',
                    lineHeight: 1.4,
                  }}
                >
                  {item.description}
                </p>
              )}

              <button
                type="button"
                style={{
                  backgroundColor: '#e31e24',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(227, 30, 36, 0.3)',
                }}
              >
                <span>{item.buttonText || 'Məhsullara bax'}</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Product / Interior Visual Background Stage */}
            {item.imageUrl && (
              <div
                style={{
                  marginTop: 'auto',
                  width: '100%',
                  height: '190px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                    transition: 'transform 0.3s ease',
                  }}
                  className="thematic-img-zoom"
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      theme.mode === 'dark'
                        ? 'linear-gradient(to bottom, rgba(17, 20, 26, 0.6) 0%, transparent 40%)'
                        : 'linear-gradient(to bottom, rgba(248, 249, 250, 0.5) 0%, transparent 40%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
