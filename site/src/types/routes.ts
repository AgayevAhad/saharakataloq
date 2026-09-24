import { featureFlags } from '../utils/featureFlags';

export type RouteName =
  | 'home'
  | 'catalog'
  | 'brands'
  | 'brand'
  | 'services'
  | 'stores'
  | 'compare'
  | 'support'
  | 'cart'
  | 'favorites'
  | 'account'
  | 'product'
  | 'about'
  | 'careers'
  | 'terms'
  | 'privacy'
  | 'delivery'
  | 'warranty'
  | 'returns'
  | 'faq'
  | '404';

// Route adından URL-ə çevirmə xəritəsi
export const ROUTE_TO_PATH: Record<RouteName, string> = {
  home: '/',
  catalog: '/catalog',
  brands: '/brands',
  brand: '/brand', // + /:slug əlavə edilir
  services: '/services',
  stores: '/stores',
  compare: '/compare',
  support: '/support',
  cart: '/cart',
  favorites: '/favorites',
  account: '/account',
  product: '/product', // + /:id əlavə edilir
  about: '/about',
  careers: '/careers',
  terms: '/terms',
  privacy: '/privacy',
  delivery: '/catdirilma',
  warranty: '/zemanet',
  returns: '/qaytarma',
  faq: '/faq',
  '404': '/404',
};

// URL yolundan route resolve etmə — mövcud resolveRouteFromPath funksiyası
export const resolveRouteFromPath = (
  path: string
): { route: RouteName; category?: string; brand?: string; productId?: string } => {
  if (!path) return { route: 'home' };
  const clean = path.split('?')[0].replace(/\/$/, '') || '/';
  if (clean === '/' || clean === '') return { route: 'home' };
  if (clean === '/catalog' || clean === '/kataloq') return { route: 'catalog' };
  if (clean === '/brands' || clean === '/brendler' || clean === '/brend')
    return { route: 'brands' };
  if (clean === '/services' || clean === '/xidmetler') return { route: 'services' };
  if (
    clean === '/support' ||
    clean === '/elaqe' ||
    clean === '/komek' ||
    clean === '/destek' ||
    clean === '/musteri-desteyi' ||
    clean === '/musteri-xidmetleri'
  )
    return { route: 'support' };
  if (clean === '/faq' || clean === '/tez-tez-verilen-suallar' || clean === '/suallar')
    return { route: 'faq' };
  if (clean === '/qaytarma' || clean === '/geri-qaytarma' || clean === '/returns')
    return { route: 'returns' };
  if (clean === '/stores' || clean === '/magazalar' || clean === '/magaza')
    return { route: 'stores' };
  if (clean === '/catdirilma' || clean === '/delivery') return { route: 'delivery' };
  if (clean === '/zemanet' || clean === '/warranty') return { route: 'warranty' };
  if (clean === '/cart' || clean === '/sebet') return { route: 'cart' };
  if (
    clean === '/favorites' ||
    clean === '/wishlist' ||
    clean === '/secilmisler' ||
    clean === '/sevimliler' ||
    clean === '/beyenilenler'
  )
    return { route: 'favorites' };
  if (clean === '/about' || clean === '/haqqimizda' || clean === '/haqqinda')
    return { route: 'about' };
  if (clean === '/careers' || clean === '/karyera' || clean === '/vakansiyalar')
    return { route: 'careers' };
  if (clean === '/terms' || clean === '/istifade-sertleri' || clean === '/qaydalar')
    return { route: 'terms' };
  if (clean === '/privacy' || clean === '/mexfilik-siyaseti' || clean === '/mexfilik')
    return { route: 'privacy' };
  if (
    clean === '/account' ||
    clean === '/profile' ||
    clean === '/login' ||
    clean === '/register' ||
    clean === '/auth'
  )
    return { route: 'account' };
  if (clean === '/compare')
    return { route: featureFlags.isEnabled('enableCompare') ? 'compare' : '404' };
  if (clean.startsWith('/product/')) {
    const id = clean.replace('/product/', '');
    return { route: 'product', productId: id };
  }
  if (clean.startsWith('/category/')) {
    const slug = clean.replace('/category/', '');
    return { route: 'catalog', category: slug };
  }
  if (clean.startsWith('/brand/')) {
    const slug = clean.replace('/brand/', '');
    return { route: 'brand', brand: slug };
  }
  if (clean === '/404') return { route: '404' };
  return { route: '404' };
};
