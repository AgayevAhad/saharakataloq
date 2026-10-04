import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildProductWhatsAppMessage, useContact } from '../hooks/useContact';
import type { CatalogSettings } from '../types/product';

const mockSettings: Partial<CatalogSettings> = {
  whatsappNumber: '+994501234567',
  phoneNumber: '+994121234567',
};

describe('useContact', () => {
  const showToast = vi.fn();
  const getProductUrl = vi.fn(() => 'https://saharaelectronics.az/product/test');
  let windowOpenSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    showToast.mockClear();
    getProductUrl.mockClear();
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  it('openWhatsApp window.open çağırır', () => {
    const { result } = renderHook(() =>
      useContact({ settings: mockSettings as CatalogSettings, getProductUrl, showToast })
    );
    result.current.openWhatsApp();
    expect(windowOpenSpy).toHaveBeenCalledOnce();
    expect(windowOpenSpy.mock.calls[0][0]).toContain('wa.me');
  });

  it('openWhatsApp admin nömrəsini və link-ad-müştəri mesajı sırasını qoruyur', () => {
    const { result } = renderHook(() =>
      useContact({ settings: mockSettings as CatalogSettings, getProductUrl, showToast })
    );
    const product = { id: 'p1', code: 'ARDO-WS60S', title: 'Ardo Paltaryuyan' } as any;
    result.current.openWhatsApp(product);
    expect(windowOpenSpy).toHaveBeenCalledOnce();
    const openedUrl = new URL(windowOpenSpy.mock.calls[0][0] as string);
    expect(openedUrl.origin + openedUrl.pathname).toBe('https://wa.me/994501234567');
    expect(openedUrl.searchParams.get('text')).toBe(
      '🔗 Məhsulun linki:\n' +
        'https://saharaelectronics.az/product/test\n\n' +
        '🏷 Məhsulun adı:\n' +
        'Ardo Paltaryuyan\n\n' +
        'Salam, bu məhsul haqqında ətraflı məlumat almaq istəyirəm.'
    );
  });

  it('məhsul WhatsApp mesajını Azərbaycan hərfləri ilə səliqəli qurur', () => {
    const product = { id: 'p1', title: 'Plitə Ardo 201GC' } as any;

    expect(buildProductWhatsAppMessage(product, 'https://sahara.az/catalog?product=p1')).toBe(
      '🔗 Məhsulun linki:\n' +
        'https://sahara.az/catalog?product=p1\n\n' +
        '🏷 Məhsulun adı:\n' +
        'Plitə Ardo 201GC\n\n' +
        'Salam, bu məhsul haqqında ətraflı məlumat almaq istəyirəm.'
    );
  });

  it('openWhatsApp nömrə yoxdursa toast göstərir', () => {
    const emptySettings = {
      ...mockSettings,
      whatsappNumber: '',
      phoneNumber: '',
      phoneNumbers: [],
    } as CatalogSettings;
    const { result } = renderHook(() =>
      useContact({ settings: emptySettings, getProductUrl, showToast })
    );
    result.current.openWhatsApp();
    expect(showToast).toHaveBeenCalledOnce();
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it('ayrıca WhatsApp nömrəsi yoxdursa əsas əlaqə nömrəsindən istifadə edir', () => {
    const settingsWithPhoneFallback = {
      ...mockSettings,
      whatsappNumber: '',
      phoneNumber: '+994 50 261 30 41',
    } as CatalogSettings;
    const { result } = renderHook(() =>
      useContact({ settings: settingsWithPhoneFallback, getProductUrl, showToast })
    );

    result.current.openWhatsApp({ id: 'p1', title: 'Plitə Ardo 201GC' } as any);

    expect(windowOpenSpy.mock.calls[0][0]).toContain('https://wa.me/994502613041?text=');
  });

  it('openCall window.open tel: URL ilə çağırır', () => {
    const { result } = renderHook(() =>
      useContact({ settings: mockSettings as CatalogSettings, getProductUrl, showToast })
    );
    result.current.openCall();
    expect(windowOpenSpy).toHaveBeenCalledOnce();
    expect(windowOpenSpy.mock.calls[0][0]).toContain('tel:');
  });

  it('openCall nömrə yoxdursa toast göstərir', () => {
    const emptySettings = { ...mockSettings, phoneNumber: '', phoneNumbers: [] } as CatalogSettings;
    const { result } = renderHook(() =>
      useContact({ settings: emptySettings, getProductUrl, showToast })
    );
    result.current.openCall();
    expect(showToast).toHaveBeenCalledOnce();
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it('copyLink navigator.clipboard və toast çağırır', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextSpy,
      },
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() =>
      useContact({ settings: mockSettings as CatalogSettings, getProductUrl, showToast })
    );
    const product = { id: 'p1', code: 'TEST-123', title: 'Test' } as any;
    await act(async () => {
      await result.current.copyLink(product);
    });
    expect(writeTextSpy).toHaveBeenCalledWith('https://saharaelectronics.az/product/test');
    expect(showToast).toHaveBeenCalledWith('Link kopyalandı!');
  });

  it('copyLink navigator.clipboard rədd etdikdə execCommand fallback-indən istifadə edir', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
      configurable: true,
      writable: true,
    });
    const execCommandSpy = vi.fn().mockReturnValue(true);
    (document as any).execCommand = execCommandSpy;

    const { result } = renderHook(() =>
      useContact({ settings: mockSettings as CatalogSettings, getProductUrl, showToast })
    );
    await act(async () => {
      await result.current.copyLink('https://example.com/item');
    });
    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    expect(showToast).toHaveBeenCalledWith('Link kopyalandı!');
  });
});
