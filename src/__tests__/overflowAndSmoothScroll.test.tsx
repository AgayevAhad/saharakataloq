// @vitest-environment happy-dom
import React from 'react';
import fs from 'fs';
import path from 'path';
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

  it('index.html and index.css strictly enforce overflow-x: hidden and no unconstrained 100vw', () => {
    const indexHtml = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf-8');
    const indexCss = fs.readFileSync(path.resolve(__dirname, '../index.css'), 'utf-8');

    // Verify index.html has overflow-x: hidden !important and scroll-behavior: smooth
    expect(indexHtml).toContain('overflow-x: hidden !important');
    expect(indexHtml).toContain('scroll-behavior: smooth');
    expect(indexHtml).not.toContain('width: 100vw;');

    // Verify index.css has overflow-x: hidden !important and scroll-behavior: smooth
    expect(indexCss).toContain('overflow-x: hidden !important');
    expect(indexCss).toContain('scroll-behavior: smooth');

    // Verify modal overlay and splash container are not using unconstrained 100vw
    expect(indexCss).not.toContain('.modal-overlay-wrap {\n  position: fixed;\n  inset: 0;\n  width: 100vw;');

    // Verify product grid and cards are clamped with minmax(0, 1fr) to prevent blowout
    expect(indexCss).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(indexCss).toContain('.brand-showcase-card { min-height: 176px; color: #fff; background: #111827 !important; overflow: hidden !important; contain: paint !important;');
    expect(indexCss).toContain('overscroll-behavior-x: contain; contain: layout paint;');
  });
});
