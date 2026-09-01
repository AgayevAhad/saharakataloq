import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, basename, extname } from 'path';

function walk(dir) {
  let results = [];
  try {
    const list = readdirSync(dir);
    list.forEach((file) => {
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

const allFotoFiles = walk('Foto').filter((f) => /\.(jpe?g|png|webp|mp4|webm)$/i.test(f));
console.log(`Found ${allFotoFiles.length} original files in Foto/`);

// Create a lookup map by normalized name
const fotoMap = new Map();
allFotoFiles.forEach((f) => {
  const bname = basename(f);
  const norm = bname.toLowerCase().replace(/[^a-z0-9]/g, '');
  fotoMap.set(norm, bname);
  fotoMap.set(bname.toLowerCase(), bname);
});

function findOriginalName(code, imgUrl) {
  if (!imgUrl) return '';
  const urlFile = basename(imgUrl.split('?')[0]);
  const urlNorm = urlFile.toLowerCase().replace(/[^a-z0-9]/g, '');
  const codeNorm = (code || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Direct match by URL file
  if (fotoMap.has(urlFile.toLowerCase())) {
    return fotoMap.get(urlFile.toLowerCase());
  }
  if (fotoMap.has(urlNorm)) {
    return fotoMap.get(urlNorm);
  }

  // 2. Match by code in Foto
  for (const f of allFotoFiles) {
    const bname = basename(f);
    const bnameNorm = bname.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (codeNorm && (bnameNorm === codeNorm || bnameNorm.startsWith(codeNorm) || bnameNorm.includes(codeNorm))) {
      return bname;
    }
  }

  // 3. Clean fallback from url
  return urlFile;
}

function processCatalog(catalog) {
  let updatedCount = 0;
  const updatedProducts = catalog.products.map((prod) => {
    let pUpdated = false;
    const prodMedia = (prod.media || []).map((m, idx) => {
      let orig = m.originalName;
      if (!orig || orig === m.url) {
        // Try finding matching Foto file
        orig = findOriginalName(prod.code, m.url);
        pUpdated = true;
      }
      return {
        ...m,
        originalName: orig,
      };
    });

    if (pUpdated) updatedCount++;
    return {
      ...prod,
      media: prodMedia,
    };
  });

  console.log(`Updated originalName for ${updatedCount} products`);
  return {
    ...catalog,
    products: updatedProducts,
  };
}

// 1. Update draft DB
if (existsSync('data/catalog-draft.sqlite')) {
  const draftDb = createCatalogDatabase('data/catalog-draft.sqlite');
  const draftCatalog = draftDb.getCatalog();
  const updatedDraft = processCatalog(draftCatalog);
  draftDb.saveCatalog(updatedDraft);
  draftDb.close();
  console.log('Saved to data/catalog-draft.sqlite');
}

// 2. Update live DB
if (existsSync('data/catalog.sqlite')) {
  const liveDb = createCatalogDatabase('data/catalog.sqlite');
  const liveCatalog = liveDb.getCatalog();
  const updatedLive = processCatalog(liveCatalog);
  liveDb.saveCatalog(updatedLive);
  liveDb.close();
  console.log('Saved to data/catalog.sqlite');
}
