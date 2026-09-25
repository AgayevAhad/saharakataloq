import React, { useState } from 'react';
import {
  Layers,
  Tag,
  SlidersHorizontal,
  Sparkles,
  Zap,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Check,
} from 'lucide-react';
import { Brand, CatalogCategory, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { CategoryGlyph } from './CategoryGlyph';
import { ShimmerImage } from './ShimmerImage';

export interface CatalogSidebarFilterProps {
  categories: CatalogCategory[];
  brands?: Brand[];
  activeProducts: Product[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  selectedBrands?: string[];
  onToggleBrand?: (brandId: string) => void;
  showBrandSection?: boolean;
  minPrice: number;
  maxPrice: number;
  minAvailablePrice: number;
  maxAvailablePrice: number;
  onMinPriceChange: (price: number) => void;
  onMaxPriceChange: (price: number) => void;
  onlyDiscounted: boolean;
  onToggleDiscounted: (checked: boolean) => void;
  onlyWithVideo: boolean;
  onToggleWithVideo: (checked: boolean) => void;
  selectedEnergyClass: string;
  onSelectEnergyClass: (cls: string) => void;
  selectedMotorType: string;
  onSelectMotorType: (type: string) => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  theme: ThemeColors;
  isDarkMode: boolean;
}

const BRAND_LOGOS: Record<string, string> = {
  ardo: '/media/brands/ardo-logo.png',
  artel: '/media/brands/artel-logo.svg',
  lotus: '/media/brands/lotus-logo.png',
};

export const CatalogSidebarFilter: React.FC<CatalogSidebarFilterProps> = ({
  categories,
  brands = [],
  activeProducts,
  selectedCategory,
  onSelectCategory,
  selectedBrands = [],
  onToggleBrand,
  showBrandSection = true,
  minPrice,
  maxPrice,
  minAvailablePrice,
  maxAvailablePrice,
  onMinPriceChange,
  onMaxPriceChange,
  onlyDiscounted,
  onToggleDiscounted,
  onlyWithVideo,
  onToggleWithVideo,
  selectedEnergyClass,
  onSelectEnergyClass,
  selectedMotorType,
  onSelectMotorType,
  selectedColor,
  onSelectColor,
  hasActiveFilters,
  onResetFilters,
  theme,
  isDarkMode,
}) => {
  const [openSections, setOpenSections] = useState({
    categories: true,
    brands: true,
    price: true,
    specifications: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const cardBg = isDarkMode ? 'rgba(30, 41, 59, 0.45)' : '#ffffff';
  const cardBorder = 'transparent';
  const inputBg = isDarkMode ? '#1e293b' : '#f8fafc';
  const inputBorder = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';

  return (
    <div
      className="catalog-sidebar-filter-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '100%',
      }}
    >
      {/* Header with Active Filters & Reset */}
      {hasActiveFilters && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: isDarkMode ? 'rgba(227, 30, 36, 0.12)' : 'rgba(220, 38, 38, 0.06)',
            border: 'none',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, color: theme.primary }}>
            Filtrlər tətbiq olunub
          </span>
          <button
            type="button"
            onClick={onResetFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: theme.primary,
              border: 'none',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={12} />
            <span>Sıfırla</span>
          </button>
        </div>
      )}

      {/* 1. Kateqoriyalar / Bölmələr */}
      <div
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '16px',
          padding: '14px 16px',
        }}
      >
        <div
          onClick={() => toggleSection('categories')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <span
            style={{
              fontSize: '13.5px',
              fontWeight: 800,
              color: theme.text,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Layers size={15} color={theme.primary} />
            Bölmələr
          </span>
          {openSections.categories ? (
            <ChevronUp size={15} color={theme.textMuted} />
          ) : (
            <ChevronDown size={15} color={theme.textMuted} />
          )}
        </div>

        {openSections.categories && (
          <div
            style={{
              marginTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor:
                  selectedCategory === 'all'
                    ? isDarkMode
                      ? '#334155'
                      : '#f1f5f9'
                    : 'transparent',
                color: selectedCategory === 'all' ? theme.primary : theme.text,
                border: 'none',
                fontSize: '12.5px',
                fontWeight: selectedCategory === 'all' ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayoutGrid size={13} style={{ color: theme.primary }} />
                <span>Bütün Bölmələr</span>
              </span>
              <span style={{ fontSize: '11px', color: theme.textMuted }}>
                {activeProducts.length}
              </span>
            </button>

            {categories
              .map((cat) => {
                const count = activeProducts.filter(
                  (p) => p.category === cat.id && p.status !== 'draft'
                ).length;
                return { cat, count };
              })
              .filter((item) => item.count > 0)
              .map(({ cat, count }) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSelectCategory(cat.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: isSelected
                        ? isDarkMode
                          ? '#334155'
                          : '#f1f5f9'
                        : 'transparent',
                      color: isSelected ? theme.primary : theme.text,
                      border: 'none',
                      fontSize: '12.5px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CategoryGlyph id={cat.id} slug={cat.slug} compact plain />
                      <span>{cat.name}</span>
                    </span>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>{count}</span>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* 2. Rəsmi Brendlər (Logo + Checkbox + Multi-select) */}
      {showBrandSection && brands.length > 0 && onToggleBrand && (
        <div
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '16px',
            padding: '14px 16px',
          }}
        >
          <div
            onClick={() => toggleSection('brands')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <span
              style={{
                fontSize: '13.5px',
                fontWeight: 800,
                color: theme.text,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Tag size={15} color={theme.primary} />
              Brendlər
            </span>
            {openSections.brands ? (
              <ChevronUp size={15} color={theme.textMuted} />
            ) : (
              <ChevronDown size={15} color={theme.textMuted} />
            )}
          </div>

          {openSections.brands && (
            <div
              style={{
                marginTop: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {brands.map((brand) => {
                const count = activeProducts.filter(
                  (p) =>
                    p.brandId?.toLowerCase() === brand.id.toLowerCase() &&
                    p.status !== 'draft'
                ).length;
                const isChecked = selectedBrands
                  .map((b) => b.toLowerCase())
                  .includes(brand.id.toLowerCase());
                const logoSrc = BRAND_LOGOS[brand.id.toLowerCase()] || brand.logo;
                return (
                  <div
                    key={brand.id}
                    role="checkbox"
                    aria-checked={isChecked}
                    tabIndex={0}
                    onClick={() => onToggleBrand(brand.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleBrand(brand.id);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      backgroundColor: isChecked
                        ? isDarkMode
                          ? 'rgba(220, 38, 38, 0.16)'
                          : 'rgba(220, 38, 38, 0.08)'
                        : 'transparent',
                      border: 'none',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '5px',
                          border: `1.5px solid ${isChecked ? theme.primary : isDarkMode ? 'rgba(255,255,255,0.3)' : '#94a3b8'}`,
                          backgroundColor: isChecked ? theme.primary : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isChecked && <Check size={12} color="#ffffff" strokeWidth={3} />}
                      </div>
                      {logoSrc ? (
                        <div
                          style={{
                            width: '46px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                            borderRadius: '4px',
                            padding: '2px 4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          }}
                        >
                          <ShimmerImage
                            src={logoSrc}
                            alt={brand.name}
                            spinnerSize={8}
                            containerStyle={{ width: '100%', height: '100%' }}
                            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                          />
                        </div>
                      ) : null}
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: isChecked ? 800 : 600,
                          color: isChecked ? theme.primary : theme.text,
                        }}
                      >
                        {brand.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: isChecked ? theme.primary : theme.textMuted,
                        backgroundColor: isChecked
                          ? isDarkMode
                            ? 'rgba(220, 38, 38, 0.2)'
                            : 'rgba(220, 38, 38, 0.1)'
                          : 'transparent',
                        padding: '2px 6px',
                        borderRadius: '6px',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Qiymət Aralığı (AZN) */}
      <div
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '16px',
          padding: '14px 16px',
        }}
      >
        <div
          onClick={() => toggleSection('price')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <span
            style={{
              fontSize: '13.5px',
              fontWeight: 800,
              color: theme.text,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <SlidersHorizontal size={15} color={theme.primary} />
            Qiymət Aralığı (₼)
          </span>
          {openSections.price ? (
            <ChevronUp size={15} color={theme.textMuted} />
          ) : (
            <ChevronDown size={15} color={theme.textMuted} />
          )}
        </div>

        {openSections.price && (
          <div
            style={{
              marginTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: '10.5px',
                    color: theme.textMuted,
                    display: 'block',
                    marginBottom: '3px',
                  }}
                >
                  Min
                </label>
                <input
                  type="number"
                  value={minPrice}
                  min={minAvailablePrice}
                  max={maxPrice}
                  onChange={(e) => onMinPriceChange(Number(e.target.value))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    backgroundColor: inputBg,
                    border: `1px solid ${inputBorder}`,
                    color: theme.text,
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                />
              </div>
              <span style={{ color: theme.textMuted, paddingTop: '16px' }}>—</span>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: '10.5px',
                    color: theme.textMuted,
                    display: 'block',
                    marginBottom: '3px',
                  }}
                >
                  Maks
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  min={minPrice}
                  max={maxAvailablePrice}
                  onChange={(e) => onMaxPriceChange(Number(e.target.value))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    backgroundColor: inputBg,
                    border: `1px solid ${inputBorder}`,
                    color: theme.text,
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            {/* Quick Price Presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {[
                { label: '< 500 ₼', min: 0, max: 500 },
                { label: '500 - 1000 ₼', min: 500, max: 1000 },
                { label: '1000 - 2000 ₼', min: 1000, max: 2000 },
                { label: '2000 ₼ +', min: 2000, max: maxAvailablePrice },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onMinPriceChange(preset.min);
                    onMaxPriceChange(preset.max);
                  }}
                  style={{
                    padding: '4px 7px',
                    borderRadius: '6px',
                    backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
                    border: 'none',
                    color: theme.text,
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>



      {/* 5. Texniki Parametrlər & Funksiyalar */}
      <div
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '16px',
          padding: '14px 16px',
        }}
      >
        <div
          onClick={() => toggleSection('specifications')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <span
            style={{
              fontSize: '13.5px',
              fontWeight: 800,
              color: theme.text,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Zap size={15} color={theme.primary} />
            Funksiya & Xüsusiyyətlər
          </span>
          {openSections.specifications ? (
            <ChevronUp size={15} color={theme.textMuted} />
          ) : (
            <ChevronDown size={15} color={theme.textMuted} />
          )}
        </div>

        {openSections.specifications && (
          <div
            style={{
              marginTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Energy Class */}
            <div>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: theme.textMuted,
                  display: 'block',
                  marginBottom: '5px',
                }}
              >
                Enerji Sinfi
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {['all', 'A+++', 'A++', 'A+', 'A', 'B'].map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => onSelectEnergyClass(cls)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor:
                        selectedEnergyClass === cls
                          ? theme.primary
                          : isDarkMode
                            ? '#1e293b'
                            : '#f1f5f9',
                      color: selectedEnergyClass === cls ? '#ffffff' : theme.text,
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {cls === 'all' ? 'Hamısı' : cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Motor / Compressor Type */}
            <div>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: theme.textMuted,
                  display: 'block',
                  marginBottom: '5px',
                }}
              >
                Mühərrik / Texnologiya
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {[
                  { id: 'all', label: 'Hamısı' },
                  { id: 'inverter', label: 'İnverter' },
                  { id: 'standart', label: 'Standart' },
                ].map((motor) => (
                  <button
                    key={motor.id}
                    type="button"
                    onClick={() => onSelectMotorType(motor.id)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor:
                        selectedMotorType === motor.id
                          ? theme.primary
                          : isDarkMode
                            ? '#1e293b'
                            : '#f1f5f9',
                      color: selectedMotorType === motor.id ? '#ffffff' : theme.text,
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {motor.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: theme.textMuted,
                  display: 'block',
                  marginBottom: '5px',
                }}
              >
                Rəng & Dizayn
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {[
                  { id: 'all', label: 'Hamısı' },
                  { id: 'inox', label: 'İnox / Gümüşü' },
                  { id: 'qara', label: 'Qara' },
                  { id: 'ağ', label: 'Ağ' },
                  { id: 'bej', label: 'Bej / Krem' },
                ].map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => onSelectColor(col.id)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor:
                        selectedColor === col.id
                          ? theme.primary
                          : isDarkMode
                            ? '#1e293b'
                            : '#f1f5f9',
                      color: selectedColor === col.id ? '#ffffff' : theme.text,
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
