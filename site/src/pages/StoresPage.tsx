import React from 'react';
import { MapPin, Phone, Clock, MessageCircle, Navigation } from 'lucide-react';
import { CatalogSettings } from '../types/product';
import { ThemeColors } from '../types/theme';
import { Button } from '../components/ui/Button';

interface StoresPageProps {
  settings?: CatalogSettings;
  theme: ThemeColors;
  onWhatsApp: () => void;
  onCall: (phone?: string) => void;
}

export const StoresPage: React.FC<StoresPageProps> = ({ settings, theme, onWhatsApp, onCall }) => {
  const addresses =
    settings?.addresses && settings.addresses.length > 0
      ? settings.addresses
      : settings?.address
        ? [
            {
              id: 'primary',
              title: settings.companyName || 'Satış Salonu',
              address: settings.address,
              workingHours: settings.workingHours || '',
            },
          ]
        : [];

  return (
    <div className="catalog-container" style={{ padding: '24px 16px 48px' }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: theme.text, marginBottom: '10px' }}>
          Satış Salonları, Filiallar və Əlaqə
        </h1>
        <p style={{ fontSize: '14px', color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>
          Mağazalarımıza yaxınlaşaraq modelləri canlı incələyə, konsultasiya ala və təhvil götürə
          bilərsiniz.
        </p>
      </div>

      {addresses.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 16px',
            backgroundColor: theme.bgCard,
            borderRadius: '16px',
            border: `1px solid ${theme.border}`,
            maxWidth: '580px',
            margin: '0 auto 40px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              color: theme.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <MapPin size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: theme.text, marginBottom: '8px' }}>
            Ünvan məlumatı tezliklə əlavə ediləcək
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: theme.textMuted,
              maxWidth: '440px',
              margin: '0 auto 24px',
              lineHeight: 1.5,
            }}
          >
            Satış nöqtələrimizin dəqiq ünvanları və iş saatları barədə məlumat almaq üçün birbaşa
            əlaqə saxlayın.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="md"
              onClick={onWhatsApp}
              leftIcon={<MessageCircle size={16} />}
            >
              WhatsApp ilə Əlaqə
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => onCall()}
              leftIcon={<Phone size={16} />}
            >
              Zəng Et
            </Button>
          </div>
        </div>
      ) : (
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
                border: `1px solid ${theme.border}`,
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      color: theme.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '17px',
                        fontWeight: 700,
                        color: theme.text,
                        margin: '0 0 4px 0',
                      }}
                    >
                      {store.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '13px',
                        color: theme.textMuted,
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {store.address}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '14px',
                    backgroundColor: theme.bgSecondary,
                    borderRadius: '10px',
                    marginBottom: '16px',
                  }}
                >
                  {store.workingHours && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: theme.text,
                      }}
                    >
                      <Clock size={14} style={{ color: theme.primary }} />
                      <span>{store.workingHours}</span>
                    </div>
                  )}
                  {store.phone && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: theme.text,
                      }}
                    >
                      <Phone size={14} style={{ color: theme.primary }} />
                      <a
                        href={`tel:${store.phone}`}
                        style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}
                      >
                        {store.phone}
                      </a>
                    </div>
                  )}
                </div>

                {store.note && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: theme.textMuted,
                      fontStyle: 'italic',
                      margin: '0 0 16px 0',
                    }}
                  >
                    {store.note}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                {store.mapUrl && (
                  <a
                    href={store.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', flex: 1 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      style={{ width: '100%' }}
                      leftIcon={<Navigation size={14} />}
                    >
                      Xəritədə Bax
                    </Button>
                  </a>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  style={{ flex: 1 }}
                  onClick={onWhatsApp}
                  leftIcon={<MessageCircle size={14} />}
                >
                  Əlaqə
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
