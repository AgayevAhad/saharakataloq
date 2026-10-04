import React from 'react';
import { Flower2, Package } from 'lucide-react';
import { Brand } from '../types/product';
import { ShimmerImage } from './ShimmerImage';
import { getBrandLogo, getBrandLogoFilter } from '../utils/brandLogos';

export const BrandMark: React.FC<{
  brand: Brand;
  compact?: boolean;
  className?: string;
  isDarkMode?: boolean;
}> = ({ brand, compact = false, className = '', isDarkMode }) => {
  const fallbackNode = (
    <span
      className={`brand-mark-fallback ${compact ? 'compact' : ''} ${className}`}
      aria-label={brand.name}
    >
      {brand.id === 'lotus' ? <Flower2 /> : <Package />} {!compact && <b>{brand.name}</b>}
    </span>
  );

  const isDark =
    isDarkMode ??
    (typeof document !== 'undefined' &&
      (document.documentElement.classList.contains('theme-dark') ||
        document.documentElement.getAttribute('data-theme')?.startsWith('dark') ||
        false));

  const logoSrc = getBrandLogo(brand.id, isDark, brand.logo);
  const logoFilter = getBrandLogoFilter(brand.id, isDark);

  if (logoSrc) {
    return (
      <ShimmerImage
        className={`brand-mark ${compact ? 'compact' : ''} ${className}`}
        src={logoSrc}
        alt={`${brand.name} loqosu`}
        objectFit="contain"
        spinnerSize={14}
        containerStyle={{ width: '100%', height: '100%' }}
        style={{ filter: logoFilter }}
        fallback={fallbackNode}
      />
    );
  }

  return fallbackNode;
};
