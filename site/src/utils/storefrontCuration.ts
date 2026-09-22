import { Brand, CatalogCategory, Product } from '../types/product';

const CORE_BRANDS = ['ardo', 'lotus', 'artel'];
const FOLLOWING_BRANDS = ['lg', 'bosch', 'samsung'];
export const FEATURED_ROWS_PER_PAGE = 4;
export const FEATURED_CARD_WIDTH = 339;
export const FEATURED_GRID_GAP = 16;

export interface CuratedTab {
  id: 'featured' | 'bestsellers' | 'for_you' | 'super_deals';
  name: string;
}

export const CURATED_FEATURED_TABS: CuratedTab[] = [
  { id: 'featured', name: 'Önə çıxan məhsullar' },
  { id: 'bestsellers', name: 'Çox satılan məhsullar' },
  { id: 'for_you', name: 'Sənin üçün seçdiklərimiz' },
  { id: 'super_deals', name: 'Super təkliflər' },
];

export const getFeaturedGridColumns = (width: number): number =>
  Math.max(
    1,
    Math.floor((Math.max(0, width) + FEATURED_GRID_GAP) / (FEATURED_CARD_WIDTH + FEATURED_GRID_GAP))
  );

export const sortFeaturedProducts = (products: Product[], brands: Brand[] = []): Product[] => {
  const brandSlugs = new Map(brands.map((brand) => [brand.id, brand.slug.toLowerCase()]));
  const buckets = new Map<string, Product[]>();

  for (const product of products) {
    const key = brandSlugs.get(product.brandId || '') || (product.brandId || '').toLowerCase();
    const bucket = buckets.get(key) || [];
    bucket.push(product);
    buckets.set(key, bucket);
  }

  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => {
      if (Boolean(a.isFeatured) !== Boolean(b.isFeatured)) return a.isFeatured ? -1 : 1;
      return (a.title || '').localeCompare(b.title || '', 'az');
    });
  }

  // Alternate brands inside each tier so the first rows represent the full
  // requested group. A brand with no published products simply contributes none.
  const takeTier = (keys: string[]): Product[] => {
    const result: Product[] = [];
    const lists = keys.map((key) => buckets.get(key) || []);
    const maxLength = Math.max(0, ...lists.map((list) => list.length));
    for (let index = 0; index < maxLength; index += 1) {
      for (const list of lists) {
        if (list[index]) result.push(list[index]);
      }
    }
    keys.forEach((key) => buckets.delete(key));
    return result;
  };

  const core = takeTier(CORE_BRANDS);
  const following = takeTier(FOLLOWING_BRANDS);
  const otherBrands = [...buckets.keys()].sort((a, b) => a.localeCompare(b, 'az'));
  return [...core, ...following, ...takeTier(otherBrands)];
};

export const getCuratedTabProducts = (
  tabId: string,
  products: Product[],
  brands: Brand[] = []
): Product[] => {
  const published = products.filter((p) => p.status === 'published');
  if (published.length === 0) return [];

  switch (tabId) {
    case 'bestsellers': {
      const bestsellers = published.filter(
        (p) =>
          p.isBestSeller ||
          (p.badgeText && /çox satılan|bestseller|populyar|hit/i.test(p.badgeText)) ||
          (p as any).isPopular
      );
      const others = published.filter((p) => !bestsellers.includes(p));
      return sortFeaturedProducts([...bestsellers, ...others], brands);
    }
    case 'super_deals': {
      const deals = published.filter(
        (p) =>
          (p.oldPrice && p.price && p.oldPrice > p.price) ||
          (p.badgeText && /endirim|super|kampaniya|təklif|fırsat/i.test(p.badgeText)) ||
          p.badgeColor === 'red' ||
          p.badgeColor === 'amber'
      );
      const others = published.filter((p) => !deals.includes(p));
      return sortFeaturedProducts([...deals, ...others], brands);
    }
    case 'for_you': {
      const sorted = sortFeaturedProducts(published, brands);
      const categoriesSeen = new Set<string>();
      const picked: Product[] = [];
      const rest: Product[] = [];

      for (const p of sorted) {
        if (!categoriesSeen.has(p.category)) {
          categoriesSeen.add(p.category);
          picked.push(p);
        } else {
          rest.push(p);
        }
      }
      return [...picked, ...rest];
    }
    case 'featured':
    default:
      return sortFeaturedProducts(published, brands);
  }
};

export const buildFeaturedTabs = (
  _categories: CatalogCategory[] = [],
  _products: Product[] = [],
  _limit = 5
) => {
  return CURATED_FEATURED_TABS;
};
