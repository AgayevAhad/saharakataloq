import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC_MEDIA_DIR = join(ROOT, 'public', 'media', 'products');
const DIST_MEDIA_DIR = join(ROOT, 'dist', 'media', 'products');
const DATA_MEDIA_DIR = join(ROOT, 'data', 'media');

mkdirSync(PUBLIC_MEDIA_DIR, { recursive: true });
mkdirSync(DIST_MEDIA_DIR, { recursive: true });
mkdirSync(DATA_MEDIA_DIR, { recursive: true });

const folders = [
  join(ROOT, 'Foto', 'ardo havaçəkən'),
  join(ROOT, 'Foto', 'ardo kondisoner'),
  join(ROOT, 'Foto', 'ardo piltə'),
];

// Product mapping definitions
const PRODUCT_MAPPINGS = [
  // Air Conditioners (Kondisionerlər)
  { pattern: /^9000BTU/i, targetCode: 'AR09WS', targetId: 'ardo-ar09ws' },
  { pattern: /^12000BTU/i, targetCode: 'AR12WS', targetId: 'ardo-ar12ws' },
  { pattern: /^18000BTU/i, targetCode: 'AR18WS', targetId: 'ardo-ar18ws' },
  { pattern: /^ARDO KONDISONER/i, targetCode: 'AR24WS', targetId: 'ardo-ar24ws' },

  // Hoods (Havaçəkən / Aspiratorlar)
  { pattern: /^604 B/i, targetCode: '604B', targetId: 'ardo-604b' },
  { pattern: /^AR 6001 B/i, targetCode: 'AR 6001 B', targetId: 'ardo-ar-6001-b' },
  { pattern: /^AR 6100 BLACK/i, targetCode: 'AR 6100 Black', targetId: 'ardo-ar-6100-black' },
  { pattern: /^AR 6120 BLACK/i, targetCode: 'AR6120 Black', targetId: 'ardo-ar6120-black' },
  { pattern: /^D 680 B/i, targetCode: 'D680B', targetId: 'ardo-d680b' },
  { pattern: /^D 980 B/i, targetCode: 'D980B', targetId: 'ardo-d980b' },
  { pattern: /^I 920 B/i, targetCode: 'I 920 B', targetId: 'ardo-i-920-b' },
  { pattern: /^I 920 X/i, targetCode: 'I 920 X', targetId: 'ardo-i-920-x' },
  { pattern: /^AR 20 SS/i, targetCode: 'AR20SS', targetId: 'ardo-ar20ss' },
  { pattern: /^AR 25 LB/i, targetCode: 'AR25LB', targetId: 'ardo-ar25lb' },

  // Cooktops (Piltələr)
  { pattern: /^201 GC/i, targetCode: '201GC', targetId: 'ardo-201gc' },
  { pattern: /^202 GC/i, targetCode: '202 GC', targetId: 'ardo-202-gc' },
  { pattern: /^3166/i, targetCode: '3166', targetId: 'ardo-3166' },
  { pattern: /^501 C/i, targetCode: '501C FFD', targetId: 'ardo-501c-ffd' },
  { pattern: /^6032 B/i, targetCode: '6032 B', targetId: 'ardo-6032-b' },
  { pattern: /^6046 BC/i, targetCode: '6046 BC', targetId: 'ardo-6046-bc' },
  { pattern: /^6331 GB/i, targetCode: '6331 GB', targetId: 'ardo-6331-gb' },
  { pattern: /^6342 W/i, targetCode: '6342W', targetId: 'ardo-6342w' },
  { pattern: /^6530/i, targetCode: '6530', targetId: 'ardo-6530' },
  { pattern: /^AR 6315 BE/i, targetCode: 'AR 6315 BE', targetId: 'ardo-ar-6315-be' },
  { pattern: /^AR 6415 BG/i, targetCode: 'AR 6415 BG', targetId: 'ardo-ar-6415-bg' },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Collect files for each target product
const productImagesMap = new Map();

for (const folder of folders) {
  if (!existsSync(folder)) continue;
  const files = readdirSync(folder).sort();
  for (const f of files) {
    if (!f.match(/\.(jpg|jpeg|png|webp)$/i)) continue;
    const nameWithoutExt = f.replace(/\.[^/.]+$/, '').trim();
    
    // Find matching target
    const mapping = PRODUCT_MAPPINGS.find((m) => m.pattern.test(nameWithoutExt));
    if (mapping) {
      if (!productImagesMap.has(mapping.targetId)) {
        productImagesMap.set(mapping.targetId, []);
      }
      productImagesMap.get(mapping.targetId).push({
        sourceFile: join(folder, f),
        originalName: f,
        targetCode: mapping.targetCode,
        targetId: mapping.targetId,
      });
    }
  }
}

console.log(`Found image sets for ${productImagesMap.size} products.`);

// Process and copy files
const processedUrlsByProduct = new Map();

for (const [targetId, items] of productImagesMap.entries()) {
  const urls = [];
  items.forEach((item, index) => {
    const ext = extname(item.originalName).toLowerCase() || '.jpg';
    const cleanFileName = `${slugify(item.targetId)}${index > 0 ? `-${index + 1}` : ''}${ext}`;
    const destPublic = join(PUBLIC_MEDIA_DIR, cleanFileName);
    const destDist = join(DIST_MEDIA_DIR, cleanFileName);
    const destData = join(DATA_MEDIA_DIR, cleanFileName);

    copyFileSync(item.sourceFile, destPublic);
    copyFileSync(item.sourceFile, destDist);
    copyFileSync(item.sourceFile, destData);

    const publicUrl = `/media/products/${cleanFileName}`;
    urls.push(publicUrl);
    console.log(`✓ Copied: ${item.originalName} -> ${publicUrl}`);
  });
  processedUrlsByProduct.set(targetId, urls);
}

// Update both databases (catalog.sqlite and catalog-draft.sqlite)
for (const dbPath of ['./data/catalog.sqlite', './data/catalog-draft.sqlite']) {
  const db = createCatalogDatabase(dbPath);
  const catalog = db.getCatalog();
  let updatedCount = 0;

  catalog.products = catalog.products.map((p) => {
    const urls = processedUrlsByProduct.get(p.id) || processedUrlsByProduct.get(slugify(p.code));
    if (urls && urls.length > 0) {
      updatedCount++;
      const mainImage = urls[0];
      const gallery = [...urls];
      const existingMediaByUrl = new Map((p.media || []).map((m) => [m.url, m]));
      const media = urls.map((url, idx) => {
        const existing = existingMediaByUrl.get(url);
        return {
          id: existing?.id || `${p.id}-media-${idx + 1}`,
          type: 'image',
          url,
          alt: existing?.alt || `${p.title} - Şəkil ${idx + 1}`,
          fitMode: existing?.fitMode || p.imageFit || 'contain',
          objectPosition: existing?.objectPosition || p.imagePosition || 'center',
        };
      });

      return {
        ...p,
        image: mainImage,
        gallery,
        media,
      };
    }
    return p;
  });

  db.saveCatalog(catalog);
  console.log(`Updated ${updatedCount} products in database: ${dbPath}`);
}

console.log('\nAll product images successfully analyzed, copied, and cataloged!');
