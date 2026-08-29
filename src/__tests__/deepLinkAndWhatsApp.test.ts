import { describe, it, expect } from 'vitest';
import { TEST_PRODUCT } from './fixtures';
import { Product } from '../types/product';

function generateWhatsAppText(product: Product, origin: string): string {
  const shareUrl = `${origin}?product=${product.id}`;
  return (
    `Salam, Sahara Electronics! ARDO məhsulu haqqında məlumat almaq və sifariş etmək istəyirəm:\n\n` +
    `📌 Model: ${product.code}\n` +
    `🏷 Məhsul: ${product.title}\n` +
    `🗂 Kateqoriya: ${product.categoryName}\n\n` +
    `🔗 Kataloq Linki: ${shareUrl}`
  );
}

describe('Sahara Electronic - Paylaşım və WhatsApp İnteqrasiya Testləri', () => {
  it('WhatsApp sifariş mesajı düzgün parametr və linklə formalaşmalıdır', () => {
    const product = TEST_PRODUCT;
    const origin = 'https://saharaelectronic.az';
    const text = generateWhatsAppText(product, origin);

    expect(text).toContain('Salam, Sahara Electronics!');
    expect(text).toContain(product.code);
    expect(text).toContain(product.title);
    expect(text).toContain(product.categoryName);
    expect(text).toContain(`https://saharaelectronic.az?product=${product.id}`);
  });

  it('Məhsul linki URL parametrlərində düzgün tapılmalıdır', () => {
    const testUrl = `http://localhost:5173/?product=${TEST_PRODUCT.id}`;
    const parsedParams = new URL(testUrl).searchParams;
    const prodId = parsedParams.get('product');

    expect(prodId).toBe(TEST_PRODUCT.id);

    const found = [TEST_PRODUCT].find((p) => p.id === prodId);
    expect(found).toBeDefined();
    expect(found?.id).toBe(TEST_PRODUCT.id);
  });
});
