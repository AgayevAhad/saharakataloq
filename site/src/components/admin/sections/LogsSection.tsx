import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Download,
  Eye,
  FileDown,
  FileText,
  History,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { catalogApi } from '../../../services/catalogApi';
import { AuditLog } from '../../../types/product';
import { ThemeColors } from '../../../types/theme';

export const LOG_CATEGORIES = [
  { id: 'all', label: 'Bütün Loglar' },
  { id: 'auth', label: '🔐 Giriş & Təhlükəsizlik' },
  { id: 'product', label: '📦 Məhsul Hadisələri' },
  { id: 'category_brand', label: '🗂 Kateqoriya & Brend' },
  { id: 'settings', label: '⚙️ Tənzimləmələr' },
  { id: 'catalog_status', label: '⏸ Kataloq Statusu' },
  { id: 'import_export', label: '📊 İdxal & İxrac' },
  { id: 'system', label: '💻 Sistem' },
];

export interface LogManagerProps {
  theme: ThemeColors;
  logs: AuditLog[];
  total: number;
  loading: boolean;
  category: string;
  search: string;
  onSelectCategory: (cat: string) => void;
  onSearchChange: (search: string) => void;
  onRefresh: () => void;
  onOpenClearModal: () => void;
  onInspectLog: (log: AuditLog) => void;
}

export const LogManager: React.FC<LogManagerProps> = ({
  theme,
  logs,
  total,
  loading,
  category,
  search,
  onSelectCategory,
  onSearchChange,
  onRefresh,
  onOpenClearModal,
  onInspectLog,
}) => {
  return (
    <article
      className="manager-card log-manager-card"
      style={{ background: theme.bgCard, borderColor: theme.border }}
    >
      <div className="log-manager-top">
        <div>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0,
            }}
          >
            <History size={19} color={theme.primary} />
            Audit və Sistem Logları
          </h2>
          <p style={{ color: theme.textMuted, fontSize: '13px', margin: '4px 0 0 0' }}>
            Admin paneldə baş verən bütün girişləri, dəyişiklikləri və əməliyyatları real-vaxt
            izləyin. ({total} qeyd)
          </p>
        </div>

        <div className="log-action-buttons">
          <button
            type="button"
            className="log-btn log-refresh-btn"
            onClick={onRefresh}
            title="Logları yenilə"
            style={{ background: theme.bgSecondary, color: theme.text, borderColor: theme.border }}
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Yenilə</span>
          </button>
          <a
            href={`/api/admin/logs/export?format=csv&category=${category}`}
            className="log-btn"
            download
            style={{
              background: theme.bgSecondary,
              color: theme.text,
              borderColor: theme.border,
              textDecoration: 'none',
            }}
          >
            <FileDown size={14} />
            <span>CSV İxrac</span>
          </a>
          <a
            href={`/api/admin/logs/export?format=json&category=${category}`}
            className="log-btn"
            download
            style={{
              background: theme.bgSecondary,
              color: theme.text,
              borderColor: theme.border,
              textDecoration: 'none',
            }}
          >
            <Download size={14} />
            <span>JSON İxrac</span>
          </a>
          {logs.length > 0 && (
            <button
              type="button"
              className="log-btn log-clear-btn"
              onClick={onOpenClearModal}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.3)',
              }}
            >
              <Trash2 size={14} />
              <span>Logları Təmizlə</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="log-controls-row">
        <div className="log-category-pills no-scrollbar">
          {LOG_CATEGORIES.map((c) => {
            const isSel = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                className={`log-cat-pill ${isSel ? 'active' : ''}`}
                onClick={() => onSelectCategory(c.id)}
                style={{
                  background: isSel ? theme.primary : theme.bgSecondary,
                  color: isSel ? '#ffffff' : theme.text,
                  borderColor: isSel ? theme.primary : theme.border,
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div
          className="log-search-box"
          style={{ background: theme.bgSecondary, borderColor: theme.border }}
        >
          <Search size={14} color={theme.textMuted} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Başlıq, detal və ya IP axtar..."
            style={{ color: theme.text }}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.textMuted,
                cursor: 'pointer',
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div
        className="admin-table-wrap"
        style={{ marginTop: '16px', maxHeight: '580px', overflowY: 'auto' }}
      >
        <table className="admin-table log-table">
          <thead>
            <tr>
              <th style={{ width: '150px' }}>Tarix & Vaxt</th>
              <th style={{ width: '130px' }}>Kateqoriya</th>
              <th style={{ width: '220px' }}>Hadisə / Başlıq</th>
              <th>Ətraflı Detal</th>
              <th style={{ width: '110px' }}>Status</th>
              <th style={{ width: '120px' }}>IP Ünvanı</th>
              <th style={{ width: '70px', textAlign: 'right' }}>Baxış</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const statusColor =
                log.status === 'success'
                  ? '#16a34a'
                  : log.status === 'danger'
                    ? '#ef4444'
                    : log.status === 'warning'
                      ? '#d97706'
                      : '#2563eb';
              const statusBg =
                log.status === 'success'
                  ? 'rgba(22, 163, 74, 0.12)'
                  : log.status === 'danger'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : log.status === 'warning'
                      ? 'rgba(217, 119, 6, 0.12)'
                      : 'rgba(37, 99, 235, 0.12)';
              const statusText =
                log.status === 'success'
                  ? 'Uğurlu'
                  : log.status === 'danger'
                    ? 'Xəta / Cəhd'
                    : log.status === 'warning'
                      ? 'Xəbərdarlıq'
                      : 'Məlumat';

              return (
                <tr
                  key={log.id}
                  className="log-row"
                  onClick={() => onInspectLog(log)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontSize: '12px', color: theme.textMuted, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} />
                      <span>{log.createdAt}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className="log-category-tag"
                      style={{
                        background: theme.bgSecondary,
                        borderColor: theme.border,
                        color: theme.text,
                      }}
                    >
                      {log.category === 'auth' && '🔐 Giriş'}
                      {log.category === 'product' && '📦 Məhsul'}
                      {log.category === 'category_brand' && '🗂 Kateqoriya'}
                      {log.category === 'settings' && '⚙️ Parametr'}
                      {log.category === 'catalog_status' && '⏸ Status'}
                      {log.category === 'import_export' && '📊 İdxal/İxrac'}
                      {log.category === 'system' && '💻 Sistem'}
                      {![
                        'auth',
                        'product',
                        'category_brand',
                        'settings',
                        'catalog_status',
                        'import_export',
                        'system',
                      ].includes(log.category) && log.category}
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '13px', color: theme.text, display: 'block' }}>
                      {log.title}
                    </strong>
                    <small style={{ fontSize: '11px', color: theme.textMuted }}>{log.action}</small>
                  </td>
                  <td style={{ maxWidth: '340px' }}>
                    <div
                      style={{
                        fontSize: '12px',
                        color: theme.textSecondary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {log.details || '—'}
                    </div>
                  </td>
                  <td>
                    <span
                      className="log-status-badge"
                      style={{ background: statusBg, color: statusColor }}
                    >
                      {statusText}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: '11px', color: theme.textMuted }}>
                      {log.ipAddress || 'Lokal'}
                    </code>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectLog(log);
                      }}
                      title="Detallı baxış"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: theme.primary,
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {!logs.length && (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: 'center', padding: '40px 20px', color: theme.textMuted }}
                >
                  <History
                    size={32}
                    style={{ margin: '0 auto 10px auto', display: 'block', opacity: 0.5 }}
                  />
                  {loading ? 'Loglar yüklənir...' : 'Heç bir audit log qeydi tapılmadı.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
};

export interface LogsSectionProps {
  csrfToken: string;
  theme: ThemeColors;
  showToast?: (msg: string) => void;
}

export const LogsSection: React.FC<LogsSectionProps> = ({ csrfToken, theme, showToast }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsCategory, setLogsCategory] = useState('all');
  const [logsSearch, setLogsSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [clearLogsModalOpen, setClearLogsModalOpen] = useState(false);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const resp = await catalogApi.getLogs(logsCategory, logsSearch);
      setLogs(resp.logs || []);
      setLogsTotal(resp.total || 0);
    } catch {
      if (showToast) showToast('Logları yükləmək mümkün olmadı');
    } finally {
      setLogsLoading(false);
    }
  }, [logsCategory, logsSearch, showToast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleClearLogs = async () => {
    try {
      await catalogApi.clearLogs(csrfToken);
      setLogs([]);
      setLogsTotal(0);
      setClearLogsModalOpen(false);
      if (showToast) showToast('Bütün audit logları təmizləndi.');
    } catch {
      if (showToast) showToast('Loglar silinərkən xəta baş verdi');
    }
  };

  return (
    <>
      <LogManager
        theme={theme}
        logs={logs}
        total={logsTotal}
        loading={logsLoading}
        category={logsCategory}
        search={logsSearch}
        onSelectCategory={setLogsCategory}
        onSearchChange={setLogsSearch}
        onRefresh={loadLogs}
        onOpenClearModal={() => setClearLogsModalOpen(true)}
        onInspectLog={(log) => setSelectedLog(log)}
      />

      {/* LOG DETAILS MODAL */}
      {selectedLog && (
        <div className="admin-status-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div
            className="admin-status-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ background: theme.bgCard, borderColor: theme.border, maxWidth: '620px' }}
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
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                    Audit Qeydi Detalları
                  </h3>
                  <span style={{ fontSize: '12px', color: theme.textMuted }}>
                    ID #{selectedLog.id} | {selectedLog.createdAt}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
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

            <div
              className="admin-status-modal-body"
              style={{ display: 'grid', gap: '12px', maxHeight: '60vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <span style={{ fontSize: '11px', color: theme.textMuted, display: 'block' }}>
                    Kateqoriya
                  </span>
                  <strong style={{ fontSize: '13px' }}>{selectedLog.category}</strong>
                </div>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <span style={{ fontSize: '11px', color: theme.textMuted, display: 'block' }}>
                    Əməliyyat / Hadisə
                  </span>
                  <strong style={{ fontSize: '13px' }}>{selectedLog.action}</strong>
                </div>
              </div>

              <div
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: theme.bgSecondary,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <span style={{ fontSize: '11px', color: theme.textMuted, display: 'block' }}>
                  Başlıq
                </span>
                <strong style={{ fontSize: '14px', color: theme.text }}>{selectedLog.title}</strong>
              </div>

              <div
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: theme.bgSecondary,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    color: theme.textMuted,
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Ətraflı Məlumat / Detallar
                </span>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: theme.text,
                    background: theme.bgCard,
                    padding: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  {selectedLog.details || '(Əlavə detal yoxdur)'}
                </pre>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <span style={{ fontSize: '11px', color: theme.textMuted, display: 'block' }}>
                    IP Ünvanı
                  </span>
                  <code style={{ fontSize: '12px' }}>{selectedLog.ipAddress || 'Lokal'}</code>
                </div>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <span style={{ fontSize: '11px', color: theme.textMuted, display: 'block' }}>
                    Brauzer / User Agent
                  </span>
                  <span
                    style={{ fontSize: '11px', color: theme.textMuted, wordBreak: 'break-all' }}
                  >
                    {selectedLog.userAgent || 'Naməlum'}
                  </span>
                </div>
              </div>
            </div>

            <footer className="admin-status-modal-footer" style={{ borderColor: theme.border }}>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{ background: theme.primary, color: '#fff', border: 'none' }}
              >
                Bağla
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* CLEAR LOGS CONFIRM MODAL */}
      {clearLogsModalOpen && (
        <div className="admin-status-modal-backdrop" onClick={() => setClearLogsModalOpen(false)}>
          <div
            className="admin-status-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ background: theme.bgCard, borderColor: theme.border, maxWidth: '440px' }}
          >
            <header className="admin-status-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                    Audit Loglarını Təmizlə
                  </h3>
                  <span style={{ fontSize: '12px', color: theme.textMuted }}>
                    Bütün qeydlər silinəcək
                  </span>
                </div>
              </div>
              <button
                onClick={() => setClearLogsModalOpen(false)}
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

            <div className="admin-status-modal-body">
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: theme.text }}>
                Bütün audit və sistem qeydlərini bazadan birdəfəlik silmək istədiyinizdən əminsiniz?
                Bu əməliyyat geri qaytarıla bilməz.
              </p>
            </div>

            <footer className="admin-status-modal-footer" style={{ borderColor: theme.border }}>
              <button
                type="button"
                onClick={() => setClearLogsModalOpen(false)}
                style={{
                  background: theme.bgSecondary,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                }}
              >
                İmtina
              </button>
              <button
                type="button"
                onClick={handleClearLogs}
                style={{ background: '#ef4444', color: '#fff', border: 'none' }}
              >
                Bəli, Bütün Logları Sil
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
};
