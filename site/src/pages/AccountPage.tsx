import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Heart,
  ShoppingCart,
  LogOut,
  Edit3,
  Save,
  Package,
  PackageSearch,
  MapPin,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  HelpCircle,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Info,
} from 'lucide-react';
import {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  AuthUserAddress,
  AuthUserOrder,
} from '../types/auth';
import { ThemeColors } from '../types/theme';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { SaharaDatePicker } from '../components/SaharaDatePicker';
import {
  getPasswordRequirements,
  isStrongPassword,
  PASSWORD_REQUIREMENT_TEXT,
} from '../utils/authValidation';

interface AccountPageProps {
  authUser: AuthUser | null;
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  cartCount?: number;
  favoritesCount?: number;
  onLogin: (credentials: LoginCredentials) => boolean | void | Promise<boolean>;
  onRegister: (credentials: RegisterCredentials) => boolean | void | Promise<boolean>;
  onLogout: () => void;
  onUpdateProfile: (updated: Partial<AuthUser>) => void | boolean | Promise<boolean | void>;
  onChangePassword?: (currentPassword: string, newPassword: string) => Promise<boolean>;
  onNavigate: (route: string, param?: string) => void;
  onWhatsAppSupport?: () => void;
  onCallSupport?: () => void;
}

const PasswordRequirements: React.FC<{ password: string; theme: ThemeColors }> = ({
  password,
  theme,
}) => {
  const requirements = getPasswordRequirements(password);
  const items = [
    ['hasMinLength', '8+ simvol'],
    ['hasLetter', 'hərf'],
    ['hasUppercase', 'böyük hərf'],
    ['hasNumber', 'rəqəm'],
  ] as const;

  return (
    <div className="password-requirements" aria-label="Şifrə tələbləri">
      {items.map(([key, label]) => {
        const met = requirements[key];
        return (
          <span
            key={key}
            className={met ? 'is-met' : ''}
            style={{ color: met ? '#15803d' : theme.textMuted }}
          >
            <CheckCircle2 size={12} /> {label}
          </span>
        );
      })}
    </div>
  );
};

export const AccountPage: React.FC<AccountPageProps> = ({
  authUser,
  theme,
  themeMode,
  cartCount = 0,
  favoritesCount = 0,
  onLogin,
  onRegister,
  onLogout,
  onUpdateProfile,
  onChangePassword,
  onNavigate,
  onWhatsAppSupport,
  onCallSupport,
}) => {
  // Guest view tab: 'login' or 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRemember, setLoginRemember] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regTermsAccepted, setRegTermsAccepted] = useState(true);
  const [regError, setRegError] = useState('');

  // Authenticated profile tabs: 'profile' | 'orders' | 'addresses' | 'security' | 'support'
  const [activeDashboardTab, setActiveDashboardTab] = useState<
    'profile' | 'orders' | 'addresses' | 'security' | 'support'
  >('profile');

  // Profile Edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState(authUser?.fullName || '');
  const [editEmail, setEditEmail] = useState(authUser?.email || '');
  const [editBirthDate, setEditBirthDate] = useState(authUser?.birthDate || '');
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  // Sifariş Axtarışı / İzləmə state
  const [orderQuery, setOrderQuery] = useState('');
  const [orderTrackResult, setOrderTrackResult] = useState<string | null>(null);

  // Address add form state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddrTitle, setNewAddrTitle] = useState('Ev');
  const [newAddrCity, setNewAddrCity] = useState('Bakı');
  const [newAddrText, setNewAddrText] = useState('');

  // Password change state
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // Sync authUser data when changed
  useEffect(() => {
    if (authUser) {
      setEditFullName(authUser.fullName || '');
      setEditEmail(authUser.email || '');
      setEditBirthDate(authUser.birthDate || '');
    }
  }, [authUser]);

  // Derived User Orders
  const userOrders = useMemo<AuthUserOrder[]>(() => {
    return authUser?.orders || [];
  }, [authUser]);

  // Derived User Addresses
  const userAddresses = useMemo<AuthUserAddress[]>(() => {
    if (!authUser) return [];
    try {
      const saved = localStorage.getItem(`sahara_user_addresses_${authUser.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return authUser.addresses || [];
  }, [authUser]);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginIdentifier.trim()) {
      setLoginError('Zəhmət olmasa mobil nömrənizi və ya emailinizi daxil edin.');
      return;
    }
    if (!loginPassword || loginPassword.length < 4) {
      setLoginError('Şifrə ən azı 4 simvoldan ibarət olmalıdır.');
      return;
    }

    const res = await onLogin({
      identifier: loginIdentifier.trim(),
      password: loginPassword,
      rememberMe: loginRemember,
    });

    if (res === false) {
      setLoginError('Daxil etdiyiniz məlumatlar düzgün deyil. Zəhmət olmasa yenidən yoxlayın.');
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regFullName.trim()) {
      setRegError('Ad və soyadınızı daxil edin.');
      return;
    }
    const cleanPhone = regPhone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setRegError('Düzgün 9 rəqəmli mobil nömrə daxil edin (məs: 50 123 45 67).');
      return;
    }
    if (!regBirthDate) {
      setRegError('Doğum tarixinizi seçin.');
      return;
    }
    if (!isStrongPassword(regPassword)) {
      setRegError(PASSWORD_REQUIREMENT_TEXT);
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Daxil edilmiş şifrələr bir-biri ilə uyğun gəlmir.');
      return;
    }
    if (!regTermsAccepted) {
      setRegError('Qeydiyyatdan keçmək üçün istifadəçi qaydalarını qəbul etməlisiniz.');
      return;
    }

    const res = await onRegister({
      fullName: regFullName.trim(),
      phone: cleanPhone,
      email: regEmail.trim() || undefined,
      birthDate: regBirthDate,
      password: regPassword,
      termsAccepted: true,
    });

    if (res === false) {
      setRegError('Qeydiyyat zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    }
  };

  // Save Profile Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) return;

    const saved = await onUpdateProfile({
      fullName: editFullName.trim(),
      email: editEmail.trim() || undefined,
      birthDate: editBirthDate.trim() || undefined,
    });

    if (saved === false) return;
    setIsEditingProfile(false);
    setEditSuccessMsg('Profil məlumatlarınız uğurla yadda saxlanıldı.');
    setTimeout(() => setEditSuccessMsg(''), 3500);
  };

  // Add Address
  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrText.trim() || !authUser) return;

    const newAddr: AuthUserAddress = {
      id: `addr-${Date.now()}`,
      title: newAddrTitle,
      city: newAddrCity,
      address: newAddrText.trim(),
      isDefault: userAddresses.length === 0,
    };

    const updated = [...userAddresses, newAddr];
    try {
      localStorage.setItem(`sahara_user_addresses_${authUser.id}`, JSON.stringify(updated));
    } catch {}
    onUpdateProfile({ addresses: updated });
    setNewAddrText('');
    setShowAddAddress(false);
  };

  // Delete Address
  const handleDeleteAddress = (id: string) => {
    if (!authUser) return;
    const updated = userAddresses.filter((a) => a.id !== id);
    try {
      localStorage.setItem(`sahara_user_addresses_${authUser.id}`, JSON.stringify(updated));
    } catch {}
    onUpdateProfile({ addresses: updated });
  };

  // Change Password Submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (!currPassword) {
      setPasswordChangeError('Cari şifrənizi daxil edin.');
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setPasswordChangeError(PASSWORD_REQUIREMENT_TEXT);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('Yeni şifrələr bir-biri ilə uyğunlaşmır.');
      return;
    }

    if (!onChangePassword) {
      setPasswordChangeError('Şifrə yeniləmə hazırda əlçatan deyil.');
      return;
    }
    const changed = await onChangePassword(currPassword, newPassword);
    if (!changed) {
      setPasswordChangeError('Cari şifrə yanlışdır və ya şifrə yenilənmədi.');
      return;
    }
    setPasswordChangeSuccess('Şifrəniz uğurla yeniləndi.');
    setCurrPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setTimeout(() => setPasswordChangeSuccess(''), 4000);
  };

  // Order Tracking
  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;

    const code = orderQuery.trim().toUpperCase();
    const found = userOrders.find((o) => o.orderNumber.toUpperCase() === code);
    if (found) {
      setOrderTrackResult(
        `Sifariş #${found.orderNumber}: ${found.statusText}. Məbləğ: ${found.totalAmount} ₼.`
      );
    } else {
      setOrderTrackResult(
        `Sifariş #${code} barədə təsdiqlənmiş məlumat tapılmadı. Zəhmət olmasa saytdaxili çatdan bizə yazın.`
      );
    }
  };

  return (
    <div
      className="account-page-container"
      style={{
        width: '100%',
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 clamp(16px, 2.5vw, 36px) 80px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Breadcrumb & Quick Back Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 0 18px',
          borderBottom: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)'}`,
          marginBottom: '32px',
        }}
      >
        <button
          type="button"
          onClick={() => onNavigate('catalog')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 0',
            backgroundColor: 'transparent',
            border: 'none',
            color: theme.text,
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <ArrowLeft size={16} />
          <span>Kataloqa qayıt</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: theme.textMuted }}>
            {authUser ? 'Şəxsi Kabinet' : 'Giriş və Qeydiyyat'}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CASE 1: GUEST USER (Login & Registration Full-Page Portal)   */}
      {/* ============================================================ */}
      {!authUser ? (
        <div
          className="account-auth-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '40px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Form Card with Segmented Switcher */}
          <div
            className="account-auth-card"
            style={{
              backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
              borderRadius: '24px',
              border: `1px solid ${theme.border}`,
              padding: 'clamp(24px, 3.5vw, 40px)',
              boxShadow:
                themeMode === 'dark'
                  ? '0 16px 40px rgba(0, 0, 0, 0.4)'
                  : '0 12px 36px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* Top Segmented Tab Switcher */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '6px',
                padding: '5px',
                backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f1f5f9',
                borderRadius: '14px',
                border: `1px solid ${theme.border}`,
              }}
            >
              <button
                className="account-auth-tab"
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setLoginError('');
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor:
                    authMode === 'login'
                      ? themeMode === 'dark'
                        ? '#1e293b'
                        : '#ffffff'
                      : 'transparent',
                  color:
                    authMode === 'login'
                      ? themeMode === 'dark'
                        ? '#ffffff'
                        : '#0f172a'
                      : theme.textSecondary,
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: authMode === 'login' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <User size={16} color={authMode === 'login' ? '#dc2626' : undefined} />
                <span>Daxil Ol</span>
              </button>

              <button
                className="account-auth-tab"
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setRegError('');
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor:
                    authMode === 'register'
                      ? themeMode === 'dark'
                        ? '#1e293b'
                        : '#ffffff'
                      : 'transparent',
                  color:
                    authMode === 'register'
                      ? themeMode === 'dark'
                        ? '#ffffff'
                        : '#0f172a'
                      : theme.textSecondary,
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: authMode === 'register' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={16} color={authMode === 'register' ? '#dc2626' : undefined} />
                <span>Qeydiyyat</span>
              </button>
            </div>

            {/* TAB 1: LOGIN FORM */}
            {authMode === 'login' && (
              <form
                onSubmit={handleLoginSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: '22px',
                      fontWeight: 900,
                      color: theme.text,
                      margin: '0 0 6px 0',
                    }}
                  >
                    Xoş Gəlmisiniz!
                  </h2>
                  <p style={{ fontSize: '13.5px', color: theme.textSecondary, margin: 0 }}>
                    Sifarişlərinizi izləmək və rəylər bildirmək üçün hesabınıza daxil olun.
                  </p>
                </div>

                {loginError && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(220, 38, 38, 0.12)',
                      color: '#dc2626',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    {loginError}
                  </div>
                )}

                {/* Mobil Nömrə və ya Email Input */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: theme.text,
                      marginBottom: '6px',
                    }}
                  >
                    Mobil Nömrə və ya Email *
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`,
                      padding: '0 14px',
                    }}
                  >
                    <Phone size={17} color={theme.textMuted} />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Məs: 50 123 45 67 və ya email@example.com"
                      required
                      style={{
                        flex: 1,
                        padding: '13px 12px',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '14px',
                        color: theme.text,
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>

                {/* Şifrə Input */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <label style={{ fontSize: '13px', fontWeight: 800, color: theme.text }}>
                      Şifrə *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          'Şifrənizi sıfırlamaq üçün qeydiyyat nömrənizdən Sahara Dəstək xidmətinə (+994 50 123 45 67) müraciət edin.'
                        )
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Şifrəni unutmusunuz?
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`,
                      padding: '0 14px',
                    }}
                  >
                    <Lock size={17} color={theme.textMuted} />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Şifrənizi daxil edin"
                      required
                      style={{
                        flex: 1,
                        padding: '13px 12px',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '14px',
                        color: theme.text,
                        fontWeight: 600,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((p) => !p)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.textMuted,
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: theme.textSecondary,
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={loginRemember}
                    onChange={(e) => setLoginRemember(e.target.checked)}
                    style={{ accentColor: '#dc2626', width: '16px', height: '16px' }}
                  />
                  <span>Məni bu cihazda xatırla</span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  style={{
                    padding: '14px 20px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(220, 38, 38, 0.10)',
                    color: '#dc2626',
                    border: 'none',
                    fontSize: '14.5px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s ease, transform 0.15s ease',
                  }}
                >
                  <span>Daxil Ol</span>
                  <ArrowRight size={17} />
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER FORM */}
            {authMode === 'register' && (
              <form
                onSubmit={handleRegisterSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: '22px',
                      fontWeight: 900,
                      color: theme.text,
                      margin: '0 0 6px 0',
                    }}
                  >
                    Hesab Yaradın
                  </h2>
                  <p style={{ fontSize: '13.5px', color: theme.textSecondary, margin: 0 }}>
                    Sahara Electronics ailəsinə qoşulun, eksklüziv təkliflərdən yararlanın.
                  </p>
                </div>

                {regError && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(220, 38, 38, 0.12)',
                      color: '#dc2626',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    {regError}
                  </div>
                )}

                {/* Ad və Soyad */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: theme.text,
                      marginBottom: '5px',
                    }}
                  >
                    Ad və Soyadınız *
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`,
                      padding: '0 14px',
                    }}
                  >
                    <User size={17} color={theme.textMuted} />
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Məs: Əli Əliyev"
                      required
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '14px',
                        color: theme.text,
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>

                {/* Mobil Nömrə */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: theme.text,
                      marginBottom: '5px',
                    }}
                  >
                    Mobil Nömrə *
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`,
                      padding: '0 14px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 800,
                        color: theme.textMuted,
                        marginRight: '6px',
                      }}
                    >
                      +994
                    </span>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      placeholder="50 123 45 67"
                      required
                      style={{
                        flex: 1,
                        padding: '12px 0',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '14px',
                        color: theme.text,
                        fontWeight: 700,
                      }}
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: theme.text,
                      marginBottom: '5px',
                    }}
                  >
                    Email ünvanı (İstəyə bağlı)
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`,
                      padding: '0 14px',
                    }}
                  >
                    <Mail size={17} color={theme.textMuted} />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nümunə@mail.com"
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '14px',
                        color: theme.text,
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>

                {/* Doğum tarixi */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: theme.text,
                      marginBottom: '5px',
                    }}
                  >
                    Doğum tarixi *
                  </label>
                  <SaharaDatePicker
                    value={regBirthDate}
                    onChange={setRegBirthDate}
                    theme={theme}
                    themeMode={themeMode}
                    placeholder="Doğum tarixinizi seçin"
                    minYear={1930}
                    maxYear={new Date().getFullYear()}
                  />
                </div>

                {/* Şifrə */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: theme.text,
                      marginBottom: '5px',
                    }}
                  >
                    Şifrə təyin edin *
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`,
                      padding: '0 14px',
                    }}
                  >
                    <Lock size={17} color={theme.textMuted} />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Ən azı 8 simvol"
                      required
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '14px',
                        color: theme.text,
                        fontWeight: 600,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((p) => !p)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.textMuted,
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <PasswordRequirements password={regPassword} theme={theme} />
                </div>

                {/* Şifrənin Təkrarı */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: theme.text,
                      marginBottom: '5px',
                    }}
                  >
                    Şifrəni təkrar daxil edin *
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`,
                      padding: '0 14px',
                    }}
                  >
                    <KeyRound size={17} color={theme.textMuted} />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Şifrəni təkrar yazın"
                      required
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '14px',
                        color: theme.text,
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>

                {/* Terms and Privacy Checkbox */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    color: theme.textSecondary,
                    fontWeight: 600,
                    lineHeight: 1.5,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={regTermsAccepted}
                    onChange={(e) => setRegTermsAccepted(e.target.checked)}
                    style={{
                      accentColor: '#dc2626',
                      width: '16px',
                      height: '16px',
                      marginTop: '2px',
                    }}
                  />
                  <span>
                    İstifadəçi qaydalarını və şəxsi məlumatların qorunması siyasətini qəbul edirəm.
                  </span>
                </label>

                {/* Submit Register Button */}
                <button
                  className="account-auth-submit"
                  type="submit"
                  style={{
                    padding: '14px 20px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(220, 38, 38, 0.10)',
                    color: '#dc2626',
                    border: 'none',
                    fontSize: '14.5px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s ease, transform 0.15s ease',
                  }}
                >
                  <span>Qeydiyyatı Tamamla</span>
                  <CheckCircle2 size={17} />
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Why Join Sahara & Security Trust Panel */}
          <div
            className="account-auth-benefits"
            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
          >
            <div
              className="account-auth-benefits-card"
              style={{
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                borderRadius: '24px',
                border: `1px solid ${theme.border}`,
                padding: 'clamp(24px, 3.5vw, 36px)',
                boxShadow: '0 12px 36px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(220, 38, 38, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={22} color="#dc2626" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: theme.text }}>
                    Sahara Şəxsi Hesabının Üstünlükləri
                  </h3>
                  <span style={{ fontSize: '12.5px', color: theme.textMuted }}>
                    Rahat, sürətli və fərdi xidmət imkanı
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(22, 163, 74, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Truck size={15} color="#16a34a" />
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: '0 0 2px 0',
                        fontSize: '14px',
                        fontWeight: 800,
                        color: theme.text,
                      }}
                    >
                      Tək Kliklə Sürətli Sifariş
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12.5px',
                        color: theme.textSecondary,
                        lineHeight: 1.5,
                      }}
                    >
                      Çatdırılma ünvanınızı bir dəfə yadda saxlayın, növbəti sifarişlərinizi tək
                      kliklə rəsmiləşdirin.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(2, 132, 199, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Package size={15} color="#0284c7" />
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: '0 0 2px 0',
                        fontSize: '14px',
                        fontWeight: 800,
                        color: theme.text,
                      }}
                    >
                      Sifarişlərin Canlı İzlənməsi
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12.5px',
                        color: theme.textSecondary,
                        lineHeight: 1.5,
                      }}
                    >
                      Sifarişinizin statusunu (anbarda yığılma, kuryerə verilmə) real vaxtda
                      izləyin.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(234, 179, 8, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={15} color="#ca8a04" />
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: '0 0 2px 0',
                        fontSize: '14px',
                        fontWeight: 800,
                        color: theme.text,
                      }}
                    >
                      Təsdiqlənmiş Müştəri Rəyləri
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12.5px',
                        color: theme.textSecondary,
                        lineHeight: 1.5,
                      }}
                    >
                      Yalnız qeydiyyatdan keçmiş istifadəçilər məhsullara rəy və reytinq bildirə
                      bilirlər.
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Banner */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
                  border: `1px solid ${theme.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <ShieldCheck size={26} color="#16a34a" />
                <div style={{ fontSize: '12px', color: theme.textSecondary, lineHeight: 1.4 }}>
                  <strong style={{ color: theme.text }}>Məxfilik qeydi:</strong> Bu interfeysdə
                  yaradılan profil məlumatları cari brauzerin lokal yaddaşında saxlanılır.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* CASE 2: AUTHENTICATED USER (Full-Page Dashboard Portal)      */
        /* ============================================================ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Hero User Card */}
          <div
            style={{
              padding: 'clamp(20px, 3vw, 32px)',
              borderRadius: '24px',
              backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : '#ffffff',
              border: `1px solid ${theme.border}`,
              boxShadow: '0 12px 36px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 900,
                  boxShadow: '0 6px 20px rgba(220, 38, 38, 0.35)',
                  flexShrink: 0,
                }}
              >
                {authUser.fullName.charAt(0).toUpperCase()}
              </div>

              <div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
                >
                  <h1
                    style={{
                      margin: 0,
                      fontSize: 'clamp(20px, 2.5vw, 26px)',
                      fontWeight: 900,
                      color: theme.text,
                    }}
                  >
                    {authUser.fullName}
                  </h1>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(220, 38, 38, 0.12)',
                      color: '#dc2626',
                      fontSize: '11.5px',
                      fontWeight: 800,
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Təsdiqlənmiş Müştəri</span>
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginTop: '6px',
                    flexWrap: 'wrap',
                    fontSize: '13.5px',
                    color: theme.textSecondary,
                  }}
                >
                  {authUser.phone && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Phone size={14} color={theme.textMuted} />
                      <span>+994 {authUser.phone}</span>
                    </span>
                  )}
                  {authUser.email && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Mail size={14} color={theme.textMuted} />
                      <span>{authUser.email}</span>
                    </span>
                  )}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: theme.textMuted,
                      fontSize: '12.5px',
                    }}
                  >
                    <Calendar size={13} />
                    <span>
                      Qeydiyyat: {new Date(authUser.registeredAt).toLocaleDateString('az-AZ')}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                backgroundColor: themeMode === 'dark' ? '#1e293b' : '#fef2f2',
                color: '#dc2626',
                border: `1px solid ${themeMode === 'dark' ? 'rgba(220,38,38,0.3)' : '#fecaca'}`,
                fontSize: '13.5px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <LogOut size={16} />
              <span>Hesabdan Çıxış et</span>
            </button>
          </div>

          {/* 4 Quick Stat Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Səbət Card */}
            <div
              onClick={() => onNavigate('cart')}
              style={{
                padding: '20px 24px',
                borderRadius: '18px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                border: `1px solid ${theme.border}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: theme.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Səbətimdə
                </div>
                <div
                  style={{ fontSize: '24px', fontWeight: 900, color: theme.text, marginTop: '2px' }}
                >
                  {cartCount} məhsul
                </div>
              </div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingCart size={22} color="#dc2626" />
              </div>
            </div>

            {/* Bəyəndiklərim Card */}
            <div
              onClick={() => onNavigate('favorites')}
              style={{
                padding: '20px 24px',
                borderRadius: '18px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                border: `1px solid ${theme.border}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: theme.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Seçilmişlərim
                </div>
                <div
                  style={{ fontSize: '24px', fontWeight: 900, color: theme.text, marginTop: '2px' }}
                >
                  {favoritesCount} məhsul
                </div>
              </div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Heart size={22} color="#dc2626" />
              </div>
            </div>

            {/* Sifarişlərim Card */}
            <div
              onClick={() => setActiveDashboardTab('orders')}
              style={{
                padding: '20px 24px',
                borderRadius: '18px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                border: `1px solid ${theme.border}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: theme.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Sifarişlərim
                </div>
                <div
                  style={{ fontSize: '24px', fontWeight: 900, color: theme.text, marginTop: '2px' }}
                >
                  {userOrders.length} ədəd
                </div>
              </div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(2, 132, 199, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Package size={22} color="#0284c7" />
              </div>
            </div>

            {/* Ünvanlar Card */}
            <div
              onClick={() => setActiveDashboardTab('addresses')}
              style={{
                padding: '20px 24px',
                borderRadius: '18px',
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                border: `1px solid ${theme.border}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: theme.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Çatdırılma Ünvanı
                </div>
                <div
                  style={{ fontSize: '24px', fontWeight: 900, color: theme.text, marginTop: '2px' }}
                >
                  {userAddresses.length} qeyd
                </div>
              </div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MapPin size={22} color="#8b5cf6" />
              </div>
            </div>
          </div>

          {/* Dashboard Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: `2px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              overflowX: 'auto',
            }}
            className="no-scrollbar"
          >
            <button
              type="button"
              aria-label="Tab: Profil Məlumatları"
              onClick={() => setActiveDashboardTab('profile')}
              style={{
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                fontSize: '14.5px',
                fontWeight: 800,
                color: activeDashboardTab === 'profile' ? '#dc2626' : theme.textSecondary,
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <User size={17} />
              <span>Profil Məlumatları</span>
              {activeDashboardTab === 'profile' && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: '#dc2626',
                  }}
                />
              )}
            </button>

            <button
              type="button"
              aria-label="Tab: Sifarişlərim & İzləmə"
              onClick={() => setActiveDashboardTab('orders')}
              style={{
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                fontSize: '14.5px',
                fontWeight: 800,
                color: activeDashboardTab === 'orders' ? '#dc2626' : theme.textSecondary,
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <Package size={17} />
              <span>Sifarişlərim & İzləmə</span>
              {activeDashboardTab === 'orders' && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: '#dc2626',
                  }}
                />
              )}
            </button>

            <button
              type="button"
              aria-label="Tab: Çatdırılma Ünvanlarım"
              onClick={() => setActiveDashboardTab('addresses')}
              style={{
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                fontSize: '14.5px',
                fontWeight: 800,
                color: activeDashboardTab === 'addresses' ? '#dc2626' : theme.textSecondary,
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <MapPin size={17} />
              <span>Çatdırılma Ünvanlarım</span>
              {activeDashboardTab === 'addresses' && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: '#dc2626',
                  }}
                />
              )}
            </button>

            <button
              type="button"
              aria-label="Tab: Təhlükəsizlik & Şifrə"
              onClick={() => setActiveDashboardTab('security')}
              style={{
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                fontSize: '14.5px',
                fontWeight: 800,
                color: activeDashboardTab === 'security' ? '#dc2626' : theme.textSecondary,
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <Lock size={17} />
              <span>Təhlükəsizlik & Şifrə</span>
              {activeDashboardTab === 'security' && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: '#dc2626',
                  }}
                />
              )}
            </button>

            <button
              type="button"
              aria-label="Tab: Dəstək & Əlaqə"
              onClick={() => setActiveDashboardTab('support')}
              style={{
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                fontSize: '14.5px',
                fontWeight: 800,
                color: activeDashboardTab === 'support' ? '#dc2626' : theme.textSecondary,
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <HelpCircle size={17} />
              <span>Dəstək & Əlaqə</span>
              {activeDashboardTab === 'support' && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: '#dc2626',
                  }}
                />
              )}
            </button>
          </div>

          {/* TAB 1 CONTENT: PROFILE EDIT */}
          {activeDashboardTab === 'profile' && (
            <div
              style={{
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                borderRadius: '20px',
                border: `1px solid ${theme.border}`,
                padding: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: theme.text }}>
                    Şəxsi Məlumatlar
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: theme.textSecondary }}>
                    Sifarişlərin və çatdırılmanın dəqiq icrası üçün məlumatlarınızı yeniləyin.
                  </p>
                </div>

                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
                      color: theme.text,
                      border: `1px solid ${theme.border}`,
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Edit3 size={15} />
                    <span>Redaktə et</span>
                  </button>
                )}
              </div>

              {editSuccessMsg && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(220, 38, 38, 0.12)',
                    color: '#dc2626',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

              {isEditingProfile ? (
                <form
                  onSubmit={handleSaveProfile}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '20px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        color: theme.text,
                        marginBottom: '6px',
                      }}
                    >
                      Ad və Soyad *
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '12px',
                        border: `1px solid ${theme.border}`,
                        backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                        color: theme.text,
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        color: theme.text,
                        marginBottom: '6px',
                      }}
                    >
                      Email Ünvanı
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="email@example.com"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '12px',
                        border: `1px solid ${theme.border}`,
                        backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                        color: theme.text,
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Luxury Sahara Custom Calendar Date Picker */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        color: theme.text,
                        marginBottom: '6px',
                      }}
                    >
                      Doğum Tarixi
                    </label>
                    <SaharaDatePicker
                      value={editBirthDate}
                      onChange={(date) => setEditBirthDate(date)}
                      theme={theme}
                      themeMode={themeMode}
                      placeholder="Təqvimdən seçin"
                    />
                  </div>

                  <div
                    style={{
                      gridColumn: '1 / -1',
                      display: 'flex',
                      gap: '12px',
                      marginTop: '10px',
                    }}
                  >
                    <button
                      type="submit"
                      className="sahara-soft-red-action"
                      style={{
                        padding: '11px 24px',
                        borderRadius: '12px',
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Save size={16} />
                      <span>Məlumatları Saxla</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      style={{
                        padding: '11px 20px',
                        borderRadius: '12px',
                        backgroundColor: 'transparent',
                        color: theme.textSecondary,
                        border: `1px solid ${theme.border}`,
                        fontSize: '13.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Ləğv et
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: theme.textMuted }}>
                      Ad və Soyad
                    </div>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: theme.text,
                        marginTop: '3px',
                      }}
                    >
                      {authUser.fullName}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: theme.textMuted }}>
                      Mobil Nömrə
                    </div>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: theme.text,
                        marginTop: '3px',
                      }}
                    >
                      +994 {authUser.phone}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: theme.textMuted }}>
                      Email Ünvanı
                    </div>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: theme.text,
                        marginTop: '3px',
                      }}
                    >
                      {authUser.email || 'Qeyd edilməyib'}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: theme.textMuted }}>
                      Doğum Tarixi
                    </div>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: theme.text,
                        marginTop: '3px',
                      }}
                    >
                      {authUser.birthDate || 'Qeyd edilməyib'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2 CONTENT: ORDERS & TRACKING */}
          {activeDashboardTab === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Dynamic Orders Overview & Search Guidance Card */}
              {userOrders.length > 0 ? (
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    backgroundColor:
                      themeMode === 'dark' ? 'rgba(220, 38, 38, 0.12)' : 'rgba(220, 38, 38, 0.08)',
                    border: `1px solid ${themeMode === 'dark' ? 'rgba(220, 38, 38, 0.3)' : '#fecaca'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Package size={18} />
                  </div>
                  <div style={{ fontSize: '13px', color: theme.text, lineHeight: 1.5 }}>
                    <strong style={{ color: '#dc2626' }}>Aktiv Sifarişləriniz mövcuddur:</strong>{' '}
                    Bütün cari və tamamlanmış sifarişləriniz aşağıdakı siyahıda əks olunub. Əgər
                    əlavə və ya fərqli sifariş qəbziniz varsa, kodu aşağıdakı xanaya daxil edərək
                    onu da dərhal axtara bilərsiniz.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    backgroundColor:
                      themeMode === 'dark' ? 'rgba(2, 132, 199, 0.12)' : 'rgba(2, 132, 199, 0.08)',
                    border: `1px solid ${themeMode === 'dark' ? 'rgba(2, 132, 199, 0.3)' : '#bae6fd'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Info size={18} />
                  </div>
                  <div style={{ fontSize: '13px', color: theme.text, lineHeight: 1.5 }}>
                    <strong style={{ color: '#0284c7' }}>Sifariş Məlumatı:</strong> Hazırda
                    qeydiyyatınızda aktiv sifariş tapılmadı. Əgər mağazada, telefonla və ya qapıda
                    sifariş etmisinizsə, sizə təqdim olunan sifariş kodunu daxil edərək statusu
                    izləyə bilərsiniz.
                  </div>
                </div>
              )}

              {/* Sifariş İzləmə Axtarış Qutusu */}
              <div
                style={{
                  backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                  borderRadius: '20px',
                  border: `1px solid ${theme.border}`,
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '8px',
                  }}
                >
                  <PackageSearch size={20} color="#dc2626" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: theme.text }}>
                    Sifariş Kodu ilə Axtarış və Canlı İzləmə
                  </h3>
                </div>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: theme.textSecondary }}>
                  Kuryer və ya menecer tərəfindən sizə verilən qəbz kodunu (məsələn:{' '}
                  <strong>SHR-8822</strong>) daxil edin.
                </p>

                <form
                  onSubmit={handleTrackOrder}
                  style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
                >
                  <input
                    type="text"
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                    placeholder="Məs: SHR-8822"
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`,
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                      color: theme.text,
                      fontSize: '14px',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(220, 38, 38, 0.10)',
                      color: '#dc2626',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    İzlə
                  </button>
                </form>

                {orderTrackResult && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '14px 18px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(220, 38, 38, 0.12)',
                      color: '#dc2626',
                      fontSize: '13.5px',
                      fontWeight: 700,
                    }}
                  >
                    {orderTrackResult}
                  </div>
                )}
              </div>

              {/* Sifarişlərin Siyahısı */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: theme.text }}>
                  Sifariş Tarixçəsi ({userOrders.length})
                </h3>

                {userOrders.length > 0 ? (
                  userOrders.map((o) => (
                    <div
                      key={o.id}
                      style={{
                        padding: '20px 24px',
                        borderRadius: '16px',
                        backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                        border: `1px solid ${theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 900, color: theme.text }}>
                            #{o.orderNumber}
                          </span>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(2, 132, 199, 0.12)',
                              color: '#0284c7',
                              fontSize: '12px',
                              fontWeight: 800,
                            }}
                          >
                            {o.statusText}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '4px' }}>
                          Tarix: {o.date} · {o.itemsCount} məhsul
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: theme.text }}>
                          {o.totalAmount} ₼
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: '36px',
                      borderRadius: '16px',
                      backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.2)' : '#f8fafc',
                      border: `1px dashed ${theme.border}`,
                      textAlign: 'center',
                      color: theme.textMuted,
                      fontSize: '14px',
                    }}
                  >
                    Hələlik heç bir tamamlanmış sifarişiniz qeydiyyata alınmayıb.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3 CONTENT: ADDRESSES */}
          {activeDashboardTab === 'addresses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: theme.text }}>
                    Çatdırılma Ünvanlarım
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: theme.textSecondary }}>
                    Kuryerin sizə rahat çatması üçün ünvanları idarə edin.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddAddress((p) => !p)}
                  className="sahara-soft-red-action"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} />
                  <span>Yeni Ünvan Əlavə Et</span>
                </button>
              </div>

              {/* Add Address Form Modal/Drawer */}
              {showAddAddress && (
                <form
                  onSubmit={handleAddAddress}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f1f5f9',
                    border: `1px solid ${theme.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: theme.text }}>
                    Yeni Çatdırılma Ünvanı
                  </h4>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: theme.text,
                          marginBottom: '4px',
                        }}
                      >
                        Ünvan növü (Adı)
                      </label>
                      <input
                        type="text"
                        value={newAddrTitle}
                        onChange={(e) => setNewAddrTitle(e.target.value)}
                        placeholder="Məs: Ev, İş yeri, Bağ evi"
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${theme.border}`,
                          backgroundColor: themeMode === 'dark' ? '#1e293b' : '#ffffff',
                          color: theme.text,
                          fontSize: '13.5px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: theme.text,
                          marginBottom: '4px',
                        }}
                      >
                        Şəhər / Rayon
                      </label>
                      <input
                        type="text"
                        value={newAddrCity}
                        onChange={(e) => setNewAddrCity(e.target.value)}
                        placeholder="Məs: Bakı, Sumqayıt"
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${theme.border}`,
                          backgroundColor: themeMode === 'dark' ? '#1e293b' : '#ffffff',
                          color: theme.text,
                          fontSize: '13.5px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: theme.text,
                        marginBottom: '4px',
                      }}
                    >
                      Dəqiq Ünvan (Küçə, bina, mənzil) *
                    </label>
                    <textarea
                      value={newAddrText}
                      onChange={(e) => setNewAddrText(e.target.value)}
                      placeholder="Məs: Nəsimi r-nu, Nizami küç. 45, mənzil 12"
                      required
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${theme.border}`,
                        backgroundColor: themeMode === 'dark' ? '#1e293b' : '#ffffff',
                        color: theme.text,
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(220, 38, 38, 0.10)',
                        color: '#dc2626',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      Əlavə et
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '10px',
                        backgroundColor: 'transparent',
                        color: theme.textSecondary,
                        border: `1px solid ${theme.border}`,
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Ləğv et
                    </button>
                  </div>
                </form>
              )}

              {/* Address Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {userAddresses.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                      border: `1px solid ${theme.border}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={16} color="#dc2626" />
                          <span style={{ fontSize: '15px', fontWeight: 800, color: theme.text }}>
                            {a.title} ({a.city})
                          </span>
                        </div>
                        {a.isDefault && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: '#dc2626',
                              backgroundColor: 'rgba(220,38,38,0.12)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            Əsas Ünvan
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: '8px 0 0 0',
                          fontSize: '13.5px',
                          color: theme.textSecondary,
                          lineHeight: 1.5,
                        }}
                      >
                        {a.address}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(a.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Sil</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4 CONTENT: SECURITY & PASSWORD */}
          {activeDashboardTab === 'security' && (
            <div
              style={{
                backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                borderRadius: '20px',
                border: `1px solid ${theme.border}`,
                padding: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                maxWidth: '560px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: theme.text,
                }}
              >
                Şifrənin Dəyişdirilməsi
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: theme.textSecondary }}>
                Hesabınızın təhlükəsizliyi üçün mütəmadi olaraq güclü şifrə təyin edin.
              </p>

              {passwordChangeSuccess && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(220, 38, 38, 0.12)',
                    color: '#dc2626',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    marginBottom: '16px',
                  }}
                >
                  {passwordChangeSuccess}
                </div>
              )}

              {passwordChangeError && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(220, 38, 38, 0.12)',
                    color: '#dc2626',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    marginBottom: '16px',
                  }}
                >
                  {passwordChangeError}
                </div>
              )}

              <form
                onSubmit={handleChangePassword}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      color: theme.text,
                      marginBottom: '6px',
                    }}
                  >
                    Cari Şifrə *
                  </label>
                  <input
                    type="password"
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${theme.border}`,
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                      color: theme.text,
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      color: theme.text,
                      marginBottom: '6px',
                    }}
                  >
                    Yeni Şifrə *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${theme.border}`,
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                      color: theme.text,
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <PasswordRequirements password={newPassword} theme={theme} />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      color: theme.text,
                      marginBottom: '6px',
                    }}
                  >
                    Yeni Şifrənin Təkrarı *
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${theme.border}`,
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                      color: theme.text,
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(220, 38, 38, 0.10)',
                    color: '#dc2626',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    marginTop: '8px',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  Şifrəni Yenilə
                </button>
              </form>
            </div>
          )}

          {/* TAB 5 CONTENT: SUPPORT & CHANNELS */}
          {activeDashboardTab === 'support' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {/* WhatsApp Live Support Card */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                  border: `1px solid ${theme.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(37, 211, 102, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <WhatsAppIcon size={22} color="#25D366" />
                </div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: theme.text }}>
                  WhatsApp ilə Canlı Dəstək
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: theme.textSecondary,
                    lineHeight: 1.5,
                  }}
                >
                  Məhsul seçimi, sifarişinizin vəziyyəti və ya çatdırılma detalları ilə bağlı
                  menecerimizlə dərhal əlaqə saxlayın.
                </p>
                <button
                  type="button"
                  onClick={onWhatsAppSupport}
                  style={{
                    padding: '11px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    color: '#16a34a',
                    border: 'none',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <WhatsAppIcon size={16} color="#16a34a" />
                  <span>WhatsApp-da Yaz</span>
                </button>
              </div>

              {/* Call Support Card */}
              <div
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
                  border: `1px solid ${theme.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(220, 38, 38, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Phone size={22} color="#dc2626" />
                </div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: theme.text }}>
                  Zəng Xidməti
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: theme.textSecondary,
                    lineHeight: 1.5,
                  }}
                >
                  Hər gün 09:00 - 20:00 arası qaynar xəttimiz sizin xidmətinizdədir.
                </p>
                <button
                  type="button"
                  onClick={onCallSupport}
                  style={{
                    padding: '11px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(220, 38, 38, 0.10)',
                    color: '#dc2626',
                    border: 'none',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <Phone size={16} color="#dc2626" />
                  <span>Zəng et</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
