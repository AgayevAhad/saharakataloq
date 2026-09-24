import React from 'react';
import { Home, Grid, Search, Scale, MapPin } from 'lucide-react';
import { ThemeColors } from '../../types/theme';

interface MobileBottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenSearch: () => void;
  comparisonCount: number;
  theme: ThemeColors;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRoute,
  onNavigate,
  onOpenSearch,
  comparisonCount,
  theme,
}) => {
  return (
    <nav
      className="mobile-bottom-nav no-print"
      role="navigation"
      aria-label="Mobil alt naviqasiya"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.mode === 'dark' ? 'rgba(13, 17, 23, 0.95)' : 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: `1px solid ${theme.border}`,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
        zIndex: 9000,
        padding: '6px 12px calc(6px + env(safe-area-inset-bottom, 0px))',
        display: 'none', // Shown on mobile via CSS media query
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`mobile-nav-item ${currentRoute === 'home' ? 'active' : ''}`}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: currentRoute === 'home' ? theme.primary : theme.textMuted,
            fontSize: '11px',
            fontWeight: currentRoute === 'home' ? 700 : 500,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Home size={20} />
          <span>Ana Səhifə</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('catalog')}
          className={`mobile-nav-item ${currentRoute === 'catalog' ? 'active' : ''}`}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: currentRoute === 'catalog' ? theme.primary : theme.textMuted,
            fontSize: '11px',
            fontWeight: currentRoute === 'catalog' ? 700 : 500,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Grid size={20} />
          <span>Kataloq</span>
        </button>

        <button
          type="button"
          onClick={onOpenSearch}
          className="mobile-nav-item"
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: theme.textMuted,
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Search size={20} />
          <span>Axtarış</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('compare')}
          className={`mobile-nav-item ${currentRoute === 'compare' ? 'active' : ''}`}
          style={{
            position: 'relative',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: currentRoute === 'compare' ? theme.primary : theme.textMuted,
            fontSize: '11px',
            fontWeight: currentRoute === 'compare' ? 700 : 500,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Scale size={20} />
          <span>Müqayisə</span>
          {comparisonCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '0px',
                right: '12px',
                backgroundColor: theme.primary,
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 800,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {comparisonCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onNavigate('stores')}
          className={`mobile-nav-item ${currentRoute === 'stores' ? 'active' : ''}`}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: currentRoute === 'stores' ? theme.primary : theme.textMuted,
            fontSize: '11px',
            fontWeight: currentRoute === 'stores' ? 700 : 500,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <MapPin size={20} />
          <span>Salonlar</span>
        </button>
      </div>
    </nav>
  );
};
