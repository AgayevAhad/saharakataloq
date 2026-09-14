import React, { useEffect, useRef } from 'react';
import { Brand, CatalogCategory } from '../../types/product';
import { ThemeColors } from '../../types/theme';
import { Sparkles, ArrowRight, ShieldCheck, Flame, Zap, CheckCircle2 } from 'lucide-react';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CatalogCategory[];
  brands: Brand[];
  theme: ThemeColors;
  onSelectCategory: (categoryId: string) => void;
  onSelectBrand: (brandId: string) => void;
  onNavigate: (route: string) => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  isOpen,
  onClose,
  categories,
  brands,
  theme,
  onSelectCategory,
  onSelectBrand,
  onNavigate,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group categories logically into department columns
  const kitchenBuiltIn = categories.filter((c) => ['cooktop', 'oven', 'hood', 'microwave'].includes(c.id));
  const coolingAndWash = categories.filter((c) => ['refrigerator', 'washer', 'dishwasher'].includes(c.id));
  const electronicsAndSmall = categories.filter((c) => ['tv', 'air_conditioner', 'airfryer', 'meat_grinder', 'iron', 'thermopot', 'vacuum_cleaner'].includes(c.id));

  return (
    <div
      ref={menuRef}
      className="mega-menu-overlay"
      role="region"
      aria-label="Bütün Kateqoriyalar Mega Menyu"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: theme.bgCard,
        borderBottom: `1px solid ${theme.border}`,
        boxShadow: '0 24px 48px -8px rgba(0,0,0,0.3)',
        zIndex: 9998,
        padding: '32px 0',
        animation: 'slideDownMenu 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="catalog-container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '32px',
          }}
        >
          {/* Column 1: Bişirmə & Quraşdırılan Texnika */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: theme.primary, marginBottom: '14px', letterSpacing: '0.04em' }}>
              Quraşdırılan Mətbəx
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {kitchenBuiltIn.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.id);
                      onClose();
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: theme.text,
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: '4px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    <span>{cat.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: İri Məişət Texnikası */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: theme.primary, marginBottom: '14px', letterSpacing: '0.04em' }}>
              Soyutma & Yuma
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {coolingAndWash.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.id);
                      onClose();
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: theme.text,
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: '4px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left',
                    }}
                  >
                    <span>{cat.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Elektronika & Kiçik Məişət */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: theme.primary, marginBottom: '14px', letterSpacing: '0.04em' }}>
              TV, İqlim & Kiçik Məişət
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {electronicsAndSmall.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.id);
                      onClose();
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: theme.text,
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: '4px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left',
                    }}
                  >
                    <span>{cat.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Rəsmi Brendlər Vitrini */}
          <div
            style={{
              backgroundColor: theme.mode === 'dark' ? '#0b0f19' : '#f8fafc',
              border: `1px solid ${theme.border}`,
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: theme.primary, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={14} />
                <span>Rəsmi Brendlər</span>
              </div>
              <p style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '14px' }}>
                Sahara Electronics rəsmi distribütor zəmanətli brendləri təqdim edir:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      onSelectBrand(b.id);
                      onClose();
                    }}
                    style={{
                      background: theme.bgCard,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: theme.text,
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <span>{b.name}</span>
                    <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 500 }}>
                      {b.originCountry || (b.comingSoon ? 'Tezliklə' : 'Rəsmi')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onNavigate('catalog');
                onClose();
              }}
              style={{
                marginTop: '16px',
                background: 'transparent',
                border: 'none',
                color: theme.primary,
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: 0,
              }}
            >
              <span>Bütün məhsullara bax</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
