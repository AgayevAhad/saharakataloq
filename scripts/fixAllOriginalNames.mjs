import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, basename } from 'path';

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
console.log(`Loaded ${allFotoFiles.length} files from Foto/`);

// Special manual mappings for codes that differ slightly from Foto folder names
const SPECIAL_CODE_MAPPINGS = {
  '201gc': ['201 GC.jpg', '201 GC (2).jpg'],
  '202gc': ['202 GC.jpg', '202 GC (2).jpg'],
  '501cffd': ['501 C.jpg', '501 C (2).jpg'],
  '501c': ['501 C.jpg', '501 C (2).jpg'],
  'ar09ws': ['9000BTU.jpg', '9000BTU (2).jpg'],
  'ar12ws': ['12000BTU.jpg', '12000BTU (2).jpg'],
  'ar18ws': ['18000BTU.jpg', '18000BTU (2).jpg', '18000BTU (3).jpg'],
  'ar24ws': ['ARDO KONDISONER.jpg', 'ARDO KONDISONER (2).jpg'],
  'ltr410inverter': ['LOTUS KONDISONER.jpg', 'LOTUS KONDISONER .jpg'],
  'ltr410ainverter': ['R410A.jpg', 'R410A (2).jpg', 'R410A (3).jpg'],
  '604b': ['604 B.jpg'],
  'ar6001b': ['AR 6001 B.jpg'],
  'ar6100black': ['AR 6100 BLACK.jpg'],
  'ar6120black': ['AR 6120 BLACK.jpg'],
  'ar20ss': ['AR 20 SS.jpg'],
  'ar25lb': ['AR 25 LB.jpg'],
  'd680b': ['D 680 B.jpg'],
  'd980b': ['D 980 B.jpg'],
  'i920b': ['I 920 B.jpg', 'I 920 B (2).jpg'],
  'i920x': ['I 920 X.jpg', 'I 920 X (2).jpg'],
  '6032b': ['6032 B.jpg', '6032 B (2).jpg', '6032 B (3).jpg'],
  '6046bc': ['6046 BC.jpg', '6046 BC (2).jpg'],
  '6331gb': ['6331 GB.jpg', '6331 GB (2).jpg'],
  '6342w': ['6342 W.jpg', '6342 W (2).jpg', '6342 W (3).jpg'],
  '6530': ['6530.jpg', '6530 (2).jpg'],
  'ar6315be': ['AR 6315 BE.jpg', 'AR 6315 BE (2).jpg'],
  'ar6415bg': ['AR 6415 BG.jpg'],
};

function getHumanReadableName(product, mediaIndex, currentUrl) {
  const codeNorm = (product.code || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Check special code mappings
  if (SPECIAL_CODE_MAPPINGS[codeNorm]) {
    const list = SPECIAL_CODE_MAPPINGS[codeNorm];
    if (list[mediaIndex]) return list[mediaIndex];
    if (list.length > 0) return `${list[0].replace(/\.[^.]+$/, '')} (${mediaIndex + 1}).jpg`;
  }

  // 2. Search in allFotoFiles for exact code match
  const matchingFotos = allFotoFiles.filter((f) => {
    const bname = basename(f).toLowerCase().replace(/[^a-z0-9]/g, '');
    return codeNorm && (bname.includes(codeNorm) || codeNorm.includes(bname));
  });

  if (matchingFotos.length > 0) {
    const chosen = matchingFotos[mediaIndex] || matchingFotos[0];
    const bname = basename(chosen);
    return mediaIndex > 0 && matchingFotos.length === 1 ? `${bname.replace(/\.[^.]+$/, '')} (${mediaIndex + 1}).jpg` : bname;
  }

  // 3. Clean extracted URL filename if it is not a raw hash
  if (currentUrl) {
    const clean = decodeURIComponent(currentUrl.split('?')[0]);
    const bname = basename(clean);
    if (!/^mti[a-z0-9]{5,}/i.test(bname) && !/^[0-9a-f]{16,}/i.test(bname) && !/^[0-9]{13,}/i.test(bname)) {
      return bname;
    }
  }

  // 4. Default clean fallback based on brand and code
  const brandName = product.brandId === 'lotus' ? 'Lotus' : 'Ardo';
  const codePart = product.code ? product.code.trim() : product.title;
  return mediaIndex === 0 ? `${brandName} ${codePart}.jpg` : `${brandName} ${codePart} (${mediaIndex + 1}).jpg`;
}

function fixDatabase(dbPath) {
  if (!existsSync(dbPath)) return;
  const db = createCatalogDatabase(dbPath);
  const catalog = db.getCatalog();
  let totalFixed = 0;

  const updatedProducts = catalog.products.map((p) => {
    const updatedMedia = (p.media || []).map((m, idx) => {
      const isHash = !m.originalName || /^mti[a-z0-9]{5,}/i.test(m.originalName) || /^[0-9a-f]{16,}/i.test(m.originalName) || m.originalName.includes('/uploads/');
      const originalName = isHash ? getHumanReadableName(p, idx, m.url) : m.originalName;
      if (originalName !== m.originalName) totalFixed++;
      return {
        ...m,
        originalName,
      };
    });

    return {
      ...p,
      media: updatedMedia,
    };
  });

  db.saveCatalog({ ...catalog, products: updatedProducts });
  db.close();
  console.log(`Updated ${totalFixed} media originalName entries in ${dbPath}`);
}

fixDatabase('data/catalog-draft.sqlite');
fixDatabase('data/catalog.sqlite');
