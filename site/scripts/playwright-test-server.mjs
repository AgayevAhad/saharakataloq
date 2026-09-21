import { spawn } from 'node:child_process';
import {
  mkdtempSync,
  rmSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  constants as fsConstants,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createConsistentDatabaseSnapshot } from '../backend/catalogDatabase.mjs';
import { DatabaseSync } from 'node:sqlite';
import { applyPimV2Schema } from '../backend/pimV2Migration.mjs';
import { applyPhase3Schema } from '../backend/phase3Migration.mjs';
import { applyPhase4NavigationSchema } from '../backend/phase4NavigationMigration.mjs';
import {
  applyPhase5BrandRailSchema,
  seedCanonical54Brands,
} from '../backend/phase5BrandRailMigration.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SITE_ROOT = resolve(__dirname, '..');
const SOURCE_DB = join(SITE_ROOT, 'data', 'catalog.sqlite');
const SOURCE_DRAFT_DB = join(SITE_ROOT, 'data', 'catalog-draft.sqlite');
const SOURCE_MEDIA_DIR = join(SITE_ROOT, 'data', 'media');

const tempDir = mkdtempSync(join(tmpdir(), 'sahara-playwright-'));
const tempDbPath = join(tempDir, 'catalog.sqlite');
const tempDraftDbPath = join(tempDir, 'catalog-draft.sqlite');

if (existsSync(SOURCE_DB)) {
  createConsistentDatabaseSnapshot(SOURCE_DB, tempDbPath);
}

if (existsSync(SOURCE_DRAFT_DB)) {
  createConsistentDatabaseSnapshot(SOURCE_DRAFT_DB, tempDraftDbPath);
}

// Keep browser media tests realistic without allowing test writes to touch
// admin uploads. Clone only referenced files, never the entire private media
// directory. Reflinks make this near-instant on supported filesystems.
if (existsSync(tempDbPath) && existsSync(SOURCE_MEDIA_DIR)) {
  const db = new DatabaseSync(tempDbPath);
  try {
    const referencedUrls = [
      ...db
        .prepare("SELECT primary_image AS url FROM products WHERE primary_image LIKE '/uploads/%'")
        .all(),
      ...db.prepare("SELECT url FROM product_media WHERE url LIKE '/uploads/%'").all(),
    ];
    const mediaNames = new Set(
      referencedUrls
        .map((row) => String(row.url || '').slice('/uploads/'.length))
        .filter((name) => /^[a-z0-9_-]+\.(jpg|png|webp|mp4|webm)$/i.test(name))
    );
    const targetMediaDir = join(tempDir, 'media');
    mkdirSync(targetMediaDir, { recursive: true });
    for (const name of mediaNames) {
      const sourcePath = join(SOURCE_MEDIA_DIR, name);
      if (!existsSync(sourcePath)) continue;
      const targetPath = join(targetMediaDir, name);
      try {
        copyFileSync(sourcePath, targetPath, fsConstants.COPYFILE_FICLONE);
      } catch {
        copyFileSync(sourcePath, targetPath);
      }
    }
  } finally {
    db.close();
  }
}

// Apply Phase 2, Phase 3, Phase 4 and Phase 5 schema migrations on temporary /tmp database clones
for (const dbPath of [tempDbPath, tempDraftDbPath]) {
  if (existsSync(dbPath)) {
    const db = new DatabaseSync(dbPath);
    try {
      // Browser tests must not mask broken production data by silently deleting
      // orphaned rows from the test clone. Repair the source by exact model code.
      const orphanCount = db
        .prepare(
          'SELECT COUNT(*) AS n FROM product_specs s WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = s.product_id)'
        )
        .get().n;
      if (orphanCount > 0) {
        throw new Error(
          `${dbPath}: ${orphanCount} orphan product specs. Run the exact-code repair audit before browser tests.`
        );
      }
      applyPimV2Schema(db);
      applyPhase3Schema(db);
      applyPhase4NavigationSchema(db);
      applyPhase5BrandRailSchema(db);
      seedCanonical54Brands(db);
    } finally {
      db.close();
    }
  }
}

const BACKEND_PORT = process.env.PLAYWRIGHT_BACKEND_PORT || '3088';
const FRONTEND_PORT = process.env.PLAYWRIGHT_FRONTEND_PORT || '5188';

const nodeBin = '/home/oni10/Desktop/Bazaucunprogram/.runtime/node/bin';
const runtimePath = `${nodeBin}:${process.env.PATH || ''}`;

const backendEnv = {
  ...process.env,
  PATH: runtimePath,
  DATA_DIR: tempDir,
  ALLOW_TEMP_DATA_DIR: '1',
  ADMIN_PASSWORD: process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'TestAdmin2026!',
  PIM_TOKEN_SECRET: process.env.PIM_TOKEN_SECRET || 'playwright_test_secret_for_e2e',
  PORT: BACKEND_PORT,
  HOST: '127.0.0.1',
  NODE_ENV: 'test',
};

const frontendEnv = {
  ...process.env,
  PATH: runtimePath,
  BACKEND_URL: `http://127.0.0.1:${BACKEND_PORT}`,
  PORT: FRONTEND_PORT,
  NODE_ENV: 'test',
  ALLOW_TEMP_DATA_DIR: '1',
};

const backendProc = spawn('node', ['server.mjs'], {
  cwd: SITE_ROOT,
  env: backendEnv,
  stdio: 'inherit',
});

const frontendProc = spawn(
  'npx',
  ['vite', '--port', FRONTEND_PORT, '--strictPort', '--host', '127.0.0.1'],
  {
    cwd: SITE_ROOT,
    env: frontendEnv,
    stdio: 'inherit',
  }
);

const cleanup = () => {
  try {
    backendProc.kill('SIGTERM');
  } catch {}
  try {
    frontendProc.kill('SIGTERM');
  } catch {}
  try {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  } catch {}
};

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

process.on('exit', () => {
  cleanup();
});
