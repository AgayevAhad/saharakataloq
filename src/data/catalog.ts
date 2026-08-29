import { Brand, CatalogCategory, CatalogData, CatalogSettings, Product, TechnologyArticle } from '../types/product';

export const DEFAULT_COUNTRIES: string[] = [
  'Türkiyə',
  'Çin',
  'İtaliya',
  'Almaniya',
  'Polşa',
  'Özbəkistan',
  'Rusiya',
  'Belarus',
];

export const DEFAULT_BRANDS: Brand[] = [
  {
    id: 'ardo',
    name: 'ARDO',
    slug: 'ardo',
    originCountry: 'İtaliya',
    manufacturingCountries: ['Türkiyə', 'Çin'],
    description: 'İtalyan brendi. Orijinal dizayn və yüksək keyfiyyət standartları.',
    logo: '/media/brands/ardo-logo.png',
    active: true,
    comingSoon: false,
  },
  { id: 'lotus', name: 'LOTUS', slug: 'lotus', originCountry: '', manufacturingCountries: [], logo: '/media/brands/lotus-mark.svg', active: true, comingSoon: true },
  { id: 'artel', name: 'ARTEL', slug: 'artel', originCountry: '', manufacturingCountries: [], logo: '/media/brands/artel-logo.svg', active: true, comingSoon: true },
];

export const DEFAULT_CATEGORIES: CatalogCategory[] = [
  { id: 'hood', name: 'Aspiratorlar', slug: 'aspiratorlar', icon: 'Wind', active: true, sortOrder: 0 },
  { id: 'air_conditioner', name: 'Kondisionerlər', slug: 'kondisionerler', icon: 'Snowflake', active: true, sortOrder: 1 },
  { id: 'microwave', name: 'Mikrodalğalı sobalar', slug: 'mikrodalgali-sobalar', icon: 'Box', active: true, sortOrder: 2 },
  { id: 'cooktop', name: 'Bişirmə panelləri', slug: 'bisirme-panelleri', icon: 'Flame', active: true, sortOrder: 3 },
  { id: 'oven', name: 'Sobalar', slug: 'sobalar', icon: 'Layers', active: true, sortOrder: 4 },
  { id: 'refrigerator', name: 'Soyuducular', slug: 'soyuducular', icon: 'Refrigerator', active: true, sortOrder: 5 },
];

export const DEFAULT_ARTICLES: TechnologyArticle[] = [
  {
    id: 'art-inverter',
    title: 'Məişət Texnikasında İnvertor Texnologiyası',
    subtitle: 'İş gücünü ehtiyaca uyğun tənzimləyən, enerjiyə qənaət edən və səssiz işləyən idarəetmə prinsipi.',
    badge: '⚡ Qənaət & Səssiz',
    icon: 'Zap',
    active: true,
    advantages: [
      { title: 'Tənzimlənən enerji istifadəsi', desc: 'Mühərrik və ya kompressor tələb olunan gücə uyğun dəqiq idarə olunaraq 40%-dək enerji qənaəti təmin edir.' },
      { title: 'Səs və vibrasiyanın azaldılması', desc: 'Fasiləsiz minimum gücdə işləyərək kəskin start-stop səslərini və vibrasiyanı aradan qaldırır.' },
      { title: 'Daha sabit iş rejimi və temperatur', desc: 'Tez-tez sönüb-yanmadan qoyulmuş dərəcəni daimi və bərabər saxlayır.' },
      { title: 'Uzunömürlü etibarlı istismar', desc: 'Aşınma və elektrik gərginliyi dalğalanmalarına qarşı daha yüksək dayanıqlılıq göstərir.' },
    ],
  },
  {
    id: 'art-sabaf',
    title: 'İtalyan SABAF Qaz Yanma Sistemi',
    subtitle: 'Dünyanın ən etibarlı və təhlükəsiz qaz forsunkaları ilə 100% təhlükəsizlik və qənaət.',
    badge: '🔥 İtalyan Təhlükəsizlik',
    icon: 'Flame',
    active: true,
    advantages: [
      { title: 'Qaz Nəzarət Sistemi (Gas Control)', desc: 'Külək və ya daşma səbəbilə alov sönərsə, qaz təchizatı 0.5 saniyə ərzində avtomatik bağlanır.' },
      { title: 'Yüksək Yanma Səmərəliliyi', desc: 'Mavi alov texnologiyası ilə maksimum istilik verimi yaradır, qaz itkisinin qarşısını alır.' },
      { title: 'Paslanmaz Orijinal Ərinti', desc: 'Yüksək temperatura dözümlü xüsusi ərinti korroziyaya uğramır və deşiklər tutulmur.' },
      { title: 'Bərabər İstilik Paylanması', desc: 'Qazan və tavaların dibinə istiliyi tam bərabər yayaraq yeməklərin dibinin yanmasını önləyir.' },
    ],
  },
  {
    id: 'art-convection',
    title: '3D Dairəvi Konveksiya və Bərabər Bişirmə',
    subtitle: 'Sobada ventilyator və dairəvi qızdırıcı element vasitəsilə restoran səviyyəsində bişirmə imkanı.',
    badge: '🌪️ 3D Konveksiya',
    icon: 'Wind',
    active: true,
    advantages: [
      { title: 'Bərabər İstilik Sirkulyasiyası', desc: 'İsti hava kameranın hər nöqtəsinə çatır, yeməklər hər iki tərəfdən qızılı bişir.' },
      { title: 'Çoxsəviyyəli Eyni Vaxtda Bişirmə', desc: '2 və ya 3 səviyyədə fərqli yeməkləri qoxuları qarışmadan eyni anda bişirə bilərsiniz.' },
      { title: '25% Daha Tez Hazırlıq', desc: 'Ənənəvi statik sobalara nisbətən yeməklər daha qısa müddətdə hazır olur.' },
      { title: 'Şirəli Daxili, Xırtıldayan Qabıq', desc: 'Yeməyin şirəsini daxilində saxlayaraq xaricdən mükəmməl xırtıldayan dad verir.' },
    ],
  },
];

export const DEFAULT_SETTINGS: CatalogSettings = {
  whatsappNumber: '',
  phoneNumber: '',
  phoneNumbers: [],
  companyName: 'Sahara Electronics',
  address: 'Bakı şəhəri, Sədərək Ticarət Mərkəzi',
  email: 'info@saharaelectronics.az',
  workingHours: 'Bazar ertəsi - Bazar: 09:00 - 18:00',
  mapUrl: '',
  locationNote: 'Məişət texnikası satışı və rəsmi zəmanət xidməti',
  countries: DEFAULT_COUNTRIES,
  instagramUsername: '@sahara.electronics',
  instagramUrl: 'https://instagram.com/sahara.electronics',
  facebookUsername: 'Sahara Electronics',
  facebookUrl: 'https://facebook.com/saharaelectronics',
};

export const normalizeProduct = (product: Product): Product => {
  const gallery = Array.from(new Set([product.image, ...(product.gallery || [])].filter(Boolean)));
  return {
    ...product,
    highlights: product.highlights || [],
    specs: product.specs || [],
    brandId: product.brandId || 'ardo',
    gallery,
    media: product.media?.length
      ? product.media
      : gallery.map((url, index) => ({
          id: `${product.id}-image-${index + 1}`,
          type: 'image' as const,
          url,
          alt: `${product.title} — görüntü ${index + 1}`,
        })),
    manufacturingCountry: product.manufacturingCountry || '',
    status: product.status || 'published',
  };
};

export const DEFAULT_CATALOG: CatalogData = {
  brands: DEFAULT_BRANDS,
  categories: DEFAULT_CATEGORIES,
  products: [],
  settings: DEFAULT_SETTINGS,
  countries: DEFAULT_COUNTRIES,
  articles: DEFAULT_ARTICLES,
};

export const normalizeCatalog = (data?: Partial<CatalogData> | null): CatalogData => {
  const countries = Array.isArray(data?.settings?.countries) && data?.settings?.countries.length
    ? data.settings.countries
    : Array.isArray(data?.countries) && data?.countries.length
      ? data.countries
      : DEFAULT_COUNTRIES;

  const phoneNumbers = Array.isArray(data?.settings?.phoneNumbers) && data.settings.phoneNumbers.length
    ? data.settings.phoneNumbers.filter(Boolean)
    : data?.settings?.phoneNumber
      ? [data.settings.phoneNumber]
      : [];

  const articles = Array.isArray(data?.articles) && data.articles.length
    ? data.articles
    : DEFAULT_ARTICLES;

  return {
    brands: Array.isArray(data?.brands) && data.brands.length ? data.brands : DEFAULT_BRANDS,
    categories:
      Array.isArray(data?.categories) && data.categories.length ? data.categories : DEFAULT_CATEGORIES,
    products: Array.isArray(data?.products) ? data.products.map(normalizeProduct) : DEFAULT_CATALOG.products,
    articles,
    settings: {
      whatsappNumber: data?.settings?.whatsappNumber || '',
      phoneNumber: data?.settings?.phoneNumber || phoneNumbers[0] || '',
      phoneNumbers,
      companyName: data?.settings?.companyName || DEFAULT_SETTINGS.companyName,
      address: data?.settings?.address || DEFAULT_SETTINGS.address,
      email: data?.settings?.email || DEFAULT_SETTINGS.email,
      workingHours: data?.settings?.workingHours || DEFAULT_SETTINGS.workingHours,
      mapUrl: data?.settings?.mapUrl || '',
      locationNote: data?.settings?.locationNote || DEFAULT_SETTINGS.locationNote,
      countries,
      instagramUsername: data?.settings?.instagramUsername ?? DEFAULT_SETTINGS.instagramUsername,
      instagramUrl: data?.settings?.instagramUrl ?? DEFAULT_SETTINGS.instagramUrl,
      facebookUsername: data?.settings?.facebookUsername ?? DEFAULT_SETTINGS.facebookUsername,
      facebookUrl: data?.settings?.facebookUrl ?? DEFAULT_SETTINGS.facebookUrl,
    },
    countries,
    updatedAt: data?.updatedAt,
  };
};
