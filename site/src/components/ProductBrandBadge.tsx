import React from 'react';
import { Package } from 'lucide-react';
import { Brand } from '../types/product';
import { ShimmerImage } from './ShimmerImage';

interface ProductBrandBadgeProps {
  brand?: Brand;
  brandName?: string;
  className?: string;
}

/** Compact, reusable brand identity for every public product card. */
export const ProductBrandBadge: React.FC<ProductBrandBadgeProps> = ({
  brand,
  brandName,
  className = '',
}) => {
  const name = brand?.name || brandName;
  if (!name) return null;

  return (
    <span className={`product-brand-badge ${className}`.trim()} aria-label={`${name} brendi`}>
      {brand?.logo ? (
        <ShimmerImage
          src={brand.logo}
          alt={`${name} loqosu`}
          objectFit="contain"
          spinnerSize={10}
          className="product-brand-badge-logo"
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
