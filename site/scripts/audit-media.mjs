import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT_DIR = path.resolve(process.cwd());
const SITE_DIR = path.join(ROOT_DIR, 'site');

function getFileHash(filepath) {
  const content = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function scanDir(dir, baseDir = dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(scanDir(fullPath, baseDir));
    } else if (item.isFile()) {
      const stat = fs.statSync(fullPath);
      files.push({
        fullPath,
        relPath: path.relative(baseDir, fullPath),
        size: stat.size,
        hash: getFileHash(fullPath),
      });
    }
  }
  return files;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

console.log('=== SAHARA SITE MEDIA & STORAGE AUDIT ===\n');

// 1. Root media scan
const rootPublicMedia = scanDir(path.join(ROOT_DIR, 'public', 'media'));
const rootMediaMap = new Map();
rootPublicMedia.forEach((f) => rootMediaMap.set(f.hash, f));

// 2. Site public media scan
const sitePublicMedia = scanDir(path.join(SITE_DIR, 'public', 'media'));
// 3. Site data media scan
const siteDataMedia = scanDir(path.join(SITE_DIR, 'data', 'media'));
// 4. Site data uploads scan
const siteUploads = scanDir(path.join(SITE_DIR, 'data', 'uploads'));
// 5. Site dist scan
const siteDist = scanDir(path.join(SITE_DIR, 'dist'));

console.log(`1. Qovluqların Həcmi və Fayl Sayı:`);
console.log(
  `- site/public/media: ${sitePublicMedia.length} fayl (${formatBytes(sitePublicMedia.reduce((a, b) => a + b.size, 0))})`
);
console.log(
  `- site/data/media: ${siteDataMedia.length} fayl (${formatBytes(siteDataMedia.reduce((a, b) => a + b.size, 0))})`
);
console.log(
  `- site/data/uploads: ${siteUploads.length} fayl (${formatBytes(siteUploads.reduce((a, b) => a + b.size, 0))})`
);
console.log(
  `- site/dist (build output): ${siteDist.length} fayl (${formatBytes(siteDist.reduce((a, b) => a + b.size, 0))})`
);

// Analyze Root Copies
let copiedFromRootCount = 0;
let copiedFromRootBytes = 0;
for (const file of sitePublicMedia) {
  if (rootMediaMap.has(file.hash)) {
    copiedFromRootCount++;
    copiedFromRootBytes += file.size;
  }
}
console.log(`\n2. Root-dan Kopyalanmış Media:`);
console.log(
  `- ${copiedFromRootCount} fayl root 'public/media' ilə 1:1 SHA-256 eynidir (${formatBytes(copiedFromRootBytes)})`
);

// Analyze Duplicates between site/public/media and site/data/media
const publicMap = new Map();
sitePublicMedia.forEach((f) => publicMap.set(f.hash, f));

let duplicateWithDataMediaCount = 0;
let duplicateWithDataMediaBytes = 0;
for (const file of siteDataMedia) {
  if (publicMap.has(file.hash)) {
    duplicateWithDataMediaCount++;
    duplicateWithDataMediaBytes += file.size;
  }
}
console.log(`\n3. site/public/media və site/data/media Arasında Təkrarlanan (Duplicate) Fayllar:`);
console.log(
  `- ${duplicateWithDataMediaCount} fayl həm public/media, həm də data/media daxilində tam eyni SHA-256 ilə mövcuddur (${formatBytes(duplicateWithDataMediaBytes)})`
);

// Categories Breakdown:
const videoFiles = sitePublicMedia.filter(
  (f) => f.relPath.endsWith('.mp4') || f.relPath.endsWith('.webm')
);
const videoPosters = sitePublicMedia.filter(
  (f) => f.relPath.includes('-poster.jpg') || f.relPath.includes('-poster.png')
);
const productImages = sitePublicMedia.filter(
  (f) =>
    !f.relPath.endsWith('.mp4') && !f.relPath.endsWith('.webm') && !f.relPath.includes('-poster.')
);

console.log(`\n4. Asset Kateqoriyaları Bölgüsü (site/public/media):`);
console.log(
  `- Videolar: ${videoFiles.length} fayl (${formatBytes(videoFiles.reduce((a, b) => a + b.size, 0))})`
);
console.log(
  `- Video Posterləri (Generated/Static): ${videoPosters.length} fayl (${formatBytes(videoPosters.reduce((a, b) => a + b.size, 0))})`
);
console.log(
  `- Məhsul Şəkilləri və Loqolar: ${productImages.length} fayl (${formatBytes(productImages.reduce((a, b) => a + b.size, 0))})`
);

// Git Tracked vs Gitignored
console.log(`\n5. Git İdarəetmə Planı:`);
console.log(
  `- Git-ə Daxil Olmalı: site/src/**, site/scripts/**, site/tests/**, site/package.json, site/package-lock.json, site/vite.config.ts, site/tsconfig.json, site/server.mjs, site/public/media/ (web assets)`
);
console.log(
  `- Gitignored Olmalı: dist/ (build output, ~562MB), node_modules/, data/catalog.sqlite-wal, data/catalog.sqlite-shm, data/backups/, data/uploads/, data/media/ (redundant runtime clone)`
);
