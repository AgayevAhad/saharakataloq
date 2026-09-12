import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { ThemeColors } from '../types/theme';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning';
  visible: boolean;
  theme: ThemeColors;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', visible, theme }) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 150,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '8px',
          border: `1px solid ${theme.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
          backgroundColor: theme.mode === 'dark' ? '#0f172a' : '#ffffff',
          padding: '10px 18px',
          borderRadius: '30px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          color: theme.text,
          fontSize: '13px',
          fontWeight: 600,
          pointerEvents: 'auto',
          animation: 'fadeSlideUp 0.25s ease-out',
        }}
      >
        {type === 'success' ? (
          <CheckCircle2 size={18} color="#16a34a" />
        ) : (
          <AlertCircle size={18} color={theme.primary} />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};
