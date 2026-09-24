// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { ProductEditor } from '../components/CatalogAdmin';
import { lightTheme } from '../types/theme';
import { Product, Brand, CatalogCategory } from '../types/product';

afterEach(cleanup);

describe('Admin Product Media Reordering & Thumbnail Layout', () => {
  const mockProduct: Product = {
    id: 'prod-test-1',
    code: 'AR 6120 BLACK',
    title: 'Aspirator Ardo AR6120 Black',
    category: 'hood',
    categoryName: 'Aspiratorlar',
    shortDesc: 'ARDO aspirator modeli',
    brandId: 'ardo',
    image: '/media/products/ardo-ar6120-black.jpg',
    gallery: [
      '/media/products/ardo-ar6120-black.jpg',
      '/media/products/ardo-ar6120-black-2.jpg',
      '/media/products/ardo-ar6120-black-3.jpg',
    ],
    media: [
      { id: 'm1', type: 'image', url: '/media/products/ardo-ar6120-black.jpg', alt: 'Əsas görünüş' },
      { id: 'm2', type: 'image', url: '/media/products/ardo-ar6120-black-2.jpg', alt: 'Yan görünüş' },
      { id: 'm3', type: 'image', url: '/media/products/ardo-ar6120-black-3.jpg', alt: 'Detallı görünüş' },
    ],
    highlights: [],
    specs: [],
    status: 'published',
  };

  const mockBrands: Brand[] = [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'İtaliya', manufacturingCountries: [], description: '', logo: '', active: true, comingSoon: false }];
  const mockCategories: CatalogCategory[] = [{ id: 'hood', name: 'Aspiratorlar', slug: 'hood', icon: 'Wind', active: true, sortOrder: 1 }];

  it('renders all media rows with sequence numbers and drag handles', () => {
    render(
      <ProductEditor
        product={mockProduct}
        brands={mockBrands}
        categories={mockCategories}
        availableCountries={['İtaliya', 'Türkiyə']}
        theme={lightTheme}
        onUpload={vi.fn()}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    // Should display sequence inputs for each photo
    const seqInputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    const mediaSeqInputs = seqInputs.filter((input) => input.classList.contains('media-seq-input'));
    expect(mediaSeqInputs.length).toBe(3);
    expect(mediaSeqInputs[0].value).toBe('1');
    expect(mediaSeqInputs[1].value).toBe('2');
    expect(mediaSeqInputs[2].value).toBe('3');

    // First image should have the primary badge
    expect(screen.getByText(/⭐ #1 Əsas/i)).toBeDefined();

    // Remaining images should have make-primary buttons
    const makePrimaryBtns = screen.getAllByTitle(/1-ci sıraya keçirərək Əsas Şəkil et/i);
    expect(makePrimaryBtns.length).toBe(2);
  });

  it('allows moving an image to position 1 via make-primary button', () => {
    const handleSave = vi.fn();
    render(
      <ProductEditor
        product={mockProduct}
        brands={mockBrands}
        categories={mockCategories}
        availableCountries={['İtaliya', 'Türkiyə']}
        theme={lightTheme}
        onUpload={vi.fn()}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    // Click "⭐ 1-ci et" on the 2nd photo
    const makePrimaryBtns = screen.getAllByTitle(/1-ci sıraya keçirərək Əsas Şəkil et/i);
    fireEvent.click(makePrimaryBtns[0]);

    // Save and verify product has the new primary image
    const saveBtns = screen.getAllByRole('button', { name: /Yadda saxla/i });
    fireEvent.click(saveBtns[saveBtns.length - 1]);

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        image: '/media/products/ardo-ar6120-black-2.jpg',
        gallery: [
          '/media/products/ardo-ar6120-black-2.jpg',
          '/media/products/ardo-ar6120-black.jpg',
          '/media/products/ardo-ar6120-black-3.jpg',
        ],
      })
    );
  });

  it('allows changing image position by entering sequence number directly', () => {
    const handleSave = vi.fn();
    render(
      <ProductEditor
        product={mockProduct}
        brands={mockBrands}
        categories={mockCategories}
        availableCountries={['İtaliya', 'Türkiyə']}
        theme={lightTheme}
        onUpload={vi.fn()}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    // Change sequence number of 3rd image to 1
    const seqInputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    const mediaSeqInputs = seqInputs.filter((input) => input.classList.contains('media-seq-input'));
    fireEvent.change(mediaSeqInputs[2], { target: { value: '1' } });

    // Save and verify
    const saveBtns = screen.getAllByRole('button', { name: /Yadda saxla/i });
    fireEvent.click(saveBtns[saveBtns.length - 1]);

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        image: '/media/products/ardo-ar6120-black-3.jpg',
      })
    );
  });
});
