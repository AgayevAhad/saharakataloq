import React, { useEffect, useState } from 'react';
import { Phone, ArrowUp } from 'lucide-react';
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

  const isDarkMode = theme?.mode === 'dark';

  // Smooth collapse timer on initial load
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsExpanded(false);
    }, collapseDelayMs);
    return () => window.clearTimeout(timer);
  }, [collapseDelayMs]);

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
    const text = 'Salam, Sahara Electronics! Kataloqdakı məhsullar haqqında məlumat almaq istəyirəm.';
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
        zIndex: 99999,
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
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid rgba(203, 213, 225, 0.85)',
          boxShadow: isDarkMode
            ? '0 10px 30px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.2)'
            : '0 10px 26px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 750,
          fontSize: '13px',
          padding: isExpanded && showScrollTop ? '9px 15px' : '0',
          width: isExpanded && showScrollTop ? 'auto' : (showScrollTop ? '46px' : '0px'),
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
        <ArrowUp size={20} color={isDarkMode ? '#f8fafc' : '#1e293b'} strokeWidth={2.6} style={{ flexShrink: 0 }} />
        <span
          className="btn-label"
          style={{
            maxWidth: isExpanded && showScrollTop ? '90px' : '0px',
            opacity: isExpanded && showScrollTop ? 1 : 0,
            marginLeft: isExpanded && showScrollTop ? '5px' : '0px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            transition: 'max-width 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease, margin 0.35s ease',
          }}
        >
          {settings.scrollTopButtonText || 'Yuxarı'}
        </span>
      </button>

      {/* WhatsApp Action Button */}
      <button
        type="button"
        onClick={handleWhatsApp}
        className="floating-action-btn floating-wa"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.88)' : 'rgba(34, 197, 94, 0.90)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.45)',
          boxShadow: isDarkMode
            ? '0 10px 30px rgba(34, 197, 94, 0.45), 0 2px 6px rgba(0, 0, 0, 0.2)'
            : '0 8px 26px rgba(34, 197, 94, 0.35), 0 2px 6px rgba(0, 0, 0, 0.06)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
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
        <WhatsAppIcon size={23} color="#ffffff" />
        <span
          className="btn-label"
          style={{
            maxWidth: isExpanded ? '100px' : '0px',
            opacity: isExpanded ? 1 : 0,
            marginLeft: isExpanded ? '7px' : '0px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            transition: 'max-width 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease, margin 0.35s ease',
          }}
        >
          {settings.whatsappButtonText || 'WhatsApp'}
        </span>
      </button>

      {/* Call Action Button */}
      <button
        type="button"
        onClick={handleCall}
        className="floating-action-btn floating-call"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.88)' : 'rgba(220, 38, 38, 0.90)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.45)',
          boxShadow: isDarkMode
            ? '0 10px 30px rgba(220, 38, 38, 0.45), 0 2px 6px rgba(0, 0, 0, 0.2)'
            : '0 8px 26px rgba(220, 38, 38, 0.35), 0 2px 6px rgba(0, 0, 0, 0.06)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
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
        <Phone size={20} fill="#ffffff" color="#ffffff" strokeWidth={1} style={{ flexShrink: 0 }} />
        <span
          className="btn-label"
          style={{
            maxWidth: isExpanded ? '90px' : '0px',
            opacity: isExpanded ? 1 : 0,
            marginLeft: isExpanded ? '7px' : '0px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            transition: 'max-width 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease, margin 0.35s ease',
          }}
        >
          {settings.callButtonText || 'Zəng et'}
        </span>
      </button>
    </aside>
  );
};
