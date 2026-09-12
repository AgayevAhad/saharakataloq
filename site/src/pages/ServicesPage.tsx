import React from 'react';
import { ShieldCheck, Truck, Wrench, Phone, MessageCircle, CheckCircle2 } from 'lucide-react';
import { CatalogSettings } from '../types/product';
import { ThemeColors } from '../types/theme';
import { Button } from '../components/ui/Button';

interface ServicesPageProps {
  settings?: CatalogSettings;
  theme: ThemeColors;
  onWhatsApp: () => void;
  onCall: () => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  settings: _settings,
  theme,
  onWhatsApp,
  onCall,
}) => {
  return (
    <div className="catalog-container" style={{ padding: '24px 16px 48px' }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: theme.text, marginBottom: '10px' }}>
          Zəmanət və Servis Dəstəyi
        </h1>
        <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>
          Sahara Electronics məhsulları üçün texniki dəstək, ehtiyat hissələri və servis xidmətləri
          ilə tanış olun.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '40px',
        }}
      >
        {/* Service 1: Zəmanət Dəstəyi */}
        <div
          style={{
            backgroundColor: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(22, 163, 74, 0.12)',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: theme.text, marginBottom: '8px' }}>
            Zəmanət Xidməti
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: theme.textMuted,
              lineHeight: 1.5,
              marginBottom: '16px',
            }}
          >
            Məhsulların zəmanət müddətləri və şərtləri istehsalçı və model üzrə təqdim olunur.
            Ətraflı məlumat üçün bizimlə əlaqə saxlayın.
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '12px',
              color: theme.text,
            }}
          >
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: '#16a34a' }} /> İstehsalçı təlimatına uyğun
              xidmət
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: '#16a34a' }} /> Məhsul üzrə dəqiq məlumat
            </li>
          </ul>
        </div>

        {/* Service 2: Çatdırılma Məlumatı */}
        <div
          style={{
            backgroundColor: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(2, 132, 199, 0.12)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Truck size={26} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: theme.text, marginBottom: '8px' }}>
            Təhvil və Sifariş Məlumatı
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: theme.textMuted,
              lineHeight: 1.5,
              marginBottom: '16px',
            }}
          >
            Cihazların mövcudluğu və mağazadan təhvil şərtləri barədə birbaşa məlumat ala
            bilərsiniz.
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '12px',
              color: theme.text,
            }}
          >
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: '#0284c7' }} /> Satış nöqtələrindən təhvil
              imkanı
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: '#0284c7' }} /> Təhvil zamanı vizual yoxlama
            </li>
          </ul>
        </div>

        {/* Service 3: Quraşdırma və Texniki Dəstək */}
        <div
          style={{
            backgroundColor: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(217, 119, 6, 0.12)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Wrench size={26} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: theme.text, marginBottom: '8px' }}>
            Quraşdırma və Məsləhət
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: theme.textMuted,
              lineHeight: 1.5,
              marginBottom: '16px',
            }}
          >
            Quraşdırılan mətbəx texnikası və iqlim cihazlarının montajı barədə texniki təlimat və
            məsləhət xidməti təqdim olunur.
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '12px',
              color: theme.text,
            }}
          >
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: '#d97706' }} /> Ölçü və yerləşmə
              konsultasiyası
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} style={{ color: '#d97706' }} /> Orijinal ehtiyat hissələri
              dəstəyi
            </li>
          </ul>
        </div>
      </div>

      {/* CTA Box */}
      <div
        style={{
          backgroundColor: theme.mode === 'dark' ? '#111827' : '#f8fafc',
          border: `1px solid ${theme.border}`,
          borderRadius: '16px',
          padding: '32px 24px',
          textAlign: 'center',
          maxWidth: '680px',
          margin: '0 auto',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: theme.text, marginBottom: '8px' }}>
          Servis və Zəmanət Məsələləri Üçün Əlaqə
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: theme.textMuted,
            maxWidth: '480px',
            margin: '0 auto 20px',
            lineHeight: 1.5,
          }}
        >
          Zəmanət şərtləri, montaj və ya təmir sorğusu üçün servis departamentimizlə birbaşa əlaqə
          saxlayın.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            size="md"
            onClick={onWhatsApp}
            leftIcon={<MessageCircle size={16} />}
          >
            WhatsApp ilə Müraciət
          </Button>
          <Button variant="outline" size="md" onClick={onCall} leftIcon={<Phone size={16} />}>
            Zəng Et
          </Button>
        </div>
      </div>
    </div>
  );
};
