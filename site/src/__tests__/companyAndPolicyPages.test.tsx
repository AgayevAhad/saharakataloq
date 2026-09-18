import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { lightTheme, darkTheme } from '../types/theme';
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
      expect(screen.getByText(/Müasir Məişət Texnikası və İtaliya Keyfiyyəti/i)).toBeTruthy();
      expect(screen.getByText(/15\+ İl/i)).toBeTruthy();
      expect(screen.getByText(/İllik Təcrübə/i)).toBeTruthy();
      expect(screen.getByText(/50,000\+/i)).toBeTruthy();
      expect(screen.getByText(/Məmnun Müştəri/i)).toBeTruthy();
      expect(screen.getByText(/100%/i)).toBeTruthy();
      expect(screen.getAllByText(/Rəsmi Zəmanət/i).length).toBeGreaterThan(0);
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
    it('renders company culture pillars and job listings', () => {
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

      expect(screen.getByText(/SAHARA ELECTRONICS KOMANDASINA QOŞULUN/i)).toBeTruthy();
      expect(screen.getByText(/Gələcəyinizi Peşəkar Komanda ilə Birlikdə Qurun/i)).toBeTruthy();
      expect(screen.getByText(/Niyə Sahara Electronics Komandası\?/i)).toBeTruthy();
      expect(screen.getByText(/Məişət Texnikası üzrə Satış Məsləhətçisi/i)).toBeTruthy();
      expect(screen.getByText(/Texniki Servis və Quraşdırma Mütəxəssisi/i)).toBeTruthy();
      expect(screen.getByText(/Rəqəmsal Marketinq və Kontent Meneceri/i)).toBeTruthy();
    });

    it('submits job application form successfully', () => {
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

      expect(screen.getByText(/Karyera Müraciət Formu/i)).toBeTruthy();

      const nameInput = screen.getByPlaceholderText(/Məs: Rəşad Məmmədov/i);
      const phoneInput = screen.getByPlaceholderText(/\+994 50 123 45 67/i);

      fireEvent.change(nameInput, { target: { value: 'Əli Məmmədov' } });
      fireEvent.change(phoneInput, { target: { value: '+994501112233' } });

      const submitBtn = screen.getByRole('button', { name: /Müraciəti Göndər/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/Müraciətiniz qəbul edildi!/i)).toBeTruthy();
    });
  });

  describe('TermsPage', () => {
    it('renders terms and conditions sections', () => {
      const handleNavigate = vi.fn();

      render(
        <TermsPage
          theme={lightTheme}
          themeMode="light"
          onNavigate={handleNavigate}
        />
      );

      expect(screen.getByText(/İstifadəçi Şərtləri və Qaydaları/i)).toBeTruthy();
      expect(screen.getByText(/1. Ümumi Müddəalar/i)).toBeTruthy();
      expect(screen.getByText(/2. Sifarişlərin Rəsmiləşdirilməsi və Qiymət Siyasəti/i)).toBeTruthy();
      expect(screen.getByText(/3. Çatdırılma və Quraşdırma Şərtləri/i)).toBeTruthy();
      expect(screen.getByText(/4. Rəsmi Zəmanət və Servis Xidməti/i)).toBeTruthy();
      expect(screen.getByText(/5. Məhsulun Qaytarılması və Dəyişdirilməsi/i)).toBeTruthy();
    });

    it('navigates back to home when back button clicked', () => {
      const handleNavigate = vi.fn();

      render(
        <TermsPage
          theme={lightTheme}
          themeMode="light"
          onNavigate={handleNavigate}
        />
      );

      const homeBtns = screen.getAllByRole('button', { name: /Ana Səhifəyə qayıt/i });
      fireEvent.click(homeBtns[0]);
      expect(handleNavigate).toHaveBeenCalledWith('home');
    });
  });

  describe('PrivacyPage', () => {
    it('renders privacy policy sections and security commitments', () => {
      const handleNavigate = vi.fn();

      render(
        <PrivacyPage
          theme={lightTheme}
          themeMode="light"
          onNavigate={handleNavigate}
        />
      );

      expect(screen.getByText(/Məxfilik və Məlumat Təhlükəsizliyi Siyasəti/i)).toBeTruthy();
      expect(screen.getByText(/1. Toplanan Fərdi Məlumatlar/i)).toBeTruthy();
      expect(screen.getByText(/2. Məlumatların Qorunması və SSL Şifrələnməsi/i)).toBeTruthy();
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
      expect(resolveRouteFromPath('/catdirilma')).toEqual({ route: 'services' });
      expect(resolveRouteFromPath('/zemanet')).toEqual({ route: 'services' });
      expect(resolveRouteFromPath('/elaqe')).toEqual({ route: 'support' });
    });
  });
});
