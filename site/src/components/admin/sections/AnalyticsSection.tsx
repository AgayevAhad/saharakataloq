import React from 'react';
import {
  Boxes,
  Building2,
  Calendar,
  Eye,
  FolderPlus,
  MessageCircle,
  PhoneCall,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { CatalogData, Product } from '../../../types/product';
import { ThemeColors } from '../../../types/theme';
import { ModernCalendarPicker } from '../../ModernCalendarPicker';
import { ShimmerImage } from '../../ShimmerImage';

export interface AnalyticsSectionProps {
  theme: ThemeColors;
  catalog: CatalogData;
  analyticsRange: string;
  customStartDate: string;
  customEndDate: string;
  onSelectPeriod: (rangeId: string) => void;
  onApplyCustomDate: (startDate: string, endDate: string) => void;
  onCloseCustomDate: () => void;
  totalCatalogViews: number;
  totalProductViews: number;
  totalWhatsApp: number;
  totalCalls: number;
  totalInquiries: number;
  conversionRate: string | number;
  categoryDistribution: Array<{ id: string; name: string; count: number; percent: number }>;
  brandDistribution: Array<{ id: string; name: string; count: number; percent: number }>;
  topRankedProducts: Array<{
    product: Product;
    views: number;
    wa: number;
    call: number;
    inq: number;
    ctr: string | number;
  }>;
  onOpenProductLightbox: (product: Product) => void;
}

export const AnalyticsSection = ({
  theme,
  catalog,
  analyticsRange,
  customStartDate,
  customEndDate,
  onSelectPeriod,
  onApplyCustomDate,
  onCloseCustomDate,
  totalCatalogViews,
  totalProductViews,
  totalWhatsApp,
  totalCalls,
  totalInquiries,
  conversionRate,
  categoryDistribution,
  brandDistribution,
  topRankedProducts,
  onOpenProductLightbox,
}: AnalyticsSectionProps) => {
  return (
    <div>
      {/* Dashboard Period Filter Bar */}
      <div
        className="dash-period-card"
        style={{ background: theme.bgCard, borderColor: theme.border }}
      >
        <div className="dash-period-header">
          <div className="dash-period-title-group">
            <div
              className="dash-period-icon-badge"
              style={{ background: 'rgba(220, 38, 38, 0.12)', color: theme.primary }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Statistika Dövrü</h2>
              <p style={{ fontSize: '12px', color: theme.textMuted, margin: '2px 0 0 0' }}>
                {analyticsRange === 'today' && 'Bu günün göstəriciləri'}
                {analyticsRange === 'yesterday' && 'Dünənki günün göstəriciləri'}
                {analyticsRange === 'this_week' && 'Bu həftənin göstəriciləri'}
                {analyticsRange === 'this_month' && 'Bu ay üzrə göstəricilər'}
                {analyticsRange === 'last_30_days' && 'Son 30 günün analitikası'}
                {analyticsRange === 'all' && 'Bütün zamanların ümumi statistikası'}
                {analyticsRange === 'custom' &&
                  `Fərdi aralıq: ${customStartDate || '...'} — ${customEndDate || '...'}`}
              </p>
            </div>
          </div>

          <div className="dash-period-pills">
            {[
              { id: 'today', label: 'Bu gün' },
              { id: 'yesterday', label: 'Dünən' },
              { id: 'this_week', label: 'Bu həftə' },
              { id: 'this_month', label: 'Bu ay' },
              { id: 'last_30_days', label: 'Son 30 gün' },
              { id: 'all', label: 'Bütün vaxtlar' },
              { id: 'custom', label: '📅 Fərdi Aralıq / Gün' },
            ].map((p) => {
              const isSel = analyticsRange === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`dash-period-pill ${isSel ? 'active' : ''}`}
                  onClick={() => onSelectPeriod(p.id)}
                  style={{
                    background: isSel ? theme.primary : theme.bgSecondary,
                    color: isSel ? '#ffffff' : theme.text,
                    borderColor: isSel ? theme.primary : theme.border,
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {analyticsRange === 'custom' && (
          <div style={{ marginTop: '16px' }}>
            <ModernCalendarPicker
              theme={theme}
              startDate={customStartDate}
              endDate={customEndDate}
              onApply={(start, end) => {
                onApplyCustomDate(start, end);
              }}
              onClose={() => {
                onCloseCustomDate();
              }}
            />
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="dash-kpi-grid">
        <article
          className="dash-kpi-card"
          style={{ background: theme.bgCard, borderColor: theme.border }}
        >
          <div className="dash-kpi-header">
            <span className="dash-kpi-title" style={{ color: theme.textMuted }}>
              Kataloq Baxışları
            </span>
            <div
              className="dash-kpi-icon-pill"
              style={{
                background:
                  theme.mode === 'dark'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(185, 28, 28, 0.12)',
                color: theme.mode === 'dark' ? '#f87171' : '#b91c1c',
              }}
            >
              <Eye size={18} />
            </div>
          </div>
          <div className="dash-kpi-main">
            <span
              className="dash-kpi-value"
              style={{ color: theme.mode === 'dark' ? '#f87171' : '#b91c1c' }}
            >
              {totalCatalogViews}
            </span>
            <span
              className="dash-kpi-badge"
              style={{
                background:
                  theme.mode === 'dark'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(185, 28, 28, 0.12)',
                color: theme.mode === 'dark' ? '#fca5a5' : '#991b1b',
              }}
            >
              <TrendingUp size={12} /> Canlı
            </span>
          </div>
          <div className="dash-kpi-footer" style={{ color: theme.textMuted }}>
            <span>Ümumi səhifə açılmaları</span>
            <span>100% aktiv</span>
          </div>
        </article>

        <article
          className="dash-kpi-card"
          style={{ background: theme.bgCard, borderColor: theme.border }}
        >
          <div className="dash-kpi-header">
            <span className="dash-kpi-title" style={{ color: theme.textMuted }}>
              Məhsul Baxışları
            </span>
            <div
              className="dash-kpi-icon-pill"
              style={{
                background:
                  theme.mode === 'dark'
                    ? 'rgba(96, 165, 250, 0.2)'
                    : 'rgba(29, 78, 216, 0.12)',
                color: theme.mode === 'dark' ? '#60a5fa' : '#1d4ed8',
              }}
            >
              <Boxes size={18} />
            </div>
          </div>
          <div className="dash-kpi-main">
            <span
              className="dash-kpi-value"
              style={{ color: theme.mode === 'dark' ? '#60a5fa' : '#1d4ed8' }}
            >
              {totalProductViews}
            </span>
            <span
              className="dash-kpi-badge"
              style={{
                background:
                  theme.mode === 'dark'
                    ? 'rgba(96, 165, 250, 0.2)'
                    : 'rgba(29, 78, 216, 0.12)',
                color: theme.mode === 'dark' ? '#bfdbfe' : '#1e40af',
              }}
            >
              Model baxışı
            </span>
          </div>
          <div className="dash-kpi-footer" style={{ color: theme.textMuted }}>
            <span>Ətraflı baxılan kartlar</span>
            <span>{catalog.products.length} məhsul üzrə</span>
          </div>
        </article>

        <article
          className="dash-kpi-card"
          style={{ background: theme.bgCard, borderColor: theme.border }}
        >
          <div className="dash-kpi-header">
            <span className="dash-kpi-title" style={{ color: theme.textMuted }}>
              WhatsApp Müraciəti
            </span>
            <div
              className="dash-kpi-icon-pill"
              style={{
                background:
                  theme.mode === 'dark'
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(21, 128, 61, 0.12)',
                color: theme.mode === 'dark' ? '#4ade80' : '#15803d',
              }}
            >
              <MessageCircle size={18} />
            </div>
          </div>
          <div className="dash-kpi-main">
            <span
              className="dash-kpi-value"
              style={{ color: theme.mode === 'dark' ? '#4ade80' : '#15803d' }}
            >
              {totalWhatsApp}
            </span>
            <span
              className="dash-kpi-badge"
              style={{
                background:
                  theme.mode === 'dark'
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(21, 128, 61, 0.12)',
                color: theme.mode === 'dark' ? '#86efac' : '#166534',
              }}
            >
              Sifariş / Sual
            </span>
          </div>
          <div className="dash-kpi-footer" style={{ color: theme.textMuted }}>
            <span>WhatsApp ilə birbaşa əlaqə</span>
            <span>Konversiya</span>
          </div>
        </article>

        <article
          className="dash-kpi-card"
          style={{ background: theme.bgCard, borderColor: theme.border }}
        >
          <div className="dash-kpi-header">
            <span className="dash-kpi-title" style={{ color: theme.textMuted }}>
              Birbaşa Zənglər
            </span>
            <div
              className="dash-kpi-icon-pill"
              style={{
                background:
                  theme.mode === 'dark'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(180, 83, 9, 0.12)',
                color: theme.mode === 'dark' ? '#fbbf24' : '#b45309',
              }}
            >
              <PhoneCall size={18} />
            </div>
          </div>
          <div className="dash-kpi-main">
            <span
              className="dash-kpi-value"
              style={{ color: theme.mode === 'dark' ? '#fbbf24' : '#b45309' }}
            >
              {totalCalls}
            </span>
            <span
              className="dash-kpi-badge"
              style={{
                background:
                  theme.mode === 'dark'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(180, 83, 9, 0.12)',
                color: theme.mode === 'dark' ? '#fde68a' : '#92400e',
              }}
            >
              Telefon
            </span>
          </div>
          <div className="dash-kpi-footer" style={{ color: theme.textMuted }}>
            <span>Zəng et düyməsi klikləri</span>
            <span>Sürətli əlaqə</span>
          </div>
        </article>

        <article
          className="dash-kpi-card"
          style={{ background: theme.bgCard, borderColor: theme.border }}
        >
          <div className="dash-kpi-header">
            <span className="dash-kpi-title" style={{ color: theme.textMuted }}>
              Kataloq Məhsulları
            </span>
            <div
              className="dash-kpi-icon-pill"
              style={{
                background:
                  theme.mode === 'dark'
                    ? 'rgba(167, 139, 250, 0.2)'
                    : 'rgba(109, 40, 217, 0.12)',
                color: theme.mode === 'dark' ? '#a78bfa' : '#6d28d9',
              }}
            >
              <Sparkles size={18} />
            </div>
          </div>
          <div className="dash-kpi-main">
            <span
              className="dash-kpi-value"
              style={{ color: theme.mode === 'dark' ? '#a78bfa' : '#6d28d9' }}
            >
              {catalog.products.length}
            </span>
            <span
              className="dash-kpi-badge"
              style={{
                background:
                  theme.mode === 'dark'
                    ? 'rgba(167, 139, 250, 0.2)'
                    : 'rgba(109, 40, 217, 0.12)',
                color: theme.mode === 'dark' ? '#ddd6fe' : '#5b21b6',
              }}
            >
              {catalog.categories.length} kateqoriya
            </span>
          </div>
          <div className="dash-kpi-footer" style={{ color: theme.textMuted }}>
            <span>
              {catalog.brands.length} brend |{' '}
              {catalog.products.filter((p) => p.status === 'published').length} yayımda
            </span>
            <span>Status</span>
          </div>
        </article>

        <article
          className="dash-kpi-card"
          style={{ background: theme.bgCard, borderColor: theme.border }}
        >
          <div className="dash-kpi-header">
            <span className="dash-kpi-title" style={{ color: theme.textMuted }}>
              Müraciət Konversiyası
            </span>
            <div
              className="dash-kpi-icon-pill"
              style={{
                background:
                  theme.mode === 'dark'
                    ? 'rgba(56, 189, 248, 0.2)'
                    : 'rgba(3, 105, 161, 0.12)',
                color: theme.mode === 'dark' ? '#38bdf8' : '#0369a1',
              }}
            >
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="dash-kpi-main">
            <span
              className="dash-kpi-value"
              style={{ color: theme.mode === 'dark' ? '#38bdf8' : '#0369a1' }}
            >
              {conversionRate}%
            </span>
            <span
              className="dash-kpi-badge"
              style={{
                background:
                  theme.mode === 'dark'
                    ? 'rgba(56, 189, 248, 0.2)'
                    : 'rgba(3, 105, 161, 0.12)',
                color: theme.mode === 'dark' ? '#bae6fd' : '#075985',
              }}
            >
              CTR
            </span>
          </div>
          <div className="dash-kpi-footer" style={{ color: theme.textMuted }}>
            <span>Baxışdan müraciətə nisbət</span>
            <span>{totalInquiries} ümumi əlaqə</span>
          </div>
        </article>
      </div>

      {/* Visual Charts Grid */}
      <div className="dash-charts-grid">
        {/* Category Breakdown */}
        <div
          className="dash-chart-card"
          style={{ background: theme.bgCard, borderColor: theme.border }}
        >
          <div className="dash-chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderPlus size={18} color={theme.primary} />
              <h3>Kateqoriyalar üzrə Paylanma</h3>
            </div>
            <span style={{ fontSize: '11px', color: theme.textMuted }}>
              {catalog.categories.length} kateqoriya
            </span>
          </div>
          <div className="dash-bar-list">
            {categoryDistribution.map((cat, idx) => {
              const colors = [
                '#dc2626',
                '#2563eb',
                '#16a34a',
                '#d97706',
                '#7c3aed',
                '#0ea5e9',
              ];
              const color = colors[idx % colors.length];
              return (
                <div key={cat.id} className="dash-bar-item">
                  <div className="dash-bar-label-row">
                    <span>{cat.name}</span>
                    <span style={{ color: theme.textMuted }}>
                      {cat.count} model ({cat.percent}%)
                    </span>
                  </div>
                  <div className="dash-bar-track">
                    <div
                      className="dash-bar-fill"
                      style={{ width: `${cat.percent}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Brand Breakdown & Channels */}
        <div
          className="dash-chart-card"
          style={{ background: theme.bgCard, borderColor: theme.border }}
        >
          <div className="dash-chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="#2563eb" />
              <h3>Brendlər və Əlaqə Kanalları</h3>
            </div>
            <span style={{ fontSize: '11px', color: theme.textMuted }}>
              {catalog.brands.length} brend
            </span>
          </div>
          <div className="dash-bar-list">
            {brandDistribution.map((brand, idx) => {
              const colors = ['#dc2626', '#2563eb', '#16a34a', '#d97706'];
              const color = colors[idx % colors.length];
              return (
                <div key={brand.id} className="dash-bar-item">
                  <div className="dash-bar-label-row">
                    <span>{brand.name}</span>
                    <span style={{ color: theme.textMuted }}>
                      {brand.count} model ({brand.percent}%)
                    </span>
                  </div>
                  <div className="dash-bar-track">
                    <div
                      className="dash-bar-fill"
                      style={{ width: `${brand.percent}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: '10px',
              paddingTop: '14px',
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  color: theme.mode === 'dark' ? '#4ade80' : '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <MessageCircle size={14} /> WhatsApp (
                {totalInquiries ? Math.round((totalWhatsApp / totalInquiries) * 100) : 50}%)
              </span>
              <span
                style={{
                  color: theme.mode === 'dark' ? '#fbbf24' : '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <PhoneCall size={14} /> Zəng (
                {totalInquiries ? Math.round((totalCalls / totalInquiries) * 100) : 50}%)
              </span>
            </div>
            <div className="dash-bar-track" style={{ display: 'flex' }}>
              <div
                style={{
                  width: `${totalInquiries ? (totalWhatsApp / totalInquiries) * 100 : 50}%`,
                  background: '#16a34a',
                  height: '100%',
                }}
              />
              <div
                style={{
                  width: `${totalInquiries ? (totalCalls / totalInquiries) * 100 : 50}%`,
                  background: '#d97706',
                  height: '100%',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top Ranked Products Performance Table */}
      <div
        className="dash-top-products-wrap"
        style={{ background: theme.bgCard, borderColor: theme.border }}
      >
        <div className="dash-top-products-header" style={{ borderColor: theme.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color={theme.primary} />
            <h3>Ən Populyar və Sifariş Lideri Məhsullar (Top 10)</h3>
          </div>
          <span style={{ fontSize: '11px', color: theme.textMuted }}>
            Kataloq statistikası üzrə sıralanma
          </span>
        </div>
        <div className="admin-table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table>
            <thead>
              <tr style={{ borderBottomColor: theme.border }}>
                <th style={{ width: '40px' }}>Reytinq</th>
                <th style={{ width: '56px' }}>Foto</th>
                <th>Model Kodu</th>
                <th>Məhsul Adı</th>
                <th>Kateqoriya</th>
                <th>Baxış Sayı</th>
                <th>WhatsApp Sifariş</th>
                <th>Zəng Müraciəti</th>
                <th style={{ textAlign: 'right' }}>Konversiya</th>
              </tr>
            </thead>
            <tbody>
              {topRankedProducts.length ? (
                topRankedProducts.map(({ product: p, views, wa, call, ctr }, index) => {
                  const rankClass =
                    index === 0
                      ? 'dash-rank-1'
                      : index === 1
                        ? 'dash-rank-2'
                        : index === 2
                          ? 'dash-rank-3'
                          : 'dash-rank-other';
                  return (
                    <tr key={p.id} style={{ borderBottomColor: theme.border }}>
                      <td>
                        <span className={`dash-rank-badge ${rankClass}`}>#{index + 1}</span>
                      </td>
                      <td>
                        <div
                          className="admin-prod-thumb"
                          onClick={() => onOpenProductLightbox(p)}
                          title="Böyütmək və baxmaq üçün klikləyin"
                          style={{ cursor: 'pointer' }}
                        >
                          {p.image ? (
                            <ShimmerImage
                              src={p.image}
                              alt={p.title}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            '🖼'
                          )}
                        </div>
                      </td>
                      <td>
                        <strong>{p.code}</strong>
                      </td>
                      <td>{p.title}</td>
                      <td>{p.categoryName}</td>
                      <td>
                        <b>{views}</b>
                      </td>
                      <td>
                        <span style={{ color: '#16a34a', fontWeight: 700 }}>{wa}</span>
                      </td>
                      <td>
                        <span style={{ color: '#d97706', fontWeight: 700 }}>{call}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="dash-ctr-badge">{ctr}% CTR</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    style={{ textAlign: 'center', padding: '24px', color: theme.textMuted }}
                  >
                    Məlumat toplanır...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
