import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { AnimatedBrandRail } from '../components/AnimatedBrandRail';
import { ProductBrandBadge } from '../components/ProductBrandBadge';
import { VisualCategoryCards } from '../components/VisualCategoryCards';
import { SCROLL_REVEAL_OBSERVER_OPTIONS } from '../hooks/useScrollReveal';
import { lightTheme } from '../types/theme';
import {
  buildFeaturedTabs,
  FEATURED_ROWS_PER_PAGE,
  getFeaturedGridColumns,
  sortFeaturedProducts,
} from '../utils/storefrontCuration';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const makeProduct = (id: string, brandId: string, category = 'washer') =>
  ({
    id,
    brandId,
    code: id,
    title: id,
    category,
    categoryName: category,
    image: `/media/${id}.png`,
    shortDesc: id,
    specs: [],
    highlights: [],
    status: 'published',
  }) as any;

describe('storefront curation', () => {
  it('prioritizes ARDO, LOTUS, ARTEL, LG, BOSCH and SAMSUNG in that order', () => {
    const products = [
      makeProduct('other', 'other'),
      makeProduct('samsung', 'samsung'),
      makeProduct('artel', 'artel'),
      makeProduct('ardo', 'ardo'),
      makeProduct('bosch', 'bosch'),
      makeProduct('lotus', 'lotus'),
      makeProduct('lg', 'lg'),
    ];
    expect(sortFeaturedProducts(products).map((product) => product.brandId)).toEqual([
      'ardo',
      'lotus',
      'artel',
      'lg',
      'bosch',
      'samsung',
      'other',
    ]);
  });

  it('alternates available brands inside each tier without inventing unpublished brands', () => {
    const products = [
      makeProduct('ardo-1', 'ardo'),
      makeProduct('ardo-2', 'ardo'),
      makeProduct('artel-1', 'artel'),
      makeProduct('artel-2', 'artel'),
      makeProduct('lg-1', 'lg'),
      makeProduct('bosch-1', 'bosch'),
      makeProduct('other-1', 'beko'),
    ];
    expect(sortFeaturedProducts(products).map((product) => product.id)).toEqual([
      'ardo-1',
      'artel-1',
      'ardo-2',
      'artel-2',
      'lg-1',
      'bosch-1',
      'other-1',
    ]);
  });

  it('derives four actual grid rows from the available width', () => {
    expect(getFeaturedGridColumns(390)).toBe(1);
    expect(getFeaturedGridColumns(768)).toBe(2);
    expect(getFeaturedGridColumns(1334)).toBe(3);
    expect(getFeaturedGridColumns(1410)).toBe(4);
    expect(FEATURED_ROWS_PER_PAGE * getFeaturedGridColumns(1334)).toBe(12);
  });

  it('builds the four official curated storefront tabs', () => {
    const tabs = buildFeaturedTabs();
    expect(tabs.map((t) => t.id)).toEqual(['featured', 'bestsellers', 'for_you', 'super_deals']);
  });
});

describe('storefront identity and category density', () => {
  it('renders the official brand logo inside a product badge', () => {
    const { getByAltText } = render(
      <ProductBrandBadge
        brand={{
          id: 'ardo',
          slug: 'ardo',
          name: 'ARDO',
          logo: '/media/brands/ardo-logo.png',
          originCountry: 'İtaliya',
          manufacturingCountries: [],
          active: true,
        }}
      />
    );
    expect(getByAltText('ARDO loqosu').getAttribute('src')).toBe('/media/brands/ardo-logo.png');
  });

  it('renders all populated real categories into the infinite marquee carousel', () => {
    const categories = Array.from({ length: 7 }, (_, index) => ({
      id: `cat-${index}`,
      slug: `cat-${index}`,
      name: `Kateqoriya ${index}`,
      active: true,
    }));
    const products = categories.map((category, index) =>
      makeProduct(`p-${index}`, 'ardo', category.id)
    );
    const { container } = render(
      <VisualCategoryCards
        categories={categories}
        products={products}
        theme={lightTheme}
        onSelectCategory={vi.fn()}
      />
    );
    expect(container.querySelectorAll('.category-unit-box').length).toBeGreaterThanOrEqual(7);
  });
});

describe('fluid reveal and brand rail interaction', () => {
  it('observes content before it reaches the viewport with a minimal threshold', () => {
    expect(SCROLL_REVEAL_OBSERVER_OPTIONS.rootMargin).toBe('120px 0px 180px 0px');
    expect(SCROLL_REVEAL_OBSERVER_OPTIONS.threshold).toBe(0.01);
  });

  it('moves the brand rail when grabbed with a desktop pointer', () => {
    const item = {
      id: 'ardo',
      brandId: 'ardo',
      brandSlug: 'ardo',
      brandName: 'ARDO',
      brandLogo: '/media/brands/ardo-logo.png',
      enabled: true,
      sortOrder: 1,
      linkEnabled: true,
      publishedProductCount: 1,
      hasPublishedProducts: true,
    };
    const { getByTestId } = render(
      <AnimatedBrandRail
        data={{ enabled: true, settings: null, items: [item] }}
        theme={lightTheme}
      />
    );
    const viewport = getByTestId('brand-rail-viewport');
    fireEvent.pointerDown(viewport, {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      clientX: 100,
    });
    fireEvent.pointerMove(viewport, { pointerId: 1, pointerType: 'mouse', clientX: 180 });
    expect(getByTestId('brand-rail-drag-layer').getAttribute('style')).toContain('80px');
    expect(viewport.className).toContain('is-dragging');
    fireEvent.pointerUp(viewport, { pointerId: 1, pointerType: 'mouse', clientX: 180 });
    expect(getByTestId('brand-rail-drag-layer').getAttribute('style')).toContain('0px');
  });
});
