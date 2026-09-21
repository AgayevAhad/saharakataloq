import { describe, it, expect } from 'vitest';
import { lightTheme, darkTheme } from '../types/theme';

describe('Sahara Electronic - Tema və Rəng Sistemi Testləri', () => {
  it('Light və Dark temaların bütün rəng açarları təyin olunmalıdır', () => {
    const requiredKeys = [
      'mode',
      'bg',
      'bgSecondary',
      'bgCard',
      'bgCardHover',
      'border',
      'borderHover',
      'text',
      'textSecondary',
      'textMuted',
      'primary',
      'primaryHover',
      'primaryLight',
      'primaryGlow',
      'surface',
      'badgeBg',
      'badgeText',
      'success',
      'cardShadow',
    ];

    requiredKeys.forEach((k) => {
      expect(lightTheme).toHaveProperty(k);
      expect(darkTheme).toHaveProperty(k);
    });
  });

  it('Hər iki tema Sahara Electronic brend qırmızı rəngindən istifadə etməlidir', () => {
    expect(lightTheme.primary.toLowerCase()).toBe('#b91c1c');
    expect(darkTheme.primary.toLowerCase()).toBe('#ef4444');
  });

  it('Dark və Light modların kontrastı düzgün olmalıdır', () => {
    expect(darkTheme.mode).toBe('dark');
    expect(lightTheme.mode).toBe('light');

    // Dark rejimdə fon tünd, mətn açıq olmalıdır
    // The lighter charcoal requested for dark mode need not start with #0.
    const channel = (value: string, offset: number) =>
      Number.parseInt(value.slice(offset, offset + 2), 16);
    const brightness = (value: string) =>
      channel(value, 1) * 0.2126 + channel(value, 3) * 0.7152 + channel(value, 5) * 0.0722;
    expect(brightness(darkTheme.bg)).toBeLessThan(brightness(darkTheme.text));
    expect(brightness(darkTheme.bg)).toBeLessThan(brightness(lightTheme.bg));
    expect(darkTheme.text).toMatch(/^#[fF][0-9a-fA-F]{5}/);

    // Light rejimdə fon açıq, mətn tünd olmalıdır
    expect(lightTheme.bg).toMatch(/^#[fF][0-9a-fA-F]{5}/);
    expect(lightTheme.text).toMatch(/^#0[0-9a-fA-F]{5}/);
  });
});
