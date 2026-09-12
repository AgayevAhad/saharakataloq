/**
 * Candidate Brand Registry Seed Data from Public Retailer Directories (Baku Electronics & Kontakt Home).
 * Strict compliance with Phase 3 rule:
 * - Unverified candidate originCountry is null until verified by official manufacturer documents.
 * - No artificial fixed observedAt timestamps.
 * - Zero products, zero prices, zero stock, zero customer info, zero advertising claims, zero scraped media.
 */

export const CANDIDATE_BRAND_SEEDS = [
  {
    name: 'Bosch',
    slug: 'bosch',
    originCountry: null,
    observedName: 'Bosch',
    sourceUrl: 'https://www.bakuelectronics.az/brand/bosch.html',
    sourceType: 'retailer_catalog',
  },
  {
    name: 'Samsung',
    slug: 'samsung',
    originCountry: null,
    observedName: 'Samsung',
    sourceUrl: 'https://kontakt.az/az/brands/samsung',
    sourceType: 'retailer_catalog',
  },
  {
    name: 'LG',
    slug: 'lg',
    originCountry: null,
    observedName: 'LG',
    sourceUrl: 'https://kontakt.az/az/brands/lg',
    sourceType: 'retailer_catalog',
  },
  {
    name: 'Beko',
    slug: 'beko',
    originCountry: null,
    observedName: 'Beko',
    sourceUrl: 'https://www.bakuelectronics.az/brand/beko.html',
    sourceType: 'retailer_catalog',
  },
  {
    name: 'Philips',
    slug: 'philips',
    originCountry: null,
    observedName: 'Philips',
    sourceUrl: 'https://kontakt.az/az/brands/philips',
    sourceType: 'retailer_catalog',
  },
  {
    name: 'Tefal',
    slug: 'tefal',
    originCountry: null,
    observedName: 'Tefal',
    sourceUrl: 'https://www.bakuelectronics.az/brand/tefal.html',
    sourceType: 'retailer_catalog',
  },
  {
    name: 'DeLonghi',
    slug: 'delonghi',
    originCountry: null,
    observedName: 'DeLonghi',
    sourceUrl: 'https://kontakt.az/az/brands/delonghi',
    sourceType: 'retailer_catalog',
  },
  {
    name: 'Braun',
    slug: 'braun',
    originCountry: null,
    observedName: 'Braun',
    sourceUrl: 'https://www.bakuelectronics.az/brand/braun.html',
    sourceType: 'retailer_catalog',
  },
  {
    name: 'Electrolux',
    slug: 'electrolux',
    originCountry: null,
    observedName: 'Electrolux',
    sourceUrl: 'https://kontakt.az/az/brands/electrolux',
    sourceType: 'retailer_catalog',
  },
  {
    name: 'Gorenje',
    slug: 'gorenje',
    originCountry: null,
    observedName: 'Gorenje',
    sourceUrl: 'https://www.bakuelectronics.az/brand/gorenje.html',
    sourceType: 'retailer_catalog',
  },
  {
    name: 'Siemens',
    slug: 'siemens',
    originCountry: null,
    observedName: 'Siemens',
    sourceUrl: 'https://kontakt.az/az/brands/siemens',
    sourceType: 'retailer_catalog',
  },
  {
    name: 'Midea',
    slug: 'midea',
    originCountry: null,
    observedName: 'Midea',
    sourceUrl: 'https://www.bakuelectronics.az/brand/midea.html',
    sourceType: 'retailer_catalog',
  },
  {
    name: 'Haier',
    slug: 'haier',
    originCountry: null,
    observedName: 'Haier',
    sourceUrl: 'https://kontakt.az/az/brands/haier',
    sourceType: 'retailer_catalog',
  },
];
