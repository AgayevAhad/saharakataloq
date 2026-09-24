// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CatalogAdmin } from '../components/CatalogAdmin';
import { DEFAULT_BRANDS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS, DEFAULT_ARTICLES } from '../data/catalog';
import { lightTheme } from '../types/theme';
import { AdminPayload } from '../services/catalogApi';
import { TEST_PRODUCT } from './fixtures';

afterEach(cleanup);

const adminData = (): AdminPayload => ({
  brands: DEFAULT_BRANDS,
  categories: DEFAULT_CATEGORIES,
  products: [TEST_PRODUCT],
  articles: DEFAULT_ARTICLES,
  settings: {
    ...DEFAULT_SETTINGS,
    whatsappNumber: '',
    phoneNumber: '',
    phoneNumbers: [],
    address: 'Bakı şəhəri, Sədərək Ticarət Mərkəzi',
  },
  analytics: {
    catalogViews: 8,
    productViews: { [TEST_PRODUCT.id]: 3 },
    contactActions: { whatsapp: 4, call: 2 },
    contactActionsByProduct: { [TEST_PRODUCT.id]: { whatsapp: 4, call: 2 } },
  },
  csrfToken: 'test-csrf',
});

describe('Admin iş axınları', () => {
  it('WhatsApp, çoxsaylı zəng nömrələri və ünvan məlumatlarını qaralamaya daxil edib saxlayır', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<CatalogAdmin initial={adminData()} theme={lightTheme} onSave={onSave} onPublish={vi.fn()} onUpload={vi.fn()} onLogout={vi.fn()} showToast={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Əlaqə/ }));
    fireEvent.change(screen.getByPlaceholderText('994501234567'), { target: { value: '+994 50 111 22 33' } });
    
    // Add multiple phone numbers
    const phoneInput = screen.getByPlaceholderText('Məs: 994121234567 və ya +994 50 123 45 67');
    fireEvent.change(phoneInput, { target: { value: '+994 12 444 55 66' } });
    fireEvent.click(screen.getByRole('button', { name: /Nömrə Əlavə et/ }));

    fireEvent.change(screen.getByPlaceholderText('Bakı şəhəri, Sədərək Ticarət Mərkəzi'), { target: { value: 'Yeni Ünvan 123' } });
    fireEvent.click(screen.getByRole('button', { name: /Qaralamanı saxla/ }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0].settings).toEqual(expect.objectContaining({
      whatsappNumber: '+994 50 111 22 33',
      phoneNumbers: ['+994 12 444 55 66'],
      address: 'Yeni Ünvan 123',
    }));
    expect(screen.getByText('WhatsApp seçimi').parentElement?.textContent).toContain('4');
    expect(screen.getByText('Zəng seçimi').parentElement?.textContent).toContain('2');
  });

  it('admin paneldə yeni istehsal ölkəsi əlavə edir və silir', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<CatalogAdmin initial={adminData()} theme={lightTheme} onSave={onSave} onPublish={vi.fn()} onUpload={vi.fn()} onLogout={vi.fn()} showToast={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Əlaqə/ }));
    
    // Yeni ölkə əlavə et
    const countryInput = screen.getByPlaceholderText('Məs: Almaniya, İtaliya, Polşa...');
    fireEvent.change(countryInput, { target: { value: 'Cənubi Koreya' } });
    fireEvent.click(screen.getByRole('button', { name: /^Əlavə et$/ }));
    
    expect(screen.getByText('Cənubi Koreya')).toBeDefined();
    
    fireEvent.click(screen.getByRole('button', { name: /Qaralamanı saxla/ }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0].settings.countries).toContain('Cənubi Koreya');
  });

  it('admin paneldə texnologiyalar və i məlumatlarını əlavə edib idarə edir', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<CatalogAdmin initial={adminData()} theme={lightTheme} onSave={onSave} onPublish={vi.fn()} onUpload={vi.fn()} onLogout={vi.fn()} showToast={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Texnologiyalar/ }));
    
    expect(screen.getByText(/Texnologiyalar və "i" Məlumat Bələdçisi/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Yeni Texnologiya Əlavə Et/ }));
    
    expect(screen.getByDisplayValue('Yeni Texnologiya Başlığı')).toBeDefined();
  });

  it('Məhsullar bölməsində redaktə (Pencil) düyməsinə basdıqda ProductEditor modalı açılır', async () => {
    render(<CatalogAdmin initial={adminData()} theme={lightTheme} onSave={vi.fn()} onPublish={vi.fn()} onUpload={vi.fn()} onLogout={vi.fn()} showToast={vi.fn()} />);
    
    // Məhsullar tabına keç
    fireEvent.click(screen.getByRole('button', { name: /Məhsullar/ }));
    
    // Excel və CSV düymələrinin mövcudluğunu yoxla
    expect(screen.getByText(/Excel \(\.xlsx\) İxrac/i)).toBeDefined();
    expect(screen.getByText(/Excel \/ CSV İdxal/i)).toBeDefined();
    expect(screen.getByText(/Excel Şablonu/i)).toBeDefined();

    // Redaktə (Pencil) düyməsinə bas
    const editButtons = screen.getAllByTitle('Redaktə et');
    expect(editButtons.length).toBeGreaterThan(0);
    fireEvent.click(editButtons[0]);

    // ProductEditor modalının açılmasını yoxla
    expect(screen.getByText(/3000 redaktəsi/i)).toBeDefined();
    expect(screen.getByDisplayValue(TEST_PRODUCT.code)).toBeDefined();
    expect(screen.getByDisplayValue(TEST_PRODUCT.title)).toBeDefined();
    expect(screen.getByText('Texniki göstəricilər (Parametrlər)')).toBeDefined();

    // İmtina ilə bağla
    fireEvent.click(screen.getByRole('button', { name: 'İmtina' }));
    expect(screen.queryByText('Texniki göstəricilər (Parametrlər)')).toBeNull();
  });

  it('Sidebar aktiv tab rəngini parlaq mövzu fonu ilə təyin edir', async () => {
    render(<CatalogAdmin initial={adminData()} theme={lightTheme} onSave={vi.fn()} onPublish={vi.fn()} onUpload={vi.fn()} onLogout={vi.fn()} showToast={vi.fn()} />);
    
    const dashboardBtn = screen.getByRole('button', { name: /Statistika/ });
    expect(dashboardBtn.classList.contains('active')).toBe(true);
    expect(dashboardBtn.getAttribute('style')).toContain('color: #ffffff');

    const brandsBtn = screen.getByRole('button', { name: /Brendlər/ });
    fireEvent.click(brandsBtn);
    expect(brandsBtn.classList.contains('active')).toBe(true);
    expect(brandsBtn.getAttribute('style')).toContain('color: #ffffff');
  });
});
