import React from 'react';
import { ShieldCheck, Truck, CreditCard, Headphones } from 'lucide-react';
import { ThemeColors } from '../types/theme';

export interface TrustItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  active?: boolean;
}

interface TrustHighlightsProps {
  items?: TrustItem[];
  theme: ThemeColors;
  onNavigate?: (route: string) => void;
}

const DEFAULT_TRUST_ITEMS: TrustItem[] = [
  {
    id: 'trust-warranty',
    title: 'Rəsmi zəmanət',
    description: 'Tam etibarlılıq',
    icon: 'shield',
    active: true,
  },
  {
    id: 'trust-delivery',
    title: 'Çatdırılma məlumatı',
    description: 'Şərtlər sifariş zamanı dəqiqləşir',
    icon: 'truck',
    active: true,
  },
  {
    id: 'trust-payment',
    title: 'Ödəniş məlumatı',
    description: 'Mövcud üsulları əlaqə zamanı öyrənin',
    icon: 'card',
    active: true,
  },
  {
    id: 'trust-support',
    title: 'Peşəkar dəstək',
    description: 'Mövcud əlaqə kanalları ilə',
    icon: 'support',
    active: true,
  },
];

const getTrustIcon = (iconName?: string, color = '#e31e24') => {
  switch (iconName?.toLowerCase()) {
    case 'shield':
    case 'shieldcheck':
    case 'warranty':
      return <ShieldCheck size={24} color={color} />;
    case 'truck':
    case 'delivery':
      return <Truck size={24} color={color} />;
    case 'card':
    case 'payment':
    case 'creditcard':
      return <CreditCard size={24} color={color} />;
    case 'support':
    case 'headset':
    case 'headphones':
      return <Headphones size={24} color={color} />;
    default:
      return <ShieldCheck size={24} color={color} />;
  }
};

const resolveTrustRoute = (itemId: string): string => {
  switch (itemId) {
    case 'trust-warranty':
      return 'warranty';
    case 'trust-delivery':
      return 'delivery';
    case 'trust-payment':
      return 'faq';
    case 'trust-support':
      return 'support';
    default:
      return 'support';
  }
};

export const TrustHighlights: React.FC<TrustHighlightsProps> = ({ items, theme, onNavigate }) => {
  if (items !== undefined && items.length === 0) {
    return null;
  }

  const rawItems = items && items.length > 0 ? items : DEFAULT_TRUST_ITEMS;
  const activeItems = rawItems.filter((item) => item.active !== false && Boolean(item.title));

  if (activeItems.length === 0) {
    return null;
  }

  const handleCardClick = (itemId: string) => {
    if (onNavigate) {
      onNavigate(resolveTrustRoute(itemId));
    }
  };

  return (
    <section
      className="catalog-container trust-highlights-section"
      aria-label="Xidmətlər və Üstünlüklər"
    >
      <div
        className="trust-highlights-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          width: '100%',
        }}
      >
        {activeItems.map((item) => {
          const targetRoute = resolveTrustRoute(item.id);
          const isDark = theme.mode === 'dark';
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(item.id);
                }
              }}
              className={`trust-highlight-card trust-btn-${item.id} scroll-reveal-item`}
              title={`${item.title} — ${targetRoute} səhifəsinə keç`}
              style={{
                backgroundColor: isDark ? '#1c2737' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}`,
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: isDark
                  ? '0 6px 18px -4px rgba(0, 0, 0, 0.45)'
                  : '0 4px 14px -3px rgba(0, 0, 0, 0.04)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(227, 30, 36, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background-color 0.2s ease, transform 0.2s ease',
                }}
              >
                {getTrustIcon(item.icon, isDark ? '#ef4444' : '#e31e24')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4
                  style={{
                    fontSize: '14.5px',
                    fontWeight: 800,
                    margin: '0 0 3px 0',
                    color: isDark ? '#f8fafc' : theme.text,
                    fontFamily: 'Outfit, -apple-system, sans-serif',
                    lineHeight: 1.3,
                  }}
                >
                  {item.title}
                </h4>
                <p
                  style={{
                    fontSize: '12.5px',
                    margin: 0,
                    color: isDark ? '#94a3b8' : theme.textMuted,
                    lineHeight: 1.4,
                  }}
                >
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
