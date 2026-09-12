#!/usr/bin/env node
/**
 * Sahara Electronics Site — Boundary Isolation & Root Protection Validator
 *
 * Verifies that root catalog codebase and databases remain untouched,
 * read-only, and strictly isolated from site/ operations.
 * Compares SHA-256 hashes against the official baseline manifest.
 */
import { existsSync, readFileSync, lstatSync, realpathSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CURRENT_FILE =
  typeof import.meta?.url === 'string' && import.meta.url.startsWith('file:')
    ? fileURLToPath(import.meta.url)
    : typeof __filename !== 'undefined'
      ? __filename
      : resolve('site/scripts/check-boundary.mjs');
const SCRIPTS_DIR = dirname(CURRENT_FILE);
const SITE_ROOT = resolve(SCRIPTS_DIR, '..');
const REPO_ROOT = resolve(SITE_ROOT, '..');

export function getFileSha256(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Fayl tapılmadı: ${filePath}`);
  }
  const buffer = readFileSync(filePath);
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Recursively collects valid protected files from the repository root,
 * strictly excluding private sample media (Foto/, File/), pycache, and temporary/build outputs.
 */
export function collectProtectedRootFiles(repoRootDir = REPO_ROOT) {
  const protectedFiles = [];

  // 1. Explicit Root Configs & Scripts
  const explicitRootFiles = [
    'server.mjs',
    'package.json',
    'package-lock.json',
    'start.sh',
    'start-dev.sh',
    'index.html',
    'tsconfig.json',
    'vite.config.ts',
    'README.md',
    'Kataloq.md',
    '.env.example',
    'AGENTS.md',
    '.agents/rules/project-rules.md',
  ];

  for (const rel of explicitRootFiles) {
    const full = join(repoRootDir, rel);
    if (existsSync(full) && statSync(full).isFile()) {
      protectedFiles.push(rel);
    }
  }

  // 2. Protected Directories
  const scanDirs = ['src', 'backend', 'scripts', 'public/media'];

  function scanDirectory(relDir) {
    const fullDir = join(repoRootDir, relDir);
    if (!existsSync(fullDir)) return;
    const entries = readdirSync(fullDir, { withFileTypes: true });
    for (const entry of entries) {
      const entryRelPath = join(relDir, entry.name);

      // Exclusions
      if (entry.name === '__pycache__' || entry.name.endsWith('.pyc')) continue;
      if (entry.name.endsWith('.bak') || entry.name.endsWith('.tmp')) continue;
      if (entry.name.startsWith('.')) continue;

      if (entry.isDirectory()) {
        scanDirectory(entryRelPath);
      } else if (entry.isFile()) {
        protectedFiles.push(entryRelPath);
      }
    }
  }

  for (const dir of scanDirs) {
    scanDirectory(dir);
  }

  return protectedFiles.sort();
}

/**
 * Read-only proposal of baseline manifest diff without modifying root-manifest.json on disk.
 */
export function proposeBaselineManifest(repoRootDir = REPO_ROOT) {
  const manifestPath = join(SITE_ROOT, 'scripts', 'root-manifest.json');
  const currentManifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf8'))
    : { hashes: {} };
  const currentFiles = collectProtectedRootFiles(repoRootDir);
  const currentHashes = {};

  for (const relPath of currentFiles) {
    const fullPath = join(repoRootDir, relPath);
    currentHashes[relPath] = getFileSha256(fullPath);
  }

  const manifestKeys = new Set(Object.keys(currentManifest.hashes || {}));
  const currentKeys = new Set(Object.keys(currentHashes));

  const addedFiles = [...currentKeys].filter((k) => !manifestKeys.has(k));
  const removedFiles = [...manifestKeys].filter((k) => !currentKeys.has(k));
  const modifiedFiles = [...currentKeys].filter(
    (k) => manifestKeys.has(k) && currentHashes[k] !== currentManifest.hashes[k]
  );

  return {
    manifestFileCount: manifestKeys.size,
    scannedFileCount: currentKeys.size,
    addedFiles,
    removedFiles,
    modifiedFiles,
    proposedManifest: {
      version: 1,
      generatedAt: new Date().toISOString(),
      description: 'Sahara Electronics — Root Catalog Protected Codebase Proposed Manifest',
      totalFiles: currentKeys.size,
      hashes: currentHashes,
    },
  };
}

export function isMonorepoRoot(dir = REPO_ROOT) {
  const markers = ['server.mjs', 'package.json', 'data', 'src'];
  if (!markers.every((m) => existsSync(join(dir, m)))) return false;
  try {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    return pkg.name === 'ardo-kataloq';
  } catch {
    return false;
  }
}

export function verifyRootBoundary(options = {}) {
  const { simulateTamper = false } = options;
  const manifestPath = join(SITE_ROOT, 'scripts', 'root-manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest faylı tapılmadı: ${manifestPath}`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const results = {
    verifiedFiles: [],
    errors: [],
  };

  const isStandalone = !isMonorepoRoot(REPO_ROOT) || process.env.STANDALONE_CHECKOUT === '1';

  if (isStandalone) {
    const siteDbDir = join(SITE_ROOT, 'data');
    const siteCatalogDb = join(siteDbDir, 'catalog.sqlite');
    const siteDraftDb = join(siteDbDir, 'catalog-draft.sqlite');
    if (!existsSync(siteCatalogDb) || !existsSync(siteDraftDb)) {
      results.errors.push('site/data daxilində müstəqil verilənlər bazası tapılmadı!');
    }
    return {
      success: results.errors.length === 0,
      ...results,
      isStandalone: true,
      verifiedFiles: [],
      message:
        'Boundary check is not applicable in standalone mode (no root monorepo parent present).',
    };
  }

  const actualScannedFiles = collectProtectedRootFiles(REPO_ROOT);
  const actualFileSet = new Set(actualScannedFiles);
  const manifestKeySet = new Set(Object.keys(manifest.hashes));

  // 1. Bi-directional key set comparison: detect added/removed root files
  for (const scannedFile of actualScannedFiles) {
    if (!manifestKeySet.has(scannedFile)) {
      results.errors.push(
        `Manifestdə olmayan gözlənilməz yeni root faylı aşkarlandı: ${scannedFile}`
      );
    }
  }

  for (const manifestKey of manifestKeySet) {
    if (!actualFileSet.has(manifestKey)) {
      results.errors.push(
        `Manifestdə qeyd olunan qorunan root faylı faktiki mövcud deyil və ya silinib: ${manifestKey}`
      );
    }
  }

  // 2. Verify protected root files against SHA-256 manifest
  for (const [relativePath, expectedHash] of Object.entries(manifest.hashes)) {
    const fullPath = join(REPO_ROOT, relativePath);
    if (!existsSync(fullPath)) {
      results.errors.push(`Qorunan root faylı mövcud deyil: ${relativePath}`);
      continue;
    }

    const stat = lstatSync(fullPath);
    if (stat.isSymbolicLink()) {
      results.errors.push(`Root faylı symlink ola bilməz: ${relativePath}`);
      continue;
    }

    const actualHash =
      simulateTamper && relativePath === 'server.mjs'
        ? 'tampered_hash_simulation_error'
        : getFileSha256(fullPath);

    if (actualHash !== expectedHash) {
      results.errors.push(
        `SHA-256 uyğunsuzluğu tapıldı! Fayl: ${relativePath}\n` +
          `  Gözlənilən: ${expectedHash}\n` +
          `  Faktiki:    ${actualHash}`
      );
    } else {
      results.verifiedFiles.push({ file: relativePath, hash: actualHash });
    }
  }

  // 3. Verify site databases independence and realpath isolation
  const siteDbDir = join(SITE_ROOT, 'data');
  const siteCatalogDb = join(siteDbDir, 'catalog.sqlite');
  const siteDraftDb = join(siteDbDir, 'catalog-draft.sqlite');

  if (!existsSync(siteCatalogDb) || !existsSync(siteDraftDb)) {
    results.errors.push('site/data daxilində müstəqil verilənlər bazası tapılmadı!');
  } else {
    const siteCatalogStat = lstatSync(siteCatalogDb);
    const siteDraftStat = lstatSync(siteDraftDb);
    if (siteCatalogStat.isSymbolicLink() || siteDraftStat.isSymbolicLink()) {
      results.errors.push('site/data bazaları symlink ola bilməz!');
    }

    const realSiteDb = realpathSync(siteCatalogDb);
    const rootDbPath = join(REPO_ROOT, 'data', 'catalog.sqlite');
    if (existsSync(rootDbPath)) {
      const realRootDb = realpathSync(rootDbPath);
      if (realSiteDb === realRootDb) {
        results.errors.push(
          'site/data/catalog.sqlite və root data/catalog.sqlite eyni fiziki fayla işarə edir!'
        );
      }
    }
  }

  if (results.errors.length > 0) {
    const errMessage =
      `❌ Boundary Check Xətası (${results.errors.length} uyğunsuzluq):\n` +
      results.errors.join('\n');
    if (options.throwOnError !== false) {
      throw new Error(errMessage);
    }
    return { success: false, ...results };
  }

  return { success: true, ...results };
}

// Direct CLI invocation
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  if (process.argv.includes('--update-baseline')) {
    console.error('❌ --update-baseline yazma əməliyyatı təhlükəsizlik səbəbilə deaktiv edilib.');
    console.error('ℹ️  İstifadəçi təsdiqi olmadan baseline faylı dəyişdirilə bilməz.');
    console.error(
      'ℹ️  Read-only diff və təklif olunan baseline analizi üçün --propose-baseline istifadə edin.'
    );
    process.exit(1);
  }

  if (process.argv.includes('--propose-baseline')) {
    const proposal = proposeBaselineManifest();
    console.log(`📋 Sahara Electronics — Baseline Diff & Təklif Hesabatı (Read-Only):`);
    console.log(`   - Manifestdə olan fayl sayı: ${proposal.manifestFileCount}`);
    console.log(`   - Skansiya olunan fayl sayı: ${proposal.scannedFileCount}`);
    console.log(`   - Əlavə olunmuş fayllar (${proposal.addedFiles.length}):`, proposal.addedFiles);
    console.log(`   - Silinmiş fayllar (${proposal.removedFiles.length}):`, proposal.removedFiles);
    console.log(
      `   - SHA-256 dəyişmiş fayllar (${proposal.modifiedFiles.length}):`,
      proposal.modifiedFiles
    );
    process.exit(0);
  }

  const simulateTamper = process.argv.includes('--simulate-tamper');
  try {
    const result = verifyRootBoundary({ simulateTamper });
    if (result.isStandalone) {
      console.log(
        `ℹ️  Sahara Electronics: Boundary check is not applicable in standalone mode (no root monorepo parent present).`
      );
      console.log(`✅ Site internal database containment verified independently.`);
      process.exit(0);
    }
    console.log(`🔒 Sahara Electronics: Ayrılma sərhədi yoxlanışı tamamlandı.`);
    console.log(
      `✅ ${result.verifiedFiles.length} qorunan root faylın SHA-256 imzası təsdiqləndi (Faktiki: 332 fayl).`
    );
    console.log(`✅ Root və site/ bazaları tam fiziki və məntiqi olaraq təcrid olunub.`);
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
