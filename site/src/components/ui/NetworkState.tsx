import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface NetworkStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const NetworkState: React.FC<NetworkStateProps> = ({
  title = 'Bağlantı xətası baş verdi',
  description = 'Serverlə əlaqə qurularkən problem yarandı. İnternet bağlantınızı yoxlayıb yenidən cəhd edin.',
  onRetry,
  isRetrying = false,
  className = '',
  style,
}) => {
  return (
    <div
      className={`sahara-network-state ${className}`}
      role="alert"
      aria-live="assertive"
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
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          color: '#ef4444',
        }}
        aria-hidden="true"
      >
        <WifiOff size={32} />
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

      {onRetry && (
        <Button
          variant="primary"
          size="md"
          onClick={onRetry}
          isLoading={isRetrying}
          leftIcon={<RefreshCw size={16} />}
        >
          Yenidən yoxla
        </Button>
      )}
    </div>
  );
};
