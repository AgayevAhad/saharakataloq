import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';
import { ProductRepository } from '../backend/productRepository.mjs';

describe('product image metadata database round-trip', () => {
  const tempDirectories: string[] = [];

  afterEach(() => {
    for (const directory of tempDirectories.splice(0)) {
      if (existsSync(directory)) rmSync(directory, { recursive: true, force: true });
    }
  });

  it('preserves crop, original media metadata and edited product fields after update and reopen', () => {
    const directory = mkdtempSync(join(tmpdir(), 'sahara-product-roundtrip-'));
    tempDirectories.push(directory);
    const databasePath = join(directory, 'catalog.sqlite');
    const catalogDatabase = createCatalogDatabase(databasePath);

    catalogDatabase.saveCatalog({
      brands: [
        {
          id: 'ardo',
          name: 'ARDO',
          slug: 'ardo',
          originCountry: 'İtaliya',
          manufacturingCountries: ['İtaliya'],
          active: true,
        },
      ],
      categories: [
        {
          id: 'oven',
          name: 'Sobalar',
          slug: 'sobalar',
          active: true,
          sortOrder: 1,
        },
      ],
      products: [
        {
          id: 'product-roundtrip',
          code: 'ARDO-ROUNDTRIP',
          title: 'Round-trip soba',
          brandId: 'ardo',
          category: 'oven',
          categoryName: 'Sobalar',
          image: '/uploads/mseed123-0123456789abcdef.jpg',
          originalImage: '/uploads/mseed123-0123456789abcdef.jpg',
          cropRect: { x: 0.1, y: 0.12, w: 0.7, h: 0.68 },
          imagePosition: 'center',
          imageFit: 'cover',
          shortDesc: 'İlkin qısa mətn',
          description: 'İlkin tam təsvir',
          manufacturingCountry: 'İtaliya',
          status: 'published',
          price: 1299,
          oldPrice: 1499,
          currency: '₼',
          stockStatus: 'in_stock',
          isFeatured: true,
          isNew: true,
          badgeText: 'Yeni',
          badgeColor: 'green',
          highlights: ['Sürətli isitmə'],
          specs: [
            {
              id: 'spec-power',
              name: 'Güc',
              value: '2800 W',
              description: 'Maksimum güc',
              group: 'Əsas',
            },
          ],
          media: [
            {
              id: 'media-primary',
              type: 'image',
              url: '/uploads/mseed123-0123456789abcdef.jpg',
              originalName: 'ARDO-ROUNDTRIP-front.jpg',
              originalUrl: '/uploads/mseed123-0123456789abcdef.jpg',
              alt: 'Ön görünüş',
              objectPosition: 'center',
              fitMode: 'cover',
              cropRect: { x: 0.1, y: 0.12, w: 0.7, h: 0.68 },
            },
            {
              id: 'media-secondary',
              type: 'image',
              url: '/uploads/mseed456-fedcba9876543210.png',
              originalName: 'ARDO-ROUNDTRIP-side.png',
              originalUrl: '/uploads/mseed456-fedcba9876543210.png',
              alt: 'Yan görünüş',
              objectPosition: 'top',
              fitMode: 'contain',
            },
          ],
        },
      ],
    });

    const repository = new ProductRepository(catalogDatabase.db);
    const initial = repository.getProductById('product-roundtrip');
    if (!initial) throw new Error('Seeded product was not found');
    expect(initial.product.media[0]).toMatchObject({
      originalName: 'ARDO-ROUNDTRIP-front.jpg',
      originalUrl: '/uploads/mseed123-0123456789abcdef.jpg',
      cropRect: { x: 0.1, y: 0.12, w: 0.7, h: 0.68 },
    });

    const updatedCrop = { x: 0.22, y: 0.08, w: 0.62, h: 0.75 };
    const updated = repository.updateProduct(
      'product-roundtrip',
      {
        ...initial.product,
        image: '/uploads/mseed456-fedcba9876543210.png',
        originalImage: '/uploads/mseed456-fedcba9876543210.png',
        cropRect: updatedCrop,
        imagePosition: 'top',
        imageFit: 'cover',
        shortDesc: 'Redaktə olunmuş qısa mətn',
        description: 'Redaktə olunmuş tam təsvir',
        manufacturingCountry: 'Türkiyə',
        price: 1199,
        oldPrice: 1399,
        stockStatus: 'preorder',
        badgeText: 'Kampaniya',
        badgeColor: 'amber',
        highlights: ['Sürətli isitmə', 'Uşaq kilidi'],
        specs: [
          {
            id: 'spec-power',
            name: 'Güc',
            value: '3000 W',
            description: 'Yenilənmiş maksimum güc',
            group: 'Əsas',
          },
        ],
        media: [
          {
            ...initial.product.media[1],
            cropRect: updatedCrop,
            objectPosition: 'top',
            fitMode: 'cover',
          },
          initial.product.media[0],
        ],
      },
      'round-trip-test',
      initial.etag
    );

    expect(updated.product.description).toBe('Redaktə olunmuş tam təsvir');
    expect(updated.product.media[0]).toMatchObject({
      id: 'media-secondary',
      originalName: 'ARDO-ROUNDTRIP-side.png',
      cropRect: updatedCrop,
    });
    catalogDatabase.close();

    const reopened = createCatalogDatabase(databasePath);
    const persisted = reopened
      .getAdminData()
      .products.find((product) => product.id === 'product-roundtrip');
    expect(persisted).toMatchObject({
      image: '/uploads/mseed456-fedcba9876543210.png',
      originalImage: '/uploads/mseed456-fedcba9876543210.png',
      cropRect: updatedCrop,
      imagePosition: 'top',
      imageFit: 'cover',
      shortDesc: 'Redaktə olunmuş qısa mətn',
      description: 'Redaktə olunmuş tam təsvir',
      manufacturingCountry: 'Türkiyə',
      price: 1199,
      oldPrice: 1399,
      stockStatus: 'preorder',
      badgeText: 'Kampaniya',
      badgeColor: 'amber',
      highlights: ['Sürətli isitmə', 'Uşaq kilidi'],
    });
    expect(persisted?.specs).toEqual([
      expect.objectContaining({
        id: 'spec-power',
        value: '3000 W',
        description: 'Yenilənmiş maksimum güc',
      }),
    ]);
    expect(persisted?.media).toEqual([
      expect.objectContaining({
        id: 'media-secondary',
        originalName: 'ARDO-ROUNDTRIP-side.png',
        originalUrl: '/uploads/mseed456-fedcba9876543210.png',
        cropRect: updatedCrop,
      }),
      expect.objectContaining({
        id: 'media-primary',
        originalName: 'ARDO-ROUNDTRIP-front.jpg',
        cropRect: { x: 0.1, y: 0.12, w: 0.7, h: 0.68 },
      }),
    ]);
    reopened.close();
  });
});
