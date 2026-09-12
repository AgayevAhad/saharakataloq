import React, { useState } from 'react';
import { Phone, MessageCircle, ChevronDown } from 'lucide-react';
import { CatalogSettings } from '../types/product';
import { ThemeColors } from '../types/theme';
import { Button } from '../components/ui/Button';

interface SupportPageProps {
  settings?: CatalogSettings;
  theme: ThemeColors;
  onWhatsApp: () => void;
  onCall: () => void;
}

export const SupportPage: React.FC<SupportPageProps> = ({
  settings: _settings,
  theme,
  onWhatsApp,
  onCall,
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Məhsul seçimi və sifariş üçün necə məsləhət ala bilərəm?',
      a: 'Bizimlə birbaşa WhatsApp və ya telefon vasitəsilə əlaqə saxlayaraq məhsul parametrləri, mövcudluq və təhvil şərtləri haqqında tam məlumat ala bilərsiniz.',
    },
    {
      q: 'Məhsullara necə baxa bilərəm?',
      a: 'Saytımızdakı onlayn kataloqdan modellərin texniki xüsusiyyətlərini və şəkillərini incələyə, həmçinin satış nöqtələrimizə yaxınlaşaraq canlı baxa bilərsiniz.',
    },
    {
      q: 'Məhsul zəmanəti necə təqdim olunur?',
      a: 'Məhsul təhvil verilərkən müvafiq zəmanət və təhvil sənədləri təqdim olunur.',
    },
  ];

  return (
    <div className="catalog-container" style={{ padding: '24px 16px 48px' }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: theme.text, marginBottom: '10px' }}>
          Müştəri Dəstəyi və Əlaqə
        </h1>
        <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>
          Suallarınızın cavabını tapın və ya məsləhətçilərimizlə birbaşa əlaqə qurun.
        </p>
      </div>

      {/* Support Contact Channels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          maxWidth: '720px',
          margin: '0 auto 40px',
        }}
      >
        <div
          style={{
            backgroundColor: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(37, 211, 102, 0.1)',
              color: '#25d366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <MessageCircle size={24} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: theme.text, marginBottom: '6px' }}>
            WhatsApp Dəstək Xətti
          </h3>
          <p style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '16px' }}>
            Sualınızı yazın, menecerlərimiz dərhal cavablandırsın.
          </p>
          <Button variant="primary" size="sm" onClick={onWhatsApp} style={{ width: '100%' }}>
            WhatsApp ilə Yazın
          </Button>
        </div>

        <div
          style={{
            backgroundColor: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              color: theme.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <Phone size={24} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: theme.text, marginBottom: '6px' }}>
            Telefonla Əlaqə
          </h3>
          <p style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '16px' }}>
            Zəng edərək birbaşa satış şöbəsi ilə danışın.
          </p>
          <Button variant="outline" size="sm" onClick={onCall} style={{ width: '100%' }}>
            Zəng Et
          </Button>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h3
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: theme.text,
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
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
                      padding: '12px 20px 16px',
                      fontSize: '13px',
                      color: theme.textMuted,
                      lineHeight: 1.5,
                      borderTop: `1px solid ${theme.border}`,
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
