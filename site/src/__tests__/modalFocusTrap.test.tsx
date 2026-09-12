// @vitest-environment happy-dom
import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';

describe('Modal & Drawer Focus Trap, Keyboard & Accessibility Suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Modal: initial focus, Tab/Shift+Tab wrapping, body scroll lock, Escape, and focus restoration', () => {
    const TestComponent = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div>
          <button id="trigger-btn" onClick={() => setIsOpen(true)}>
            Aç
          </button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Test Modal">
            <div>
              <button id="modal-btn-1">Düymə 1</button>
              <button id="modal-btn-2">Düymə 2</button>
            </div>
          </Modal>
        </div>
      );
    };

    render(<TestComponent />);
    const trigger = screen.getByRole('button', { name: 'Aç' });
    trigger.focus();
    expect(document.activeElement?.id).toBe('trigger-btn');
    expect(document.body.style.overflow).toBe('');

    // Open Modal
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');

    // Fast-forward initial focus timer
    act(() => {
      vi.advanceTimersByTime(20);
    });

    const closeBtn = screen.getByRole('button', { name: 'Bağla' });
    const btn1 = screen.getByRole('button', { name: 'Düymə 1' });
    const btn2 = screen.getByRole('button', { name: 'Düymə 2' });

    // Initial focus lands on the first focusable element (close button in header)
    expect(document.activeElement).toBe(closeBtn);

    // Tab to next element
    btn1.focus();
    expect(document.activeElement).toBe(btn1);

    btn2.focus();
    expect(document.activeElement).toBe(btn2);

    // Tab from last element (btn2) wraps back to first element (closeBtn)
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);

    // Shift+Tab from first element (closeBtn) wraps to last element (btn2)
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(btn2);

    // Close Modal via Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();

    // Body scroll lock released
    expect(document.body.style.overflow).toBe('');

    // Focus restored to trigger button
    expect(document.activeElement?.id).toBe('trigger-btn');
  });

  it('Drawer: initial focus, Tab/Shift+Tab wrapping, body scroll lock, Escape, and focus restoration', () => {
    const TestDrawerComponent = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div>
          <button id="drawer-trigger" onClick={() => setIsOpen(true)}>
            Paneli Aç
          </button>
          <Drawer
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title="Səbət Paneli"
            position="right"
          >
            <div>
              <button id="item-1">Məhsul 1</button>
              <button id="item-2">Məhsul 2</button>
            </div>
          </Drawer>
        </div>
      );
    };

    render(<TestDrawerComponent />);
    const trigger = screen.getByRole('button', { name: 'Paneli Aç' });
    trigger.focus();
    expect(document.activeElement?.id).toBe('drawer-trigger');

    // Open Drawer
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-labelledby')).toContain('drawer-title-');
    expect(document.body.style.overflow).toBe('hidden');

    // Advance timer for initial focus
    act(() => {
      vi.advanceTimersByTime(20);
    });

    const closeBtn = screen.getByRole('button', { name: 'Bağla' });
    const _item1 = screen.getByRole('button', { name: 'Məhsul 1' });
    const item2 = screen.getByRole('button', { name: 'Məhsul 2' });

    expect(document.activeElement).toBe(closeBtn);

    item2.focus();
    expect(document.activeElement).toBe(item2);

    // Tab wrap from last item to first item
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);

    // Shift+Tab wrap from first item to last item
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(item2);

    // Close via Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();

    // Body scroll unlocked & focus restored
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement?.id).toBe('drawer-trigger');
  });

  it('Background isolation: applies inert and aria-hidden to background siblings and restores on close', () => {
    const BackgroundApp = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div>
          <div id="root-content">
            <button id="main-app-btn">Əsas Tətbiq Düyməsi</button>
            <button id="open-modal-btn" onClick={() => setIsOpen(true)}>
              Modal Aç
            </button>
          </div>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="İzolyasiya Modalı">
            <button id="inside-modal-btn">Daxili Düymə</button>
          </Modal>
        </div>
      );
    };

    render(<BackgroundApp />);
    const rootContent = document.getElementById('root-content');
    expect(rootContent?.getAttribute('aria-hidden')).toBeNull();
    expect((rootContent as HTMLElement & { inert?: boolean })?.inert).toBeFalsy();

    // Open Modal
    fireEvent.click(screen.getByRole('button', { name: 'Modal Aç' }));
    expect(screen.getByRole('dialog')).toBeTruthy();

    // Background is marked inert and aria-hidden
    expect(rootContent?.getAttribute('aria-hidden')).toBe('true');
    expect((rootContent as HTMLElement & { inert?: boolean })?.inert).toBe(true);

    // Close Modal
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();

    // Background state restored
    expect(rootContent?.getAttribute('aria-hidden')).toBeNull();
    expect((rootContent as HTMLElement & { inert?: boolean })?.inert).toBe(false);
  });

  it('Nested modals: top modal isolates lower modal and background gracefully', () => {
    const NestedApp = () => {
      const [isFirstOpen, setIsFirstOpen] = useState(false);
      const [isSecondOpen, setIsSecondOpen] = useState(false);
      return (
        <div>
          <div id="nested-root">
            <button id="open-parent-btn" onClick={() => setIsFirstOpen(true)}>
              Birinci Modalı Aç
            </button>
          </div>
          <Modal isOpen={isFirstOpen} onClose={() => setIsFirstOpen(false)} title="Birinci Modal">
            <div>
              <button id="open-child-btn" onClick={() => setIsSecondOpen(true)}>
                İkinci Modalı Aç
              </button>
              <Modal
                isOpen={isSecondOpen}
                onClose={() => setIsSecondOpen(false)}
                title="İkinci Qat Modal"
              >
                <button id="nested-inside-btn">İçəri Düymə</button>
              </Modal>
            </div>
          </Modal>
        </div>
      );
    };

    render(<NestedApp />);
    const nestedRoot = document.getElementById('nested-root');

    // Open 1st modal
    fireEvent.click(screen.getByRole('button', { name: 'Birinci Modalı Aç' }));
    expect(screen.getByText('Birinci Modal')).toBeTruthy();
    expect(nestedRoot?.getAttribute('aria-hidden')).toBe('true');

    // Open 2nd (nested) modal
    fireEvent.click(screen.getByRole('button', { name: 'İkinci Modalı Aç' }));
    expect(screen.getByText('İkinci Qat Modal')).toBeTruthy();

    // Close 2nd modal via Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('İkinci Qat Modal')).toBeNull();
    expect(screen.getByText('Birinci Modal')).toBeTruthy();

    // Close 1st modal
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Birinci Modal')).toBeNull();

    // Root background fully restored
    expect(nestedRoot?.getAttribute('aria-hidden')).toBeNull();
    expect((nestedRoot as HTMLElement & { inert?: boolean })?.inert).toBe(false);
  });
});
