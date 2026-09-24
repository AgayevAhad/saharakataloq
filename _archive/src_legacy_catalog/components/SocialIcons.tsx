import React from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { ThemeColors } from '../types/theme';

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Canonical Official Instagram Vector Glyph
export const OfficialInstagramIcon: React.FC<IconProps> = ({ size = 20, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
  >
    <defs>
      <linearGradient id="ig-canonical-grad-clean" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ffd521" />
        <stop offset="20%" stopColor="#f50000" />
        <stop offset="50%" stopColor="#c5007c" />
        <stop offset="100%" stopColor="#7000ff" />
      </linearGradient>
    </defs>
    <path
      fill="url(#ig-canonical-grad-clean)"
      d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.42 1.35 20.75.936 19.96.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"
    />
  </svg>
);

// Canonical Official Meta Facebook Logo
export const OfficialFacebookIcon: React.FC<IconProps> = ({ size = 20, className = '', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
  >
    <path
      fill="#0866FF"
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    />
    <path
      fill="#ffffff"
      d="M16.671 15.469l.532-3.47h-3.328v-2.25c0-.949.465-1.874 1.956-1.874h1.514V4.918s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.643H7.078v3.47h3.047v8.385a12.09 12.09 0 003.75 0v-8.385h2.796z"
    />
  </svg>
);

interface SocialPopoverButtonProps {
  platform: 'instagram' | 'facebook';
  url: string;
  username?: string;
  theme: ThemeColors;
  position?: 'top' | 'bottom';
  compact?: boolean;
}

export const SocialPopoverButton: React.FC<SocialPopoverButtonProps> = ({
  platform,
  url,
  username,
  theme,
  position = 'bottom',
  compact = false,
}) => {
  const isIg = platform === 'instagram';
  const title = isIg ? 'Instagram' : 'Facebook';
  const defaultHandle = isIg ? '@saharaelectronics.az' : 'Sahara Electronics';
  const handle = username || defaultHandle;
  const brandColor = isIg ? '#e1306c' : '#0866FF';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="social-popover-wrapper" style={{ position: 'relative' }}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="icon-action social-action-btn"
        style={{
          borderColor: theme.border,
          background: theme.bgSecondary,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          padding: compact ? '6px' : '8px',
          borderRadius: '10px',
          transition: 'all 0.2s ease',
        }}
        aria-label={title}
      >
        {isIg ? <OfficialInstagramIcon size={20} /> : <OfficialFacebookIcon size={20} />}
      </a>

      {/* Sleek, Clean, Compact Popover Card */}
      <div
        className={`social-popover-card ${position === 'top' ? 'position-top' : ''}`}
        onClick={handleClick}
        style={{
          backgroundColor: theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)',
          border: `1px solid ${theme.mode === 'dark' ? 'rgba(255,255,255,0.15)' : theme.border}`,
          color: theme.text,
          cursor: 'pointer',
          minWidth: '220px',
          padding: '12px 14px',
          borderRadius: '14px',
          boxShadow: '0 16px 36px -8px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.2)',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          {isIg ? <OfficialInstagramIcon size={28} /> : <OfficialFacebookIcon size={28} />}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: theme.text }}>{title}</span>
              <CheckCircle2 size={13} color={brandColor} fill={brandColor} stroke="#ffffff" />
            </div>
            <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 600 }}>Rəsmi Səhifə</div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: theme.bgSecondary,
            padding: '6px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            color: brandColor,
            marginBottom: '8px',
            wordBreak: 'break-all',
          }}
        >
          {handle}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: brandColor,
            color: '#ffffff',
            padding: '7px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 750,
            boxShadow: `0 4px 12px ${brandColor}40`,
          }}
        >
          <span>Səhifəyə daxil ol</span>
          <ExternalLink size={12} />
        </div>
      </div>
    </div>
  );
};
