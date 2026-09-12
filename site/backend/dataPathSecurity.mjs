import { existsSync, realpathSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SITE_DIR = resolve(__dirname, '..');
const REPO_ROOT = resolve(SITE_DIR, '..');

/**
 * Validates and resolves database and DATA_DIR paths against strict containment allowlists.
 *
 * Rules:
 * 1. :memory: is permitted.
 * 2. Any path resolving to root data/ (directly or via parent/symlink) is FATALLY rejected.
 * 3. In Test mode (NODE_ENV=test AND ALLOW_TEMP_DATA_DIR=1):
 *    - Target must reside strictly inside os.tmpdir().
 *    - The top-level folder inside tmpdir() MUST start with 'sahara-'.
 * 4. In Production/Standard mode:
 *    - Target must reside strictly inside site/data/.
 */
export function validateAndContainDataPath(targetPath) {
  if (targetPath === ':memory:') return ':memory:';

  const canonicalSiteData = resolve(SITE_DIR, 'data');
  const targetResolved = resolve(targetPath || canonicalSiteData);

  // Traverse upward to closest existing directory/file on disk to resolve realpath
  let current = targetResolved;
  while (!existsSync(current)) {
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  const realClosestParent = existsSync(current) ? realpathSync(current) : null;

  // Check against root data directory
  const rootData = resolve(REPO_ROOT, 'data');
  const realRootData = existsSync(rootData) ? realpathSync(rootData) : null;

  if (realClosestParent && realRootData) {
    if (realClosestParent === realRootData || realClosestParent.startsWith(realRootData + '/')) {
      throw new Error(`FATAL SECURITY VIOLATION: Path '${targetPath}' resolves to root data directory via symlink or directory tree!`);
    }
  }

  // Strict Test / Production Runtime Mode Override: Exact flag combinations MUST be satisfied
  const isStandardTest =
    process.env.NODE_ENV === 'test' && process.env.ALLOW_TEMP_DATA_DIR === '1';
  const isProdRuntimeTest =
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_TEMP_DATA_DIR === '1' &&
    process.env.SAHARA_PRODUCTION_RUNTIME_TEST === '1';

  const isTempAllowed = isStandardTest || isProdRuntimeTest;

  if (isTempAllowed) {
    const canonicalTmp = realpathSync(tmpdir());
    const realParent = realClosestParent || targetResolved;

    const isInsideTmp =
      targetResolved === canonicalTmp ||
      targetResolved.startsWith(canonicalTmp + '/') ||
      realParent === canonicalTmp ||
      realParent.startsWith(canonicalTmp + '/');

    if (isInsideTmp) {
      const relPath = relative(canonicalTmp, targetResolved);
      const relParentPath = realClosestParent ? relative(canonicalTmp, realClosestParent) : '';
      const topTargetSegment = relPath.split('/')[0];
      const topParentSegment = relParentPath ? relParentPath.split('/')[0] : topTargetSegment;

      if (topTargetSegment.startsWith('sahara-') && topParentSegment.startsWith('sahara-')) {
        return targetResolved;
      }
    }

    throw new Error(
      `FATAL SECURITY VIOLATION: Test DATA_DIR override must be located in tmpdir (${canonicalTmp}) and top-level directory must start with 'sahara-'. Received: ${targetPath}`
    );
  }

  // Production / Standard: Strict Containment within canonical site/data
  const realSiteData = existsSync(canonicalSiteData) ? realpathSync(canonicalSiteData) : canonicalSiteData;
  const isContained = targetResolved === canonicalSiteData || targetResolved.startsWith(canonicalSiteData + '/');
  const isRealContained = realClosestParent && (realClosestParent === realSiteData || realClosestParent.startsWith(realSiteData + '/'));

  if (!isContained || !isRealContained) {
    throw new Error(`FATAL SECURITY VIOLATION: DATA_DIR must be strictly contained within site/data! Received: ${targetPath}`);
  }

  return targetResolved;
}

export function validateAndResolveDataDir(rawDir) {
  return validateAndContainDataPath(rawDir);
}
