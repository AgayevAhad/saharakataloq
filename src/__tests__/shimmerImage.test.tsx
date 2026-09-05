// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/react';
import { ShimmerImage } from '../components/ShimmerImage';

afterEach(() => {
  cleanup();
});

describe('ShimmerImage Component & Spinner Loading Suite', () => {
  it('renders shimmer container with spinner overlay before image loads', () => {
    const { container } = render(
      <ShimmerImage
        src="/media/products/ardo-6331-gb.jpg"
        alt="Test Image"
        objectFit="cover"
        objectPosition="top center"
      />
    );

    const wrap = container.querySelector('.img-shimmer-container');
    expect(wrap).toBeTruthy();

    const overlay = container.querySelector('.img-shimmer-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay?.classList.contains('is-loaded')).toBe(false);

    // Spinner icon exists
    const spinner = container.querySelector('.img-spin');
    expect(spinner).toBeTruthy();

    // Image tag exists with initial opacity 0
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.style.objectFit).toBe('cover');
    expect(img.style.objectPosition).toBe('top center');
    expect(img.style.opacity).toBe('0');
  });

  it('transitions to loaded state on image onLoad event', () => {
    const { container } = render(
      <ShimmerImage
        src="/media/products/ardo-6331-gb.jpg"
        alt="Test Image"
      />
    );

    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();

    // Trigger load event
    fireEvent.load(img);

    const overlay = container.querySelector('.img-shimmer-overlay');
    expect(overlay?.classList.contains('is-loaded')).toBe(true);
    expect(img.style.opacity).toBe('1');
  });

  it('renders fallback icon on image error', () => {
    const { container } = render(
      <ShimmerImage
        src="/invalid-image-path.jpg"
        alt="Broken Image"
      />
    );

    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();

    // Trigger error event
    fireEvent.error(img);

    expect(container.querySelector('.img-fallback-box')).toBeTruthy();
    expect(container.textContent).toContain('Şəkil yoxdur');
  });
});
