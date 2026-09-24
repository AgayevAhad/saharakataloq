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

export const CatalogSidebarFilter: React.FC<CatalogSidebarFilterProps> = ({
  categories,
  brands = [],
  activeProducts,
  selectedCategory,
  onSelectCategory,
  selectedBrands = [],
  onToggleBrand,
  showBrandSection = false,
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
    brands: false,
    price: true,
    special: true,
    specifications: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const cardBg = isDarkMode ? 'rgba(30, 41, 59, 0.45)' : '#ffffff';
  const cardBorder = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const inputBg = isDarkMode ? '#1e293b' : '#f8fafc';
  const inputBorder = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1';

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
            border: `1px solid ${isDarkMode ? 'rgba(227, 30, 36, 0.25)' : 'rgba(220, 38, 38, 0.15)'}`,
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

            {categories.map((cat) => {
              const count = activeProducts.filter((p) => p.category === cat.id).length;
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

      {/* 2. Rəsmi Brendlər (Optional if multiple brands) */}
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
              Rəsmi Brendlər
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
                const count = activeProducts.filter((p) => p.brandId === brand.id).length;
                const isChecked = selectedBrands.includes(brand.id);
                return (
                  <div
                    key={brand.id}
                    role="checkbox"
                    aria-checked={isChecked}
                    tabIndex={0}
                    onClick={() => onToggleBrand(brand.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: isChecked
                        ? isDarkMode
                          ? 'rgba(227, 30, 36, 0.1)'
                          : 'rgba(227, 30, 36, 0.05)'
                        : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          border: `2px solid ${isChecked ? theme.primary : isDarkMode ? 'rgba(255,255,255,0.2)' : '#cbd5e1'}`,
                          backgroundColor: isChecked ? theme.primary : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isChecked && <Check size={11} color="#ffffff" strokeWidth={3} />}
                      </div>
                      {brand.logo ? (
                        <ShimmerImage
                          src={brand.logo}
                          alt={brand.name}
                          spinnerSize={8}
                          containerStyle={{ width: '32px', height: '16px' }}
                          style={{ objectFit: 'contain' }}
                        />
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 800, color: theme.text }}>
                          {brand.name}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '12.5px',
                          fontWeight: isChecked ? 700 : 500,
                          color: theme.text,
                        }}
                      >
                        {brand.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>({count})</span>
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
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
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

      {/* 4. Xüsusi Təkliflər (Endirimlər & Video) */}
      <div
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '16px',
          padding: '14px 16px',
        }}
      >
        <div
          onClick={() => toggleSection('special')}
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
            <Sparkles size={15} color={theme.primary} />
            Xüsusi Təkliflər
          </span>
          {openSections.special ? (
            <ChevronUp size={15} color={theme.textMuted} />
          ) : (
            <ChevronDown size={15} color={theme.textMuted} />
          )}
        </div>

        {openSections.special && (
          <div
            style={{
              marginTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: 600,
                color: theme.text,
              }}
            >
              <input
                type="checkbox"
                checked={onlyDiscounted}
                onChange={(e) => onToggleDiscounted(e.target.checked)}
                style={{ accentColor: theme.primary, width: '15px', height: '15px' }}
              />
              <span>Yalnız endirimli modellər</span>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: 600,
                color: theme.text,
              }}
            >
              <input
                type="checkbox"
                checked={onlyWithVideo}
                onChange={(e) => onToggleWithVideo(e.target.checked)}
                style={{ accentColor: theme.primary, width: '15px', height: '15px' }}
              />
              <span>Video icmalı olanlar</span>
            </label>
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
                      border: `1px solid ${selectedEnergyClass === cls ? theme.primary : isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
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
                      border: `1px solid ${selectedMotorType === motor.id ? theme.primary : isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
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
                      border: `1px solid ${selectedColor === col.id ? theme.primary : isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
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
