import { Product } from '../types/product';

export const getProductBadgeColor = (badgeColor: Product['badgeColor']) => {
  switch (badgeColor) {
    case 'amber':
      return '#f97316';
    case 'green':
      return '#16a34a';
    case 'blue':
      return '#2563eb';
    case 'purple':
      return '#7c3aed';
    default:
      return '#dc2626';
  }
};

/** Legacy imports marked "Yeni" automatically; an admin-edited badge clears isNew. */
export const getVisibleBadgeText = (product: Product) => {
  const text = product.badgeText?.trim();
  if (!text || (product.isNew && text.toLocaleLowerCase('az-AZ') === 'yeni')) return '';
  return text;
};
