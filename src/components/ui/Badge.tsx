import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  style,
  ...props
}) => {
  const getColors = (): { bg: string; text: string; border: string } => {
    switch (variant) {
      case 'primary':
        return { bg: 'rgba(220, 38, 38, 0.12)', text: '#dc2626', border: 'rgba(220, 38, 38, 0.25)' };
      case 'success':
        return { bg: 'rgba(22, 163, 74, 0.12)', text: '#16a34a', border: 'rgba(22, 163, 74, 0.25)' };
      case 'warning':
        return { bg: 'rgba(234, 88, 12, 0.12)', text: '#ea580c', border: 'rgba(234, 88, 12, 0.25)' };
      case 'danger':
        return { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.25)' };
      case 'info':
        return { bg: 'rgba(2, 132, 199, 0.12)', text: '#0284c7', border: 'rgba(2, 132, 199, 0.25)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.12)', text: 'inherit', border: 'rgba(148, 163, 184, 0.25)' };
    }
  };

  const colors = getColors();

  return (
    <span
      className={`sahara-badge sahara-badge-${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'sm' ? '2px 6px' : '4px 8px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 600,
        borderRadius: '6px',
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        lineHeight: 1.2,
        userSelect: 'none',
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
};
