import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { lightTheme } from '../types/theme';
import { AboutPage } from '../pages/AboutPage';
import { CareersPage } from '../pages/CareersPage';
import { TermsPage } from '../pages/TermsPage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { resolveRouteFromPath } from '../App';
import { DEFAULT_CATALOG } from '../data/catalog';

describe('Company and Legal Policy Pages', () => {
  const dummySettings = {
    ...DEFAULT_CATALOG.settings,
    companyName: 'Sahara Electronics',
    phoneNumber: '+994 50 123 45 67',
    whatsappNumber: '+994 50 123 45 67',
    address: 'Bakı şəhəri, Azadlıq pr. 105',
    email: 'info@sahara.az',
    hrEmail: 'hr@sahara.az',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('AboutPage', () => {
    it('renders hero title, mission, values and stats in light theme', () => {
      const handleNavigate = vi.fn();
      const handleWhatsApp = vi.fn();
      const handleCall = vi.fn();

      render(
        <AboutPage
          settings={dummySettings}
          theme={lightTheme}
          themeMode="light"
          onNavigate={handleNavigate}
          onWhatsApp={handleWhatsApp}
          onCall={handleCall}
        />
      );

      expect(screen.getByText(/SAHARA ELECTRONICS HAQQINDA/i)).toBeTruthy();
      expect(screen.getByText(/Məişət Texnikası Kataloqu və Məhsul Seçimi/i)).toBeTruthy();
      expect(screen.getByText(/Məhsul kataloqu/i)).toBeTruthy();
      expect(screen.getByText(/Əlaqə kanalları/i)).toBeTruthy();
      expect(screen.queryByText(/50,000\+/i)).toBeNull();
      expect(screen.queryByText(/15\+ İl/i)).toBeNull();
      expect(screen.getByText(/Missiyamız/i)).toBeTruthy();
      expect(screen.getByText(/Vizyonumuz/i)).toBeTruthy();
    });

    it('triggers catalog navigation and contact actions when buttons clicked', () => {
      const handleNavigate = vi.fn();
      const handleWhatsApp = vi.fn();
      const handleCall = vi.fn();

      render(
        <AboutPage
          settings={dummySettings}
          theme={lightTheme}
          themeMode="light"
          onNavigate={handleNavigate}
          onWhatsApp={handleWhatsApp}
          onCall={handleCall}
        />
      );

      const exploreBtn = screen.getByRole('button', { name: /Kataloqa Bax/i });
      fireEvent.click(exploreBtn);
      expect(handleNavigate).toHaveBeenCalledWith('catalog');

      const storesBtn = screen.getByRole('button', { name: /Mağazalarımız/i });
      fireEvent.click(storesBtn);
      expect(handleNavigate).toHaveBeenCalledWith('stores');

      const waBtn = screen.getByRole('button', { name: /WhatsApp ilə Əlaqə/i });
      fireEvent.click(waBtn);
      expect(handleWhatsApp).toHaveBeenCalled();
    });
  });

  describe('CareersPage', () => {
    it('renders an honest empty state instead of unverified job listings', () => {
      const handleNavigate = vi.fn();
      const handleWhatsApp = vi.fn();

      render(
        <CareersPage
          settings={dummySettings}
          theme={lightTheme}
          themeMode="light"
          onNavigate={handleNavigate}
          onWhatsApp={handleWhatsApp}
        />
      );

      expect(screen.getByText(/Hazırda elan edilmiş vakansiya yoxdur/i)).toBeTruthy();
      expect(screen.getByText(/Elanları necə izləmək olar/i)).toBeTruthy();
      expect(screen.queryByText(/Satış Məsləhətçisi/i)).toBeNull();
    });

    it('offers only configured official contact channels', () => {
      const handleNavigate = vi.fn();
      const handleWhatsApp = vi.fn();

      render(
        <CareersPage
          settings={dummySettings}
          theme={lightTheme}
          themeMode="light"
          onNavigate={handleNavigate}
          onWhatsApp={handleWhatsApp}
        />
      );

      expect(screen.getByRole('link', { name: /E-poçtla əlaqə/i }).getAttribute('href')).toContain(
        'info@sahara.az'
      );
      const contactButton = screen.getByRole('button', { name: /Ümumi əlaqə/i });
      fireEvent.click(contactButton);
      expect(handleWhatsApp).toHaveBeenCalled();
      expect(screen.queryByText(/Müraciətiniz qəbul edildi/i)).toBeNull();
    });
  });

  describe('TermsPage', () => {
    it('renders terms and conditions sections', () => {
      const handleNavigate = vi.fn();

      render(<TermsPage theme={lightTheme} themeMode="light" onNavigate={handleNavigate} />);

      expect(screen.getByText(/İstifadəçi Şərtləri və Qaydaları/i)).toBeTruthy();
      expect(screen.getByText(/1. Ümumi Müddəalar/i)).toBeTruthy();
      expect(
        screen.getByText(/2. Sifarişlərin Rəsmiləşdirilməsi və Qiymət Siyasəti/i)
      ).toBeTruthy();
      expect(screen.getByText(/3. Çatdırılma və Quraşdırma Şərtləri/i)).toBeTruthy();
      expect(screen.getByText(/4. Rəsmi Zəmanət və Servis Xidməti/i)).toBeTruthy();
      expect(screen.getByText(/5. Məhsulun Qaytarılması və Dəyişdirilməsi/i)).toBeTruthy();
    });

    it('navigates back to home when back button clicked', () => {
      const handleNavigate = vi.fn();

      render(<TermsPage theme={lightTheme} themeMode="light" onNavigate={handleNavigate} />);

      const homeBtns = screen.getAllByRole('button', { name: /Ana Səhifəyə qayıt/i });
      fireEvent.click(homeBtns[0]);
      expect(handleNavigate).toHaveBeenCalledWith('home');
    });
  });

  describe('PrivacyPage', () => {
    it('renders privacy policy sections and security commitments', () => {
      const handleNavigate = vi.fn();

      render(<PrivacyPage theme={lightTheme} themeMode="light" onNavigate={handleNavigate} />);

      expect(screen.getByText(/Məxfilik və Məlumat Təhlükəsizliyi Siyasəti/i)).toBeTruthy();
      expect(screen.getByText(/1. Toplanan Fərdi Məlumatlar/i)).toBeTruthy();
      expect(screen.getByText(/2. Məlumatların Saxlanması/i)).toBeTruthy();
      expect(screen.queryByText(/256-bit/i)).toBeNull();
      expect(screen.getByText(/3. Üçüncü Tərəflərlə Məlumat Paylaşımı/i)).toBeTruthy();
      expect(screen.getByText(/4. Çərəzlər \(Cookies\) Siyasəti/i)).toBeTruthy();
    });
  });

  describe('Route Resolution & Deep Links', () => {
    it('resolves primary and localized aliases for newly introduced company and policy routes', () => {
      expect(resolveRouteFromPath('/about')).toEqual({ route: 'about' });
      expect(resolveRouteFromPath('/haqqimizda')).toEqual({ route: 'about' });
      expect(resolveRouteFromPath('/careers')).toEqual({ route: 'careers' });
      expect(resolveRouteFromPath('/karyera')).toEqual({ route: 'careers' });
      expect(resolveRouteFromPath('/terms')).toEqual({ route: 'terms' });
      expect(resolveRouteFromPath('/istifade-sertleri')).toEqual({ route: 'terms' });
      expect(resolveRouteFromPath('/qaydalar')).toEqual({ route: 'terms' });
      expect(resolveRouteFromPath('/privacy')).toEqual({ route: 'privacy' });
      expect(resolveRouteFromPath('/mexfilik-siyaseti')).toEqual({ route: 'privacy' });
      expect(resolveRouteFromPath('/mexfilik')).toEqual({ route: 'privacy' });
      expect(resolveRouteFromPath('/stores')).toEqual({ route: 'stores' });
      expect(resolveRouteFromPath('/magazalar')).toEqual({ route: 'stores' });
      expect(resolveRouteFromPath('/catdirilma')).toEqual({ route: 'delivery' });
      expect(resolveRouteFromPath('/zemanet')).toEqual({ route: 'warranty' });
      expect(resolveRouteFromPath('/qaytarma')).toEqual({ route: 'returns' });
      expect(resolveRouteFromPath('/faq')).toEqual({ route: 'faq' });
      expect(resolveRouteFromPath('/elaqe')).toEqual({ route: 'support' });
    });
  });
});
