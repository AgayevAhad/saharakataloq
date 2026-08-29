import * as XLSX from 'xlsx';
import { Brand, CatalogCategory, Product, ProductSpecItem } from '../types/product';

/**
 * Generates an Excel Worksheet 2D array representation from products.
 */
export const buildProductsSheetData = (
  products: Product[],
  categories: CatalogCategory[],
  brands: Brand[]
): (string | number)[][] => {
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

  const rows: (string | number)[][] = [headers];

  for (const p of products) {
    const brandName = brands.find((b) => b.id === p.brandId)?.name || p.brandId || 'ARDO';
    const categoryName = categories.find((c) => c.id === p.category)?.name || p.categoryName;
    const highlightsStr = (p.highlights || []).join('; ');
    const galleryStr = (p.gallery || []).join('; ');
    const specsStr = (p.specs || []).map((s) => `${s.name}:${s.value}`).join('; ');

    rows.push([
      p.code || '',
      p.title || '',
      brandName,
      categoryName || '',
      p.price !== undefined && p.price !== null ? p.price : '',
      p.oldPrice !== undefined && p.oldPrice !== null ? p.oldPrice : '',
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
    ]);
  }

  return rows;
};

/**
 * Exports products into an Excel (.xlsx) binary buffer.
 */
export const exportProductsToExcel = (
  products: Product[],
  categories: CatalogCategory[],
  brands: Brand[]
): Uint8Array => {
  const data = buildProductsSheetData(products, categories, brands);
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths for better readability in Excel
  worksheet['!cols'] = [
    { wch: 16 }, // Model Kodu
    { wch: 32 }, // Məhsul Adı
    { wch: 14 }, // Brend
    { wch: 18 }, // Kateqoriya
    { wch: 12 }, // Qiymət
    { wch: 14 }, // Köhnə Qiymət
    { wch: 10 }, // Valyuta
    { wch: 18 }, // Kampaniya Nişanı
    { wch: 12 }, // Nişan Rəngi
    { wch: 14 }, // Stok Vəziyyəti
    { wch: 12 }, // Status
    { wch: 16 }, // Mənşə Ölkəsi
    { wch: 35 }, // Qısa Təsvir
    { wch: 40 }, // Üstünlüklər
    { wch: 35 }, // Əsas Şəkil
    { wch: 40 }, // Qalereya
    { wch: 45 }, // Texniki Xüsusiyyətlər
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Məhsullar');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
};

/**
 * Generates an empty sample Excel (.xlsx) template with sample products.
 */
export const generateExcelTemplate = (): Uint8Array => {
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
    {
      id: 'template-2',
      code: 'ARDO-OV60-BL',
      title: 'ARDO 60 sm Qara Ankastre Soba',
      brandId: 'ardo',
      category: 'oven',
      categoryName: 'Sobalar',
      image: '/media/brands/ardo-logo.png',
      gallery: [],
      price: 680,
      oldPrice: 750,
      currency: '₼',
      badgeText: 'Top Satış',
      badgeColor: 'green',
      stockStatus: 'in_stock',
      shortDesc: 'A+ enerji sinfi, 8 bişirmə proqramı və teleskopik relslər.',
      highlights: ['A+ Enerji sinfi', '8 Bişirmə funksiyası', 'Katalitik təmizlənmə'],
      specs: [
        { id: 's3', name: 'Həcm', value: '65 L', group: 'Əsas' },
        { id: 's4', name: 'Proqram sayı', value: '8', group: 'Funksiyalar' },
      ],
      manufacturingCountry: 'Türkiyə',
      status: 'published',
    },
  ];

  const sampleCategories: CatalogCategory[] = [
    { id: 'hood', name: 'Aspiratorlar', slug: 'aspiratorlar', active: true },
    { id: 'oven', name: 'Sobalar', slug: 'sobalar', active: true },
  ];
  const sampleBrands: Brand[] = [
    { id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'İtaliya', manufacturingCountries: ['Türkiyə', 'Çin'], active: true },
  ];

  return exportProductsToExcel(sampleProducts, sampleCategories, sampleBrands);
};

/**
 * Parses imported Excel workbook (.xlsx / .xls) buffer into structured Product objects.
 */
export const importProductsFromExcel = (
  buffer: ArrayBuffer | Uint8Array,
  categories: CatalogCategory[],
  brands: Brand[]
): { products: Product[]; errors: string[] } => {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { products: [], errors: ['Excel faylında heç bir vərəq (sheet) tapılmadı.'] };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 });

    if (!rows || rows.length < 2) {
      return { products: [], errors: ['Excel faylında başlıq və ya məlumat tapılmadı.'] };
    }

    const products: Product[] = [];
    const errors: string[] = [];

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (!row || row.length < 2 || !row[0]) continue;

      const code = String(row[0] || '').trim();
      const title = String(row[1] || '').trim();
      const brandRaw = String(row[2] || '').trim();
      const categoryRaw = String(row[3] || '').trim();
      const priceRaw = row[4];
      const oldPriceRaw = row[5];
      const currencyRaw = String(row[6] || '₼').trim();
      const badgeRaw = String(row[7] || '').trim();
      const badgeColorRaw = String(row[8] || 'red').trim();
      const stockStatusRaw = String(row[9] || 'in_stock').trim();
      const statusRaw = String(row[10] || 'published').trim();
      const countryRaw = String(row[11] || '').trim();
      const descRaw = String(row[12] || '').trim();
      const highlightsRaw = String(row[13] || '').trim();
      const imageRaw = String(row[14] || '').trim();
      const galleryRaw = String(row[15] || '').trim();
      const specsRaw = String(row[16] || '').trim();

      if (!code || !title) {
        errors.push(`Sətir ${rowIndex + 1}: Model kodu və ya Məhsul adı boşdur.`);
        continue;
      }

      // Match brand
      const matchedBrand = brands.find(
        (b) =>
          b.name.toLowerCase() === brandRaw.toLowerCase() ||
          b.id.toLowerCase() === brandRaw.toLowerCase()
      );
      const brandId = matchedBrand?.id || 'ardo';

      // Match category
      const matchedCat = categories.find(
        (c) =>
          c.name.toLowerCase() === categoryRaw.toLowerCase() ||
          c.id.toLowerCase() === categoryRaw.toLowerCase()
      );
      const categoryId = matchedCat?.id || categories[0]?.id || 'hood';
      const categoryName = matchedCat?.name || categories[0]?.name || 'Məhsul';

      // Parse highlights
      const highlights = highlightsRaw
        ? highlightsRaw.split(';').map((h) => h.trim()).filter(Boolean)
        : [];

      // Parse gallery
      const gallery = galleryRaw
        ? galleryRaw.split(';').map((g) => g.trim()).filter(Boolean)
        : [];

      // Parse specs
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
                id: `spec-xls-${rowIndex}-${sIdx + 1}`,
                name,
                value,
                group: 'Əsas',
              });
            }
          }
        });
      }

      const price = priceRaw !== undefined && priceRaw !== '' && !isNaN(Number(priceRaw))
        ? Number(priceRaw)
        : undefined;

      const oldPrice = oldPriceRaw !== undefined && oldPriceRaw !== '' && !isNaN(Number(oldPriceRaw))
        ? Number(oldPriceRaw)
        : undefined;

      const badgeColor = ['red', 'green', 'amber', 'blue', 'purple'].includes(badgeColorRaw)
        ? (badgeColorRaw as Product['badgeColor'])
        : 'red';

      const stockStatus = ['in_stock', 'out_of_stock', 'preorder'].includes(stockStatusRaw)
        ? (stockStatusRaw as Product['stockStatus'])
        : 'in_stock';

      const status = statusRaw === 'draft' ? 'draft' : 'published';

      const product: Product = {
        id: `p-${Date.now().toString(36)}-${rowIndex}`,
        code,
        title,
        brandId,
        category: categoryId,
        categoryName,
        price,
        oldPrice,
        currency: currencyRaw || '₼',
        badgeText: badgeRaw,
        badgeColor,
        stockStatus,
        status,
        manufacturingCountry: countryRaw,
        shortDesc: descRaw,
        highlights,
        specs,
        image: imageRaw,
        gallery,
        media: [
          ...(imageRaw ? [{ id: `med-main-${rowIndex}`, type: 'image' as const, url: imageRaw }] : []),
          ...gallery.map((g, gIdx) => ({ id: `med-gal-${rowIndex}-${gIdx + 1}`, type: 'image' as const, url: g })),
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      products.push(product);
    }

    return { products, errors };
  } catch (err) {
    return {
      products: [],
      errors: [err instanceof Error ? `Excel oxuma xətası: ${err.message}` : 'Excel faylı oxuna bilmədi.'],
    };
  }
};

/**
 * Triggers browser download of binary Excel (.xlsx) file.
 */
export const downloadExcelFile = (buffer: Uint8Array | ArrayBuffer, filename: string) => {
  const blob = new Blob([buffer as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
