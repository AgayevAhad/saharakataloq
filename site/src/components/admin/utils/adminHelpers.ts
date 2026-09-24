import { Brand, CatalogCategory, Product } from '../../../types/product';

export const isProductModified = (current: Product, orig?: Product): boolean => {
  if (!orig) return true; // Newly created product
  if (current.title !== orig.title) return true;
  if (current.code !== orig.code) return true;
  if (current.price !== orig.price || current.oldPrice !== orig.oldPrice) return true;
  if (current.image !== orig.image) return true;
  if (current.imagePosition !== orig.imagePosition || current.imageFit !== orig.imageFit)
    return true;
  if (current.shortDesc !== orig.shortDesc) return true;
  if (current.status !== orig.status) return true;
  if (current.badgeText !== orig.badgeText) return true;
  if (current.isNew !== orig.isNew) return true;
  if (current.category !== orig.category || current.brandId !== orig.brandId) return true;
  if (JSON.stringify(current.media || []) !== JSON.stringify(orig.media || [])) return true;
  if (JSON.stringify(current.specs || []) !== JSON.stringify(orig.specs || [])) return true;
  if (JSON.stringify(current.highlights || []) !== JSON.stringify(orig.highlights || []))
    return true;
  return false;
};

export type CompletenessFilter = 'all' | 'missing-media' | 'missing-specs' | 'draft';

export const slugify = (text: string) =>
  text
    .toLocaleLowerCase('az')
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

export const getProductUniqueMediaUrls = (product: Product): string[] => {
  const urls: string[] = [];
  const seen = new Set<string>();

  if (product.image && typeof product.image === 'string' && product.image.trim()) {
    const clean = product.image.trim();
    seen.add(clean);
    urls.push(clean);
  }

  if (Array.isArray(product.gallery)) {
    product.gallery.forEach((url) => {
      if (url && typeof url === 'string') {
        const clean = url.trim();
        if (clean && !seen.has(clean)) {
          seen.add(clean);
          urls.push(clean);
        }
      }
    });
  }

  if (Array.isArray(product.media)) {
    product.media.forEach((item) => {
      if (item?.url && typeof item.url === 'string') {
        const clean = item.url.trim();
        if (clean && !seen.has(clean)) {
          seen.add(clean);
          urls.push(clean);
        }
      }
    });
  }

  return urls;
};

export const getProductUniqueMediaCount = (product: Product): number => {
  return getProductUniqueMediaUrls(product).length;
};

export const getProductVideoCount = (product: Product): number => {
  if (!Array.isArray(product.media)) return 0;
  return product.media.filter((item) => item?.type === 'video' && Boolean(item.url)).length;
};

export const getProductImageCount = (product: Product): number => {
  const total = getProductUniqueMediaCount(product);
  const videos = getProductVideoCount(product);
  return Math.max(0, total - videos);
};

export const emptyProduct = (brands: Brand[], categories: CatalogCategory[]): Product => ({
  id: newId('product'),
  code: '',
  title: '',
  brandId: brands[0]?.id || 'ardo',
  category: categories[0]?.id || 'hood',
  categoryName: categories[0]?.name || 'Aspiratorlar',
  image: '',
  gallery: [],
  highlights: [],
  specs: [],
  shortDesc: '',
  manufacturingCountry: '',
  price: undefined,
  oldPrice: undefined,
  currency: '₼',
  badgeText: '',
  badgeColor: 'red',
  stockStatus: 'in_stock',
  status: 'draft',
});

export const PRESET_COLORS = [
  { name: 'Sahara Qırmızı', color: '#dc2626' },
  { name: 'Kral Göyü', color: '#2563eb' },
  { name: 'Zümrüd Yaşılı', color: '#16a34a' },
  { name: 'Bənövşəyi', color: '#7c3aed' },
  { name: 'Kəhrəba Qızılı', color: '#d97706' },
  { name: 'Klassik Qara', color: '#0f172a' },
];
