import React, { useEffect, useState, useCallback } from 'react';
import {
  Database,
  ShieldCheck,
  Play,
  FileSearch,
  Server,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Eye,
  FileCode,
} from 'lucide-react';
import { catalogApi } from '../services/catalogApi';
import { ThemeColors } from '../types/theme';

interface Props {
  theme: ThemeColors;
  csrfToken: string;
  showToast: (message: string) => void;
}

export const PimMigrationManager: React.FC<Props> = ({ theme, csrfToken, showToast }) => {
  const [migrationStatus, setMigrationStatus] = useState<
    'pending' | 'applied' | 'mismatch' | 'failed' | 'unknown'
  >('unknown');
  const [liveApplyEnabled, setLiveApplyEnabled] = useState(false);
  const [appliedAt, setAppliedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dryRunning, setDryRunning] = useState(false);
  const [dryRunReport, setDryRunReport] = useState<any | null>(null);
  const [applying, setApplying] = useState(false);

  // Unassigned media scan state
  const [mediaScanning, setMediaScanning] = useState(false);
  const [unassignedReport, setUnassignedReport] = useState<{
    totalMediaScanned: number;
    assignedCount: number;
    unassignedCount: number;
    unassignedFiles: string[];
    auditNotice: string;
  } | null>(null);

  // Postgres verification state
  const [postgresVerifying, setPostgresVerifying] = useState(false);
  const [postgresReport, setPostgresReport] = useState<any | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await catalogApi.getPimMigrationStatus();
      if (res.ok) {
        setMigrationStatus(res.status);
        setAppliedAt(res.appliedAt);
        setLiveApplyEnabled(Boolean(res.liveApplyEnabled));
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleDryRun = async () => {
    setDryRunning(true);
    try {
      const res = await catalogApi.runPimDryRun(csrfToken);
      if (res.ok) {
        setDryRunReport(res);
        showToast('PIM v2 Dry-Run simulyasiyası uğurla tamamlandı (0 data itkisi təsdiqləndi).');
      }
    } catch (err) {
      showToast(`Dry-Run xətası: ${err instanceof Error ? err.message : 'Uğursuz'}`);
    } finally {
      setDryRunning(false);
    }
  };

  const handleApplyMigration = async () => {
    if (!liveApplyEnabled) {
      showToast(
        'Canlı miqrasiya feature flag ilə deaktivdir. Yalnız klon testləri və dry-run icazəlidir.'
      );
      return;
    }
    if (!dryRunReport?.dryRunToken) {
      showToast('Əvvəlcə Dry-Run simulyasiyası aparılmalı və etibarlı token əldə edilməlidir.');
      return;
    }
    if (
      !window.confirm(
        'PIM v2 strukturunu aktivləşdirmək istəyirsiniz? Avtomatik snapshot nüsxəsi çıxarılacaq.'
      )
    ) {
      return;
    }
    setApplying(true);
    try {
      const res = await catalogApi.applyPimMigration(dryRunReport.dryRunToken, csrfToken);
      if (res.ok) {
        showToast('PIM v2 Additive Migration uğurla tətbiq edildi! Snapshot qorundu.');
        setMigrationStatus('applied');
        setAppliedAt(res.appliedAt);
        await loadStatus();
      }
    } catch (err) {
      showToast(`Miqrasiya xətası: ${err instanceof Error ? err.message : 'Uğursuz'}`);
    } finally {
      setApplying(false);
    }
  };

  const handleScanUnassignedMedia = async () => {
    setMediaScanning(true);
    try {
      const res = await catalogApi.getUnassignedMedia();
      if (res.ok) {
        setUnassignedReport(res);
        showToast(
          `Media auditi tamamlandı: ${res.assignedCount} modelə bağlı, ${res.unassignedCount} sərbəst.`
        );
      }
    } catch (err) {
      showToast(`Media auditi xətası: ${err instanceof Error ? err.message : 'Uğursuz'}`);
    } finally {
      setMediaScanning(false);
    }
  };

  const handleVerifyPostgres = async () => {
    setPostgresVerifying(true);
    try {
      const res = await catalogApi.verifyPostgresSchema();
      setPostgresReport(res);
      showToast(
        'PostgreSQL schema hazırlığı və manifest doğrulaması tamamlandı (Status: DEFERRED).'
      );
    } catch (err) {
      showToast(`PostgreSQL yoxlama xətası: ${err instanceof Error ? err.message : 'Uğursuz'}`);
    } finally {
      setPostgresVerifying(false);
    }
  };

  return (
    <div
      className="pim-migration-manager"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* SECTION 1: PIM v2 MIGRATION CONTROLLER */}
      <div
        className="admin-card"
        style={{
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={22} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  color: theme.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                PIM v2 Additive Architecture & Schema Engine
                {migrationStatus === 'applied' ? (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <CheckCircle2 size={12} /> Tətbiq Edilib
                  </span>
                ) : migrationStatus === 'mismatch' ? (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <AlertTriangle size={12} /> Sxem Uyğunsuzluğu
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <AlertTriangle size={12} /> Gözləyir (Additive)
                  </span>
                )}
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: theme.textMuted }}>
                Dual-database (catalog.sqlite + catalog-draft.sqlite) qoruyucu miqrasiya, VACUUM
                INTO atomik nüsxələmə və 0 data itkisi.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="admin-btn admin-btn-secondary"
              onClick={handleDryRun}
              disabled={dryRunning || loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
              }}
            >
              <Play size={15} /> {dryRunning ? 'Simulyasiya edilir...' : 'Dry-Run Simulyasiyası'}
            </button>
            <button
              className="admin-btn admin-btn-primary"
              onClick={handleApplyMigration}
              disabled={applying || loading || migrationStatus === 'applied' || !liveApplyEnabled}
              title={
                !liveApplyEnabled
                  ? 'Canlı miqrasiya tətbiqi feature flag ilə deaktivdir. Yalnız klon testləri və dry-run icazəlidir.'
                  : 'Miqrasiyanı tətbiq et'
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                opacity: !liveApplyEnabled || migrationStatus === 'applied' ? 0.5 : 1,
                cursor:
                  !liveApplyEnabled || migrationStatus === 'applied' ? 'not-allowed' : 'pointer',
              }}
            >
              <ShieldCheck size={15} /> {applying ? 'Tətbiq edilir...' : 'Miqrasiyanı Tətbiq Et'}
            </button>
          </div>
        </div>

        {appliedAt && (
          <div style={{ fontSize: '0.8rem', color: theme.textMuted, marginTop: '0.5rem' }}>
            Son tətbiq tarixi: <strong>{new Date(appliedAt).toLocaleString('az-AZ')}</strong>
          </div>
        )}

        {/* DRY RUN REPORT PREVIEW */}
        {dryRunReport && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              fontSize: '0.85rem',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: theme.text,
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Eye size={15} color="#3b82f6" /> Dry-Run Simulyasiya Hesabatı:
            </div>
            <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>
              {dryRunReport.integrityCheck}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.5rem',
              }}
            >
              <div>
                Əsas Baza Məhsulları:{' '}
                <strong>{dryRunReport.report?.mainDb?.productCount ?? 0}</strong>
              </div>
              <div>
                Qaralama Baza Məhsulları:{' '}
                <strong>{dryRunReport.report?.draftDb?.productCount ?? 0}</strong>
              </div>
              <div>
                Planlaşdırılan Additive Addımlar: <strong>{dryRunReport.plan?.length ?? 0}</strong>
              </div>
            </div>
            {dryRunReport.dryRunToken && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  background: 'rgba(0,0,0,0.25)',
                  wordBreak: 'break-all',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: theme.textMuted,
                }}
              >
                Canonical SHA-256 Token:{' '}
                <strong style={{ color: theme.text }}>{dryRunReport.dryRunToken}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: 1:1 EXACT MATCH MEDIA AUDIT */}
      <div
        className="admin-card"
        style={{
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#a855f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileSearch size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: theme.text }}>
                1:1 Dəqiq Model Uyğunluğu və Sərbəst Media Auditi
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: theme.textMuted }}>
                Fuzzy və ya təxmini bağlama qadağandır. Fayl adı ilə model kodu dəqiq 1:1 uyğun
                gəlmədikdə sərbəst saxlanılır.
              </p>
            </div>
          </div>

          <button
            className="admin-btn admin-btn-secondary"
            onClick={handleScanUnassignedMedia}
            disabled={mediaScanning}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
            }}
          >
            <RefreshCw size={15} className={mediaScanning ? 'spin' : ''} />
            {mediaScanning ? 'Skan edilir...' : 'Media Auditini Başlat'}
          </button>
        </div>

        {unassignedReport && (
          <div style={{ marginTop: '1rem' }}>
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background:
                  unassignedReport.unassignedCount > 0
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${unassignedReport.unassignedCount > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                color: unassignedReport.unassignedCount > 0 ? '#ef4444' : '#10b981',
                fontSize: '0.88rem',
                marginBottom: '1rem',
              }}
            >
              <strong>Audit Bildirişi:</strong> {unassignedReport.auditNotice}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                fontSize: '0.85rem',
                color: theme.textMuted,
                marginBottom: '0.75rem',
              }}
            >
              <div>
                Ümumi Fayl:{' '}
                <strong style={{ color: theme.text }}>{unassignedReport.totalMediaScanned}</strong>
              </div>
              <div>
                Modelə Bağlı:{' '}
                <strong style={{ color: '#10b981' }}>{unassignedReport.assignedCount}</strong>
              </div>
              <div>
                Sərbəst Qalan:{' '}
                <strong style={{ color: '#f59e0b' }}>{unassignedReport.unassignedCount}</strong>
              </div>
            </div>

            {unassignedReport.unassignedFiles.length > 0 && (
              <div
                style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '6px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  color: theme.textMuted,
                }}
              >
                {unassignedReport.unassignedFiles.map((file, idx) => (
                  <div key={idx} style={{ padding: '2px 0' }}>
                    • {file}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: POSTGRESQL VERIFICATION TOOL (DEFERRED) */}
      <div
        className="admin-card"
        style={{
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(14, 165, 233, 0.15)',
                color: '#0ea5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Server size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: theme.text }}>
                PostgreSQL Schema Hazırlığı və Hash Yoxlaması (DEFERRED)
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: theme.textMuted }}>
                SQLite tək Source of Truth olaraq qalır. Production cutover DEFERRED statusundadır.
              </p>
            </div>
          </div>

          <button
            className="admin-btn admin-btn-secondary"
            onClick={handleVerifyPostgres}
            disabled={postgresVerifying}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
            }}
          >
            <FileCode size={15} />
            {postgresVerifying ? 'Yoxlanılır...' : 'PostgreSQL Schema Yoxla'}
          </button>
        </div>

        {postgresReport && (
          <div style={{ marginTop: '1rem' }}>
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                color: '#0ea5e9',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <strong>Status:</strong> {postgresReport.status}
              </div>
              <div>
                <strong>Mesaj:</strong> {postgresReport.message}
              </div>
              <div>
                <strong>Əsas Mənbə:</strong> {postgresReport.sourceOfTruth}
              </div>
              <div>
                <strong>Production Cutover:</strong> {postgresReport.productionCutover}
              </div>
            </div>

            {postgresReport.tableStats && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                {postgresReport.tableStats.map((stat: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.15)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ color: theme.textMuted }}>{stat.table}:</span>{' '}
                    <strong style={{ color: theme.text }}>{stat.rowCount} sətir</strong>
                  </div>
                ))}
              </div>
            )}

            {postgresReport.ddlPreview && (
              <details style={{ fontSize: '0.8rem', color: theme.textMuted }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: theme.text }}>
                  PostgreSQL DDL Koduna Baxış (Click to expand)
                </summary>
                <pre
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    overflowX: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    maxHeight: '200px',
                  }}
                >
                  {postgresReport.ddlPreview}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
