import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastProps {
  id?: string;
  message: string;
  type?: ToastType;
  visible?: boolean;
  onClose?: () => void;
  duration?: number;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  visible = true,
  onClose,
  className = '',
}) => {
  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="#16a34a" aria-hidden="true" />;
      case 'error':
        return <AlertCircle size={18} color="#ef4444" aria-hidden="true" />;
      case 'warning':
        return <AlertCircle size={18} color="#ea580c" aria-hidden="true" />;
      default:
        return <Info size={18} color="#0284c7" aria-hidden="true" />;
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`sahara-toast-wrapper ${className}`}
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '90vw',
        pointerEvents: 'none',
      }}
    >
      <div
        className="sahara-toast-content"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 18px',
          borderRadius: '999px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text, #0f172a)',
          border: '1px solid var(--border, #e2e8f0)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
          fontSize: '13px',
          fontWeight: 600,
          pointerEvents: 'auto',
          animation: 'fadeSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {getIcon()}
        <span>{message}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Bildirişi bağla"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              color: 'inherit',
              opacity: 0.6,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
