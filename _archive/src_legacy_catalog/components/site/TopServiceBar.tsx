import React, { useState } from 'react';
import { MapPin, Clock, Phone, ShieldCheck, ChevronDown } from 'lucide-react';
import { CatalogSettings } from '../../types/product';
import { ThemeColors } from '../../types/theme';

interface TopServiceBarProps {
  settings?: CatalogSettings;
  theme: ThemeColors;
  onNavigate: (route: string) => void;
}

export const TopServiceBar: React.FC<TopServiceBarProps> = ({
  settings,
  theme,
  onNavigate,
}) => {
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const addresses = settings?.addresses && settings.addresses.length > 0
    ? settings.addresses
    : [{ id: 'default', title: 'Sədərək Ticarət Mərkəzi', address: settings?.address || 'Bakı şəhəri, Sədərək TM' }];

  const primaryPhone = settings?.phoneNumbers && settings.phoneNumbers.length > 0
    ? settings.phoneNumbers[0]
    : settings?.phoneNumber || '+994 50 200 00 00';

  return (
    <div
      className="top-service-bar no-print"
      style={{
        backgroundColor: theme.mode === 'dark' ? '#090c12' : '#f1f5f9',
        borderBottom: `1px solid ${theme.border}`,
        fontSize: '12px',
        color: theme.textMuted,
        padding: '6px 0',
        transition: 'background-color 0.25s ease',
      }}
    >
      <div
        className="catalog-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {/* Left: Showroom / Store selector & Working Hours */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsStoreDropdownOpen((prev) => !prev)}
              aria-expanded={isStoreDropdownOpen}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.text,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '6px',
              }}
            >
              <MapPin size={13} style={{ color: theme.primary }} />
              <span>{addresses[0].title}</span>
              <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </button>

            {isStoreDropdownOpen && (
              <div
                className="store-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '6px',
                  backgroundColor: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '12px',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
                  padding: '8px',
                  minWidth: '260px',
                  zIndex: 9999,
                }}
              >
                <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.6 }}>
                  Sərgi Salonları & Filiallar
                </div>
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => {
                      setIsStoreDropdownOpen(false);
                      onNavigate('stores');
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      color: theme.text,
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{addr.title}</span>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>{addr.address}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={13} style={{ opacity: 0.7 }} />
            <span>{settings?.workingHours || '09:00 - 18:00'}</span>
          </div>
        </div>

        {/* Right: Warranty badge, Service tracking & Call */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onNavigate('services')}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.textMuted,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <ShieldCheck size={13} style={{ color: '#16a34a' }} />
            <span>3 İlədək Rəsmi Zəmanət</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('support')}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.textMuted,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Servis & Sifariş İzləmə
          </button>

          <a
            href={`tel:${primaryPhone.replace(/\s+/g, '')}`}
            style={{
              color: theme.text,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Phone size={13} style={{ color: theme.primary }} />
            <span>{primaryPhone}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
