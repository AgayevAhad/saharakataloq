import { createHash } from 'node:crypto';

/**
 * Normalizes an Azerbaijani string into a deterministic base ASCII slug.
 */
export function slugifyAz(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'spec';
}

/**
 * Generates a deterministic spec definition key.
 * If another distinct rawName already claimed the base key (e.g. "Güc" vs "Gücü"),
 * generates a deterministic sha256 suffix without AI semantic guessing and flags collision.
 */
export function generateDeterministicSpecKey(rawName, existingKeysMap = new Map()) {
  const safeRaw = (rawName || '').trim();
  const baseKey = slugifyAz(safeRaw);

  if (!existingKeysMap.has(baseKey)) {
    existingKeysMap.set(baseKey, safeRaw);
    return {
      key: baseKey,
      isCollision: false,
      status: 'valid',
    };
  }

  const existingRaw = existingKeysMap.get(baseKey);
  if (existingRaw.toLowerCase() === safeRaw.toLowerCase()) {
    return {
      key: baseKey,
      isCollision: false,
      status: 'valid',
    };
  }

  // Collision between two different raw names (e.g. "Güc" vs "Gücü")
  const hashSuffix = createHash('sha256').update(safeRaw).digest('hex').slice(0, 6);
  const collisionKey = `${baseKey}_${hashSuffix}`;
  existingKeysMap.set(collisionKey, safeRaw);

  return {
    key: collisionKey,
    isCollision: true,
    status: 'needs_review',
    collidedWith: existingRaw,
  };
}

/**
 * Normalizes technical specification values while strictly preserving raw data.
 */
export function normalizeSpecValue(rawName, rawValue) {
  const safeRawName = (rawName || '').trim();
  const safeRawValue = (rawValue || '').trim();

  const result = {
    rawName: safeRawName,
    rawValue: safeRawValue,
    normalizedValueText: undefined,
    normalizedValueNumber: null,
    normalizedValueBoolean: null,
    unit: undefined,
    normalizationStatus: 'raw_only',
  };

  if (!safeRawValue) {
    return result;
  }

  // 1. Boolean check
  const lowerVal = safeRawValue.toLowerCase();
  if (['bəli', 'var', 'hə', 'yes', 'true', '1'].includes(lowerVal)) {
    return {
      ...result,
      normalizedValueBoolean: true,
      normalizedValueText: 'Bəli',
      normalizationStatus: 'valid',
    };
  }
  if (['xeyr', 'yoxdur', 'yox', 'no', 'false', '0'].includes(lowerVal)) {
    return {
      ...result,
      normalizedValueBoolean: false,
      normalizedValueText: 'Xeyr',
      normalizationStatus: 'valid',
    };
  }

  // 2. Energy class check (e.g. A+++, A++, A+, A, B, C, D)
  const energyMatch = safeRawValue.match(/^(A\+{1,3}|[A-G])$/i);
  if (energyMatch) {
    return {
      ...result,
      normalizedValueText: energyMatch[1].toUpperCase(),
      unit: 'class',
      normalizationStatus: 'valid',
    };
  }

  // Normalize decimal comma to dot for numeric parsing
  const cleanNumericStr = safeRawValue.replace(/,/g, '.');

  // 3. Power (W, kW, Vt, kVt)
  const powerMatch = cleanNumericStr.match(/^(\d+(?:\.\d+)?)\s*(kVt|kW|Vt|W)\b/i);
  if (powerMatch) {
    const num = parseFloat(powerMatch[1]);
    const unitRaw = powerMatch[2].toLowerCase();
    const inWatts = unitRaw.startsWith('k') ? Math.round(num * 1000) : num;
    return {
      ...result,
      normalizedValueNumber: inWatts,
      normalizedValueText: `${inWatts} W`,
      unit: 'W',
      normalizationStatus: 'valid',
    };
  }

  // 4. Dimensions (mm, cm, sm, m)
  const dimMatch = cleanNumericStr.match(/^(\d+(?:\.\d+)?)\s*(mm|cm|sm|m)\b/i);
  if (dimMatch) {
    const num = parseFloat(dimMatch[1]);
    const unitRaw = dimMatch[2].toLowerCase();
    let inCm = num;
    if (unitRaw === 'mm') inCm = num / 10;
    else if (unitRaw === 'm') inCm = num * 100;
    return {
      ...result,
      normalizedValueNumber: inCm,
      normalizedValueText: `${inCm} sm`,
      unit: 'sm',
      normalizationStatus: 'valid',
    };
  }

  // 5. Multi-dimension format: W x H x D (e.g. 59.5 x 59.5 x 56.7 sm or 60x60x85)
  const multiDimMatch = cleanNumericStr.match(
    /^(\d+(?:\.\d+)?)\s*[xX*×]\s*(\d+(?:\.\d+)?)(?:\s*[xX*×]\s*(\d+(?:\.\d+)?))?\s*(mm|cm|sm|m)?$/i
  );
  if (multiDimMatch) {
    const u = multiDimMatch[4] ? multiDimMatch[4].toLowerCase() : 'sm';
    const d1 = parseFloat(multiDimMatch[1]);
    const d2 = parseFloat(multiDimMatch[2]);
    const d3 = multiDimMatch[3] ? parseFloat(multiDimMatch[3]) : null;
    const factor = u === 'mm' ? 0.1 : u === 'm' ? 100 : 1;
    const norm1 = d1 * factor;
    const norm2 = d2 * factor;
    const norm3 = d3 !== null ? d3 * factor : null;
    const normText = norm3 !== null ? `${norm1} × ${norm2} × ${norm3} sm` : `${norm1} × ${norm2} sm`;
    return {
      ...result,
      normalizedValueText: normText,
      unit: 'sm',
      normalizationStatus: 'valid',
    };
  }

  // 6. Volume/Capacity (L, l, litr)
  const volumeMatch = cleanNumericStr.match(/^(\d+(?:\.\d+)?)\s*(l|litr|lt)\b/i);
  if (volumeMatch) {
    const num = parseFloat(volumeMatch[1]);
    return {
      ...result,
      normalizedValueNumber: num,
      normalizedValueText: `${num} L`,
      unit: 'L',
      normalizationStatus: 'valid',
    };
  }

  // 7. Weight / Mass (kq, kg, q, g)
  const weightMatch = cleanNumericStr.match(/^(\d+(?:\.\d+)?)\s*(kq|kg|q|g)\b/i);
  if (weightMatch) {
    const num = parseFloat(weightMatch[1]);
    const unitRaw = weightMatch[2].toLowerCase();
    const inKg = unitRaw === 'q' || unitRaw === 'g' ? num / 1000 : num;
    return {
      ...result,
      normalizedValueNumber: inKg,
      normalizedValueText: `${inKg} kq`,
      unit: 'kq',
      normalizationStatus: 'valid',
    };
  }

  // 8. Noise level (dB, dBA)
  const noiseMatch = cleanNumericStr.match(/^(\d+(?:\.\d+)?)\s*(db|dba)\b/i);
  if (noiseMatch) {
    const num = parseFloat(noiseMatch[1]);
    return {
      ...result,
      normalizedValueNumber: num,
      normalizedValueText: `${num} dB`,
      unit: 'dB',
      normalizationStatus: 'valid',
    };
  }

  // 9. Pure integer or float number
  const pureNumMatch = cleanNumericStr.match(/^(\d+(?:\.\d+)?)$/);
  if (pureNumMatch) {
    const num = parseFloat(pureNumMatch[1]);
    return {
      ...result,
      normalizedValueNumber: num,
      normalizedValueText: String(num),
      normalizationStatus: 'valid',
    };
  }

  // 10. Check if ambiguous (e.g. contains question mark or unparseable mixed text with numbers)
  if (safeRawValue.includes('?') || safeRawValue.toLowerCase().includes('təxmini')) {
    return {
      ...result,
      normalizationStatus: 'needs_review',
    };
  }

  // Default text representation
  return {
    ...result,
    normalizedValueText: safeRawValue,
    normalizationStatus: 'valid',
  };
}
