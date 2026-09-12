import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Save,
  Rocket,
  MoveUp,
  MoveDown,
  Trash2,
  Plus,
  Laptop,
  Smartphone,
} from 'lucide-react';
import { Brand, BrandRailData, BrandRailItem, BrandRailSettings } from '../types/product';
import { ThemeColors } from '../types/theme';
import { AnimatedBrandRail } from './AnimatedBrandRail';
import { catalogApi } from '../services/catalogApi';

interface BrandRailStudioProps {
  initialRail?: BrandRailData | null;
  allBrands?: Brand[];
  theme: ThemeColors;
  csrfToken?: string;
  onSaveDraft?: (
    settings: BrandRailSettings,
    items: BrandRailItem[],
    etag?: string
  ) => Promise<{ etag?: string }>;
  onPublish?: () => Promise<void>;
  onRollback?: (version: number) => Promise<void>;
  showToast: (msg: string) => void;
}

export const BrandRailStudio: React.FC<BrandRailStudioProps> = ({
  initialRail,
  allBrands = [],
  theme,
  csrfToken,
  onSaveDraft,
  onPublish,
  onRollback: _onRollback,
  showToast,
}) => {
  const safeBrands = Array.isArray(allBrands) ? allBrands : [];

  const [settings, setSettings] = useState<BrandRailSettings>(() => {
    return (
      initialRail?.settings || {
        id: 'brand_rail_default',
        enabled: true,
        title: 'Brendlər',
        animationEnabled: true,
        speedSeconds: 30,
        direction: 'left',
        pauseOnHover: true,
        edgeFade: true,
        cardSize: 'md',
        sectionOrder: 1,
        themeVariant: 'neutral',
        version: 1,
      }
    );
  });

  const [items, setItems] = useState<BrandRailItem[]>(() => {
    if (initialRail?.items && initialRail.items.length > 0) {
      return initialRail.items;
    }
    return safeBrands.map((b, idx) => ({
      id: `rail_${b.id || b.slug}`,
      brandId: b.id || b.slug,
      brandName: b.name,
      brandSlug: b.slug,
      brandLogo: b.logo || '',
      originCountry: b.originCountry,
      enabled: true,
      sortOrder: idx + 1,
      optionalDisplayLabel: null,
      linkEnabled: true,
      publishedProductCount: 0,
      hasPublishedProducts: false,
    }));
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandToAdd, setSelectedBrandToAdd] = useState('');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [etag, setEtag] = useState<string | undefined>(
    initialRail?.settings?.version ? `"br-default-v${initialRail.settings.version}"` : undefined
  );
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'settings' | 'preview'>('items');

  useEffect(() => {
    if (!initialRail || !initialRail.items || initialRail.items.length === 0) {
      catalogApi
        .getAdminBrandRail()
        .then((res) => {
          if (res) {
            if (res.settings) setSettings(res.settings);
            if (res.items && res.items.length > 0) setItems(res.items);
            if (res.settings?.version) setEtag(`"br-default-v${res.settings.version}"`);
          }
        })
        .catch(() => {});
    }
  }, [initialRail]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (it) =>
        it.brandName.toLowerCase().includes(q) ||
        (it.optionalDisplayLabel && it.optionalDisplayLabel.toLowerCase().includes(q)) ||
        it.brandSlug.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Available brands to add
  const availableBrandsToAdd = useMemo(() => {
    const existingBrandIds = new Set(items.map((it) => it.brandId));
    return safeBrands.filter((b) => !existingBrandIds.has(b.id || b.slug));
  }, [safeBrands, items]);

  const handleToggleItem = (brandId: string) => {
    setItems((prev) =>
      prev.map((it) => (it.brandId === brandId ? { ...it, enabled: !it.enabled } : it))
    );
  };

  const handleToggleLink = (brandId: string) => {
    setItems((prev) =>
      prev.map((it) => (it.brandId === brandId ? { ...it, linkEnabled: !it.linkEnabled } : it))
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    // Re-assign sortOrder
    const reordered = next.map((it, idx) => ({ ...it, sortOrder: idx + 1 }));
    setItems(reordered);
  };

  const handleRemoveItem = (brandId: string) => {
    setItems((prev) => prev.filter((it) => it.brandId !== brandId));
  };

  const handleAddBrand = () => {
    if (!selectedBrandToAdd) return;
    const brand = allBrands.find((b) => (b.id || b.slug) === selectedBrandToAdd);
    if (!brand) return;
    const newItem: BrandRailItem = {
      id: `rail_${brand.id || brand.slug}_${Date.now()}`,
      brandId: brand.id || brand.slug,
      brandName: brand.name,
      brandSlug: brand.slug,
      brandLogo: brand.logo || '',
      originCountry: brand.originCountry,
      enabled: true,
      sortOrder: items.length + 1,
      optionalDisplayLabel: null,
      linkEnabled: true,
      publishedProductCount: 0,
      hasPublishedProducts: false,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedBrandToAdd('');
    showToast(`"${brand.name}" lentiye əlavə edildi.`);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (onSaveDraft) {
        const res = await onSaveDraft(settings, items, etag);
        if (res?.etag) setEtag(res.etag);
      } else if (csrfToken) {
        const sRes = await catalogApi.updateBrandRailSettings(settings, csrfToken, etag);
        await catalogApi.updateBrandRailItems(items, csrfToken);
        if (sRes?.settings?.version) setEtag(`"br-default-v${sRes.settings.version}"`);
      }
      showToast('Brend lenti qaralaması uğurla yadda saxlanıldı.');
    } catch (err: any) {
      showToast(err.message || 'Yadda saxlanarkən xəta baş verdi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishClick = async () => {
    const confirmed = window.confirm(
      `Brend lentində ${items.filter((i) => i.enabled).length} aktiv brend var. Dəyişiklikləri canlı saytda nəşr etmək istəyirsiniz?`
    );
    if (!confirmed) return;

    try {
      setIsPublishing(true);
      if (onSaveDraft) {
        await onSaveDraft(settings, items, etag);
      } else if (csrfToken) {
        await catalogApi.updateBrandRailSettings(settings, csrfToken, etag);
        await catalogApi.updateBrandRailItems(items, csrfToken);
      }
      if (onPublish) {
        await onPublish();
      } else if (csrfToken) {
        await catalogApi.publishBrandRail(csrfToken);
      }
      showToast('Brend lenti uğurla canlı saytda nəşr edildi!');
    } catch (err: any) {
      showToast(err.message || 'Nəşr zamanı xəta baş verdi.');
    } finally {
      setIsPublishing(false);
    }
  };

  const previewData: BrandRailData = {
    enabled: settings.enabled,
    settings,
    items,
  };

  return (
    <div className="brand-rail-studio" style={{ padding: '20px', color: theme.text }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.border}`,
          paddingBottom: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#dc2626" />
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
              Brend Lenti İdarəetməsi
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: theme.textSecondary, margin: '4px 0 0 0' }}>
            Vitrində fasiləsiz hərəkət edən brend loqoları və adlarının lenti
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="admin-action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bgSecondary,
              color: theme.text,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            <Save size={15} />
            <span>{isSaving ? 'Saxlanılır...' : 'Qaralamanı Saxla'}</span>
          </button>

          <button
            type="button"
            onClick={handlePublishClick}
            disabled={isPublishing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              cursor: isPublishing ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
            }}
          >
            <Rocket size={15} />
            <span>{isPublishing ? 'Nəşr edilir...' : 'Sayta Nəşr Et'}</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: `1px solid ${theme.border}`,
          paddingBottom: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('items')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeSubTab === 'items' ? '#dc2626' : 'transparent',
            color: activeSubTab === 'items' ? '#fff' : theme.text,
            fontWeight: 650,
            cursor: 'pointer',
          }}
        >
          Brendlər ({items.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('settings')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeSubTab === 'settings' ? '#dc2626' : 'transparent',
            color: activeSubTab === 'settings' ? '#fff' : theme.text,
            fontWeight: 650,
            cursor: 'pointer',
          }}
        >
          Animasiya & Tənzimləmələr
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('preview')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeSubTab === 'preview' ? '#dc2626' : 'transparent',
            color: activeSubTab === 'preview' ? '#fff' : theme.text,
            fontWeight: 650,
            cursor: 'pointer',
          }}
        >
          Canlı Önizləmə
        </button>
      </div>

      {/* Tab 1: Items List & Reorder */}
      {activeSubTab === 'items' && (
        <div>
          {/* Add brand bar */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '16px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: theme.textSecondary,
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Lentdəki brendləri axtar..."
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.bgSecondary,
                  color: theme.text,
                  fontSize: '13px',
                }}
              />
            </div>

            {availableBrandsToAdd.length > 0 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedBrandToAdd}
                  onChange={(e) => setSelectedBrandToAdd(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.bgSecondary,
                    color: theme.text,
                    fontSize: '13px',
                  }}
                >
                  <option value="">Lentə yeni brend seç...</option>
                  {availableBrandsToAdd.map((b) => (
                    <option key={b.id || b.slug} value={b.id || b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddBrand}
                  disabled={!selectedBrandToAdd}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: selectedBrandToAdd ? '#dc2626' : 'rgba(127,127,127,0.3)',
                    color: '#fff',
                    cursor: selectedBrandToAdd ? 'pointer' : 'not-allowed',
                    fontWeight: 650,
                  }}
                >
                  <Plus size={15} />
                  <span>Əlavə et</span>
                </button>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div
            style={{
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: theme.bgSecondary,
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${theme.border}`,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    color: theme.textSecondary,
                  }}
                >
                  <th style={{ padding: '12px 16px', width: '60px' }}>Sıra</th>
                  <th style={{ padding: '12px 16px' }}>Brend</th>
                  <th style={{ padding: '12px 16px', width: '100px' }}>Loqo</th>
                  <th style={{ padding: '12px 16px', width: '120px' }}>Məhsul Sayı</th>
                  <th style={{ padding: '12px 16px', width: '100px' }}>Keçid</th>
                  <th style={{ padding: '12px 16px', width: '100px' }}>Status</th>
                  <th style={{ padding: '12px 16px', width: '120px', textAlign: 'right' }}>
                    Əməliyyatlar
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      fontSize: '13.5px',
                      opacity: item.enabled ? 1 : 0.5,
                    }}
                  >
                    <td style={{ padding: '10px 16px', fontWeight: 700 }}>{index + 1}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontWeight: 750 }}>{item.brandName}</span>
                      {item.originCountry && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: theme.textSecondary,
                            marginLeft: '8px',
                          }}
                        >
                          ({item.originCountry})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {item.brandLogo ? (
                        <div
                          style={{
                            width: '48px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#fff',
                            borderRadius: '4px',
                            padding: '2px',
                          }}
                        >
                          <img
                            src={item.brandLogo}
                            alt={item.brandName}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: theme.textSecondary }}>Yoxdur</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span
                        style={{
                          fontSize: '11.5px',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          backgroundColor: item.hasPublishedProducts
                            ? 'rgba(22, 163, 74, 0.15)'
                            : 'rgba(127, 127, 127, 0.12)',
                          color: item.hasPublishedProducts ? '#16a34a' : theme.textSecondary,
                          fontWeight: 700,
                        }}
                      >
                        {item.publishedProductCount} public
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleLink(item.brandId)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: `1px solid ${theme.border}`,
                          backgroundColor: item.linkEnabled
                            ? 'rgba(22, 163, 74, 0.15)'
                            : 'transparent',
                          color: item.linkEnabled ? '#16a34a' : theme.textSecondary,
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {item.linkEnabled ? 'Aktiv' : 'Deaktiv'}
                      </button>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleItem(item.brandId)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: item.enabled ? '#dc2626' : 'rgba(127,127,127,0.2)',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {item.enabled ? 'Görünür' : 'Gizli'}
                      </button>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          title="Yuxarı çək"
                          style={{
                            padding: '4px',
                            borderRadius: '4px',
                            border: `1px solid ${theme.border}`,
                            background: 'transparent',
                            color: index === 0 ? 'rgba(127,127,127,0.3)' : theme.text,
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <MoveUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === items.length - 1}
                          title="Aşağı çək"
                          style={{
                            padding: '4px',
                            borderRadius: '4px',
                            border: `1px solid ${theme.border}`,
                            background: 'transparent',
                            color:
                              index === items.length - 1 ? 'rgba(127,127,127,0.3)' : theme.text,
                            cursor: index === items.length - 1 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <MoveDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.brandId)}
                          title="Lentdən çıxar"
                          style={{
                            padding: '4px',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'rgba(220, 38, 38, 0.1)',
                            color: '#dc2626',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Settings */}
      {activeSubTab === 'settings' && (
        <div
          style={{
            maxWidth: '640px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bgSecondary,
            }}
          >
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
                style={{ width: '18px', height: '18px', accentColor: '#dc2626' }}
              />
              <div>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>
                  Brend Lenti Bölməsi Aktivdir
                </span>
                <p style={{ fontSize: '12px', color: theme.textSecondary, margin: '2px 0 0 0' }}>
                  Deaktiv edildikdə ana səhifədə lenti tamamilə gizlədir
                </p>
              </div>
            </label>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bgSecondary,
            }}
          >
            <label
              style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}
            >
              Bölmənin Başlığı
            </label>
            <input
              id="rail-title-input"
              type="text"
              value={settings.title}
              onChange={(e) => setSettings((s) => ({ ...s, title: e.target.value }))}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.bg,
                color: theme.text,
              }}
            />
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bgSecondary,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                marginBottom: '14px',
              }}
            >
              <input
                type="checkbox"
                checked={settings.animationEnabled}
                onChange={(e) => setSettings((s) => ({ ...s, animationEnabled: e.target.checked }))}
                style={{ width: '18px', height: '18px', accentColor: '#dc2626' }}
              />
              <span style={{ fontWeight: 700, fontSize: '14px' }}>
                Avtomatik Animasiya Aktivdir
              </span>
            </label>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 650,
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Hərəkət Sürəti ({settings.speedSeconds} saniyə dövrə)
                </label>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={2}
                  value={settings.speedSeconds}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, speedSeconds: Number(e.target.value) }))
                  }
                  style={{ width: '100%', accentColor: '#dc2626' }}
                />
              </div>

              <div style={{ width: '140px' }}>
                <label
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 650,
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  İstiqamət
                </label>
                <select
                  value={settings.direction}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, direction: e.target.value as 'left' | 'right' }))
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.bg,
                    color: theme.text,
                  }}
                >
                  <option value="left">Sola doğru</option>
                  <option value="right">Sağa doğru</option>
                </select>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bgSecondary,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={settings.pauseOnHover}
                onChange={(e) => setSettings((s) => ({ ...s, pauseOnHover: e.target.checked }))}
                style={{ width: '18px', height: '18px', accentColor: '#dc2626' }}
              />
              <span style={{ fontSize: '13.5px', fontWeight: 650 }}>
                Hover & Fokus zamanı hərəkəti dayandır
              </span>
            </label>

            <label
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={settings.edgeFade}
                onChange={(e) => setSettings((s) => ({ ...s, edgeFade: e.target.checked }))}
                style={{ width: '18px', height: '18px', accentColor: '#dc2626' }}
              />
              <span style={{ fontSize: '13.5px', fontWeight: 650 }}>
                Kənarlarda zərif gradient fade maskası
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Tab 3: Live Preview */}
      {activeSubTab === 'preview' && (
        <div style={{ marginTop: '10px' }}>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 650, color: theme.textSecondary }}>
              Önizləmə Ölçüsü:
            </span>
            <button
              type="button"
              onClick={() => setPreviewViewport('desktop')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: `1px solid ${theme.border}`,
                background: previewViewport === 'desktop' ? '#dc2626' : theme.bgSecondary,
                color: previewViewport === 'desktop' ? '#fff' : theme.text,
                cursor: 'pointer',
                fontWeight: 650,
                fontSize: '12.5px',
              }}
            >
              <Laptop size={14} />
              <span>Desktop (1440px)</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewViewport('mobile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: `1px solid ${theme.border}`,
                background: previewViewport === 'mobile' ? '#dc2626' : theme.bgSecondary,
                color: previewViewport === 'mobile' ? '#fff' : theme.text,
                cursor: 'pointer',
                fontWeight: 650,
                fontSize: '12.5px',
              }}
            >
              <Smartphone size={14} />
              <span>Mobil (390px)</span>
            </button>
          </div>

          <div
            className="brand-rail-preview-container"
            data-testid="brand-rail-preview-container"
            style={{
              width: previewViewport === 'mobile' ? '390px' : '100%',
              margin: previewViewport === 'mobile' ? '0 auto' : '0',
              border: `1px solid ${theme.border}`,
              borderRadius: '16px',
              padding: '16px 0',
              backgroundColor: theme.bg,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              transition: 'width 0.3s ease',
            }}
          >
            <AnimatedBrandRail
              data={previewData}
              theme={theme}
              onNavigateBrand={(slug) => showToast(`Brend səhifəsi önizləməsi: /brand/${slug}`)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
