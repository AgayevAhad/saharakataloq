import { Product } from '../../types/product';

export type CatalogSortOption = 'recommended' | 'price-asc' | 'price-desc' | 'newest';

export interface CatalogSelection {
  query: string;
  category: string;
  brands: string[];
  minPrice: number;
  maxPrice: number;
  priceActive: boolean;
  onlyDiscounted: boolean;
  onlyWithVideo: boolean;
  energyClass: string;
  motorType: string;
  color: string;
}

const normalize = (value: string | undefined) =>
  String(value || '')
    .trim()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .toLowerCase();

const specValues = (product: Product, names: string[]) => {
  const accepted = new Set(names.map(normalize));
  const explicit = (product.specs || [])
    .filter((spec) => accepted.has(normalize(spec.name).replace(/:$/, '')))
    .map((spec) => normalize(spec.value))
    .filter(Boolean);
  const legacy = Object.entries(product.specifications || {})
    .filter(([name]) => accepted.has(normalize(name).replace(/:$/, '')))
    .map(([, value]) => normalize(value))
    .filter(Boolean);
  return [...explicit, ...legacy];
};

export function filterCatalogPageProducts(
  products: Product[],
  selection: CatalogSelection
): Product[] {
  const query = normalize(selection.query);
  return products.filter((product) => {
    if (product.status === 'draft') return false;
    if (selection.category !== 'all' && product.category !== selection.category) return false;
    if (selection.brands.length && !selection.brands.includes(product.brandId || '')) return false;
    if (
      query &&
      ![
        product.title,
        product.code,
        product.modelCode,
        product.categoryName,
        product.category,
        product.brandName,
        product.brandId,
      ].some((value) => normalize(value).includes(query))
    )
      return false;

    if (
      selection.priceActive &&
      (typeof product.price !== 'number' ||
        product.price < selection.minPrice ||
        product.price > selection.maxPrice)
    )
      return false;
    if (
      selection.onlyDiscounted &&
      !(
        typeof product.oldPrice === 'number' &&
        typeof product.price === 'number' &&
        product.oldPrice > product.price
      )
    )
      return false;
    if (
      selection.onlyWithVideo &&
      !(product.media || []).some((item) => item.type === 'video') &&
      !product.videoUrl &&
      !(product.images || []).some((url) => /\.(mp4|webm)(\?|$)/i.test(url))
    )
      return false;

    if (
      selection.energyClass !== 'all' &&
      !specValues(product, ['Enerji sinfi', 'Enerji sərfiyyatı sinfi']).some(
        (value) =>
          value === normalize(selection.energyClass) ||
          value.startsWith(`${normalize(selection.energyClass)} `)
      )
    )
      return false;
    if (
      selection.motorType !== 'all' &&
      !specValues(product, ['Mühərrik', 'Mühərrik növü', 'Kompressor', 'Kompressor növü']).some(
        (value) => value.includes(normalize(selection.motorType))
      )
    )
      return false;
    if (
      selection.color !== 'all' &&
      !specValues(product, ['Rəng', 'Material']).some((value) =>
        value.includes(normalize(selection.color))
      )
    )
      return false;
    return true;
  });
}

export function sortCatalogPageProducts(products: Product[], sortBy: CatalogSortOption): Product[] {
  const list = [...products];
  const price = (product: Product) =>
    typeof product.price === 'number' && product.price > 0
      ? product.price
      : Number.POSITIVE_INFINITY;
  switch (sortBy) {
    case 'price-asc':
      return list.sort((a, b) => price(a) - price(b));
    case 'price-desc':
      return list.sort((a, b) => {
        if (!Number.isFinite(price(a))) return 1;
        if (!Number.isFinite(price(b))) return -1;
        return price(b) - price(a);
      });
    case 'newest':
      return list.sort(
        (a, b) =>
          (Date.parse(b.createdAt || b.updatedAt || '') || 0) -
          (Date.parse(a.createdAt || a.updatedAt || '') || 0)
      );
    default:
      return list;
  }
}
