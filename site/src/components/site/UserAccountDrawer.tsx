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
  ArrowRight,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { ThemeColors, ThemeMode, DESIGN_TOKENS } from '../../types/theme';

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
  onWhatsAppSupport,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [loginStep, setLoginStep] = useState<'phone' | 'otp'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [orderTrackCode, setOrderTrackCode] = useState('');
  const [orderTrackResult, setOrderTrackResult] = useState<string | null>(null);

  // Load saved guest profile if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('sahara_user_profile');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.phone) {
            setPhoneNumber(parsed.phone);
            setUserName(parsed.name || 'Sahara Müştərisi');
            setIsLoggedIn(true);
          }
        }
      } catch {}
    }
  }, []);

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

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim().length >= 9) {
      setLoginStep('otp');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length >= 4) {
      setIsLoggedIn(true);
      const name = 'Sahara VIP Müştəri';
      setUserName(name);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            'sahara_user_profile',
            JSON.stringify({ phone: phoneNumber, name, loggedInAt: new Date().toISOString() })
          );
        } catch {}
      }
      setLoginStep('phone');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    setPhoneNumber('');
    setOtpCode('');
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('sahara_user_profile');
      } catch {}
    }
  };

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderTrackCode.trim()) return;
    setOrderTrackResult(
      `Sifariş #${orderTrackCode.toUpperCase()}: Hazırlanır və 24 saat ərzində çatdırılacaqdır (Rəsmi Sahara Kuryer).`
    );
  };

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
          maxWidth: '420px',
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
            padding: '20px 24px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'rgba(227, 30, 36, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e31e24',
              }}
            >
              <User size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: theme.text }}>
                {isLoggedIn ? userName : 'İstifadəçi Kabineti'}
              </h3>
              <span style={{ fontSize: '11.5px', color: theme.textMuted }}>
                {isLoggedIn ? `+994 ${phoneNumber}` : 'Xoş gəlmisiniz!'}
              </span>
            </div>
          </div>

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
              transition: 'background-color 0.15s ease',
            }}
          >
            <X size={20} />
          </button>
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
                <ShoppingBag size={20} color="#e31e24" />
                {cartCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-8px',
                      backgroundColor: '#e31e24',
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
              <span style={{ fontSize: '10px', color: theme.textMuted }}>0 aktiv</span>
            </div>
          </div>

          {/* Authentication & Quick Login Box */}
          {!isLoggedIn ? (
            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: themeMode === 'dark' ? '#161f32' : '#f1f5f9',
                border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={16} color="#e31e24" />
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: theme.text }}>
                  Sürətli Giriş & Qeydiyyat
                </h4>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '11.5px', color: theme.textMuted, lineHeight: 1.4 }}>
                Sifarişlərinizi izləmək, xüsusi endirimlərdən faydalanmaq və sürətli checkout üçün daxil olun.
              </p>

              {loginStep === 'phone' ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', gap: '8px' }}>
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: themeMode === 'dark' ? '#0f172a' : '#ffffff',
                      borderRadius: '8px',
                      border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                      padding: '0 10px',
                    }}
                  >
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: theme.textMuted, marginRight: '4px' }}>
                      +994
                    </span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      placeholder="50 123 45 67"
                      style={{
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: theme.text,
                        padding: '10px 0',
                      }}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      padding: '0 16px',
                      backgroundColor: '#e31e24',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>Giriş</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    <Lock size={15} color={theme.textMuted} style={{ marginRight: '8px' }} />
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.slice(0, 6))}
                      placeholder="SMS Təsdiq kodu (məs: 1234)"
                      style={{
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: theme.text,
                        padding: '10px 0',
                      }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={15} />
                      <span>Kodu Təsdiqlə</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginStep('phone')}
                      style={{
                        padding: '10px 12px',
                        background: 'transparent',
                        color: theme.textMuted,
                        border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1'}`,
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Geri
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={20} color="#10b981" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>VIP Müştəri Hesabı Aktivdir</div>
                  <div style={{ fontSize: '11px', color: theme.textMuted }}>Bütün endirim və rəsmi zəmanət daxildir</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Çıxış"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                }}
              >
                <LogOut size={15} />
                <span>Çıxış</span>
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
              className="user-drawer-row"
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
                transition: 'background-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShoppingBag size={18} color="#e31e24" />
                <span>Səbətim və Sifariş</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {cartCount > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#e31e24', backgroundColor: 'rgba(227, 30, 36, 0.12)', padding: '2px 8px', borderRadius: '999px' }}>
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
              className="user-drawer-row"
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
                transition: 'background-color 0.15s ease',
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
              className="user-drawer-row"
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
                transition: 'background-color 0.15s ease',
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
              className="user-drawer-row"
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
                transition: 'background-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldCheck size={18} color="#10b981" />
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
              className="user-drawer-row"
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
                transition: 'background-color 0.15s ease',
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
                  padding: '8px 14px',
                  backgroundColor: themeMode === 'dark' ? '#1e293b' : '#e2e8f0',
                  color: theme.text,
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
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 10px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  color: '#3b82f6',
                  lineHeight: 1.4,
                }}
              >
                {orderTrackResult}
              </div>
            )}
          </div>

          {/* WhatsApp Direct Support Contact */}
          {onWhatsAppSupport && (
            <button
              type="button"
              onClick={onWhatsAppSupport}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: '#25D366',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.25)',
                transition: 'transform 0.15s ease',
              }}
            >
              <Phone size={17} />
              <span>WhatsApp ilə Canlı Əlaqə</span>
            </button>
          )}

          {/* Theme Mode Switcher */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: themeMode === 'dark' ? '#131b2c' : '#f8fafc',
              border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {themeMode === 'dark' ? <Moon size={17} color="#38bdf8" /> : <Sun size={17} color="#f59e0b" />}
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: theme.text }}>
                {themeMode === 'dark' ? 'Qaranlıq Rejim' : 'İşıqlı Rejim'}
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                backgroundColor: themeMode === 'dark' ? '#1e293b' : '#ffffff',
                color: theme.text,
                fontSize: '11.5px',
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
