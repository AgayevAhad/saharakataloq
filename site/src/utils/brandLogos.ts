/**
 * Utility for brand logos across Light and Dark modes.
 *
 * Rules:
 * - Ardo in dark mode: uses white filter 'brightness(0) invert(1)'
 * - Lotus in dark mode: uses '/media/brands/lotus-logo-white.png' (from Logo/lotus ag.png)
 * - Artel in dark mode: uses '/media/brands/artel-logo-white.svg'
 */

export function getBrandLogo(
  brandId: string | undefined,
  isDarkMode: boolean,
  defaultLogo?: string
): string {
  const id = (brandId || '').toLowerCase().trim();
  if (isDarkMode) {
    if (id === 'lotus') return '/media/brands/lotus-logo-white.png';
    if (id === 'artel') return '/media/brands/artel-logo-white.svg';
    if (id === 'ardo') return defaultLogo || '/media/brands/ardo-logo.png';
  }
  if (defaultLogo) return defaultLogo;
  if (id === 'ardo') return '/media/brands/ardo-logo.png';
  if (id === 'lotus') return '/media/brands/lotus-logo.png';
  if (id === 'artel') return '/media/brands/artel-logo.svg';
  if (id === 'beko') return '/media/brands/beko-logo.png';
  if (id === 'yoshiro') return '/media/brands/yoshiro-logo.png';
  return id ? `/media/brands/${id}-logo.svg` : '';
}

export function getBrandLogoFilter(
  brandId: string | undefined,
  isDarkMode: boolean
): string {
  const id = (brandId || '').toLowerCase().trim();
  if (isDarkMode && id === 'ardo') {
    return 'brightness(0) invert(1)';
  }
  return 'none';
}
