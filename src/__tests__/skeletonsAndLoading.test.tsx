// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import {
  SkeletonBox,
  ProductCardSkeleton,
  ProductGridSkeleton,
  BrandShowcaseSkeleton,
  BannerHeroSkeleton,
  SmartSearchSkeleton,
} from '../components/Skeletons';
import { lightTheme, darkTheme } from '../types/theme';

afterEach(() => {
  cleanup();
});

describe('Skeleton Loading & Shimmer Animation Suite', () => {
  it('SkeletonBox renders with custom width, height, and border radius', () => {
    const { container } = render(
      <SkeletonBox width="120px" height="24px" borderRadius="10px" className="test-skel" />
    );

    const box = container.querySelector('.skeleton-box.test-skel') as HTMLDivElement;
    expect(box).toBeTruthy();
    expect(box.style.width).toBe('120px');
    expect(box.style.height).toBe('24px');
    expect(box.style.borderRadius).toBe('10px');
  });

  it('ProductCardSkeleton renders accessible placeholder card with aria-busy and skeleton classes', () => {
    const { container } = render(<ProductCardSkeleton theme={lightTheme} />);

    const card = screen.getByLabelText('Məhsul yüklənir...');
    expect(card).toBeTruthy();
    expect(card.getAttribute('aria-busy')).toBe('true');
    expect(card.classList.contains('skeleton-card')).toBe(true);

    // Verify media box and footer placeholders exist
    expect(container.querySelector('.skeleton-media-box')).toBeTruthy();
    expect(container.querySelector('.skeleton-card-body')).toBeTruthy();
    expect(container.querySelector('.skeleton-footer')).toBeTruthy();
  });

  it('ProductGridSkeleton renders the specified count of skeleton cards', () => {
    const { container } = render(<ProductGridSkeleton theme={lightTheme} count={6} />);

    const cards = container.querySelectorAll('.skeleton-card');
    expect(cards.length).toBe(6);
  });

  it('BrandShowcaseSkeleton and BannerHeroSkeleton render correctly in light and dark modes', () => {
    const { container: lightContainer } = render(
      <div>
        <BrandShowcaseSkeleton theme={lightTheme} />
        <BannerHeroSkeleton theme={lightTheme} />
      </div>
    );

    expect(lightContainer.querySelector('.brand-showcase')).toBeTruthy();
    expect(lightContainer.querySelector('.skeleton-hero-card')).toBeTruthy();
    expect(lightContainer.querySelectorAll('.skeleton-brand-card').length).toBe(2);

    cleanup();

    const { container: darkContainer } = render(
      <div>
        <BrandShowcaseSkeleton theme={darkTheme} />
        <BannerHeroSkeleton theme={darkTheme} />
      </div>
    );

    expect(darkContainer.querySelector('.brand-showcase')).toBeTruthy();
    expect(darkContainer.querySelector('.skeleton-hero-card')).toBeTruthy();
  });

  it('SmartSearchSkeleton renders search suggestions and products placeholders', () => {
    const { container } = render(<SmartSearchSkeleton theme={lightTheme} />);

    expect(container.querySelector('.skeleton-search-grid')).toBeTruthy();
    expect(container.querySelector('.smart-search-left-col')).toBeTruthy();
    expect(container.querySelector('.smart-search-right-col')).toBeTruthy();
    expect(container.querySelectorAll('.smart-search-product-card').length).toBe(2);
  });
});
