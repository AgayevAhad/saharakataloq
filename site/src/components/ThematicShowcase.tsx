import React from 'react';
import { ChevronRight } from 'lucide-react';
import { CatalogCategory } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from './ShimmerImage';

export interface ThematicItem {
  id: string;
  title: string;
  description?: string;
  categoryId?: string;
  imageUrl?: string;
  active?: boolean;
}

interface ThematicShowcaseProps {
  items?: ThematicItem[];
  categories: CatalogCategory[];
  theme: ThemeColors;
  onNavigateCategory: (categoryId: string) => void;
}

export const ThematicShowcase: React.FC<ThematicShowcaseProps> = ({
  items = [],
  categories,
  theme,
  onNavigateCategory,
}) => {
  // Fail-closed rule: If no active thematic items are configured or valid, hide completely
  const activeItems = items.filter((item) => {
    if (!item.active) return false;
    if (!item.categoryId) return false;
    // Ensure category exists
    const categoryExists = categories.some((c) => c.id === item.categoryId);
    return categoryExists && Boolean(item.imageUrl);
  });

  if (activeItems.length === 0) {
    return null;
  }

  return (
    <section className="catalog-container thematic-showcase-section" aria-label="Tematik Vitrin">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {activeItems.slice(0, 3).map((item) => (
          <div
            key={item.id}
            onClick={() => item.categoryId && onNavigateCategory(item.categoryId)}
            style={{
              backgroundColor: theme.bgCard,
              border: `1px solid ${theme.border}`,
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            role="button"
            tabIndex={0}
          >
            {item.imageUrl && (
              <div style={{ height: '180px', width: '100%', overflow: 'hidden' }}>
                <ShimmerImage
                  src={item.imageUrl}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: theme.text, margin: 0 }}>
                {item.title}
              </h3>
              {item.description && (
                <p style={{ fontSize: '13px', color: theme.textSecondary, margin: 0 }}>
                  {item.description}
                </p>
              )}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: theme.primary,
                  fontSize: '13px',
                  fontWeight: 700,
                  marginTop: '8px',
                }}
              >
                <span>Məhsullara bax</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
