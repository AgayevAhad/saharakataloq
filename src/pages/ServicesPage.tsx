import React from 'react';
import { ShieldCheck, Truck, Wrench, RefreshCw, Phone, MessageCircle, FileText, CheckCircle2 } from 'lucide-react';
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
  settings,
  theme,
  onWhatsApp,
  onCall,
}) => {
  return (
    <div className="catalog-container" style={{ padding: '24px 16px 48px' }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: theme.text, marginBottom: '10px' }}>
          Sahara Care — Zəmanət, Quraşdırma və Servis Mərkəzi
        </h1>
        <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>
          Sahara Electronics-dən aldığınız hər bir cihaz üçün tam zəmanət və peşəkar servis xidməti təqdim olunur.
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
        {/* Service 1: Rəsmi Zəmanət */}
        <div
          style={{
            backgroundColor: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(22, 163, 74, 0.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <ShieldCheck size={26} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: theme.text, marginBottom: '8px' }}>
            3 İlə Qədər Rəsmi Zəmanət
          </h3>
          <p style={{ fontSize: '13px', color: theme.textMuted, lineHeight: 1.5, marginBottom: '16px' }}>
            Bütün cihazlar orijinal zavod sertifikatı və rəsmi zəmanət talonu ilə təmin olunur. İstehsal qüsuru aşkarlandıqda ödənişsiz ehtiyat hissəsi və təmir zəmanəti verilir.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: theme.text }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} style={{ color: '#16a34a' }} /> ARDO məişət texnikası üçün 3 il</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} style={{ color: '#16a34a' }} /> Lotus elektronika üçün rəsmi zəmanət</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} style={{ color: '#16a34a' }} /> Sertifikatlaşdırılmış servis aktı</li>
          </ul>
        </div>

        {/* Service 2: Çatdırılma & Təhlükəsiz Nəqliyyat */}
        <div
          style={{
            backgroundColor: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Truck size={26} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: theme.text, marginBottom: '8px' }}>
            Sürətli və Təhlükəsiz Çatdırılma
          </h3>
          <p style={{ fontSize: '13px', color: theme.textMuted, lineHeight: 1.5, marginBottom: '16px' }}>
            Böyük və həssas texnikalar (şüşə bişirmə panelləri, sobalar, soyuducular) xüsusi qoruyucu nəqliyyatla qapınıza çatdırılır.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: theme.text }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} style={{ color: '#0284c7' }} /> Bakı şəhəri daxili operativ çatdırılma</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} style={{ color: '#0284c7' }} /> Bölgələrə təhlükəsiz göndəriş</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} style={{ color: '#0284c7' }} /> Təhvil zamanı vizual yoxlama</li>
          </ul>
        </div>

        {/* Service 3: Quraşdırma və Montaj */}
        <div
          style={{
            backgroundColor: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(234, 88, 12, 0.12)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Wrench size={26} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: theme.text, marginBottom: '8px' }}>
            Sertifikatlı Quraşdırma
          </h3>
          <p style={{ fontSize: '13px', color: theme.textMuted, lineHeight: 1.5, marginBottom: '16px' }}>
            Mebel kəsimlərinə uyğunlaşdırma, qaz və elektrik təhlükəsizlik xətlərinin çəkilməsi peşəkar ustalar tərəfindən həyata keçirilir.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: theme.text }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} style={{ color: '#ea580c' }} /> Qaz nəzarət sistemlərinin kalibrlənməsi</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} style={{ color: '#ea580c' }} /> Aspirator hava kanalı montajı</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} style={{ color: '#ea580c' }} /> Elektrik gərginlik testi</li>
          </ul>
        </div>
      </div>

      {/* Direct Contact / Service Request CTA */}
      <div
        style={{
          background: theme.mode === 'dark' ? '#0f172a' : '#f8fafc',
          border: `1.5px solid ${theme.border}`,
          borderRadius: '20px',
          padding: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: theme.text, margin: '0 0 6px 0' }}>
            Servis müraciəti və ya quraşdırma tələbi yaratmaq istəyirsiniz?
          </h3>
          <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0 }}>
            Bizimlə birbaşa əlaqə saxlayın və ya WhatsApp vasitəsilə müraciət göndərin.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="primary" size="md" onClick={onWhatsApp} leftIcon={<MessageCircle size={16} />}>
            WhatsApp Servis Xətti
          </Button>
          <Button variant="outline" size="md" onClick={onCall} leftIcon={<Phone size={16} />}>
            Zəng Mərkəzi
          </Button>
        </div>
      </div>
    </div>
  );
};
