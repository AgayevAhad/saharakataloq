import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
import { pushOverlay, popOverlay, isTopOverlay } from '../../utils/backgroundIsolation';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'bottom';
  className?: string;
}

const FOCUSABLE_ELEMENTS =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  className = '',
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const instanceId = useId();
  const titleId = `drawer-title-${instanceId}`;

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    if (backdropRef.current) {
      pushOverlay(instanceId, backdropRef.current);
    }

    const focusTimeout = setTimeout(() => {
      if (drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          drawerRef.current.focus();
        }
      }
    }, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTopOverlay(instanceId)) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS)
        ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !drawerRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !drawerRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(focusTimeout);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      popOverlay(instanceId);

      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === 'function'
      ) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, instanceId]);

  if (!isOpen) return null;

  const isBottom = position === 'bottom';
  const isLeft = position === 'left';

  return (
    <div
      ref={backdropRef}
      data-testid="ui-drawer"
      className="sahara-drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal, 110)',
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
        ref={drawerRef}
        tabIndex={-1}
        className={`sahara-drawer-panel ${className}`}
        style={{
          width: isBottom ? '100%' : '380px',
          maxWidth: '100%',
          height: isBottom ? 'auto' : '100%',
          maxHeight: isBottom ? '85dvh' : '100%',
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text, #0f172a)',
          boxShadow: 'var(--shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25))',
          display: 'flex',
          flexDirection: 'column',
          borderTopLeftRadius: isBottom || !isLeft ? 'var(--radius-2xl, 24px)' : '0',
          borderTopRightRadius: isBottom || isLeft ? 'var(--radius-2xl, 24px)' : '0',
          borderBottomLeftRadius: isLeft ? 'var(--radius-2xl, 24px)' : '0',
          overflow: 'hidden',
          animation: isBottom ? 'slideUp 0.3s ease-out' : 'slideIn 0.3s ease-out',
          outline: 'none',
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
            <h2 id={titleId} style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
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
              borderRadius: 'var(--radius-md, 8px)',
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
