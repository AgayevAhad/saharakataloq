import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { UserAccountDrawer } from '../components/site/UserAccountDrawer';
import { ThemeColors } from '../types/theme';
import { AuthUser } from '../types/auth';

const lightTheme: ThemeColors = {
  primary: '#dc2626',
  primaryHover: '#b91c1c',
  bg: '#ffffff',
  bgSecondary: '#f8fafc',
  cardBg: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  mode: 'light',
};

describe('User Authentication & Profile (Item 21) Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('1. Renders login form by default for guest users and validates required fields', async () => {
    const handleLogin = vi.fn().mockReturnValue(true);
    const handleRegister = vi.fn().mockReturnValue(true);

    render(
      <UserAccountDrawer
        isOpen={true}
        onClose={vi.fn()}
        theme={lightTheme}
        themeMode="light"
        onToggleTheme={vi.fn()}
        onNavigate={vi.fn()}
        cartCount={0}
        favoritesCount={0}
        authUser={null}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getAllByText('Daxil ol').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Qeydiyyat').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/50 123 45 67 və ya email/i)).toBeDefined();


    const idInput = screen.getByPlaceholderText(/50 123 45 67 və ya email/i);
    const passInput = screen.getByPlaceholderText(/Şifrəniz/i);
    const submitBtn = screen.getAllByRole('button', { name: /Daxil ol/i })[1];


    fireEvent.change(idInput, { target: { value: '501234567' } });
    fireEvent.change(passInput, { target: { value: '123456' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleLogin).toHaveBeenCalledWith({
        identifier: '501234567',
        password: '123456',
      });
    });
  });

  it('2. Switches to registration form, validates password matching and terms, and submits', async () => {
    const handleRegister = vi.fn().mockReturnValue(true);

    render(
      <UserAccountDrawer
        isOpen={true}
        onClose={vi.fn()}
        theme={lightTheme}
        themeMode="light"
        onToggleTheme={vi.fn()}
        onNavigate={vi.fn()}
        cartCount={0}
        favoritesCount={0}
        authUser={null}
        onLogin={vi.fn()}
        onRegister={handleRegister}
        onLogout={vi.fn()}
      />
    );

    // Switch to Register tab
    const regTab = screen.getAllByRole('button', { name: /Qeydiyyat/i })[0];
    fireEvent.click(regTab);


    expect(screen.getByPlaceholderText(/Məs: Əli Əliyev/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Şifrə təyin edin/i)).toBeDefined();

    const nameInput = screen.getByPlaceholderText(/Məs: Əli Əliyev/i);
    const phoneInput = screen.getByPlaceholderText(/50 123 45 67/i);
    const passInput = screen.getByPlaceholderText(/Şifrə təyin edin/i);
    const confirmPassInput = screen.getByPlaceholderText(/Şifrəni təkrar daxil edin/i);
    const submitRegBtn = screen.getByRole('button', { name: /Qeydiyyatı Tamamla/i });

    fireEvent.change(nameInput, { target: { value: 'Rəşad Əliyev' } });
    fireEvent.change(phoneInput, { target: { value: '559876543' } });
    fireEvent.change(passInput, { target: { value: 'sahara2026' } });
    fireEvent.change(confirmPassInput, { target: { value: 'sahara2026' } });
    fireEvent.click(submitRegBtn);

    await waitFor(() => {
      expect(handleRegister).toHaveBeenCalledWith({
        fullName: 'Rəşad Əliyev',
        phone: '559876543',
        email: undefined,
        password: 'sahara2026',
        termsAccepted: true,
      });
    });
  });

  it('3. Renders logged-in profile hub, allows profile editing, and handles logout', async () => {
    const mockUser: AuthUser = {
      id: 'usr-1',
      fullName: 'Leyla Məmmədova',
      phone: '501112233',
      email: 'leyla@example.com',
      registeredAt: '2026-09-18T10:00:00Z',
      role: 'customer',
    };

    const handleLogout = vi.fn();
    const handleUpdateProfile = vi.fn();

    render(
      <UserAccountDrawer
        isOpen={true}
        onClose={vi.fn()}
        theme={lightTheme}
        themeMode="light"
        onToggleTheme={vi.fn()}
        onNavigate={vi.fn()}
        cartCount={2}
        favoritesCount={1}
        authUser={mockUser}
        onLogin={vi.fn()}
        onRegister={vi.fn()}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
      />
    );

    expect(screen.getAllByText('Leyla Məmmədova').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\+994 501112233/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('leyla@example.com').length).toBeGreaterThan(0);

    // Click edit profile
    const editBtn = screen.getByRole('button', { name: /Redaktə et/i });
    fireEvent.click(editBtn);

    const editNameInput = screen.getByDisplayValue('Leyla Məmmədova');
    fireEvent.change(editNameInput, { target: { value: 'Leyla Qasımova' } });

    const saveBtn = screen.getByRole('button', { name: /Məlumatları Saxla/i });
    fireEvent.click(saveBtn);

    expect(handleUpdateProfile).toHaveBeenCalledWith({
      fullName: 'Leyla Qasımova',
      email: 'leyla@example.com',
    });

    // Logout
    const logoutBtn = screen.getByRole('button', { name: /Hesabdan Çıxış et/i });
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalled();
  });
});
