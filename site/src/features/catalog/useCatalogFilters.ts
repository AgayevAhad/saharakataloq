import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Brand, CatalogCategory, Product } from '../../types/product';
import {
  type CatalogSortOption,
  filterCatalogPageProducts,
  sortCatalogPageProducts,
} from './catalogSelection';

interface CatalogFilterInputs {
  products: Product[];
  categories: CatalogCategory[];
  brands: Brand[];
  initialCategory?: string | null;
  initialBrand?: string | null;
  initialSearch?: string;
}

/** Owns catalog selection state; the page only coordinates its controls and layout. */
export function useCatalogFilters({
  products,
  categories,
  brands,
  initialCategory,
  initialBrand,
  initialSearch = '',
}: CatalogFilterInputs) {
  const activeProducts = useMemo(
    () => products.filter((product) => product.status !== 'draft'),
    [products]
  );
  const activeCategories = useMemo(
    () =>
      [...categories]
        .filter((category) => category.active)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories]
  );
  const activeBrands = useMemo(() => brands.filter((brand) => brand.active), [brands]);

  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    initialBrand && initialBrand !== 'all' ? [initialBrand] : []
  );
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [onlyWithVideo, setOnlyWithVideo] = useState(false);
  const [selectedEnergyClass, setSelectedEnergyClass] = useState('all');
  const [selectedMotorType, setSelectedMotorType] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [sortBy, setSortBy] = useState<CatalogSortOption>('recommended');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (initialBrand && initialBrand !== 'all') setSelectedBrands([initialBrand]);
  }, [initialBrand]);

  const { minAvailablePrice, maxAvailablePrice } = useMemo(() => {
    const prices = activeProducts
      .map((product) => product.price)
      .filter((price): price is number => typeof price === 'number' && price > 0);
    return {
      minAvailablePrice: prices.length ? Math.min(...prices) : 0,
      maxAvailablePrice: prices.length ? Math.max(...prices) : 5000,
    };
  }, [activeProducts]);

  // Unset bounds follow asynchronously arriving catalog data rather than
  // freezing the empty first render's 0–5000 range.
  const selectedMinPrice = minPrice ?? minAvailablePrice;
  const selectedMaxPrice = maxPrice ?? maxAvailablePrice;
  const priceFilterActive =
    selectedMinPrice > minAvailablePrice || selectedMaxPrice < maxAvailablePrice;

  const filteredProducts = useMemo(
    () =>
      filterCatalogPageProducts(activeProducts, {
        query: catalogSearchQuery,
        category: selectedCategory,
        brands: selectedBrands,
        minPrice: selectedMinPrice,
        maxPrice: selectedMaxPrice,
        priceActive: priceFilterActive,
        onlyDiscounted,
        onlyWithVideo,
        energyClass: selectedEnergyClass,
        motorType: selectedMotorType,
        color: selectedColor,
      }),
    [
      activeProducts,
      catalogSearchQuery,
      selectedCategory,
      selectedBrands,
      selectedMinPrice,
      selectedMaxPrice,
      priceFilterActive,
      onlyDiscounted,
      onlyWithVideo,
      selectedEnergyClass,
      selectedMotorType,
      selectedColor,
    ]
  );
  const sortedProducts = useMemo(
    () => sortCatalogPageProducts(filteredProducts, sortBy),
    [filteredProducts, sortBy]
  );

  const resetFilters = useCallback(() => {
    setSelectedCategory('all');
    setSelectedBrands([]);
    setMinPrice(null);
    setMaxPrice(null);
    setOnlyDiscounted(false);
    setOnlyWithVideo(false);
    setSelectedEnergyClass('all');
    setSelectedMotorType('all');
    setSelectedColor('all');
    setCatalogSearchQuery('');
  }, []);

  const toggleBrand = useCallback((brandId: string) => {
    setSelectedBrands((current) =>
      current.includes(brandId) ? current.filter((id) => id !== brandId) : [...current, brandId]
    );
  }, []);

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedBrands.length > 0 ||
    priceFilterActive ||
    onlyDiscounted ||
    onlyWithVideo ||
    selectedEnergyClass !== 'all' ||
    selectedMotorType !== 'all' ||
    selectedColor !== 'all' ||
    Boolean(catalogSearchQuery.trim());

  const activeFiltersCount =
    Number(selectedCategory !== 'all') +
    selectedBrands.length +
    Number(priceFilterActive) +
    Number(onlyDiscounted) +
    Number(onlyWithVideo) +
    Number(selectedEnergyClass !== 'all') +
    Number(selectedMotorType !== 'all') +
    Number(selectedColor !== 'all');

  return {
    activeProducts,
    activeCategories,
    activeBrands,
    selectedCategory,
    setSelectedCategory,
    selectedBrands,
    setSelectedBrands,
    onlyDiscounted,
    setOnlyDiscounted,
    onlyWithVideo,
    setOnlyWithVideo,
    selectedEnergyClass,
    setSelectedEnergyClass,
    selectedMotorType,
    setSelectedMotorType,
    selectedColor,
    setSelectedColor,
    sortBy,
    setSortBy,
    catalogSearchQuery,
    setCatalogSearchQuery,
    minAvailablePrice,
    maxAvailablePrice,
    selectedMinPrice,
    selectedMaxPrice,
    setMinPrice,
    setMaxPrice,
    sortedProducts,
    resetFilters,
    toggleBrand,
    hasActiveFilters,
    activeFiltersCount,
  };
}
