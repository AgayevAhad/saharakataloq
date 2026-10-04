import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogData, Product } from '../types/product';
import {
  enhanceWebsiteProduct,
  useWebsiteProductImageCatalog,
} from '../components/site/product-media/useWebsiteProductImageCatalog';
import { WebsiteProductImageMetadata } from '../components/site/product-media/websiteProductImageManifest';

const product: Product = {
  id: 'ardo-product',
  code: 'ARDO-1',
  title: 'ARDO product',
  category: 'oven',
  categoryName: 'Oven',
  image: '/media/products/ARDO-1.jpg',
  gallery: ['/media/products/ARDO-1.jpg', '/media/products/ARDO-1-2.jpg'],
  media: [
    {
      id: 'media-1',
      type: 'image',
      url: '/media/products/ARDO-1.jpg',
      objectPosition: 'top',
    },
    { id: 'video-1', type: 'video', url: '/media/products/ARDO-1.mp4' },
  ],
  shortDesc: '',
  specs: [],
  highlights: [],
  brandId: 'ardo',
};

const entry: WebsiteProductImageMetadata = {
  assetId: 'media-1',
  productId: product.id,
  brand: 'ARDO',
  modelCode: product.code,
  backgroundRemoved: true,
  productTone: 'dark',
  processingVersion: 1,
  model: 'birefnet-general',
  sourceImage: product.image,
  transparentImage: '/media/site-product-image-enhancement/transparent/dark/media-1.webp',
  originalPreserved: true,
  processingSucceeded: true,
  reviewStatus: 'approved',
};

const catalog: CatalogData = {
  products: [product],
  brands: [],
  categories: [],
  settings: { whatsappNumber: '', phoneNumber: '' },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('website product image catalog resolver', () => {
  it('maps only matching image fields and preserves original media metadata', () => {
    const entries = new Map([[entry.sourceImage, entry]]);
    const enhanced = enhanceWebsiteProduct(product, entries);
    expect(enhanced.image).toBe(entry.transparentImage);
    expect(enhanced.originalImage).toBe(product.image);
    expect(enhanced.gallery?.[0]).toBe(entry.transparentImage);
    expect(enhanced.gallery?.[1]).toBe(product.gallery?.[1]);
    expect(enhanced.media?.[0]).toMatchObject({
      url: entry.transparentImage,
      originalUrl: product.image,
      objectPosition: 'center',
      fitMode: 'contain',
    });
    expect(enhanced.media?.[0].cropRect).toBeUndefined();
    expect(enhanced.media?.[1]).toEqual(product.media?.[1]);
  });

  it('keeps the source catalog untouched when disabled', () => {
    const Probe = () => {
      const { catalog: resolved } = useWebsiteProductImageCatalog(catalog, { enabled: false });
      return <span>{resolved.products[0].image}</span>;
    };
    render(<Probe />);
    expect(screen.getByText(product.image)).toBeTruthy();
  });

  it('falls back to the original URL after an enhanced image error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ entries: [entry] }),
      })
    );
    const Probe = () => {
      const { catalog: resolved } = useWebsiteProductImageCatalog(catalog, { enabled: true });
      return <img src={resolved.products[0].image} alt="resolved product" />;
    };
    render(<Probe />);
    const image = screen.getByAltText('resolved product');
    await waitFor(() => expect(image.getAttribute('src')).toBe(entry.transparentImage));
    fireEvent.error(image);
    await waitFor(() => expect(image.getAttribute('src')).toBe(product.image));
  });
});
