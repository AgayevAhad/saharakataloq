// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { BrandShowcase, buildBrandBackdrops } from '../components/BrandShowcase';
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
  it('builds a slow rotating backdrop from each brand own published product images', () => {
    const rotatingProducts = ['ardo', 'artel', 'lotus'].flatMap((brandId) =>
      Array.from({ length: 4 }, (_, index) => ({
        ...mockProducts[0],
        id: `${brandId}-${index}`,
        brandId,
        image: `/media/products/${brandId}-${index}.jpg`,
        media: [
          {
            id: `${brandId}-media-${index}`,
            type: 'image' as const,
            url: `/media/products/${brandId}-media-${index}.jpg`,
          },
        ],
      }))
    );

    expect(buildBrandBackdrops('artel', rotatingProducts)).toHaveLength(4);
    expect(buildBrandBackdrops('artel', rotatingProducts)[0].src).toBe(
      '/media/products/artel-media-0.jpg'
    );

    const { container } = render(
      <BrandShowcase
        brands={DEFAULT_BRANDS}
        products={rotatingProducts}
        theme={lightTheme}
        onSelect={vi.fn()}
      />
    );

    const cards = container.querySelectorAll('.brand-showcase-card');
    expect(cards).toHaveLength(3);
    cards.forEach((card) => {
      const backdrops = card.querySelectorAll('.brand-card-backdrop-item');
      expect(backdrops).toHaveLength(4);
      expect((backdrops[0] as HTMLElement).style.animationDelay).toBe('0s');
      expect((backdrops[1] as HTMLElement).style.animationDelay).toBe('12s');
    });
    expect(container.textContent).not.toContain('Şəkil yoxdur');
  });

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

    // Click on the ARDO active brand card
    const ardoCard = screen.getByRole('button', { name: /ARDO məhsullarına bax/i });
    expect(ardoCard).toBeDefined();
    fireEvent.click(ardoCard);
    expect(onSelect).toHaveBeenCalledWith('ardo');

    // Artel card is in coming soon state with TEZLİKLƏ badge
    const artelCard = screen.getByLabelText(/ARTEL - Tezliklə/i);
    expect(artelCard).toBeDefined();
    fireEvent.click(artelCard);
    // Should not trigger navigation for coming soon brand
    expect(onSelect).not.toHaveBeenCalledWith('artel');
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

    const ardoCard = screen.getByRole('button', { name: /ARDO məhsullarına bax/i });
    fireEvent.keyDown(ardoCard, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('ardo');

    fireEvent.keyDown(ardoCard, { key: ' ' });
    expect(onSelect).toHaveBeenCalledWith('ardo');
  });
});
