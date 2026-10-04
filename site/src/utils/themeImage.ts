/**
 * Resolves a product or media image URL based on whether Dark Mode is active.
 *
 * Rules:
 * - If isDark is true:
 *   - If darkUrl is explicitly provided, return darkUrl.
 *   - If url contains '_light.', replaces '_light.' with '_dark.'.
 * - If isDark is false:
 *   - If url contains '_dark.', replaces '_dark.' with '_light.'.
 * - Fallbacks to url unchanged if no matching theme variant exists.
 */
export function resolveThemeImage(
  url?: string | null,
  isDark?: boolean,
  darkUrl?: string | null
): string {
  if (!url) return '';
  if (isDark) {
    if (darkUrl) return darkUrl;
    if (url.includes('_light.')) {
      return url.replace('_light.', '_dark.');
    }
  } else {
    if (url.includes('_dark.')) {
      return url.replace('_dark.', '_light.');
    }
  }
  return url;
}
