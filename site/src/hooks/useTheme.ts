import { useCallback, useEffect, useMemo, useState } from 'react';
import { lightTheme, darkTheme, ThemeMode } from '../types/theme';

export const THEME_KEY = 'sahara_theme_mode';

export const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'light';
};

export function useTheme(primaryColor?: string) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', themeMode);
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${themeMode}`);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', themeMode === 'dark' ? '#0d0f14' : '#f8fafc');
    }
  }, [themeMode]);

  const activeTheme = useMemo(() => {
    const base = themeMode === 'dark' ? darkTheme : lightTheme;
    if (primaryColor) return { ...base, primary: primaryColor };
    return base;
  }, [primaryColor, themeMode]);

  return { themeMode, setThemeMode, toggleTheme, activeTheme };
}
