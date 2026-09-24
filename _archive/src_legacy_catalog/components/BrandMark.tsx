import React from 'react';
import { Flower2, Package } from 'lucide-react';
import { Brand } from '../types/product';
import { ShimmerImage } from './ShimmerImage';

export const BrandMark: React.FC<{ brand: Brand; compact?: boolean; className?: string }> = ({ brand, compact = false, className = '' }) => {
  const fallbackNode = (
    <span className={`brand-mark-fallback ${compact ? 'compact' : ''} ${className}`} aria-label={brand.name}>
      {brand.id === 'lotus' ? <Flower2 /> : <Package />} {!compact && <b>{brand.name}</b>}
    </span>
  );

  if (brand.logo) {
    return (
      <ShimmerImage
        className={`brand-mark ${compact ? 'compact' : ''} ${className}`}
        src={brand.logo}
        alt={`${brand.name} loqosu`}
        objectFit="contain"
        spinnerSize={14}
        containerStyle={{ width: '100%', height: '100%' }}
        fallback={fallbackNode}
      />
    );
  }

  return fallbackNode;
};

