# PROMPT 09 — Yeni Hook-lar üçün Test Əhatəsi

> **Tətbiq yeri:** `site/src/__tests__/`  
> **Risk:** Sıfır — yalnız test faylları əlavə edilir, mövcud kod dəyişmir  
> **Ön şərt:** PROMPT_01 (hook-lar yaradılmış), PROMPT_08 (routing əlavə edilmiş) olmalıdır  
> **Nəticə:** PROMPT_01-dən gələn 6 yeni hook-un hər biri test əhatəsinə alınır; routing də test edilir

---

## Kontekst

Layihədə artıq 84 test faylı var. Amma PROMPT_01-dən yaradılan 6 yeni hook üçün test yoxdur:
- `useTheme`
- `useCompare`
- `useFavorites`
- `useToast`
- `useCatalog`
- `useContact`

Əlavə olaraq PROMPT_08-dən gələn `resolveRouteFromPath` funksiyası da test edilməlidir — bu funksiyanın məntiqi `App.tsx`-dən `types/routes.ts`-ə köçürüldüyü üçün mövcud testlər onu tapa bilməyə bilər.

---

## Mövcud Test İnfrastrukturu

- **Test framework:** Vitest
- **Environment:** happy-dom
- **Hook test köməkçisi:** `@testing-library/react-hooks` (yoxla, varsa istifadə et)
- **Render köməkçisi:** `@testing-library/react`
- **Test qovluğu:** `site/src/__tests__/`

---

## Yaradılacaq Test Faylları

### `site/src/__tests__/useTheme.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTheme } from '../hooks/useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.className = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('başlanğıcda light tema qaytarır (localStorage boş)', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.themeMode).toBe('light');
  });

  it('localStorage-dakı tema dəyərini oxuyur', () => {
    localStorage.setItem('sahara_theme_mode', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.themeMode).toBe('dark');
  });

  it('toggleTheme light-dan dark-a keçirir', () => {
    const { result } = renderHook(() => useTheme());
    act(() => { result.current.toggleTheme(); });
    expect(result.current.themeMode).toBe('dark');
  });

  it('toggleTheme dark-dan light-a keçirir', () => {
    localStorage.setItem('sahara_theme_mode', 'dark');
    const { result } = renderHook(() => useTheme());
    act(() => { result.current.toggleTheme(); });
    expect(result.current.themeMode).toBe('light');
  });

  it('toggleTheme nəticəsini localStorage-da saxlayır', () => {
    const { result } = renderHook(() => useTheme());
    act(() => { result.current.toggleTheme(); });
    expect(localStorage.getItem('sahara_theme_mode')).toBe('dark');
  });

  it('data-theme atributunu DOM-da yenilir', () => {
    const { result } = renderHook(() => useTheme());
    act(() => { result.current.toggleTheme(); });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('primaryColor verilsə activeTheme.primary dəyişir', () => {
    const { result } = renderHook(() => useTheme('#ff0000'));
    expect(result.current.activeTheme.primary).toBe('#ff0000');
  });

  it('activeTheme obyekti qaytarır', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.activeTheme).toBeDefined();
    expect(typeof result.current.activeTheme).toBe('object');
  });
});
```

---

### `site/src/__tests__/useCompare.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCompare } from '../hooks/useCompare';
import type { Product } from '../types/product';

// Minimal test məhsulları
const makeProduct = (id: string): Product =>
  ({ id, code: id, title: `Məhsul ${id}`, brand: 'test', category: 'test' } as Product);

const products = [
  makeProduct('p1'),
  makeProduct('p2'),
  makeProduct('p3'),
  makeProduct('p4'),
  makeProduct('p5'),
];

describe('useCompare', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('başlanğıcda boş siyahı qaytarır', () => {
    const { result } = renderHook(() => useCompare(products));
    expect(result.current.comparisonIds).toHaveLength(0);
  });

  it('addToCompare məhsul əlavə edir', () => {
    const { result } = renderHook(() => useCompare(products));
    act(() => { result.current.addToCompare('p1'); });
    expect(result.current.comparisonIds).toContain('p1');
  });

  it('eyni məhsulu iki dəfə əlavə etmir', () => {
    const { result } = renderHook(() => useCompare(products));
    act(() => {
      result.current.addToCompare('p1');
      result.current.addToCompare('p1');
    });
    expect(result.current.comparisonIds).toHaveLength(1);
  });

  it('maksimum 4 məhsul müqayisəyə alınır', () => {
    const { result } = renderHook(() => useCompare(products));
    act(() => {
      result.current.addToCompare('p1');
      result.current.addToCompare('p2');
      result.current.addToCompare('p3');
      result.current.addToCompare('p4');
      result.current.addToCompare('p5'); // 5-ci əlavə edilməməlidir
    });
    expect(result.current.comparisonIds).toHaveLength(4);
    expect(result.current.comparisonIds).not.toContain('p5');
  });

  it('removeFromCompare məhsulu çıxarır', () => {
    const { result } = renderHook(() => useCompare(products));
    act(() => {
      result.current.addToCompare('p1');
      result.current.addToCompare('p2');
    });
    act(() => { result.current.removeFromCompare('p1'); });
    expect(result.current.comparisonIds).not.toContain('p1');
    expect(result.current.comparisonIds).toContain('p2');
  });

  it('clearCompare bütün siyahını təmizləyir', () => {
    const { result } = renderHook(() => useCompare(products));
    act(() => {
      result.current.addToCompare('p1');
      result.current.addToCompare('p2');
    });
    act(() => { result.current.clearCompare(); });
    expect(result.current.comparisonIds).toHaveLength(0);
  });

  it('comparisonProducts ID-lərə görə Product obyektlərini qaytarır', () => {
    const { result } = renderHook(() => useCompare(products));
    act(() => { result.current.addToCompare('p1'); });
    expect(result.current.comparisonProducts).toHaveLength(1);
    expect(result.current.comparisonProducts[0].id).toBe('p1');
  });

  it('siyahını localStorage-da saxlayır', () => {
    const { result } = renderHook(() => useCompare(products));
    act(() => { result.current.addToCompare('p1'); });
    const saved = JSON.parse(localStorage.getItem('sahara_compare_items') || '[]');
    expect(saved).toContain('p1');
  });

  it('başlanğıcda localStorage-dan oxuyur', () => {
    localStorage.setItem('sahara_compare_items', JSON.stringify(['p2', 'p3']));
    const { result } = renderHook(() => useCompare(products));
    expect(result.current.comparisonIds).toEqual(['p2', 'p3']);
  });
});
```

---

### `site/src/__tests__/useFavorites.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useFavorites } from '../hooks/useFavorites';

describe('useFavorites', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('başlanğıcda boş siyahı qaytarır', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toHaveLength(0);
  });

  it('toggleFavorite məhsulu favorilərə əlavə edir', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => { result.current.toggleFavorite('p1'); });
    expect(result.current.favorites).toContain('p1');
  });

  it('toggleFavorite eyni məhsulu favorilərden çıxarır (toggle)', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => { result.current.toggleFavorite('p1'); });
    act(() => { result.current.toggleFavorite('p1'); });
    expect(result.current.favorites).not.toContain('p1');
  });

  it('isFavorite true qaytarır əlavə edilmiş məhsul üçün', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => { result.current.toggleFavorite('p1'); });
    expect(result.current.isFavorite('p1')).toBe(true);
  });

  it('isFavorite false qaytarır əlavə edilməmiş məhsul üçün', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.isFavorite('p99')).toBe(false);
  });

  it('favoritləri localStorage-da saxlayır', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => { result.current.toggleFavorite('p1'); });
    const saved = JSON.parse(localStorage.getItem('sahara_favorite_items') || '[]');
    expect(saved).toContain('p1');
  });

  it('başlanğıcda localStorage-dan oxuyur', () => {
    localStorage.setItem('sahara_favorite_items', JSON.stringify(['p3', 'p4']));
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual(['p3', 'p4']);
  });

  it('birdən çox məhsulu saxlayır', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => {
      result.current.toggleFavorite('p1');
      result.current.toggleFavorite('p2');
      result.current.toggleFavorite('p3');
    });
    expect(result.current.favorites).toHaveLength(3);
  });
});
```

---

### `site/src/__tests__/useToast.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useToast } from '../hooks/useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('başlanğıcda toast görünmür', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toast.visible).toBe(false);
    expect(result.current.toast.message).toBe('');
  });

  it('showToast çağrıldıqda toast görünür', () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.showToast('Test mesajı'); });
    expect(result.current.toast.visible).toBe(true);
    expect(result.current.toast.message).toBe('Test mesajı');
  });

  it('müəyyən vaxtdan sonra toast avtomatik gizlənir', () => {
    const { result } = renderHook(() => useToast(1000));
    act(() => { result.current.showToast('Test'); });
    expect(result.current.toast.visible).toBe(true);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.toast.visible).toBe(false);
  });

  it('fərqli mesajla yenidən showToast çağrılırsa mesaj yenilənir', () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.showToast('Birinci'); });
    act(() => { result.current.showToast('İkinci'); });
    expect(result.current.toast.message).toBe('İkinci');
  });
});
```

---

### `site/src/__tests__/resolveRouteFromPath.test.ts`

> **Qeyd:** Bu test mövcud `deepLinkAndWhatsApp.test.ts` ilə üst-üstə düşə bilər. Əvvəlcə həmin faylı yoxla — əgər `resolveRouteFromPath` testləri artıq varsa, bu faylı yaratma, yalnız import yolunu yenilə.

```typescript
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
```

---

### `site/src/__tests__/useContact.test.ts`

```typescript
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useContact } from '../hooks/useContact';
import type { CatalogSettings } from '../types/product';

const mockSettings: Partial<CatalogSettings> = {
  whatsappNumber: '+994501234567',
  phoneNumber: '+994121234567',
};

describe('useContact', () => {
  const showToast = vi.fn();
  const getProductUrl = vi.fn(() => 'https://saharaelectronics.az/product/test');
  let windowOpenSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    showToast.mockClear();
    getProductUrl.mockClear();
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  it('openWhatsApp window.open çağırır', () => {
    const { result } = renderHook(() =>
      useContact({ settings: mockSettings as CatalogSettings, getProductUrl, showToast })
    );
    result.current.openWhatsApp();
    expect(windowOpenSpy).toHaveBeenCalledOnce();
    expect(windowOpenSpy.mock.calls[0][0]).toContain('wa.me');
  });

  it('openWhatsApp məhsul məlumatlarını mesaja daxil edir', () => {
    const { result } = renderHook(() =>
      useContact({ settings: mockSettings as CatalogSettings, getProductUrl, showToast })
    );
    const product = { id: 'p1', code: 'ARDO-WS60S', title: 'Ardo Paltaryuyan' } as any;
    result.current.openWhatsApp(product);
    expect(windowOpenSpy).toHaveBeenCalledOnce();
    const url = windowOpenSpy.mock.calls[0][0] as string;
    expect(url).toContain('ARDO-WS60S');
  });

  it('openWhatsApp nömrə yoxdursa toast göstərir', () => {
    const emptySettings = { ...mockSettings, whatsappNumber: '' } as CatalogSettings;
    const { result } = renderHook(() =>
      useContact({ settings: emptySettings, getProductUrl, showToast })
    );
    result.current.openWhatsApp();
    expect(showToast).toHaveBeenCalledOnce();
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it('openCall window.open tel: URL ilə çağırır', () => {
    const { result } = renderHook(() =>
      useContact({ settings: mockSettings as CatalogSettings, getProductUrl, showToast })
    );
    result.current.openCall();
    expect(windowOpenSpy).toHaveBeenCalledOnce();
    expect(windowOpenSpy.mock.calls[0][0]).toContain('tel:');
  });

  it('openCall nömrə yoxdursa toast göstərir', () => {
    const emptySettings = { ...mockSettings, phoneNumber: '', phoneNumbers: [] } as CatalogSettings;
    const { result } = renderHook(() =>
      useContact({ settings: emptySettings, getProductUrl, showToast })
    );
    result.current.openCall();
    expect(showToast).toHaveBeenCalledOnce();
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });
});
```

---

## Mövcud Testlərin Import Yollarını Yoxla

PROMPT_01 və PROMPT_08-dən sonra bəzi mövcud test faylları köhnə import yollarından istifadə edə bilər. Aşağıdakı faylları açıb yoxla:

```bash
# resolveRouteFromPath-i köhnə yoldan import edən testlər:
grep -rl "resolveRouteFromPath" site/src/__tests__/ site/tests/ 2>/dev/null
```

Nəticə fayllarında import yolu `'../App'` və ya `'../../App'` olarsa, `'../types/routes'` ilə əvəz et.

---

## Testləri Çalışdır

```bash
cd site

# Yalnız yeni test fayllarını çalışdır:
npx vitest run src/__tests__/useTheme.test.ts
npx vitest run src/__tests__/useCompare.test.ts
npx vitest run src/__tests__/useFavorites.test.ts
npx vitest run src/__tests__/useToast.test.ts
npx vitest run src/__tests__/resolveRouteFromPath.test.ts
npx vitest run src/__tests__/useContact.test.ts

# Bütün testlər:
npm run test:vitest
```

---

## Uğur Meyarı

- [ ] 6 yeni test faylı yaradılıb
- [ ] Hər test faylında minimum 5 test var
- [ ] `useTheme` testlərinin hamısı keçir
- [ ] `useCompare` testlərinin hamısı keçir
- [ ] `useFavorites` testlərinin hamısı keçir
- [ ] `useToast` testlərinin hamısı keçir
- [ ] `resolveRouteFromPath` testlərinin hamısı keçir
- [ ] `useContact` testlərinin hamısı keçir
- [ ] Köhnə testlər sınmır — `npm run test:vitest` nəticəsi əvvəlkindən az deyil
- [ ] Toplam test sayı artmışdır (84 → 90+)
