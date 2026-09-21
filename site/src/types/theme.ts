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
  primary: string; // Sahara Red
  primaryHover: string;
  primaryLight: string;
  primaryGlow: string;
  surface: string;
  badgeBg: string;
  badgeText: string;
  success: string;
  cardShadow: string;
}

export interface DesignTokens {
  spacing: Record<
    '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16' | '20' | '24',
    string
  >;
  radii: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full', string>;
  shadows: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'glow', string>;
  zIndex: Record<
    'hide' | 'base' | 'dock' | 'sticky' | 'overlay' | 'modal' | 'toast' | 'tooltip' | 'splash',
    number
  >;
  breakpoints: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', number>;
  motion: {
    durationFast: string;
    durationBase: string;
    durationSlow: string;
    easeStandard: string;
    easeOut: string;
    easeIn: string;
  };
}

export const DESIGN_TOKENS: DesignTokens = {
  spacing: {
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
    '8': '32px',
    '10': '40px',
    '12': '48px',
    '16': '64px',
    '20': '80px',
    '24': '96px',
  },
  radii: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(220, 38, 38, 0.35)',
  },
  zIndex: {
    hide: -1,
    base: 0,
    dock: 60,
    sticky: 50,
    overlay: 100,
    modal: 110,
    toast: 150,
    tooltip: 200,
    splash: 250,
  },
  breakpoints: {
    xs: 320,
    sm: 390,
    md: 768,
    lg: 1024,
    xl: 1440,
    '2xl': 1920,
  },
  motion: {
    durationFast: '150ms',
    durationBase: '250ms',
    durationSlow: '400ms',
    easeStandard: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },
};

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
  textMuted: '#475569',
  primary: '#b91c1c', // Sahara Crimson Red (High Contrast WCAG AA)
  primaryHover: '#991b1b',
  primaryLight: '#fee2e2',
  primaryGlow: 'rgba(185, 28, 28, 0.15)',
  surface: '#ffffff',
  badgeBg: '#fef2f2',
  badgeText: '#991b1b',
  success: '#15803d',
  cardShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
};

export const darkTheme: ThemeColors = {
  mode: 'dark',
  bg: '#17202e',
  bgSecondary: '#1c2737',
  bgCard: '#253247',
  bgCardHover: '#2c3b51',
  border: '#35465c',
  borderHover: '#50647e',
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  primary: '#ef4444', // Sahara Crimson Red (Bright for dark mode)
  primaryHover: '#dc2626',
  primaryLight: '#450a0a',
  primaryGlow: 'rgba(239, 68, 68, 0.25)',
  surface: '#253247',
  badgeBg: '#2d0f0f',
  badgeText: '#fca5a5',
  success: '#10b981',
  cardShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
};
