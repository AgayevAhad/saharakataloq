// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createCatalogDatabase } from '../../backend/catalogDatabase.mjs';
import { isProductModified } from '../components/CatalogAdmin';
import { SnapshotManager } from '../components/SnapshotManager';
import { catalogApi } from '../services/catalogApi';
import { lightTheme } from '../types/theme';
import { Product } from '../types/product';

describe('Snapshots, Rollback & Change Detection Suite', () => {
  it('SQLite Database creates, lists, restores, and deletes snapshots with automated safety backup', () => {
    const db = createCatalogDatabase(':memory:');
    
    // Seed initial product
    db.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', active: true }],
      categories: [{ id: 'cooktop', name: 'Bişirmə Panelləri', slug: 'cooktop', active: true }],
      products: [
        {
          id: 'p-1',
          code: 'AR-100',
          title: 'İlkin Model',
          category: 'cooktop',
          brandId: 'ardo',
          price: 500,
          status: 'published',
        },
      ],
      settings: {} as any,
      countries: [],
      articles: [],
    });

    const catalog = db.getCatalog();
    expect(catalog.products.length).toBe(1);

    // 1. Create a snapshot
    const snap1 = db.createSnapshot({ name: 'İlkin Ehtiyat Nüsxə', createdBy: 'admin' });
    expect(snap1.id).toBeDefined();
    expect(snap1.name).toBe('İlkin Ehtiyat Nüsxə');

    // 2. Modify catalog in DB
    const modifiedCatalog = {
      ...catalog,
      products: catalog.products.map((p: any, idx: number) =>
        idx === 0 ? { ...p, title: 'MODIFIED TITLE FOR TEST', price: 9999 } : p
      ),
    };
    db.saveCatalog(modifiedCatalog);
    const updated = db.getCatalog();
    expect(updated.products[0].title).toBe('MODIFIED TITLE FOR TEST');
    expect(updated.products[0].price).toBe(9999);

    // 3. List snapshots
    const list = db.getSnapshots();
    expect(list.snapshots.length).toBeGreaterThanOrEqual(1);
    expect(list.snapshots[0].name).toBe('İlkin Ehtiyat Nüsxə');

    // 4. Restore snapshot
    const restored = db.restoreSnapshot(snap1.id);
    expect(restored.products[0].title).not.toBe('MODIFIED TITLE FOR TEST');

    // Verify a safety snapshot was created automatically prior to restore
    const listAfterRestore = db.getSnapshots();
    expect(listAfterRestore.snapshots.length).toBeGreaterThanOrEqual(2);
    expect(listAfterRestore.snapshots.some((s: any) => s.name.includes('Bərpadan əvvəlki'))).toBe(true);

    // 5. Delete snapshot
    db.deleteSnapshot(snap1.id);
    const listAfterDelete = db.getSnapshots();
    expect(listAfterDelete.snapshots.find((s: any) => s.id === snap1.id)).toBeUndefined();

    db.close();
  });

  it('isProductModified accurately detects changes to title, price, image, crop/position, and specs', () => {
    const origProduct: Product = {
      id: 'test-1',
      code: 'ARDO-100',
      title: 'Original Title',
      category: 'cooktop',
      categoryName: 'Bişirmə Panelləri',
      brandId: 'ardo',
      image: '/media/products/ardo-1.jpg',
      imagePosition: 'center',
      imageFit: 'contain',
      price: 500,
      oldPrice: 600,
      currency: '₼',
      stockStatus: 'in_stock',
      status: 'published',
      shortDesc: 'Qısa təsvir',
      highlights: ['İtalyan texnologiyası'],
      specs: [{ id: 's1', name: 'Göz sayı', value: '4', group: 'Əsas' }],
      media: [{ id: 'm1', type: 'image', url: '/media/products/ardo-1.jpg', objectPosition: 'center', fitMode: 'contain' }],
    };

    // Unchanged product
    expect(isProductModified({ ...origProduct }, origProduct)).toBe(false);

    // Title modified
    expect(isProductModified({ ...origProduct, title: 'New Title' }, origProduct)).toBe(true);

    // Price modified
    expect(isProductModified({ ...origProduct, price: 550 }, origProduct)).toBe(true);

    // Image position (crop) modified
    expect(isProductModified({ ...origProduct, imagePosition: '50% 20%' }, origProduct)).toBe(true);

    // Media array crop/position modified
    expect(
      isProductModified(
        {
          ...origProduct,
          media: [{ id: 'm1', type: 'image', url: '/media/products/ardo-1.jpg', objectPosition: '20% 80%', fitMode: 'cover' }],
        },
        origProduct
      )
    ).toBe(true);

    // Specs modified
    expect(
      isProductModified(
        {
          ...origProduct,
          specs: [{ id: 's1', name: 'Göz sayı', value: '5', group: 'Əsas' }],
        },
        origProduct
      )
    ).toBe(true);

    // New product without original
    expect(isProductModified(origProduct, undefined)).toBe(true);
  });

  it('SnapshotManager renders snapshot list, handles manual snapshot creation and rollback trigger', async () => {
    const mockSnapshots = [
      {
        id: 'snap-123',
        name: 'Şəkillər kəsildikdən sonra',
        productCount: 420,
        createdBy: 'admin',
        createdAt: '2026-09-01T12:00:00.000Z',
      },
    ];

    const getSnapshotsSpy = vi.spyOn(catalogApi, 'getSnapshots').mockResolvedValue({
      snapshots: mockSnapshots,
      total: 1,
    });
    const createSnapshotSpy = vi.spyOn(catalogApi, 'createSnapshot').mockResolvedValue({
      ok: true,
      snapshot: mockSnapshots[0],
    });
    const restoreSnapshotSpy = vi.spyOn(catalogApi, 'restoreSnapshot').mockResolvedValue({
      ok: true,
      catalog: {
        brands: [],
        categories: [],
        products: [],
        settings: {} as any,
        countries: [],
        articles: [],
      },
    });

    const showToast = vi.fn();
    const onRestore = vi.fn();

    render(
      <SnapshotManager
        theme={lightTheme}
        csrfToken="test-csrf"
        showToast={showToast}
        onRestore={onRestore}
      />
    );

    // Verify snapshot table loads
    await waitFor(() => {
      expect(screen.getByText('Şəkillər kəsildikdən sonra')).toBeDefined();
      expect(screen.getByText('420 məhsul')).toBeDefined();
    });

    // Open create snapshot modal
    const createBtn = screen.getByText('Yeni Nüsxə Saxla (Snapshot)');
    fireEvent.click(createBtn);

    expect(screen.getByText('Yeni Ehtiyat Nüsxə Saxla')).toBeDefined();
    const saveBtn = screen.getByText('Nüsxəni Saxla');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(createSnapshotSpy).toHaveBeenCalled();
    });

    // Trigger restore modal
    const restoreBtn = screen.getByText('Bu Versiyaya Qayıt');
    fireEvent.click(restoreBtn);

    expect(screen.getByText('Əvvəlki Versiyaya Qayıdış (Rollback)')).toBeDefined();
    const confirmRestoreBtn = screen.getByText('Bəli, Bu Versiyaya Qayıt');
    fireEvent.click(confirmRestoreBtn);

    await waitFor(() => {
      expect(restoreSnapshotSpy).toHaveBeenCalledWith('snap-123', 'test-csrf');
      expect(onRestore).toHaveBeenCalled();
    });

    getSnapshotsSpy.mockRestore();
    createSnapshotSpy.mockRestore();
    restoreSnapshotSpy.mockRestore();
  });
});
