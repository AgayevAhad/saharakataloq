import { describe, it, expect } from 'vitest';
import { resolveRouteFromPath } from '../types/routes';

describe('resolveRouteFromPath', () => {
  // Ana səhifə
  it('/ home qaytarır', () => {
    expect(resolveRouteFromPath('/').route).toBe('home');
  });
  it('boş string home qaytarır', () => {
    expect(resolveRouteFromPath('').route).toBe('home');
  });

  // Kataloq
  it('/catalog catalog qaytarır', () => {
    expect(resolveRouteFromPath('/catalog').route).toBe('catalog');
  });
  it('/kataloq catalog qaytarır (Azərbaycan URL)', () => {
    expect(resolveRouteFromPath('/kataloq').route).toBe('catalog');
  });
  it('/category/kondisioner catalog + category qaytarır', () => {
    const r = resolveRouteFromPath('/category/kondisioner');
    expect(r.route).toBe('catalog');
    expect(r.category).toBe('kondisioner');
  });

  // Məhsul
  it('/product/ARDO-WS60S product + productId qaytarır', () => {
    const r = resolveRouteFromPath('/product/ARDO-WS60S');
    expect(r.route).toBe('product');
    expect(r.productId).toBe('ARDO-WS60S');
  });

  // Brend
  it('/brand/ardo brand + brand qaytarır', () => {
    const r = resolveRouteFromPath('/brand/ardo');
    expect(r.route).toBe('brand');
    expect(r.brand).toBe('ardo');
  });

  // Digər səhifələr
  it('/brands brands qaytarır', () => {
    expect(resolveRouteFromPath('/brands').route).toBe('brands');
  });
  it('/brendler brands qaytarır', () => {
    expect(resolveRouteFromPath('/brendler').route).toBe('brands');
  });
  it('/cart cart qaytarır', () => {
    expect(resolveRouteFromPath('/cart').route).toBe('cart');
  });
  it('/sebet cart qaytarır (Azərbaycan URL)', () => {
    expect(resolveRouteFromPath('/sebet').route).toBe('cart');
  });
  it('/favorites favorites qaytarır', () => {
    expect(resolveRouteFromPath('/favorites').route).toBe('favorites');
  });
  it('/account account qaytarır', () => {
    expect(resolveRouteFromPath('/account').route).toBe('account');
  });
  it('/login account qaytarır (yönləndirilir)', () => {
    expect(resolveRouteFromPath('/login').route).toBe('account');
  });
  it('/catdirilma delivery qaytarır', () => {
    expect(resolveRouteFromPath('/catdirilma').route).toBe('delivery');
  });
  it('/zemanet warranty qaytarır', () => {
    expect(resolveRouteFromPath('/zemanet').route).toBe('warranty');
  });
  it('/qaytarma returns qaytarır', () => {
    expect(resolveRouteFromPath('/qaytarma').route).toBe('returns');
  });
  it('/about about qaytarır', () => {
    expect(resolveRouteFromPath('/about').route).toBe('about');
  });
  it('/privacy privacy qaytarır', () => {
    expect(resolveRouteFromPath('/privacy').route).toBe('privacy');
  });
  it('/terms terms qaytarır', () => {
    expect(resolveRouteFromPath('/terms').route).toBe('terms');
  });

  // 404
  it('bilinməyən URL 404 qaytarır', () => {
    expect(resolveRouteFromPath('/bilinmeyen-sehife').route).toBe('404');
  });
  it('/404 açıq şəkildə 404 qaytarır', () => {
    expect(resolveRouteFromPath('/404').route).toBe('404');
  });

  // Query string ignore edilir
  it('query string nəzərə alınmır', () => {
    expect(resolveRouteFromPath('/catalog?brand=ardo').route).toBe('catalog');
  });

  // Sonundakı slash ignore edilir
  it('sonundakı slash nəzərə alınmır', () => {
    expect(resolveRouteFromPath('/brands/').route).toBe('brands');
  });
});
