import { Product } from '../types/product';

/** Public-facing manufacture claims require a model-specific, unambiguous spec. */
export const verifiedManufacturingCountry = (product: Product): string => {
  const countries = new Set(
    (product.specs || [])
      .filter((spec) => {
        const name = String(spec.name || '')
          .trim()
          .replace(/:$/, '')
          .toLocaleLowerCase('az');
        return name === 'istehsalçı ölkə' || name === 'istehsal ölkəsi';
      })
      .map((spec) => String(spec.value || '').trim())
      .filter((value) => value && value !== '-' && value !== '—')
  );
  return countries.size === 1 ? [...countries][0] : '';
};
