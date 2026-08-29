import { Brand, CatalogCategory, Product, ProductMedia, ProductSpecItem } from '../types/product';

/**
 * Escapes a cell value for standard CSV (RFC 4180).
 */
const escapeCsvCell = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Parses a standard CSV string into an array of rows with proper quote handling.
 */
export const parseCsvText = (csvText: string): string[][] => {
  const clean = csvText.replace(/^\uFEFF/, ''); // Remove UTF-8 BOM if present
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++; // Skip escaped quote
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n in \r\n
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
};

/**
 * Exports products into a formatted CSV with UTF-8 BOM for Microsoft Excel compatibility.
 */
export const exportProductsToCsv = (
  products: Product[],
  categories: CatalogCategory[],
  brands: Brand[]
): string => {
  const headers = [
    'Model Kodu',
    'Məhsul Adı',
    'Brend',
    'Kateqoriya',
    'Qiymət',
    'Köhnə Qiymət',
    'Valyuta',
    'Kampaniya Nişanı',
    'Nişan Rəngi',
    'Stok Vəziyyəti',
    'Status',
    'Mənşə Ölkəsi',
    'Qısa Təsvir',
    'Əsas Üstünlüklər (Nöqtə-vergüllə)',
    'Əsas Şəkil URL',
    'Qalereya Şəkilləri (Nöqtə-vergüllə)',
    'Texniki Xüsusiyyətlər (Ad:Dəyər; Ad:Dəyər)',
  ];

  const lines = [headers.map(escapeCsvCell).join(',')];

  for (const p of products) {
    const brandName = brands.find((b) => b.id === p.brandId)?.name || p.brandId || 'ARDO';
    const categoryName = categories.find((c) => c.id === p.category)?.name || p.categoryName;
    const highlightsStr = (p.highlights || []).join('; ');
    const galleryStr = (p.gallery || []).join('; ');
    const specsStr = (p.specs || []).map((s) => `${s.name}:${s.value}`).join('; ');

    const row = [
      p.code,
      p.title,
      brandName,
      categoryName,
      p.price !== undefined ? p.price : '',
      p.oldPrice !== undefined ? p.oldPrice : '',
      p.currency || '₼',
      p.badgeText || '',
      p.badgeColor || 'red',
      p.stockStatus || 'in_stock',
      p.status || 'published',
      p.manufacturingCountry || '',
      p.shortDesc || '',
      highlightsStr,
      p.image || '',
      galleryStr,
      specsStr,
    ];

    lines.push(row.map(escapeCsvCell).join(','));
  }

  // Prepend UTF-8 BOM (\uFEFF) for Excel Azerbaijani character rendering
  return '\uFEFF' + lines.join('\r\n');
};

/**
 * Generates an empty sample template with instructions and 2 sample rows.
 */
export const generateCsvTemplate = (): string => {
  const sampleProducts: Product[] = [
    {
      id: 'template-1',
      code: 'ARDO-HD60-S',
      title: 'ARDO 60 sm İnox Aspirator',
      brandId: 'ardo',
      category: 'hood',
      categoryName: 'Aspiratorlar',
      image: '/media/brands/ardo-logo.png',
      gallery: [],
      price: 450,
      oldPrice: 520,
      currency: '₼',
      badgeText: 'Yeni Model',
      badgeColor: 'red',
      stockStatus: 'in_stock',
      shortDesc: 'İtalyan mühərrikli, yüksək sovurma gücünə malik aspirator.',
      highlights: ['750 m3/saat sovurma gücü', 'LED işıqlandırma', 'Paslanmayan polad korpus'],
      specs: [
        { id: 's1', name: 'Sovurma gücü', value: '750 m³/saat', group: 'Əsas' },
        { id: 's2', name: 'Səs səviyyəsi', value: '52 dB', group: 'Əsas' },
      ],
      manufacturingCountry: 'İtaliya',
      status: 'published',
    },
  ];

  const sampleCategories: CatalogCategory[] = [
    { id: 'hood', name: 'Aspiratorlar', slug: 'aspiratorlar', active: true },
  ];
  const sampleBrands: Brand[] = [
    { id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'İtaliya', manufacturingCountries: ['Türkiyə', 'Çin'], active: true },
  ];

  return exportProductsToCsv(sampleProducts, sampleCategories, sampleBrands);
};

/**
 * Parses imported CSV rows into structured Product objects.
 */
export const importProductsFromCsv = (
  csvText: string,
  categories: CatalogCategory[],
  brands: Brand[]
): { products: Product[]; errors: string[] } => {
  const rows = parseCsvText(csvText);
  if (rows.length < 2) {
    return { products: [], errors: ['CSV faylında başlıq və ya məlumat tapılmadı.'] };
  }

  const products: Product[] = [];
  const errors: string[] = [];

  // Skip header row
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (!row || row.length < 2 || !row[0]) continue;

    const [
      code,
      title,
      brandRaw,
      categoryRaw,
      priceRaw,
      oldPriceRaw,
      currencyRaw,
      badgeRaw,
      badgeColorRaw,
      stockStatusRaw,
      statusRaw,
      countryRaw,
      descRaw,
      highlightsRaw,
      imageRaw,
      galleryRaw,
      specsRaw,
    ] = row;

    if (!code || !title) {
      errors.push(`Sətir ${rowIndex + 1}: Model kodu və ya Məhsul adı boşdur.`);
      continue;
    }

    // Match or fallback brand
    const matchedBrand = brands.find(
      (b) =>
        b.name.toLowerCase() === (brandRaw || '').toLowerCase() ||
        b.id.toLowerCase() === (brandRaw || '').toLowerCase()
    );
    const brandId = matchedBrand?.id || 'ardo';

    // Match or fallback category
    const matchedCat = categories.find(
      (c) =>
        c.name.toLowerCase() === (categoryRaw || '').toLowerCase() ||
        c.id.toLowerCase() === (categoryRaw || '').toLowerCase()
    );
    const categoryId = matchedCat?.id || categories[0]?.id || 'hood';
    const categoryName = matchedCat?.name || categories[0]?.name || 'Məhsul';

    // Parse highlights
    const highlights = (highlightsRaw || '')
      .split(';')
      .map((h) => h.trim())
      .filter(Boolean);

    // Parse gallery
    const gallery = (galleryRaw || '')
      .split(';')
      .map((g) => g.trim())
      .filter(Boolean);

    // Parse specs (Name:Value)
    const specs: ProductSpecItem[] = [];
    if (specsRaw) {
      const parts = specsRaw.split(';');
      parts.forEach((part, sIdx) => {
        const colonIdx = part.indexOf(':');
        if (colonIdx !== -1) {
          const name = part.slice(0, colonIdx).trim();
          const value = part.slice(colonIdx + 1).trim();
          if (name && value) {
            specs.push({
              id: `spec-imp-${rowIndex}-${sIdx + 1}`,
              name,
              value,
              group: 'Əsas',
            });
          }
        }
      });
    }

    const price = priceRaw && !isNaN(Number(priceRaw)) ? Number(priceRaw) : undefined;
    const oldPrice = oldPriceRaw && !isNaN(Number(oldPriceRaw)) ? Number(oldPriceRaw) : undefined;

    const badgeColor = ['red', 'green', 'amber', 'blue', 'purple'].includes(badgeColorRaw)
      ? (badgeColorRaw as Product['badgeColor'])
      : 'red';

    const stockStatus = ['in_stock', 'out_of_stock', 'preorder'].includes(stockStatusRaw)
      ? (stockStatusRaw as Product['stockStatus'])
      : 'in_stock';

    const status = statusRaw === 'draft' ? 'draft' : 'published';

    const product: Product = {
      id: `p-${Date.now().toString(36)}-${rowIndex}`,
      code: code.trim(),
      title: title.trim(),
      brandId,
      category: categoryId,
      categoryName,
      price,
      oldPrice,
      currency: currencyRaw ? currencyRaw.trim() : '₼',
      badgeText: badgeRaw ? badgeRaw.trim() : '',
      badgeColor,
      stockStatus,
      status,
      manufacturingCountry: countryRaw ? countryRaw.trim() : '',
      shortDesc: descRaw ? descRaw.trim() : '',
      highlights,
      specs,
      image: imageRaw ? imageRaw.trim() : '',
      gallery,
      media: [
        ...(imageRaw ? [{ id: `med-main-${rowIndex}`, type: 'image' as const, url: imageRaw.trim() }] : []),
        ...gallery.map((g, gIdx) => ({ id: `med-gal-${rowIndex}-${gIdx + 1}`, type: 'image' as const, url: g })),
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.push(product);
  }

  return { products, errors };
};

/**
 * Triggers a browser download of text content as a file.
 */
export const downloadFile = (content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
