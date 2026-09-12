import { Brand, CatalogCategory, CatalogData, CatalogSettings, Product, StoreAddress, TechnologyArticle, BrandRailData } from '../types/product';

export const DEFAULT_BRAND_RAIL: BrandRailData = {
  enabled: true,
  settings: {
    id: 'default',
    enabled: true,
    title: 'Brendlər',
    animationEnabled: true,
    speedSeconds: 30,
    direction: 'left',
    pauseOnHover: true,
    edgeFade: true,
    cardSize: 'md',
    sectionOrder: 1,
    themeVariant: 'neutral',
    version: 1,
  },
  items: [],
};

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
    description: '',
    logo: '/media/brands/ardo-logo.png',
    active: true,
    comingSoon: false,
  },
  {
    id: 'lotus',
    name: 'LOTUS',
    slug: 'lotus',
    originCountry: 'Türkiyə',
    manufacturingCountries: ['Türkiyə', 'Çin'],
    description: '',
    logo: '/media/brands/lotus-logo.png',
    active: true,
    comingSoon: true,
  },
  { id: 'artel', name: 'ARTEL', slug: 'artel', originCountry: 'Özbəkistan', manufacturingCountries: ['Özbəkistan'], logo: '/media/brands/artel-logo.svg', active: true, comingSoon: true },
];

export const DEFAULT_CATEGORIES: CatalogCategory[] = [
  { id: 'hood', name: 'Aspiratorlar', slug: 'aspiratorlar', icon: 'Wind', active: true, sortOrder: 0 },
  { id: 'air_conditioner', name: 'Kondisionerlər', slug: 'kondisionerler', icon: 'Snowflake', active: true, sortOrder: 1 },
  { id: 'microwave', name: 'Mikrodalğalı sobalar', slug: 'mikrodalgali-sobalar', icon: 'Box', active: true, sortOrder: 2 },
  { id: 'cooktop', name: 'Bişirmə panelləri', slug: 'bisirme-panelleri', icon: 'Flame', active: true, sortOrder: 3 },
  { id: 'oven', name: 'Sobalar', slug: 'sobalar', icon: 'Layers', active: true, sortOrder: 4 },
  { id: 'refrigerator', name: 'Soyuducular', slug: 'soyuducular', icon: 'Refrigerator', active: true, sortOrder: 5 },
  { id: 'airfryer', name: 'Fritözlər & Airfryer', slug: 'airfryer', icon: 'Flame', active: true, sortOrder: 6 },
  { id: 'washer', name: 'Paltaryuyanlar', slug: 'paltaryuyanlar', icon: 'Layers', active: true, sortOrder: 7 },
  { id: 'thermopot', name: 'Termopotlar', slug: 'termopotlar', icon: 'Box', active: true, sortOrder: 8 },
  { id: 'vacuum_cleaner', name: 'Tozsoranlar', slug: 'tozsoranlar', icon: 'Wind', active: true, sortOrder: 9 },
  { id: 'tv', name: 'Televizorlar', slug: 'televizorlar', icon: 'Box', active: true, sortOrder: 10 },
  { id: 'meat_grinder', name: 'Ətçəkənlər', slug: 'etcekenler', icon: 'Box', active: true, sortOrder: 11 },
  { id: 'iron', name: 'Ütülər', slug: 'utuler', icon: 'Wind', active: true, sortOrder: 12 },
];

export const DEFAULT_ARTICLES: TechnologyArticle[] = [];

export const DEFAULT_ADDRESSES: StoreAddress[] = [];

export const DEFAULT_SETTINGS: CatalogSettings = {
  whatsappNumber: '',
  phoneNumber: '',
  phoneNumbers: [],
  companyName: 'Sahara Electronics',
  address: '',
  addresses: DEFAULT_ADDRESSES,
  email: 'info@saharaelectronics.az',
  workingHours: 'Bazar ertəsi - Bazar: 09:00 - 18:00',
  mapUrl: '',
  locationNote: '',
  countries: DEFAULT_COUNTRIES,
  instagramUsername: '@sahara.electronics',
  instagramUrl: 'https://instagram.com/sahara.electronics',
  facebookUsername: 'Sahara Electronics',
  facebookUrl: 'https://facebook.com/saharaelectronics',
  siteTitle: 'Sahara Electronics – Məhsul Kataloqu',
  siteSubtitle: 'Məişət texnikası modelləri və keyfiyyətli məhsul kataloqu',
  headerCaption: 'Məhsul kataloqu',
  catalogHeading: 'Bütün məhsullar',
  catalogSubheading: 'Modellərə və texniki xüsusiyyət sahələrinə baxın',
  heroBannerTitle: 'Sahara Electronics — Məhsul Kataloqu',
  heroBannerSubtitle: 'Məişət və mətbəx texnikası modelləri, texniki parametrlər və rəsmi məhsul seçimi',
  footerAbout: 'Sahara Electronics ARDO, Lotus və Artel məhsullarının kataloq platformasıdır.',
  footerCopyright: 'Bütün hüquqlar qorunur.',
  primaryColor: '#dc2626',
  fontFamily: 'Inter',
  whatsappButtonText: 'WhatsApp',
  callButtonText: 'Zəng et',
  shareButtonText: 'Paylaş',
  scrollTopButtonText: 'Yuxarı',
  catalogActive: true,
  maintenanceMessage: 'Kataloqda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.',
};

export const normalizeProduct = (product: Product): Product => {
  const gallery = Array.from(new Set([product.image, ...(product.gallery || [])].filter(Boolean)));
  return {
    ...product,
    highlights: product.highlights || [],
    specs: product.specs || [],
    brandId: product.brandId || 'ardo',
    gallery,
    badgeText: product.badgeText || '',
    badgeColor: product.badgeColor || 'red',
    price: typeof product.price === 'number' ? product.price : undefined,
    oldPrice: typeof product.oldPrice === 'number' ? product.oldPrice : undefined,
    currency: product.currency || '₼',
    stockStatus: product.stockStatus || 'in_stock',
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
  brandRail: DEFAULT_BRAND_RAIL,
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

  let addresses: StoreAddress[] = DEFAULT_ADDRESSES;
  if (Array.isArray(data?.settings?.addresses) && data.settings.addresses.length) {
    addresses = data.settings.addresses.filter((a) => a && a.address);
  } else if (data?.settings?.address) {
    addresses = [
      {
        id: 'addr-1',
        title: 'Əsas Mağaza',
        address: data.settings.address,
        mapUrl: data.settings.mapUrl || '',
        note: data.settings.locationNote || '',
        workingHours: data.settings.workingHours || DEFAULT_SETTINGS.workingHours,
      },
    ];
  }

  const primaryAddress = addresses[0]?.address || data?.settings?.address || DEFAULT_SETTINGS.address;

  return {
    brands: Array.isArray(data?.brands) && data.brands.length ? data.brands : DEFAULT_BRANDS,
    categories:
      Array.isArray(data?.categories) && data.categories.length ? data.categories : DEFAULT_CATEGORIES,
    products: Array.isArray(data?.products) ? data.products.map(normalizeProduct) : DEFAULT_CATALOG.products,
    articles,
    brandRail: data?.brandRail || DEFAULT_BRAND_RAIL,
    settings: {
      whatsappNumber: data?.settings?.whatsappNumber || '',
      phoneNumber: data?.settings?.phoneNumber || phoneNumbers[0] || '',
      phoneNumbers,
      companyName: data?.settings?.companyName || DEFAULT_SETTINGS.companyName,
      address: primaryAddress,
      addresses,
      email: data?.settings?.email || DEFAULT_SETTINGS.email,
      workingHours: data?.settings?.workingHours || DEFAULT_SETTINGS.workingHours,
      mapUrl: data?.settings?.mapUrl || addresses[0]?.mapUrl || '',
      locationNote: data?.settings?.locationNote || addresses[0]?.note || DEFAULT_SETTINGS.locationNote,
      countries,
      instagramUsername: data?.settings?.instagramUsername ?? DEFAULT_SETTINGS.instagramUsername,
      instagramUrl: data?.settings?.instagramUrl ?? DEFAULT_SETTINGS.instagramUrl,
      facebookUsername: data?.settings?.facebookUsername ?? DEFAULT_SETTINGS.facebookUsername,
      facebookUrl: data?.settings?.facebookUrl ?? DEFAULT_SETTINGS.facebookUrl,
      siteTitle: data?.settings?.siteTitle || DEFAULT_SETTINGS.siteTitle,
      siteSubtitle: data?.settings?.siteSubtitle || DEFAULT_SETTINGS.siteSubtitle,
      headerCaption: data?.settings?.headerCaption || DEFAULT_SETTINGS.headerCaption,
      catalogHeading: data?.settings?.catalogHeading || DEFAULT_SETTINGS.catalogHeading,
      catalogSubheading: data?.settings?.catalogSubheading || DEFAULT_SETTINGS.catalogSubheading,
      heroBannerTitle: data?.settings?.heroBannerTitle || DEFAULT_SETTINGS.heroBannerTitle,
      heroBannerSubtitle: data?.settings?.heroBannerSubtitle || DEFAULT_SETTINGS.heroBannerSubtitle,
      footerAbout: data?.settings?.footerAbout || DEFAULT_SETTINGS.footerAbout,
      footerCopyright: data?.settings?.footerCopyright || DEFAULT_SETTINGS.footerCopyright,
      primaryColor: data?.settings?.primaryColor || DEFAULT_SETTINGS.primaryColor,
      fontFamily: data?.settings?.fontFamily || DEFAULT_SETTINGS.fontFamily,
      whatsappButtonText: data?.settings?.whatsappButtonText || DEFAULT_SETTINGS.whatsappButtonText,
      callButtonText: data?.settings?.callButtonText || DEFAULT_SETTINGS.callButtonText,
      shareButtonText: data?.settings?.shareButtonText || DEFAULT_SETTINGS.shareButtonText,
      scrollTopButtonText: data?.settings?.scrollTopButtonText || DEFAULT_SETTINGS.scrollTopButtonText,
      catalogActive: data?.settings?.catalogActive !== undefined ? data.settings.catalogActive : true,
      maintenanceMessage: data?.settings?.maintenanceMessage || DEFAULT_SETTINGS.maintenanceMessage,
    },
    countries,
    updatedAt: data?.updatedAt,
  };
};
