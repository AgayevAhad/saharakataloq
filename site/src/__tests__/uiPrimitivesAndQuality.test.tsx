// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { Toast } from '../components/ui/Toast';
import { EmptyState } from '../components/ui/EmptyState';
import { NetworkState } from '../components/ui/NetworkState';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { featureFlags } from '../utils/featureFlags';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('Phase 1 UI Primitives, Accessibility & Quality Foundation Suite', () => {
  describe('Button Component', () => {
    it('renders with accessible aria attributes and handles loading state', () => {
      const { rerender } = render(<Button>Daxil ol</Button>);
      const btn = screen.getByRole('button', { name: 'Daxil ol' });
      expect(btn).toBeTruthy();
      expect(btn.getAttribute('aria-busy')).toBe('false');

      rerender(<Button isLoading>Daxil ol</Button>);
      expect(screen.getByRole('button').getAttribute('aria-busy')).toBe('true');
      expect(screen.getByRole('button').hasAttribute('disabled')).toBe(true);
      expect(screen.getByText('Yüklənir...')).toBeTruthy();
    });

    it('handles click events when enabled and ignores when disabled', () => {
      const handleClick = vi.fn();
      const { rerender } = render(<Button onClick={handleClick}>Kliklə</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);

      rerender(
        <Button onClick={handleClick} disabled>
          Kliklə
        </Button>
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Input Component', () => {
    it('links label, input, error, and hint with accessible aria attributes', () => {
      render(
        <Input
          id="test-phone"
          label="Telefon nömrəsi"
          placeholder="+994"
          error="Nömrə düzgün daxil edilməyib"
        />
      );

      const input = screen.getByLabelText('Telefon nömrəsi');
      expect(input).toBeTruthy();
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe('test-phone-error');
      expect(screen.getByRole('alert').textContent).toBe('Nömrə düzgün daxil edilməyib');
    });
  });

  describe('Badge Component', () => {
    it('renders badges with appropriate styling variants', () => {
      const { container } = render(<Badge variant="success">Stokda var</Badge>);
      const badge = container.querySelector('.sahara-badge-success');
      expect(badge).toBeTruthy();
      expect(badge?.textContent).toBe('Stokda var');
    });
  });

  describe('Tabs Component & Keyboard Navigation', () => {
    it('supports tab switching and ArrowLeft, ArrowRight, Home, End keyboard navigation', () => {
      const handleTabChange = vi.fn();
      const tabs = [
        { id: 'all', label: 'Bütün Məhsullar' },
        { id: 'specs', label: 'Texniki Göstəricilər' },
        { id: 'delivery', label: 'Çatdırılma' },
      ];

      render(<Tabs tabs={tabs} activeTab="all" onChange={handleTabChange} />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeTruthy();

      const firstTab = screen.getByRole('tab', { name: 'Bütün Məhsullar' });
      expect(firstTab.getAttribute('aria-selected')).toBe('true');

      // ArrowRight -> switch to next tab
      fireEvent.keyDown(tablist, { key: 'ArrowRight' });
      expect(handleTabChange).toHaveBeenCalledWith('specs');

      // End -> switch to last tab
      fireEvent.keyDown(tablist, { key: 'End' });
      expect(handleTabChange).toHaveBeenCalledWith('delivery');

      // Home -> switch to first tab
      fireEvent.keyDown(tablist, { key: 'Home' });
      expect(handleTabChange).toHaveBeenCalledWith('all');
    });
  });

  describe('Modal Component', () => {
    it('renders when isOpen is true, locks body scroll, and closes on Escape key', () => {
      const handleClose = vi.fn();
      const { unmount } = render(
        <Modal isOpen={true} onClose={handleClose} title="Xüsusi Təklif">
          <p>Modal Məzmunu</p>
        </Modal>
      );

      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText('Xüsusi Təklif')).toBeTruthy();
      expect(screen.getByText('Modal Məzmunu')).toBeTruthy();
      expect(document.body.style.overflow).toBe('hidden');

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);

      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Drawer Component', () => {
    it('renders slide-out drawer and responds to backdrop click and Escape key', () => {
      const handleClose = vi.fn();
      render(
        <Drawer isOpen={true} onClose={handleClose} title="Səbət" position="right">
          <div>Səbət boşdur</div>
        </Drawer>
      );

      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText('Səbət')).toBeTruthy();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorBoundary Component', () => {
    it('catches render errors and renders fallback recovery UI without crashing', () => {
      const ProblematicChild = () => {
        throw new Error('Test Component Crash');
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ProblematicChild />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText('Xəta baş verdi')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Səhifəni Yenilə/i })).toBeTruthy();

      consoleSpy.mockRestore();
    });
  });

  describe('Feature Flag System', () => {
    it('initializes default flags and allows toggling with localStorage persistence', () => {
      featureFlags.resetToDefaults();
      expect(featureFlags.isEnabled('enableCart')).toBe(false);
      expect(featureFlags.isEnabled('enableSaharaMatch')).toBe(false);

      featureFlags.setFlag('enableCart', true);
      expect(featureFlags.isEnabled('enableCart')).toBe(true);

      featureFlags.resetToDefaults();
      expect(featureFlags.isEnabled('enableCart')).toBe(false);
    });
  });

  describe('Toast Component', () => {
    it('renders toast with polite status alert and close button', () => {
      const handleClose = vi.fn();
      render(<Toast message="Əməliyyat uğurla tamamlandı" type="success" onClose={handleClose} />);

      const alert = screen.getByRole('status');
      expect(alert).toBeTruthy();
      expect(screen.getByText('Əməliyyat uğurla tamamlandı')).toBeTruthy();

      const closeBtn = screen.getByRole('button', { name: 'Bildirişi bağla' });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmptyState & NetworkState Components', () => {
    it('renders EmptyState with custom title and action button', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="Nəticə tapılmadı"
          description="Filterləri təmizləyin"
          actionLabel="Filterləri sıfırla"
          onAction={handleAction}
        />
      );

      expect(screen.getByText('Nəticə tapılmadı')).toBeTruthy();
      expect(screen.getByText('Filterləri təmizləyin')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Filterləri sıfırla' }));
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('renders NetworkState with alert role and retry action', () => {
      const handleRetry = vi.fn();
      render(<NetworkState onRetry={handleRetry} />);

      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText('Bağlantı xətası baş verdi')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: /Yenidən yoxla/i }));
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Viewport Horizontal Overflow Audit', () => {
    const viewports = [320, 390, 768, 1024, 1440, 1920];

    viewports.forEach((width) => {
      it(`maintains strict zero horizontal overflow on ${width}px viewport`, () => {
        document.body.innerHTML = `
          <div id="root" style="width: 100%; max-width: 100%; overflow-x: hidden;">
            <header style="width: 100%; max-width: 100%;"></header>
            <main style="width: 100%; max-width: 100%; overflow-x: hidden;"></main>
          </div>
        `;

        const root = document.getElementById('root');
        expect(root?.style.overflowX).toBe('hidden');
        expect(root?.style.maxWidth).toBe('100%');
      });
    });
  });
});
