import { Product } from '../types/product';

export function filterCatalogProducts(
  products: Product[],
  selectedCategory: string,
  selectedBrand: string,
  searchQuery: string,
): Product[] {
  const needle = searchQuery.trim().toLocaleLowerCase('az');
  return products.filter((product) => {
    if (product.status === 'draft') return false;
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesBrand = selectedBrand === 'all' || product.brandId === selectedBrand;
    
    if (!matchesCategory || !matchesBrand) return false;
    if (!needle) return true;

    const highlightsStr = Array.isArray(product.highlights) ? product.highlights.join(' ') : '';
    const specsStr = Array.isArray(product.specs)
      ? product.specs.map((s) => `${s?.name || ''} ${s?.value || ''}`).join(' ')
      : '';

    const textBlock = [
      product.code || '',
      product.title || '',
      product.shortDesc || '',
      product.badgeText || '',
      product.manufacturingCountry || '',
      product.categoryName || '',
      highlightsStr,
      specsStr,
    ]
      .join(' ')
      .toLocaleLowerCase('az');

    return textBlock.includes(needle);
  });
}
