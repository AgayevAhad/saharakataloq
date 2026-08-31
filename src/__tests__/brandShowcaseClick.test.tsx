// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { BrandShowcase } from '../components/BrandShowcase';
import { lightTheme } from '../types/theme';
import { DEFAULT_BRANDS } from '../data/catalog';
import { Product } from '../types/product';

afterEach(() => {
  cleanup();
});

const mockProducts: Product[] = [
  {
    id: 'p-ardo-1',
    brandId: 'ardo',
    code: '604B',
    title: 'Aspirator Ardo 604B',
    category: 'hood',
    categoryName: 'Aspiratorlar',
    shortDesc: 'Aspirator Ardo',
    image: '/media/products/ardo-604b.jpg',
    gallery: [],
    media: [],
    highlights: [],
    specs: [],
    status: 'published',
  },
  {
    id: 'p-lotus-1',
    brandId: 'lotus',
    code: '5.5 Black',
    title: 'Airfryer Lotus 5.5 Black',
    category: 'airfryer',
    categoryName: 'Fritözlər & Airfryer',
    shortDesc: 'Airfryer Lotus',
    image: '/media/products/lotus-5-5.jpg',
    gallery: [],
    media: [],
    highlights: [],
    specs: [],
    status: 'published',
  },
];

describe('BrandShowcase Card Full-Surface Click Interaction Suite', () => {
  it('triggers onSelect when clicking anywhere on an active brand card surface', () => {
    const onSelect = vi.fn();

    render(
      <BrandShowcase
        brands={DEFAULT_BRANDS}
        products={mockProducts}
        theme={lightTheme}
        onSelect={onSelect}
      />
    );

    // Get the Lotus brand card article
    const lotusCard = screen.getByRole('button', { name: /LOTUS məhsullarına bax/i });
    expect(lotusCard).toBeDefined();

    // Click on the card itself
    fireEvent.click(lotusCard);
    expect(onSelect).toHaveBeenCalledWith('lotus');

    // Click on the ARDO brand card
    const ardoCard = screen.getByRole('button', { name: /ARDO məhsullarına bax/i });
    fireEvent.click(ardoCard);
    expect(onSelect).toHaveBeenCalledWith('ardo');
  });

  it('triggers onSelect when pressing Enter or Space key on an active brand card', () => {
    const onSelect = vi.fn();

    render(
      <BrandShowcase
        brands={DEFAULT_BRANDS}
        products={mockProducts}
        theme={lightTheme}
        onSelect={onSelect}
      />
    );

    const lotusCard = screen.getByRole('button', { name: /LOTUS məhsullarına bax/i });
    fireEvent.keyDown(lotusCard, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('lotus');

    fireEvent.keyDown(lotusCard, { key: ' ' });
    expect(onSelect).toHaveBeenCalledWith('lotus');
  });
});
