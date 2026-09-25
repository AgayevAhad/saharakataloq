// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AdminShell } from '../components/admin/AdminShell';
import { DEFAULT_CATALOG } from '../data/catalog';
import { lightTheme } from '../types/theme';

afterEach(cleanup);

const mockAdminPayload = {
  ...DEFAULT_CATALOG,
  analytics: {
    catalogViews: 10,
    productViews: {},
    contactActions: { whatsapp: 2, call: 1 },
    contactActionsByProduct: {},
  },
  csrfToken: 'mock-csrf-token',
};

describe('Admin Panel Mode Separation (Site CMS vs Catalog PIM)', () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onPublish = vi.fn().mockResolvedValue(undefined);
  const onUpload = vi.fn().mockResolvedValue({ id: 'm1', type: 'image', url: '/test.jpg' });
  const onLogout = vi.fn().mockResolvedValue(undefined);
  const showToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Site CMS mode by default with only website management tabs', () => {
    render(
      <AdminShell
        initial={mockAdminPayload}
        theme={lightTheme}
        mode="site"
        onSave={onSave}
        onPublish={onPublish}
        onUpload={onUpload}
        onLogout={onLogout}
        showToast={showToast}
      />
    );

    // Header badge & title
    expect(screen.getByText(/Rəsmi Sayt \(CMS\)/i)).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: /Rəsmi Sayt İdarəetmə Paneli/i })).toBeDefined();

    // Site tabs should be present
    expect(screen.getByRole('button', { name: /Naviqasiya \(CMS\)/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Görünüş & Mətnlər/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Əlaqə & Filiallar/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Müştəri Çatı/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Təhlükəsizlik & Şifrə/i })).toBeDefined();

    // Catalog tabs should NOT be in the sidebar navigation
    expect(screen.queryByRole('button', { name: /Məhsullar \(Modellər\)/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Brend Lenti/i })).toBeNull();

    // Live preview action
    expect(screen.getByText('Canlı Sayta Bax')).toBeDefined();
  });

  it('renders Catalog PIM mode with only product catalog management tabs', () => {
    render(
      <AdminShell
        initial={mockAdminPayload}
        theme={lightTheme}
        mode="catalog"
        onSave={onSave}
        onPublish={onPublish}
        onUpload={onUpload}
        onLogout={onLogout}
        showToast={showToast}
      />
    );

    // Header badge & title
    expect(screen.getByText(/Məhsul Kataloqu \(PIM\)/i)).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: /Məhsul Kataloqu İdarəetmə Paneli/i })).toBeDefined();

    // Catalog tabs should be present
    expect(screen.getByRole('button', { name: /Məhsullar \(Modellər\)/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Kateqoriyalar/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Brendlər/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Brend Lenti/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Texnologiyalar \(i\)/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Bərpa & Nüsxələr/i })).toBeDefined();

    // Site tabs should NOT be in the sidebar navigation
    expect(screen.queryByRole('button', { name: /Naviqasiya \(CMS\)/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Görünüş & Mətnlər/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Müştəri Çatı/i })).toBeNull();

    // Live preview action
    expect(screen.getByText('Kataloq Önbaxış')).toBeDefined();
  });

  it('smoothly switches between Site CMS and Catalog PIM via the segmented mode switcher', () => {
    render(
      <AdminShell
        initial={mockAdminPayload}
        theme={lightTheme}
        mode="site"
        onSave={onSave}
        onPublish={onPublish}
        onUpload={onUpload}
        onLogout={onLogout}
        showToast={showToast}
      />
    );

    // Initially in Site mode
    expect(screen.getByRole('heading', { level: 1, name: /Rəsmi Sayt İdarəetmə Paneli/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Naviqasiya \(CMS\)/i })).toBeDefined();

    // Switch to Catalog mode
    const catalogModeBtn = screen.getByRole('button', { name: /Kataloq \(PIM\)/i });
    fireEvent.click(catalogModeBtn);

    // Now in Catalog mode
    expect(screen.getByRole('heading', { level: 1, name: /Məhsul Kataloqu İdarəetmə Paneli/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Məhsullar \(Modellər\)/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Naviqasiya \(CMS\)/i })).toBeNull();

    // Switch back to Site mode
    const siteModeBtn = screen.getByRole('button', { name: /Sayt \(CMS\)/i });
    fireEvent.click(siteModeBtn);

    // Back in Site mode
    expect(screen.getByRole('heading', { level: 1, name: /Rəsmi Sayt İdarəetmə Paneli/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Naviqasiya \(CMS\)/i })).toBeDefined();
  });
});
