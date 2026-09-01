import React, { useEffect, useState, useCallback } from 'react';
import {
  History,
  RotateCcw,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
  X,
  Layers,
} from 'lucide-react';
import { catalogApi } from '../services/catalogApi';
import { CatalogData } from '../types/product';
import { ThemeColors } from '../types/theme';

export interface SnapshotItem {
  id: string;
  name: string;
  productCount: number;
  createdBy: string;
  createdAt: string;
}

interface Props {
  theme: ThemeColors;
  csrfToken: string;
  showToast: (message: string) => void;
  onRestore: (restoredCatalog: CatalogData) => void;
}

export const SnapshotManager: React.FC<Props> = ({
  theme,
  csrfToken,
  showToast,
  onRestore,
}) => {
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [creating, setCreating] = useState(false);

  // Restore Modal State
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotItem | null>(null);
  const [restoring, setRestoring] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState<SnapshotItem | null>(null);

  const loadSnapshots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogApi.getSnapshots(100, 0);
      setSnapshots(res.snapshots || []);
    } catch {
      showToast('Ehtiyat nüsxələr yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotName.trim()) {
      showToast('Zəhmət olmasa nüsxə üçün ad daxil edin');
      return;
    }
    setCreating(true);
    try {
      await catalogApi.createSnapshot(snapshotName.trim(), csrfToken);
      setSnapshotName('');
      setCreateModalOpen(false);
      showToast('Ehtiyat nüsxə uğurla yaradıldı və qorundu.');
      await loadSnapshots();
    } catch (err) {
      showToast(`Xəta: ${err instanceof Error ? err.message : 'Nüsxə yaradıla bilmədi'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedSnapshot) return;
    setRestoring(true);
    try {
      const res = await catalogApi.restoreSnapshot(selectedSnapshot.id, csrfToken);
      onRestore(res.catalog);
      setRestoreModalOpen(false);
      setSelectedSnapshot(null);
      showToast(`Kataloq "${selectedSnapshot.name}" nüsxəsinə uğurla qaytarıldı!`);
      await loadSnapshots();
    } catch (err) {
      showToast(`Bərpa xətası: ${err instanceof Error ? err.message : 'Bərpa edilə bilmədi'}`);
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteSnapshot = async () => {
    if (!snapshotToDelete) return;
    try {
      await catalogApi.deleteSnapshot(snapshotToDelete.id, csrfToken);
      setDeleteModalOpen(false);
      setSnapshotToDelete(null);
      showToast('Nüsxə silindi.');
      await loadSnapshots();
    } catch {
      showToast('Nüsxə silinərkən xəta baş verdi');
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('az-AZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <article
      className="manager-card"
      style={{
        background: theme.bgCard,
        borderColor: theme.border,
        color: theme.text,
      }}
    >
      {/* Header Info */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px',
          borderBottom: `1px solid ${theme.border}`,
          paddingBottom: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: 'rgba(37, 99, 235, 0.12)',
                color: '#2563eb',
                padding: '8px',
                borderRadius: '8px',
              }}
            >
              <History size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                Kataloq Bərpa & Ehtiyat Nüsxələr (Snapshots)
              </h2>
              <span style={{ fontSize: '13px', color: theme.textMuted }}>
                İstənilən vaxt dəyişiklikləri əvvəlki tarixdəki vəziyyətinə geri qaytara bilərsiniz.
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={loadSnapshots}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              background: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
              color: theme.text,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />
            Yenilə
          </button>

          <button
            type="button"
            onClick={() => {
              setSnapshotName(`Əllə saxlanılan nüsxə (${new Date().toLocaleTimeString('az-AZ')})`);
              setCreateModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              background: theme.primary,
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
            }}
          >
            <Plus size={16} />
            Yeni Nüsxə Saxla (Snapshot)
          </button>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div
        style={{
          background: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.25)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <ShieldCheck size={24} color="#16a34a" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '13px' }}>
          <strong style={{ color: '#16a34a', display: 'block', marginBottom: '2px' }}>
            100% Məlumat və Kəsim Qorunması Aktivdir
          </strong>
          <span style={{ color: theme.textMuted }}>
            Canlı yayıma buraxılan və ya əllə yadda saxlanılan hər addımda avtomatik nüsxə yaradılır.
            İstədiyiniz an siyahıdan hər hansı nüsxəni seçib <strong>"Bu Versiyaya Qayıt"</strong> düyməsilə tam bərpa edə bilərsiniz.
          </span>
        </div>
      </div>

      {/* Snapshots Table / List */}
      {loading && snapshots.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>
          <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 10px' }} />
          <p>Nüsxələr yüklənir...</p>
        </div>
      ) : snapshots.length === 0 ? (
        <div
          style={{
            padding: '50px 20px',
            textAlign: 'center',
            background: theme.bgSecondary,
            borderRadius: '10px',
            border: `1px dashed ${theme.border}`,
          }}
        >
          <History size={36} color={theme.textMuted} style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px' }}>
            Hələlik heç bir nüsxə yaradılmayıb
          </h3>
          <p style={{ fontSize: '13px', color: theme.textMuted, margin: '0 0 16px' }}>
            Kataloqun hazırkı vəziyyətini qorumaq üçün yuxarıdakı "Yeni Nüsxə Saxla" düyməsinə klikləyin.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            className="admin-table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: `2px solid ${theme.border}`,
                  textAlign: 'left',
                  color: theme.textMuted,
                }}
              >
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Tarix & Saat</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Nüsxənin Adı / Təyinatı</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Məhsul Sayı</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Növ</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>
                  Əməliyyatlar
                </th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snap) => {
                const isAuto = snap.createdBy.startsWith('auto') || snap.createdBy === 'system';
                return (
                  <tr
                    key={snap.id}
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color={theme.textMuted} />
                        <strong>{formatDate(snap.createdAt)}</strong>
                      </div>
                    </td>

                    <td style={{ padding: '12px' }}>
                      <span style={{ fontWeight: 700, color: theme.text }}>{snap.name}</span>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          color: theme.textMuted,
                          marginTop: '2px',
                        }}
                      >
                        ID: {snap.id}
                      </span>
                    </td>

                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: theme.bgSecondary,
                          fontWeight: 700,
                          fontSize: '12px',
                        }}
                      >
                        <Layers size={13} color={theme.primary} />
                        {snap.productCount} məhsul
                      </span>
                    </td>

                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: isAuto ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: isAuto ? '#2563eb' : '#059669',
                        }}
                      >
                        {isAuto ? '🔄 Avtomatik Yayım' : '👤 Əllə Yaradılan'}
                      </span>
                    </td>

                    <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSnapshot(snap);
                            setRestoreModalOpen(true);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '7px',
                            background: '#2563eb',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <RotateCcw size={13} />
                          Bu Versiyaya Qayıt
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSnapshotToDelete(snap);
                            setDeleteModalOpen(true);
                          }}
                          title="Nüsxəni sil"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 8px',
                            borderRadius: '7px',
                            background: 'transparent',
                            border: `1px solid ${theme.border}`,
                            color: '#ef4444',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE SNAPSHOT MODAL */}
      {createModalOpen && (
        <div
          className="admin-status-modal-backdrop"
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            className="admin-status-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.bgCard,
              borderColor: theme.border,
              maxWidth: '480px',
            }}
          >
            <header className="admin-status-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'rgba(37, 99, 235, 0.12)',
                    color: '#2563eb',
                  }}
                >
                  <History size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                    Yeni Ehtiyat Nüsxə Saxla
                  </h3>
                  <span style={{ fontSize: '12px', color: theme.textMuted }}>
                    Kataloqun cari vəziyyətini etibarlı şəkildə arxivləşdirin
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.textMuted,
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleCreateSnapshot} style={{ padding: '16px' }}>
              <label style={{ display: 'block', marginBottom: '16px' }}>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Nüsxənin Adı / İzahı:
                </span>
                <input
                  type="text"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  placeholder="Məsələn: Bütün şəkillər kəsildikdən sonra"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.border}`,
                    background: theme.bgSecondary,
                    color: theme.text,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '8px',
                    background: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: theme.primary,
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {creating ? 'Saxlanılır...' : 'Nüsxəni Saxla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESTORE CONFIRMATION MODAL */}
      {restoreModalOpen && selectedSnapshot && (
        <div
          className="admin-status-modal-backdrop"
          onClick={() => setRestoreModalOpen(false)}
        >
          <div
            className="admin-status-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.bgCard,
              borderColor: theme.border,
              maxWidth: '520px',
            }}
          >
            <header className="admin-status-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'rgba(217, 119, 6, 0.12)',
                    color: '#d97706',
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                    Əvvəlki Versiyaya Qayıdış (Rollback)
                  </h3>
                  <span style={{ fontSize: '12px', color: theme.textMuted }}>
                    Seçilmiş nüsxə üzrə kataloqun bərpası
                  </span>
                </div>
              </div>
              <button
                onClick={() => setRestoreModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.textMuted,
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </header>

            <div style={{ padding: '16px' }}>
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: theme.bgSecondary,
                  marginBottom: '14px',
                }}
              >
                <div style={{ fontSize: '13px', marginBottom: '6px' }}>
                  <strong>Seçilmiş Nüsxə:</strong> {selectedSnapshot.name}
                </div>
                <div style={{ fontSize: '12px', color: theme.textMuted }}>
                  <strong>Tarix:</strong> {formatDate(selectedSnapshot.createdAt)} |{' '}
                  <strong>Məhsul sayı:</strong> {selectedSnapshot.productCount}
                </div>
              </div>

              <p style={{ fontSize: '13px', lineHeight: 1.5, margin: '0 0 16px' }}>
                Bu nüsxəni bərpa etdiyiniz zaman, kataloqun bütün məhsulları, şəkilləri, kəsimləri və qiymətləri seçilmiş tarixdəki halına qaytarılacaqdır.
                <br /><br />
                <strong style={{ color: '#16a34a' }}>
                  ✓ Təhlükəsizlik Zəmanəti: Cari vəziyyətiniz itməyəcək — sistem bərpadan öncə avtomatik olaraq cari halın nüsxəsini də saxlayacaq.
                </strong>
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRestoreModalOpen(false)}
                  disabled={restoring}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '8px',
                    background: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  İmtina
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={restoring}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: '#2563eb',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={15} />
                  {restoring ? 'Bərpa edilir...' : 'Bəli, Bu Versiyaya Qayıt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && snapshotToDelete && (
        <div
          className="admin-status-modal-backdrop"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="admin-status-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.bgCard,
              borderColor: theme.border,
              maxWidth: '420px',
            }}
          >
            <header className="admin-status-modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#ef4444' }}>
                Nüsxəni Sil
              </h3>
              <button
                onClick={() => setDeleteModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.textMuted,
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </header>

            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '13px', margin: '0 0 16px' }}>
                "{snapshotToDelete.name}" adlı ehtiyat nüsxəni silmək istədiyinizdən əminsiniz?
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '7px',
                    background: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    cursor: 'pointer',
                  }}
                >
                  Ləğv et
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSnapshot}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '7px',
                    background: '#ef4444',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
