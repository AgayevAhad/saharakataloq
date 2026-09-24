import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { Product } from '../types/product';
import { ThemeColors } from '../types/theme';

const sampleLongDescProduct: Product = {
  id: 'ardo-overview-test',
  code: 'ARDO-OVW-01',
  title: 'ARDO Sabaf 60 Inox Aspirator',
  brand: 'ardo',
  category: 'hood',
  categoryName: 'Aspiratorlar',
  image: '/media/ardo/aspirator.webp',
  price: 480,
  shortDesc: 'Bu məhsul İtaliya istehsalı olan Sabaf motorlu premium aspiratordur.\nÇox səssiz işləyir və yüksək sovurma gücünə malikdir.\nMətbəxinizdə təmiz hava və zərif görünüş təmin edir.\nƏlavə olaraq alüminium yağ filtri və LED işıqlandırma ilə təchiz edilmişdir.',
  specs: [],
  media: [
    { id: 'v-1', url: '/media/ardo/video.mp4', type: 'video', alt: 'ARDO Video İcmal' },
  ],
};

const lightTheme: ThemeColors = {
  mode: 'light',
  primary: '#dc2626',
  primaryHover: '#b91c1c',
  primarySoft: 'rgba(220, 38, 38, 0.1)',
  secondary: '#ef4444',
  accent: '#f87171',
  bg: '#ffffff',
  surface: '#f8fafc',
  surfaceHover: '#f1f5f9',
  border: '#e2e8f0',
  borderLight: '#cbd5e1',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
};

describe('Product Detail Overview & Video Suite', () => {
  it('1. ProductDetailPage renders 3-line overview description card and toggles "Davamını oxu..."', () => {
    render(
      <MemoryRouter>
        <ProductDetailPage
          product={sampleLongDescProduct}
          allProducts={[sampleLongDescProduct]}
          theme={lightTheme}
          themeMode="light"
          onWhatsApp={vi.fn()}
          onCall={vi.fn()}
        />
      </MemoryRouter>
    );

    // Check overview card exists
    const overviewCard = document.querySelector('.product-detail-overview-card');
    expect(overviewCard).toBeDefined();

    // Check toggle button
    const toggleBtn = screen.getByRole('button', { name: /Davamını oxu.../i });
    expect(toggleBtn).toBeDefined();

    // Click to expand
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /Qısalt/i })).toBeDefined();

    // Click to collapse
    fireEvent.click(screen.getByRole('button', { name: /Qısalt/i }));
    expect(screen.getByRole('button', { name: /Davamını oxu.../i })).toBeDefined();
  });

  it('2. ProductDetailPage renders video overview preview card and opens centered player modal on click', () => {
    render(
      <MemoryRouter>
        <ProductDetailPage
          product={sampleLongDescProduct}
          allProducts={[sampleLongDescProduct]}
          theme={lightTheme}
          themeMode="light"
          onWhatsApp={vi.fn()}
          onCall={vi.fn()}
        />
      </MemoryRouter>
    );

    // Check Video Overview card is rendered
    expect(screen.getAllByText('Video İcmal').length).toBeGreaterThan(0);
    const videoTitles = screen.getAllByText('Məhsulun video icmalını izləyin');
    expect(videoTitles.length).toBeGreaterThan(0);

    // Click video overview card to open centered video player
    const videoCard = videoTitles[0].closest('div[style*="cursor: pointer"]') as HTMLElement;
    expect(videoCard).toBeDefined();
    fireEvent.click(videoCard);

    // Lightbox / fullscreen center player should open
    const lightboxDialog = screen.getByRole('dialog');
    expect(lightboxDialog).toBeDefined();
    expect(lightboxDialog.querySelector('video')).toBeDefined();
  });

  it('3. ProductDetailModal also renders overview description and video overview card', () => {
    render(
      <ProductDetailModal
        product={sampleLongDescProduct}
        visible={true}
        theme={lightTheme}
        onClose={vi.fn()}
        onShare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onCopyLink={vi.fn()}
      />
    );

    expect(screen.getByText('Video icmalı izləyin')).toBeDefined();
    expect(screen.getByRole('button', { name: /Davamını oxu.../i })).toBeDefined();
  });

  it('4. Product without description or video does not render fake text or empty overview card', () => {
    const emptyProduct: Product = {
      id: 'bosch-hmg978nb1-test',
      code: 'HMG978NB1',
      title: 'Quraşdırılan soba Bosch HMG978NB1, Series 8',
      brand: 'bosch',
      category: 'oven',
      image: '/media/bosch/oven.webp',
      price: 5149.99,
      oldPrice: 6699.99,
      specs: [],
      media: [],
    };

    const { container } = render(
      <MemoryRouter>
        <ProductDetailPage
          product={emptyProduct}
          allProducts={[emptyProduct]}
          theme={lightTheme}
          themeMode="light"
          onWhatsApp={vi.fn()}
          onCall={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(container.querySelector('.product-detail-overview-card')).toBeNull();
    expect(screen.queryByText(/brendinin rəsmi kataloq modelidir/i)).toBeNull();
  });
});
