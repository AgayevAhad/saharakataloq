export const normalizePhoneNumber = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 ? digits : '';
};

export const phoneHref = (value: string): string => {
  const digits = normalizePhoneNumber(value);
  return digits ? `tel:+${digits}` : '';
};

export const whatsappHref = (value: string, message: string): string => {
  const digits = normalizePhoneNumber(value);
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : '';
};
