import React from 'react';
import { ThemeColors } from '../../../types/theme';
import { BrandRegistryStudio } from '../../BrandRegistryStudio';
import { BrandRailStudio } from '../../BrandRailStudio';

export interface BrandsSectionProps {
  theme: ThemeColors;
  csrfToken: string;
  showToast?: (msg: string) => void;
  showBrandRail?: boolean;
  onQuickOpenBrandRail?: () => void;
}

export const BrandsSection: React.FC<BrandsSectionProps> = ({
  theme,
  csrfToken,
  showToast,
  showBrandRail = false,
  _onQuickOpenBrandRail,
}: BrandsSectionProps & { _onQuickOpenBrandRail?: () => void }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {showBrandRail ? (
        <BrandRailStudio theme={theme} csrfToken={csrfToken} showToast={showToast || (() => {})} />
      ) : (
        <BrandRegistryStudio theme={theme} csrfToken={csrfToken} />
      )}
    </div>
  );
};
