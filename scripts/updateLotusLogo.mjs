import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';
import { existsSync, readFileSync, writeFileSync } from 'fs';

function updateBrandsLogo(dbPath) {
  if (!existsSync(dbPath)) return;
  const db = createCatalogDatabase(dbPath);
  const catalog = db.getCatalog();
  const updatedBrands = (catalog.brands || []).map((b) => {
    if (b.id === 'lotus') {
      return {
        ...b,
        logo: '/media/brands/lotus-logo.png',
      };
    }
    return b;
  });
  db.saveCatalog({ ...catalog, brands: updatedBrands });
  db.close();
  console.log(`Updated Lotus brand logo in ${dbPath}`);
}

updateBrandsLogo('data/catalog-draft.sqlite');
updateBrandsLogo('data/catalog.sqlite');

// Update src/data/catalog.ts
try {
  const tsPath = 'src/data/catalog.ts';
  if (existsSync(tsPath)) {
    let content = readFileSync(tsPath, 'utf8');
    content = content.replace(/"id":\s*"lotus",[\s\S]*?"logo":\s*"\/media\/brands\/lotus-mark\.svg"/, (match) => {
      return match.replace('/media/brands/lotus-mark.svg', '/media/brands/lotus-logo.png');
    });
    writeFileSync(tsPath, content, 'utf8');
    console.log('Updated Lotus logo in src/data/catalog.ts');
  }
} catch (e) {
  console.error('Error updating src/data/catalog.ts:', e);
}
