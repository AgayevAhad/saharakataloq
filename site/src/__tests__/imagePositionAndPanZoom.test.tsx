// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductEditor } from '../components/CatalogAdmin';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { ProductCard } from '../components/ProductCard';
import { ImageCropStudioModal } from '../components/ImageCropStudioModal';
import { calculateCropFrameTransform, ShimmerImage } from '../components/ShimmerImage';
import { lightTheme } from '../types/theme';
import { Product, Brand, CatalogCategory } from '../types/product';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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
    {
      id: 'ardo',
      name: 'ARDO',
      slug: 'ardo',
      originCountry: 'İtaliya',
      manufacturingCountries: ['İtaliya'],
      logo: '',
      active: true,
    },
  ];

  const mockCategories: CatalogCategory[] = [
    { id: 'hood', name: 'Aspiratorlar', slug: 'hood', icon: 'Wind', active: true },
  ];

  it('renders Visual Crop button in ProductEditor without positioning & fit selects', () => {
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

    // Verify position dropdowns and fit mode selects are completely removed
    const positionSelects = screen.queryAllByTitle(/Duruş mövqeyini dəqiqləşdirin/i);
    expect(positionSelects.length).toBe(0);

    const fitSelects = screen.queryAllByTitle(/Kəsim \/ sığışdırma rejimi/i);
    expect(fitSelects.length).toBe(0);

    // Verify Visual Crop/Framing button exists on images
    const cropStudioBtns = screen.getAllByTitle(
      /Şəkildə görünəcək hissəni və fokus sahəsini interaktiv studiyada düzənləyin/i
    );
    expect(cropStudioBtns.length).toBeGreaterThan(0);

    // Clicking Visual Framing opens ImageCropStudioModal
    fireEvent.click(cropStudioBtns[0]);
    expect(
      screen.getByRole('heading', { level: 3, name: /Aspirator Ardo AR6120 White/i })
    ).toBeTruthy();
  });

  it('synchronizes top-level image fields when the cropped primary media is removed', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    render(
      <ProductEditor
        product={{
          ...mockProduct,
          originalImage: mockProduct.media![0].url,
          cropRect: { x: 0.1, y: 0.1, w: 0.7, h: 0.7 },
          media: [
            {
              ...mockProduct.media![0],
              originalUrl: mockProduct.media![0].url,
              cropRect: { x: 0.1, y: 0.1, w: 0.7, h: 0.7 },
            },
            {
              ...mockProduct.media![1],
              originalUrl: mockProduct.media![1].url,
              cropRect: undefined,
            },
          ],
        }}
        brands={mockBrands}
        categories={mockCategories}
        availableCountries={['İtaliya']}
        theme={lightTheme}
        onUpload={vi.fn()}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    fireEvent.click(screen.getAllByTitle('Bu media faylını sil')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Yadda saxla' }));

    await waitFor(() => expect(handleSave).toHaveBeenCalledTimes(1));
    expect(handleSave.mock.calls[0][0]).toMatchObject({
      image: '/media/products/ardo-ar6120-white-2.jpg',
      originalImage: '/media/products/ardo-ar6120-white-2.jpg',
      imagePosition: 'bottom',
      imageFit: 'cover',
      gallery: ['/media/products/ardo-ar6120-white-2.jpg'],
    });
    expect(handleSave.mock.calls[0][0].cropRect).toBeUndefined();
  });

  it('deletes a newly uploaded file that is removed before the product is saved', async () => {
    const uploadedUrl = '/uploads/mnew1234-0123456789abcdef.jpg';
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleDiscardUpload = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <ProductEditor
        product={mockProduct}
        brands={mockBrands}
        categories={mockCategories}
        availableCountries={['İtaliya']}
        theme={lightTheme}
        onUpload={vi.fn().mockResolvedValue({
          id: 'uploaded-media',
          type: 'image',
          url: uploadedUrl,
          originalName: 'new-photo.jpg',
        })}
        onDiscardUpload={handleDiscardUpload}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(['image'], 'new-photo.jpg', { type: 'image/jpeg' })] },
    });
    await waitFor(() => expect(screen.getAllByTitle('Bu media faylını sil')).toHaveLength(3));
    fireEvent.click(screen.getAllByTitle('Bu media faylını sil')[2]);
    fireEvent.click(screen.getByRole('button', { name: 'Yadda saxla' }));

    await waitFor(() => expect(handleSave).toHaveBeenCalledTimes(1));
    expect(handleDiscardUpload).toHaveBeenCalledWith(uploadedUrl);
  });

  it('interactively applies aspect ratios and triggers non-destructive framing save in ImageCropStudioModal', () => {
    const handleSaveCropped = vi.fn();
    render(
      <ImageCropStudioModal
        isOpen={true}
        imageUrl="/media/products/ardo-ar6120-white.jpg"
        initialObjectPosition="50% 50%"
        productTitle="ARDO Aspirator"
        theme={lightTheme}
        onClose={vi.fn()}
        onSaveCroppedImage={handleSaveCropped}
      />
    );

    // Click on 1:1 Aspect Ratio button
    const ratioBtn = screen.getByRole('button', { name: /1:1/i });
    fireEvent.click(ratioBtn);

    // Click on Auto Trim / Focus button
    const autoTrimBtn = screen.getByRole('button', { name: /🪄 Avtomatik Fokusla/i });
    fireEvent.click(autoTrimBtn);

    expect(screen.getByText(/✓ Düzənləməni Saxla & Məhsula Tətbiq Et/i)).toBeTruthy();
  });

  it('atomically saves framing to the selected media id without changing the original file', async () => {
    class AutoLoadingImage {
      naturalWidth = 1000;
      naturalHeight = 800;
      onload: null | (() => void) = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', AutoLoadingImage);

    const handleSave = vi.fn().mockResolvedValue(undefined);
    render(
      <ProductEditor
        product={mockProduct}
        brands={mockBrands}
        categories={mockCategories}
        availableCountries={['İtaliya']}
        theme={lightTheme}
        onUpload={vi.fn()}
        onClose={vi.fn()}
        onSave={handleSave}
      />
    );

    const cropButtons = screen.getAllByTitle(
      /Şəkildə görünəcək hissəni və fokus sahəsini interaktiv studiyada düzənləyin/i
    );
    fireEvent.click(cropButtons[1]);
    await waitFor(() => expect(screen.getByRole('button', { name: '1:1' })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: '1:1' }));
    fireEvent.click(screen.getByRole('button', { name: /Düzənləməni Saxla/i }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Düzənləməni Saxla/i })).toBeNull()
    );

    fireEvent.click(screen.getByRole('button', { name: 'Yadda saxla' }));
    await waitFor(() => expect(handleSave).toHaveBeenCalledTimes(1));

    const savedProduct = handleSave.mock.calls[0][0] as Product;
    expect(savedProduct.media?.[0].cropRect).toBeUndefined();
    expect(savedProduct.media?.[1]).toMatchObject({
      id: 'm2',
      url: '/media/products/ardo-ar6120-white-2.jpg',
      originalUrl: '/media/products/ardo-ar6120-white-2.jpg',
      cropRect: { x: 0, y: 0, w: 0.8, h: 1 },
    });
    expect(savedProduct.cropRect).toBeUndefined();
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

    fireEvent.touchStart(mediaBox, {
      touches: [tStart],
      targetTouches: [tStart],
      changedTouches: [tStart],
    });
    fireEvent.touchMove(mediaBox, {
      touches: [tMove],
      targetTouches: [tMove],
      changedTouches: [tMove],
    });
    fireEvent.touchEnd(mediaBox, { touches: [], targetTouches: [], changedTouches: [tMove] });

    expect(img.src).toContain('ardo-ar6120-white-2.jpg');
  });

  it('supports touch swiping and arrow navigation inside ProductDetailModal stage and Fullscreen Lightbox', () => {
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

    // Initial image in detail stage
    const stage = document.querySelector('.product-detail-image-stage') as HTMLDivElement;
    expect(stage).toBeTruthy();
    const stageImg = stage.querySelector('img') as HTMLImageElement;
    expect(stageImg.src).toContain('ardo-ar6120-white.jpg');

    // Test Arrow button in stage
    const nextArrow = stage.querySelector('.modal-stage-nav-btn.next') as HTMLButtonElement;
    expect(nextArrow).toBeTruthy();
    fireEvent.click(nextArrow);

    // Image in stage updates
    expect(stageImg.src).toContain('ardo-ar6120-white-2.jpg');

    // Test Touch Swipe Right to go back
    const createTouch = (x: number, y: number) => ({
      clientX: x,
      clientY: y,
      pageX: x,
      pageY: y,
      screenX: x,
      screenY: y,
      target: stage,
      identifier: 0,
    });

    const tStart = createTouch(100, 100);
    const tMove = createTouch(200, 100);

    fireEvent.touchStart(stage, {
      touches: [tStart],
      targetTouches: [tStart],
      changedTouches: [tStart],
    });
    fireEvent.touchMove(stage, {
      touches: [tMove],
      targetTouches: [tMove],
      changedTouches: [tMove],
    });
    fireEvent.touchEnd(stage, { touches: [], targetTouches: [], changedTouches: [tMove] });

    expect(stageImg.src).toContain('ardo-ar6120-white.jpg');

    // Open Fullscreen Lightbox
    fireEvent.click(stage);
    const fsContainer = document.querySelector('.zoom-pan-container') as HTMLDivElement;
    expect(fsContainer).toBeTruthy();
    const fsImg = fsContainer.querySelector('img') as HTMLImageElement;
    expect(fsImg.src).toContain('ardo-ar6120-white.jpg');

    // Test Touch Swipe Left in Fullscreen Lightbox
    const fsStart = createTouch(250, 150);
    const fsMove = createTouch(150, 150);

    fireEvent.touchStart(fsContainer, {
      touches: [fsStart],
      targetTouches: [fsStart],
      changedTouches: [fsStart],
    });
    fireEvent.touchMove(fsContainer, {
      touches: [fsMove],
      targetTouches: [fsMove],
      changedTouches: [fsMove],
    });
    fireEvent.touchEnd(fsContainer, { touches: [], targetTouches: [], changedTouches: [fsMove] });

    // Should switch to next image in lightbox
    expect(fsImg.src).toContain('ardo-ar6120-white-2.jpg');

    // Test Fullscreen Next button (wraps back to index 0)
    const fsNextBtn = document.querySelector('.fs-lightbox-nav-btn.next') as HTMLButtonElement;
    expect(fsNextBtn).toBeTruthy();
    fireEvent.click(fsNextBtn);
    expect(fsImg.src).toContain('ardo-ar6120-white.jpg');

    // Test Fullscreen Dot click to select index 1
    const fsDots = document.querySelectorAll('.fs-lightbox-dot');
    expect(fsDots.length).toBe(2);
    fireEvent.click(fsDots[1]);
    expect(fsImg.src).toContain('ardo-ar6120-white-2.jpg');
  });

  it('calculates a fixed-frame crop transform without stretching the source image', () => {
    const customCrop = { x: 0.2, y: 0.1, w: 0.5, h: 0.4 };
    const transform = calculateCropFrameTransform(customCrop, 1000, 800, 300, 200);

    expect(transform?.left).toBeCloseTo(-131.25);
    expect(transform?.top).toBeCloseTo(-50);
    expect(transform?.width).toBeCloseTo(625);
    expect(transform?.height).toBeCloseTo(500);
    expect(transform!.width / transform!.height).toBe(1000 / 800);
  });

  it('keeps the card frame fixed and marks ShimmerImage as source-framed', () => {
    const customCrop = { x: 0.2, y: 0.1, w: 0.5, h: 0.4 };
    const { container } = render(
      <ProductCard
        product={{
          ...mockProduct,
          cropRect: customCrop,
          media: [
            {
              ...mockProduct.media![0],
              cropRect: customCrop,
            },
          ],
        }}
        theme={lightTheme}
        onSelect={vi.fn()}
        onShare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onCopyLink={vi.fn()}
      />
    );

    const img = container.querySelector('.shimmer-img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.classList.contains('crop-framed-img')).toBe(true);
    expect(img.dataset.cropRect).toBe(JSON.stringify(customCrop));
    expect(img.style.position).toBe('absolute');
    expect(img.style.padding).toBe('0px');
    expect(container.querySelector('.crop-inner-viewport')).toBeNull();
  });

  it('preserves initial cropRect when re-opening ImageCropStudioModal', () => {
    const savedCrop = { x: 0.15, y: 0.25, w: 0.6, h: 0.5 };
    const { container } = render(
      <ImageCropStudioModal
        isOpen={true}
        imageUrl="/media/products/ardo-ar6120-white.jpg"
        initialCropRect={savedCrop}
        initialObjectPosition="45% 50%"
        productTitle="ARDO Aspirator"
        theme={lightTheme}
        onClose={vi.fn()}
        onSaveCroppedImage={vi.fn()}
      />
    );

    const studioModal = container.querySelector('.crop-studio-modal') as HTMLElement;
    expect(studioModal).toBeTruthy();
    expect(JSON.parse(studioModal.dataset.cropRect || '{}')).toEqual(savedCrop);
    expect(screen.getByText('ARDO Aspirator')).toBeTruthy();
  });

  it('does not create a crop-sized inner viewport that changes the card anatomy', () => {
    const wideCrop = { x: 0.1, y: 0.2, w: 0.8, h: 0.4 };
    const { container } = render(
      <ShimmerImage
        src="/media/products/ardo-ar6120-white.jpg"
        alt="Crop Test"
        cropRect={wideCrop}
      />
    );

    expect(container.querySelector('.crop-inner-viewport')).toBeNull();

    const img = container.querySelector('.shimmer-img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.style.position).toBe('absolute');
    expect(img.dataset.cropRect).toBe(JSON.stringify(wideCrop));
  });
});
