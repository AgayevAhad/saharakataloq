// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { Footer } from '../components/Footer';
import { AppearanceManager } from '../components/admin/sections/SettingsSection';
import { lightTheme } from '../types/theme';
import { DEFAULT_SETTINGS } from '../data/catalog';

afterEach(cleanup);

describe('Footer and Developer Settings Refinements Suite', () => {
  it('1. Footer in catalog mode (variant="catalog") removes "Müştəri üçün" column and "Karyera", and maintains active clickable links', () => {
    const onNavigate = vi.fn();
    render(
      <Footer
        variant="catalog"
        settings={DEFAULT_SETTINGS}
        theme={lightTheme}
        onNavigate={onNavigate}
      />
    );

    // Removed sections must be absent in catalog mode
    expect(screen.queryByText('Müştəri üçün')).toBeNull();
    expect(screen.queryByText('Çatdırılma')).toBeNull();
    expect(screen.queryByText('Zəmanət')).toBeNull();
    expect(screen.queryByText('Qaytarma')).toBeNull();
    expect(screen.queryByText('Tez-tez verilən suallar')).toBeNull();
    expect(screen.queryByText('Karyera')).toBeNull();

    // Active links must exist and trigger onNavigate
    const aboutBtn = screen.getByRole('button', { name: 'Haqqımızda' });
    fireEvent.click(aboutBtn);
    expect(onNavigate).toHaveBeenCalledWith('about');

    const storesBtn = screen.getByRole('button', { name: 'Mağazalar' });
    fireEvent.click(storesBtn);
    expect(onNavigate).toHaveBeenCalledWith('stores');

    const supportBtn = screen.getByRole('button', { name: 'Əlaqə və Dəstək' });
    fireEvent.click(supportBtn);
    expect(onNavigate).toHaveBeenCalledWith('support');

    const termsBtn = screen.getByRole('button', { name: 'İstifadə şərtləri' });
    fireEvent.click(termsBtn);
    expect(onNavigate).toHaveBeenCalledWith('terms');

    const privacyBtn = screen.getByRole('button', { name: 'Məxfilik siyasəti' });
    fireEvent.click(privacyBtn);
    expect(onNavigate).toHaveBeenCalledWith('privacy');
  });

  it('2. Footer in site mode (variant="site") retains all 5 columns including "Müştəri üçün" and "Karyera"', () => {
    const onNavigate = vi.fn();
    render(
      <Footer
        variant="site"
        settings={DEFAULT_SETTINGS}
        theme={lightTheme}
        onNavigate={onNavigate}
      />
    );

    expect(screen.getByText('Müştəri üçün')).toBeDefined();
    expect(screen.getByText('Çatdırılma')).toBeDefined();
    expect(screen.getByText('Zəmanət')).toBeDefined();
    expect(screen.getByText('Qaytarma')).toBeDefined();
    expect(screen.getByText('Tez-tez verilən suallar')).toBeDefined();
    expect(screen.getByText('Karyera')).toBeDefined();
  });

  it('3. Footer renders Developer attribution badge when developer info is configured', () => {
    const devSettings = {
      ...DEFAULT_SETTINGS,
      developerName: 'Ahad Agayev',
      developerRole: 'Full Stack Developer',
      developerPhone: '+994501234567',
      developerInstagram: '@ahad.agayev',
      developerWebsite: 'https://ahadagayev.dev',
    };

    const { container } = render(<Footer settings={devSettings} theme={lightTheme} />);

    const devBadge = container.querySelector('.footer-developer-badge');
    expect(devBadge).toBeDefined();
    expect(screen.getByText(/Ahad Agayev/i)).toBeDefined();
    expect(screen.getByText(/Full Stack Developer/i)).toBeDefined();

    // Verify links
    const instaLink = devBadge?.querySelector(
      'a[title="Developer Instagram"]'
    ) as HTMLAnchorElement;
    expect(instaLink).toBeDefined();
    expect(instaLink.getAttribute('href')).toContain('instagram.com/ahad.agayev');

    const waLink = devBadge?.querySelector(
      'a[title="Developer WhatsApp / Əlaqə"]'
    ) as HTMLAnchorElement;
    expect(waLink).toBeDefined();
    expect(waLink.getAttribute('href')).toContain('wa.me/994501234567');

    const webLink = devBadge?.querySelector(
      'a[title="Developer Veb-sayt / Portfel"]'
    ) as HTMLAnchorElement;
    expect(webLink).toBeDefined();
    expect(webLink.getAttribute('href')).toBe('https://ahadagayev.dev');
  });

  it('4. AppearanceManager allows configuring Developer info fields', () => {
    const handleChange = vi.fn();
    render(
      <AppearanceManager settings={DEFAULT_SETTINGS} theme={lightTheme} onChange={handleChange} />
    );

    expect(screen.getByText('Veb-tərtibatçı (Developer) Məlumatları')).toBeDefined();

    const devNameInput = screen.getByPlaceholderText('məs: Ahad Agayev') as HTMLInputElement;
    expect(devNameInput).toBeDefined();
    fireEvent.change(devNameInput, { target: { value: 'Yeni Developer' } });
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ developerName: 'Yeni Developer' })
    );

    const devInstaInput = screen.getByPlaceholderText(
      'məs: @ahad.dev və ya https://instagram.com/...'
    ) as HTMLInputElement;
    expect(devInstaInput).toBeDefined();
    fireEvent.change(devInstaInput, { target: { value: '@yeni.dev' } });
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ developerInstagram: '@yeni.dev' })
    );
  });

  it('5. Footer renders structured semantic classes for mobile centered alignment and layout hooks', () => {
    const devSettings = {
      ...DEFAULT_SETTINGS,
      developerName: 'Ahad Agayev',
      developerRole: 'Lead Engineer',
    };

    const { container } = render(
      <Footer variant="catalog" settings={devSettings} theme={lightTheme} />
    );

    expect(container.querySelector('.footer-brand-logo-wrap')).toBeDefined();
    expect(container.querySelectorAll('.footer-column-title').length).toBeGreaterThanOrEqual(3);
    expect(container.querySelector('.footer-subfooter-copyright')).toBeDefined();
    expect(container.querySelector('.footer-subfooter-motto')).toBeDefined();
    expect(container.querySelector('.footer-scroll-top-btn')).toBeDefined();
    expect(container.querySelector('.footer-developer-badge')).toBeDefined();
  });

  it('6. In Catalog mode without onNavigate prop, handleNavClick never redirects outside to window.location.href', () => {
    const originalHref = window.location.href;
    render(<Footer variant="catalog" settings={DEFAULT_SETTINGS} theme={lightTheme} />);

    const aboutBtn = screen.getByRole('button', { name: 'Haqqımızda' });
    fireEvent.click(aboutBtn);

    // In catalog mode, window.location.href must not change
    expect(window.location.href).toBe(originalHref);
  });

  it('7. CatalogInfoModal displays each tab view independently with custom settings text', async () => {
    const { CatalogInfoModal } = await import('../components/CatalogInfoModal');
    const onClose = vi.fn();
    const onSelectTab = vi.fn();

    const customSettings = {
      ...DEFAULT_SETTINGS,
      aboutText: 'Xüsusi Sahara Haqqımızda Mətni',
      supportText: 'Xüsusi Dəstək və Servis Məlumatı',
      termsText: 'Xüsusi İstifadə Qaydaları',
      privacyText: 'Xüsusi Məxfilik Tələbləri',
    };

    const { rerender } = render(
      <CatalogInfoModal
        isOpen={true}
        activeTab="about"
        onClose={onClose}
        onSelectTab={onSelectTab}
        settings={customSettings}
        theme={lightTheme}
      />
    );

    // Verify About view
    expect(screen.getByText('Xüsusi Sahara Haqqımızda Mətni')).toBeDefined();

    // Switch to stores
    rerender(
      <CatalogInfoModal
        isOpen={true}
        activeTab="stores"
        onClose={onClose}
        onSelectTab={onSelectTab}
        settings={customSettings}
        theme={lightTheme}
      />
    );
    expect(screen.getByText(/Məhsullarla canlı tanış olmaq/i)).toBeDefined();

    // Switch to support
    rerender(
      <CatalogInfoModal
        isOpen={true}
        activeTab="support"
        onClose={onClose}
        onSelectTab={onSelectTab}
        settings={customSettings}
        theme={lightTheme}
      />
    );
    expect(screen.getByText('Xüsusi Dəstək və Servis Məlumatı')).toBeDefined();

    // Switch to terms
    rerender(
      <CatalogInfoModal
        isOpen={true}
        activeTab="terms"
        onClose={onClose}
        onSelectTab={onSelectTab}
        settings={customSettings}
        theme={lightTheme}
      />
    );
    expect(screen.getByText('Xüsusi İstifadə Qaydaları')).toBeDefined();

    // Switch to privacy
    rerender(
      <CatalogInfoModal
        isOpen={true}
        activeTab="privacy"
        onClose={onClose}
        onSelectTab={onSelectTab}
        settings={customSettings}
        theme={lightTheme}
      />
    );
    expect(screen.getByText('Xüsusi Məxfilik Tələbləri')).toBeDefined();

    // Test tab click
    const aboutTabBtn = screen.getByRole('button', { name: /Haqqımızda/i });
    fireEvent.click(aboutTabBtn);
    expect(onSelectTab).toHaveBeenCalledWith('about');
  });

  it('8. AppearanceManager provides textareas for aboutText, supportText, termsText, and privacyText', () => {
    const handleChange = vi.fn();
    render(
      <AppearanceManager settings={DEFAULT_SETTINGS} theme={lightTheme} onChange={handleChange} />
    );

    expect(
      screen.getByText('Məlumat Səhifələri və Hüquqi Mətnlər (Haqqımızda, Qaydalar, Məxfilik)')
    ).toBeDefined();

    const aboutTextarea = screen.getByPlaceholderText(
      /Sahara Electronics şirkəti haqqında rəsmi məlumat/i
    );
    fireEvent.change(aboutTextarea, { target: { value: 'Yeni haqqımızda mətni' } });
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ aboutText: 'Yeni haqqımızda mətni' })
    );

    const supportTextarea = screen.getByPlaceholderText(/Müştəri xidməti saatları, qaynar xətt/i);
    fireEvent.change(supportTextarea, { target: { value: 'Yeni dəstək mətni' } });
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ supportText: 'Yeni dəstək mətni' })
    );

    const termsTextarea = screen.getByPlaceholderText(
      /Kataloqdan və xidmətlərdən istifadə qaydaları/i
    );
    fireEvent.change(termsTextarea, { target: { value: 'Yeni şərtlər' } });
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ termsText: 'Yeni şərtlər' })
    );

    const privacyTextarea = screen.getByPlaceholderText(
      /Məlumatların qorunması və məxfilik tələbləri/i
    );
    fireEvent.change(privacyTextarea, { target: { value: 'Yeni məxfilik' } });
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ privacyText: 'Yeni məxfilik' })
    );
  });
});
