import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { AccountPage } from '../pages/AccountPage';
import { App, resolveRouteFromPath } from '../App';
import { lightTheme, darkTheme } from '../types/theme';
import { AuthUser } from '../types/auth';

afterEach(() => {
  cleanup();
});


const mockUser: AuthUser = {
  id: 'usr-4488',
  fullName: 'Kamran Əhmədov',
  phone: '509998877',
  email: 'kamran@sahara.az',
  role: 'vip',
  registeredAt: '2026-01-15T10:00:00.000Z',
  addresses: [
    {
      id: 'addr-1',
      title: 'Ev',
      city: 'Bakı',
      address: 'Yasamal r., Zərdabi pr. 50, m. 18',
      isDefault: true,
    },
  ],
  orders: [
    {
      id: 'ord-101',
      orderNumber: 'SHR-8822',
      date: '14.09.2026',
      totalAmount: 1450,
      status: 'processing',
      statusText: 'Hazırlanır',
      itemsCount: 2,
    },
  ],
};

describe('AccountPage & User Dashboard Full-Page Suite', () => {
  it('1. Route resolution: correctly resolves /account, /profile, /login, and /register', () => {
    expect(resolveRouteFromPath('/account')).toEqual({ route: 'account' });
    expect(resolveRouteFromPath('/profile')).toEqual({ route: 'account' });
    expect(resolveRouteFromPath('/login')).toEqual({ route: 'account' });
    expect(resolveRouteFromPath('/register')).toEqual({ route: 'account' });
    expect(resolveRouteFromPath('/auth')).toEqual({ route: 'account' });
  });

  it('2. Guest Mode: Renders Login form by default with validations and switches to Register form', async () => {
    const handleLogin = vi.fn().mockReturnValue(true);
    const handleRegister = vi.fn().mockReturnValue(true);
    const handleNavigate = vi.fn();

    render(
      <AccountPage
        authUser={null}
        theme={lightTheme}
        themeMode="light"
        cartCount={2}
        favoritesCount={4}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={vi.fn()}
        onUpdateProfile={vi.fn()}
        onNavigate={handleNavigate}
      />
    );

    // Header Back & Guest Title
    expect(screen.getByText('Kataloqa qayıt')).toBeDefined();
    expect(screen.getByText('Giriş və Qeydiyyat')).toBeDefined();

    // Login Form fields
    expect(screen.getByPlaceholderText(/Məs: 50 123 45 67 və ya email@example.com/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Şifrənizi daxil edin/i)).toBeDefined();

    // Submit Login
    const idInput = screen.getByPlaceholderText(/Məs: 50 123 45 67 və ya email@example.com/i);
    const passInput = screen.getByPlaceholderText(/Şifrənizi daxil edin/i);
    const submitLoginBtn = screen.getAllByRole('button', { name: /Daxil Ol/i })[1];

    fireEvent.change(idInput, { target: { value: '509998877' } });
    fireEvent.change(passInput, { target: { value: 'saharaPass' } });
    fireEvent.click(submitLoginBtn);

    expect(handleLogin).toHaveBeenCalledWith({
      identifier: '509998877',
      password: 'saharaPass',
      rememberMe: true,
    });

    // Switch to Register Tab
    const regTabBtn = screen.getByRole('button', { name: /Yeni Qeydiyyat/i });
    fireEvent.click(regTabBtn);

    expect(screen.getByPlaceholderText(/Məs: Əli Əliyev/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/50 123 45 67/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Ən azı 6 simvol/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Şifrəni təkrar yazın/i)).toBeDefined();

    // Submit Register
    const regName = screen.getByPlaceholderText(/Məs: Əli Əliyev/i);
    const regPhone = screen.getByPlaceholderText(/50 123 45 67/i);
    const regPass = screen.getByPlaceholderText(/Ən azı 6 simvol/i);
    const regPassConfirm = screen.getByPlaceholderText(/Şifrəni təkrar yazın/i);
    const submitRegBtn = screen.getByRole('button', { name: /Qeydiyyatı Tamamla/i });

    fireEvent.change(regName, { target: { value: 'Nigar Hüseynova' } });
    fireEvent.change(regPhone, { target: { value: '551122334' } });
    fireEvent.change(regPass, { target: { value: 'secret123' } });
    fireEvent.change(regPassConfirm, { target: { value: 'secret123' } });
    fireEvent.click(submitRegBtn);

    expect(handleRegister).toHaveBeenCalledWith({
      fullName: 'Nigar Hüseynova',
      phone: '551122334',
      email: undefined,
      password: 'secret123',
      termsAccepted: true,
    });
  });

  it('3. Authenticated Dashboard: Displays user header, stat cards, and profile editing', async () => {
    const handleLogout = vi.fn();
    const handleUpdateProfile = vi.fn();
    const handleNavigate = vi.fn();

    render(
      <AccountPage
        authUser={mockUser}
        theme={lightTheme}
        themeMode="light"
        cartCount={3}
        favoritesCount={5}
        onLogin={vi.fn()}
        onRegister={vi.fn()}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
        onNavigate={handleNavigate}
      />
    );

    // Check Hero Card
    expect(screen.getAllByText('Kamran Əhmədov').length).toBeGreaterThan(0);
    expect(screen.getByText('Təsdiqlənmiş Müştəri')).toBeDefined();
    expect(screen.getAllByText(/\+994/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('kamran@sahara.az').length).toBeGreaterThan(0);


    // Check Stat Cards
    expect(screen.getByText('3 məhsul')).toBeDefined();
    expect(screen.getByText('5 məhsul')).toBeDefined();

    // Test Edit Profile
    const editBtn = screen.getByRole('button', { name: /Redaktə et/i });
    fireEvent.click(editBtn);

    const nameInput = screen.getByDisplayValue('Kamran Əhmədov');
    fireEvent.change(nameInput, { target: { value: 'Kamran Əhmədzadə' } });

    const saveBtn = screen.getByRole('button', { name: /Məlumatları Saxla/i });
    fireEvent.click(saveBtn);

    expect(handleUpdateProfile).toHaveBeenCalledWith({
      fullName: 'Kamran Əhmədzadə',
      email: 'kamran@sahara.az',
      birthDate: undefined,
    });

    // Test Logout
    const logoutBtn = screen.getByRole('button', { name: /Hesabdan Çıxış et/i });
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalled();
  });

  it('4. Authenticated Dashboard: Switches tabs to Orders, Addresses, Security and Support', async () => {
    const handleWhatsApp = vi.fn();
    const handleCall = vi.fn();

    render(
      <AccountPage
        authUser={mockUser}
        theme={darkTheme}
        themeMode="dark"
        cartCount={1}
        favoritesCount={2}
        onLogin={vi.fn()}
        onRegister={vi.fn()}
        onLogout={vi.fn()}
        onUpdateProfile={vi.fn()}
        onNavigate={vi.fn()}
        onWhatsAppSupport={handleWhatsApp}
        onCallSupport={handleCall}
      />
    );

    // Switch to Orders Tab
    const ordersTab = screen.getByRole('button', { name: /Tab: Sifarişlərim & İzləmə/i });
    fireEvent.click(ordersTab);
    expect(screen.getByText('#SHR-8822')).toBeDefined();
    expect(screen.getByText('Hazırlanır')).toBeDefined();
    expect(screen.getByText('1450 ₼')).toBeDefined();

    // Search order
    const orderInput = screen.getByPlaceholderText(/Məs: SHR-9021/i);
    const trackBtn = screen.getByRole('button', { name: /^İzlə$/i });
    fireEvent.change(orderInput, { target: { value: 'SHR-8822' } });
    fireEvent.click(trackBtn);
    expect(screen.getByText(/Sifariş #SHR-8822/i)).toBeDefined();

    // Switch to Addresses Tab
    const addrTab = screen.getByRole('button', { name: /Tab: Çatdırılma Ünvanlarım/i });
    fireEvent.click(addrTab);
    expect(screen.getByText(/Yasamal r., Zərdabi pr. 50/i)).toBeDefined();

    // Switch to Security Tab
    const secTab = screen.getByRole('button', { name: /Tab: Təhlükəsizlik & Şifrə/i });
    fireEvent.click(secTab);
    expect(screen.getByRole('button', { name: /Şifrəni Yenilə/i })).toBeDefined();

    // Switch to Support Tab
    const suppTab = screen.getByRole('button', { name: /Tab: Dəstək & Əlaqə/i });
    fireEvent.click(suppTab);
    const waBtn = screen.getByRole('button', { name: /WhatsApp-da Yaz/i });
    fireEvent.click(waBtn);
    expect(handleWhatsApp).toHaveBeenCalled();

    const callBtn = screen.getByRole('button', { name: /Zəng et/i });
    fireEvent.click(callBtn);
    expect(handleCall).toHaveBeenCalled();
  });

  it('5. Header & Navigation: Profile actions trigger navigation to account route smoothly', () => {
    const handleNavigate = vi.fn();
    const handleOpenUserDrawer = vi.fn();

    render(
      <AccountPage
        authUser={null}
        theme={lightTheme}
        themeMode="light"
        cartCount={0}
        favoritesCount={0}
        onLogin={vi.fn()}
        onRegister={vi.fn()}
        onLogout={vi.fn()}
        onUpdateProfile={vi.fn()}
        onNavigate={handleNavigate}
      />
    );

    const backBtn = screen.getByText('Kataloqa qayıt');
    fireEvent.click(backBtn);
    expect(handleNavigate).toHaveBeenCalledWith('catalog');
  });
});
