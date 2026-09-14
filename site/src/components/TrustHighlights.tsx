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
    title: 'Pulsuz çatdırılma',
    description: 'Bakı şəhəri üzrə',
    icon: 'truck',
    active: true,
  },
  {
    id: 'trust-payment',
    title: 'Asan ödəniş',
    description: 'Nağd, kart, hissə-hissə',
    icon: 'card',
    active: true,
  },
  {
    id: 'trust-support',
    title: 'Peşəkar dəstək',
    description: 'Həmişə yanınızda',
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

export const TrustHighlights: React.FC<TrustHighlightsProps> = ({ items, theme }) => {
  if (items !== undefined && items.length === 0) {
    return null;
  }

  const rawItems = items && items.length > 0 ? items : DEFAULT_TRUST_ITEMS;
  const activeItems = rawItems.filter((item) => item.active !== false && Boolean(item.title));

  if (activeItems.length === 0) {
    return null;
  }

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
        {activeItems.map((item) => (
          <div
            key={item.id}
            className="trust-highlight-card"
            style={{
              backgroundColor: theme.mode === 'dark' ? '#11141a' : '#ffffff',
              border: `1px solid ${theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              borderRadius: '16px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow:
                theme.mode === 'dark'
                  ? '0 6px 18px -4px rgba(0, 0, 0, 0.3)'
                  : '0 4px 14px -3px rgba(0, 0, 0, 0.03)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor:
                  theme.mode === 'dark' ? 'rgba(227, 30, 36, 0.15)' : 'rgba(227, 30, 36, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {getTrustIcon(item.icon, '#e31e24')}
            </div>
            <div>
              <h4
                style={{
                  fontSize: '14.5px',
                  fontWeight: 800,
                  margin: '0 0 3px 0',
                  color: theme.text,
                  fontFamily: 'Outfit, -apple-system, sans-serif',
                }}
              >
                {item.title}
              </h4>
              <p
                style={{
                  fontSize: '12.5px',
                  color: theme.textMuted || '#64748b',
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
