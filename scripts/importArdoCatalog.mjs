import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';

const root = resolve(import.meta.dirname, '..');
const featuresFile = resolve(root, 'File/Ardo xüsusiyyətlər.xlsx');
const inventoryFile = resolve(root, 'File/Mal və kontragent.xlsx');
const output = execFileSync('python3', [resolve(import.meta.dirname, 'extract_ardo_catalog.py'), featuresFile, inventoryFile], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const catalog = JSON.parse(output);
const publicDatabase = createCatalogDatabase(resolve(root, 'data/catalog.sqlite'));
const draftDatabase = createCatalogDatabase(resolve(root, 'data/catalog-draft.sqlite'));
try {
  publicDatabase.saveCatalog({ ...catalog, settings: publicDatabase.getCatalog().settings });
  draftDatabase.saveCatalog({ ...catalog, settings: draftDatabase.getCatalog().settings });
  process.stdout.write(`ARDO idxalı tamamlandı: ${catalog.products.length} məhsul, ${catalog.categories.length} kateqoriya, ${catalog.brands.length} brend.\n`);
} finally {
  publicDatabase.close();
  draftDatabase.close();
}
