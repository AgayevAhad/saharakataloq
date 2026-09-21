// @vitest-environment happy-dom
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProductCard } from '../components/ProductCard';
import { lightTheme } from '../types/theme';
import { Product } from '../types/product';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('ProductCard motion preview', () => {
  it('plays a visible video without hover and never hides the still image before playback starts', () => {
    let onIntersection: IntersectionObserverCallback | undefined;
    class ObserverStub {
      constructor(callback: IntersectionObserverCallback) {
        onIntersection = callback;
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('IntersectionObserver', ObserverStub);
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const product: Product = {
      id: 'video-product',
      code: 'REAL-VIDEO',
      title: 'Video məhsul',
      category: 'appliances',
      categoryName: 'Məişət texnikası',
      image: '/media/products/real-cover.jpg',
      shortDesc: '',
      specs: [],
      highlights: [],
      media: [{ id: 'video-1', type: 'video', url: '/media/products/real-preview.mp4' }],
      status: 'published',
    };

    const { container } = render(
      <ProductCard
        product={product}
        theme={lightTheme}
        onSelect={vi.fn()}
        onShare={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
        onCopyLink={vi.fn()}
      />
    );
    const video = container.querySelector('.product-card-media video') as HTMLVideoElement;
    expect(video.style.opacity).toBe('0');
    expect(video.autoplay).toBe(false);

    act(() =>
      onIntersection?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    );
    expect(video.autoplay).toBe(true);
    expect(play).toHaveBeenCalled();
    expect(video.style.opacity).toBe('0');
    fireEvent.playing(video);
    expect(video.style.opacity).toBe('1');

    act(() =>
      onIntersection?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    );
    expect(pause).toHaveBeenCalled();
    expect(video.style.opacity).toBe('0');
  });
});
