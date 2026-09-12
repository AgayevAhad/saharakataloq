import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Globe,
  Plus,
  Search,
  Sparkles,
  Layers,
  Image as ImageIcon,
  X,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { ShimmerImage } from './ShimmerImage';
import { CANDIDATE_BRAND_SEEDS } from '../../backend/brandCandidateSeeds.mjs';

interface ThemeColors {
  primary: string;
  bgCard: string;
  border: string;
  text: string;
  textMuted: string;
  danger?: string;
  success?: string;
}

export interface BrandSource {
  id: string;
  brand_id: string;
  source_url: string;
  source_type: string;
  observed_name: string;
  checked_at: string;
  rights_note: string;
  verification_status: string;
}

export interface BrandAlias {
  id: string;
  brand_id: string;
  alias: string;
  normalized_alias: string;
  locale: string;
}

export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  originCountry: string;
  description: string;
  logo: string;
  active: boolean;
  comingSoon: boolean;
  sortOrder: number;
  verificationStatus:
    | 'candidate'
    | 'verified'
    | 'content_ready'
    | 'published'
    | 'legacy_unreviewed'
    | 'rejected'
    | 'archived';
  logoRightsStatus: 'unreviewed' | 'pending' | 'approved' | 'rejected';
  logoSource: string;
  rightsNote: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  version: number;
  productCount: number;
  sources?: BrandSource[];
  aliases?: BrandAlias[];
}

export const BrandRegistryStudio: React.FC<{
  theme: ThemeColors;
  csrfToken: string;
  onRefreshCatalog?: () => void;
}> = ({ theme, csrfToken, onRefreshCatalog }) => {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Modal / Sub-form states
  const [showAddCandidate, setShowAddCandidate] = useState<boolean>(false);
  const [candidateName, setCandidateName] = useState<string>('');
  const [candidateCountry, setCandidateCountry] = useState<string>('');
  const [candidateSourceUrl, setCandidateSourceUrl] = useState<string>('');

  const [newSourceUrl, setNewSourceUrl] = useState<string>('');
  const [newSourceType, setNewSourceType] = useState<string>('official_website');
  const [newSourceNote, setNewSourceNote] = useState<string>('');

  const [newAlias, setNewAlias] = useState<string>('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/brands', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Brendlər yüklənə bilmədi.');
      const data = await res.json();
      setBrands(data.brands || []);
      if (selectedBrand) {
        const updated = (data.brands || []).find((b: BrandItem) => b.id === selectedBrand.id);
        if (updated) setSelectedBrand(updated);
      }
    } catch (err: any) {
      showToast(err.message || 'Xəta baş verdi', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedBrand]);

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleAddCandidate = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (!candidateName.trim()) {
      showToast('Brend adı daxil edilməlidir.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/brands/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          name: candidateName,
          originCountry: candidateCountry,
          sourceUrl: candidateSourceUrl,
          observedName: candidateName,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || 'Namizəd brend əlavə edilə bilmədi.');
      showToast(`"${candidateName}" namizəd brendlər siyahısına əlavə edildi.`);
      setCandidateName('');
      setCandidateCountry('');
      setCandidateSourceUrl('');
      setShowAddCandidate(false);
      await fetchBrands();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSeedBatchIntake = async () => {
    if (
      !window.confirm(
        'Baku Electronics və Kontakt Home açıq kataloqlarından müşahidə edilmiş 13 namizəd brend daxil edilsin?'
      )
    )
      return;
    try {
      const res = await fetch('/api/admin/brands/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ candidates: CANDIDATE_BRAND_SEEDS }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Batch yüklənmə uğursuz oldu.');
      showToast(`${data.count || 0} yeni namizəd brend reyestrə əlavə edildi.`);
      await fetchBrands();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddSource = async (brandId: string) => {
    if (!newSourceUrl.trim()) {
      showToast('Mənbə URL-i mütləqdir.', 'error');
      return;
    }
    try {
      const targetBrand = brands.find((b) => b.id === brandId) || selectedBrand;
      const version = targetBrand?.version || 1;
      const res = await fetch(`/api/admin/brands/${brandId}/sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          'If-Match': `"v${version}"`,
        },
        body: JSON.stringify({
          sourceUrl: newSourceUrl,
          sourceType: newSourceType,
          rightsNote: newSourceNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Mənbə əlavə edilə bilmədi.');
      showToast('Mənbə əlavə edildi (status: pending). Manual baxış tələb olunur.');
      setNewSourceUrl('');
      setNewSourceNote('');
      await fetchBrands();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddAlias = async (brandId: string) => {
    if (!newAlias.trim()) return;
    try {
      const targetBrand = brands.find((b) => b.id === brandId) || selectedBrand;
      const version = targetBrand?.version || 1;
      const res = await fetch(`/api/admin/brands/${brandId}/aliases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          'If-Match': `"v${version}"`,
        },
        body: JSON.stringify({ alias: newAlias, locale: 'az' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Alias əlavə edilə bilmədi.');
      showToast(`"${newAlias}" ləqəbi əlavə edildi.`);
      setNewAlias('');
      await fetchBrands();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateSourceStatus = async (brandId: string, sourceId: string, status: string) => {
    try {
      const targetBrand = brands.find((b) => b.id === brandId) || selectedBrand;
      const version = targetBrand?.version || 1;
      const res = await fetch(`/api/admin/brands/${brandId}/sources/${sourceId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          'If-Match': `"v${version}"`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Mənbə statusu yenilənmədi.');
      showToast(`Mənbə statusu: ${status}`);
      await fetchBrands();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateLogoRights = async (brandId: string, rightsStatus: string) => {
    try {
      const targetBrand = brands.find((b) => b.id === brandId) || selectedBrand;
      const version = targetBrand?.version || 1;
      const res = await fetch(`/api/admin/brands/${brandId}/logo-rights`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          'If-Match': `"v${version}"`,
        },
        body: JSON.stringify({
          logoRightsStatus: rightsStatus,
          rightsNote:
            rightsStatus === 'approved'
              ? 'Müəllif hüquqları yoxlanıldı və təsdiqləndi.'
              : 'Hüquq təsdiqi gözlənilir.',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Loqo hüquq statusu yenilənmədi.');
      showToast(`Loqo statusu: ${rightsStatus}`);
      await fetchBrands();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTransitionStatus = async (brandId: string, nextStatus: string) => {
    try {
      const targetBrand = brands.find((b) => b.id === brandId) || selectedBrand;
      const version = targetBrand?.version || 1;
      const res = await fetch(`/api/admin/brands/${brandId}/verification-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          'If-Match': `"v${version}"`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Status keçidi mümkün olmadı.');
      showToast(`Brend statusu yeniləndi: ${nextStatus}`);
      await fetchBrands();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredBrands = brands.filter((b) => {
    if (statusFilter !== 'all' && b.verificationStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="brand-registry-studio" style={{ color: theme.text }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ShieldCheck size={24} color={theme.primary} />
            Brend Reyestri & Hüquq Təsdiq Studiyası (PIM v2)
          </h2>
          <p style={{ margin: '4px 0 0', color: theme.textMuted, fontSize: '0.88rem' }}>
            Açıq mənbələrdən toplanmış namizəd brendlər, istehsalçı mənbələri və hüquqi loqo
            yoxlaması.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSeedBatchIntake}
            className="admin-action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#1d4ed8',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <Sparkles size={16} /> Açıq Mənbə Namizədlərini Yüklə (13)
          </button>
          <button
            onClick={() => setShowAddCandidate(true)}
            className="admin-action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: theme.primary,
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <Plus size={16} /> Yeni Namizəd Əlavə Et
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          role="status"
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background:
              feedbackMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: feedbackMsg.type === 'error' ? '#b91c1c' : '#047857',
            marginBottom: 16,
            fontWeight: 500,
          }}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* FILTER TABS & SEARCH */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: 'rgba(0,0,0,0.05)',
            padding: 4,
            borderRadius: 8,
          }}
        >
          {[
            { id: 'all', label: 'Bütün' },
            { id: 'candidate', label: 'Namizədlər (Candidate)' },
            { id: 'verified', label: 'Təsdiqlənmiş (Verified)' },
            { id: 'content_ready', label: 'Məzmun Hazır' },
            { id: 'published', label: 'Yayımda (Published)' },
            { id: 'legacy_unreviewed', label: 'Mövcud Brendlər' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: statusFilter === tab.id ? theme.primary : 'transparent',
                color: statusFilter === tab.id ? '#ffffff' : theme.textMuted,
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: 260 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.textMuted,
            }}
          />
          <input
            type="text"
            placeholder="Brend adı və ya slug ilə axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              background: theme.bgCard,
              color: theme.text,
              fontSize: '0.9rem',
            }}
          />
        </div>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: selectedBrand ? '1fr 1fr' : '1fr', gap: 16 }}
      >
        {/* Brands Table */}
        <div
          style={{
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.88rem',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'rgba(0,0,0,0.03)',
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >
                <th style={{ padding: '10px 14px' }}>Brend</th>
                <th style={{ padding: '10px 14px' }}>Mənşə</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px' }}>Loqo Hüququ</th>
                <th style={{ padding: '10px 14px' }}>Məhsul</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ padding: 30, textAlign: 'center', color: theme.textMuted }}
                  >
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    Brendlər yüklənir...
                  </td>
                </tr>
              ) : filteredBrands.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ padding: 24, textAlign: 'center', color: theme.textMuted }}
                  >
                    Heç bir brend tapılmadı.
                  </td>
                </tr>
              ) : (
                filteredBrands.map((b) => {
                  const isSelected = selectedBrand?.id === b.id;
                  const isCandidate = b.verificationStatus === 'candidate';
                  const isPublished =
                    b.verificationStatus === 'published' ||
                    b.verificationStatus === 'legacy_unreviewed';

                  return (
                    <tr
                      key={b.id}
                      className="brand-item-card"
                      onClick={() => setSelectedBrand(b)}
                      style={{
                        borderBottom: `1px solid ${theme.border}`,
                        background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {b.logo ? (
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 4,
                                overflow: 'hidden',
                                border: `1px solid ${theme.border}`,
                              }}
                            >
                              <ShimmerImage
                                src={b.logo}
                                alt={b.name}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 4,
                                background: 'rgba(0,0,0,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                              }}
                            >
                              {b.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div>{b.name}</div>
                            <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>
                              {b.slug}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: theme.textMuted }}>
                        {b.originCountry || '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          className="brand-status-badge"
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: isCandidate
                              ? 'rgba(234, 179, 8, 0.15)'
                              : isPublished
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(59, 130, 246, 0.15)',
                            color: isCandidate ? '#92400e' : isPublished ? '#047857' : '#1d4ed8',
                          }}
                        >
                          {b.verificationStatus}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background:
                              b.logoRightsStatus === 'approved'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                            color: b.logoRightsStatus === 'approved' ? '#047857' : '#b91c1c',
                          }}
                        >
                          {b.logoRightsStatus}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>{b.productCount}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBrand(b);
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: `1px solid ${theme.border}`,
                            background: 'transparent',
                            color: theme.text,
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                          }}
                        >
                          Baxış & Yoxlama
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Brand Verification & Details Panel */}
        {selectedBrand && (
          <div
            style={{
              background: theme.bgCard,
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {selectedBrand.name}
                  <span
                    style={{
                      fontSize: '0.8rem',
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(0,0,0,0.06)',
                      color: theme.textMuted,
                    }}
                  >
                    v{selectedBrand.version}
                  </span>
                </h3>
                <span style={{ color: theme.textMuted, fontSize: '0.85rem' }}>
                  Slug: {selectedBrand.slug} | Mənşə: {selectedBrand.originCountry}
                </span>
              </div>
              <button
                onClick={() => setSelectedBrand(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.textMuted,
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Verification State Machine Transitions */}
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: 'rgba(0,0,0,0.03)',
                border: `1px solid ${theme.border}`,
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <RefreshCw size={14} /> Status Keçidi (İcazəli axın: Namizəd → Təsdiqlənmiş → Məzmun
                Hazır → Yayımda)
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedBrand.verificationStatus === 'candidate' && (
                  <button
                    onClick={() => handleTransitionStatus(selectedBrand.id, 'verified')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#3b82f6',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    ✅ Təsdiqlə (Verified et)
                  </button>
                )}
                {selectedBrand.verificationStatus === 'verified' && (
                  <button
                    onClick={() => handleTransitionStatus(selectedBrand.id, 'content_ready')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#8b5cf6',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    📦 Məzmun Hazır (Content Ready)
                  </button>
                )}
                {selectedBrand.verificationStatus === 'content_ready' && (
                  <button
                    onClick={() => handleTransitionStatus(selectedBrand.id, 'published')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#10b981',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    🚀 İctimai Dərc Et (Publish)
                  </button>
                )}
                {selectedBrand.verificationStatus === 'published' && (
                  <button
                    onClick={() => handleTransitionStatus(selectedBrand.id, 'content_ready')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: `1px solid ${theme.border}`,
                      background: 'transparent',
                      color: theme.textMuted,
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                    }}
                  >
                    Yayımından çıxar
                  </button>
                )}
              </div>
            </div>

            {/* Logo Rights & Verification */}
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: 'rgba(0,0,0,0.03)',
                border: `1px solid ${theme.border}`,
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ImageIcon size={14} /> Loqo Müəllif Hüquqları & Göstərilmə
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    background: '#fff',
                    overflow: 'hidden',
                  }}
                >
                  {selectedBrand.logo ? (
                    <ShimmerImage
                      src={selectedBrand.logo}
                      alt={selectedBrand.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        color: '#52525b',
                      }}
                    >
                      Yoxdur
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.82rem', flex: 1 }}>
                  <div>
                    Status: <b>{selectedBrand.logoRightsStatus}</b>
                  </div>
                  <span style={{ color: theme.textMuted, fontSize: '0.78rem' }}>
                    {selectedBrand.logoRightsStatus === 'approved'
                      ? 'Loqo ictimaiyyətə açıqdır və hüquqi təsdiqlənib.'
                      : 'Hüquq təsdiqlənməyənədək ictimai vitrində gizlədilir.'}
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleUpdateLogoRights(
                      selectedBrand.id,
                      selectedBrand.logoRightsStatus === 'approved' ? 'pending' : 'approved'
                    )
                  }
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background:
                      selectedBrand.logoRightsStatus === 'approved' ? '#ef4444' : '#10b981',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  {selectedBrand.logoRightsStatus === 'approved'
                    ? 'Hüququ İmtina Et'
                    : 'Hüququ Təsdiqlə'}
                </button>
              </div>
            </div>

            {/* Verified Sources */}
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: 'rgba(0,0,0,0.03)',
                border: `1px solid ${theme.border}`,
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Globe size={14} /> Təsdiqlənmiş Mənbələr ({selectedBrand.sources?.length || 0})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {!selectedBrand.sources || selectedBrand.sources.length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>
                    Heç bir mənbə qeyd olunmayıb.
                  </span>
                ) : (
                  selectedBrand.sources.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                        padding: '6px 10px',
                        background: 'rgba(0,0,0,0.02)',
                        borderRadius: 6,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <span style={{ wordBreak: 'break-all' }}>
                        <span style={{ fontWeight: 600, color: theme.text }}>
                          [{s.source_type}]
                        </span>{' '}
                        <a
                          href={s.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#3b82f6', textDecoration: 'underline' }}
                        >
                          {s.source_url}
                        </a>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color:
                              s.verification_status === 'verified'
                                ? '#10b981'
                                : s.verification_status === 'rejected'
                                  ? '#ef4444'
                                  : '#f59e0b',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 4,
                            backgroundColor:
                              s.verification_status === 'verified'
                                ? 'rgba(16, 185, 129, 0.1)'
                                : s.verification_status === 'rejected'
                                  ? 'rgba(239, 68, 68, 0.1)'
                                  : 'rgba(245, 158, 11, 0.1)',
                          }}
                        >
                          {s.verification_status}
                        </span>
                        {s.verification_status !== 'verified' && (
                          <button
                            onClick={() =>
                              handleUpdateSourceStatus(selectedBrand.id, s.id, 'verified')
                            }
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              border: 'none',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              cursor: 'pointer',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                            }}
                            title="Mənbəni təsdiqlə"
                          >
                            Təsdiqlə
                          </button>
                        )}
                        {s.verification_status !== 'rejected' && (
                          <button
                            onClick={() =>
                              handleUpdateSourceStatus(selectedBrand.id, s.id, 'rejected')
                            }
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              border: 'none',
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                            }}
                            title="Mənbəni rədd et"
                          >
                            Rədd et
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Source Input */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="https://official-brand.com və ya kataloq URL"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    fontSize: '0.82rem',
                  }}
                />
                <select
                  value={newSourceType}
                  onChange={(e) => setNewSourceType(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    fontSize: '0.82rem',
                  }}
                >
                  <option value="official_website">İstehsalçı Rəsmi Saytı</option>
                  <option value="retailer_catalog">Pərakəndə Kataloqu</option>
                </select>
                <button
                  onClick={() => handleAddSource(selectedBrand.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: theme.primary,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                  }}
                >
                  + Mənbə
                </button>
              </div>
            </div>

            {/* Aliases */}
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: 'rgba(0,0,0,0.03)',
                border: `1px solid ${theme.border}`,
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Layers size={14} /> Brend Ləqəbləri & Sinonimlər (
                {selectedBrand.aliases?.length || 0})
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {selectedBrand.aliases?.map((a) => (
                  <span
                    key={a.id}
                    style={{
                      fontSize: '0.78rem',
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: 'rgba(0,0,0,0.06)',
                    }}
                  >
                    {a.alias} <span style={{ color: theme.textMuted }}>({a.normalized_alias})</span>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="Yeni ləqəb / axtarış sinonimi"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    fontSize: '0.82rem',
                  }}
                />
                <button
                  onClick={() => handleAddAlias(selectedBrand.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: theme.primary,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                  }}
                >
                  + Ləqəb
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Individual Candidate Modal */}
      {showAddCandidate && (
        <div
          className="brand-candidate-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: theme.bgCard,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 440,
            }}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: '1.2rem' }}>
              Yeni Namizəd Brend Qeydiyyatı
            </h3>
            <form
              onSubmit={handleAddCandidate}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <label>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Brend Adı *</span>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="məs. Bosch, Siemens, Midea"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    marginTop: 4,
                  }}
                />
              </label>
              <label>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mənşə Ölkəsi</span>
                <input
                  type="text"
                  value={candidateCountry}
                  onChange={(e) => setCandidateCountry(e.target.value)}
                  placeholder="məs. Çin"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    marginTop: 4,
                  }}
                />
              </label>
              <label>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Müşahidə Edilən Mənbə URL-i
                </span>
                <input
                  type="text"
                  value={candidateSourceUrl}
                  onChange={(e) => setCandidateSourceUrl(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    marginTop: 4,
                  }}
                />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAddCandidate(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  onClick={handleAddCandidate}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: theme.primary,
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Namizədi Yadda Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
