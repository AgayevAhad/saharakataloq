import { Brand, CatalogCategory, Product } from '../types/product';

const CORE_BRANDS = ['ardo', 'lotus', 'artel'];
const FOLLOWING_BRANDS = ['lg', 'bosch', 'samsung'];
export const FEATURED_ROWS_PER_PAGE = 8;
export const FEATURED_CARD_WIDTH = 339;
export const FEATURED_GRID_GAP = 16;

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

export const buildFeaturedTabs = (
  categories: CatalogCategory[],
  products: Product[],
  limit = 5
) => {
  const countByCategory = new Map<string, number>();
  products.forEach((product) => {
    countByCategory.set(product.category, (countByCategory.get(product.category) || 0) + 1);
  });

  return [
    { id: 'all', name: 'Hamısı' },
    ...categories
      .filter(
        (category) => category.active !== false && (countByCategory.get(category.id) || 0) > 0
      )
      .sort((a, b) => {
        const countDifference = (countByCategory.get(b.id) || 0) - (countByCategory.get(a.id) || 0);
        return countDifference || (a.sortOrder || 0) - (b.sortOrder || 0);
      })
      .slice(0, limit)
      .map((category) => ({ id: category.id, name: category.name })),
  ];
};
