// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminLogin } from '../src/components/AdminLogin';
import { lightTheme } from '../src/types/theme';

afterEach(cleanup);

describe('AdminLogin — UI və giriş axını', () => {

  it('şifrə inputu, "Daxil ol" düyməsi və geri keçid göstərilir', () => {
    render(<AdminLogin theme={lightTheme} onLogin={vi.fn()} />);
    expect(screen.getByPlaceholderText('Admin şifrəsini daxil edin')).toBeDefined();
    expect(screen.getByRole('button', { name: /Daxil ol/i })).toBeDefined();
    expect(screen.getByText(/Kataloqa qayıt/i)).toBeDefined();
  });

  it('boş şifrə ilə onLogin çağırılmır', async () => {
    const onLogin = vi.fn();
    render(<AdminLogin theme={lightTheme} onLogin={onLogin} />);
    fireEvent.click(screen.getByRole('button', { name: /Daxil ol/i }));
    // Bir tick gözləyirik
    await new Promise((r) => setTimeout(r, 50));
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('şifrə daxil edilib düymə basılınca onLogin çağırılır', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<AdminLogin theme={lightTheme} onLogin={onLogin} />);
    fireEvent.change(screen.getByPlaceholderText('Admin şifrəsini daxil edin'), {
      target: { value: 'dogruSifre123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Daxil ol/i }));
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('dogruSifre123'));
  });

  it('yanlış şifrədə xəta mesajı göstərilir', async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error('Yanlış şifrə'));
    render(<AdminLogin theme={lightTheme} onLogin={onLogin} />);
    fireEvent.change(screen.getByPlaceholderText('Admin şifrəsini daxil edin'), {
      target: { value: 'yanlishSifre' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Daxil ol/i }));
    await waitFor(() => expect(screen.getByText('Yanlış şifrə')).toBeDefined());
  });

  it('giriş zamanı düymə "Yoxlanılır..." mətni göstərir', async () => {
    let resolveFn!: () => void;
    const onLogin = vi.fn().mockReturnValue(new Promise<void>((r) => { resolveFn = r; }));
    render(<AdminLogin theme={lightTheme} onLogin={onLogin} />);
    fireEvent.change(screen.getByPlaceholderText('Admin şifrəsini daxil edin'), {
      target: { value: 'sifre' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Daxil ol/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Yoxlanılır/i })).toBeDefined());
    resolveFn();
  });

  it('"Lokal təhlükəsiz giriş" təhlükəsizlik bildirişi göstərilir', () => {
    render(<AdminLogin theme={lightTheme} onLogin={vi.fn()} />);
    expect(screen.getByText(/Lokal təhlükəsiz giriş/i)).toBeDefined();
  });

  it('Enter klikləndikdə form submit olur', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<AdminLogin theme={lightTheme} onLogin={onLogin} />);
    const input = screen.getByPlaceholderText('Admin şifrəsini daxil edin');
    fireEvent.change(input, { target: { value: 'sifremi' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('sifremi'));
  });
});
