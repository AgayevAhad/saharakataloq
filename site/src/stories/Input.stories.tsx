import React from 'react';
import { Input } from '../components/ui/Input';
import { Search, Mail, Lock } from 'lucide-react';

export const Default = () => (
  <div style={{ maxWidth: '360px' }}>
    <Input label="Ad və Soyad" placeholder="Məsələn: Əli Əliyev" />
  </div>
);

export const WithIcons = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '360px' }}>
    <Input
      label="Axtarış"
      placeholder="Məhsul və ya model kodu..."
      leftIcon={<Search size={18} />}
    />
    <Input label="E-poçt" placeholder="admin@sahara.az" leftIcon={<Mail size={18} />} />
    <Input label="Şifrə" type="password" placeholder="••••••••" leftIcon={<Lock size={18} />} />
  </div>
);

export const ErrorAndHintStates = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '360px' }}>
    <Input
      label="Telefon nömrəsi"
      placeholder="+994 50 000 00 00"
      error="Mobil nömrə düzgün formatda deyil"
    />
    <Input label="Kupon Kodu" placeholder="PROMO2026" hint="Kupon kodunuz varsa daxil edin" />
  </div>
);
