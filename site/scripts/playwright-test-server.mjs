import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
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

const tempDir = mkdtempSync(join(tmpdir(), 'sahara-playwright-'));
const tempDbPath = join(tempDir, 'catalog.sqlite');
const tempDraftDbPath = join(tempDir, 'catalog-draft.sqlite');

if (existsSync(SOURCE_DB)) {
  createConsistentDatabaseSnapshot(SOURCE_DB, tempDbPath);
}

if (existsSync(SOURCE_DRAFT_DB)) {
  createConsistentDatabaseSnapshot(SOURCE_DRAFT_DB, tempDraftDbPath);
}

// Apply Phase 2, Phase 3, Phase 4 and Phase 5 schema migrations on temporary /tmp database clones
for (const dbPath of [tempDbPath, tempDraftDbPath]) {
  if (existsSync(dbPath)) {
    const db = new DatabaseSync(dbPath);
    try {
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
