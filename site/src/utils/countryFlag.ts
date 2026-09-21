/** Flag is shown only for an explicit, single manufacturing country. */
const flags: Record<string, string> = {
  çin: '🇨🇳',
  türkiyə: '🇹🇷',
  polşa: '🇵🇱',
  malayziya: '🇲🇾',
  almaniya: '🇩🇪',
  misir: '🇪🇬',
  rusiya: '🇷🇺',
  tayland: '🇹🇭',
  vyetnam: '🇻🇳',
  'cənubi koreya': '🇰🇷',
  koreya: '🇰🇷',
  ispaniya: '🇪🇸',
  hindistan: '🇮🇳',
  sloveniya: '🇸🇮',
  özbəkistan: '🇺🇿',
  indoneziya: '🇮🇩',
  'böyük britaniya': '🇬🇧',
  belarus: '🇧🇾',
  fransa: '🇫🇷',
  italiya: '🇮🇹',
};

export const manufacturingCountryFlag = (country: string): string =>
  flags[country.trim().toLocaleLowerCase('az-AZ')] || '';
