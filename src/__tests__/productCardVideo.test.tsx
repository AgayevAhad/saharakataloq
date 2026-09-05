// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../components/ProductCard';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { lightTheme } from '../types/theme';
import { Product } from '../types/product';

afterEach(cleanup);

describe('Product Card Video Motion Cover & Detail Modal Audio Controls', () => {
  const mockProductWithVideo: Product = {
    id: 'lotus-asp-2752',
    code: 'LT-2752',
    title: 'Lotus Aspirator LT-2752 İnox',
    category: 'hood',
    categoryName: 'Aspiratorlar',
    shortDesc: 'Güclü turbo motorlu Lotus aspirator',
    brandId: 'lotus',
    image: '/media/products/lotus-aspirator-2752.jpg',
    gallery: ['/media/products/lotus-aspirator-2752.jpg'],
    media: [
      { id: 'm1', type: 'video', url: '/media/products/videos/lotus-aspirator-2752.mp4', poster: '/media/products/lotus-aspirator-2752.jpg', alt: 'Lotus Aspirator Video Çarxı' },
      { id: 'm2', type: 'image', url: '/media/products/lotus-aspirator-2752.jpg', alt: 'Lotus Aspirator Şəkili' },
    ],
    highlights: [],
    specs: [],
    status: 'published',
  };

  it('renders video element and Video indicator badge on ProductCard when video is cover', () => {
    const { container } = render(
      <ProductCard
        product={mockProductWithVideo}
        theme={lightTheme}
        onSelect={vi.fn()}
        onShare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onCopyLink={vi.fn()}
      />
    );

    const videoEl = container.querySelector('video');
    expect(videoEl).toBeDefined();
    expect(videoEl?.getAttribute('src')).toBe('/media/products/videos/lotus-aspirator-2752.mp4');
    expect(videoEl?.getAttribute('poster')).toBe('/media/products/lotus-aspirator-2752.jpg');

    // Video badge indicator
    expect(screen.getByText(/Video Qapaq/i)).toBeDefined();
  });

  it('plays video muted by default in ProductDetailModal and allows unmuting/muting with audio button', () => {
    const { container } = render(
      <ProductDetailModal
        product={mockProductWithVideo}
        theme={lightTheme}
        visible={true}
        onClose={vi.fn()}
        onShare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onCopyLink={vi.fn()}
      />
    );

    // Modal video should exist and be muted by default
    const videoEl = container.querySelector('.product-detail-image-stage video') as HTMLVideoElement;
    expect(videoEl).toBeDefined();
    expect(videoEl?.muted).toBe(true);

    // Sound toggle button should display "Səsi Aç" when muted
    const soundToggleBtn = screen.getByRole('button', { name: /Səsi Aç/i });
    expect(soundToggleBtn).toBeDefined();

    // Click sound button to unmute
    fireEvent.click(soundToggleBtn);

    // Video should now be unmuted and button should show "Səsi Bağla"
    expect(videoEl.muted).toBe(false);
    expect(screen.getByRole('button', { name: /Səsi Bağla/i })).toBeDefined();

    // Click sound button again to mute
    const muteBtn = screen.getByRole('button', { name: /Səsi Bağla/i });
    fireEvent.click(muteBtn);
    expect(videoEl.muted).toBe(true);
    expect(screen.getByRole('button', { name: /Səsi Aç/i })).toBeDefined();
  });
});
