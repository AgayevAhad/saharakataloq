import { describe, expect, it } from 'vitest';
import { normalizePhoneNumber, phoneHref, whatsappHref } from '../utils/contact';

describe('Əlaqə linklərinin təhlükəsiz formalaşdırılması', () => {
  it('boşluq və işarələri təmizləyərək E.164 rəqəmlərini saxlayır', () => {
    expect(normalizePhoneNumber('+994 (50) 123-45-67')).toBe('994501234567');
    expect(phoneHref('+994 (12) 555-44-33')).toBe('tel:+994125554433');
  });

  it('uyğunsuz və boş nömrələr üçün keçid yaratmır', () => {
    expect(normalizePhoneNumber('123')).toBe('');
    expect(phoneHref('')).toBe('');
    expect(whatsappHref('abc', 'Salam')).toBe('');
  });

  it('WhatsApp nömrəsini və Azərbaycan dili mesajını URL-də kodlayır', () => {
    const href = whatsappHref('994501234567', 'Salam, ARDO sobası haqqında məlumat');
    expect(href).toContain('https://wa.me/994501234567?text=');
    expect(decodeURIComponent(href)).toContain('ARDO sobası haqqında məlumat');
  });
});
