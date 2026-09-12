import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Məhsul tapılmadı',
  description = 'Axtarış və ya filter parametrlərinizi dəyişərək yenidən cəhd edin.',
  icon,
  actionLabel,
  onAction,
  className = '',
  style,
}) => {
  return (
    <div
      className={`sahara-empty-state ${className}`}
      role="region"
      aria-label="Boş vəziyyət"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        maxWidth: '480px',
        margin: '0 auto',
        ...style,
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(148, 163, 184, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          color: 'var(--text-muted, #64748b)',
        }}
        aria-hidden="true"
      >
        {icon || <PackageOpen size={32} />}
      </div>

      <h3
        style={{
          fontSize: '18px',
          fontWeight: 700,
          margin: '0 0 8px 0',
          color: 'var(--text, #0f172a)',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-muted, #64748b)',
          margin: '0 0 20px 0',
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="secondary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
