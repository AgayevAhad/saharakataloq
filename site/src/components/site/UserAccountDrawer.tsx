import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  ShoppingBag,
  Heart,
  MapPin,
  ShieldCheck,
  Headphones,
  Moon,
  Sun,
  ChevronRight,
  Phone,
  Package,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  LogOut,
  Sparkles,
  UserPlus,
  LogIn,
  Edit3,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ThemeColors, ThemeMode, DESIGN_TOKENS } from '../../types/theme';
import { AuthUser, LoginCredentials, RegisterCredentials } from '../../types/auth';

interface UserAccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeColors;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onNavigate: (route: string, param?: string) => void;
  cartCount: number;
  favoritesCount: number;
  onWhatsAppSupport?: () => void;
  authUser: AuthUser | null;
  onLogin: (credentials: LoginCredentials) => boolean | Promise<boolean>;
  onRegister: (credentials: RegisterCredentials) => boolean | Promise<boolean>;
  onLogout: () => void;
  onUpdateProfile?: (updated: Partial<AuthUser>) => void;
}

export const UserAccountDrawer: React.FC<UserAccountDrawerProps> = ({
  isOpen,
  onClose,
  theme,
  themeMode,
  onToggleTheme,
  onNavigate,
  cartCount,
  favoritesCount,
  onWhatsAppSupport: _onWhatsAppSupport,
  authUser,
  onLogin,
  onRegister,
  onLogout,
  onUpdateProfile,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Order Tracking
  const [orderTrackCode, setOrderTrackCode] = useState('');
  const [orderTrackResult, setOrderTrackResult] = useState<string | null>(null);

  // Sync edit fields when user logs in
  useEffect(() => {
    if (authUser) {
      setEditName(authUser.fullName);
      setEditEmail(authUser.email || '');
    }
  }, [authUser]);

  // Handle ESC key to close drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLoginFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier.trim()) {
      setLoginError('Zəhmət olmasa telefon nömrəsi və ya email daxil edin.');
      return;
    }

    if (!loginPassword || loginPassword.length < 4) {
      setLoginError('Şifrə minimum 4 simvol olmalıdır.');
      return;
    }

    try {
      const ok = await onLogin({
        identifier: loginIdentifier.trim(),
        password: loginPassword,
      });

      if (!ok) {
        setLoginError('Giriş məlumatları yanlışdır. Zəhmət olmasa yenidən yoxlayın.');
      } else {
        setLoginPassword('');
        setLoginError('');
      }
    } catch {
      setLoginError('Giriş zamanı xəta baş verdi.');
    }
  };

  const handleRegisterFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regFullName.trim() || regFullName.trim().length < 3) {
      setRegError('Zəhmət olmasa tam ad və soyadınızı daxil edin.');
      return;
    }

    const cleanPhone = regPhone.replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      setRegError('Düzgün mobil nömrə daxil edin (məs: 50 123 45 67).');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setRegError('Şifrə ən azı 6 simvoldan ibarət olmalıdır.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Daxil edilən şifrələr bir-biri ilə eyni deyil.');
      return;
    }

    if (!termsAccepted) {
      setRegError('Qeydiyyat üçün istifadəçi qaydalarını qəbul etməlisiniz.');
      return;
    }

    try {
      const ok = await onRegister({
        fullName: regFullName.trim(),
        phone: cleanPhone,
        email: regEmail.trim() || undefined,
        password: regPassword,
        termsAccepted,
      });

      if (ok) {
        setRegSuccess('Hesabınız uğurla yaradıldı!');
        setRegFullName('');
        setRegPhone('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
      }
    } catch {
      setRegError('Qeydiyyat zamanı xəta baş verdi.');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    if (onUpdateProfile) {
      onUpdateProfile({
        fullName: editName.trim(),
        email: editEmail.trim() || undefined,
      });
      setEditSuccess('Profil məlumatları yeniləndi.');
      setIsEditingProfile(false);
      setTimeout(() => setEditSuccess(''), 3000);
    }
  };

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderTrackCode.trim()) return;
    setOrderTrackResult(
      `Sifariş #${orderTrackCode.toUpperCase()}: Sistemdə qeydiyyatdadır. Sahara rəsmi kuryeri tərəfindən 24 saat ərzində çatdırılacaqdır.`
    );
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { text: '', color: '#cbd5e1', width: '0%' };
    if (pass.length < 6) return { text: 'Zəif', color: '#ef4444', width: '30%' };
    if (pass.length < 9) return { text: 'Orta', color: '#f59e0b', width: '65%' };
    return { text: 'Güclü', color: '#10b981', width: '100%' };
  };

  const passStrength = getPasswordStrength(regPassword);

  return (
    <>
      {/* Dark frosted Backdrop overlay */}
      <div
        className="user-drawer-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(10px) saturate(160%)',
          WebkitBackdropFilter: 'blur(10px) saturate(160%)',
          zIndex: DESIGN_TOKENS.zIndex.modal + 20,
          animation: 'fadeIn 0.2s ease forwards',
        }}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <div
        className="user-account-drawer"
        role="dialog"
        aria-label="İstifadəçi Kabineti və Hesab Paneli"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '440px',
          height: '100vh',
          backgroundColor: themeMode === 'dark' ? '#0b111e' : '#ffffff',
          color: theme.text,
          boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.35)',
          zIndex: DESIGN_TOKENS.zIndex.modal + 25,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'}`,
            position: 'sticky',
            top: 0,
            backgroundColor: themeMode === 'dark' ? '#0b111e' : '#ffffff',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: authUser ? '#dc2626' : 'rgba(220, 38, 38, 0.12)',
                color: authUser ? '#ffffff' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '16px',
                boxShadow: authUser ? '0 4px 12px rgba(220, 38, 38, 0.3)' : 'none',
              }}
            >
              {authUser ? authUser.fullName.charAt(0).toUpperCase() : <User size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: theme.text }}>
                {authUser ? authUser.fullName : 'İstifadəçi Kabineti'}
              </h3>
              <span style={{ fontSize: '12px', color: theme.textMuted }}>
                {authUser
                  ? authUser.phone
                    ? `+994 ${authUser.phone}`
                    : authUser.email || 'Sahara Müştərisi'
                  : 'Xoş gəlmisiniz! Daxil olun və ya qeydiyyatdan keçin'}
              </span>

            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Temanı dəyiş"
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px',
                borderRadius: '50%',
                color: theme.textMuted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Gündüz / Gecə rejimi"
            >
              {themeMode === 'dark' ? <Sun size={18} color="#eab308" /> : <Moon size={18} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Bağla"
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px',
                borderRadius: '50%',
                color: theme.textMuted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          {/* Quick Action Stats Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              padding: '12px',
              borderRadius: '14px',
              backgroundColor: themeMode === 'dark' ? '#131b2c' : '#f8fafc',
              border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
            }}
          >
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('cart');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
              }}
            >
              <div style={{ position: 'relative' }}>
                <ShoppingBag size={20} color="#dc2626" />
                {cartCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-8px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 800,
                      width: '15px',
                      height: '15px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: theme.text }}>Səbətim</span>
              <span style={{ fontSize: '10px', color: theme.textMuted }}>{cartCount} məhsul</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('favorites');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Heart size={20} color="#ef4444" fill={favoritesCount > 0 ? '#ef4444' : 'none'} />
                {favoritesCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-8px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 800,
                      width: '15px',
                      height: '15px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {favoritesCount}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: theme.text }}>Seçilmişlər</span>
              <span style={{ fontSize: '10px', color: theme.textMuted }}>{favoritesCount} model</span>
            </button>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '6px',
              }}
            >
              <Package size={20} color="#3b82f6" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: theme.text }}>Sifarişlər</span>
              <span style={{ fontSize: '10px', color: theme.textMuted }}>Rəsmi çatdırılma</span>
            </div>
          </div>

          {/* If NOT LOGGED IN: Show Login / Register Switcher */}
          {!authUser ? (
            <div
              style={{
                padding: '18px',
                borderRadius: '16px',
                backgroundColor: themeMode === 'dark' ? '#131b2c' : '#f8fafc',
                border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              }}
            >
              {/* Segmented Switcher for Login vs Register */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  backgroundColor: themeMode === 'dark' ? '#0b111e' : '#e2e8f0',
                  padding: '4px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLoginError('');
                    setRegError('');
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: authMode === 'login' ? (themeMode === 'dark' ? '#1e293b' : '#ffffff') : 'transparent',
                    color: authMode === 'login' ? '#dc2626' : theme.textMuted,
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: authMode === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <LogIn size={14} />
                  <span>Daxil ol</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setLoginError('');
                    setRegError('');
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: authMode === 'register' ? (themeMode === 'dark' ? '#1e293b' : '#ffffff') : 'transparent',
                    color: authMode === 'register' ? '#dc2626' : theme.textMuted,
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: authMode === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <UserPlus size={14} />
                  <span>Qeydiyyat</span>
                </button>
              </div>

              {/* Login Form */}
              {authMode === 'login' ? (
                <form onSubmit={handleLoginFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {loginError && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        color: '#ef4444',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertCircle size={15} />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>
                      Telefon nömrəsi və ya Email *
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: themeMode === 'dark' ? '#0f172a' : '#ffffff',
                        borderRadius: '8px',
                        border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                        padding: '0 12px',
                      }}
                    >
                      <Phone size={15} color={theme.textMuted} style={{ marginRight: '8px' }} />
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="50 123 45 67 və ya email"
                        required
                        style={{
                          width: '100%',
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          fontSize: '13px',
                          color: theme.text,
                          padding: '10px 0',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>
                      Şifrə *
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: themeMode === 'dark' ? '#0f172a' : '#ffffff',
                        borderRadius: '8px',
                        border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                        padding: '0 12px',
                      }}
                    >
                      <Lock size={15} color={theme.textMuted} style={{ marginRight: '8px' }} />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Şifrəniz"
                        required
                        style={{
                          width: '100%',
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          fontSize: '13px',
                          color: theme.text,
                          padding: '10px 0',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((p) => !p)}
                        style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: '4px' }}
                      >
                        {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '11px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '4px',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                    }}
                  >
                    <span>Daxil ol</span>
                    <ArrowRight size={15} />
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '12px', cursor: 'pointer' }}
                    >
                      Hesabınız yoxdur? <span style={{ color: '#dc2626', fontWeight: 700 }}>Qeydiyyatdan keçin</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegisterFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                  {regError && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        color: '#ef4444',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertCircle size={15} />
                      <span>{regError}</span>
                    </div>
                  )}

                  {regSuccess && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(22, 163, 74, 0.12)',
                        color: '#16a34a',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Check size={15} />
                      <span>{regSuccess}</span>
                    </div>
                  )}

                  {/* Ad və Soyad */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: theme.text, marginBottom: '3px' }}>
                      Ad və Soyad *
                    </label>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Məs: Əli Əliyev"
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                        backgroundColor: themeMode === 'dark' ? '#0f172a' : '#ffffff',
                        color: theme.text,
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Mobil Nömrə */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: theme.text, marginBottom: '3px' }}>
                      Mobil Nömrə *
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: themeMode === 'dark' ? '#0f172a' : '#ffffff',
                        borderRadius: '8px',
                        border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                        padding: '0 10px',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 800, color: theme.textMuted, marginRight: '4px' }}>
                        +994
                      </span>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                        placeholder="50 123 45 67"
                        required
                        style={{
                          width: '100%',
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          fontSize: '13px',
                          color: theme.text,
                          padding: '9px 0',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: theme.text, marginBottom: '3px' }}>
                      Email ünvanı (İstəyə görə)
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nümunə@mail.com"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                        backgroundColor: themeMode === 'dark' ? '#0f172a' : '#ffffff',
                        color: theme.text,
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Şifrə */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: theme.text, marginBottom: '3px' }}>
                      Şifrə (min. 6 simvol) *
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: themeMode === 'dark' ? '#0f172a' : '#ffffff',
                        borderRadius: '8px',
                        border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                        padding: '0 10px',
                      }}
                    >
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Şifrə təyin edin"
                        required
                        style={{
                          width: '100%',
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          fontSize: '13px',
                          color: theme.text,
                          padding: '9px 0',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword((p) => !p)}
                        style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: '4px' }}
                      >
                        {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {/* Strength meter */}
                    {regPassword && (
                      <div style={{ marginTop: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: theme.textMuted, marginBottom: '2px' }}>
                          <span>Şifrə gücü:</span>
                          <span style={{ color: passStrength.color, fontWeight: 700 }}>{passStrength.text}</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', borderRadius: '2px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                          <div style={{ width: passStrength.width, height: '100%', backgroundColor: passStrength.color, transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Şifrə Təkrarı */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: theme.text, marginBottom: '3px' }}>
                      Şifrənin Təkrarı *
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Şifrəni təkrar daxil edin"
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                        backgroundColor: themeMode === 'dark' ? '#0f172a' : '#ffffff',
                        color: theme.text,
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Terms */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: theme.textSecondary, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      style={{ accentColor: '#dc2626' }}
                    />
                    <span>İstifadəçi şərtləri və məxfilik qaydaları ilə razıyam</span>
                  </label>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '11px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '4px',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                    }}
                  >
                    <span>Qeydiyyatı Tamamla</span>
                    <ArrowRight size={15} />
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '12px', cursor: 'pointer' }}
                    >
                      Artıq hesabınız var? <span style={{ color: '#dc2626', fontWeight: 700 }}>Daxil olun</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Logged-In User Profile Hub */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: themeMode === 'dark' ? '#131b2c' : '#f8fafc',
                  border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="#dc2626" />
                    <span style={{ fontSize: '13.5px', fontWeight: 800, color: theme.text }}>Şəxsi Profil</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile((p) => !p)}
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
                    <Edit3 size={13} />
                    <span>{isEditingProfile ? 'Ləğv et' : 'Redaktə et'}</span>
                  </button>
                </div>

                {editSuccess && (
                  <div
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(22, 163, 74, 0.12)',
                      color: '#16a34a',
                      fontSize: '12px',
                      fontWeight: 700,
                      marginBottom: '10px',
                    }}
                  >
                    ✓ {editSuccess}
                  </div>
                )}

                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: theme.textMuted, marginBottom: '2px' }}>
                        Ad və Soyad
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                          backgroundColor: themeMode === 'dark' ? '#0f172a' : '#ffffff',
                          color: theme.text,
                          fontSize: '12.5px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: theme.textMuted, marginBottom: '2px' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="email@domain.com"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                          backgroundColor: themeMode === 'dark' ? '#0f172a' : '#ffffff',
                          color: theme.text,
                          fontSize: '12.5px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{
                        padding: '9px 14px',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Məlumatları Saxla
                    </button>
                  </form>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: theme.textMuted }}>Ad Soyad:</span>
                      <span style={{ fontWeight: 700, color: theme.text }}>{authUser.fullName}</span>
                    </div>
                    {authUser.phone && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: theme.textMuted }}>Telefon:</span>
                        <span style={{ fontWeight: 700, color: theme.text }}>+994 {authUser.phone}</span>
                      </div>
                    )}
                    {authUser.email && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: theme.textMuted }}>Email:</span>
                        <span style={{ fontWeight: 700, color: theme.text }}>{authUser.email}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: theme.textMuted }}>Hesab Statusu:</span>
                      <span style={{ fontWeight: 800, color: '#16a34a' }}>✓ Aktiv Müştəri</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <LogOut size={15} />
                <span>Hesabdan Çıxış et</span>
              </button>
            </div>
          )}

          {/* Quick Navigation Menu Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.textMuted, margin: '4px 0' }}>
              Xidmətlər və Səhifələr
            </span>

            {/* Səbətim */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('cart');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'transparent',
                border: 'none',
                color: theme.text,
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShoppingBag size={18} color="#dc2626" />
                <span>Səbətim və Sifariş</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {cartCount > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.12)', padding: '2px 8px', borderRadius: '999px' }}>
                    {cartCount} ədəd
                  </span>
                )}
                <ChevronRight size={16} color={theme.textMuted} />
              </div>
            </button>

            {/* Seçilmiş Məhsullar */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('favorites');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'transparent',
                border: 'none',
                color: theme.text,
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Heart size={18} color="#ef4444" />
                <span>Bəyəndiyim Məhsullar</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {favoritesCount > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.12)', padding: '2px 8px', borderRadius: '999px' }}>
                    {favoritesCount} model
                  </span>
                )}
                <ChevronRight size={16} color={theme.textMuted} />
              </div>
            </button>

            {/* Mağazalarımız */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('stores');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'transparent',
                border: 'none',
                color: theme.text,
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MapPin size={18} color="#3b82f6" />
                <span>Mağazalar & Sərgi Salonları</span>
              </div>
              <ChevronRight size={16} color={theme.textMuted} />
            </button>

            {/* Servis və Zəmanət */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('services');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'transparent',
                border: 'none',
                color: theme.text,
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldCheck size={18} color="#16a34a" />
                <span>Rəsmi Servis və Zəmanət</span>
              </div>
              <ChevronRight size={16} color={theme.textMuted} />
            </button>

            {/* Müştəri Dəstəyi */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('support');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'transparent',
                border: 'none',
                color: theme.text,
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Headphones size={18} color="#8b5cf6" />
                <span>Müştəri Dəstəyi və FAQ</span>
              </div>
              <ChevronRight size={16} color={theme.textMuted} />
            </button>
          </div>

          {/* Sifariş İzləmə Modulu */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: themeMode === 'dark' ? '#131b2c' : '#f8fafc',
              border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.textMuted }}>
              Sifarişinizi İzləyin
            </span>
            <form onSubmit={handleTrackOrder} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <input
                type="text"
                value={orderTrackCode}
                onChange={(e) => setOrderTrackCode(e.target.value)}
                placeholder="Sifariş kodu (məs: SHR-9021)"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1'}`,
                  backgroundColor: themeMode === 'dark' ? '#0f172a' : '#ffffff',
                  color: theme.text,
                  fontSize: '12.5px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Yoxla
              </button>
            </form>
            {orderTrackResult && (
              <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#16a34a', fontWeight: 600 }}>
                {orderTrackResult}
              </div>
            )}
          </div>

          {/* WhatsApp Direct Support Button */}
          {_onWhatsAppSupport && (
            <button
              type="button"
              onClick={_onWhatsAppSupport}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#25D366',
                color: '#ffffff',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
              }}
            >
              <Phone size={16} />
              <span>WhatsApp ilə Canlı Əlaqə</span>
            </button>
          )}

          {/* Theme Quick Switcher Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: themeMode === 'dark' ? '#131b2c' : '#f8fafc',
              border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {themeMode === 'dark' ? <Moon size={16} color="#eab308" /> : <Sun size={16} color="#f59e0b" />}
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: theme.text }}>
                {themeMode === 'dark' ? 'Gecə Rejimi' : 'Gündüz Rejimi'}
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                backgroundColor: themeMode === 'dark' ? '#1e293b' : '#ffffff',
                color: theme.text,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Dəyişdir
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

