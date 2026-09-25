import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { ThemeColors } from '../types/theme';
import { Product } from '../types/product';

const lightTheme: ThemeColors = {
  mode: 'light',
  primary: '#dc2626',
  primaryHover: '#b91c1c',
  bg: '#ffffff',
  bgSecondary: '#f8fafc',
  bgCard: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
};

const mockProduct: Product = {
  id: 'ardo-ar6120-test',
  code: 'AR6120',
  title: 'Aspirator Ardo AR6120 White',
  category: 'aspirator',
  categoryName: 'Aspirator',
  brandId: 'ardo',
  price: 280,
  image: '/media/products/ardo/aspirator/ardo-ar6120-white.jpg',
  gallery: [
    '/media/products/ardo/aspirator/ardo-ar6120-white.jpg',
    '/media/products/ardo/aspirator/ardo-ar6120-white-2.jpg',
  ],
  specs: [{ group: 'Əsas', name: 'Rəng', value: 'Ağ' }],
  inStock: true,
};

describe('ProductDetailModal Lightbox White Background & Integrated Top Header Controls', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders fullscreen lightbox with clean studio white canvas in light mode and integrated borderless top controls', () => {
    const onClose = vi.fn();
    render(
      <ProductDetailModal
        product={mockProduct}
        theme={lightTheme}
        visible={true}
        onClose={onClose}
        onShare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onCopyLink={vi.fn()}
      />
    );

    // Modal Sticky Header should render category glyph and category name without redundant model code
    const modalHeader = document.querySelector('.modal-header-sticky') as HTMLDivElement;
    expect(modalHeader).toBeTruthy();
    expect(modalHeader.textContent).toContain('Aspirator');
    expect(modalHeader.querySelector('.category-glyph')).toBeTruthy();

    // Stage should be borderless
    const stage = document.querySelector('.product-detail-image-stage') as HTMLDivElement;
    expect(stage).toBeTruthy();
    expect(stage.style.border).toMatch(/none|^$/);

    // Brand logo should be rendered under stage
    const brandImg = document.querySelector('img[src="/media/brands/ardo-logo.png"]');
    expect(brandImg).toBeTruthy();

    // Open fullscreen lightbox
    fireEvent.click(stage);

    // Lightbox container should have white background (#ffffff) in light theme
    const lightboxModal = document.querySelector('.zoom-pan-container')?.parentElement as HTMLDivElement;
    expect(lightboxModal).toBeTruthy();
    expect(['#ffffff', 'rgb(255, 255, 255)']).toContain(lightboxModal.style.backgroundColor);

    // Top header should contain clean product title
    const topHeader = document.querySelector('.lightbox-top-header') as HTMLDivElement;
    expect(topHeader).toBeTruthy();
    expect(topHeader.textContent).toContain('Aspirator Ardo AR6120 White');

    // Zoom controls should be integrated INSIDE the top header panel
    const zoomControls = topHeader.querySelector('.zoom-floating-controls');
    expect(zoomControls).toBeTruthy();

    // Verify Rotate buttons inside top header
    const rotateLeftBtn = screen.getByTitle(/Sola fırlat/i);
    const rotateRightBtn = screen.getByTitle(/Sağa fırlat/i);
    expect(topHeader.contains(rotateLeftBtn)).toBe(true);
    expect(topHeader.contains(rotateRightBtn)).toBe(true);

    // Verify Zoom In & Out inside top header
    const zoomInBtn = screen.getByTitle(/Böyüt \(\+\)/i);
    const zoomOutBtn = screen.getByTitle(/Kiçilt \(-\)/i);
    expect(topHeader.contains(zoomInBtn)).toBe(true);
    expect(topHeader.contains(zoomOutBtn)).toBe(true);

    // Zoom buttons should be borderless
    expect(zoomInBtn.style.border).toMatch(/none|^$/);
    expect(zoomOutBtn.style.border).toMatch(/none|^$/);
    expect(rotateLeftBtn.style.border).toMatch(/none|^$/);

    // Test Zoom In and 1x Reset button inside top header
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('150%')).toBeTruthy();

    const resetBtn = screen.getByTitle(/1x Orijinal ölçüyə sıfırla/i);
    expect(resetBtn).toBeTruthy();
    expect(topHeader.contains(resetBtn)).toBe(true);
    expect(resetBtn.style.border).toMatch(/none|^$/);

    fireEvent.click(resetBtn);
    expect(screen.getByText('100%')).toBeTruthy();

    // Close button should close fullscreen lightbox
    const closeBtn = topHeader.querySelector('.sahara-soft-red-action') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.style.border).toMatch(/none|^$/);
    fireEvent.click(closeBtn);

    // Fullscreen lightbox should be closed
    expect(document.querySelector('.lightbox-top-header')).toBeNull();
  });

  it('retains zoom scale in ProductDetailPage when dragging and releasing mouse without accidental reset', async () => {
    const { ProductDetailPage } = await import('../pages/ProductDetailPage');
    render(
      <ProductDetailPage
        product={mockProduct}
        allProducts={[mockProduct]}
        categories={[]}
        brands={[]}
        settings={{}}
        theme={lightTheme}
        themeMode="light"
        onNavigate={vi.fn()}
        onSelectProduct={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
      />
    );

    // Open lightbox
    const maximizeBtn = screen.getByTitle('Böyük ekranda bax');
    fireEvent.click(maximizeBtn);

    const topHeader = document.querySelector('.lightbox-top-header') as HTMLDivElement;
    expect(topHeader).toBeTruthy();

    // Zoom in to 140%
    const zoomInBtn = topHeader.querySelector('button[title*="Böyüt"]') as HTMLButtonElement;
    expect(zoomInBtn).toBeTruthy();
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('140%')).toBeTruthy();

    const zoomContainer = document.querySelector('.zoom-pan-container') as HTMLDivElement;
    expect(zoomContainer).toBeTruthy();

    // Mouse drag across container
    fireEvent.mouseDown(zoomContainer, { clientX: 200, clientY: 200 });
    fireEvent.mouseMove(zoomContainer, { clientX: 250, clientY: 220 });
    fireEvent.mouseUp(zoomContainer);
    fireEvent.click(zoomContainer);

    // Crucial: Zoom scale must REMAIN 140% and NOT reset to 100% on release
    expect(screen.getByText('140%')).toBeTruthy();

    // Double-click should toggle zoom
    fireEvent.doubleClick(zoomContainer);
    expect(screen.getByText('100%')).toBeTruthy();
  });
});
