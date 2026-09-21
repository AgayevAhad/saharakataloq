import React from 'react';
import { ArrowLeft, FileText, ShieldCheck, CreditCard, Truck, RotateCcw } from 'lucide-react';
import { ThemeColors } from '../types/theme';

interface TermsPageProps {
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  onNavigate: (route: string, param?: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ theme, themeMode, onNavigate }) => {
  const isDark = themeMode === 'dark';

  return (
    <div
      className="terms-page-container fade-in-up"
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
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#e31e24' }}>
            İstifadə Şərtləri
          </span>
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
            backgroundColor: 'rgba(227, 30, 36, 0.2)',
            border: '1px solid rgba(227, 30, 36, 0.4)',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 800,
            color: '#ff6b6b',
            marginBottom: '12px',
          }}
        >
          <FileText size={14} />
          <span>RƏSMİ İSTİFADƏÇİ ŞƏRTLƏRİ</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
            fontWeight: 900,
            margin: '0 0 10px 0',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          İstifadəçi Şərtləri və Qaydaları
        </h1>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#cbd5e1' }}>
          Son yenilənmə tarixi: 18 Sentyabr 2026. Sahara Electronics portalından istifadə edərək bu
          şərtlərlə razılaşmış olursunuz.
        </p>
      </div>

      {/* Terms Content Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {[
          {
            title: '1. Ümumi Müddəalar',
            icon: <FileText size={20} color="#e31e24" />,
            content: (
              <>
                <p
                  style={{
                    margin: '0 0 10px 0',
                    lineHeight: 1.7,
                    fontSize: '14px',
                    color: theme.textSecondary,
                  }}
                >
                  Bu Qaydalar "Sahara Electronics" (bundan sonra "Şirkət" və ya "Satıcı") onlayn
                  kataloq və satış platformasının istifadə şərtlərini tənzimləyir.
                </p>
                <p
                  style={{
                    margin: 0,
                    lineHeight: 1.7,
                    fontSize: '14px',
                    color: theme.textSecondary,
                  }}
                >
                  Kataloqdakı bütün məlumatlar, məhsul təsvirləri, qiymətlər və texniki parametrlər
                  rəsmi istehsalçı bazası əsasında təqdim edilir.
                </p>
              </>
            ),
          },
          {
            title: '2. Sifarişlərin Rəsmiləşdirilməsi və Qiymət Siyasəti',
            icon: <CreditCard size={20} color="#0284c7" />,
            content: (
              <>
                <p
                  style={{
                    margin: '0 0 10px 0',
                    lineHeight: 1.7,
                    fontSize: '14px',
                    color: theme.textSecondary,
                  }}
                >
                  İstifadəçi veb-saytın səbət bölməsi, birbaşa zəng və ya WhatsApp vasitəsilə
                  sifariş göndərə bilər.
                </p>
                <p
                  style={{
                    margin: 0,
                    lineHeight: 1.7,
                    fontSize: '14px',
                    color: theme.textSecondary,
                  }}
                >
                  Məhsulların qiyməti Azərbaycan Manatı (AZN) ilə göstərilir. Endirim kampaniyaları
                  və xüsusi qiymətlər elan edilmiş müddət ərzində və anbarda olan say bitənədək
                  qüvvədədir.
                </p>
              </>
            ),
          },
          {
            title: '3. Çatdırılma və Quraşdırma Şərtləri',
            icon: <Truck size={20} color="#16a34a" />,
            content: (
              <>
                <p
                  style={{
                    margin: '0 0 10px 0',
                    lineHeight: 1.7,
                    fontSize: '14px',
                    color: theme.textSecondary,
                  }}
                >
                  Bakı və Abşeron ərazisinə çatdırılma sifariş təsdiq edildikdən sonra
                  razılaşdırılmış vaxt aralığında (adətən 24-48 saat ərzində) həyata keçirilir.
                </p>
                <p
                  style={{
                    margin: 0,
                    lineHeight: 1.7,
                    fontSize: '14px',
                    color: theme.textSecondary,
                  }}
                >
                  Qaz və elektrik plitələrinin, quraşdırılan sobaların və aspiratorların montajı
                  rəsmi servis tərəfindən həyata keçirildikdə zəmanət tam qüvvəyə minir.
                </p>
              </>
            ),
          },
          {
            title: '4. Rəsmi Zəmanət və Servis Xidməti',
            icon: <ShieldCheck size={20} color="#f59e0b" />,
            content: (
              <>
                <p
                  style={{
                    margin: '0 0 10px 0',
                    lineHeight: 1.7,
                    fontSize: '14px',
                    color: theme.textSecondary,
                  }}
                >
                  Sahara Electronics tərəfindən satılan bütün məhsullar istehsalçı zavodun rəsmi
                  zəmanət talonu ilə təmin olunur.
                </p>
                <p
                  style={{
                    margin: 0,
                    lineHeight: 1.7,
                    fontSize: '14px',
                    color: theme.textSecondary,
                  }}
                >
                  Zəmanət müddəti ərzində istehsalat qüsuru aşkarlanarsa, rəsmi servis mərkəzi
                  tərəfindən ödənişsiz diaqnostika, təmir və ya hissələrin əvəzlənməsi həyata
                  keçirilir.
                </p>
              </>
            ),
          },
          {
            title: '5. Məhsulun Qaytarılması və Dəyişdirilməsi',
            icon: <RotateCcw size={20} color="#8b5cf6" />,
            content: (
              <>
                <p
                  style={{
                    margin: '0 0 10px 0',
                    lineHeight: 1.7,
                    fontSize: '14px',
                    color: theme.textSecondary,
                  }}
                >
                  "İstehlakçıların hüquqlarının müdafiəsi haqqında" Azərbaycan Respublikasının
                  Qanununa əsasən, müştəri istifadə olunmamış, qablaşdırması və əmtəə görünüşü
                  pozulmamış məhsulu 14 gün ərzində dəyişdirə və ya qaytara bilər.
                </p>
              </>
            ),
          },
        ].map((section, idx) => (
          <div
            key={idx}
            className="scroll-reveal-item"
            style={{
              padding: '28px',
              borderRadius: '16px',
              backgroundColor: isDark ? '#131b2c' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}
            >
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
