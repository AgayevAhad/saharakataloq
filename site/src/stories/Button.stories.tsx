import React from 'react';
import { Button } from '../components/ui/Button';
import { Check, ArrowRight } from 'lucide-react';

export const Default = () => <Button>Klikləyin</Button>;

export const Variants = () => (
  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="danger">Danger</Button>
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
    <Button size="sm">Kiçik (SM)</Button>
    <Button size="md">Orta (MD)</Button>
    <Button size="lg">Böyük (LG)</Button>
  </div>
);

export const States = () => (
  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
    <Button isLoading>Yüklənir</Button>
    <Button disabled>Deaktiv</Button>
    <Button leftIcon={<Check size={16} />}>Təsdiqlə</Button>
    <Button rightIcon={<ArrowRight size={16} />}>İrəli</Button>
  </div>
);
