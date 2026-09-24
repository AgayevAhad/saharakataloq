import React from 'react';
import { ThemeColors } from '../../../types/theme';
import { CategoryTreeManager } from '../../CategoryTreeManager';

export interface CategoriesSectionProps {
  theme: ThemeColors;
  csrfToken: string;
  onViewCategoryProducts?: (categoryId: string) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  theme,
  csrfToken,
  onViewCategoryProducts,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <CategoryTreeManager
        theme={theme}
        csrfToken={csrfToken}
        onViewCategoryProducts={onViewCategoryProducts}
      />
    </div>
  );
};
