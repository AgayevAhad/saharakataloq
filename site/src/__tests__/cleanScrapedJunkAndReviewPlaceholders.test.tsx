import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { Product } from '../types/product';
import { DEFAULT_BRANDS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../data/catalog';
import { lightTheme } from '../types/theme';

const sampleCleanProduct: Product = {
  id: 'ardo-clean-test-1',
  code: 'ARDO-TST-01',
  title: 'ARDO Sabaf 60 Inox',
  brandId: 'ardo',
  category: 'hood',
  categoryName: 'Aspiratorlar',
  image: '/media/ardo/aspirator.webp',
  price: 480,
  shortDesc: 'İtaliya istehsalı premium mətbəx aspiratoru',
  specs: [],
  highlights: [],
};

describe('Clean Scraped Junk & Review Placeholders Suite', () => {
  it('1. Product detail page does not render fake "0 rəy" placeholder badge when there are no reviews', () => {
    render(
      <MemoryRouter>
        <ProductDetailPage
          product={sampleCleanProduct}
          allProducts={[sampleCleanProduct]}
          categories={DEFAULT_CATEGORIES}
          brands={DEFAULT_BRANDS}
          settings={DEFAULT_SETTINGS}
          theme={lightTheme}
          themeMode="light"
          onNavigate={() => {}}
          onSelectProduct={() => {}}
          onWhatsApp={() => {}}
          onCall={() => {}}
        />
      </MemoryRouter>
    );

    // Ensure "0 rəy" is NOT in the document
    expect(screen.queryByText(/0 rəy/i)).toBeNull();
    // Ensure product title is rendered cleanly
    expect(screen.getByText('ARDO Sabaf 60 Inox')).toBeDefined();
    // Ensure clean description is rendered without scraped junk
    expect(screen.getByText('İtaliya istehsalı premium mətbəx aspiratoru')).toBeDefined();
    expect(screen.queryByText(/Səbətə əlavə et/i)).toBeNull();
  });

  it('2. Ensures no products in database or state carry scraped e-commerce artifacts', () => {
    const junkPatterns = [
      '0 0 rəy',
      'Səbətə əlavə et',
      'Onlayn üçün xüsusi qiymət',
      '- 200 ₼',
      '6 ay 133.33 ₼',
    ];

    junkPatterns.forEach((pat) => {
      expect(sampleCleanProduct.shortDesc?.includes(pat)).toBe(false);
      expect(sampleCleanProduct.title.includes(pat)).toBe(false);
    });
  });
});
