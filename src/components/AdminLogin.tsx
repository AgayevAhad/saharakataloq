import React, { useState } from 'react';
import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react';
import { ThemeColors } from '../types/theme';
import { SaharaLogo } from './SaharaLogo';

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
    setLoading(true); setError('');
    try { await onLogin(password); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Giriş alınmadı'); }
    finally { setLoading(false); }
  };

  return (
    <main className="admin-login-page" style={{ background: theme.bg }}>
      <form className="admin-login-card" onSubmit={submit} style={{ background: theme.bgCard, borderColor: theme.border }}>
        <SaharaLogo className="admin-login-logo" />
        <div className="admin-login-security" style={{ background: theme.primaryLight, color: theme.primary }}><ShieldCheck size={18} /> Lokal təhlükəsiz giriş</div>
        <div>
          <h1 style={{ color: theme.text }}>Administrator girişi</h1>
          <p style={{ color: theme.textMuted }}>Bu bölmə yalnız lokal şəbəkədən və səlahiyyətli şəxslər üçün açıqdır.</p>
        </div>
        <label style={{ color: theme.textSecondary }}>Şifrə</label>
        <div className="password-field" style={{ background: theme.bgSecondary, borderColor: error ? '#ef4444' : theme.border }}>
          <LockKeyhole size={18} color={theme.textMuted} />
          <input autoFocus type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Admin şifrəsini daxil edin" style={{ color: theme.text }} />
        </div>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-admin-button" disabled={loading} style={{ background: theme.primary }}>{loading ? 'Yoxlanılır...' : 'Daxil ol'}</button>
        <a className="back-catalog-link" href="/" style={{ color: theme.textMuted }}><ArrowLeft size={15} /> Kataloqa qayıt</a>
      </form>
    </main>
  );
};
