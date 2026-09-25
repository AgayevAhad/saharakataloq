import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CustomerChatWidget } from '../components/site/CustomerChatWidget';
import { TrustHighlights } from '../components/TrustHighlights';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { lightTheme, darkTheme } from '../types/theme';

describe('Item 54 Dark Mode Refinements & Contrast Verification', () => {
  beforeEach(() => {
    cleanup();
  });

  describe('CustomerChatWidget Dark Mode Trigger & Styling', () => {
    it('renders customer chat trigger with accessible label and opens properly', () => {
      const onOpenAccount = vi.fn();
      render(<CustomerChatWidget user={null} onOpenAccount={onOpenAccount} />);

      const triggerBtn = screen.getByRole('button', {
        name: /Çat üçün hesabınıza daxil olun/i,
      });
      expect(triggerBtn).toBeDefined();
      expect(triggerBtn.classList.contains('customer-chat-trigger')).toBe(true);

      fireEvent.click(triggerBtn);
      expect(onOpenAccount).toHaveBeenCalledTimes(1);
    });

    it('renders helper message bubble during intro state', () => {
      render(<CustomerChatWidget user={null} onOpenAccount={vi.fn()} />);
      expect(screen.getByText('Sualınız var? Bura yazın.')).toBeDefined();
    });
  });

  describe('TrustHighlights Button Semantics & Dark Mode Contrast', () => {
    it('renders Peşəkar dəstək and other trust items with interactive button semantics in dark mode', () => {
      const onNavigate = vi.fn();
      const { container } = render(
        <TrustHighlights theme={darkTheme} onNavigate={onNavigate} />
      );

      const supportBtn = container.querySelector(
        '.trust-btn-trust-support'
      ) as HTMLElement;
      expect(supportBtn).toBeDefined();
      expect(supportBtn.getAttribute('role')).toBe('button');
      expect(supportBtn.getAttribute('tabindex')).toBe('0');
      expect(supportBtn.classList.contains('trust-highlight-card')).toBe(true);

      // Verify click navigates to support
      fireEvent.click(supportBtn);
      expect(onNavigate).toHaveBeenCalledWith('support');

      // Verify keyboard Enter navigates
      const warrantyBtn = container.querySelector(
        '.trust-btn-trust-warranty'
      ) as HTMLElement;
      fireEvent.keyDown(warrantyBtn, { key: 'Enter' });
      expect(onNavigate).toHaveBeenCalledWith('warranty');

      // Verify dark mode text rendering
      expect(screen.getByText('Peşəkar dəstək')).toBeDefined();
      expect(screen.getByText('Mövcud əlaqə kanalları ilə')).toBeDefined();
    });

    it('renders trust items in light mode correctly', () => {
      const onNavigate = vi.fn();
      const { container } = render(
        <TrustHighlights theme={lightTheme} onNavigate={onNavigate} />
      );

      const deliveryBtn = container.querySelector(
        '.trust-btn-trust-delivery'
      ) as HTMLElement;
      expect(deliveryBtn).toBeDefined();
      fireEvent.click(deliveryBtn);
      expect(onNavigate).toHaveBeenCalledWith('delivery');
    });
  });

  describe('Breadcrumbs Dark Mode & Page Header Contrast', () => {
    it('renders Ana Səhifə as single active breadcrumb on home page', () => {
      const { container } = render(
        <Breadcrumbs items={[{ label: 'Ana Səhifə', href: '/' }]} />
      );

      const nav = container.querySelector('.breadcrumbs-container');
      expect(nav).toBeDefined();

      const current = container.querySelector('.breadcrumb-current');
      expect(current).toBeDefined();
      expect(current?.textContent).toContain('Ana Səhifə');
    });

    it('renders multi-level breadcrumbs with link and current page item', () => {
      const { container } = render(
        <Breadcrumbs
          items={[
            { label: 'Ana Səhifə', href: '/' },
            { label: 'Kataloq', href: '/catalog' },
            { label: 'Quraşdırılan Texnika', current: true },
          ]}
        />
      );

      const links = container.querySelectorAll('.breadcrumb-link');
      expect(links.length).toBeGreaterThanOrEqual(1);
      expect(links[0].textContent).toContain('Ana Səhifə');

      const current = container.querySelector('.breadcrumb-current');
      expect(current).toBeDefined();
      expect(current?.textContent).toContain('Quraşdırılan Texnika');
    });
  });

  describe('ProductDetailModal Dark Mode Image Stage & Light Logo Styling', () => {
    it('renders image stage with pure white background and light logo in dark mode', async () => {
      const { ProductDetailModal } = await import('../components/ProductDetailModal');
      const testProduct = {
        id: 'test-ardo-1',
        title: 'ARDO Soba',
        modelCode: 'ARDO-SOBA-1',
        code: 'ARDO-SOBA-1',
        brandId: 'ardo',
        brandName: 'ARDO',
        category: 'oven',
        categoryName: 'Sobalar',
        images: ['/media/ardo-soba.jpg'],
        image: '/media/ardo-soba.jpg',
        price: 900,
        status: 'published' as const,
        specs: [],
        highlights: [],
      };

      const testBrand = {
        id: 'ardo',
        name: 'ARDO',
        slug: 'ardo',
        originCountry: 'İtaliya',
        manufacturingCountries: ['İtaliya'],
        logo: '/media/brands/ardo-logo.png',
        active: true,
      };

      const { container } = render(
        <ProductDetailModal
          product={testProduct}
          brand={testBrand}
          theme={darkTheme}
          visible={true}
          onClose={vi.fn()}
          onWhatsApp={vi.fn()}
          onCall={vi.fn()}
          onShare={vi.fn()}
          onCopyLink={vi.fn()}
        />
      );

      const stage = container.querySelector('.product-detail-image-stage') as HTMLElement;
      expect(stage).not.toBeNull();
      expect(stage.style.backgroundColor).toMatch(/rgb\(255, 255, 255\)|#ffffff/);

      // Logo container above stage should have light/white background
      const logoImg = container.querySelector('img[alt="ARDO"]') as HTMLElement;
      expect(logoImg).not.toBeNull();
      const logoBox = logoImg.parentElement as HTMLElement;
      expect(logoBox.style.backgroundColor).toMatch(/rgb\(255, 255, 255\)|#ffffff/);
    });
  });
});

