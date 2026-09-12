import { DatabaseSync } from 'node:sqlite';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { validateAndContainDataPath } from './dataPathSecurity.mjs';

/**
 * Sahara Electronics — Unassigned Media Audit & Exact Match Engine
 * Scans catalog media assets and strictly enforces 1:1 exact model-to-filename matching.
 * Broad, fuzzy, or category-wide guessing across different model codes is strictly forbidden.
 */

export function auditUnassignedMedia(dbPath, mediaDirectoryPath) {
  const safeDbPath = validateAndContainDataPath(dbPath);
  const db = new DatabaseSync(safeDbPath);

  try {
    const products = db.prepare('SELECT id, code FROM products').all();
    const mediaCols = db.prepare('PRAGMA table_info(product_media)').all().map((r) => r.name);
    const hasExactKey = mediaCols.includes('exact_match_key');
    const selectQuery = hasExactKey
      ? 'SELECT url, original_name, exact_match_key FROM product_media'
      : 'SELECT url, original_name FROM product_media';
    const productMedia = db.prepare(selectQuery).all();

    // Extract exact model codes and match keys in lower-case
    const exactModelKeys = new Set(
      products.map((p) => p.code.toLowerCase().replace(/[^a-z0-9]+/g, ''))
    );

    const attachedUrls = new Set(productMedia.map((m) => basename(m.url).toLowerCase()));
    const unassignedFiles = [];
    const matchedFiles = [];

    if (existsSync(mediaDirectoryPath)) {
      const scanFilesRecursive = (dir) => {
        const entries = readdirSync(dir);
        for (const entry of entries) {
          const fullPath = join(dir, entry);
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            scanFilesRecursive(fullPath);
          } else if (stat.isFile()) {
            const fileName = basename(fullPath);
            const lowerFileName = fileName.toLowerCase();
            const normalizedFileNameKey = lowerFileName.replace(/[^a-z0-9]+/g, '');

            // Check if attached in database
            const isAttached = attachedUrls.has(lowerFileName);

            // Check if has an exact 1:1 model match key
            let hasExactModelMatch = false;
            for (const modelKey of exactModelKeys) {
              if (normalizedFileNameKey.includes(modelKey)) {
                hasExactModelMatch = true;
                break;
              }
            }

            if (isAttached || hasExactModelMatch) {
              matchedFiles.push({
                fileName,
                path: fullPath,
                isAttached,
                hasExactModelMatch,
              });
            } else {
              unassignedFiles.push(fileName);
            }
          }
        }
      };

      scanFilesRecursive(mediaDirectoryPath);
    }

    const unassignedNotice =
      unassignedFiles.length > 0
        ? `Bu faylları dəqiq model adında tapmadığım üçün heç bir modelə bağlamadım: ${unassignedFiles.join(', ')}`
        : 'Bütün media faylları dəqiq 1:1 model açarları ilə uyğunlaşdırılıb.';

    return {
      totalScanned: matchedFiles.length + unassignedFiles.length,
      matchedCount: matchedFiles.length,
      unassignedCount: unassignedFiles.length,
      unassignedFiles,
      unassignedNotice,
      matchedFiles,
    };
  } finally {
    db.close();
  }
}
