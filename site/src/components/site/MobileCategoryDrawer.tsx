import React, { useEffect, useRef } from 'react';
import { Brand, CatalogCategory, Product } from '../../types/product';
import { ThemeColors, DESIGN_TOKENS } from '../../types/theme';
import { X, Layers, MapPin, ChevronRight, Phone, ShieldCheck, Tag } from 'lucide-react';

interface MobileCategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CatalogCategory[];
  brands: Brand[];
  products: Product[];
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  onSelectCategory: (categoryId: string) => void;
  onSelectBrand: (brandId: string) => void;
  onNavigate: (route: string) => void;
  triggerRef?: React.RefObject<HTMLElement>;
}

export const MobileCategoryDrawer: React.FC<MobileCategoryDrawerProps> = ({
  isOpen,
  onClose,
  categories,
  brands,
  products,
  theme,
  themeMode,
  onSelectCategory,
  onSelectBrand,
  onNavigate,
  triggerRef,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Body scroll lock
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus close button on open
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        triggerRef?.current?.focus();
        return;
      }

      // Focus trap within drawer
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const sortedCategories = [...categories]
    .filter((c) => c.active)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const publishedBrands = brands.filter((b) => b.active);

  return (
    <div
      className="mobile-drawer-portal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: DESIGN_TOKENS.zIndex.modal,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        className="mobile-drawer-backdrop"
        onClick={() => {
          onClose();
          triggerRef?.current?.focus();
        }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease forwards',
        }}
        aria-hidden="true"
      />

      {/* Drawer Sheet */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobil Kateqoriya və Naviqasiya Menyu"
        className="mobile-category-drawer"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 'min(300px, 90vw)',
          height: '100%',
          backgroundColor: themeMode === 'dark' ? '#0b0f17' : '#ffffff',
          color: theme.text,
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: DESIGN_TOKENS.zIndex.modal + 1,
          animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: themeMode === 'dark' ? '#111722' : '#f8fafc',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={themeMode === 'dark' ? '/media/SaharaLogo-dark.png' : '/media/SaharaLogo.png'}
              alt="Sahara Electronics"
              style={{
                height: '26px',
                width: 'auto',
                maxWidth: '120px',
                objectFit: 'contain',
              }}
            />
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => {
              onClose();
              triggerRef?.current?.focus();
            }}
            className="mobile-drawer-close-btn"
            style={{
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              padding: '6px',
              color: theme.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Menyunu bağla"
          >
            <X size={20} />
          </button>
        </div>

        {/* Brand Bar */}
        <div style={{ padding: '16px 20px 8px 20px', borderBottom: `1px solid ${theme.border}` }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: theme.textMuted,
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Tag size={13} style={{ color: theme.primary }} />
            <span>Kataloq Brendləri</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {publishedBrands.map((brand) => (
              <button
                key={brand.id}
                type="button"
                onClick={() => {
                  onSelectBrand(brand.id);
                  onClose();
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.border}`,
                  backgroundColor: themeMode === 'dark' ? '#161d2b' : '#f1f5f9',
                  color: theme.text,
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{brand.name}</span>
                {brand.comingSoon && (
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(234, 179, 8, 0.2)',
                      color: '#eab308',
                      fontWeight: 800,
                    }}
                  >
                    Tezliklə
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div style={{ flex: 1, padding: '16px 20px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: theme.textMuted,
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={13} style={{ color: theme.primary }} />
            <span>Məhsul Kateqoriyaları</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sortedCategories.map((cat) => {
              const count = products.filter((p) => p.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat.id);
                    onClose();
                  }}
                  className="mobile-drawer-cat-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid transparent',
                    backgroundColor: 'transparent',
                    color: theme.text,
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{cat.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {count > 0 && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: theme.textMuted,
                          backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          fontWeight: 500,
                        }}
                      >
                        {count}
                      </span>
                    )}
                    <ChevronRight size={14} style={{ color: theme.textMuted }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation Links */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: `1px solid ${theme.border}`,
            backgroundColor: themeMode === 'dark' ? '#111722' : '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => {
              onNavigate('stores');
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '6px',
              background: 'transparent',
              border: 'none',
              color: theme.text,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <MapPin size={16} style={{ color: theme.primary }} />
            <span>Sərgi Salonları & Ünvanlar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate('services');
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '6px',
              background: 'transparent',
              border: 'none',
              color: theme.text,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <ShieldCheck size={16} style={{ color: '#10b981' }} />
            <span>Xidmətlər & Zəmanət</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate('support');
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '6px',
              background: 'transparent',
              border: 'none',
              color: theme.text,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Phone size={16} style={{ color: '#3b82f6' }} />
            <span>Müştəri Dəstəyi & Əlaqə</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
