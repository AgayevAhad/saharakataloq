import React from 'react';
import { MapPin, Phone, Mail, Clock, ExternalLink, ArrowUp } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { SaharaLogo } from './SaharaLogo';
import { OfficialInstagramIcon, OfficialFacebookIcon } from './SocialIcons';
import { CatalogCategory, CatalogSettings } from '../types/product';
import { ThemeColors } from '../types/theme';
import { phoneHref, whatsappHref } from '../utils/contact';

interface FooterProps {
  settings: CatalogSettings;
  categories: CatalogCategory[];
  theme: ThemeColors;
  onSelectCategory?: (categoryId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  categories,
  theme,
  onSelectCategory,
}) => {
  const companyName = settings.companyName || 'Sahara Electronics';
  const address = settings.address || 'Bakı şəhəri, Sədərək Ticarət Mərkəzi';
  const email = settings.email || 'info@saharaelectronics.az';
  const workingHours = settings.workingHours || 'Bazar ertəsi - Bazar: 09:00 - 18:00';
  const locationNote = settings.locationNote || 'Məişət texnikası satışı və rəsmi zəmanət xidməti';

  const mapHref = settings.mapUrl || (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : undefined);
  const waHref = whatsappHref(settings.whatsappNumber, 'Salam, Sahara Electronics!');
  
  const phoneList = Array.isArray(settings.phoneNumbers) && settings.phoneNumbers.length
    ? settings.phoneNumbers.filter(Boolean)
    : settings.phoneNumber
      ? [settings.phoneNumber]
      : [];

  return (
    <footer
      className="catalog-footer-enhanced"
      style={{
        backgroundColor: theme.bgSecondary,
        borderTop: `1px solid ${theme.border}`,
        color: theme.text,
        padding: '40px 20px 24px 20px',
        marginTop: '40px',
        width: '100%',
      }}
    >
      <div
        className="footer-content-grid"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '32px',
          marginBottom: '32px',
        }}
      >
        {/* Column 1: Brand & About */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SaharaLogo className="footer-sahara-logo" isDark={theme.mode === 'dark'} />
          </div>
          <p style={{ color: theme.textSecondary, fontSize: '13px', lineHeight: '22px' }}>
            {locationNote || 'Eviniz və mətbəxiniz üçün premium keyfiyyətli məişət texnikasının rəsmi kataloq platforması.'}
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: theme.badgeBg,
              border: `1px solid ${theme.primaryLight}`,
              padding: '6px 12px',
              borderRadius: '8px',
              width: 'fit-content',
              fontSize: '11px',
              fontWeight: 700,
              color: theme.badgeText,
            }}
          >
            <span>🇮🇹 ARDO Rəsmi Distribütor</span>
          </div>
        </div>

        {/* Column 2: Address & Location (Clickable to open map) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '16px',
              fontWeight: 800,
              color: theme.text,
              letterSpacing: '0.5px',
            }}
          >
            Ünvan və Lokasiya
          </h3>

          <a
            href={mapHref || '#'}
            target="_blank"
            rel="noopener noreferrer"
            title="Xəritədə açmaq üçün toxunun"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              textDecoration: 'none',
              color: 'inherit',
              cursor: 'pointer',
              borderRadius: '8px',
              padding: '4px 0',
              transition: 'opacity 0.2s ease',
            }}
          >
            <MapPin size={18} color={theme.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text, lineHeight: '20px' }}>
                {address}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: theme.primary,
                  fontSize: '12px',
                  fontWeight: 700,
                  marginTop: '5px',
                }}
              >
                <span>Xəritədə aç</span>
                <ExternalLink size={12} />
              </div>
            </div>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <Clock size={18} color={theme.primary} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: theme.textSecondary }}>{workingHours}</span>
          </div>
        </div>

        {/* Column 3: Contact Channels & Social Media */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '16px',
              fontWeight: 800,
              color: theme.text,
              letterSpacing: '0.5px',
            }}
          >
            Əlaqə və Sosial Şəbəkələr
          </h3>

          {/* WhatsApp */}
          {settings.whatsappNumber ? (
            <a
              href={waHref || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: theme.text,
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(22, 163, 74, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <WhatsAppIcon size={16} color="#16a34a" />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: theme.textMuted }}>WhatsApp:</div>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>{settings.whatsappNumber}</span>
              </div>
            </a>
          ) : null}

          {/* Multiple Phone Calls */}
          {phoneList.map((ph, idx) => (
            <a
              key={idx}
              href={phoneHref(ph) || '#'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: theme.text,
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: theme.badgeBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Phone size={15} color={theme.primary} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: theme.textMuted }}>Əlaqə telefonu {phoneList.length > 1 ? `#${idx + 1}` : ''}:</div>
                <span style={{ color: theme.primary, fontWeight: 700 }}>{ph}</span>
              </div>
            </a>
          ))}

          {/* Instagram with Official SVG Icon */}
          {settings.instagramUrl ? (
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: theme.text,
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <OfficialInstagramIcon size={26} />
              <div>
                <div style={{ fontSize: '11px', color: theme.textMuted }}>Instagram:</div>
                <span style={{ color: '#e1306c', fontWeight: 700 }}>{settings.instagramUsername || '@sahara.electronics'}</span>
              </div>
            </a>
          ) : null}

          {/* Facebook with Official SVG Icon */}
          {settings.facebookUrl ? (
            <a
              href={settings.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: theme.text,
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <OfficialFacebookIcon size={26} />
              <div>
                <div style={{ fontSize: '11px', color: theme.textMuted }}>Facebook:</div>
                <span style={{ color: '#0866FF', fontWeight: 700 }}>{settings.facebookUsername || 'Sahara Electronics'}</span>
              </div>
            </a>
          ) : null}

          {/* Email */}
          {email ? (
            <a
              href={`mailto:${email}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: theme.textSecondary,
                textDecoration: 'none',
                fontSize: '12px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: theme.bgCard,
                  border: `1px solid ${theme.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Mail size={15} color={theme.textSecondary} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: theme.textMuted }}>E-poçt:</div>
                <span style={{ color: theme.text, fontWeight: 600 }}>{email}</span>
              </div>
            </a>
          ) : null}
        </div>

        {/* Column 4: Quick Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '16px',
              fontWeight: 800,
              color: theme.text,
              letterSpacing: '0.5px',
            }}
          >
            Məhsul Kateqoriyaları
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory?.(cat.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.textSecondary,
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = theme.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Copyright Row */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          paddingTop: '20px',
          borderTop: `1px solid ${theme.border}`,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '12px',
          color: theme.textMuted,
        }}
      >
        <p>© {new Date().getFullYear()} {companyName}. {settings.footerCopyright || 'Bütün hüquqlar qorunur.'}</p>

        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
            if (document.documentElement) document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
            if (document.body) document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            color: theme.text,
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <span>{settings.scrollTopButtonText || 'Səhifənin Başına Qayıt'}</span>
          <ArrowUp size={14} color={theme.primary} />
        </button>

        <p>{settings.footerAbout || 'Rəsmi İtalyan ARDO məhsulları və zəmanətli satış mərkəzi.'}</p>
      </div>
    </footer>
  );
};
