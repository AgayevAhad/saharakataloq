import React, { useState, useEffect, useRef } from 'react';
import { Brand, CatalogCategory, Product } from '../../types/product';
import { ThemeColors } from '../../types/theme';
import { ShimmerImage } from '../ShimmerImage';
import { CategoryGlyph } from '../CategoryGlyph';
import { FeaturedProductCard } from '../FeaturedProductCard';
import { ArrowRight, Package, Flame, Wind, Zap, ChevronRight, Sparkles } from 'lucide-react';

const getCategoryIcon = (id: string, slug?: string) => {
  return <CategoryGlyph id={id} slug={slug} compact />;
};

const getBrandLogoStyle = (brandSlugOrId: string): { maxWidth: string; maxHeight: string; scale?: string } => {
  const key = (brandSlugOrId || '').toLowerCase();
  if (key.includes('ardo')) return { maxWidth: '115px', maxHeight: '32px', scale: '1.1' };
  if (key.includes('lotus')) return { maxWidth: '96px', maxHeight: '23px', scale: '1.0' };
  if (key.includes('artel')) return { maxWidth: '82px', maxHeight: '19px', scale: '1.05' };
  if (key.includes('bosch')) return { maxWidth: '80px', maxHeight: '15.5px' };
  if (key.includes('samsung')) return { maxWidth: '82px', maxHeight: '14px' };
  if (key.includes('lg')) return { maxWidth: '75px', maxHeight: '20px' };
  if (key.includes('lanova')) return { maxWidth: '90px', maxHeight: '14px' };
  if (key.includes('beko')) return { maxWidth: '78px', maxHeight: '16px' };
  if (key.includes('gorenje')) return { maxWidth: '82px', maxHeight: '16px' };
  return { maxWidth: '82px', maxHeight: '17px' };
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
  onSelectProduct?: (product: Product) => void;
  onNavigate: (route: string, param?: string) => void;
  triggerRef?: React.RefObject<HTMLElement>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  isOpen,
  onClose,
  categories = [],
  brands = [],
  products = [],
  theme,
  onSelectCategory,
  onSelectBrand,
  onSelectProduct,
  onNavigate,
  triggerRef,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [activeGroup, setActiveGroup] = useState<
    'large' | 'built_in' | 'small' | 'climate' | 'all'
  >('large');
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

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
  const featuredOrder = [
    'ardo',
    'artel',
    'lotus',
    'bosch',
    'samsung',
    'lg',
    'beko',
    'gorenje',
    'hansa',
    'gefest',
    'shivaki',
  ];
  const publishedBrands = brands
    .filter((b) => b.active !== false)
    .sort((a, b) => {
      const aSlug = (a.slug || a.id).toLowerCase();
      const bSlug = (b.slug || b.id).toLowerCase();
      const aIdx = featuredOrder.indexOf(aSlug);
      const bIdx = featuredOrder.indexOf(bSlug);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

  const departmentGroups = [
    {
      id: 'large',
      name: 'Böyük Məişət Texnikası',
      icon: Package,
      filter: (c: CatalogCategory) =>
        ['washer', 'refrigerator', 'oven', 'dishwasher', 'freezer'].includes(c.id) ||
        ['paltaryuyanlar', 'soyuducular', 'sobalar', 'qabyuyanlar', 'dondurucular'].includes(
          c.slug || ''
        ) ||
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
        [
          'bisirme-panelleri',
          'aspiratorlar',
          'mikrodalgali-sobalar',
          'qurasdirilan-sobalar',
        ].includes(c.slug || '') ||
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
        [
          'airfryer',
          'vacuum_cleaner',
          'thermopot',
          'meat_grinder',
          'iron',
          'kettle',
          'blender',
        ].includes(c.id) ||
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
  const currentGroupCategories =
    activeGroup === 'all' ? activeCategories : activeCategories.filter(currentGroup.filter);
  const displayCategories =
    currentGroupCategories.length > 0 ? currentGroupCategories : activeCategories;

  // Active target category for optional showcase
  const activeTargetCategory =
    categories.find((c) => c.id === (hoveredCategoryId || displayCategories[0]?.id)) ||
    displayCategories[0] ||
    activeCategories[0];

  const matchingCategoryProducts = products
    .filter((p) => {
      const isDraft = (p as any).status === 'draft';
      const isPublished = (p as any).published !== false;
      if (isDraft || !isPublished) return false;

      if (!activeTargetCategory) return true;
      return (
        p.category === activeTargetCategory.id ||
        (p.categoryName &&
          p.categoryName.toLowerCase().includes(activeTargetCategory.name.toLowerCase()))
      );
    })
    .slice(0, 4);

  return (
    <div
      ref={menuRef}
      id="mega-menu-overlay"
      className="mega-menu-overlay header-nav-preview-panel"
      role="region"
      aria-label="Bütün Kateqoriyalar və Brendlər Mega Menyu"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        border: 'none',
        borderTop:
          theme?.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(0, 0, 0, 0.06)',
        borderBottom: 'none',
        boxShadow: 'none',
        padding: '18px 0 22px',
        maxHeight: 'min(90vh, 760px)',
        overflowY: 'auto',
      }}
    >
      <div className="catalog-container" style={{ padding: '0 clamp(24px, 4vw, 56px)' }}>
        {/* Top 3-Column Navigation Grid: Bölmələr (Left) | Kateqoriyalar (Center) | Rəsmi Brendlər (Right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '210px 1fr 175px',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Bölmələr (Departments) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              borderRight: `1px solid ${theme?.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              paddingRight: '16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: theme?.textMuted,
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
                  onMouseEnter={() => {
                    setActiveGroup(grp.id as any);
                    const firstCat =
                      grp.id === 'all'
                        ? activeCategories[0]
                        : activeCategories.filter(grp.filter)[0];
                    if (firstCat) setHoveredCategoryId(firstCat.id);
                  }}
                  onClick={() => {
                    onNavigate('catalog');
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    outline: 'none',
                    backgroundColor: isActive
                      ? theme?.mode === 'dark'
                        ? 'rgba(227, 30, 36, 0.16)'
                        : 'rgba(227, 30, 36, 0.08)'
                      : 'transparent',
                    color: isActive ? '#e31e24' : theme?.text,
                    fontSize: '12.5px',
                    fontWeight: isActive ? 750 : 550,
                    cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GrpIcon
                      size={14}
                      style={{
                        color: isActive
                          ? '#e31e24'
                          : theme?.mode === 'dark'
                            ? '#94a3b8'
                            : '#64748b',
                        flexShrink: 0,
                      }}
                    />
                    <span>{grp.name}</span>
                  </div>
                  <ChevronRight
                    size={12}
                    style={{
                      color: isActive ? '#e31e24' : theme?.mode === 'dark' ? '#64748b' : '#94a3b8',
                      transform: isActive ? 'translateX(2px)' : 'none',
                      opacity: isActive ? 1 : 0.6,
                      flexShrink: 0,
                    }}
                  />
                </button>
              );
            })}

          </div>

          {/* Center Column: Kateqoriyalar (Categories Grid) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minWidth: 0,
            }}
          >
            {/* Header row for active department */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: `1px solid ${theme?.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <currentGroup.icon size={15} style={{ color: '#e31e24' }} />
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: theme?.text,
                  }}
                >
                  {currentGroup.name}
                </span>
                <span style={{ fontSize: '11px', color: theme?.textMuted, fontWeight: 500 }}>
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
                <span>Bütün kataloqa bax</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Render categories for all department groups (active one visible) */}
            {departmentGroups.map((grp) => {
              const grpCats =
                grp.id === 'all' ? activeCategories : activeCategories.filter(grp.filter);
              const catsToRender = grpCats.length > 0 ? grpCats : activeCategories;

              return (
                <div
                  key={grp.id}
                  style={{
                    display: activeGroup === grp.id ? 'grid' : 'none',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '8px 10px',
                  }}
                >
                  {catsToRender.map((c) => {
                    const isHovered = (hoveredCategoryId || activeTargetCategory?.id) === c.id;
                    const count = products.filter(
                      (p) => p.category === c.id && p.status !== 'draft'
                    ).length;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onSelectCategory(c.id);
                          onClose();
                        }}
                        onMouseEnter={() => setHoveredCategoryId(c.id)}
                        className={`mega-menu-link ${isHovered ? 'is-active-category' : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: isHovered
                            ? theme?.mode === 'dark'
                              ? 'rgba(220, 38, 38, 0.16)'
                              : 'rgba(220, 38, 38, 0.08)'
                            : theme?.mode === 'dark'
                              ? 'rgba(30, 41, 59, 0.45)'
                              : 'rgba(241, 245, 249, 0.85)',
                          border: 'none',
                          outline: 'none',
                          color: isHovered ? '#e31e24' : theme?.text,
                          fontSize: '12.5px',
                          fontWeight: isHovered ? 750 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'left',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: isHovered
                                ? 'rgba(220, 38, 38, 0.14)'
                                : theme?.mode === 'dark'
                                  ? 'rgba(255,255,255,0.06)'
                                  : '#ffffff',
                              color: isHovered ? '#e31e24' : 'inherit',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                              flexShrink: 0,
                            }}
                          >
                            {getCategoryIcon(c.id, c.slug)}
                          </div>
                          <span
                            style={{
                              fontSize: '12.5px',
                              fontWeight: isHovered ? 750 : 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {c.name}
                          </span>
                        </div>

                        {count > 0 && (
                          <span
                            style={{
                              fontSize: '10.5px',
                              color: isHovered ? '#e31e24' : theme?.textMuted,
                              fontWeight: isHovered ? 700 : 500,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: isHovered
                                ? 'rgba(220, 38, 38, 0.12)'
                                : theme?.mode === 'dark'
                                  ? 'rgba(255,255,255,0.05)'
                                  : 'rgba(0,0,0,0.04)',
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

          {/* Right Column: Rəsmi Brendlər (Official Brands Snug Column) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              borderLeft: `1px solid ${theme?.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              paddingLeft: '16px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 2px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: theme?.textMuted,
                }}
              >
                Brendlər
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
                <ArrowRight size={10} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                width: '100%',
              }}
            >
              {publishedBrands.slice(0, 5).map((brand) => {
                const logoStyle = getBrandLogoStyle(brand.slug || brand.id);
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => {
                      onSelectBrand(brand.id);
                      onClose();
                    }}
                    className="mega-menu-link mega-menu-brand-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor:
                        theme?.mode === 'dark' ? '#ffffff' : 'rgba(248, 250, 252, 0.95)',
                      border: 'none',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      height: '40px',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        theme?.mode === 'dark' ? '#f8fafc' : '#ffffff';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        theme?.mode === 'dark' ? '#ffffff' : 'rgba(248, 250, 252, 0.95)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                    }}
                  >
                    {brand.logo ? (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ShimmerImage
                          src={brand.logo}
                          alt={brand.name}
                          spinnerSize={10}
                          objectFit="contain"
                          containerStyle={{
                            width: logoStyle.maxWidth,
                            height: logoStyle.maxHeight,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                            transform: logoStyle.scale ? `scale(${logoStyle.scale})` : undefined,
                          }}
                        />
                      </div>
                    ) : (
                      <span className="brand-logo-text-fallback brand-logo-text-fallback-small">
                        {brand.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Full-Width Bottom Showcase: Spanning 100% width from under Bölmələr to under Brendlər */}
        {products &&
          products.length > 0 &&
          activeTargetCategory &&
          matchingCategoryProducts.length > 0 && (
            <div
              className="mega-menu-products-showcase"
              style={{
                width: '100%',
                marginTop: '16px',
                paddingTop: '14px',
                borderTop: `1px solid ${theme?.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={14} style={{ color: '#e31e24' }} />
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: theme?.text,
                    }}
                  >
                    {activeTargetCategory.name} üzrə tövsiyə olunanlar
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory(activeTargetCategory.id);
                    onClose();
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                  }}
                >
                  <span>Bütün {activeTargetCategory.name} modellərinə bax</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              <div
                className="mega-menu-products-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(4, Math.max(1, matchingCategoryProducts.length))}, minmax(0, 1fr))`,
                  gap: '16px',
                  width: '100%',
                }}
              >
                {matchingCategoryProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="mega-menu-product-card-wrap"
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <FeaturedProductCard
                      product={prod}
                      theme={theme}
                      brand={brands.find((b) => b.id === prod.brandId)}
                      onSelect={(p) => {
                        if (onSelectProduct) {
                          onSelectProduct(p);
                        } else {
                          onNavigate('product', p.id);
                        }
                        onClose();
                      }}
                      onAddToCart={(p) => {
                        if (onSelectProduct) onSelectProduct(p);
                        onClose();
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};
