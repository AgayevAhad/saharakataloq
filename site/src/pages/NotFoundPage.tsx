import React from 'react';
import { AlertCircle, Home, Grid } from 'lucide-react';
import { ThemeColors } from '../types/theme';
import { Button } from '../components/ui/Button';

interface NotFoundPageProps {
  theme: ThemeColors;
  onNavigate: (route: string) => void;
  message?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ theme, onNavigate, message }) => {
  return (
    <div
      className="catalog-container"
      style={{
        padding: '60px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: '50vh',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <AlertCircle size={36} />
      </div>

      <h1
        style={{
          fontSize: '24px',
          fontWeight: 800,
          color: theme.text,
          marginBottom: '10px',
        }}
      >
        Səhifə Tapılmadı və ya Aktiv Deyil
      </h1>

      <p
        style={{
          fontSize: '14px',
          color: theme.textMuted,
          maxWidth: '460px',
          lineHeight: 1.5,
          margin: '0 auto 28px',
        }}
      >
        {message ||
          'Axtardığınız səhifə mövcud deyil, ünvan dəyişdirilib və ya hazırda ictimai baxış üçün aktivləşdirilməyib.'}
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigate('home')}
          leftIcon={<Home size={16} />}
        >
          Ana Səhifəyə Qayıt
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={() => onNavigate('catalog')}
          leftIcon={<Grid size={16} />}
        >
          Kataloqa Bax
        </Button>
      </div>
    </div>
  );
};
