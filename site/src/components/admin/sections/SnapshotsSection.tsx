import React from 'react';
import { CatalogData } from '../../../types/product';
import { ThemeColors } from '../../../types/theme';
import { SnapshotManager } from '../../SnapshotManager';
import { PimMigrationManager } from '../../PimMigrationManager';

export interface SnapshotsSectionProps {
  theme: ThemeColors;
  csrfToken: string;
  showToast: (msg: string) => void;
  onRestore?: (restoredCatalog: CatalogData) => void;
}

export const SnapshotsSection: React.FC<SnapshotsSectionProps> = ({
  theme,
  csrfToken,
  showToast,
  onRestore,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <SnapshotManager
        theme={theme}
        csrfToken={csrfToken}
        showToast={showToast}
        onRestore={onRestore}
      />
      <PimMigrationManager
        theme={theme}
        csrfToken={csrfToken}
        showToast={showToast}
      />
    </div>
  );
};
