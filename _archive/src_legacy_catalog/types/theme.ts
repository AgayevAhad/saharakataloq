export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  mode: ThemeMode;
  bg: string;
  bgSecondary: string;
  bgCard: string;
  bgCardHover: string;
  border: string;
  borderHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;         // Sahara Red
  primaryHover: string;
  primaryLight: string;
  primaryGlow: string;
  surface: string;
  badgeBg: string;
  badgeText: string;
  success: string;
  cardShadow: string;
}

export const lightTheme: ThemeColors = {
  mode: 'light',
  bg: '#f8fafc',
  bgSecondary: '#f1f5f9',
  bgCard: '#ffffff',
  bgCardHover: '#ffffff',
  border: '#e2e8f0',
  borderHover: '#cbd5e1',
  text: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  primary: '#dc2626',       // Sahara Crimson Red
  primaryHover: '#b91c1c',
  primaryLight: '#fee2e2',
  primaryGlow: 'rgba(220, 38, 38, 0.15)',
  surface: '#ffffff',
  badgeBg: '#fef2f2',
  badgeText: '#991b1b',
  success: '#16a34a',
  cardShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
};

export const darkTheme: ThemeColors = {
  mode: 'dark',
  bg: '#0a0d14',
  bgSecondary: '#0f1420',
  bgCard: '#131926',
  bgCardHover: '#182030',
  border: '#1f293d',
  borderHover: '#334155',
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  primary: '#ef4444',       // Sahara Crimson Red (Bright for dark mode)
  primaryHover: '#dc2626',
  primaryLight: '#450a0a',
  primaryGlow: 'rgba(239, 68, 68, 0.25)',
  surface: '#161e2e',
  badgeBg: '#2d0f0f',
  badgeText: '#fca5a5',
  success: '#10b981',
  cardShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
};
