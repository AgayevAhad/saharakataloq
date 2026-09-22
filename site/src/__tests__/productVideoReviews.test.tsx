import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import {
  ProductVideoReviewsSection,
  SAHARA_OFFICIAL_YOUTUBE_URL,
  DEFAULT_SAHARA_VIDEO_REVIEWS,
} from '../components/ProductVideoReviewsSection';
import { lightTheme, darkTheme } from '../types/theme';

describe('ProductVideoReviewsSection Component', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(''),
        json: () => Promise.resolve({}),
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders section title and subscribe button in light theme', () => {
    render(<ProductVideoReviewsSection theme={lightTheme} />);

    expect(screen.getByRole('heading', { level: 2, name: /Sahara-da məhsul icmalı/i })).toBeDefined();

    const subscribeLink = screen.getByRole('link', { name: /Kanalımıza abunə olun/i });
    expect(subscribeLink).toBeDefined();
    expect(subscribeLink.getAttribute('href')).toBe(SAHARA_OFFICIAL_YOUTUBE_URL);
    expect(subscribeLink.getAttribute('target')).toBe('_blank');
    expect(subscribeLink.getAttribute('rel')).toContain('noopener');
  });

  it('renders simple video units with title directly below the video and zero box wrappers or extra metadata', () => {
    const { container } = render(<ProductVideoReviewsSection theme={darkTheme} />);

    // Check that default reviews from Sahara channel are rendered
    expect(screen.getByText(/Lotus Soyuducu – Mətbəxində təravətin ünvanı!/i)).toBeDefined();
    expect(screen.getByText(/Lotus qaz sobası/i)).toBeDefined();
    expect(screen.getByText(/Artel VCC 0220 Blue Tozsoranı/i)).toBeDefined();

    // Verify video media wrapper has ONLY the play button and NO text overlays on the image
    const mediaWrappers = container.querySelectorAll('.video-review-media-wrapper');
    expect(mediaWrappers.length).toBe(DEFAULT_SAHARA_VIDEO_REVIEWS.length);
    mediaWrappers.forEach((wrapper) => {
      expect(wrapper.querySelector('.video-review-play-btn')).not.toBeNull();
      expect(wrapper.textContent?.trim()).toBe('');
    });
  });

  it('does NOT autoplay videos on initial render (no iframe rendered by default)', () => {
    const { container } = render(<ProductVideoReviewsSection theme={lightTheme} />);

    // Verification: Zero iframe elements exist initially (zero autoplay)
    const iframes = container.querySelectorAll('iframe');
    expect(iframes.length).toBe(0);
  });

  it('mounts embedded YouTube player when a video item is clicked, and toggles back', () => {
    const { container } = render(<ProductVideoReviewsSection theme={lightTheme} />);

    // Find the first video title / media wrapper
    const firstMedia = container.querySelector('.video-review-media-wrapper');
    expect(firstMedia).not.toBeNull();

    // Click to play
    fireEvent.click(firstMedia!);

    // Now an iframe must be mounted for the active video
    const iframes = container.querySelectorAll('iframe');
    expect(iframes.length).toBe(1);
    expect(iframes[0].getAttribute('src')).toContain('f4gaecGGKNE');
    expect(iframes[0].getAttribute('src')).toContain('autoplay=1');

    // Click the title to toggle back
    const firstTitle = screen.getByText(/Lotus Soyuducu – Mətbəxində təravətin ünvanı!/i);
    fireEvent.click(firstTitle);
    expect(container.querySelectorAll('iframe').length).toBe(0);
  });

  it('supports navigation scroll arrows for browsing videos', () => {
    render(<ProductVideoReviewsSection theme={lightTheme} />);

    const prevBtn = screen.getByRole('button', { name: /Əvvəlki videolar/i });
    const nextBtn = screen.getByRole('button', { name: /Növbəti videolar/i });

    expect(prevBtn).toBeDefined();
    expect(nextBtn).toBeDefined();

    // Test clicking navigation buttons without throwing errors
    fireEvent.click(nextBtn);
    fireEvent.click(prevBtn);
  });
});
