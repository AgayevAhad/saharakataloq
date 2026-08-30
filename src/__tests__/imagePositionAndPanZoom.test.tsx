// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { ProductEditor } from '../components/CatalogAdmin';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { ProductCard } from '../components/ProductCard';
import { ImageCropStudioModal } from '../components/ImageCropStudioModal';
import { lightTheme } from '../types/theme';
import { Product, Brand, CatalogCategory } from '../types/product';

afterEach(cleanup);

describe('Image Positioning (Focal Point / Alignment) & Pan-Zoom & Visual Crop Studio', () => {
  const mockProduct: Product = {
    id: 'prod-focal-1',
    code: 'AR 6120 WH',
    title: 'Aspirator Ardo AR6120 White',
    category: 'hood',
    categoryName: 'Aspiratorlar',
    shortDesc: 'ARDO aspirator modeli',
    brandId: 'ardo',
    image: '/media/products/ardo-ar6120-white.jpg',
    imagePosition: 'top',
    imageFit: 'contain',
    gallery: ['/media/products/ardo-ar6120-white.jpg', '/media/products/ardo-ar6120-white-2.jpg'],
    media: [
      {
        id: 'm1',
        type: 'image',
        url: '/media/products/ardo-ar6120-white.jpg',
        alt: 'Əsas görünüş',
        objectPosition: 'top',
        fitMode: 'contain',
      },
      {
        id: 'm2',
        type: 'image',
        url: '/media/products/ardo-ar6120-white-2.jpg',
        alt: 'Yan görünüş',
        objectPosition: 'bottom',
        fitMode: 'cover',
      },
    ],
    highlights: ['İtalyan Dizaynı'],
    specs: [],
    status: 'published',
  };

  const mockBrands: Brand[] = [
    { id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'İtaliya', manufacturingCountries: ['İtaliya'], logo: '', active: true },
  ];

  const mockCategories: CatalogCategory[] = [
    { id: 'hood', name: 'Aspiratorlar', slug: 'hood', icon: 'Wind', active: true },
  ];

  it('renders 9-dot focal picker and Crop Studio buttons in ProductEditor', () => {
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

    // Verify 9-dot pickers and position dropdowns are rendered
    const positionSelects = screen.getAllByTitle(/Duruş mövqeyini dəqiqləşdirin/i);
    expect(positionSelects.length).toBe(2);

    const fitSelects = screen.getAllByTitle(/Kəsim \/ sığışdırma rejimi/i);
    expect(fitSelects.length).toBe(2);

    // Verify Visual Crop Studio buttons exist
    const cropStudioBtns = screen.getAllByTitle(/Şəkli vizual kəsin, nisbətini seçin və fokusunu interaktiv studiyada tənzimləyin/i);
    expect(cropStudioBtns.length).toBe(2);
  });

  it('opens Visual Crop & Focal Studio modal from ProductEditor', () => {
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

    const cropStudioBtns = screen.getAllByTitle(/Şəkli vizual kəsin, nisbətini seçin və fokusunu interaktiv studiyada tənzimləyin/i);
    fireEvent.click(cropStudioBtns[0]);

    // Studio modal header should appear
    expect(screen.getByText(/Şəkil Kəsmə & Vizual Fokus Studiyası/i)).toBeTruthy();
    expect(screen.getByText(/✂️ Şəkli Kəs \(Crop\)/i)).toBeTruthy();
    expect(screen.getByText(/🎯 Fokus & Duruş \(Focal Pin\)/i)).toBeTruthy();
  });

  it('interactively switches to Focal Pin mode and applies custom position in ImageCropStudioModal', () => {
    const handleSavePosition = vi.fn();
    render(
      <ImageCropStudioModal
        isOpen={true}
        imageUrl="/media/products/ardo-ar6120-white.jpg"
        initialObjectPosition="50% 50%"
        initialFitMode="cover"
        productTitle="ARDO Aspirator"
        theme={lightTheme}
        onClose={vi.fn()}
        onSavePosition={handleSavePosition}
        onSaveCroppedImage={vi.fn()}
      />
    );

    // Switch to Focal Mode
    const focalTab = screen.getByRole('button', { name: /🎯 Fokus & Duruş/i });
    fireEvent.click(focalTab);

    // Click on Quick Focal preset (e.g. "⬆ Üst")
    const topPreset = screen.getByRole('button', { name: /⬆ Üst/i });
    fireEvent.click(topPreset);

    // Apply Position Only button
    const applyBtn = screen.getByRole('button', { name: /🎯 Mövqeni Tətbiq Et/i });
    fireEvent.click(applyBtn);

    expect(handleSavePosition).toHaveBeenCalledWith('50% 0%', 'cover');
  });

  it('renders ProductCard with custom objectPosition and fitMode styling', () => {
    render(
      <ProductCard
        product={mockProduct}
        theme={lightTheme}
        onSelect={vi.fn()}
        onShare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onCopyLink={vi.fn()}
      />
    );

    const img = screen.getByAltText('Aspirator Ardo AR6120 White') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.style.objectPosition).toBe('top');
    expect(img.style.objectFit).toBe('contain');
  });

  it('renders interactive zoom controls and supports pan & drag in ProductDetailModal', () => {
    render(
      <ProductDetailModal
        product={mockProduct}
        theme={lightTheme}
        visible={true}
        onClose={vi.fn()}
        onShare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onCopyLink={vi.fn()}
      />
    );

    // Click on preview image to open Fullscreen Zoom Lightbox
    const previewImgWrap = screen.getByTitle(/Tam ekranda böyütmək və sürüşdürmək üçün klikləyin/i);
    fireEvent.click(previewImgWrap);

    // Verify Zoom In and Zoom Out buttons exist
    const zoomInBtn = screen.getByTitle(/Böyüt \(\+\)/i);
    expect(zoomInBtn).toBeTruthy();

    // Click Zoom In
    fireEvent.click(zoomInBtn);

    // Scale percentage should update from 100% to 150%
    expect(screen.getByText('150%')).toBeTruthy();

    // Reset button should appear
    const resetBtn = screen.getByTitle(/1x Orijinal ölçüyə sıfırla/i);
    expect(resetBtn).toBeTruthy();

    // Test mouse drag pan calculation on viewport
    const container = document.querySelector('.zoom-pan-container') as HTMLDivElement;
    expect(container).toBeTruthy();

    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(container, { clientX: 150, clientY: 120 });
    fireEvent.mouseUp(container);

    // Reset zoom
    fireEvent.click(resetBtn);
    expect(screen.getByText('100%')).toBeTruthy();
  });
});
