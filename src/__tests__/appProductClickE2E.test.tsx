// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../App';
import { catalogApi } from '../services/catalogApi';
import { DEFAULT_CATALOG } from '../data/catalog';

const MOCK_CATALOG: typeof DEFAULT_CATALOG = {
  ...DEFAULT_CATALOG,
  products: [
    {
      id: 'ardo-604b',
      brandId: 'ardo',
      code: '604B',
      title: 'Aspirator Ardo 604B',
      category: 'hood',
      categoryName: 'Aspiratorlar',
      shortDesc: 'Aspirator Ardo 604B model',
      image: '/media/products/ardo-604b.jpg',
      gallery: ['/media/products/ardo-604b.jpg'],
      media: [{ id: 'm-1', type: 'image', url: '/media/products/ardo-604b.jpg', alt: 'Aspirator Ardo 604B', fitMode: 'contain', objectPosition: 'center' }],
      highlights: ['Məhsuldarlıq: 600 m³/saat'],
      specs: [{ id: 's-1', name: 'Məhsuldarlıq', value: '600 m³/saat', group: 'Əsas' }],
      status: 'published',
    },
    {
      id: 'lotus-alv420s',
      brandId: 'lotus',
      code: 'ALV420S',
      title: 'Aspirator Lotus ALV420S',
      category: 'hood',
      categoryName: 'Aspiratorlar',
      shortDesc: 'Aspirator Lotus ALV420S model',
      image: '/media/products/lotus-alv420s.jpg',
      gallery: ['/media/products/lotus-alv420s.jpg'],
      media: [{ id: 'm-2', type: 'image', url: '/media/products/lotus-alv420s.jpg', alt: 'Aspirator Lotus ALV420S', fitMode: 'contain', objectPosition: 'center' }],
      highlights: ['Məhsuldarlıq: 650 m³/saat'],
      specs: [{ id: 's-2', name: 'Məhsuldarlıq', value: '650 m³/saat', group: 'Əsas' }],
      status: 'published',
    }
  ],
};

vi.spyOn(catalogApi, 'getCatalog').mockResolvedValue(MOCK_CATALOG);
vi.spyOn(catalogApi, 'track').mockResolvedValue(undefined as any);

afterEach(() => {
  cleanup();
});

describe('App Product Click and Modal Integration E2E Test', () => {
  it('opens product modal with full details, image, title, specs when product card is clicked', async () => {
    const { container } = render(<App />);

    // Wait for catalog to render
    await waitFor(() => {
      expect(screen.getAllByText('ARDO').length).toBeGreaterThan(0);
    });

    // Find and click on the ARDO brand card in BrandShowcase
    const ardoBrandCard = screen.getByRole('button', { name: /ARDO məhsullarına bax/i });
    expect(ardoBrandCard).not.toBeNull();
    fireEvent.click(ardoBrandCard);

    // Wait for product cards to render
    await waitFor(() => {
      expect(container.querySelectorAll('.product-card').length).toBeGreaterThan(0);
    });

    const productCards = container.querySelectorAll('.product-card');
    const firstCard = productCards[0];
    expect(firstCard.textContent).toContain('Aspirator Ardo 604B');

    // Click to open product detail modal
    fireEvent.click(firstCard);

    // Modal overlay should be rendered
    const modalOverlay = container.querySelector('.modal-overlay-wrap');
    expect(modalOverlay).not.toBeNull();

    // Modal content card should be present with light theme card background
    const modalContent = container.querySelector('.modal-content-card') as HTMLElement;
    expect(modalContent).not.toBeNull();
    expect(modalContent.style.backgroundColor).toBe('#ffffff');

    // The image stage and info column must exist
    const imageStage = container.querySelector('.product-detail-image-stage');
    expect(imageStage).not.toBeNull();

    const infoCol = container.querySelector('.product-modal-info-col');
    expect(infoCol).not.toBeNull();

    // Check title in modal
    expect(modalContent?.textContent).toContain('Aspirator Ardo 604B');

    // Check action buttons inside modalContent (WhatsApp, Call, Copy Link)
    expect(modalContent.textContent).toContain('WhatsApp');
    expect(modalContent.textContent).toContain('Zəng et');
    expect(modalContent.textContent).toContain('Məhsul linki kopyala');
  });
});
