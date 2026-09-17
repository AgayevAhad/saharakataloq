import React, { useEffect, useRef } from 'react';
import { Brand, CatalogCategory, Product } from '../../types/product';
import { ThemeColors, DESIGN_TOKENS } from '../../types/theme';
import {
  ArrowRight,
  Tag,
  Layers,
  Package,
  Flame,
  Wind,
  Snowflake,
  RotateCw,
  Grid,
  Zap,
  Thermometer,
} from 'lucide-react';

const getCategoryIcon = (id: string, slug?: string) => {
  const key = `${id} ${slug || ''}`.toLowerCase();
  if (key.includes('refrigerator') || key.includes('soyuducu')) return <Snowflake size={14} style={{ color: '#0ea5e9', flexShrink: 0 }} />;
  if (key.includes('washer') || key.includes('paltaryuyan')) return <RotateCw size={14} style={{ color: '#e31e24', flexShrink: 0 }} />;
  if (key.includes('oven') || key.includes('soba')) return <Flame size={14} style={{ color: '#f97316', flexShrink: 0 }} />;
  if (key.includes('cooktop') || key.includes('bisirme') || key.includes('panel')) return <Grid size={14} style={{ color: '#e31e24', flexShrink: 0 }} />;
  if (key.includes('hood') || key.includes('aspirator')) return <Wind size={14} style={{ color: '#64748b', flexShrink: 0 }} />;
  if (key.includes('microwave') || key.includes('mikrodalga')) return <Zap size={14} style={{ color: '#eab308', flexShrink: 0 }} />;
  if (key.includes('conditioner') || key.includes('iqlim') || key.includes('kondisioner')) return <Thermometer size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />;
  if (key.includes('vacuum') || key.includes('tozsoran')) return <Wind size={14} style={{ color: '#06b6d4', flexShrink: 0 }} />;
  if (key.includes('airfryer')) return <Flame size={14} style={{ color: '#f43f5e', flexShrink: 0 }} />;
  return <Package size={14} style={{ color: '#e31e24', flexShrink: 0 }} />;
};

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CatalogCategory[];
  brands: Brand[];
  products?: Product[];
  theme: ThemeColors;
  onSelectCategory: (categoryId: string) => void;
  onSelectBrand: (brandId: string) => void;
  onNavigate: (route: string) => void;
  triggerRef?: React.RefObject<HTMLElement>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  isOpen,
  onClose,
  categories,
  brands,
  products = [],
  theme,
  onSelectCategory,
  onSelectBrand,
  onNavigate,
  triggerRef,
  onMouseEnter,
  onMouseLeave,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus first focusable item
    const timer = setTimeout(() => {
      if (menuRef.current) {
        const firstFocusable = menuRef.current.querySelector<HTMLElement>(
          'a, button, [tabindex="0"]'
        );
        firstFocusable?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        triggerRef?.current?.focus();
        return;
      }

      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        if (!menuRef.current) return;
        const focusableElements = Array.from(
          menuRef.current.querySelectorAll<HTMLElement>('a, button, [tabindex="0"]')
        ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

        if (focusableElements.length === 0) return;

        const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
        let nextIndex = currentIndex;

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
        } else if (e.key === 'Home') {
          e.preventDefault();
          nextIndex = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          nextIndex = focusableElements.length - 1;
        }

        focusableElements[nextIndex]?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !triggerRef?.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  // Active categories sorted by sortOrder
  const activeCategories = [...categories]
    .filter((c) => c.active)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // Verified / published brands
  const publishedBrands = brands.filter((b) => b.active);

  // Distribute categories into 3 balanced columns dynamically
  const colSize = Math.ceil(activeCategories.length / 3) || 1;
  const col1 = activeCategories.slice(0, colSize);
  const col2 = activeCategories.slice(colSize, colSize * 2);
  const col3 = activeCategories.slice(colSize * 2);

  return (
    <>
      {/* Backdrop overlay with rich frosted blur */}
      <div
        className="mega-menu-backdrop"
        onClick={() => {
          onClose();
          triggerRef?.current?.focus();
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(8px) saturate(150%)',
          WebkitBackdropFilter: 'blur(8px) saturate(150%)',
          zIndex: DESIGN_TOKENS.zIndex.overlay - 1,
          animation: 'fadeIn 0.2s ease forwards',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* Dropdown Panel Container with true frosted glass blur */}
      <div
        ref={menuRef}
        id="mega-menu-overlay"
        className="mega-menu-overlay"
        role="region"
        aria-label="Bütün Kateqoriyalar və Brendlər Mega Menyu"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          width: '100%',
          backgroundColor: theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.78)' : 'rgba(255, 255, 255, 0.78)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          border: 'none',
          borderTop: 'none',
          borderBottom: theme.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: theme.mode === 'dark' ? '0 24px 48px -8px rgba(0, 0, 0, 0.7)' : '0 20px 44px -8px rgba(0, 0, 0, 0.12)',
          zIndex: DESIGN_TOKENS.zIndex.overlay,
          padding: '22px 0',
          maxHeight: 'min(50vh, 440px)',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          animation: 'slideDownMenu 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <div className="catalog-container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: '32px',
              alignItems: 'start',
            }}
          >
            {/* Left 9 Columns: Dynamic Category Columns */}
            <div
              style={{
                gridColumn: 'span 9',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
              }}
            >
              {[col1, col2, col3].map((colCategories, colIdx) => (
                <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: theme.primary,
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {colIdx === 0 ? (
                      <Package size={14} style={{ color: theme.primary }} />
                    ) : colIdx === 1 ? (
                      <Flame size={14} style={{ color: theme.primary }} />
                    ) : (
                      <Wind size={14} style={{ color: theme.primary }} />
                    )}
                    <span>
                      {colIdx === 0
                        ? 'Böyük Məişət Texnikası'
                        : colIdx === 1
                          ? 'Quraşdırılan Texnika'
                          : 'Kiçik Məişət & İqlim'}
                    </span>
                  </div>

                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    {colCategories.map((cat) => {
                      const count = products.filter((p) => p.category === cat.id).length;
                      return (
                        <li key={cat.id}>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCategory(cat.id);
                              onClose();
                            }}
                            className="mega-menu-link"
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              background: 'transparent',
                              border: 'none',
                              color: theme.text,
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                theme.mode === 'dark' ? 'rgba(227, 30, 36, 0.12)' : 'rgba(227, 30, 36, 0.06)';
                              e.currentTarget.style.color = '#e31e24';
                              e.currentTarget.style.transform = 'translateX(3px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = theme.text;
                              e.currentTarget.style.transform = 'none';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {getCategoryIcon(cat.id, cat.slug)}
                              <span>{cat.name}</span>
                            </div>
                            {count > 0 && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: theme.textMuted,
                                  backgroundColor: theme.mode === 'dark' ? '#161d2b' : '#f1f5f9',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  fontWeight: 500,
                                }}
                              >
                                {count} model
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {/* Right 3 Columns: Published Brands Showcase (Capped to top brands with view all link) */}
            <div
              style={{
                gridColumn: 'span 3',
                borderLeft: `1px solid ${theme.border}`,
                paddingLeft: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: theme.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Tag size={14} style={{ color: theme.primary }} />
                <span>Rəsmi Brendlər</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {publishedBrands.slice(0, 4).map((brand) => (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => {
                      onSelectBrand(brand.id);
                      onClose();
                    }}
                    className="mega-menu-link"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.55)' : 'rgba(248, 250, 252, 0.65)',
                      border: `1px solid ${theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                      backdropFilter: 'blur(8px)',
                      color: theme.text,
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: theme.textMuted,
                          fontWeight: 500,
                          marginTop: '2px',
                        }}
                      >
                        {brand.originCountry}
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ color: theme.textMuted }} />
                  </button>
                ))}
              </div>

              {/* View All Brands Link */}
              <button
                type="button"
                onClick={() => {
                  onNavigate('brands');
                  onClose();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: theme.primary,
                  background: 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '4px 0',
                  marginTop: '2px',
                }}
              >
                <span>Bütün brendlər ({publishedBrands.length})</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
