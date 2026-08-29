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
  showToast,
  onTrack,
  collapseDelayMs = 2000,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsExpanded(false);
    }, collapseDelayMs);
    return () => window.clearTimeout(timer);
  }, [collapseDelayMs]);

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

    // 1. Direct anchor scrollIntoView (smoothest and most reliable in modern browsers)
    const anchor = document.getElementById('catalog-top-anchor') || document.querySelector('header') || document.body;
    if (anchor && typeof anchor.scrollIntoView === 'function') {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // 2. Global window & document scrolling fallbacks
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }

    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
    const root = document.getElementById('root');
    if (root) {
      root.scrollTop = 0;
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
      {/* Permanent Scroll To Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        className="floating-action-btn floating-top"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isExpanded ? '6px' : '0',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          border: '1.5px solid rgba(255, 255, 255, 0.45)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 750,
          fontSize: '14px',
          padding: isExpanded ? '10px 16px' : '0',
          width: isExpanded ? 'auto' : '48px',
          height: isExpanded ? 'auto' : '48px',
          minWidth: isExpanded ? 'auto' : '48px',
          minHeight: isExpanded ? 'auto' : '48px',
          borderRadius: isExpanded ? '50px' : '50%',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        title="Səhifənin başına qayıt"
        aria-label="Səhifənin başına qayıt"
      >
        <ArrowUp size={22} color="#ffffff" strokeWidth={2.8} />
        {isExpanded && (
          <span className="btn-label" style={{ whiteSpace: 'nowrap' }}>
            Yuxarı
          </span>
        )}
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
          gap: isExpanded ? '8px' : '0',
          backgroundColor: 'rgba(37, 211, 102, 0.92)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.45)',
          boxShadow: '0 8px 24px rgba(37, 211, 102, 0.45), 0 2px 6px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 750,
          fontSize: '14px',
          padding: isExpanded ? '10px 18px' : '0',
          width: isExpanded ? 'auto' : '48px',
          height: isExpanded ? 'auto' : '48px',
          minWidth: isExpanded ? 'auto' : '48px',
          minHeight: isExpanded ? 'auto' : '48px',
          borderRadius: isExpanded ? '50px' : '50%',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        title="WhatsApp ilə birbaşa əlaqə"
        aria-label="WhatsApp ilə birbaşa əlaqə"
      >
        <WhatsAppIcon size={25} color="#ffffff" />
        {isExpanded && (
          <span className="btn-label" style={{ whiteSpace: 'nowrap' }}>
            WhatsApp
          </span>
        )}
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
          gap: isExpanded ? '8px' : '0',
          backgroundColor: 'rgba(239, 35, 55, 0.92)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.45)',
          boxShadow: '0 8px 24px rgba(239, 35, 55, 0.45), 0 2px 6px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 750,
          fontSize: '14px',
          padding: isExpanded ? '10px 18px' : '0',
          width: isExpanded ? 'auto' : '48px',
          height: isExpanded ? 'auto' : '48px',
          minWidth: isExpanded ? 'auto' : '48px',
          minHeight: isExpanded ? 'auto' : '48px',
          borderRadius: isExpanded ? '50px' : '50%',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        title="Zəng etmək üçün toxunun"
        aria-label="Zəng etmək üçün toxunun"
      >
        <Phone size={22} fill="#ffffff" color="#ffffff" strokeWidth={1} />
        {isExpanded && (
          <span className="btn-label" style={{ whiteSpace: 'nowrap' }}>
            Zəng et
          </span>
        )}
      </button>
    </aside>
  );
};
