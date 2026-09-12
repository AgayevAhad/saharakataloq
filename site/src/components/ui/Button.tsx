import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const baseClass = `sahara-btn sahara-btn-${variant} sahara-btn-${size} ${fullWidth ? 'sahara-btn-block' : ''} ${className}`;

  return (
    <button
      className={baseClass}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minHeight: size === 'sm' ? '36px' : size === 'lg' ? '50px' : '44px',
        minWidth: size === 'sm' ? '36px' : size === 'lg' ? '50px' : '44px',
        padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 24px' : '10px 18px',
        borderRadius: '10px',
        fontWeight: 600,
        fontSize: size === 'sm' ? '13px' : size === 'lg' ? '16px' : '14px',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: disabled ? 0.6 : 1,
        border: 'none',
        outline: 'none',
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 size={size === 'sm' ? 14 : 16} className="img-spin" />
          <span>Yüklənir...</span>
        </>
      ) : (
        <>
          {leftIcon && (
            <span className="btn-icon-left" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <span>{children}</span>
          {rightIcon && (
            <span className="btn-icon-right" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
};
