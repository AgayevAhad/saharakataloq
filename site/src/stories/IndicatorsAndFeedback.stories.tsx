import React from 'react';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { EmptyState } from '../components/ui/EmptyState';
import { NetworkState } from '../components/ui/NetworkState';

export const Badges = () => (
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '16px' }}>
    <Badge variant="primary">ARDO</Badge>
    <Badge variant="success">Stokda var</Badge>
    <Badge variant="warning">Məhdud sayda</Badge>
    <Badge variant="danger">Bitdi</Badge>
    <Badge variant="info">Yeni Model</Badge>
    <Badge variant="default">Standart</Badge>
  </div>
);

export const ToastShowcase = () => (
  <div style={{ padding: '16px', position: 'relative', height: '120px' }}>
    <Toast message="Məlumatlar uğurla yeniləndi" type="success" />
  </div>
);

export const EmptyStateShowcase = () => (
  <EmptyState
    title="Heç bir məhsul tapılmadı"
    description="Axtarış parametrlərinizi dəyişin"
    actionLabel="Filterləri Sıfırla"
    onAction={() => alert('Sıfırlandı')}
  />
);

export const NetworkStateShowcase = () => (
  <NetworkState onRetry={() => alert('Yenidən yoxlanılır...')} />
);
