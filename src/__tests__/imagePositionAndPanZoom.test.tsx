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
    expect(screen.getByText(/Dəqiq Şəkil Kəsmə & Çərçivələmə Studiyası/i)).toBeTruthy();
    expect(screen.getByText(/🪄 Ağ Sahələri Avtomatik Kəs/i)).toBeTruthy();
    expect(screen.getByText(/✂️ Sərbəst Kəsim/i)).toBeTruthy();
  });

  it('interactively applies aspect ratios and triggers crop save in ImageCropStudioModal', () => {
    const handleSaveCropped = vi.fn();
    render(
      <ImageCropStudioModal
        isOpen={true}
        imageUrl="/media/products/ardo-ar6120-white.jpg"
        initialObjectPosition="50% 50%"
        initialFitMode="contain"
        productTitle="ARDO Aspirator"
        theme={lightTheme}
        onClose={vi.fn()}
        onSavePosition={vi.fn()}
        onSaveCroppedImage={handleSaveCropped}
      />
    );

    // Click on 1:1 Aspect Ratio button
    const ratioBtn = screen.getByRole('button', { name: '1:1' });
    fireEvent.click(ratioBtn);

    // Click on Auto Trim button
    const autoTrimBtn = screen.getByRole('button', { name: /🪄 Ağ Sahələri Avtomatik Kəs/i });
    fireEvent.click(autoTrimBtn);

    expect(screen.getByText(/✂️ Kəsilmiş Şəkli Saxla & Məhsula Tətbiq Et/i)).toBeTruthy();
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

  it('supports touch swiping and arrow clicks to switch images on ProductCard', () => {
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

    // Initial image should be image 1
    const img = screen.getByAltText('Aspirator Ardo AR6120 White') as HTMLImageElement;
    expect(img.src).toContain('ardo-ar6120-white.jpg');

    // Click Next Arrow
    const nextBtn = screen.getByTitle('Növbəti şəkil');
    fireEvent.click(nextBtn);

    // Should switch to image 2
    expect(img.src).toContain('ardo-ar6120-white-2.jpg');

    // Click Prev Arrow
    const prevBtn = screen.getByTitle('Əvvəlki şəkil');
    fireEvent.click(prevBtn);

    // Should switch back to image 1
    expect(img.src).toContain('ardo-ar6120-white.jpg');

    // Test Touch Swipe Left on media box
    const mediaBox = img.parentElement as HTMLDivElement;
    const createTouch = (x: number, y: number) => ({
      clientX: x,
      clientY: y,
      pageX: x,
      pageY: y,
      screenX: x,
      screenY: y,
      target: mediaBox,
      identifier: 0,
      force: 1,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
    });

    const tStart = createTouch(200, 100);
    const tMove = createTouch(120, 100);

    fireEvent.touchStart(mediaBox, { touches: [tStart], targetTouches: [tStart], changedTouches: [tStart] });
    fireEvent.touchMove(mediaBox, { touches: [tMove], targetTouches: [tMove], changedTouches: [tMove] });
    fireEvent.touchEnd(mediaBox, { touches: [], targetTouches: [], changedTouches: [tMove] });

    expect(img.src).toContain('ardo-ar6120-white-2.jpg');
  });
});
