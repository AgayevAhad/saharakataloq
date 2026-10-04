import type { CatalogSortOption } from './catalogSelection';

export type CatalogUrlView = 'catalog' | 'cart' | 'favorites';

export interface CatalogUrlState {
  brands: string[];
  category: string | null;
  query: string;
  minPrice: number | null;
  maxPrice: number | null;
  onlyDiscounted: boolean;
  onlyWithVideo: boolean;
  energyClass: string;
  motorType: string;
  color: string;
  sortBy: CatalogSortOption;
  comparisonIds: string[];
  view: CatalogUrlView;
}

const VALID_SORT_OPTIONS = new Set<CatalogSortOption>([
  'all',
  'recommended',
  'price-asc',
  'price-desc',
  'newest',
]);

const splitList = (value: string | null): string[] =>
  Array.from(
    new Set(
      (value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );

const parsePrice = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const readCatalogUrlState = (search: string): CatalogUrlState => {
  const params = new URLSearchParams(search);
  const sortParam = params.get('sort') as CatalogSortOption | null;
  const viewParam = params.get('view');

  return {
    brands: splitList(params.get('brand')),
    category: params.get('category'),
    query: params.get('q') || '',
    minPrice: parsePrice(params.get('min')),
    maxPrice: parsePrice(params.get('max')),
    onlyDiscounted: params.get('discount') === '1',
    onlyWithVideo: params.get('video') === '1',
    energyClass: params.get('energy') || 'all',
    motorType: params.get('motor') || 'all',
    color: params.get('color') || 'all',
    sortBy: sortParam && VALID_SORT_OPTIONS.has(sortParam) ? sortParam : 'all',
    comparisonIds: splitList(params.get('compare')),
    view: viewParam === 'cart' || viewParam === 'favorites' ? viewParam : 'catalog',
  };
};

const setOptionalParam = (
  params: URLSearchParams,
  key: string,
  value: string | null | undefined,
  defaultValue?: string
) => {
  if (!value || value === defaultValue) {
    params.delete(key);
    return;
  }
  params.set(key, value);
};

export const writeCatalogUrlState = (url: URL, state: CatalogUrlState): URL => {
  const next = new URL(url.toString());
  const { searchParams } = next;

  setOptionalParam(searchParams, 'brand', state.brands.join(','));
  setOptionalParam(searchParams, 'category', state.category);
  setOptionalParam(searchParams, 'q', state.query.trim());
  setOptionalParam(searchParams, 'min', state.minPrice?.toString());
  setOptionalParam(searchParams, 'max', state.maxPrice?.toString());
  setOptionalParam(searchParams, 'discount', state.onlyDiscounted ? '1' : null);
  setOptionalParam(searchParams, 'video', state.onlyWithVideo ? '1' : null);
  setOptionalParam(searchParams, 'energy', state.energyClass, 'all');
  setOptionalParam(searchParams, 'motor', state.motorType, 'all');
  setOptionalParam(searchParams, 'color', state.color, 'all');
  setOptionalParam(searchParams, 'sort', state.sortBy, 'all');
  setOptionalParam(searchParams, 'compare', state.comparisonIds.join(','));
  setOptionalParam(searchParams, 'view', state.view, 'catalog');

  return next;
};
