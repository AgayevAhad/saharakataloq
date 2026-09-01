import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';
import { readdirSync, statSync, copyFileSync, existsSync, mkdirSync } from 'fs';
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

const lotusDirs = [
  { path: 'Foto/Lotus kondisoner', category: 'air_conditioner', catName: 'Kondisionerlər' },
  { path: 'Foto/lotus airfryer', category: 'airfryer', catName: 'Fritözlər & Airfryer' },
  { path: 'Foto/lotus havaçəkən', category: 'hood', catName: 'Aspiratorlar' },
  { path: 'Foto/lotus piltə', category: 'cooktop', catName: 'Bişirmə panelləri' },
  { path: 'Foto/lotus sobalar', category: 'oven', catName: 'Sobalar' },
  { path: 'Foto/lotus televizor', category: 'tv', catName: 'Televizorlar' },
  { path: 'Foto/lotus termopot', category: 'thermopot', catName: 'Termopotlar' },
  { path: 'Foto/lotus tozsoran', category: 'vacuum_cleaner', catName: 'Tozsoranlar' },
  { path: 'Foto/lotus ətçəkən', category: 'meat_grinder', catName: 'Ətçəkənlər' },
  { path: 'Foto/ütü lotus', category: 'iron', catName: 'Ütülər' }
];

console.log('--- Scanning Lotus media files ---');
const allPhotos = [];
for (const entry of lotusDirs) {
  const files = walk(entry.path);
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      allPhotos.push({
        fullPath: file,
        folderCategory: entry.category,
        folderCatName: entry.catName,
        fileName: basename(file)
      });
    }
  }
}

console.log('Total valid image files found:', allPhotos.length);
allPhotos.slice(0, 20).forEach(p => console.log('  ', p.folderCategory, '->', p.fileName));
