import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Globe,
  Tag,
  Boxes,
  Building2,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  X,
  Save,
  Sparkles,
} from 'lucide-react';
import { ThemeColors } from '../../../types/theme';
import { Brand, CatalogData } from '../../../types/product';
import { DEFAULT_COUNTRIES } from '../../../data/catalog';
import { ShimmerImage } from '../../ShimmerImage';
import { BrandRegistryStudio } from '../../BrandRegistryStudio';
import { BrandRailStudio } from '../../BrandRailStudio';

export interface BrandsSectionProps {
  theme: ThemeColors;
  csrfToken: string;
  showToast?: (msg: string) => void;
  showBrandRail?: boolean;
  onQuickOpenBrandRail?: () => void;
  allowedBrandIds?: string[];
  catalog?: CatalogData;
  onUpdateBrands?: (updater: Brand[] | ((prev: Brand[]) => Brand[])) => void;
  mode?: 'catalog' | 'site' | 'all';
  initialSubTab?: 'brands' | 'rail';
}

export const BrandsSection: React.FC<BrandsSectionProps> = ({
  theme,
  csrfToken,
  showToast = () => {},
  showBrandRail = false,
  allowedBrandIds,
  catalog,
  onUpdateBrands,
  mode = 'catalog',
  initialSubTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'brands' | 'rail'>(() => {
    if (showBrandRail || initialSubTab === 'rail') return 'rail';
    return 'brands';
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Segmented Sub-Tab Switcher */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px',
          background: theme.bgSecondary || 'rgba(0,0,0,0.04)',
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          width: 'fit-content',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('brands')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            borderRadius: 8,
            border: 'none',
            background: activeSubTab === 'brands' ? theme.primary : 'transparent',
            color: activeSubTab === 'brands' ? '#fff' : theme.textMuted,
            fontWeight: activeSubTab === 'brands' ? 600 : 500,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Building2 size={16} />
          <span>Brendlərin İdarə Edilməsi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rail')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            borderRadius: 8,
            border: 'none',
            background: activeSubTab === 'rail' ? theme.primary : 'transparent',
            color: activeSubTab === 'rail' ? '#fff' : theme.textMuted,
            fontWeight: activeSubTab === 'rail' ? 600 : 500,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Sparkles size={16} />
          <span>Hərəkətli Brend Lenti (Marquee)</span>
        </button>
      </div>

      {/* SubTab Content */}
      {activeSubTab === 'brands' ? (
        mode === 'site' && !catalog ? (
          <BrandRegistryStudio
            theme={theme}
            csrfToken={csrfToken}
            allowedBrandIds={allowedBrandIds}
          />
        ) : (
          <CatalogBrandsManager
            theme={theme}
            catalog={catalog}
            onUpdateBrands={onUpdateBrands}
            showToast={showToast}
            allowedBrandIds={allowedBrandIds}
          />
        )
      ) : (
        <BrandRailStudio
          theme={theme}
          csrfToken={csrfToken}
          showToast={showToast}
          allowedBrandIds={allowedBrandIds}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* DEDICATED CATALOG BRANDS MANAGER (YAYIMDA / TEZLİKLƏ / REDAKTƏ)            */
/* -------------------------------------------------------------------------- */

interface CatalogBrandsManagerProps {
  theme: ThemeColors;
  catalog?: CatalogData;
  onUpdateBrands?: (updater: Brand[] | ((prev: Brand[]) => Brand[])) => void;
  showToast: (msg: string) => void;
  allowedBrandIds?: string[];
}

const CatalogBrandsManager: React.FC<CatalogBrandsManagerProps> = ({
  theme,
  catalog,
  onUpdateBrands,
  showToast,
  allowedBrandIds,
}) => {
  const brandsList: Brand[] = useMemo(() => {
    const raw = catalog?.brands || [];
    if (allowedBrandIds && allowedBrandIds.length > 0) {
      const allowedLower = allowedBrandIds.map((id) => id.toLowerCase());
      return raw.filter((b) => allowedLower.includes((b.id || b.slug).toLowerCase()));
    }
    return raw;
  }, [catalog?.brands, allowedBrandIds]);

  const productsList = useMemo(() => catalog?.products || [], [catalog?.products]);

  const [searchQuery, setSearchQuery] = useState('');
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Filtered brands
  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brandsList;
    const q = searchQuery.toLowerCase().trim();
    return brandsList.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        (b.originCountry && b.originCountry.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q))
    );
  }, [brandsList, searchQuery]);

  // Counts
  const totalCount = brandsList.length;
  const activeCount = brandsList.filter((b) => b.active).length;
  const comingSoonCount = brandsList.filter((b) => b.comingSoon).length;

  const handleToggleActive = (brandId: string, currentActive: boolean) => {
    if (!onUpdateBrands) return;
    const newStatus = !currentActive;
    onUpdateBrands((prev) => prev.map((b) => (b.id === brandId ? { ...b, active: newStatus } : b)));
    const target = brandsList.find((b) => b.id === brandId);
    showToast(
      `"${target?.name || brandId}" brendi ${newStatus ? 'yayımda aktiv edildi ✅' : 'deaktiv edildi ⏸️'}`
    );
  };

  const handleToggleComingSoon = (brandId: string, currentComingSoon?: boolean) => {
    if (!onUpdateBrands) return;
    const newStatus = !currentComingSoon;
    onUpdateBrands((prev) =>
      prev.map((b) => (b.id === brandId ? { ...b, comingSoon: newStatus } : b))
    );
    const target = brandsList.find((b) => b.id === brandId);
    showToast(
      `"${target?.name || brandId}" brendi ${newStatus ? '"Tezliklə" statusuna keçirildi ⏳' : 'Tam əlçatan yayıma keçirildi 🚀'}`
    );
  };

  const handleSaveBrandForm = (brandData: Brand) => {
    if (!onUpdateBrands) return;
    if (isCreatingNew) {
      // Check duplicate ID
      const exists = brandsList.some((b) => b.id === brandData.id || b.slug === brandData.slug);
      if (exists) {
        showToast('Bu identifikator və ya slug ilə brend artıq mövcuddur.');
        return;
      }
      onUpdateBrands((prev) => [...prev, brandData]);
      showToast(`"${brandData.name}" brendi uğurla əlavə edildi!`);
    } else {
      onUpdateBrands((prev) => prev.map((b) => (b.id === brandData.id ? brandData : b)));
      showToast(`"${brandData.name}" brend məlumatları yeniləndi!`);
    }
    setEditingBrand(null);
    setIsCreatingNew(false);
  };

  const handleDeleteBrand = (brandId: string) => {
    const attachedCount = productsList.filter((p) => p.brandId === brandId).length;
    if (attachedCount > 0) {
      alert(
        `Bu brendə bağlı ${attachedCount} ədəd məhsul var! Əvvəlcə həmin məhsulları başqa brendə köçürün və ya silin.`
      );
      return;
    }
    const target = brandsList.find((b) => b.id === brandId);
    if (!confirm(`"${target?.name || brandId}" brendini silmək istədiyinizdən əminsiniz?`)) return;

    if (onUpdateBrands) {
      onUpdateBrands((prev) => prev.filter((b) => b.id !== brandId));
      showToast(`"${target?.name || brandId}" brendi silindi.`);
    }
  };

  const startCreateBrand = () => {
    setEditingBrand({
      id: '',
      name: '',
      slug: '',
      originCountry: 'Türkiyə',
      manufacturingCountries: [],
      description: '',
      logo: '',
      active: true,
      comingSoon: false,
      sortOrder: brandsList.length + 1,
    });
    setIsCreatingNew(true);
  };

  return (
    <div
      className="catalog-brands-manager"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* 1. TOP STATS BAR */}
      <div
        className="catalog-brands-stats-bar"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
        }}
      >
        <div
          className="stat-card"
          style={{
            background: theme.bgCard,
            borderColor: theme.border,
            padding: '14px 18px',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: theme.textMuted, fontWeight: 700 }}>
              CƏMİ BRENDLƏR
            </span>
            <Boxes size={18} color={theme.primary} />
          </div>
          <b style={{ fontSize: '24px', color: theme.text, marginTop: '4px' }}>{totalCount}</b>
          <small style={{ color: theme.textMuted }}>Kataloqda qeydiyyatlı</small>
        </div>

        <div
          className="stat-card"
          style={{
            background: theme.bgCard,
            borderColor: theme.border,
            padding: '14px 18px',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
              YAYIMDA (AKTİV)
            </span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <b style={{ fontSize: '24px', color: '#10b981', marginTop: '4px' }}>{activeCount}</b>
          <small style={{ color: theme.textMuted }}>Müştərilərə görünən</small>
        </div>

        <div
          className="stat-card"
          style={{
            background: theme.bgCard,
            borderColor: theme.border,
            padding: '14px 18px',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700 }}>
              TEZLİKLƏ (COMING SOON)
            </span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <b style={{ fontSize: '24px', color: '#f59e0b', marginTop: '4px' }}>{comingSoonCount}</b>
          <small style={{ color: theme.textMuted }}>Anons rejimində</small>
        </div>

        <div
          className="stat-card"
          style={{
            background: theme.bgCard,
            borderColor: theme.border,
            padding: '14px 18px',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: theme.textMuted, fontWeight: 700 }}>
              CƏMİ MƏHSUL
            </span>
            <Tag size={18} color={theme.primary} />
          </div>
          <b style={{ fontSize: '24px', color: theme.text, marginTop: '4px' }}>
            {productsList.length}
          </b>
          <small style={{ color: theme.textMuted }}>Brendlərə bağlı modellər</small>
        </div>
      </div>

      {/* 2. SEARCH & ACTION TOOLBAR */}
      <div
        className="admin-list-actions"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: theme.bgCard,
          padding: '12px 16px',
          borderRadius: '12px',
          border: `1px solid ${theme.border}`,
        }}
      >
        <div
          className="admin-search"
          style={{
            background: theme.bg,
            borderColor: theme.border,
            flex: '1 1 260px',
            maxWidth: '360px',
          }}
        >
          <Search size={15} color={theme.textMuted} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Brend adı və ya ölkə ilə axtar..."
            style={{ color: theme.text, fontSize: '12px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="manager-add"
            onClick={startCreateBrand}
            style={{
              background: theme.primary,
              color: '#ffffff',
              padding: '9px 16px',
              borderRadius: '9px',
              fontWeight: 750,
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Yeni Brend Əlavə Et
          </button>
        </div>
      </div>

      {/* 3. BRANDS GRID */}
      <div
        className="catalog-brands-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {filteredBrands.map((brand) => {
          const brandProdCount = productsList.filter((p) => p.brandId === brand.id).length;

          return (
            <div
              key={brand.id}
              className="catalog-brand-card"
              style={{
                background: theme.bgCard,
                borderColor: theme.border,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Card Top: Logo & Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '74px',
                    height: '52px',
                    borderRadius: '10px',
                    background:
                      theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    padding: '4px',
                  }}
                >
                  {brand.logo ? (
                    <ShimmerImage
                      src={brand.logo}
                      alt={brand.name}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '13px', fontWeight: 800, color: theme.textMuted }}>
                      {brand.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}
                  >
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: theme.text }}>
                      {brand.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: theme.bg,
                        color: theme.textMuted,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      {brand.slug}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginTop: '4px',
                      fontSize: '12px',
                      color: theme.textMuted,
                    }}
                  >
                    <Globe size={13} color={theme.primary} />
                    <span>{brand.originCountry || 'Mənşə qeyd edilməyib'}</span>
                    <span>•</span>
                    <span style={{ fontWeight: 700, color: theme.text }}>
                      {brandProdCount} məhsul
                    </span>
                  </div>
                </div>
              </div>

              {/* Manufacturing Countries & Description */}
              {brand.manufacturingCountries && brand.manufacturingCountries.length > 0 && (
                <div
                  style={{
                    fontSize: '11px',
                    color: theme.textMuted,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>İstehsal:</span>
                  {brand.manufacturingCountries.map((c, cIdx) => (
                    <span
                      key={cIdx}
                      style={{
                        background: theme.bg,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {brand.description && (
                <p
                  style={{
                    fontSize: '12px',
                    color: theme.textMuted,
                    margin: 0,
                    lineHeight: 1.4,
                    opacity: 0.85,
                  }}
                >
                  {brand.description}
                </p>
              )}

              {/* Status Toggles Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: theme.bg,
                  borderRadius: '10px',
                  border: `1px solid ${theme.border}`,
                  gap: '8px',
                }}
              >
                {/* 1. Yayımda (Aktiv) Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(brand.id, brand.active)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    borderRadius: '6px',
                  }}
                  title={brand.active ? 'Brendi deaktiv et (gizlə)' : 'Brendi yayımda aktiv et'}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '18px',
                      borderRadius: '10px',
                      background: brand.active ? '#10b981' : 'rgba(127,127,127,0.3)',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: '2px',
                        left: brand.active ? '16px' : '2px',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: brand.active ? '#10b981' : theme.textMuted,
                    }}
                  >
                    {brand.active ? 'Yayımda' : 'Deaktiv'}
                  </span>
                </button>

                {/* 2. Tezliklə (Coming Soon) Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleComingSoon(brand.id, brand.comingSoon)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    borderRadius: '6px',
                  }}
                  title={
                    brand.comingSoon
                      ? 'Tezliklə rejimindən çıxar (Tam yayım)'
                      : '"Tezliklə" (Coming Soon) rejiminə keçir'
                  }
                >
                  <div
                    style={{
                      width: '32px',
                      height: '18px',
                      borderRadius: '10px',
                      background: brand.comingSoon ? '#f59e0b' : 'rgba(127,127,127,0.3)',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: '2px',
                        left: brand.comingSoon ? '16px' : '2px',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: brand.comingSoon ? '#f59e0b' : theme.textMuted,
                    }}
                  >
                    {brand.comingSoon ? 'Tezliklə' : 'Yayımda'}
                  </span>
                </button>
              </div>

              {/* Bottom Actions Strip */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: `1px solid ${theme.border}`,
                  paddingTop: '10px',
                  marginTop: 'auto',
                }}
              >
                <span style={{ fontSize: '11px', color: theme.textMuted }}>
                  Sıra: <b>№{brand.sortOrder || 1}</b>
                </span>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBrand(brand);
                      setIsCreatingNew(false);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Brendi redaktə et"
                  >
                    <Pencil size={12} /> Redaktə
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteBrand(brand.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Brendi sil"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {!filteredBrands.length && (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px 20px',
              background: theme.bgCard,
              borderRadius: '14px',
              border: `1px solid ${theme.border}`,
              color: theme.textMuted,
            }}
          >
            <Boxes
              size={36}
              color={theme.textMuted}
              style={{ marginBottom: '10px', opacity: 0.5 }}
            />
            <h4 style={{ color: theme.text, margin: '0 0 6px' }}>Heç bir brend tapılmadı</h4>
            <p style={{ margin: 0, fontSize: '13px' }}>
              Axtarış sorğunuza uyğun kataloq brendi mövcud deyil.
            </p>
          </div>
        )}
      </div>

      {/* 4. BRAND EDIT / CREATE MODAL */}
      {editingBrand && (
        <BrandEditModal
          theme={theme}
          brand={editingBrand}
          isNew={isCreatingNew}
          onSave={handleSaveBrandForm}
          onClose={() => {
            setEditingBrand(null);
            setIsCreatingNew(false);
          }}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* BRAND CREATE / EDIT MODAL COMPONENT                                        */
/* -------------------------------------------------------------------------- */

interface BrandEditModalProps {
  theme: ThemeColors;
  brand: Brand;
  isNew: boolean;
  onSave: (brand: Brand) => void;
  onClose: () => void;
}

const BrandEditModal: React.FC<BrandEditModalProps> = ({
  theme,
  brand,
  isNew,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState<Brand>({ ...brand });
  const [mfgCountriesInput, setMfgCountriesInput] = useState<string>(
    (brand.manufacturingCountries || []).join(', ')
  );

  const handleNameChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      name: val,
      slug: isNew && !prev.slug ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-') : prev.slug,
      id: isNew && !prev.id ? val.toLowerCase().replace(/[^a-z0-9]+/g, '') : prev.id,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Brend adı daxil edilməlidir!');
      return;
    }
    if (!form.id.trim()) {
      alert('Brend identifikatoru (ID) daxil edilməlidir!');
      return;
    }

    const mfgArray = mfgCountriesInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    onSave({
      ...form,
      manufacturingCountries: mfgArray,
      sortOrder: Number(form.sortOrder) || 1,
    });
  };

  return (
    <div
      className="admin-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
      }}
    >
      <div
        className="admin-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.bgCard,
          borderColor: theme.border,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          color: theme.text,
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
              {isNew ? '✨ Yeni Kataloq Brendi Əlavə Et' : `✏️ Brendi Redaktə Et: ${brand.name}`}
            </h2>
            <p style={{ fontSize: '12px', color: theme.textMuted, margin: '4px 0 0' }}>
              Brendin adı, loqosu, mənşəyi və yayım statuslarını tənzimləyin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: theme.textMuted,
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {/* Brand Name & ID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{ fontSize: '12px', fontWeight: 750, display: 'block', marginBottom: '6px' }}
              >
                Brend Adı *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Məs: ARDO, LOTUS"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.border}`,
                  background: theme.bg,
                  color: theme.text,
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label
                style={{ fontSize: '12px', fontWeight: 750, display: 'block', marginBottom: '6px' }}
              >
                Brend Kodu (ID / Slug) *
              </label>
              <input
                type="text"
                required
                disabled={!isNew}
                value={form.id}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    id: e.target.value.toLowerCase(),
                    slug: e.target.value.toLowerCase(),
                  }))
                }
                placeholder="ardo, lotus"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.border}`,
                  background: !isNew ? 'rgba(127,127,127,0.1)' : theme.bg,
                  color: theme.text,
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          {/* Origin Country & Manufacturing Countries */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{ fontSize: '12px', fontWeight: 750, display: 'block', marginBottom: '6px' }}
              >
                Mənşə Ölkəsi *
              </label>
              <select
                value={form.originCountry}
                onChange={(e) => setForm((p) => ({ ...p, originCountry: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.border}`,
                  background: theme.bg,
                  color: theme.text,
                  fontSize: '13px',
                }}
              >
                {DEFAULT_COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
                {!DEFAULT_COUNTRIES.includes(form.originCountry) && form.originCountry && (
                  <option value={form.originCountry}>{form.originCountry}</option>
                )}
              </select>
            </div>

            <div>
              <label
                style={{ fontSize: '12px', fontWeight: 750, display: 'block', marginBottom: '6px' }}
              >
                İstehsalçı Ölkələr (vergüllə)
              </label>
              <input
                type="text"
                value={mfgCountriesInput}
                onChange={(e) => setMfgCountriesInput(e.target.value)}
                placeholder="Türkiyə, Çin, İtaliya"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.border}`,
                  background: theme.bg,
                  color: theme.text,
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label
              style={{ fontSize: '12px', fontWeight: 750, display: 'block', marginBottom: '6px' }}
            >
              Loqo Fayl Yolu / URL
            </label>
            <input
              type="text"
              value={form.logo || ''}
              onChange={(e) => setForm((p) => ({ ...p, logo: e.target.value }))}
              placeholder="/media/brands/ardo-logo.png"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                background: theme.bg,
                color: theme.text,
                fontSize: '13px',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              style={{ fontSize: '12px', fontWeight: 750, display: 'block', marginBottom: '6px' }}
            >
              Qısa Təsvir / Şüar
            </label>
            <textarea
              rows={2}
              value={form.description || ''}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="İtaliya istehsalı premium məişət avadanlıqları"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                background: theme.bg,
                color: theme.text,
                fontSize: '13px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Sort Order & Status Flags */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 1fr',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <div>
              <label
                style={{ fontSize: '12px', fontWeight: 750, display: 'block', marginBottom: '6px' }}
              >
                Sıra №
              </label>
              <input
                type="number"
                value={form.sortOrder || 1}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) || 1 }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.border}`,
                  background: theme.bg,
                  color: theme.text,
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: theme.primary }}
                />
                <span style={{ color: form.active ? '#10b981' : theme.textMuted }}>
                  {form.active ? '✅ Yayımda Aktiv' : '⏸️ Deaktiv'}
                </span>
              </label>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(form.comingSoon)}
                  onChange={(e) => setForm((p) => ({ ...p, comingSoon: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }}
                />
                <span style={{ color: form.comingSoon ? '#f59e0b' : theme.textMuted }}>
                  {form.comingSoon ? '⏳ Tezliklə' : '🚀 Əlçatan'}
                </span>
              </label>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '12px',
              paddingTop: '16px',
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'transparent',
                border: `1px solid ${theme.border}`,
                color: theme.text,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Ləğv et
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                background: theme.primary,
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 750,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Save size={15} /> Yadda saxla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
