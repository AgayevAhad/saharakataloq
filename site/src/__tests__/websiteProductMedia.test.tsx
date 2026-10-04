import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WebsiteProductMedia } from '../components/site/product-media/WebsiteProductMedia';
import {
  ProductTone,
  selectWebsiteProductImage,
  WebsiteProductImageMetadata,
} from '../components/site/product-media/websiteProductImageManifest';

const metadata = (
  tone: ProductTone = 'dark',
  reviewStatus: WebsiteProductImageMetadata['reviewStatus'] = 'approved'
): WebsiteProductImageMetadata => ({
  productId: 'test-product',
  modelCode: 'TEST-1',
  backgroundRemoved: true,
  productTone: tone,
  processingVersion: 1,
  model: 'test-segmenter',
  sourceImage: '/original.jpg',
  transparentImage: '/transparent.webp',
  originalPreserved: true,
  processingSucceeded: true,
  reviewStatus,
});

describe('WebsiteProductMedia', () => {
  it('selects an approved transparent variant only when enabled', () => {
    expect(
      selectWebsiteProductImage({
        originalSrc: '/original.jpg',
        metadata: metadata(),
        enabled: true,
      }).src
    ).toBe('/transparent.webp');
    expect(
      selectWebsiteProductImage({
        originalSrc: '/original.jpg',
        metadata: metadata(),
        enabled: false,
      }).src
    ).toBe('/original.jpg');
  });

  it('keeps unreviewed test output out of normal rendering', () => {
    const pending = metadata('medium', 'needs_review');
    expect(
      selectWebsiteProductImage({
        originalSrc: '/original.jpg',
        metadata: pending,
        enabled: true,
      }).usesEnhancedImage
    ).toBe(false);
    expect(
      selectWebsiteProductImage({
        originalSrc: '/original.jpg',
        metadata: pending,
        enabled: true,
        allowUnreviewed: true,
      }).usesEnhancedImage
    ).toBe(true);
  });

  it('falls back to the untouched original when the transparent image fails', () => {
    const { container } = render(
      <WebsiteProductMedia
        originalSrc="/original.jpg"
        alt="Test product"
        metadata={metadata()}
        enabled
      />
    );
    const image = screen.getByAltText('Test product');
    expect(image.getAttribute('src')).toBe('/transparent.webp');
    fireEvent.error(image);
    expect(screen.getByAltText('Test product').getAttribute('src')).toBe('/original.jpg');
    expect(container.querySelector('[data-fallback-to-original="true"]')).toBeTruthy();
  });

  it.each<ProductTone>(['light', 'medium', 'dark'])(
    'applies the %s foreground tone class',
    (tone) => {
      const { container } = render(
        <WebsiteProductMedia
          originalSrc="/original.jpg"
          alt={`${tone} product`}
          metadata={metadata(tone)}
          enabled
          themeMode="dark"
        />
      );
      expect(container.querySelector(`[data-product-tone="${tone}"]`)).toBeTruthy();
      expect(container.querySelector('.site-product-media--theme-dark')).toBeTruthy();
    }
  );

  it('renders a branded empty state when no source exists', () => {
    render(<WebsiteProductMedia originalSrc="" alt="Missing product" enabled />);
    expect(screen.getByText('Şəkil mövcud deyil')).toBeTruthy();
  });
});
