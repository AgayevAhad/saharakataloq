import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProductDetailModal } from '../components/ProductDetailModal';
import {
  ThemeColors,
  darkTheme as baseDarkTheme,
  lightTheme as baseLightTheme,
} from '../types/theme';
import { Product } from '../types/product';

const lightTheme: ThemeColors = {
  ...baseLightTheme,
  primary: '#b91c1c',
  primaryHover: '#991b1b',
};

const darkTheme: ThemeColors = {
  ...baseDarkTheme,
  primary: '#b91c1c',
  primaryHover: '#991b1b',
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
  shortDesc: 'Keyfiyyətli Ardo aspirator',
  specs: [
    { id: 'spec-color', group: 'Əsas', name: 'Rəng', value: 'Ağ' },
    { id: 'spec-power', group: 'Əsas', name: 'Güc', value: '150W' },
    { id: 'spec-dim', group: 'Ölçü və Enerji', name: 'Ölçü', value: '60 sm' },
  ],
  highlights: [],
};

describe('duzelisler.md - 1-ci Maddə Tələbləri', () => {
  beforeEach(() => {
    cleanup();
  });

  it('1. Topdan kataloqda lightbox-top-header arxa planı ləğv edilib (şəffafdır)', () => {
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

    // Image stage kliklənərək full görüntü (lightbox) açılır
    const stage = document.querySelector('.product-detail-image-stage') as HTMLDivElement;
    expect(stage).toBeTruthy();
    fireEvent.click(stage);

    const topHeader = document.querySelector('.lightbox-top-header') as HTMLDivElement;
    expect(topHeader).toBeTruthy();
    // lightbox-top-header arxa planı şəffafdır və blur yoxdur
    expect(['transparent', 'none', '']).toContain(topHeader.style.background);
    expect(['none', '']).toContain(topHeader.style.backdropFilter);
  });

  it('2. Full görüntü hissəsində məhsulun arxa plan tonu detal ilə eynidir (həm Light, həm Dark rejimdə)', () => {
    // Light Mode testi
    const { unmount } = render(
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

    const detailCardLight = document.querySelector('.modal-content-card') as HTMLDivElement;
    expect(detailCardLight.style.backgroundColor).toBe(lightTheme.bgCard);

    const stageLight = document.querySelector('.product-detail-image-stage') as HTMLDivElement;
    fireEvent.click(stageLight);

    const lightboxModalLight = document.querySelector('.zoom-pan-container')
      ?.parentElement as HTMLDivElement;
    expect(lightboxModalLight).toBeTruthy();
    // Full görüntü arxa planı detal ilə eynidir:
    expect(lightboxModalLight.style.backgroundColor).toBe(detailCardLight.style.backgroundColor);

    unmount();

    // Dark Mode testi
    render(
      <ProductDetailModal
        product={mockProduct}
        theme={darkTheme}
        visible={true}
        onClose={vi.fn()}
        onShare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onCopyLink={vi.fn()}
      />
    );

    const detailCardDark = document.querySelector('.modal-content-card') as HTMLDivElement;
    expect(detailCardDark.style.backgroundColor).toBe(darkTheme.bgCard);

    const stageDark = document.querySelector('.product-detail-image-stage') as HTMLDivElement;
    fireEvent.click(stageDark);

    const lightboxModalDark = document.querySelector('.zoom-pan-container')
      ?.parentElement as HTMLDivElement;
    expect(lightboxModalDark).toBeTruthy();
    // Full görüntü arxa planı detal ilə eynidir:
    expect(lightboxModalDark.style.backgroundColor).toBe(detailCardDark.style.backgroundColor);
  });

  it('3. Məhsul detalında Texniki Xüsusiyyətlər hissəsinin və sıralarının arxa planı ləğv edilib', () => {
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

    // Texniki Xüsusiyyətlər tabı görünür
    const specsTab = screen.getByRole('button', { name: /Texniki Xüsusiyyətlər/i });
    expect(specsTab).toBeTruthy();

    // Texniki Xüsusiyyətlər qrup başlığı
    const groupTitle = screen.getByText('Ölçü və Enerji');
    expect(groupTitle).toBeTruthy();

    const groupContainer = groupTitle.nextElementSibling as HTMLDivElement;
    expect(groupContainer).toBeTruthy();
    expect(['transparent', 'rgba(0, 0, 0, 0)', 'none', '']).toContain(
      groupContainer.style.backgroundColor
    );

    // Konteyner daxilindəki sətirlərin arxa planı şəffafdır
    const rows = groupContainer.children;
    expect(rows.length).toBeGreaterThan(0);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as HTMLDivElement;
      expect(['transparent', 'rgba(0, 0, 0, 0)', 'none', '']).toContain(row.style.backgroundColor);
    }
  });
});
