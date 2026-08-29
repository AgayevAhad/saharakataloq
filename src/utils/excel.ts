import * as XLSX from 'xlsx';
import { Brand, CatalogCategory, Product, ProductSpecItem } from '../types/product';

/**
 * Parses multiline spec text (e.g. from "Ardo xüsusiyyətlər_yoxlanılıb.xlsx") into structured specs.
 */
export const parseMultilineSpecs = (text: string, prefixId = 'spec'): ProductSpecItem[] => {
  if (!text) return [];
  const specs: ProductSpecItem[] = [];
  const lines = String(text).split(/\r?\n/);
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const match = trimmed.match(/^([^–—:-]+)\s*[–—:-]\s*(.*)$/);
    if (match) {
      const name = match[1].trim();
      const value = match[2].trim();
      if (name && value) {
        specs.push({
          id: `${prefixId}-${idx + 1}`,
          name,
          value,
          group: 'Əsas',
        });
      }
    } else if (trimmed.includes(':')) {
      const idxColon = trimmed.indexOf(':');
      const name = trimmed.slice(0, idxColon).trim();
      const value = trimmed.slice(idxColon + 1).trim();
      if (name && value) {
        specs.push({
          id: `${prefixId}-${idx + 1}`,
          name,
          value,
          group: 'Əsas',
        });
      }
    }
  });
  return specs;
};

/**
 * Auto-detects product category from title.
 */
export const inferCategoryFromName = (
  title: string,
  categories: CatalogCategory[]
): { categoryId: string; categoryName: string } => {
  const lower = (title || '').toLowerCase();
  if (lower.includes('qabyuyan')) {
    const found = categories.find((c) => c.id === 'dishwasher' || c.id === 'qabyuyan' || c.name.toLowerCase().includes('qabyuyan'));
    if (found) return { categoryId: found.id, categoryName: found.name };
  }
  if (lower.includes('paltaryuyan')) {
    const found = categories.find((c) => c.id === 'washing_machine' || c.id === 'paltaryuyan' || c.name.toLowerCase().includes('paltaryuyan'));
    if (found) return { categoryId: found.id, categoryName: found.name };
  }
  if (lower.includes('aspirator')) {
    const found = categories.find((c) => c.id === 'hood' || c.id === 'aspirator' || c.name.toLowerCase().includes('aspirator'));
    if (found) return { categoryId: found.id, categoryName: found.name };
  }
  if (lower.includes('kondisioner')) {
    const found = categories.find((c) => c.id === 'air_conditioner' || c.name.toLowerCase().includes('kondisioner'));
    if (found) return { categoryId: found.id, categoryName: found.name };
  }
  if (lower.includes('mikro')) {
    const found = categories.find((c) => c.id === 'microwave' || c.name.toLowerCase().includes('mikro'));
    if (found) return { categoryId: found.id, categoryName: found.name };
  }
  if (lower.includes('plite') || lower.includes('piltə') || lower.includes('plitə') || lower.includes('panel')) {
    const found = categories.find((c) => c.id === 'cooktop' || c.id === 'plite' || c.name.toLowerCase().includes('bişirmə') || c.name.toLowerCase().includes('plitə') || c.name.toLowerCase().includes('panel'));
    if (found) return { categoryId: found.id, categoryName: found.name };
  }
  if (lower.includes('soba')) {
    const found = categories.find((c) => c.id === 'oven' || c.id === 'soba' || c.name.toLowerCase().includes('soba'));
    if (found) return { categoryId: found.id, categoryName: found.name };
  }
  if (lower.includes('soyuducu')) {
    const found = categories.find((c) => c.id === 'refrigerator' || c.id === 'soyuducu' || c.name.toLowerCase().includes('soyuducu'));
    if (found) return { categoryId: found.id, categoryName: found.name };
  }
  return { categoryId: categories[0]?.id || 'hood', categoryName: categories[0]?.name || 'Məhsul' };
};

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
 * Automatically supports both standard templates and "Ardo xüsusiyyətlər_yoxlanılıb.xlsx" style sheets.
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

    // Find the header row (it could be at row 0, 1, 2, or 3)
    let headerRowIndex = -1;
    let isArdoSpecFormat = false;

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const joined = row.map((c) => String(c || '').toLowerCase()).join(' ');

      if (joined.includes('model kodu') || joined.includes('model_kodu') || joined.includes('model kod')) {
        headerRowIndex = i;
        isArdoSpecFormat = false;
        break;
      }
      if (joined.includes('xüsusiyyətlər') || joined.includes('xususiyyetler') || (joined.includes('məhsul adı') && (joined.includes('satış qiyməti') || joined.includes('satis qiymeti')))) {
        headerRowIndex = i;
        isArdoSpecFormat = true;
        break;
      }
    }

    if (headerRowIndex === -1) {
      headerRowIndex = 0; // Default to first row
    }

    const products: Product[] = [];
    const errors: string[] = [];

    // Identify column indices
    const headerRow = rows[headerRowIndex] || [];
    const colIndex = (keyword: string) =>
      headerRow.findIndex((c) => String(c || '').toLowerCase().includes(keyword.toLowerCase()));

    const idxCode = colIndex('model kodu');
    const idxTitle = colIndex('məhsul adı') !== -1 ? colIndex('məhsul adı') : colIndex('mehsul adi') !== -1 ? colIndex('mehsul adi') : colIndex('ad');
    const idxBrand = colIndex('brend');
    const idxCategory = colIndex('kateqoriya');
    const idxPrice = colIndex('qiymət') !== -1 ? colIndex('qiymət') : colIndex('satış qiyməti');
    const idxOldPrice = colIndex('köhnə qiymət');
    const idxSpecs = colIndex('xüsusiyyətlər') !== -1 ? colIndex('xüsusiyyətlər') : colIndex('xususiyyetler');
    const idxImage = colIndex('şəkil') !== -1 ? colIndex('şəkil') : colIndex('foto') !== -1 ? colIndex('foto') : colIndex('image');
    const idxDesc = colIndex('təsvir') !== -1 ? colIndex('təsvir') : colIndex('qısa');
    const idxHighlights = colIndex('üstünlüklər') !== -1 ? colIndex('üstünlüklər') : colIndex('ustunlukler');
    const idxGallery = colIndex('qalereya');
    const idxBadge = colIndex('nişan') !== -1 ? colIndex('nişan') : colIndex('nisan');
    const idxCountry = colIndex('ölkə') !== -1 ? colIndex('ölkə') : colIndex('olke');

    for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (!row || row.length === 0) continue;

      // Extract fields based on identified column positions or default indices
      let code = '';
      let title = '';
      let brandRaw = '';
      let categoryRaw = '';
      let priceRaw: string | number | undefined = undefined;
      let oldPriceRaw: string | number | undefined = undefined;
      let currencyRaw = '₼';
      let badgeRaw = '';
      let badgeColorRaw = 'red';
      let stockStatusRaw = 'in_stock';
      let statusRaw = 'published';
      let countryRaw = '';
      let descRaw = '';
      let highlightsRaw = '';
      let imageRaw = '';
      let galleryRaw = '';
      let specsRaw = '';

      if (isArdoSpecFormat) {
        // "Ardo xüsusiyyətlər_yoxlanılıb.xlsx" format:
        // [0: №, 1: Şəkil, 2: Məhsul adı, 3: Xüsusiyyətlər, 4: Satış qiyməti, 5: Qeyd]
        const rawTitle = String((idxTitle !== -1 ? row[idxTitle] : row[2]) || '').trim();
        if (!rawTitle) continue;

        title = rawTitle;
        // Generate a clean model code e.g. "Ardo 3000" -> "3000" or "6018 Sensor"
        const ardoMatch = rawTitle.match(/ardo\s+(.+)$/i);
        code = ardoMatch ? ardoMatch[1].trim() : rawTitle;

        brandRaw = 'ARDO';
        const inferred = inferCategoryFromName(title, categories);
        categoryRaw = inferred.categoryName;

        specsRaw = String((idxSpecs !== -1 ? row[idxSpecs] : row[3]) || '').trim();
        priceRaw = idxPrice !== -1 ? row[idxPrice] : row[4];
        imageRaw = String((idxImage !== -1 ? row[idxImage] : row[1]) || '').trim();

        const noteRaw = String(row[5] || '').toLowerCase();
        if (noteRaw.includes('yoxdu') || noteRaw.includes('yoxdur')) {
          stockStatusRaw = 'out_of_stock';
        }
      } else {
        // Standard template format
        code = String((idxCode !== -1 ? row[idxCode] : row[0]) || '').trim();
        title = String((idxTitle !== -1 ? row[idxTitle] : row[1]) || '').trim();
        brandRaw = String((idxBrand !== -1 ? row[idxBrand] : row[2]) || '').trim();
        categoryRaw = String((idxCategory !== -1 ? row[idxCategory] : row[3]) || '').trim();
        priceRaw = idxPrice !== -1 ? row[idxPrice] : row[4];
        oldPriceRaw = idxOldPrice !== -1 ? row[idxOldPrice] : row[5];
        currencyRaw = String(row[6] || '₼').trim();
        badgeRaw = String((idxBadge !== -1 ? row[idxBadge] : row[7]) || '').trim();
        badgeColorRaw = String(row[8] || 'red').trim();
        stockStatusRaw = String(row[9] || 'in_stock').trim();
        statusRaw = String(row[10] || 'published').trim();
        countryRaw = String((idxCountry !== -1 ? row[idxCountry] : row[11]) || '').trim();
        descRaw = String((idxDesc !== -1 ? row[idxDesc] : row[12]) || '').trim();
        highlightsRaw = String((idxHighlights !== -1 ? row[idxHighlights] : row[13]) || '').trim();
        imageRaw = String((idxImage !== -1 ? row[idxImage] : row[14]) || '').trim();
        galleryRaw = String((idxGallery !== -1 ? row[idxGallery] : row[15]) || '').trim();
        specsRaw = String((idxSpecs !== -1 ? row[idxSpecs] : row[16]) || '').trim();
      }

      if (!title && !code) {
        continue;
      }

      if (!code) {
        code = title;
      }
      if (!title) {
        title = code;
      }

      // Match brand
      const matchedBrand = brands.find(
        (b) =>
          b.name.toLowerCase() === brandRaw.toLowerCase() ||
          b.id.toLowerCase() === brandRaw.toLowerCase()
      );
      const brandId = matchedBrand?.id || (brandRaw ? brandRaw.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'ardo');

      // Match or infer category
      let matchedCat = categories.find(
        (c) =>
          c.name.toLowerCase() === categoryRaw.toLowerCase() ||
          c.id.toLowerCase() === categoryRaw.toLowerCase()
      );
      if (!matchedCat) {
        const inferred = inferCategoryFromName(title, categories);
        matchedCat = categories.find((c) => c.id === inferred.categoryId) || categories[0];
      }

      const categoryId = matchedCat?.id || 'hood';
      const categoryName = matchedCat?.name || 'Aspiratorlar';

      // Parse highlights
      const highlights = highlightsRaw
        ? highlightsRaw.split(/[;,\n]/).map((h) => h.trim()).filter(Boolean)
        : [];

      // Parse gallery
      const gallery = galleryRaw
        ? galleryRaw.split(/[;,\n]/).map((g) => g.trim()).filter(Boolean)
        : [];

      // Parse specs (Supports multiline newline, semicolon, or colon formats)
      let specs: ProductSpecItem[] = [];
      if (specsRaw) {
        if (specsRaw.includes('\n')) {
          specs = parseMultilineSpecs(specsRaw, `spec-xls-${rowIndex}`);
        } else if (specsRaw.includes(';')) {
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
        } else if (specsRaw.includes(':') || specsRaw.includes('-')) {
          specs = parseMultilineSpecs(specsRaw, `spec-xls-${rowIndex}`);
        }
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
        manufacturingCountry: countryRaw || 'İtaliya',
        shortDesc: descRaw,
        highlights,
        specs,
        image: imageRaw || '/media/brands/ardo-logo.png',
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
