import React from 'react';
import { ShieldCheck, Truck, Wrench, Award, CheckCircle } from 'lucide-react';
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

const getTrustIcon = (iconName?: string, color = '#dc2626') => {
  switch (iconName?.toLowerCase()) {
    case 'shield':
    case 'shieldcheck':
      return <ShieldCheck size={22} color={color} />;
    case 'truck':
    case 'delivery':
      return <Truck size={22} color={color} />;
    case 'wrench':
    case 'service':
      return <Wrench size={22} color={color} />;
    case 'award':
    case 'badge':
      return <Award size={22} color={color} />;
    default:
      return <CheckCircle size={22} color={color} />;
  }
};

export const TrustHighlights: React.FC<TrustHighlightsProps> = ({ items = [], theme }) => {
  // Fail-closed rule: If no verified items are present, render NOTHING (return null)
  const activeItems = items.filter((item) => item.active !== false && Boolean(item.title));

  if (activeItems.length === 0) {
    return null;
  }

  return (
    <section
      className="catalog-container trust-highlights-section"
      aria-label="Xidmətlər və Üstünlüklər"
    >
      <div
        style={{
          backgroundColor: theme.mode === 'dark' ? '#0f172a' : '#f8fafc',
          border: `1px solid ${theme.border}`,
          borderRadius: '20px',
          padding: '28px 24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          {activeItems.map((item) => (
            <div key={item.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor:
                    theme.mode === 'dark' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getTrustIcon(item.icon, theme.primary)}
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    margin: '0 0 4px 0',
                    color: theme.text,
                  }}
                >
                  {item.title}
                </h4>
                <p
                  style={{
                    fontSize: '12px',
                    color: theme.textMuted,
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
