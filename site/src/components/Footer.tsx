import React, { useState, useMemo } from 'react';
import { ArrowUp, ArrowRight, Instagram, Facebook, Youtube, MapPin, Phone, ExternalLink } from 'lucide-react';
import { CatalogCategory, CatalogSettings } from '../types/product';
import { ThemeColors } from '../types/theme';
import { WhatsAppIcon } from './WhatsAppIcon';
import { phoneHref, whatsappHref } from '../utils/contact';

interface FooterProps {
  settings: CatalogSettings;
  categories?: CatalogCategory[];
  theme: ThemeColors;
  onSelectCategory?: (categoryId: string) => void;
  onNavigate?: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  categories: _categories,
  theme,
  onSelectCategory: _onSelectCategory,
  onNavigate,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const address = settings?.address || '';
  const workingHours = settings?.workingHours || '';
  const locationNote = settings?.locationNote || '';

  const waHref = whatsappHref(settings?.whatsappNumber, 'Salam, Sahara Electronics!');

  const phoneList =
    Array.isArray(settings?.phoneNumbers) && settings.phoneNumbers.length
      ? settings.phoneNumbers.filter(Boolean)
      : settings?.phoneNumber
        ? [settings.phoneNumber]
        : [];

  const addressList = useMemo(() => {
    if (settings?.addresses && settings.addresses.length > 1) {
      return settings.addresses;
    }
    if (settings?.addresses && settings.addresses.length === 1) {
      return [
        {
          ...settings.addresses[0],
          address: settings.address || settings.addresses[0].address,
        },
      ];
    }
    if (settings?.address) {
      return [
        {
          id: 'single',
          title: 'Əsas Mağaza',
          address: settings.address,
          mapUrl: settings.mapUrl,
          workingHours: settings.workingHours || workingHours,
          note: settings.locationNote || locationNote,
        },
      ];
    }
    return [];
  }, [
    settings?.addresses,
    settings?.address,
    settings?.mapUrl,
    settings?.workingHours,
    settings?.locationNote,
    workingHours,
    locationNote,
  ]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSubscribed(true);
    setEmailInput('');
    setTimeout(() => setIsSubscribed(false), 4000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      className="catalog-footer-enhanced site-footer-v2"
      style={{
        backgroundColor: theme.mode === 'dark' ? '#090d13' : '#ffffff',
        borderTop: `1px solid ${theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#eaecf0'}`,
        color: theme.text,
        padding: '56px 20px 24px 20px',
        marginTop: '40px',
        width: '100%',
      }}
    >
      <div
        className="catalog-container"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
        }}
      >
        {/* Main 5-Column Grid matching siteUI.png */}
        <div
          className="footer-grid-5col"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '36px',
            marginBottom: '40px',
          }}
        >
          {/* Column 1: Brand & Slogan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={theme.mode === 'dark' ? '/media/SaharaLogo-dark.png' : '/media/SaharaLogo.png'}
                alt="Sahara Electronics"
                style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
              />
            </div>
            <p
              style={{
                color: theme.textMuted || '#64748b',
                fontSize: '13.5px',
                lineHeight: '20px',
                margin: 0,
                maxWidth: '220px',
              }}
            >
              Texnologiya
              <br />
              həyatınızı daha gözəl edir.
            </p>
          </div>

          {/* Column 2: Şirkət */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: theme.text,
                margin: '0 0 4px 0',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Şirkət
            </h4>
            {[
              { label: 'Haqqımızda', route: 'about' },
              { label: 'Mağazalar', route: 'stores' },
              { label: 'Karyera', route: 'careers' },
              { label: 'Əlaqə', route: 'support' },
            ].map((link, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => (onNavigate ? onNavigate(link.route) : null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  textAlign: 'left',
                  color: theme.textMuted || '#64748b',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                }}
                className="footer-nav-link"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Column 3: Müştəri üçün */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: theme.text,
                margin: '0 0 4px 0',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Müştəri üçün
            </h4>
            {[
              { label: 'Çatdırılma', route: 'services' },
              { label: 'Zəmanət', route: 'services' },
              { label: 'Qaytarma', route: 'support' },
              { label: 'Tez-tez verilən suallar', route: 'support' },
            ].map((link, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => (onNavigate ? onNavigate(link.route) : null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  textAlign: 'left',
                  color: theme.textMuted || '#64748b',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                }}
                className="footer-nav-link"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Column 4: Kömək */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: theme.text,
                margin: '0 0 4px 0',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Kömək
            </h4>
            {[
              { label: 'İstifadə şərtləri', route: 'terms' },
              { label: 'Məxfilik siyasəti', route: 'privacy' },
            ].map((link, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => (onNavigate ? onNavigate(link.route) : null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  textAlign: 'left',
                  color: theme.textMuted || '#64748b',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                }}
                className="footer-nav-link"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Column 5: Yeniliklərdən xəbərdar olun */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: theme.text,
                margin: '0 0 4px 0',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Yeniliklərdən xəbərdar olun
            </h4>

            <form
              onSubmit={handleSubscribe}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
              }}
            >
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="E-poçt ünvanınız"
                style={{
                  flex: 1,
                  height: '40px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                  backgroundColor: theme.mode === 'dark' ? '#161d2b' : '#f8fafc',
                  color: theme.text,
                  padding: '0 12px',
                  fontSize: '13px',
                  outline: 'none',
                }}
                required
              />
              <button
                type="submit"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#e31e24',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'transform 0.15s ease',
                }}
                aria-label="Abunə ol"
              >
                <ArrowRight size={16} />
              </button>
            </form>

            {isSubscribed && (
              <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                ✓ Uğurla abunə oldunuz!
              </span>
            )}

            {/* Social Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: theme.textMuted || '#64748b', transition: 'color 0.15s ease' }}
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: theme.textMuted || '#64748b', transition: 'color 0.15s ease' }}
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: theme.textMuted || '#64748b', transition: 'color 0.15s ease' }}
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Showroom Addresses & Contact Row when configured */}
        {(addressList.length > 0 || phoneList.length > 0 || waHref || settings?.instagramUsername || settings?.facebookUsername) && (
          <div
            className="footer-showrooms-contact-row"
            style={{
              borderTop: `1px solid ${theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'}`,
              paddingTop: '24px',
              paddingBottom: '24px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px',
              justifyContent: 'space-between',
            }}
          >
            {/* Showrooms & Addresses */}
            {addressList.length > 0 && (
              <div style={{ flex: '1 1 300px' }}>
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: theme.text,
                    margin: '0 0 10px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <MapPin size={15} color="#e31e24" />
                  <span>{addressList.length > 1 ? 'Mağaza və Filiallarımız' : 'Ünvan və Lokasiya'}</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {addressList.length > 1 ? (
                    addressList.map((addr, idx) => (
                      <div key={idx} style={{ fontSize: '12.5px', color: theme.textMuted || '#64748b' }}>
                        <span style={{ fontWeight: 700, color: theme.text }}>{addr.title || `Filial ${idx + 1}`}</span>
                        <span>: </span>
                        <span>{addr.address}</span>
                        {addr.mapUrl && (
                          <a
                            href={addr.mapUrl}
                            title="Xəritədə açmaq üçün toxunun"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ marginLeft: '6px', color: '#e31e24', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12.5px', color: theme.textMuted || '#64748b' }}>
                      <span>{addressList[0].address}</span>
                      <a
                        href={addressList[0].mapUrl || 'https://maps.google.com'}
                        title="Xəritədə açmaq üçün toxunun"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: '6px', color: '#e31e24', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Direct Contacts, Socials & WhatsApp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {settings?.instagramUsername && (
                <a
                  href={settings.instagramUrl || `https://instagram.com/${settings.instagramUsername.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: theme.text,
                    textDecoration: 'none',
                  }}
                >
                  <Instagram size={15} color="#e1306c" />
                  <span>{settings.instagramUsername}</span>
                </a>
              )}

              {settings?.facebookUsername && (
                <a
                  href={settings.facebookUrl || 'https://facebook.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: theme.text,
                    textDecoration: 'none',
                  }}
                >
                  <Facebook size={15} color="#1877f2" />
                  <span>{settings.facebookUsername}</span>
                </a>
              )}

              {settings?.whatsappNumber && waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#16a34a',
                    textDecoration: 'none',
                  }}
                >
                  <WhatsAppIcon size={16} color="#16a34a" />
                  <span>{settings.whatsappNumber}</span>
                </a>
              )}

              {phoneList.map((ph, idx) => (
                <a
                  key={idx}
                  href={phoneHref(ph)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: theme.text,
                    textDecoration: 'none',
                  }}
                >
                  <Phone size={14} color="#e31e24" />
                  <span>{ph}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Footer Row */}
        <div
          style={{
            borderTop: `1px solid ${theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'}`,
            paddingTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12.5px',
            color: theme.textMuted || '#94a3b8',
          }}
        >
          <div>© {new Date().getFullYear()} Sahara Electronics. Bütün hüquqlar qorunur.</div>

          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '14px',
              color: theme.mode === 'dark' ? '#cbd5e1' : '#475569',
            }}
          >
            Daha çox imkan, hər zaman sizinlə!
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.textMuted || '#64748b',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <span>Yuxarı</span>
            <ArrowUp size={13} />
          </button>
        </div>
      </div>
    </footer>
  );
};
