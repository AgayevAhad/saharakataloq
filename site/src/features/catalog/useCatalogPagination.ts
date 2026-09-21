import { useCallback, useEffect, useMemo, useState } from 'react';

export type CatalogViewMode = 'grid' | 'list';

interface CatalogPaginationOptions {
  resetKey: string;
  rowsPerPage?: number;
}

const columnsForWidth = (width: number) => (width >= 1200 ? 3 : width >= 600 ? 2 : 1);

/** Keeps responsive row pagination independent from the catalog page markup. */
export function useCatalogPagination({ resetKey, rowsPerPage = 8 }: CatalogPaginationOptions) {
  const [viewMode, setViewMode] = useState<CatalogViewMode>('grid');
  const [visibleRows, setVisibleRows] = useState(rowsPerPage);
  const [viewportColumns, setViewportColumns] = useState(() =>
    typeof window === 'undefined' ? 3 : columnsForWidth(window.innerWidth)
  );

  useEffect(() => {
    const updateColumns = () => setViewportColumns(columnsForWidth(window.innerWidth));
    updateColumns();
    window.addEventListener('resize', updateColumns, { passive: true });
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  useEffect(() => setVisibleRows(rowsPerPage), [resetKey, rowsPerPage, viewMode]);

  const visibleProductCount = useMemo(
    () => visibleRows * (viewMode === 'list' ? 1 : viewportColumns),
    [viewMode, viewportColumns, visibleRows]
  );
  const showMore = useCallback(() => setVisibleRows((rows) => rows + rowsPerPage), [rowsPerPage]);

  return {
    viewMode,
    setViewMode,
    viewportColumns,
    visibleProductCount,
    showMore,
  };
}
