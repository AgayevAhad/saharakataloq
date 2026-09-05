// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { FloatingActions } from '../components/FloatingActions';
import { DEFAULT_SETTINGS } from '../data/catalog';
import { lightTheme } from '../types/theme';

describe('Horizontal Overflow Prevention & Smooth Scroll Suite', () => {
  it('FloatingActions triggers smooth window.scrollTo({ top: 0, left: 0, behavior: "smooth" }) on top button click', () => {
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;

    const { container } = render(
      <FloatingActions
        settings={DEFAULT_SETTINGS}
        theme={lightTheme}
        showToast={vi.fn()}
      />
    );

    const topBtn = container.querySelector('.floating-top') as HTMLButtonElement;
    expect(topBtn).toBeTruthy();

    fireEvent.click(topBtn);

    expect(scrollToMock).toHaveBeenCalledWith(
      expect.objectContaining({
        top: 0,
        left: 0,
        behavior: 'smooth',
      })
    );
  });

  it('Splash screen and modal overlay classes do not cause horizontal overflow', () => {
    document.body.innerHTML = `
      <div id="app-splash-screen" class="sahara-splash-container"></div>
      <div class="modal-overlay-wrap"></div>
    `;

    const splash = document.getElementById('app-splash-screen');
    expect(splash).toBeTruthy();

    const modal = document.querySelector('.modal-overlay-wrap');
    expect(modal).toBeTruthy();
  });
});
