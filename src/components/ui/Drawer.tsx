import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'bottom';
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isBottom = position === 'bottom';
  const isLeft = position === 'left';

  return (
    <div
      className="sahara-drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: isBottom ? 'flex-end' : isLeft ? 'flex-start' : 'flex-end',
        flexDirection: isBottom ? 'column' : 'row',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        className={`sahara-drawer-panel ${className}`}
        style={{
          width: isBottom ? '100%' : '380px',
          maxWidth: '100%',
          height: isBottom ? 'auto' : '100%',
          maxHeight: isBottom ? '85dvh' : '100%',
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text, #0f172a)',
          boxShadow: '0 0 32px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          borderTopLeftRadius: isBottom || !isLeft ? '20px' : '0',
          borderTopRightRadius: isBottom || isLeft ? '20px' : '0',
          borderBottomLeftRadius: isLeft ? '20px' : '0',
          overflow: 'hidden',
          animation: isBottom ? 'slideUp 0.3s ease-out' : 'slideIn 0.3s ease-out',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border, rgba(148, 163, 184, 0.15))',
          }}
        >
          {title && (
            <h2 id="drawer-title" style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Bağla"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              color: 'inherit',
              opacity: 0.7,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};
