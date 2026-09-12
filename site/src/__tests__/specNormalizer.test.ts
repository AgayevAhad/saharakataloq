import { describe, it, expect } from 'vitest';
import { normalizeSpecValue } from '../utils/specNormalizer';

describe('PIM v2 Spec Normalizer Engine', () => {
  it('preserves rawName and rawValue exactly without mutations', () => {
    const rawName = 'Ölçülər (Q x D x H)';
    const rawValue = ' 59,5 x 59,5 x 56,7 sm ';
    const res = normalizeSpecValue(rawName, rawValue);

    expect(res.rawName).toBe('Ölçülər (Q x D x H)');
    expect(res.rawValue).toBe('59,5 x 59,5 x 56,7 sm');
    expect(res.normalizationStatus).toBe('valid');
    expect(res.unit).toBe('sm');
  });

  it('correctly handles decimal comma for power and dimensions', () => {
    const powerRes = normalizeSpecValue('Güc', '2,2 kW');
    expect(powerRes.normalizedValueNumber).toBe(2200);
    expect(powerRes.normalizedValueText).toBe('2200 W');
    expect(powerRes.unit).toBe('W');

    const dimRes = normalizeSpecValue('Genişlik', '59,5 sm');
    expect(dimRes.normalizedValueNumber).toBe(59.5);
    expect(dimRes.normalizedValueText).toBe('59.5 sm');
    expect(dimRes.unit).toBe('sm');
  });

  it('normalizes mm to sm without losing precision', () => {
    const res = normalizeSpecValue('Hündürlük', '850 mm');
    expect(res.normalizedValueNumber).toBe(85);
    expect(res.normalizedValueText).toBe('85 sm');
    expect(res.unit).toBe('sm');
  });

  it('normalizes volume and capacity', () => {
    const res = normalizeSpecValue('Həcm', '70 litr');
    expect(res.normalizedValueNumber).toBe(70);
    expect(res.normalizedValueText).toBe('70 L');
    expect(res.unit).toBe('L');
  });

  it('normalizes noise level in dB', () => {
    const res = normalizeSpecValue('Səs səviyyəsi', '42 dBA');
    expect(res.normalizedValueNumber).toBe(42);
    expect(res.normalizedValueText).toBe('42 dB');
    expect(res.unit).toBe('dB');
  });

  it('normalizes energy efficiency classes', () => {
    const res1 = normalizeSpecValue('Enerji sinfi', 'a+++');
    expect(res1.normalizedValueText).toBe('A+++');
    expect(res1.unit).toBe('class');

    const res2 = normalizeSpecValue('Enerji sinfi', 'A');
    expect(res2.normalizedValueText).toBe('A');
  });

  it('normalizes booleans correctly', () => {
    expect(normalizeSpecValue('Taymer', 'Bəli').normalizedValueBoolean).toBe(true);
    expect(normalizeSpecValue('Taymer', 'Var').normalizedValueBoolean).toBe(true);
    expect(normalizeSpecValue('Taymer', 'Xeyr').normalizedValueBoolean).toBe(false);
    expect(normalizeSpecValue('Taymer', 'Yoxdur').normalizedValueBoolean).toBe(false);
  });

  it('marks ambiguous expressions as needs_review without guessing', () => {
    const res = normalizeSpecValue('Güc', 'təxmini 2000 Vt?');
    expect(res.normalizationStatus).toBe('needs_review');
  });

  it('is idempotent when re-run multiple times', () => {
    const firstRun = normalizeSpecValue('Qril gücü', '1500 Vt');
    const secondRun = normalizeSpecValue(firstRun.rawName, firstRun.rawValue);
    expect(secondRun).toEqual(firstRun);
  });
});
