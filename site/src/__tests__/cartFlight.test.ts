import { afterEach, describe, expect, it, vi } from 'vitest';
import { animateProductToCart, animateProductToFavorites } from '../utils/cartFlight';

afterEach(() => {
  document.body.innerHTML = '';
  Reflect.deleteProperty(HTMLElement.prototype, 'animate');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('add-to-cart flight', () => {
  it('flies a product thumbnail toward the visible header cart and removes its overlay', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    document.body.innerHTML =
      '<div class="product-card"><div class="product-card-media"></div><button id="add">+</button></div><button data-cart-target id="cart">Cart</button>';
    const source = document.getElementById('add')!;
    const media = document.querySelector<HTMLElement>('.product-card-media')!;
    const target = document.getElementById('cart')!;
    vi.spyOn(media, 'getBoundingClientRect').mockReturnValue({
      left: 200,
      top: 300,
      width: 200,
      height: 200,
    } as DOMRect);
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      left: 900,
      top: 10,
      width: 36,
      height: 36,
    } as DOMRect);
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const animate = vi.fn().mockReturnValue({ finished } as unknown as Animation);
    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });
    animateProductToCart(source, '/media/products/real.png');
    const flyer = document.querySelector('.cart-flight-item');
    expect(flyer?.querySelector('img')?.getAttribute('src')).toBe('/media/products/real.png');
    expect(animate).toHaveBeenCalledOnce();
    expect(JSON.stringify(animate.mock.calls[0][0])).toContain('translate(618px');
    finish();
    await finished;
    await Promise.resolve();
    await Promise.resolve();
    expect(document.querySelector('.cart-flight-item')).toBeNull();
    expect(target.classList.contains('cart-target-pulse')).toBe(true);
  });

  it('does not animate for reduced-motion users', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const source = document.createElement('button');
    document.body.append(source);
    animateProductToCart(source, '/media/products/real.png');
    expect(document.querySelector('.cart-flight-item')).toBeNull();
  });

  it('flies the detail image to the visible favorites button', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    document.body.innerHTML =
      '<div class="product-detail-main-stage"></div><button id="like">Like</button><button data-favorite-target id="favorite">Favorites</button>';
    const stage = document.querySelector<HTMLElement>('.product-detail-main-stage')!;
    const source = document.getElementById('like')!;
    const target = document.getElementById('favorite')!;
    vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 200,
      width: 300,
      height: 200,
    } as DOMRect);
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      left: 900,
      top: 10,
      width: 36,
      height: 36,
    } as DOMRect);
    const animate = vi
      .fn()
      .mockReturnValue({ finished: new Promise<void>(() => {}) } as unknown as Animation);
    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });
    animateProductToFavorites(source, '/media/products/real.webp');
    expect(document.querySelector('.cart-flight-item img')?.getAttribute('src')).toBe(
      '/media/products/real.webp'
    );
    expect(animate).toHaveBeenCalledOnce();
  });
});
