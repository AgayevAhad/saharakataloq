import React, { useState, useMemo } from 'react';
import {
  ArrowUp,
  ArrowRight,
  Instagram,
  Facebook,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Code2,
  Globe,
} from 'lucide-react';
import { CatalogCategory, CatalogSettings } from '../types/product';
import { ThemeColors } from '../types/theme';
import { WhatsAppIcon } from './WhatsAppIcon';
import { phoneHref, whatsappHref } from '../utils/contact';
import { ShimmerImage } from './ShimmerImage';

interface FooterProps {
  settings: CatalogSettings;
  categories?: CatalogCategory[];
  theme: ThemeColors;
  onSelectCategory?: (categoryId: string) => void;
  onNavigate?: (route: string) => void;
  variant?: 'site' | 'catalog';
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  categories: _categories,
  theme,
  onSelectCategory: _onSelectCategory,
  onNavigate,
  variant = 'site',
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const isCatalogMode = variant === 'catalog';

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

  const handleNavClick = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else if (typeof window !== 'undefined' && !isCatalogMode) {
      window.location.href = `/${route}`;
    }
  };

  return (
    <footer
      className={`catalog-footer-enhanced site-footer-v2 ${isCatalogMode ? 'footer-mode-catalog' : 'footer-mode-site'}`}
      style={{
        backgroundColor: theme.bgCard,
        borderTop: `1px solid ${theme.border}`,
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
        {/* Main Columns Grid */}
        <div
          className={isCatalogMode ? 'footer-grid-4col' : 'footer-grid-5col'}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '36px',
            marginBottom: '40px',
          }}
        >
          {/* Column 1: Brand & Slogan */}
          <div
            className="footer-column footer-brand-column"
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div
              className="footer-brand-logo-wrap"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <ShimmerImage
                src={theme.mode === 'dark' ? '/media/SaharaLogo-dark.png' : '/media/SaharaLogo.png'}
                alt="Sahara Electronics"
                containerStyle={{ height: '42px', width: '150px' }}
                style={{
                  height: '42px',
                  width: '100%',
                  objectFit: 'contain',
                  objectPosition: 'left center',
                }}
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
          <div
            className="footer-column footer-company-column"
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            <h4
              className="footer-column-title"
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
            {(isCatalogMode
              ? [
                  { label: 'Haqqımızda', route: 'about' },
                  { label: 'Mağazalar', route: 'stores' },
                  { label: 'Əlaqə və Dəstək', route: 'support' },
                ]
              : [
                  { label: 'Haqqımızda', route: 'about' },
                  { label: 'Mağazalar', route: 'stores' },
                  { label: 'Karyera', route: 'careers' },
                  { label: 'Əlaqə', route: 'support' },
                ]
            ).map((link, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleNavClick(link.route)}
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
                onMouseEnter={(e) => (e.currentTarget.style.color = '#e31e24')}
                onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted || '#64748b')}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Column 3 (Site only): Müştəri üçün */}
          {!isCatalogMode && (
            <div
              className="footer-column footer-customers-column"
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <h4
                className="footer-column-title"
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
                { label: 'Çatdırılma', route: 'delivery' },
                { label: 'Zəmanət', route: 'warranty' },
                { label: 'Qaytarma', route: 'returns' },
                { label: 'Tez-tez verilən suallar', route: 'faq' },
              ].map((link, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleNavClick(link.route)}
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
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#e31e24')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted || '#64748b')}
                >
                  {link.label}
                </button>
              ))}
            </div>
          )}

          {/* Column: Kömək və Qaydalar */}
          <div
            className="footer-column footer-help-column"
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            <h4
              className="footer-column-title"
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: theme.text,
                margin: '0 0 4px 0',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {isCatalogMode ? 'Kömək və Qaydalar' : 'Kömək'}
            </h4>
            {[
              { label: 'İstifadə şərtləri', route: 'terms' },
              { label: 'Məxfilik siyasəti', route: 'privacy' },
            ].map((link, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleNavClick(link.route)}
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
                onMouseEnter={(e) => (e.currentTarget.style.color = '#e31e24')}
                onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted || '#64748b')}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Column: Yeniliklərdən xəbərdar olun */}
          <div
            className="footer-column footer-subscribe-column"
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <h4
              className="footer-column-title"
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
                  backgroundColor: theme.mode === 'dark' ? '#18181b' : '#f8fafc',
                  color: theme.text,
                  padding: '0 12px',
                  fontSize: '13px',
                  outline: 'none',
                }}
                required
              />
              <button
                type="submit"
                className="sahara-soft-red-action"
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
          </div>
        </div>

        {/* Showroom Addresses & Contact Row when configured */}
        {(addressList.length > 0 ||
          phoneList.length > 0 ||
          waHref ||
          settings?.instagramUsername ||
          settings?.facebookUsername ||
          settings?.email) && (
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
              <div className="footer-addresses" style={{ flex: '1 1 300px' }}>
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
                  <span>
                    {addressList.length > 1 ? 'Mağaza və Filiallarımız' : 'Ünvan və Lokasiya'}
                  </span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {addressList.length > 1 ? (
                    addressList.map((addr, idx) => (
                      <div
                        key={idx}
                        style={{ fontSize: '12.5px', color: theme.textMuted || '#64748b' }}
                      >
                        <span style={{ fontWeight: 700, color: theme.text }}>
                          {addr.title || `Filial ${idx + 1}`}
                        </span>
                        <span>: </span>
                        <span>{addr.address}</span>
                        {addr.mapUrl && (
                          <a
                            href={addr.mapUrl}
                            title="Xəritədə açmaq üçün toxunun"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              marginLeft: '6px',
                              color: '#e31e24',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
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
                        style={{
                          marginLeft: '6px',
                          color: '#e31e24',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Direct Contacts, Socials & WhatsApp */}
            <div
              className="footer-direct-contacts"
              style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}
            >
              {(settings?.email || !phoneList.length) && (
                <a
                  href={`mailto:${settings?.email || 'info@saharaelectronics.az'}`}
                  data-contact-kind="email"
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
                  <Mail size={14} color="#e31e24" />
                  <span>{settings?.email || 'info@saharaelectronics.az'}</span>
                </a>
              )}

              {phoneList.map((ph, idx) => (
                <a
                  key={idx}
                  href={phoneHref(ph)}
                  data-contact-kind="phone"
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

              {settings?.instagramUsername && (
                <a
                  href={
                    settings.instagramUrl ||
                    `https://instagram.com/${settings.instagramUsername.replace('@', '')}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  data-contact-kind="instagram"
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
                  data-contact-kind="facebook"
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
                  data-contact-kind="whatsapp"
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
            </div>
          </div>
        )}

        {/* Sub-Footer Row */}
        <div
          className="footer-subfooter"
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
          <div className="footer-subfooter-copyright">
            © {new Date().getFullYear()} Sahara Electronics. Bütün hüquqlar qorunur.
          </div>

          {/* Developer Credit Badge */}
          {(settings?.developerName ||
            settings?.developerInstagram ||
            settings?.developerPhone ||
            settings?.developerWebsite) && (
            <div
              className="footer-developer-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: theme.textMuted || '#94a3b8',
                padding: '4px 12px',
                borderRadius: '20px',
                backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                border: `1px solid ${theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              }}
            >
              <Code2 size={13} color="#e31e24" />
              <span>
                Hazırladı:{' '}
                <strong style={{ color: theme.text, fontWeight: 700 }}>
                  {settings.developerName || 'Developer'}
                </strong>
                {settings.developerRole ? ` (${settings.developerRole})` : ''}
              </span>

              {/* Instagram */}
              {settings.developerInstagram && (
                <a
                  href={
                    settings.developerInstagram.startsWith('http')
                      ? settings.developerInstagram
                      : `https://instagram.com/${settings.developerInstagram.replace('@', '')}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Developer Instagram"
                  style={{
                    color: '#e1306c',
                    display: 'inline-flex',
                    alignItems: 'center',
                    marginLeft: '2px',
                  }}
                >
                  <Instagram size={13} />
                </a>
              )}

              {/* Phone / WhatsApp */}
              {settings.developerPhone && (
                <a
                  href={whatsappHref(settings.developerPhone, 'Salam!')}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Developer WhatsApp / Əlaqə"
                  style={{
                    color: '#16a34a',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <WhatsAppIcon size={13} color="#16a34a" />
                </a>
              )}

              {/* Website */}
              {settings.developerWebsite && (
                <a
                  href={
                    settings.developerWebsite.startsWith('http')
                      ? settings.developerWebsite
                      : `https://${settings.developerWebsite}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Developer Veb-sayt / Portfel"
                  style={{
                    color: '#e31e24',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <Globe size={13} />
                </a>
              )}
            </div>
          )}

          <div
            className="footer-subfooter-motto"
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
            className="footer-scroll-top-btn"
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
