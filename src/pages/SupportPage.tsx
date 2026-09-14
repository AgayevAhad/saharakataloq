import React, { useState } from 'react';
import { HelpCircle, ShieldCheck, Search, Phone, MessageCircle, ChevronDown, CheckCircle2 } from 'lucide-react';
import { CatalogSettings } from '../types/product';
import { ThemeColors } from '../types/theme';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface SupportPageProps {
  settings?: CatalogSettings;
  theme: ThemeColors;
  onWhatsApp: () => void;
  onCall: () => void;
}

export const SupportPage: React.FC<SupportPageProps> = ({
  settings,
  theme,
  onWhatsApp,
  onCall,
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingResult, setTrackingResult] = useState<string | null>(null);

  const faqs = [
    {
      q: 'Sahara Electronics məhsullarına neçə il zəmanət verilir?',
      a: 'Bütün ARDO məişət texnikası məhsullarına 3 ilədək, Lotus və digər rəsmi brendlərə isə 1-2 il rəsmi istehsalçı zəmanəti verilir. Zəmanət talonu məhsul təhvil verilərkən təqdim olunur.',
    },
    {
      q: 'Quraşdırılma xidməti necə həyata keçirilir?',
      a: 'Quraşdırılan soba, plitə, aspirator və ya kondisioner aldıqda sertifikatlı ustalarımız tərəfindən mebel kəsiminə uyğunlaşdırma və təhlükəsiz montaj həyata keçirilir.',
    },
    {
      q: 'Bakı xarici bölgələrə çatdırılma varmı?',
      a: 'Bəli, Sahara Electronics Azərbaycanın bütün rayon və şəhərlərinə təhlükəsiz və sığortalı çatdırılma xidməti göstərir.',
    },
    {
      q: 'Sifarişi və ya servis statusunu necə izləyə bilərəm?',
      a: 'Sizə verilmiş zəmanət talonu nömrəsini və ya qəbz kodunu daxil edərək aşağıdakı izləmə panelindən və ya birbaşa WhatsApp dəstək xəttindən statusu öyrənə bilərsiniz.',
    },
  ];

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setTrackingResult(`Sorğu #${trackingNumber}: Sifarişiniz təsdiqlənib və təhvil verilməyə hazırdır.`);
  };

  return (
    <div className="catalog-container" style={{ padding: '24px 16px 48px' }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: theme.text, marginBottom: '10px' }}>
          Müştəri Dəstəyi, FAQ & Servis İzləmə
        </h1>
        <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>
          Suallarınızın cavabını tapın, zəmanət statusunuzu yoxlayın və ya dərhal məsləhətçi ilə əlaqə qurun.
        </p>
      </div>

      {/* Tracking Box */}
      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto 40px',
          backgroundColor: theme.bgCard,
          border: `1.5px solid ${theme.border}`,
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: theme.text, marginBottom: '8px' }}>
          Sifariş & Servis Statusunu İzləyin
        </h3>
        <p style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '16px' }}>
          Zəmanət talonu və ya müraciət nömrənizi daxil edin:
        </p>

        <form onSubmit={handleTrack} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <Input
              placeholder="Məsələn: SH-2026-889"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Yoxla
          </Button>
        </form>

        {trackingResult && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(22, 163, 74, 0.1)',
              color: '#16a34a',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={18} />
            <span>{trackingResult}</span>
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: theme.text, marginBottom: '16px', textAlign: 'center' }}>
          Tez-Tez Verilən Suallar
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '14px',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    color: theme.text,
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                    }}
                  />
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: '0 20px 16px',
                      fontSize: '13px',
                      color: theme.textMuted,
                      lineHeight: 1.5,
                      borderTop: `1px solid ${theme.border}`,
                      paddingTop: '12px',
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
