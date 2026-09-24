import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useContact } from '../hooks/useContact';
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

  it('openWhatsApp məhsul məlumatlarını mesaja daxil edir', () => {
    const { result } = renderHook(() =>
      useContact({ settings: mockSettings as CatalogSettings, getProductUrl, showToast })
    );
    const product = { id: 'p1', code: 'ARDO-WS60S', title: 'Ardo Paltaryuyan' } as any;
    result.current.openWhatsApp(product);
    expect(windowOpenSpy).toHaveBeenCalledOnce();
    const url = windowOpenSpy.mock.calls[0][0] as string;
    expect(url).toContain('ARDO-WS60S');
  });

  it('openWhatsApp nömrə yoxdursa toast göstərir', () => {
    const emptySettings = { ...mockSettings, whatsappNumber: '' } as CatalogSettings;
    const { result } = renderHook(() =>
      useContact({ settings: emptySettings, getProductUrl, showToast })
    );
    result.current.openWhatsApp();
    expect(showToast).toHaveBeenCalledOnce();
    expect(windowOpenSpy).not.toHaveBeenCalled();
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
});
