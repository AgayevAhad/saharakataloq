import React from 'react';
import {
  ArrowLeft,
  Lock,
  Shield,
  Eye,
  Database,
  UserCheck,
  FileKey,
  CheckCircle2,
} from 'lucide-react';
import { ThemeColors } from '../types/theme';

interface PrivacyPageProps {
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  onNavigate: (route: string, param?: string) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({
  theme,
  themeMode,
  onNavigate,
}) => {
  const isDark = themeMode === 'dark';

  return (
    <div
      className="privacy-page-container fade-in-up"
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '24px 20px 80px',
        color: theme.text,
        minHeight: '80vh',
      }}
    >
      {/* Breadcrumbs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <button
          type="button"
          onClick={() => onNavigate('home')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: theme.text,
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
          <span>Ana Səhifəyə qayıt</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: theme.textMuted }}>Kömək</span>
          <span style={{ fontSize: '13px', color: theme.textMuted }}>/</span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#e31e24' }}>Məxfilik Siyasəti</span>
        </div>
      </div>

      {/* Header */}
      <div
        style={{
          padding: '32px clamp(20px, 4vw, 40px)',
          borderRadius: '20px',
          backgroundColor: isDark ? '#111827' : '#0f172a',
          color: '#ffffff',
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(2, 132, 199, 0.2)',
            border: '1px solid rgba(2, 132, 199, 0.4)',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 800,
            color: '#38bdf8',
            marginBottom: '12px',
          }}
        >
          <Lock size={14} />
          <span>FƏRDİ MƏLUMATLARIN QORUNMASI</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
            fontWeight: 900,
            margin: '0 0 10px 0',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          Məxfilik və Məlumat Təhlükəsizliyi Siyasəti
        </h1>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#cbd5e1' }}>
          Sahara Electronics müştərilərinin şəxsi məlumatlarının təhlükəsizliyinə və məxfiliyinə ən yüksək səviyyədə təminat verir.
        </p>
      </div>

      {/* Privacy Content Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {[
          {
            title: '1. Toplanan Fərdi Məlumatlar',
            icon: <Database size={20} color="#0284c7" />,
            content: (
              <>
                <p style={{ margin: '0 0 10px 0', lineHeight: 1.7, fontSize: '14px', color: theme.textSecondary }}>
                  Biz yalnız sifarişlərin icrası, çatdırılma ünvanının təyin olunması və müştəri xidmətinin təmin edilməsi üçün zəruri olan məlumatları (Ad, Soyad, Əlaqə nömrəsi, Çatdırılma ünvanı, Doğum tarixi və E-poçt) toplayırıq.
                </p>
              </>
            ),
          },
          {
            title: '2. Məlumatların Qorunması və SSL Şifrələnməsi',
            icon: <Shield size={20} color="#16a34a" />,
            content: (
              <>
                <p style={{ margin: '0 0 10px 0', lineHeight: 1.7, fontSize: '14px', color: theme.textSecondary }}>
                  Platformamızda ötürülən bütün məlumatlar beynəlxalq 256-bit SSL (Secure Socket Layer) şifrələmə protokolları vasitəsilə qorunur.
                </p>
                <p style={{ margin: 0, lineHeight: 1.7, fontSize: '14px', color: theme.textSecondary }}>
                  İstifadəçilərin şifrələri verilənlər bazasında xüsusi kriptoqrafik heşləmə alqoritmləri ilə saxlanılır və hətta sistem administratorları tərəfindən oxuna bilməz.
                </p>
              </>
            ),
          },
          {
            title: '3. Üçüncü Tərəflərlə Məlumat Paylaşımı',
            icon: <UserCheck size={20} color="#e31e24" />,
            content: (
              <>
                <p style={{ margin: '0 0 10px 0', lineHeight: 1.7, fontSize: '14px', color: theme.textSecondary }}>
                  Sahara Electronics istifadəçilərin fərdi məlumatlarını heç bir halda üçüncü şəxslərə və ya reklam agentliklərinə satmır, icarəyə vermir və ötürmür.
                </p>
                <p style={{ margin: 0, lineHeight: 1.7, fontSize: '14px', color: theme.textSecondary }}>
                  Yalnız sifarişin çatdırılması üçün zəruri olan ünvan və əlaqə məlumatları kuryer xidmətinə təqdim olunur.
                </p>
              </>
            ),
          },
          {
            title: '4. Çərəzlər (Cookies) Siyasəti',
            icon: <FileKey size={20} color="#f59e0b" />,
            content: (
              <>
                <p style={{ margin: '0 0 10px 0', lineHeight: 1.7, fontSize: '14px', color: theme.textSecondary }}>
                  Veb-saytımız səbət məhsulları, müqayisə siyahısı, seçilmişlər və mövzu rejimini (Açıq / Qaranlıq) yadda saxlamaq üçün lokal brauzer yaddaşı və çərəzlərdən istifadə edir.
                </p>
              </>
            ),
          },
        ].map((section, idx) => (
          <div
            key={idx}
            style={{
              padding: '28px',
              borderRadius: '16px',
              backgroundColor: isDark ? '#131b2c' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {section.icon}
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: theme.text, margin: 0 }}>
                {section.title}
              </h2>
            </div>
            <div>{section.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
