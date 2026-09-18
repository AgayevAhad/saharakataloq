import React, { useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Users,
  Award,
  Sparkles,
  CheckCircle2,
  Send,
  MapPin,
  Clock,
  DollarSign,
  TrendingUp,
  HeartHandshake,
  Coffee,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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
  const isDark = themeMode === 'dark';
  const [expandedVacancy, setExpandedVacancy] = useState<string | null>('v1');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantPosition, setApplicantPosition] = useState('Satış Məsləhətçisi');
  const [applicantNote, setApplicantNote] = useState('');

  const vacancies = [
    {
      id: 'v1',
      title: 'Məişət Texnikası üzrə Satış Məsləhətçisi',
      department: 'Satış Şöbəsi',
      type: 'Tam ştat (Full-time)',
      location: 'Bakı şəhəri (Mərkəzi Showroom)',
      experience: '1-3 il pərakəndə satış təcrübəsi',
      duties: [
        'Müştəriləri mağazada qarşılamaq, məişət texnikası modelləri (ARDO, Lotus və s.) haqqında ətraflı məlumat vermək',
        'Müştərinin tələbatına uyğun ən optimal cihazları seçməkdə peşəkar köməklik göstərmək',
        'Satış planlarının icrasını təmin etmək və vitrin səliqəsinə nəzarət etmək',
        'Müştəri məmnuniyyətini ən yüksək səviyyədə saxlamaq',
      ],
      requirements: [
        'Azərbaycan dilində səlis danışıq (Rus dili arzuolunandır)',
        'Məişət elektronikası və texnika sahəsinə maraq',
        'Ünsiyyətcil, gülərüz və komandada işləmək bacarığı',
      ],
    },
    {
      id: 'v2',
      title: 'Texniki Servis və Quraşdırma Mütəxəssisi',
      department: 'Servis və Zəmanət Xidməti',
      type: 'Tam ştat (Full-time)',
      location: 'Bakı və Abşeron',
      experience: 'Minimum 2 il məişət texnikası təmiri/quraşdırılması',
      duties: [
        'Məişət avadanlıqlarının (qaz plitələri, sobalar, aspiratorlar, soyuducular) ünvanda montajı və quraşdırılması',
        'Zəmanətli və zəmanətdən kənar texniki diaqnostika və təmir işlərini həyata keçirmək',
        'İstifadə qaydaları haqqında müştərilərə təlimat vermək',
      ],
      requirements: [
        'Elektrik və qaz avadanlıqları ilə işləmə təhlükəsizlik sertifikatı və ya müvafiq texniki təhsil',
        'Sürücülük vəsiqəsi (B kateqoriyası)',
        'Məsuliyyətli, punktual və intizamlı yanaşma',
      ],
    },
    {
      id: 'v3',
      title: 'Rəqəmsal Marketinq və Kontent Meneceri',
      department: 'Marketinq Şöbəsi',
      type: 'Tam ştat / Hibrid',
      location: 'Bakı Baş Ofis',
      experience: 'Minimum 1 il elektron ticarət və ya rəqəmsal marketinq',
      duties: [
        'Kataloq və sosial media üçün məhsul təsvirlərinin, video və foto çarxların hazırlanması',
        'Reklam kampaniyalarının (Meta Ads, Google Ads) idarə olunması və optimallaşdırılması',
        'Aylıq analitika və satış artımı hesabatlarının tərtibatı',
      ],
      requirements: [
        'Kreativ düşüncə və vizual zövq',
        'Sosial media alətləri və təməl analitika bilikləri',
        'Komandada operativ və nəticəyönümlü işləmə qabiliyyəti',
      ],
    },
  ];

  const handleApplicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantPhone.trim()) return;
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setApplicantName('');
      setApplicantPhone('');
      setApplicantNote('');
    }, 4000);
  };

  return (
    <div
      className="careers-page-container fade-in-up"
      style={{
        maxWidth: '1280px',
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
          <span style={{ fontSize: '13px', color: theme.textMuted }}>Şirkət</span>
          <span style={{ fontSize: '13px', color: theme.textMuted }}>/</span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#e31e24' }}>Karyera</span>
        </div>
      </div>

      {/* Hero Header */}
      <div
        style={{
          borderRadius: '24px',
          backgroundColor: isDark ? '#111827' : '#0f172a',
          color: '#ffffff',
          padding: 'clamp(36px, 5vw, 56px) clamp(24px, 5vw, 48px)',
          marginBottom: '48px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at top right, rgba(227, 30, 36, 0.25) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px' }}>
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
            <Briefcase size={14} />
            <span>SAHARA ELECTRONICS KOMANDASINA QOŞULUN</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 3.8vw, 2.5rem)',
              fontWeight: 900,
              lineHeight: 1.25,
              margin: '0 0 16px 0',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            Gələcəyinizi Peşəkar Komanda ilə Birlikdə Qurun
          </h1>

          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.65,
              color: '#cbd5e1',
              margin: 0,
            }}
          >
            Biz dinamik inkişaf edən, innovativ texnologiyaları və yüksək müştəri məmnuniyyətini
            dəyərləndirən komandayıq. Əgər siz də peşəkar inkişaf və rəqabətli gəlir axtarırsınızsa,
            açıq vakansiyalarımıza müraciət edin!
          </p>
        </div>
      </div>

      {/* Perks & Benefits */}
      <div style={{ marginBottom: '56px' }}>
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 900,
            color: theme.text,
            textAlign: 'center',
            margin: '0 0 32px 0',
          }}
        >
          Niyə Sahara Electronics Komandası?
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >
          {[
            { title: 'Rəqabətli Əməkhaqqı & Bonuslar', desc: 'Fiks maaş + satış nəticələrinə görə yüksək faizli bonus sistemi.', icon: <DollarSign size={22} color="#16a34a" /> },
            { title: 'Daimi Təlim və İnkişaf', desc: 'Beynəlxalq brendlərin (İtaliya, Avropa) məhsul və satış təlimləri.', icon: <TrendingUp size={22} color="#e31e24" /> },
            { title: 'Dostyana və Müasir Mühit', desc: 'Qarşılıqlı hörmət və əməkdaşlığa əsaslanan mehriban kollektiv.', icon: <HeartHandshake size={22} color="#0284c7" /> },
            { title: 'Karyera Yüksəlişi', desc: 'Daxili təyinatlar və rəhbər vəzifələrə irəliləmə imkanları.', icon: <Award size={22} color="#f59e0b" /> },
          ].map((perk, idx) => (
            <div
              key={idx}
              style={{
                padding: '24px',
                borderRadius: '16px',
                backgroundColor: isDark ? '#131b2c' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {perk.icon}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: theme.text, margin: 0 }}>
                {perk.title}
              </h3>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: theme.textSecondary, margin: 0 }}>
                {perk.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Vacancies & Quick Application Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
          gap: '36px',
          alignItems: 'start',
        }}
      >
        {/* Left: Vacancy Accordion List */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: theme.text, margin: '0 0 20px 0' }}>
            Aktiv Vakansiyalar ({vacancies.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {vacancies.map((v) => {
              const isExpanded = expandedVacancy === v.id;
              return (
                <div
                  key={v.id}
                  style={{
                    borderRadius: '16px',
                    backgroundColor: isDark ? '#131b2c' : '#ffffff',
                    border: `1px solid ${isExpanded ? '#e31e24' : isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    boxShadow: isExpanded ? '0 8px 24px rgba(227, 30, 36, 0.12)' : 'none',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedVacancy(isExpanded ? null : v.id)}
                    style={{
                      width: '100%',
                      padding: '20px',
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(227, 30, 36, 0.12)',
                            color: '#e31e24',
                          }}
                        >
                          {v.department}
                        </span>
                        <span style={{ fontSize: '12px', color: theme.textMuted }}>{v.type}</span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: theme.text }}>
                        {v.title}
                      </h3>
                    </div>

                    <div style={{ color: theme.textMuted }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        padding: '0 20px 20px 20px',
                        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}`,
                        paddingTop: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '12.5px', color: theme.textSecondary }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} color="#e31e24" /> {v.location}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} color="#0284c7" /> {v.experience}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: theme.text, margin: '0 0 8px 0' }}>
                        Vəzifə Öhdəlikləri:
                      </h4>
                      <ul style={{ margin: '0 0 16px 0', paddingLeft: '18px', fontSize: '13px', color: theme.textSecondary, lineHeight: 1.6 }}>
                        {v.duties.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>

                      <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: theme.text, margin: '0 0 8px 0' }}>
                        Tələblər:
                      </h4>
                      <ul style={{ margin: '0 0 16px 0', paddingLeft: '18px', fontSize: '13px', color: theme.textSecondary, lineHeight: 1.6 }}>
                        {v.requirements.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        onClick={() => {
                          setApplicantPosition(v.title);
                          const formEl = document.getElementById('career-application-form');
                          if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          backgroundColor: '#e31e24',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Bu Vakansiyaya Müraciət Et
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Application Form */}
        <div
          id="career-application-form"
          style={{
            padding: '28px clamp(20px, 3.5vw, 32px)',
            borderRadius: '20px',
            backgroundColor: isDark ? '#131b2c' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(227, 30, 36, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={18} color="#e31e24" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: theme.text }}>
                Karyera Müraciət Formu
              </h2>
              <span style={{ fontSize: '12px', color: theme.textMuted }}>
                Məlumatlarınızı göndərin, komandamız sizinlə əlaqə saxlasın.
              </span>
            </div>
          </div>

          {formSubmitted ? (
            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: 'rgba(22, 163, 74, 0.12)',
                color: '#16a34a',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={32} />
              <div style={{ fontSize: '15px', fontWeight: 800 }}>Müraciətiniz qəbul edildi!</div>
              <div style={{ fontSize: '13px' }}>HR şöbəmiz qısa müddətdə sizinlə əlaqə saxlayacaqdır.</div>
            </div>
          ) : (
            <form onSubmit={handleApplicationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>
                  Ad və Soyadınız *
                </label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Məs: Rəşad Məmmədov"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}`,
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: theme.text,
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>
                  Əlaqə Nömrəniz *
                </label>
                <input
                  type="tel"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="+994 50 123 45 67"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}`,
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: theme.text,
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>
                  Müraciət etdiyiniz Vəzifə
                </label>
                <select
                  value={applicantPosition}
                  onChange={(e) => setApplicantPosition(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}`,
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: theme.text,
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                >
                  <option value="Satış Məsləhətçisi">Satış Məsləhətçisi</option>
                  <option value="Servis və Quraşdırma Mütəxəssisi">Servis və Quraşdırma Mütəxəssisi</option>
                  <option value="Rəqəmsal Marketinq Meneceri">Rəqəmsal Marketinq Meneceri</option>
                  <option value="Digər / Sərbəst müraciət">Digər / Sərbəst müraciət</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>
                  Qısa Təcrübə və ya Qeyd
                </label>
                <textarea
                  rows={3}
                  value={applicantNote}
                  onChange={(e) => setApplicantNote(e.target.value)}
                  placeholder="Əvvəlki iş təcrübəniz və ya əlavə qeydləriniz..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}`,
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: theme.text,
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#e31e24',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(227, 30, 36, 0.35)',
                }}
              >
                <span>Müraciəti Göndər</span>
                <Send size={15} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
