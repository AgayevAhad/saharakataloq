import React from 'react';
import { Home, LayoutGrid, ShoppingCart, User, Heart } from 'lucide-react';
import { AuthUser } from '../../types/auth';
import { ThemeColors, DESIGN_TOKENS } from '../../types/theme';

interface MobileBottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenSearch?: () => void;
  onOpenUserDrawer?: () => void;
  comparisonCount?: number;
  cartCount?: number;
  favoritesCount?: number;
  authUser?: AuthUser | null;
  theme: ThemeColors;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRoute,
  onNavigate,
  onOpenUserDrawer,
  cartCount = 0,
  favoritesCount = 0,
  authUser,
  theme,
}) => {

  return (
    <nav
      className="mobile-bottom-nav no-print hide-on-desktop"
      role="navigation"
      aria-label="Mobil alt naviqasiya"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor:
          theme.mode === 'dark' ? 'rgba(11, 15, 23, 0.95)' : 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: `1px solid ${theme.border}`,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
        zIndex: DESIGN_TOKENS.zIndex.dock,
        padding: '6px 12px calc(6px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        {/* 1. Ana Səhifə */}
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
            color: currentRoute === 'home' ? '#e31e24' : theme.textMuted,
            fontSize: '11px',
            fontWeight: currentRoute === 'home' ? 800 : 500,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Home size={20} />
          <span>Ana Səhifə</span>
        </button>

        {/* 2. Kataloq */}
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
            color: currentRoute === 'catalog' ? '#e31e24' : theme.textMuted,
            fontSize: '11px',
            fontWeight: currentRoute === 'catalog' ? 800 : 500,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <LayoutGrid size={20} />
          <span>Kataloq</span>
        </button>

        {/* 3. Səbət */}
        <button
          type="button"
          onClick={() => onNavigate('cart')}
          className={`mobile-nav-item ${currentRoute === 'cart' ? 'active' : ''}`}
          style={{
            position: 'relative',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: currentRoute === 'cart' ? '#e31e24' : theme.textMuted,
            fontSize: '11px',
            fontWeight: currentRoute === 'cart' ? 800 : 500,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <div style={{ position: 'relative' }}>
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-6px',
                  backgroundColor: '#e31e24',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 800,
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span>Səbət</span>
        </button>

        {/* 4. Profil */}
        <button
          type="button"
          onClick={() => {
            if (onOpenUserDrawer) {
              onOpenUserDrawer();
            } else {
              onNavigate('account');
            }
          }}
          className={`mobile-nav-item ${currentRoute === 'account' ? 'active' : ''}`}
          style={{
            position: 'relative',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: currentRoute === 'account' ? '#e31e24' : theme.textMuted,
            fontSize: '11px',
            fontWeight: currentRoute === 'account' ? 800 : 500,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <div style={{ position: 'relative' }}>
            {authUser ? (
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: currentRoute === 'account' ? '#dc2626' : (theme.mode === 'dark' ? '#334155' : '#e2e8f0'),
                  color: currentRoute === 'account' ? '#ffffff' : theme.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 900,
                }}
              >
                {authUser.fullName.charAt(0).toUpperCase()}
              </div>
            ) : (
              <User size={20} />
            )}
          </div>
          <span style={{ maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {authUser ? authUser.fullName.split(' ')[0] : 'Profil'}
          </span>
        </button>

      </div>
    </nav>
  );
};

