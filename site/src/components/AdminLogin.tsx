import React, { useState } from 'react';
import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react';
import { ThemeColors } from '../types/theme';
import { SaharaLogo } from './SaharaLogo';
import { ApiError, NetworkError, TimeoutError } from '../services/apiClient';

interface Props {
  theme: ThemeColors;
  onLogin: (password: string) => Promise<void>;
}

export const AdminLogin: React.FC<Props> = ({ theme, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError('');
    try {
      await onLogin(password);
    } catch (reason: unknown) {
      if (reason instanceof ApiError) {
        if (
          reason.data &&
          typeof reason.data === 'object' &&
          'error' in (reason.data as Record<string, unknown>)
        ) {
          setError(String((reason.data as { error: string }).error));
        } else if (reason.status === 401) {
          setError('Şifrə yanlışdır');
        } else if (reason.status === 429) {
          setError('Çoxsaylı uğursuz cəhd. 15 dəqiqə sonra yenidən yoxlayın.');
        } else {
          setError('Giriş zamanı xəta baş verdi');
        }
      } else if (reason instanceof NetworkError) {
        setError('Şəbəkə xətası. Serverlə əlaqə qurulmadı.');
      } else if (reason instanceof TimeoutError) {
        setError('Sorğu vaxtı bitdi. Zəhmət olmasa yenidən cəhd edin.');
      } else {
        setError(reason instanceof Error ? reason.message : 'Giriş alınmadı');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page" style={{ background: theme.bg }}>
      <form
        className="admin-login-card"
        onSubmit={submit}
        style={{ background: theme.bgCard, borderColor: theme.border }}
      >
        <SaharaLogo className="admin-login-logo" />
        <div
          className="admin-login-security"
          style={{ background: theme.primaryLight, color: '#b91c1c' }}
        >
          <ShieldCheck size={18} /> Lokal təhlükəsiz giriş
        </div>
        <div>
          <h1 style={{ color: theme.text }}>Administrator girişi</h1>
          <p style={{ color: theme.mode === 'dark' ? '#cbd5e1' : '#334155' }}>
            Bu bölmə yalnız lokal şəbəkədən və səlahiyyətli şəxslər üçün açıqdır.
          </p>
        </div>
        <label
          htmlFor="admin-password-input"
          style={{ color: theme.mode === 'dark' ? '#cbd5e1' : '#334155' }}
        >
          Şifrə
        </label>
        <div
          className="password-field"
          style={{ background: theme.bgSecondary, borderColor: error ? '#ef4444' : theme.border }}
        >
          <LockKeyhole size={18} color={theme.mode === 'dark' ? '#cbd5e1' : '#334155'} />
          <input
            id="admin-password-input"
            autoFocus
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Admin şifrəsini daxil edin"
            style={{ color: theme.text }}
          />
        </div>
        {error && <div className="form-error">{error}</div>}
        <button
          type="submit"
          className="primary-admin-button"
          disabled={loading}
          style={{ background: '#b91c1c', color: '#ffffff' }}
        >
          {loading ? 'Yoxlanılır...' : 'Daxil ol'}
        </button>
        <a
          className="back-catalog-link"
          href="/"
          style={{ color: theme.mode === 'dark' ? '#cbd5e1' : '#334155' }}
        >
          <ArrowLeft size={15} /> Kataloqa qayıt
        </a>
      </form>
    </main>
  );
};
