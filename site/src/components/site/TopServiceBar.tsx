import React, { useState } from 'react';
import { MapPin, Clock, Phone, ChevronDown, Headset } from 'lucide-react';
import { CatalogSettings } from '../../types/product';
import { ThemeColors, DESIGN_TOKENS } from '../../types/theme';

interface TopServiceBarProps {
  settings?: CatalogSettings;
  theme: ThemeColors;
  onNavigate: (route: string) => void;
}

export const TopServiceBar: React.FC<TopServiceBarProps> = ({ settings, theme, onNavigate }) => {
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const addresses =
    settings?.addresses && settings.addresses.length > 0
      ? settings.addresses
      : settings?.address
        ? [{ id: 'primary', title: 'Mağaza / Şourum', address: settings.address }]
        : [];

  const primaryPhone =
    settings?.phoneNumbers && settings.phoneNumbers.length > 0
      ? settings.phoneNumbers[0]
      : settings?.phoneNumber || '';

  // If completely empty, render minimal or return null
  if (addresses.length === 0 && !settings?.workingHours && !primaryPhone) {
    return null;
  }

  return (
    <div
      className="top-service-bar no-print"
      style={{
        backgroundColor: theme.mode === 'dark' ? '#090c12' : '#f1f5f9',
        borderBottom: `1px solid ${theme.border}`,
        fontSize: '12px',
        color: theme.mode === 'dark' ? '#cbd5e1' : '#334155',
        padding: '5px 0',
        transition: 'background-color 0.25s ease',
      }}
    >
      <div
        className="catalog-container top-service-bar-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* Left: Showroom / Store selector & Working Hours */}
        <div
          className="top-service-left"
          style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 1, minWidth: 0 }}
        >
          {addresses.length > 0 && (
            <div style={{ position: 'relative', minWidth: 0 }}>
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
                  maxWidth: '100%',
                }}
              >
                <MapPin size={13} style={{ color: theme.primary, flexShrink: 0 }} />
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {addresses[0].title}
                </span>
                {addresses.length > 1 && (
                  <ChevronDown size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
                )}
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
                    maxWidth: '90vw',
                    zIndex: DESIGN_TOKENS.zIndex.overlay,
                  }}
                >
                  <div
                    style={{
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      opacity: 0.6,
                    }}
                  >
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
                      <span style={{ fontSize: '11px', color: theme.textMuted }}>
                        {addr.address}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {settings?.workingHours && (
            <div
              className="top-service-hours hide-on-mobile"
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Clock size={13} style={{ opacity: 0.7, flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap' }}>{settings.workingHours}</span>
            </div>
          )}
        </div>

        {/* Right: Support and Contact Call */}
        <div
          className="top-service-right"
          style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}
        >
          <button
            type="button"
            onClick={() => onNavigate('support')}
            className="top-service-support-btn hide-on-mobile"
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.textMuted,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Headset size={13} style={{ color: theme.primary }} />
            <span>Müştəri Dəstəyi & Əlaqə</span>
          </button>

          {primaryPhone && (
            <a
              href={`tel:${primaryPhone.replace(/\s+/g, '')}`}
              className="top-service-phone-link"
              style={{
                color: theme.text,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              aria-label={`Zəng et: ${primaryPhone}`}
            >
              <Phone size={13} style={{ color: theme.primary, flexShrink: 0 }} />
              <span className="top-service-phone-text">{primaryPhone}</span>
              <span className="top-service-phone-compact">Zəng</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
