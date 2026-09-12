import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Layers, ArrowUp, ArrowDown, Eye, RefreshCw } from 'lucide-react';
import { ThemeColors, DESIGN_TOKENS } from '../types/theme';
import { catalogApi } from '../services/catalogApi';

export interface NavigationItem {
  id: string;
  placement: string;
  parent_id?: string | null;
  label: string;
  href: string;
  icon_key?: string | null;
  locale: string;
  sort_order: number;
  enabled: number | boolean;
  feature_flag?: string | null;
  open_in_new_tab: number | boolean;
  status: 'draft' | 'published' | 'archived';
  version: number;
  created_at?: string;
  updated_at?: string;
  children?: NavigationItem[];
}

interface NavigationManagerProps {
  csrfToken: string;
  theme: ThemeColors;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const PLACEMENTS = [
  { id: 'header_main', label: 'Əsas Header Menyu' },
  { id: 'top_service_bar', label: 'Yuxarı Xidmət Zolağı' },
  { id: 'mega_menu', label: 'Mega Menyu Bölmələri' },
  { id: 'mobile_bottom', label: 'Mobil Alt Naviqasiya' },
  { id: 'footer_col_1', label: 'Footer Sütun 1 (Kataloq)' },
  { id: 'footer_col_2', label: 'Footer Sütun 2 (Xidmətlər)' },
  { id: 'footer_col_3', label: 'Footer Sütun 3 (Dəstək)' },
];

export const NavigationManager: React.FC<NavigationManagerProps> = ({
  csrfToken,
  theme,
  showToast,
}) => {
  const [selectedPlacement, setSelectedPlacement] = useState<string>('header_main');
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Form State
  const [formLabel, setFormLabel] = useState('');
  const [formHref, setFormHref] = useState('');
  const [formPlacement, setFormPlacement] = useState('header_main');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formFeatureFlag, setFormFeatureFlag] = useState<string>('');
  const [formEnabled, setFormEnabled] = useState(true);
  const [formOpenInNewTab, setFormOpenInNewTab] = useState(false);
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('published');

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogApi.getAdminNavigation(selectedPlacement);
      if (res && res.items) {
        setItems(res.items);
      }
    } catch (err: any) {
      showToast(`Naviqasiya yüklənmədi: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedPlacement, showToast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormLabel('');
    setFormHref('/');
    setFormPlacement(selectedPlacement);
    setFormParentId('');
    setFormFeatureFlag('');
    setFormEnabled(true);
    setFormOpenInNewTab(false);
    setFormStatus('published');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: NavigationItem) => {
    setEditingItem(item);
    setFormLabel(item.label);
    setFormHref(item.href);
    setFormPlacement(item.placement);
    setFormParentId(item.parent_id || '');
    setFormFeatureFlag(item.feature_flag || '');
    setFormEnabled(Boolean(item.enabled));
    setFormOpenInNewTab(Boolean(item.open_in_new_tab));
    setFormStatus(item.status === 'draft' ? 'draft' : 'published');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim() || !formHref.trim()) {
      showToast('Başlıq və Link boş ola bilməz', 'error');
      return;
    }

    try {
      if (editingItem) {
        const etag = `"nav-${editingItem.id}-v${editingItem.version || 1}"`;
        await catalogApi.updateNavigationItem(
          editingItem.id,
          {
            label: formLabel.trim(),
            href: formHref.trim(),
            placement: formPlacement,
            parentId: formParentId || null,
            featureFlag: formFeatureFlag || null,
            enabled: formEnabled ? 1 : 0,
            openInNewTab: formOpenInNewTab ? 1 : 0,
            status: formStatus,
          },
          csrfToken,
          etag
        );
        showToast('Naviqasiya elementi yeniləndi', 'success');
      } else {
        await catalogApi.createNavigationItem(
          {
            label: formLabel.trim(),
            href: formHref.trim(),
            placement: formPlacement,
            parentId: formParentId || null,
            featureFlag: formFeatureFlag || null,
            enabled: formEnabled ? 1 : 0,
            openInNewTab: formOpenInNewTab ? 1 : 0,
            status: formStatus,
          },
          csrfToken
        );
        showToast('Yeni naviqasiya elementi əlavə edildi', 'success');
      }
      setIsModalOpen(false);
      loadItems();
    } catch (err: any) {
      showToast(`Xəta: ${err.message}`, 'error');
    }
  };

  const handleDelete = async (item: NavigationItem) => {
    if (!window.confirm(`"${item.label}" elementini arxivləmək istəyirsiniz?`)) return;
    try {
      const etag = `"nav-${item.id}-v${item.version || 1}"`;
      await catalogApi.deleteNavigationItem(item.id, csrfToken, etag);
      showToast('Element arxivləndi', 'success');
      loadItems();
    } catch (err: any) {
      showToast(`Xəta: ${err.message}`, 'error');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const reorderPayload = newItems.map((it, idx) => ({ id: it.id, sortOrder: idx + 1 }));
    try {
      await catalogApi.reorderNavigationItems(reorderPayload, csrfToken);
      setItems(newItems);
      showToast('Sıralama yeniləndi', 'success');
    } catch (err: any) {
      showToast(`Sıralama xətası: ${err.message}`, 'error');
    }
  };

  return (
    <div className="navigation-manager-container" style={{ padding: '16px' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: theme.text, margin: 0 }}>
            Naviqasiya & Menyu İdarəetməsi (CMS)
          </h2>
          <p style={{ fontSize: '13px', color: theme.textMuted, margin: '4px 0 0 0' }}>
            Desktop header, mega-menu, mobil nav və footer linklərinin idarə olunması
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => loadItems()}
            className="secondary-admin-button"
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} /> Yenilə
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="primary-admin-button"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: theme.primary,
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Yeni Menyu Linki
          </button>
        </div>
      </div>

      {/* Placement Selector Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        {PLACEMENTS.map((pl) => {
          const isSelected = selectedPlacement === pl.id;
          return (
            <button
              key={pl.id}
              type="button"
              onClick={() => setSelectedPlacement(pl.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isSelected ? 700 : 500,
                backgroundColor: isSelected ? theme.primary : 'transparent',
                color: isSelected ? '#ffffff' : theme.text,
                border: isSelected ? `1px solid ${theme.primary}` : `1px solid ${theme.border}`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {pl.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left Table, Right Live Preview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(400px, 1.4fr) minmax(320px, 1fr)',
          gap: '24px',
        }}
      >
        {/* Left: Items List */}
        <div
          className="admin-card"
          style={{
            backgroundColor: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: theme.textMuted }}>
              Yüklənir...
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: theme.textMuted }}>
              <Layers size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
              <div>Bu bölmədə heç bir naviqasiya elementi tapılmadı.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((it, idx) => {
                return (
                  <div
                    key={it.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: theme.mode === 'dark' ? '#161d2b' : '#f8fafc',
                      border: `1px solid ${theme.border}`,
                      gap: '12px',
                    }}
                  >
                    {/* Move controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveOrder(idx, 'up')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          color: theme.textMuted,
                          padding: '2px',
                          opacity: idx === 0 ? 0.3 : 1,
                        }}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === items.length - 1}
                        onClick={() => handleMoveOrder(idx, 'down')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer',
                          color: theme.textMuted,
                          padding: '2px',
                          opacity: idx === items.length - 1 ? 0.3 : 1,
                        }}
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontWeight: 700,
                          fontSize: '14px',
                          color: theme.text,
                        }}
                      >
                        <span>{it.label}</span>
                        {it.status === 'draft' && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#f59e0b',
                              color: '#ffffff',
                            }}
                          >
                            Qaralama
                          </span>
                        )}
                        {!it.enabled && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#64748b',
                              color: '#ffffff',
                            }}
                          >
                            Deaktiv
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: theme.textMuted,
                          fontFamily: 'monospace',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '2px',
                        }}
                      >
                        {it.href}
                        {it.open_in_new_tab ? ' ↗ (yeni tab)' : ''}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(it)}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${theme.border}`,
                          padding: '6px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: theme.text,
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(it)}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${theme.border}`,
                          padding: '6px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#ef4444',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Live Preview Panel */}
        <div
          className="admin-card"
          style={{
            backgroundColor: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 700,
                color: theme.text,
              }}
            >
              <Eye size={16} style={{ color: theme.primary }} />
              <span>Real-Time Naviqasiya Önizləməsi</span>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: previewMode === 'desktop' ? 700 : 500,
                  backgroundColor: previewMode === 'desktop' ? theme.primary : 'transparent',
                  color: previewMode === 'desktop' ? '#ffffff' : theme.textMuted,
                  border: `1px solid ${previewMode === 'desktop' ? theme.primary : theme.border}`,
                  cursor: 'pointer',
                }}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: previewMode === 'mobile' ? 700 : 500,
                  backgroundColor: previewMode === 'mobile' ? theme.primary : 'transparent',
                  color: previewMode === 'mobile' ? '#ffffff' : theme.textMuted,
                  border: `1px solid ${previewMode === 'mobile' ? theme.primary : theme.border}`,
                  cursor: 'pointer',
                }}
              >
                Mobil
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              padding: '12px',
              backgroundColor: theme.mode === 'dark' ? '#090d16' : '#ffffff',
              overflow: 'hidden',
            }}
          >
            {/* Desktop Navigation Preview Mock */}
            {previewMode === 'desktop' ? (
              <div>
                <div
                  style={{
                    padding: '8px 12px',
                    borderBottom: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ fontWeight: 800, color: theme.primary }}>SAHARA</span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {items
                      .filter((it) => it.enabled && it.status === 'published')
                      .map((it) => (
                        <span key={it.id} style={{ color: theme.text, fontSize: '12px' }}>
                          {it.label}
                        </span>
                      ))}
                  </div>
                </div>
                <div
                  style={{
                    padding: '24px 12px',
                    textAlign: 'center',
                    color: theme.textMuted,
                    fontSize: '11px',
                  }}
                >
                  Storefront Desktop Shell Renderer
                </div>
              </div>
            ) : (
              /* Mobile Preview Mock */
              <div style={{ maxWidth: '300px', margin: '0 auto', textAlign: 'center' }}>
                <div style={{ padding: '20px 0', color: theme.textMuted, fontSize: '11px' }}>
                  Mobile Screen Mockup
                </div>
                <div
                  style={{
                    borderTop: `1px solid ${theme.border}`,
                    padding: '8px 4px',
                    display: 'flex',
                    justifyContent: 'space-around',
                    fontSize: '10px',
                    color: theme.textMuted,
                  }}
                >
                  {items
                    .filter((it) => it.enabled && it.status === 'published')
                    .slice(0, 5)
                    .map((it) => (
                      <div
                        key={it.id}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      >
                        <span>{it.label}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: DESIGN_TOKENS.zIndex.modal,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: theme.bgCard,
              border: `1px solid ${theme.border}`,
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <h3
              style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 800, color: theme.text }}
            >
              {editingItem ? 'Naviqasiya Elementini Redaktə Et' : 'Yeni Naviqasiya Elementi'}
            </h3>

            <form
              onSubmit={handleSave}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme.textMuted,
                    marginBottom: '4px',
                  }}
                >
                  Başlıq (Label) *
                </label>
                <input
                  type="text"
                  required
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="Məs: Kampaniyalar və Xüsusi Təkliflər"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.mode === 'dark' ? '#161d2b' : '#ffffff',
                    color: theme.text,
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme.textMuted,
                    marginBottom: '4px',
                  }}
                >
                  Link / URL (Href) *
                </label>
                <input
                  type="text"
                  required
                  value={formHref}
                  onChange={(e) => setFormHref(e.target.value)}
                  placeholder="Məs: /services və ya https://..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.mode === 'dark' ? '#161d2b' : '#ffffff',
                    color: theme.text,
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: theme.textMuted,
                      marginBottom: '4px',
                    }}
                  >
                    Menyu Bölməsi (Placement)
                  </label>
                  <select
                    value={formPlacement}
                    onChange={(e) => setFormPlacement(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${theme.border}`,
                      backgroundColor: theme.mode === 'dark' ? '#161d2b' : '#ffffff',
                      color: theme.text,
                      fontSize: '13px',
                    }}
                  >
                    {PLACEMENTS.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: theme.textMuted,
                      marginBottom: '4px',
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${theme.border}`,
                      backgroundColor: theme.mode === 'dark' ? '#161d2b' : '#ffffff',
                      color: theme.text,
                      fontSize: '13px',
                    }}
                  >
                    <option value="published">Dərc olunmuş (Published)</option>
                    <option value="draft">Qaralama (Draft)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    color: theme.text,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formEnabled}
                    onChange={(e) => setFormEnabled(e.target.checked)}
                  />
                  Aktivdir (Enabled)
                </label>

                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    color: theme.text,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formOpenInNewTab}
                    onChange={(e) => setFormOpenInNewTab(e.target.checked)}
                  />
                  Yeni Pəncərədə Aç (Target _blank)
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '14px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.border}`,
                    background: 'transparent',
                    color: theme.text,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: theme.primary,
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Yadda Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
