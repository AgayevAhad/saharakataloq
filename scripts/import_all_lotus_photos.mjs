import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';
import { readdirSync, statSync, copyFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, extname, basename } from 'path';

function walk(dir) {
  let results = [];
  try {
    const list = readdirSync(dir);
    list.forEach(file => {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(walk(fullPath));
      } else {
        results.push(fullPath);
      }
    });
  } catch (e) {}
  return results;
}

const PUBLIC_MEDIA_DIR = join(process.cwd(), 'public', 'media', 'products');
mkdirSync(PUBLIC_MEDIA_DIR, { recursive: true });

const CATEGORY_NAMES = {
  air_conditioner: 'Kondisionerlər',
  airfryer: 'Fritözlər & Airfryer',
  hood: 'Aspiratorlar',
  cooktop: 'Bişirmə panelləri',
  oven: 'Sobalar',
  tv: 'Televizorlar',
  thermopot: 'Termopotlar',
  vacuum_cleaner: 'Tozsoranlar',
  meat_grinder: 'Ətçəkənlər',
  iron: 'Ütülər',
  washer: 'Paltaryuyanlar',
  refrigerator: 'Soyuducular',
  microwave: 'Mikrodalğalı sobalar'
};

const CATEGORY_PREFIXES = {
  air_conditioner: 'Kondisioner',
  airfryer: 'Airfryer',
  hood: 'Aspirator',
  cooktop: 'Bişirmə paneli',
  oven: 'Soba',
  tv: 'TV',
  thermopot: 'Termopot',
  vacuum_cleaner: 'Tozsoran',
  meat_grinder: 'Ətçəkən',
  iron: 'Buxarlı Ütü',
  washer: 'Paltaryuyan',
  refrigerator: 'Soyuducu',
  microwave: 'Mikrodalğalı soba'
};

const FOLDER_CONFIGS = [
  { path: 'Foto/Lotus kondisoner', category: 'air_conditioner' },
  { path: 'Foto/lotus airfryer', category: 'airfryer' },
  { path: 'Foto/lotus havaçəkən', category: 'hood' },
  { path: 'Foto/lotus piltə', category: 'cooktop' },
  { path: 'Foto/lotus sobalar', category: 'oven' },
  { path: 'Foto/lotus televizor', category: 'tv' },
  { path: 'Foto/lotus termopot', category: 'thermopot' },
  { path: 'Foto/lotus tozsoran', category: 'vacuum_cleaner' },
  { path: 'Foto/lotus ətçəkən', category: 'meat_grinder' },
  { path: 'Foto/ütü lotus', category: 'iron' }
];

function sanitizeFilename(str) {
  return str
    .toLowerCase()
    .replace(/[əƏ]/g, 'e')
    .replace(/[ıIİ]/g, 'i')
    .replace(/[öÖ]/g, 'o')
    .replace(/[üÜ]/g, 'u')
    .replace(/[şŞ]/g, 's')
    .replace(/[çÇ]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Extract canonical model code from filename
function extractModelCode(fileName, category) {
  let name = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '').trim();
  
  // Specific known model aliases
  if (/^406A9658/i.test(name)) return 'LT 02003 Pro';
  if (/^406A8986|^406A8988/i.test(name)) return 'LT-8801';
  if (/^406A8995|^406A8999/i.test(name)) return 'LT-8802';
  if (/^406A9003/i.test(name)) return 'LT-8803';
  if (/^LOTUS\s+KONDISONER/i.test(name)) return 'LT R410 Inverter';
  if (/^R410A/i.test(name)) return 'LT-R410A Inverter';

  // Strip prefixes
  name = name
    .replace(/^(Airfryer\s+Lotus|Termopot\s+Lotus|Tozsoran\s+Lotus|Utu\s+Lotus\s+Buxarlı|Utu\s+Lotus|Kondisioner\s+Lotus)\s*/i, '')
    .replace(/\s*\(\d+\)\s*$/g, '')
    .replace(/\s*-\d+\s*$/g, '')
    .replace(/\s*-\s*1\s*$/g, '')
    .replace(/\s*-\s*2\s*$/g, '')
    .replace(/\s*-\s*3\s*$/g, '')
    .replace(/\s*-\s*4\s*$/g, '')
    .replace(/\s*-\s*5\s*$/g, '')
    .replace(/\s+(on|arxa|hisse|hissə|umumi|ümumi)\s*$/i, '')
    .replace(/\s+(black\s+\d+|grey\s+\d+|gray\s+\d+)\s*$/i, (match) => match.replace(/\s+\d+/, ''))
    .trim();

  return name;
}

const db = createCatalogDatabase('./data/catalog.sqlite');
const draftDb = createCatalogDatabase('./data/catalog-draft.sqlite');
const catalog = db.getCatalog();

console.log('Existing catalog total products:', catalog.products.length);

// Ensure all categories are in catalog.categories
for (const [catId, catName] of Object.entries(CATEGORY_NAMES)) {
  if (!catalog.categories.find(c => c.id === catId)) {
    catalog.categories.push({
      id: catId,
      name: catName,
      slug: sanitizeFilename(catName),
      icon: 'Box',
      active: true,
      sortOrder: catalog.categories.length
    });
  }
}

// Group photos by (category + extracted model code)
const modelPhotoGroups = new Map();

for (const folder of FOLDER_CONFIGS) {
  const files = walk(folder.path);
  for (const srcPath of files) {
    const ext = extname(srcPath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;

    const rawFileName = basename(srcPath);
    const modelCode = extractModelCode(rawFileName, folder.category);
    const key = `${folder.category}:::${modelCode.toLowerCase()}`;

    if (!modelPhotoGroups.has(key)) {
      modelPhotoGroups.set(key, {
        category: folder.category,
        modelCode: modelCode,
        rawFiles: []
      });
    }
    modelPhotoGroups.get(key).rawFiles.push(srcPath);
  }
}

console.log(`Found ${modelPhotoGroups.size} unique Lotus product photo models across 147 media files.`);

let copiedFilesCount = 0;
let updatedProductsCount = 0;
let newProductsCount = 0;
const validLotusUrls = new Set();

for (const [key, group] of modelPhotoGroups.entries()) {
  const { category, modelCode, rawFiles } = group;

  // Copy and normalize each file into public/media/products/
  const webImageUrls = [];
  rawFiles.forEach((srcPath, idx) => {
    const ext = extname(srcPath).toLowerCase();
    const cleanBase = sanitizeFilename(`lotus-${category}-${modelCode}`) || 'lotus-item';
    const destFileName = `${cleanBase}${idx > 0 ? `-${idx + 1}` : ''}${ext}`;
    const destPath = join(PUBLIC_MEDIA_DIR, destFileName);

    copyFileSync(srcPath, destPath);
    copiedFilesCount++;
    const url = `/media/products/${destFileName}`;
    webImageUrls.push(url);
    validLotusUrls.add(url);
  });

  // Find matching product in catalog - EXACT match first
  const codeClean = modelCode.toLowerCase().replace(/[\s\-_]/g, '');
  let product = catalog.products.find(p => {
    if (p.brandId !== 'lotus') return false;
    const pCodeClean = p.code.toLowerCase().replace(/[\s\-_]/g, '');
    return pCodeClean === codeClean;
  });
  if (!product) {
    product = catalog.products.find(p => {
      if (p.brandId !== 'lotus') return false;
      const pCodeClean = p.code.toLowerCase().replace(/[\s\-_]/g, '');
      return p.category === category && (pCodeClean.includes(codeClean) || codeClean.includes(pCodeClean));
    });
  }

  if (product) {
    // Update existing product with high quality media, PRESERVING user crop and custom positioning
    const existingMediaByUrl = new Map((product.media || []).map((m) => [m.url, m]));
    const preservedMediaItems = webImageUrls.map((url, i) => {
      const existing = existingMediaByUrl.get(url);
      return {
        id: existing?.id || `m-lotus-${sanitizeFilename(category)}-${sanitizeFilename(modelCode)}-${i + 1}`,
        type: 'image',
        url: url,
        alt: existing?.alt || `Lotus ${modelCode} - Şəkil ${i + 1}`,
        fitMode: existing?.fitMode || product.imageFit || 'contain',
        objectPosition: existing?.objectPosition || product.imagePosition || 'center',
      };
    });

    product.image = webImageUrls[0];
    product.gallery = webImageUrls;
    product.media = preservedMediaItems;
    product.status = 'published';
    updatedProductsCount++;
  } else {
    // Create new product for newly added category / model
    const prefix = CATEGORY_PREFIXES[category] || 'Məhsul';
    const catName = CATEGORY_NAMES[category] || 'Digər';
    const newId = `lotus-${sanitizeFilename(category)}-${sanitizeFilename(modelCode)}`;

    const newProd = {
      id: newId,
      brandId: 'lotus',
      code: modelCode,
      title: `${prefix} Lotus ${modelCode}`,
      category: category,
      categoryName: catName,
      shortDesc: `${catName} Lotus ${modelCode} rəsmi model`,
      image: webImageUrls[0],
      gallery: webImageUrls,
      media: mediaItems,
      highlights: [
        'Yüksək keyfiyyət və erqonomik dizayn',
        'Rəsmi istehsalçı zəmanəti'
      ],
      specs: [
        { id: `s-1`, name: 'Brend', value: 'LOTUS', group: 'Əsas' },
        { id: `s-2`, name: 'Model Kodu', value: modelCode, group: 'Əsas' },
        { id: `s-3`, name: 'Kateqoriya', value: catName, group: 'Əsas' },
        { id: `s-4`, name: 'Zəmanət', value: 'Rəsmi Zəmanət', group: 'Əsas' }
      ],
      status: 'published'
    };

    catalog.products.push(newProd);
    newProductsCount++;
  }
}

// Clean up any stale lotus files in public/media/products that are not in validLotusUrls or Ardo
const publicFiles = readdirSync(PUBLIC_MEDIA_DIR);
for (const file of publicFiles) {
  if (file.startsWith('lotus-') && (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.JPG'))) {
    const fileUrl = `/media/products/${file}`;
    if (!validLotusUrls.has(fileUrl)) {
      try {
        unlinkSync(join(PUBLIC_MEDIA_DIR, file));
      } catch (e) {}
    }
  }
}

console.log(`\nImport Summary:`);
console.log(`- Web images copied to public/media/products: ${copiedFilesCount}`);
console.log(`- Existing Lotus products updated with media: ${updatedProductsCount}`);
console.log(`- New Lotus products created: ${newProductsCount}`);
console.log(`- Total products now in catalog: ${catalog.products.length}`);

// Save to SQLite databases
db.saveCatalog(catalog);
draftDb.saveCatalog(catalog);

console.log('Successfully saved to catalog.sqlite and catalog-draft.sqlite!');
