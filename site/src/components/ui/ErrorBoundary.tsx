import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Sahara ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleReload = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className="sahara-error-boundary"
          style={{
            minHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '32px 20px',
            margin: '24px auto',
            maxWidth: '520px',
            borderRadius: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'inherit',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <AlertTriangle size={26} />
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Xəta baş verdi</h2>

          <p style={{ fontSize: '13px', opacity: 0.75, maxWidth: '420px', marginBottom: '20px' }}>
            Bu bölmə yüklənərkən texniki uyğunsuzluq yarandı. Yenilə düyməsini sıxaraq yenidən cəhd
            edə bilərsiniz.
          </p>

          <Button
            variant="primary"
            size="md"
            onClick={this.handleReload}
            leftIcon={<RefreshCw size={15} />}
          >
            Səhifəni Yenilə
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
