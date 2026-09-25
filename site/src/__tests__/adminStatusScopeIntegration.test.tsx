import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminShell } from '../components/admin/AdminShell';
import { catalogApi } from '../services/catalogApi';
import { lightTheme } from '../types/theme';
import { DEFAULT_BRANDS, DEFAULT_CATEGORIES, DEFAULT_ARTICLES, DEFAULT_SETTINGS } from '../data/catalog';

const mockAdminData = (overrides = {}) => ({
  brands: DEFAULT_BRANDS,
  categories: DEFAULT_CATEGORIES,
  products: [
    {
      id: 'p-1',
      code: 'ARDO-001',
      title: 'ARDO Paltaryuyan',
      brandId: 'ardo',
      category: 'cat-1',
      status: 'active',
      price: 1000,
    },
    {
      id: 'p-2',
      code: 'ARTEL-001',
      title: 'Artel Televizor',
      brandId: 'artel',
      category: 'cat-2',
      status: 'draft',
      price: 600,
    },
  ],
  countries: ['İtaliya', 'Özbəkistan'],
  articles: DEFAULT_ARTICLES,
  settings: {
    ...DEFAULT_SETTINGS,
    siteActive: true,
    siteMaintenanceMessage: 'Sayt yenilənir',
    catalogActive: true,
    maintenanceMessage: 'Kataloq yenilənir',
    ...overrides,
  },
  analytics: {
    totalViews: 100,
    uniqueVisitors: 50,
    productViews: {},
    categoryViews: {},
    brandViews: {},
    popularProducts: [],
    recentEvents: [],
  },
  csrfToken: 'test-csrf-token',
});

describe('AdminShell Site CMS vs Catalog PIM Status Toggle Scope Integration Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly toggles status for Kataloq PIM when activeMode is catalog', async () => {
    const toggleSpy = vi.spyOn(catalogApi, 'toggleCatalogStatus').mockResolvedValue({
      ok: true,
      active: false,
      message: 'Kataloqda profilaktik baxım aparılır',
      scope: 'catalog',
    });

    render(
      <AdminShell
        initial={mockAdminData()}
        mode="catalog"
        theme={lightTheme}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onUpload={vi.fn()}
        onLogout={vi.fn()}
        showToast={vi.fn()}
      />
    );

    // Verify header status button says 'Kataloq: Yayımda'
    const statusBtn = screen.getByTitle('Kataloqun fəaliyyət statusunu dəyiş');
    expect(statusBtn.textContent).toContain('Kataloq: Yayımda');

    // Click status button
    fireEvent.click(statusBtn);

    // Modal opens with Kataloq title
    expect(screen.getByText('Kataloq Fəaliyyət Statusu')).toBeTruthy();

    // Click paused card
    fireEvent.click(screen.getByText('🟡 Dayandırılıb (Profilaktika)'));

    await waitFor(() => {
      expect(toggleSpy).toHaveBeenCalledWith(
        false,
        expect.any(String),
        'test-csrf-token',
        'catalog'
      );
    });
  });

  it('correctly toggles status for Sayt CMS when activeMode is site', async () => {
    const toggleSpy = vi.spyOn(catalogApi, 'toggleCatalogStatus').mockResolvedValue({
      ok: true,
      active: false,
      message: 'Saytda profilaktik baxım aparılır',
      scope: 'site',
    });

    render(
      <AdminShell
        initial={mockAdminData()}
        mode="site"
        theme={lightTheme}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onUpload={vi.fn()}
        onLogout={vi.fn()}
        showToast={vi.fn()}
      />
    );

    // Verify header status button says 'Sayt: Aktiv'
    const statusBtn = screen.getByTitle('Saytın fəaliyyət statusunu dəyiş');
    expect(statusBtn.textContent).toContain('Sayt: Aktiv');

    // Click status button
    fireEvent.click(statusBtn);

    // Modal opens with Sayt title
    expect(screen.getByText('Sayt Fəaliyyət Statusu')).toBeTruthy();

    // Click paused card
    fireEvent.click(screen.getByText('🟡 Dayandırılıb (Profilaktika)'));

    await waitFor(() => {
      expect(toggleSpy).toHaveBeenCalledWith(
        false,
        expect.any(String),
        'test-csrf-token',
        'site'
      );
    });
  });
});
