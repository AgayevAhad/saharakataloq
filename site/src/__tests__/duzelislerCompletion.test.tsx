import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CustomerCarePage } from '../pages/CustomerCarePage';
import { CareersPage } from '../pages/CareersPage';
import { BrandsPage } from '../pages/BrandsPage';
import { Footer } from '../components/Footer';
import { resolveRouteFromPath } from '../App';
import { DEFAULT_CATALOG } from '../data/catalog';
import { lightTheme } from '../types/theme';
import {
  getPasswordRequirements,
  isStrongPassword,
  PASSWORD_REQUIREMENT_TEXT,
} from '../utils/authValidation';

afterEach(cleanup);

describe('Duzelisler.md completion', () => {
  it('requires 8 characters, a letter, an uppercase letter and a number', () => {
    expect(PASSWORD_REQUIREMENT_TEXT).toContain('8 simvol');
    expect(isStrongPassword('short1A')).toBe(false);
    expect(isStrongPassword('lowercase1')).toBe(false);
    expect(isStrongPassword('UPPERCASE')).toBe(false);
    expect(isStrongPassword('Sahara2026')).toBe(true);
    expect(getPasswordRequirements('Şifrə2026')).toEqual({
      hasMinLength: true,
      hasLetter: true,
      hasUppercase: true,
      hasNumber: true,
    });
  });

  it.each([
    ['delivery', 'Çatdırılma'],
    ['warranty', 'Zəmanət'],
    ['returns', 'Qaytarma və dəyişdirmə'],
    ['faq', 'Tez-tez verilən suallar'],
  ] as const)('renders the dedicated %s customer page', (kind, heading) => {
    render(
      <CustomerCarePage
        kind={kind}
        settings={DEFAULT_CATALOG.settings}
        theme={lightTheme}
        themeMode="light"
        onNavigate={vi.fn()}
        onWhatsApp={vi.fn()}
        onCall={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeDefined();
    expect(screen.getByText(/Birbaşa dəstək/i)).toBeDefined();
  });

  it('routes every customer footer label to its own page', () => {
    const onNavigate = vi.fn();
    render(
      <Footer settings={DEFAULT_CATALOG.settings} theme={lightTheme} onNavigate={onNavigate} />
    );

    const routes = [
      ['Çatdırılma', 'delivery'],
      ['Zəmanət', 'warranty'],
      ['Qaytarma', 'returns'],
      ['Tez-tez verilən suallar', 'faq'],
    ] as const;

    routes.forEach(([label, route]) => {
      fireEvent.click(screen.getByRole('button', { name: label }));
      expect(onNavigate).toHaveBeenCalledWith(route);
    });
  });

  it('orders mobile footer contacts as email, phones, Instagram and Facebook', () => {
    const settings = {
      ...DEFAULT_CATALOG.settings,
      email: 'info@example.az',
      phoneNumbers: ['+994 12 000 00 01', '+994 12 000 00 02'],
      instagramUsername: '@sahara',
      facebookUsername: 'Sahara',
    };
    const { container } = render(<Footer settings={settings} theme={lightTheme} />);
    const kinds = Array.from(container.querySelectorAll('[data-contact-kind]')).map((node) =>
      node.getAttribute('data-contact-kind')
    );
    expect(kinds.slice(0, 5)).toEqual(['email', 'phone', 'phone', 'instagram', 'facebook']);
  });

  it('shows an honest careers empty state instead of fabricated vacancies', () => {
    render(
      <CareersPage
        settings={DEFAULT_CATALOG.settings}
        theme={lightTheme}
        themeMode="light"
        onNavigate={vi.fn()}
      />
    );
    expect(
      screen.getByRole('heading', { level: 1, name: /Hazırda elan edilmiş vakansiya yoxdur/i })
    ).toBeDefined();
    expect(screen.queryByText(/Satış Məsləhətçisi/i)).toBeNull();
    expect(screen.queryByText(/Rəqabətli Əməkhaqqı/i)).toBeNull();
  });

  it('renders brand cards and opens a dedicated brand detail route', () => {
    const onNavigate = vi.fn();
    render(
      <BrandsPage
        brands={DEFAULT_CATALOG.brands}
        products={DEFAULT_CATALOG.products}
        theme={lightTheme}
        onNavigate={onNavigate}
      />
    );
    const detailButtons = screen.getAllByRole('button', { name: /Brend haqqında/i });
    fireEvent.click(detailButtons[0]);
    expect(onNavigate).toHaveBeenCalledWith('brand', DEFAULT_CATALOG.brands[0].id);
    expect(resolveRouteFromPath(`/brand/${DEFAULT_CATALOG.brands[0].id}`)).toEqual({
      route: 'brand',
      brand: DEFAULT_CATALOG.brands[0].id,
    });
  });
});
