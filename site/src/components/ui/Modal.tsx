import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
import { pushOverlay, popOverlay, isTopOverlay } from '../../utils/backgroundIsolation';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string | number;
  className?: string;
}

const FOCUSABLE_ELEMENTS =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = '560px',
  className = '',
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const instanceId = useId();
  const titleId = `modal-title-${instanceId}`;
  const descriptionId = `modal-desc-${instanceId}`;

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Save previously active element for focus restoration
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    if (backdropRef.current) {
      pushOverlay(instanceId, backdropRef.current);
    }

    // Initial focus into modal
    const focusTimeout = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          modalRef.current.focus();
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

      // Focus Trap with Tab & Shift+Tab
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS)
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
            !modalRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !modalRef.current.contains(document.activeElement)
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

      // Restore previous focus
      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === 'function'
      ) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, instanceId]);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="sahara-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal, 110)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4, 16px)',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        overflowY: 'auto',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`sahara-modal-card ${className}`}
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text, #0f172a)',
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: 'var(--shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25))',
          border: '1px solid var(--border, rgba(148, 163, 184, 0.2))',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100dvh - 32px)',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          outline: 'none',
        }}
      >
        {(title || onClose) && (
          <div
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border, rgba(148, 163, 184, 0.15))',
            }}
          >
            <div>
              {title && (
                <h2 id={titleId} style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id={descriptionId}
                  style={{ fontSize: '13px', opacity: 0.7, margin: '4px 0 0 0' }}
                >
                  {description}
                </p>
              )}
            </div>
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'inherit',
                opacity: 0.7,
                transition: 'opacity 0.2s ease',
              }}
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};
