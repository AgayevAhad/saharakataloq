import { useCallback, useEffect, useMemo, useState } from 'react';
import { lightTheme, darkTheme, darkSlateTheme, darkGlassTheme, darkOledTheme, ThemeMode } from '../types/theme';

export const THEME_KEY = 'sahara_theme_mode';
export const DARK_VARIANT_KEY = 'sahara_dark_variant';

export const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'light';
};

export const getInitialDarkVariant = (): string => {
  if (typeof window === 'undefined') return 'default';
  try {
    const saved = localStorage.getItem(DARK_VARIANT_KEY);
    if (saved === 'glass' || saved === 'slate' || saved === 'default') {
      localStorage.setItem(DARK_VARIANT_KEY, 'default');
      return 'default';
    }
    if (saved === 'oled') return 'oled';
  } catch {}
  return 'default';
};

export function useTheme(primaryColor?: string) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  const [darkVariant, setDarkVariant] = useState<string>(getInitialDarkVariant);

  useEffect(() => {
    const handleEvent = (e: any) => {
      if (e.detail) {
        if (e.detail === 'light') {
          setThemeMode('light');
          localStorage.setItem(THEME_KEY, 'light');
        } else {
          setThemeMode('dark');
          localStorage.setItem(THEME_KEY, 'dark');
          
          let variant = 'default';
          if (e.detail === 'dark-slate') variant = 'slate';
          if (e.detail === 'dark-glass') variant = 'glass';
          if (e.detail === 'dark-oled') variant = 'oled';
          
          setDarkVariant(variant);
          localStorage.setItem(DARK_VARIANT_KEY, variant);
        }
      }
    };
    window.addEventListener('sahara-theme-change', handleEvent);
    return () => window.removeEventListener('sahara-theme-change', handleEvent);
  }, []);

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
    
    // Core theme class and data-attribute
    document.documentElement.setAttribute('data-theme', themeMode);
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${themeMode}`);
    
    
    // Setup variant class for dark mode
    document.documentElement.classList.remove('theme-dark-slate', 'theme-dark-glass', 'theme-dark-oled');
    if (themeMode === 'dark' && darkVariant !== 'default') {
      document.documentElement.setAttribute('data-theme', `dark-${darkVariant}`);
      document.documentElement.classList.add(`theme-dark-${darkVariant}`);
    }
  }, [themeMode, darkVariant]);



  const activeTheme = useMemo(() => {
    let base = lightTheme;
    if (themeMode === 'dark') {
      base = darkTheme;
      if (darkVariant === 'slate') base = darkSlateTheme;
      if (darkVariant === 'glass') base = darkGlassTheme;
      if (darkVariant === 'oled') base = darkOledTheme;
    }
    
    if (primaryColor) return { ...base, primary: primaryColor };
    return base;
  }, [primaryColor, themeMode, darkVariant]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', activeTheme.bg);
    }
    document.documentElement.style.backgroundColor = activeTheme.bg;
    document.body.style.backgroundColor = activeTheme.bg;
  }, [activeTheme.bg]);

  return { themeMode, setThemeMode, toggleTheme, activeTheme };
}
