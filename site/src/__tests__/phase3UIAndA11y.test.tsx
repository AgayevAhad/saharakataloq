// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { BrandRegistryStudio } from '../components/BrandRegistryStudio';
import { CategoryTreeManager } from '../components/CategoryTreeManager';

afterEach(cleanup);

const testTheme = {
  primary: '#dc2626',
  bgCard: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  textMuted: '#6b7280',
};

describe('Phase 3 UI & Accessibility: BrandRegistryStudio', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders brand registry header, candidate filters, and search bar', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((url: any) => {
      if (typeof url === 'string' && url.includes('/api/admin/brands')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              brands: [
                {
                  id: 'brand_ardo',
                  name: 'ARDO',
                  slug: 'ardo',
                  originCountry: 'İtaliya',
                  verificationStatus: 'legacy_unreviewed',
                  logoRightsStatus: 'unreviewed',
                  version: 1,
                  productCount: 10,
                  active: true,
                  comingSoon: false,
                },
                {
                  id: 'brand_bosch',
                  name: 'Bosch',
                  slug: 'bosch',
                  originCountry: 'Almaniya',
                  verificationStatus: 'candidate',
                  logoRightsStatus: 'unreviewed',
                  version: 1,
                  productCount: 0,
                  active: true,
                  comingSoon: false,
                },
              ],
            }),
        } as any);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as any);
    });

    render(<BrandRegistryStudio theme={testTheme} csrfToken="test_csrf_token" />);

    expect(screen.getByText(/Brend Reyestri & Hüquq Təsdiq Studiyası/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/Brend adı və ya slug ilə axtar/i)).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText('ARDO')).toBeTruthy();
      expect(screen.getByText('Bosch')).toBeTruthy();
    });
  });
});

describe('Phase 3 UI & Accessibility: CategoryTreeManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders multi-level category hierarchy tree and actions', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((url: any) => {
      if (typeof url === 'string' && url.includes('/api/admin/categories/tree')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tree: [
                {
                  id: 'cat_stoves',
                  name: 'Mətbəx Plitələri',
                  slug: 'metbex-pliteleri',
                  depth: 1,
                  path: '/metbex-pliteleri',
                  sortOrder: 1,
                  isArchived: false,
                  version: 1,
                  productCount: 5,
                  totalDescendantProducts: 8,
                  children: [
                    {
                      id: 'cat_gas_stoves',
                      name: 'Qaz Plitələri',
                      slug: 'qaz-pliteleri',
                      depth: 2,
                      path: '/metbex-pliteleri/qaz-pliteleri',
                      sortOrder: 1,
                      isArchived: false,
                      version: 1,
                      productCount: 3,
                      totalDescendantProducts: 3,
                      children: [],
                    },
                  ],
                },
              ],
            }),
        } as any);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as any);
    });

    render(<CategoryTreeManager theme={testTheme} csrfToken="test_csrf_token" />);

    expect(screen.getByText(/Çoxsəviyyəli Kateqoriya Taksonomiyası/i)).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText('Mətbəx Plitələri')).toBeTruthy();
      expect(screen.getByText('Qaz Plitələri')).toBeTruthy();
      expect(screen.getByText(/Dərinlik: 1/i)).toBeTruthy();
      expect(screen.getByText(/Dərinlik: 2/i)).toBeTruthy();
    });
  });
});
