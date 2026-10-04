import React from 'react';
import { Package } from 'lucide-react';
import { Brand } from '../types/product';
import { ShimmerImage } from './ShimmerImage';
import { getBrandLogo, getBrandLogoFilter } from '../utils/brandLogos';

interface ProductBrandBadgeProps {
  brand?: Brand;
  brandName?: string;
  className?: string;
  isDarkMode?: boolean;
}

/** Compact, reusable brand identity for every public product card. */
export const ProductBrandBadge: React.FC<ProductBrandBadgeProps> = ({
  brand,
  brandName,
  className = '',
  isDarkMode,
}) => {
  const name = brand?.name || brandName;
  if (!name) return null;

  const isDark =
    isDarkMode ??
    (typeof document !== 'undefined' &&
      (document.documentElement.classList.contains('theme-dark') ||
        document.documentElement.getAttribute('data-theme')?.startsWith('dark') ||
        false));

  const logoSrc = getBrandLogo(brand?.id, isDark, brand?.logo);
  const logoFilter = getBrandLogoFilter(brand?.id, isDark);

  return (
    <span className={`product-brand-badge ${className}`.trim()} aria-label={`${name} brendi`}>
      {logoSrc ? (
        <ShimmerImage
          src={logoSrc}
          alt={`${name} loqosu`}
          objectFit="contain"
          spinnerSize={10}
          className="product-brand-badge-logo"
          style={{ filter: logoFilter }}
          containerStyle={{ width: '100%', height: '100%' }}
          fallback={<span className="product-brand-badge-name">{name}</span>}
        />
      ) : (
        <span className="product-brand-badge-name">
          <Package size={11} aria-hidden="true" />
          {name}
        </span>
      )}
    </span>
  );
};
