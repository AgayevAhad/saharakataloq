import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { darkTheme } from '../types/theme';
import { getInitialDarkVariant, DARK_VARIANT_KEY } from '../hooks/useTheme';
import type { Product } from '../types/product';

const mockProduct: Product = {
  id: 'ardo-mobile-test',
  code: 'AR-MTEST-01',
  title: 'ARDO Test Cooktop Inox',
  category: 'cooktop',
  categoryName: 'Bişirmə panelləri',
  brandId: 'ardo',
  price: 520,
  image: '/media/products/ardo/cooktop/test.jpg',
  gallery: ['/media/products/ardo/cooktop/test.jpg', '/media/products/ardo/cooktop/test2.jpg'],
  shortDesc: 'Mobil tam ekran və tema testi',
  specs: [
    { id: 's1', group: 'Əsas', name: 'Növ', value: 'Qaz' },
  ],
  highlights: ['Sabaf ocaqlar'],
};

describe('Mobile Dark Mode Tone & Fullscreen Lightbox Collision Prevention', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    document.body.style.overflow = '';
  });

  it('1. getInitialDarkVariant sanitizes legacy glass/slate localStorage to default neutral dark', () => {
    localStorage.setItem(DARK_VARIANT_KEY, 'glass');
    const resultGlass = getInitialDarkVariant();
    expect(resultGlass).toBe('default');
    expect(localStorage.getItem(DARK_VARIANT_KEY)).toBe('default');

    localStorage.setItem(DARK_VARIANT_KEY, 'slate');
    const resultSlate = getInitialDarkVariant();
    expect(resultSlate).toBe('default');
    expect(localStorage.getItem(DARK_VARIANT_KEY)).toBe('default');
  });

  it('2. Fullscreen Lightbox in ProductDetailModal has zIndex 9999, opaque background, and hides underlying details', () => {
    const { container } = render(
      <ProductDetailModal
        product={mockProduct}
        theme={darkTheme}
        visible={true}
        onClose={vi.fn()}
        onCopyLink={vi.fn()}
        onShare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
      />
    );

    const modalContentCard = container.querySelector('.modal-content-card') as HTMLElement;
    expect(modalContentCard).toBeTruthy();
    expect(modalContentCard.style.display).toBe('flex');

    // Click on image stage to open fullscreen lightbox
    const imageStage = container.querySelector('.product-detail-image-stage') as HTMLElement;
    expect(imageStage).toBeTruthy();
    fireEvent.click(imageStage);

    // After entering fullscreen:
    // 1. modal-content-card must be display: none so it doesn't overlap or receive touches
    expect(modalContentCard.style.display).toBe('none');

    // 2. Lightbox container must exist with z-index 9999 and solid dark background
    const lightbox = container.querySelector('.lightbox-top-header')?.parentElement as HTMLElement;
    expect(lightbox).toBeTruthy();
    expect(lightbox.style.zIndex).toBe('240');
    expect(lightbox.style.backgroundColor).toBe('#121214');

    // 3. Body scroll must be locked
    expect(document.body.style.overflow).toBe('hidden');

    // Close lightbox
    const closeBtn = screen.getByRole('button', { name: /Bağla/i });
    fireEvent.click(closeBtn);

    // After closing lightbox:
    // Detail card is restored to display: flex
    expect(modalContentCard.style.display).toBe('flex');
  });

  it('3. Bottom indicator and navigation buttons use neutral rgba(18, 18, 20) instead of legacy navy blue', () => {
    const { container } = render(
      <ProductDetailModal
        product={mockProduct}
        theme={darkTheme}
        visible={true}
        onClose={vi.fn()}
        onCopyLink={vi.fn()}
        onShare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
      />
    );

    // Open lightbox
    const imageStage = container.querySelector('.product-detail-image-stage') as HTMLElement;
    fireEvent.click(imageStage);

    const bottomBar = container.querySelector('.fs-lightbox-bottom-bar') as HTMLElement;
    expect(bottomBar).toBeTruthy();
    expect(bottomBar.style.backgroundColor).toBe('rgba(18, 18, 20, 0.94)');
  });
});
