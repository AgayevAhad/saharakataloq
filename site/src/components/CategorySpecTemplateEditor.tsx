import React, { useState, useEffect, useCallback } from 'react';
import { ListPlus, Trash2, CheckCircle2, AlertCircle, Layers, Loader2 } from 'lucide-react';

interface ThemeColors {
  primary: string;
  bgCard: string;
  border: string;
  text: string;
  textMuted: string;
  danger?: string;
  success?: string;
}

export interface CategorySpecTemplate {
  id: string;
  categoryId: string;
  specKey: string;
  label: string;
  unit: string;
  required: boolean;
  sortOrder: number;
  isInherited: boolean;
  sourceCategoryId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const CategorySpecTemplateEditor: React.FC<{
  categoryId: string;
  categoryName: string;
  theme: ThemeColors;
  csrfToken: string;
  onClose?: () => void;
}> = ({ categoryId, categoryName, theme, csrfToken, onClose }) => {
  const [templates, setTemplates] = useState<CategorySpecTemplate[]>([]);
  const [categoryEtag, setCategoryEtag] = useState<string>('*');
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  // Form states
  const [specKey, setSpecKey] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [required, setRequired] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}/spec-templates`);
      if (!res.ok) throw new Error('Xüsusiyyət şablonları yüklənə bilmədi.');
      const etagHeader = res.headers.get('etag');
      const data = await res.json();
      setTemplates(data.templates || []);
      if (etagHeader) {
        setCategoryEtag(etagHeader);
      } else if (data.category?.version) {
        setCategoryEtag(`"v${data.category.version}"`);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specKey.trim() || !label.trim()) {
      showToast('Xüsusiyyət açarı və başlığı mütləqdir.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}/spec-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          'If-Match': categoryEtag || '*',
        },
        body: JSON.stringify({
          specKey: specKey.trim().toLowerCase(),
          label: label.trim(),
          unit: unit.trim(),
          required,
          sortOrder,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Şablon saxlanıla bilmədi.');
      const newEtag = res.headers.get('etag');
      if (newEtag) setCategoryEtag(newEtag);
      else if (data.category?.version) setCategoryEtag(`"v${data.category.version}"`);
      showToast(`"${label}" şablonu uğurla saxlanıldı.`);
      setSpecKey('');
      setLabel('');
      setUnit('');
      setRequired(false);
      setSortOrder(templates.length);
      await fetchTemplates();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string, templateLabel: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}/spec-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken,
          'If-Match': categoryEtag || '*',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Şablon silinmədi.');
      const newEtag = res.headers.get('etag');
      if (newEtag) setCategoryEtag(newEtag);
      else if (data.category?.version) setCategoryEtag(`"v${data.category.version}"`);
      showToast(`"${templateLabel}" şablonu silindi.`);
      await fetchTemplates();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div
      style={{
        backgroundColor: theme.bgCard,
        border: `1px solid ${theme.border}`,
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '850px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: `1px solid ${theme.border}`,
          paddingBottom: '16px',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: theme.text,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0,
            }}
          >
            <Layers size={20} color={theme.primary} />
            Xüsusiyyət Şablonları: {categoryName}
          </h3>
          <p style={{ fontSize: '13px', color: theme.textMuted, margin: '4px 0 0 0' }}>
            Miras qalan və xüsusi spesifikasiya sahələrini idarə edin.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              background: 'transparent',
              color: theme.text,
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            Bağla
          </button>
        )}
      </div>

      {feedback && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor:
              feedback.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: feedback.type === 'success' ? '#22c55e' : '#ef4444',
            border: `1px solid ${feedback.type === 'success' ? '#22c55e' : '#ef4444'}`,
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {feedback.text}
        </div>
      )}

      {/* Template list */}
      <div style={{ marginBottom: '24px' }}>
        <h4
          style={{ fontSize: '14px', fontWeight: '600', color: theme.text, marginBottom: '12px' }}
        >
          Mövcud Şablonlar ({templates.length})
        </h4>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: theme.textMuted }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
            Yüklənir...
          </div>
        ) : templates.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              backgroundColor: 'rgba(0,0,0,0.02)',
              borderRadius: '12px',
              color: theme.textMuted,
              fontSize: '13px',
              border: `1px dashed ${theme.border}`,
            }}
          >
            Bu kateqoriya üçün heç bir xüsusiyyət şablonu təyin edilməyib.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: tpl.isInherited
                        ? 'rgba(59, 130, 246, 0.12)'
                        : 'rgba(16, 185, 129, 0.12)',
                      color: tpl.isInherited ? '#3b82f6' : '#10b981',
                      border: `1px solid ${tpl.isInherited ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    }}
                  >
                    {tpl.isInherited ? 'Miras qalan' : 'Fərdi'}
                  </span>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: theme.text }}>
                      {tpl.label}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        color: theme.textMuted,
                        marginLeft: '8px',
                        fontFamily: 'monospace',
                      }}
                    >
                      ({tpl.specKey})
                    </span>
                    {tpl.unit && (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(0,0,0,0.06)',
                          color: theme.textMuted,
                          marginLeft: '8px',
                        }}
                      >
                        {tpl.unit}
                      </span>
                    )}
                    {tpl.required && (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          marginLeft: '8px',
                          fontWeight: '600',
                        }}
                      >
                        Tələb olunur
                      </span>
                    )}
                  </div>
                </div>

                {!tpl.isInherited && (
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id, tpl.label)}
                    style={{
                      padding: '6px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Şablonu sil"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new template form */}
      <form
        onSubmit={handleSaveTemplate}
        style={{
          backgroundColor: 'rgba(0,0,0,0.02)',
          padding: '16px',
          borderRadius: '12px',
          border: `1px solid ${theme.border}`,
        }}
      >
        <h4
          style={{ fontSize: '14px', fontWeight: '600', color: theme.text, marginBottom: '14px' }}
        >
          Yeni Şablon Əlavə Et / Fərdiləşdir
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: theme.textMuted,
                marginBottom: '4px',
              }}
            >
              Açar (specKey) *
            </label>
            <input
              type="text"
              placeholder="məs: power_watts"
              value={specKey}
              onChange={(e) => setSpecKey(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.bgCard,
                color: theme.text,
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: theme.textMuted,
                marginBottom: '4px',
              }}
            >
              Başlıq (label) *
            </label>
            <input
              type="text"
              placeholder="məs: Güc"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.bgCard,
                color: theme.text,
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: theme.textMuted,
                marginBottom: '4px',
              }}
            >
              Ölçü Vahidi
            </label>
            <input
              type="text"
              placeholder="məs: Vt, sm, L"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.bgCard,
                color: theme.text,
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: theme.textMuted,
                marginBottom: '4px',
              }}
            >
              Sıra
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.bgCard,
                color: theme.text,
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: theme.text,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Bu xüsusiyyət məhsul daxil edilərkən məcburidir
          </label>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: theme.primary,
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ListPlus size={16} />
            {submitting ? 'Saxlanılır...' : 'Şablonu Saxla'}
          </button>
        </div>
      </form>
    </div>
  );
};
