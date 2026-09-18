import React from 'react';
import {
  ArrowLeft,
  Award,
  ShieldCheck,
  Truck,
  Headphones,
  Users,
  Sparkles,
  Building2,
  CheckCircle2,
  Star,
  Layers,
  MapPin,
  Phone,
  Mail,
  Zap,
} from 'lucide-react';
import { ThemeColors } from '../types/theme';
import { CatalogSettings } from '../types/product';

interface AboutPageProps {
  settings?: CatalogSettings;
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  onNavigate: (route: string, param?: string) => void;
  onWhatsApp?: () => void;
  onCall?: (phone?: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  settings,
  theme,
  themeMode,
  onNavigate,
  onWhatsApp,
  onCall,
}) => {
  const isDark = themeMode === 'dark';

  return (
    <div
      className="about-page-container fade-in-up"
      style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '24px 20px 80px',
        color: theme.text,
        minHeight: '80vh',
      }}
    >
      {/* Top Breadcrumbs / Back Bar */}
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
          <span style={{ fontSize: '13px', color: theme.textMuted }}>Şirkət</span>
          <span style={{ fontSize: '13px', color: theme.textMuted }}>/</span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#e31e24' }}>Haqqımızda</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div
        style={{
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          backgroundColor: isDark ? '#111827' : '#0f172a',
          color: '#ffffff',
          padding: 'clamp(36px, 6vw, 64px) clamp(24px, 5vw, 56px)',
          marginBottom: '48px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at top right, rgba(227, 30, 36, 0.22) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '780px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(227, 30, 36, 0.2)',
              border: '1px solid rgba(227, 30, 36, 0.4)',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 800,
              color: '#ff6b6b',
              marginBottom: '16px',
            }}
          >
            <Sparkles size={14} />
            <span>SAHARA ELECTRONICS HAQQINDA</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 900,
              lineHeight: 1.2,
              margin: '0 0 16px 0',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            Müasir Məişət Texnikası və İtaliya Keyfiyyəti
          </h1>

          <p
            style={{
              fontSize: 'clamp(14px, 1.8vw, 16px)',
              lineHeight: 1.65,
              color: '#cbd5e1',
              margin: '0 0 28px 0',
            }}
          >
            Sahara Electronics — illərin təcrübəsi və rəsmi distribütorluq zəmanəti ilə dünya
            şöhrətli məişət texnikası brendlərini (ARDO, Lotus, Artel və digərləri) Azərbaycan
            istehlakçılarına ən yüksək xidmət səviyyəsində təqdim edən etibarlı tərəfdaşınızdır.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                backgroundColor: '#e31e24',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(227, 30, 36, 0.4)',
              }}
            >
              Kataloqa Bax
            </button>
            <button
              type="button"
              onClick={() => onNavigate('stores')}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
            >
              Mağazalarımız
            </button>
          </div>
        </div>
      </div>

      {/* Key Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '56px',
        }}
      >
        {[
          { label: 'İllik Təcrübə', val: '15+ İl', desc: 'Etibarlı xidmət tarixi', icon: <Award size={24} color="#e31e24" /> },
          { label: 'Məmnun Müştəri', val: '50,000+', desc: 'Azərbaycan üzrə', icon: <Users size={24} color="#0284c7" /> },
          { label: 'Rəsmi Zəmanət', val: '100%', desc: 'Rəsmi servis dəstəyi', icon: <ShieldCheck size={24} color="#16a34a" /> },
          { label: 'Orijinal Modellər', val: '500+ Model', desc: 'Daimi yenilənən çeşid', icon: <Zap size={24} color="#f59e0b" /> },
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              padding: '24px',
              borderRadius: '18px',
              backgroundColor: isDark ? '#131b2c' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: theme.text, fontFamily: 'Outfit, sans-serif' }}>
                {stat.val}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: theme.text, marginTop: '2px' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>
                {stat.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mission & Values Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '32px',
          marginBottom: '56px',
        }}
      >
        <div
          style={{
            padding: '32px',
            borderRadius: '20px',
            backgroundColor: isDark ? '#131b2c' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(227, 30, 36, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} color="#e31e24" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: theme.text, margin: 0 }}>
            Missiyamız
          </h2>
          <p style={{ fontSize: '14px', lineHeight: 1.7, color: theme.textSecondary, margin: 0 }}>
            Evlərinizdə rahatlıq, zövq və enerjiyə qənaəti təmin etmək üçün qabaqcıl Avropa texnologiyalarını
            ən əlçatan şərtlərlə və peşəkar servis xidməti ilə sizə çatdırmaqdır.
          </p>
        </div>

        <div
          style={{
            padding: '32px',
            borderRadius: '20px',
            backgroundColor: isDark ? '#131b2c' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(2, 132, 199, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2 size={20} color="#0284c7" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: theme.text, margin: 0 }}>
            Vizyonumuz
          </h2>
          <p style={{ fontSize: '14px', lineHeight: 1.7, color: theme.textSecondary, margin: 0 }}>
            Azərbaycanın məişət elektronikası bazarında ən etibarlı, innovativ və müştəri yönümlü brend olaraq,
            hər bir ailənin ilk seçimi olmaq və texnologiya standartlarını daim yüksəltməkdir.
          </p>
        </div>
      </div>

      {/* Why Choose Sahara List */}
      <div
        style={{
          padding: '36px clamp(20px, 4vw, 40px)',
          borderRadius: '24px',
          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
          marginBottom: '56px',
        }}
      >
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 900,
            color: theme.text,
            textAlign: 'center',
            margin: '0 0 28px 0',
          }}
        >
          Niyə Məhz Sahara Electronics?
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {[
            {
              title: 'Rəsmi Distribütorluq',
              desc: 'Bütün məhsullar birbaşa istehsalçı zavodlardan rəsmi sertifikat və gömrük bəyannaməsi ilə idxal olunur.',
            },
            {
              title: 'Sürətli Çatdırılma və Quraşdırma',
              desc: 'Bakı, Abşeron və bölgələr üzrə peşəkar servis briqadası tərəfindən ünvana çatdırılma və tam qaydalara uyğun quraşdırma.',
            },
            {
              title: 'Zəmanətli Xidmət və Ehtiyat Hissələri',
              desc: 'Məhsullarımıza 12 aydan 36 aya qədər tam rəsmi zəmanət və orijinal ehtiyat hissələri təminatı verilir.',
            },
            {
              title: 'Şəffaf Qiymət Siyasəti',
              desc: 'Ardıcıl endirimlər, xüsusi kampaniyalar və heç bir gizli xərc olmadan birbaşa anbar qiymətləri.',
            },
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: theme.text, margin: '0 0 4px 0' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '13px', lineHeight: 1.6, color: theme.textSecondary, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Contact CTA Banner */}
      <div
        style={{
          borderRadius: '20px',
          padding: '32px clamp(20px, 4vw, 40px)',
          backgroundColor: '#e31e24',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 6px 0' }}>
            Hər hansı sualınız və ya xüsusi sifarişiniz var?
          </h2>
          <p style={{ fontSize: '13.5px', opacity: 0.9, margin: 0 }}>
            Məsləhətçilərimiz sizə ən uyğun modeli seçməkdə məmnuniyyətlə kömək edəcəklər.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {onWhatsApp && (
            <button
              type="button"
              onClick={onWhatsApp}
              style={{
                padding: '12px 20px',
                borderRadius: '12px',
                backgroundColor: '#25D366',
                color: '#ffffff',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Phone size={15} />
              <span>WhatsApp ilə Əlaqə</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('support')}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              color: '#e31e24',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Əlaqə Səhifəsi
          </button>
        </div>
      </div>
    </div>
  );
};
