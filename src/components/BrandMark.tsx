import React, { useState } from 'react';
import { Flower2, Package } from 'lucide-react';
import { Brand } from '../types/product';

export const BrandMark: React.FC<{ brand: Brand; compact?: boolean; className?: string }> = ({ brand, compact = false, className = '' }) => {
  const [failed, setFailed] = useState(false);
  if (brand.logo && !failed) {
    return <img className={`brand-mark ${compact ? 'compact' : ''} ${className}`} src={brand.logo} alt={`${brand.name} loqosu`} onError={() => setFailed(true)} />;
  }
  return <span className={`brand-mark-fallback ${compact ? 'compact' : ''} ${className}`} aria-label={brand.name}>{brand.id === 'lotus' ? <Flower2 /> : <Package />} {!compact && <b>{brand.name}</b>}</span>;
};
