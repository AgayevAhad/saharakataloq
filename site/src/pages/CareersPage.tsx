import React from 'react';
import { ArrowLeft, Briefcase, Mail, MessageCircle, SearchCheck } from 'lucide-react';
import { ThemeColors } from '../types/theme';
import { CatalogSettings } from '../types/product';

interface CareersPageProps {
  settings?: CatalogSettings;
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  onNavigate: (route: string, param?: string) => void;
  onWhatsApp?: () => void;
}

export const CareersPage: React.FC<CareersPageProps> = ({
  settings,
  theme,
  themeMode,
  onNavigate,
  onWhatsApp,
}) => {
  const email = settings?.email?.trim();

  return (
    <main
      className="careers-page-container"
      style={{
        maxWidth: '1080px',
        margin: '0 auto',
        padding: '24px clamp(16px, 4vw, 40px) 80px',
        color: theme.text,
      }}
    >
      <button
        type="button"
        onClick={() => onNavigate('home')}
        style={{
          border: 0,
          background: 'transparent',
          color: theme.text,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: 0,
          fontWeight: 750,
          cursor: 'pointer',
          marginBottom: '24px',
        }}
      >
        <ArrowLeft size={16} /> Ana səhifəyə qayıt
      </button>

      <section
        className="scroll-reveal-item careers-hero"
        style={{
          borderRadius: '28px',
          padding: 'clamp(30px, 6vw, 64px)',
          background:
            themeMode === 'dark'
              ? 'linear-gradient(135deg, #111827, #1e293b)'
              : 'linear-gradient(135deg, #fff7f7, #ffffff)',
          border: `1px solid ${theme.border}`,
          boxShadow: themeMode === 'dark' ? 'none' : '0 24px 70px rgba(15, 23, 42, 0.08)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '58px',
            height: '58px',
            borderRadius: '18px',
            margin: '0 auto 18px',
            display: 'grid',
            placeItems: 'center',
            color: '#dc2626',
            background: 'rgba(220, 38, 38, 0.12)',
          }}
        >
          <Briefcase size={27} />
        </div>
        <p
          style={{
            margin: '0 0 8px',
            color: '#e31e24',
            fontSize: '12px',
            fontWeight: 850,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          Karyera
        </p>
        <h1
          style={{
            margin: '0 auto 14px',
            maxWidth: '700px',
            fontSize: 'clamp(28px, 5vw, 46px)',
            lineHeight: 1.08,
            fontWeight: 900,
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          Hazırda elan edilmiş vakansiya yoxdur
        </h1>
        <p
          style={{
            margin: '0 auto',
            maxWidth: '650px',
            color: theme.textMuted,
            lineHeight: 1.7,
            fontSize: '15px',
          }}
        >
          Yalnız təsdiqlənmiş iş elanları bu səhifədə dərc olunur. Yeni vakansiya açıldıqda vəzifə,
          tələblər və müraciət qaydası burada göstəriləcək.
        </p>
      </section>

      <section
        className="scroll-reveal-item careers-empty-state"
        style={{
          marginTop: '28px',
          padding: 'clamp(22px, 4vw, 34px)',
          borderRadius: '22px',
          border: `1px solid ${theme.border}`,
          background: theme.bgCard,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '18px',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            display: 'grid',
            placeItems: 'center',
            background: themeMode === 'dark' ? 'rgba(227,30,36,.16)' : '#fff1f2',
            color: '#e31e24',
          }}
        >
          <SearchCheck size={24} />
        </div>
        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: '19px', fontWeight: 850 }}>
            Elanları necə izləmək olar?
          </h2>
          <p style={{ margin: 0, color: theme.textMuted, lineHeight: 1.65, fontSize: '14px' }}>
            Aktual elanlar yarandıqda yalnız bu səhifədə paylaşılır. Ümumi karyera sualınız varsa,
            aşağıdakı rəsmi əlaqə kanalından yaza bilərsiniz; bu, açıq vəzifə və ya işə qəbul vədi
            hesab edilmir.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px' }}>
            {email && (
              <a
                href={`mailto:${email}?subject=${encodeURIComponent('Karyera haqqında sorğu')}`}
                style={{
                  minHeight: '42px',
                  padding: '0 16px',
                  borderRadius: '12px',
                  background: 'rgba(220, 38, 38, 0.10)',
                  color: '#dc2626',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
                }}
              >
                <Mail size={16} /> E-poçtla əlaqə
              </a>
            )}
            {onWhatsApp && settings?.whatsappNumber && (
              <button
                type="button"
                onClick={onWhatsApp}
                style={{
                  minHeight: '42px',
                  padding: '0 16px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  background: 'transparent',
                  color: theme.text,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <MessageCircle size={16} /> Ümumi əlaqə
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};
