import React from 'react';
import { MapPin, Phone, Clock, MessageCircle, ExternalLink, Navigation } from 'lucide-react';
import { CatalogSettings } from '../types/product';
import { ThemeColors } from '../types/theme';
import { Button } from '../components/ui/Button';

interface StoresPageProps {
  settings?: CatalogSettings;
  theme: ThemeColors;
  onWhatsApp: () => void;
  onCall: (phone?: string) => void;
}

export const StoresPage: React.FC<StoresPageProps> = ({
  settings,
  theme,
  onWhatsApp,
  onCall,
}) => {
  const addresses = settings?.addresses && settings.addresses.length > 0
    ? settings.addresses
    : [
        {
          id: 'store-sederek',
          title: 'Sədərək Ticarət Mərkəzi Showroom',
          address: settings?.address || 'Bakı şəhəri, Sədərək Ticarət Mərkəzi, Sıra 12, Mağaza 44',
          workingHours: settings?.workingHours || 'Bazar ertəsi - Bazar: 09:00 - 18:00',
          mapUrl: 'https://maps.google.com/?q=Sederek+Ticaret+Merkezi',
          note: 'Bütün ARDO, Lotus və Artel məhsullarının canlı vitrini və anbar təhvil nöqtəsi.',
        },
        {
          id: 'store-dernegul',
          title: 'Dərnəgül Satış & Servis Mərkəzi',
          address: 'Bakı şəhəri, Nərimanov r-nu, Ziya Bünyadov pr. 1965',
          workingHours: 'Bazar ertəsi - Şənbə: 09:00 - 19:00',
          mapUrl: 'https://maps.google.com/?q=Ziya+Bunyadov+Baku',
          note: 'Rəsmi zəmanət xidməti, ehtiyat hissələri və korporativ satış departamenti.',
        },
      ];

  return (
    <div className="catalog-container" style={{ padding: '24px 16px 48px' }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: theme.text, marginBottom: '10px' }}>
          Sərgi Salonları, Filiallar və Əlaqə
        </h1>
        <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>
          Sahara Electronics mağazalarına yaxınlaşaraq modelləri canlı incələyə, konsultasiya ala və dərhal təhvil götürə bilərsiniz.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '40px',
        }}
      >
        {addresses.map((store) => (
          <div
            key={store.id}
            style={{
              backgroundColor: theme.bgCard,
              border: `1.5px solid ${theme.border}`,
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(220, 38, 38, 0.12)', color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={20} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: theme.text, margin: 0 }}>
                  {store.title}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', fontSize: '13px' }}>
                <div style={{ display: 'flex', gap: '10px', color: theme.text }}>
                  <MapPin size={16} style={{ color: theme.primary, flexShrink: 0, marginTop: '2px' }} />
                  <span>{store.address}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', color: theme.textMuted }}>
                  <Clock size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
                  <span>{store.workingHours || settings?.workingHours || '09:00 - 18:00'}</span>
                </div>

                {store.note && (
                  <p style={{ fontSize: '12px', color: theme.textMuted, margin: 0, padding: '10px', backgroundColor: theme.mode === 'dark' ? '#0b0f19' : '#f8fafc', borderRadius: '10px', lineHeight: 1.4 }}>
                    {store.note}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {store.mapUrl && (
                <a
                  href={store.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', flex: 1 }}
                >
                  <Button variant="outline" size="sm" fullWidth leftIcon={<Navigation size={14} />}>
                    Xəritədə Bax
                  </Button>
                </a>
              )}
              <Button variant="primary" size="sm" onClick={onWhatsApp} leftIcon={<MessageCircle size={14} />}>
                WhatsApp ilə Yaz
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
