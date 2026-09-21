import { describe, expect, it } from 'vitest';
import { manufacturingCountryFlag } from '../utils/countryFlag';

describe('verified manufacturing flag', () => {
  it('maps known countries but not ambiguous pairs', () => {
    expect(manufacturingCountryFlag('Çin')).toBe('🇨🇳');
    expect(manufacturingCountryFlag('TÜRKİYƏ')).toBe('🇹🇷');
    expect(manufacturingCountryFlag('İndoneziya/Hindistan')).toBe('');
    expect(manufacturingCountryFlag('')).toBe('');
  });
});
