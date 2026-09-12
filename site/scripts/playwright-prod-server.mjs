import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createConsistentDatabaseSnapshot } from '../backend/catalogDatabase.mjs';
import { DatabaseSync } from 'node:sqlite';
import { applyPimV2Schema } from '../backend/pimV2Migration.mjs';
import { applyPhase3Schema } from '../backend/phase3Migration.mjs';
import { cpSync } from 'node:fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SITE_ROOT = resolve(__dirname, '..');
const SOURCE_DB = join(SITE_ROOT, 'data', 'catalog.sqlite');
const SOURCE_DRAFT_DB = join(SITE_ROOT, 'data', 'catalog-draft.sqlite');
const SOURCE_MEDIA = join(SITE_ROOT, 'data', 'media');

const tempDir = mkdtempSync(join(tmpdir(), 'sahara-prod-runtime-'));
const tempDbPath = join(tempDir, 'catalog.sqlite');
const tempDraftDbPath = join(tempDir, 'catalog-draft.sqlite');

if (existsSync(SOURCE_DB)) {
  createConsistentDatabaseSnapshot(SOURCE_DB, tempDbPath);
}

if (existsSync(SOURCE_DRAFT_DB)) {
  createConsistentDatabaseSnapshot(SOURCE_DRAFT_DB, tempDraftDbPath);
}

// Apply Phase 2 and Phase 3 schema migrations on temporary /tmp database clones
for (const dbPath of [tempDbPath, tempDraftDbPath]) {
  if (existsSync(dbPath)) {
    const db = new DatabaseSync(dbPath);
    try {
      applyPimV2Schema(db);
      applyPhase3Schema(db);
    } finally {
      db.close();
    }
  }
}

if (existsSync(SOURCE_MEDIA)) {
  try {
    cpSync(SOURCE_MEDIA, join(tempDir, 'media'), { recursive: true });
  } catch {}
}

const PROD_PORT = process.env.PLAYWRIGHT_PROD_PORT || '3089';

const serverEnv = {
  ...process.env,
  DATA_DIR: tempDir,
  ALLOW_TEMP_DATA_DIR: '1',
  SAHARA_PRODUCTION_RUNTIME_TEST: '1',
  ADMIN_PASSWORD: process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'TestAdmin2026!',
  PORT: PROD_PORT,
  HOST: '127.0.0.1',
  NODE_ENV: 'production',
};

const serverProc = spawn('node', ['server.mjs'], {
  cwd: SITE_ROOT,
  env: serverEnv,
  stdio: 'inherit',
});

const cleanup = () => {
  try {
    serverProc.kill('SIGTERM');
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
