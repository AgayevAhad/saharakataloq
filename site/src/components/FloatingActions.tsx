import React, { useEffect, useState } from 'react';
import { Phone, ArrowUp, Globe } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { CatalogSettings } from '../types/product';
import { ThemeColors } from '../types/theme';
import { phoneHref, whatsappHref } from '../utils/contact';

interface FloatingActionsProps {
  settings: CatalogSettings;
  theme?: ThemeColors;
  showToast: (msg: string) => void;
  onTrack?: (type: 'contact_whatsapp' | 'contact_call') => void;
  collapseDelayMs?: number;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  settings,
  theme,
  showToast,
  onTrack,
  collapseDelayMs = 2400,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isSiteLinkFaded, setIsSiteLinkFaded] = useState(false);
  const [isSiteLinkHovered, setIsSiteLinkHovered] = useState(false);

  const isDarkMode = theme?.mode === 'dark';

  // Smooth collapse timer on initial load
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsExpanded(false);
    }, collapseDelayMs);
    return () => window.clearTimeout(timer);
  }, [collapseDelayMs]);

  // Site Link smooth fade to transparent after initial entrance
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsSiteLinkFaded(true);
    }, 2800);
    return () => window.clearTimeout(timer);
  }, []);

  // Track scroll position: Only show "Yuxarı" button after scrolling down towards products
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollY > 280) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWhatsApp = () => {
    const text =
      'Salam, Sahara Electronics! Kataloqdakı məhsullar haqqında məlumat almaq istəyirəm.';
    const href = whatsappHref(settings.whatsappNumber, text);
    if (!href) {
      showToast('WhatsApp nömrəsi admin paneldə hələ əlavə edilməyib.');
      return;
    }
    onTrack?.('contact_whatsapp');
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const handleCall = () => {
    const phone = settings.phoneNumber || settings.phoneNumbers?.[0];
    const href = phoneHref(phone);
    if (!href) {
      showToast('Əlaqə nömrəsi admin paneldə hələ əlavə edilməyib.');
      return;
    }
    onTrack?.('contact_call');
    window.open(href, '_self');
  };

  const scrollToTop = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (typeof window !== 'undefined') {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      } catch {}
      const anchor = document.getElementById('catalog-top-anchor');
      if (anchor && typeof anchor.scrollIntoView === 'function') {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <aside
      className={`mobile-floating-actions ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}
      aria-label="Sürətli əlaqə və naviqasiya vasitələri"
      style={{
        position: 'fixed',
        bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        right: '16px',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
      }}
    >
      {/* Go to Main Site Action Pill (Positioned above WhatsApp & Call buttons) */}
      <a
        href="/"
        className="floating-site-btn"
        onMouseEnter={() => setIsSiteLinkHovered(true)}
        onMouseLeave={() => setIsSiteLinkHovered(false)}
        title="Sahara Əsas Saytına Keçid"
        aria-label="Sahara Əsas Saytına Keçid"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '30px',
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.88)' : 'rgba(15, 23, 42, 0.86)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.20)',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 700,
          fontSize: '12px',
          textDecoration: 'none',
          cursor: 'pointer',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          opacity: isSiteLinkHovered ? 1 : isSiteLinkFaded ? 0.38 : 1,
          transform: isSiteLinkHovered ? 'scale(1.04) translateY(-1px)' : 'scale(1) translateY(0)',
          transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          userSelect: 'none',
        }}
      >
        <Globe size={13} color="#38bdf8" />
        <span>Sayta keçid</span>
      </a>

      {/* Buttons Row: Scroll to Top, WhatsApp, Call */}
      <div
        className="floating-buttons-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Scroll To Top Button (Appears only after scrolling down towards catalog) */}
        <button
          type="button"
          onClick={scrollToTop}
          className={`floating-action-btn floating-top ${showScrollTop ? 'is-visible' : 'is-hidden'}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.88)' : 'rgba(255, 255, 255, 0.88)',
            color: isDarkMode ? '#f8fafc' : '#1e293b',
            border: isDarkMode
              ? '1px solid rgba(255, 255, 255, 0.16)'
              : '1px solid rgba(203, 213, 225, 0.85)',
            boxShadow: isDarkMode
              ? '0 10px 30px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.2)'
              : '0 10px 26px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 750,
            fontSize: '13px',
            padding: isExpanded && showScrollTop ? '9px 15px' : '0',
            width: isExpanded && showScrollTop ? 'auto' : showScrollTop ? '46px' : '0px',
            height: showScrollTop ? '46px' : '0px',
            minWidth: showScrollTop ? '46px' : '0px',
            minHeight: showScrollTop ? '46px' : '0px',
            borderRadius: '50px',
            opacity: showScrollTop ? 1 : 0,
            pointerEvents: showScrollTop ? 'auto' : 'none',
            transform: showScrollTop ? 'scale(1) translateY(0)' : 'scale(0.6) translateY(12px)',
            transition: 'all 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
          }}
          title="Səhifənin başına qayıt"
          aria-label="Səhifənin başına qayıt"
        >
          <ArrowUp
            size={20}
            color={isDarkMode ? '#f8fafc' : '#1e293b'}
            strokeWidth={2.6}
            style={{ flexShrink: 0 }}
          />
          <span
            className="btn-label"
            style={{
              maxWidth: isExpanded && showScrollTop ? '90px' : '0px',
              opacity: isExpanded && showScrollTop ? 1 : 0,
              marginLeft: isExpanded && showScrollTop ? '5px' : '0px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition:
                'max-width 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease, margin 0.35s ease',
            }}
          >
            {settings.scrollTopButtonText || 'Yuxarı'}
          </span>
        </button>

        {/* WhatsApp Action Button - Light Green Round Circle with Green Icon */}
        <button
          type="button"
          onClick={handleWhatsApp}
          className="floating-action-btn floating-wa"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.18)' : 'rgba(34, 197, 94, 0.14)',
            color: '#16a34a',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            boxShadow: isDarkMode
              ? '0 8px 24px rgba(0, 0, 0, 0.35), 0 2px 6px rgba(34, 197, 94, 0.15)'
              : '0 6px 20px rgba(34, 197, 94, 0.18), 0 2px 6px rgba(0, 0, 0, 0.04)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 750,
            fontSize: '13.5px',
            padding: isExpanded ? '9px 17px' : '0',
            width: isExpanded ? 'auto' : '46px',
            height: '46px',
            minWidth: '46px',
            minHeight: '46px',
            borderRadius: '50px',
            transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
          }}
          title="WhatsApp ilə birbaşa əlaqə"
          aria-label="WhatsApp ilə birbaşa əlaqə"
        >
          <WhatsAppIcon size={22} color="#16a34a" />
          <span
            className="btn-label"
            style={{
              maxWidth: isExpanded ? '100px' : '0px',
              opacity: isExpanded ? 1 : 0,
              marginLeft: isExpanded ? '7px' : '0px',
              color: '#16a34a',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition:
                'max-width 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease, margin 0.35s ease',
            }}
          >
            {settings.whatsappButtonText || 'WhatsApp'}
          </span>
        </button>

        {/* Call Action Button - Light Red Round Circle with Red Icon */}
        <button
          type="button"
          onClick={handleCall}
          className="floating-action-btn floating-call"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.18)' : 'rgba(220, 38, 38, 0.14)',
            color: '#dc2626',
            border: '1px solid rgba(220, 38, 38, 0.35)',
            boxShadow: isDarkMode
              ? '0 8px 24px rgba(0, 0, 0, 0.35), 0 2px 6px rgba(220, 38, 38, 0.15)'
              : '0 6px 20px rgba(220, 38, 38, 0.18), 0 2px 6px rgba(0, 0, 0, 0.04)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 750,
            fontSize: '13.5px',
            padding: isExpanded ? '9px 17px' : '0',
            width: isExpanded ? 'auto' : '46px',
            height: '46px',
            minWidth: '46px',
            minHeight: '46px',
            borderRadius: '50px',
            transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
          }}
          title="Zəng etmək üçün toxunun"
          aria-label="Zəng etmək üçün toxunun"
        >
          <Phone size={19} fill="#dc2626" color="#dc2626" strokeWidth={1} style={{ flexShrink: 0 }} />
          <span
            className="btn-label"
            style={{
              maxWidth: isExpanded ? '90px' : '0px',
              opacity: isExpanded ? 1 : 0,
              marginLeft: isExpanded ? '7px' : '0px',
              color: '#dc2626',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition:
                'max-width 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease, margin 0.35s ease',
            }}
          >
            {settings.callButtonText || 'Zəng et'}
          </span>
        </button>
      </div>
    </aside>
  );
};
