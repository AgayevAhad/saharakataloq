import React, { useState, useEffect, useRef } from 'react';
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
  ChevronRight,
  Sparkles,
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
  const [activeGroup, setActiveGroup] = useState<'large' | 'built_in' | 'small' | 'climate' | 'all'>('large');
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

  const departmentGroups = [
    {
      id: 'large',
      name: 'Böyük Məişət Texnikası',
      icon: Package,
      filter: (c: CatalogCategory) =>
        ['washer', 'refrigerator', 'oven', 'dishwasher', 'freezer'].includes(c.id) ||
        ['paltaryuyanlar', 'soyuducular', 'sobalar', 'qabyuyanlar', 'dondurucular'].includes(c.slug || '') ||
        c.name.toLowerCase().includes('soyuducu') ||
        c.name.toLowerCase().includes('paltaryuyan') ||
        c.name.toLowerCase().includes('qabyuyan') ||
        c.name.toLowerCase().includes('dondurucu') ||
        (c.name.toLowerCase().includes('soba') && !c.name.toLowerCase().includes('mikrodalğ')),
    },
    {
      id: 'built_in',
      name: 'Quraşdırılan Texnika',
      icon: Flame,
      filter: (c: CatalogCategory) =>
        ['cooktop', 'hood', 'microwave', 'built_in_oven'].includes(c.id) ||
        ['bisirme-panelleri', 'aspiratorlar', 'mikrodalgali-sobalar', 'qurasdirilan-sobalar'].includes(c.slug || '') ||
        c.name.toLowerCase().includes('bişirmə') ||
        c.name.toLowerCase().includes('panel') ||
        c.name.toLowerCase().includes('aspirator') ||
        c.name.toLowerCase().includes('mikrodalğ') ||
        c.name.toLowerCase().includes('quraşdırılan'),
    },
    {
      id: 'small',
      name: 'Kiçik Məişət Texnikası',
      icon: Zap,
      filter: (c: CatalogCategory) =>
        ['airfryer', 'vacuum_cleaner', 'thermopot', 'meat_grinder', 'iron', 'kettle', 'blender'].includes(c.id) ||
        ['airfryer', 'tozsoranlar', 'caydanlar', 'blenderler', 'etcakan'].includes(c.slug || '') ||
        c.name.toLowerCase().includes('airfryer') ||
        c.name.toLowerCase().includes('tozsoran') ||
        c.name.toLowerCase().includes('çaydan') ||
        c.name.toLowerCase().includes('ətçəkən') ||
        c.name.toLowerCase().includes('blender') ||
        c.name.toLowerCase().includes('ütü'),
    },
    {
      id: 'climate',
      name: 'İqlim Texnikası',
      icon: Wind,
      filter: (c: CatalogCategory) =>
        ['air_conditioner', 'heater', 'fan', 'climate'].includes(c.id) ||
        ['kondisionerler', 'qizdiricilar', 'ventilyatorlar', 'iqlim'].includes(c.slug || '') ||
        c.name.toLowerCase().includes('kondisioner') ||
        c.name.toLowerCase().includes('iqlim') ||
        c.name.toLowerCase().includes('qızdırıcı') ||
        c.name.toLowerCase().includes('ventilyator'),
    },
    {
      id: 'all',
      name: 'Bütün Kateqoriyalar',
      icon: Sparkles,
      filter: () => true,
    },
  ];

  const currentGroup = departmentGroups.find((g) => g.id === activeGroup) || departmentGroups[0];
  const currentGroupCategories = activeGroup === 'all'
    ? activeCategories
    : activeCategories.filter(currentGroup.filter);
  const displayCategories = currentGroupCategories.length > 0 ? currentGroupCategories : activeCategories;

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
              gridTemplateColumns: '240px 1fr 205px',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            {/* Left: Parent Departments Vertical List (alt-alta sözlər, uyğun icon, açılacaq hissi verən chevron) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                borderRight: `1px solid ${theme.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
                paddingRight: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: theme.textMuted,
                  padding: '0 8px 6px',
                }}
              >
                Bölmələr
              </div>

              {departmentGroups.map((grp) => {
                const isActive = activeGroup === grp.id;
                const GrpIcon = grp.icon;
                return (
                  <button
                    key={grp.id}
                    type="button"
                    onMouseEnter={() => setActiveGroup(grp.id as any)}
                    onClick={() => {
                      onNavigate('catalog');
                      onClose();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isActive
                        ? theme.mode === 'dark'
                          ? 'rgba(227, 30, 36, 0.16)'
                          : 'rgba(227, 30, 36, 0.08)'
                        : 'transparent',
                      color: isActive ? '#e31e24' : theme.text,
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <GrpIcon
                        size={15}
                        style={{
                          color: isActive ? '#e31e24' : theme.mode === 'dark' ? '#94a3b8' : '#64748b',
                          flexShrink: 0,
                          transition: 'color 0.15s ease',
                        }}
                      />
                      <span>{grp.name}</span>
                    </div>
                    <ChevronRight
                      size={14}
                      style={{
                        color: isActive ? '#e31e24' : theme.mode === 'dark' ? '#64748b' : '#94a3b8',
                        transform: isActive ? 'translateX(2px)' : 'none',
                        transition: 'transform 0.18s ease, color 0.18s ease',
                        opacity: isActive ? 1 : 0.6,
                        flexShrink: 0,
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Center: Dynamic Subcategories Panel (Üstünə gələndə uyğun açılış) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '8px',
                  borderBottom: `1px solid ${theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <currentGroup.icon size={15} style={{ color: '#e31e24' }} />
                  <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: theme.text }}>
                    {currentGroup.name}
                  </span>
                  <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 500 }}>
                    ({displayCategories.length} kateqoriya)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('catalog');
                    onClose();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#e31e24',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0,
                  }}
                >
                  <span>Bütün kataloq</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              {/* Render category groups with display toggling to ensure all categories exist in DOM for accessibility/tests */}
              {departmentGroups.map((grp) => {
                const isCurrent = (activeGroup === grp.id) || (activeGroup !== 'large' && activeGroup !== 'built_in' && activeGroup !== 'small' && activeGroup !== 'climate' && grp.id === 'all');
                const grpCats = grp.id === 'all' ? activeCategories : activeCategories.filter(grp.filter);
                const catsToRender = grpCats.length > 0 ? grpCats : activeCategories;

                return (
                  <div
                    key={grp.id}
                    style={{
                      display: activeGroup === grp.id ? 'grid' : 'none',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '8px 12px',
                    }}
                  >
                    {catsToRender.map((c) => {
                      const count = products.filter((p) => p.category === c.id && p.status !== 'draft').length;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            onSelectCategory(c.id);
                            onClose();
                          }}
                          className="mega-menu-link"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            backgroundColor: theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(248, 250, 252, 0.75)',
                            border: `1px solid ${theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'}`,
                            color: theme.text,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            textAlign: 'left',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme.mode === 'dark' ? 'rgba(227, 30, 36, 0.12)' : 'rgba(227, 30, 36, 0.06)';
                            e.currentTarget.style.borderColor = 'rgba(227, 30, 36, 0.35)';
                            e.currentTarget.style.transform = 'translateY(-1px) translateX(2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(248, 250, 252, 0.75)';
                            e.currentTarget.style.borderColor = theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
                            e.currentTarget.style.transform = 'none';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#ffffff',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                flexShrink: 0,
                              }}
                            >
                              {getCategoryIcon(c.id, c.slug)}
                            </div>
                            <span style={{ fontSize: '12.5px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.name}
                            </span>
                          </div>
                          {count > 0 && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                color: theme.textMuted,
                                fontWeight: 500,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                flexShrink: 0,
                                marginLeft: '6px',
                              }}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Right: Compact Brand Panel (Azaldılmış en ilə brendlər) */}
            <div
              style={{
                borderLeft: `1px solid ${theme.border}`,
                paddingLeft: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Tag size={12} color="#e31e24" />
                  <span>Rəsmi Brendlər</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('brands');
                    onClose();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#e31e24',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: 0,
                  }}
                >
                  <span>Hamısı</span>
                  <ArrowRight size={11} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
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
                      padding: '6px 8px',
                      borderRadius: '7px',
                      backgroundColor: theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.45)' : 'rgba(248, 250, 252, 0.65)',
                      border: `1px solid ${theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#e31e24';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: theme.text }}>
                        {brand.name}
                      </div>
                      <div style={{ fontSize: '9px', color: theme.textMuted }}>
                        {brand.originCountry || 'Orijinal'}
                      </div>
                    </div>
                    <ArrowRight size={11} style={{ color: theme.textMuted, flexShrink: 0 }} />
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
                  gap: '5px',
                  color: '#e31e24',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '4px 0',
                  marginTop: '2px',
                }}
              >
                <span>Bütün brendlər ({publishedBrands.length})</span>
                <ArrowRight size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
