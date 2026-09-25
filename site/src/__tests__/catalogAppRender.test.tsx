import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CatalogApp } from '../apps/CatalogApp';

// Mock catalogApi
vi.mock('../services/catalogApi', () => ({
  catalogApi: {
    getAdminSessionStatus: vi.fn().mockResolvedValue({ authenticated: false }),
    getAdminData: vi.fn().mockResolvedValue(null),
    getCatalog: vi.fn().mockResolvedValue({
      categories: [{ id: 'refrigerators', name: 'Soyuducular', slug: 'soyuducular', icon: 'Refrigerator' }],
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', active: true }],
      products: [
        {
          id: 'ardo-1',
          code: 'ARDO-100',
          title: 'ARDO Test Soyuducu',
          category: 'refrigerators',
          brandId: 'ardo',
          price: 1500,
          status: 'published',
          images: ['/media/ardo.jpg'],
          specs: [],
        },
      ],
      settings: {
        companyName: 'Sahara Electronics',
        catalogActive: true,
        siteActive: true,
        whatsappNumber: '+994501234567',
        phoneNumber: '+994121234567',
      },
    }),
    track: vi.fn(),
  },
}));

describe('CatalogApp Component Integration', () => {
  it('renders normal catalog storefront when catalogActive is true', async () => {
    const initialData = {
      catalog: {
        categories: [{ id: 'refrigerators', name: 'Soyuducular', slug: 'soyuducular', icon: 'Refrigerator' }],
        brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', active: true }],
        products: [
          {
            id: 'ardo-1',
            code: 'ARDO-100',
            title: 'ARDO Test Soyuducu',
            category: 'refrigerators',
            brandId: 'ardo',
            price: 1500,
            status: 'published',
            images: ['/media/ardo.jpg'],
            specs: [],
          },
        ],
        settings: {
          companyName: 'Sahara Electronics',
          catalogActive: true,
          whatsappNumber: '+994501234567',
          phoneNumber: '+994121234567',
        },
      },
    };

    const { container } = render(<CatalogApp initialData={initialData} />);
    expect(container.querySelector('.catalog-shell')).toBeTruthy();
  });

  it('renders maintenance screen without crashing when catalogActive is false', async () => {
    const initialData = {
      catalog: {
        categories: [],
        brands: [],
        products: [],
        settings: {
          companyName: 'Sahara Electronics',
          catalogActive: false,
          maintenanceMessage: 'Kataloqda profilaktik təmir gedir.',
          whatsappNumber: '+994501234567',
          phoneNumber: '+994121234567',
        },
      },
    };

    const { container } = render(<CatalogApp initialData={initialData} />);
    expect(container.querySelector('.maintenance-screen-wrap')).toBeTruthy();
    expect(screen.getByText('Tezliklə Xidmətinizdəyik')).toBeDefined();
    expect(screen.getByText('Kataloqda profilaktik təmir gedir.')).toBeDefined();
    expect(screen.getByText('WhatsApp ilə Əlaqə')).toBeDefined();
  });
});
