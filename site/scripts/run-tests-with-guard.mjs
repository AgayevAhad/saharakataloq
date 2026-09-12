#!/usr/bin/env node
/**
 * Sahara Electronics Site — Outer Boundary Test Runner & DB Integrity Guard
 *
 * 1. Takes pre-test snapshot of Root & Site DBs (main, WAL, SHM).
 * 2. Runs the full test suite (syntax check, vitest, node:test, boundary check).
 * 3. Takes post-test snapshot of Root & Site DBs.
 * 4. Fails if any main (.sqlite) or WAL (.sqlite-wal) size, hash, existence, or mtime changes.
 * 5. Accurately reports SHM lifecycle changes (read-only SQLite reader shared-memory).
 */
import { existsSync, statSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SITE_DIR = resolve(__dirname, '..');
const REPO_ROOT = resolve(SITE_DIR, '..');

function getSha256(filePath) {
  if (!existsSync(filePath)) return null;
  const buffer = readFileSync(filePath);
  return createHash('sha256').update(buffer).digest('hex');
}

function captureSnapshot(filePath) {
  if (!existsSync(filePath)) {
    return { exists: false, size: 0, mtimeMs: 0, hash: null };
  }
  const st = statSync(filePath);
  return {
    exists: true,
    size: st.size,
    mtimeMs: st.mtimeMs,
    hash: st.size > 0 ? getSha256(filePath) : 'empty',
  };
}

const targetFiles = [
  // Root DBs
  { label: 'Root Main DB', path: join(REPO_ROOT, 'data', 'catalog.sqlite'), critical: true },
  { label: 'Root WAL DB', path: join(REPO_ROOT, 'data', 'catalog.sqlite-wal'), critical: true },
  { label: 'Root SHM DB', path: join(REPO_ROOT, 'data', 'catalog.sqlite-shm'), critical: false },
  { label: 'Root Draft DB', path: join(REPO_ROOT, 'data', 'catalog-draft.sqlite'), critical: true },
  {
    label: 'Root Draft WAL',
    path: join(REPO_ROOT, 'data', 'catalog-draft.sqlite-wal'),
    critical: true,
  },
  {
    label: 'Root Draft SHM',
    path: join(REPO_ROOT, 'data', 'catalog-draft.sqlite-shm'),
    critical: false,
  },

  // Site DBs (must also not be mutated by unit/integration tests!)
  { label: 'Site Main DB', path: join(SITE_DIR, 'data', 'catalog.sqlite'), critical: true },
  { label: 'Site WAL DB', path: join(SITE_DIR, 'data', 'catalog.sqlite-wal'), critical: true },
  { label: 'Site SHM DB', path: join(SITE_DIR, 'data', 'catalog.sqlite-shm'), critical: false },
  { label: 'Site Draft DB', path: join(SITE_DIR, 'data', 'catalog-draft.sqlite'), critical: true },
  {
    label: 'Site Draft WAL',
    path: join(SITE_DIR, 'data', 'catalog-draft.sqlite-wal'),
    critical: true,
  },
  {
    label: 'Site Draft SHM',
    path: join(SITE_DIR, 'data', 'catalog-draft.sqlite-shm'),
    critical: false,
  },
];

function runCommand(command, args, cwd, env = process.env) {
  return new Promise((resolvePromise, reject) => {
    console.log(`\n▶ [GUARD] Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, {
      cwd,
      env,
      stdio: 'inherit',
    });
    proc.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`Command '${command} ${args.join(' ')}' failed with exit code ${code}`));
      }
    });
    proc.on('error', reject);
  });
}

async function main() {
  console.log('🔒 ============================================================');
  console.log('🔒 Sahara Outer Boundary Guard: Capturing Pre-Test DB Snapshots');
  console.log('🔒 ============================================================');

  const beforeSnapshots = new Map();
  for (const item of targetFiles) {
    const snap = captureSnapshot(item.path);
    beforeSnapshots.set(item.path, snap);
    console.log(
      ` [PRE] ${item.label.padEnd(16)} | Exists: ${snap.exists} | Size: ${String(snap.size).padEnd(8)} | Hash: ${snap.hash ? snap.hash.substring(0, 16) + '...' : 'none'}`
    );
  }

  let testError = null;

  try {
    // 1. Syntax check
    await runCommand(process.execPath, ['--check', 'server.mjs'], SITE_DIR);

    // 2. Vitest test suite
    const siteVitest = join(SITE_DIR, 'node_modules', 'vitest', 'vitest.mjs');
    const rootVitest = join(REPO_ROOT, 'node_modules', 'vitest', 'vitest.mjs');
    const vitestBin = existsSync(siteVitest) ? siteVitest : rootVitest;
    await runCommand(process.execPath, [vitestBin, 'run'], SITE_DIR);

    // 3. Node test runner for all tests/*.test.mjs integration tests
    const testsDir = join(SITE_DIR, 'tests');
    const testMjsFiles = existsSync(testsDir)
      ? readdirSync(testsDir)
          .filter((f) => f.endsWith('.test.mjs'))
          .map((f) => join(testsDir, f))
      : [];
    if (testMjsFiles.length > 0) {
      await runCommand(process.execPath, ['--test', ...testMjsFiles], SITE_DIR, {
        ...process.env,
        NODE_ENV: 'test',
        ALLOW_TEMP_DATA_DIR: '1',
      });
    }
  } catch (err) {
    testError = err;
  }

  console.log('\n🔒 ============================================================');
  console.log('🔒 Sahara Outer Boundary Guard: Post-Test DB Integrity Evaluation');
  console.log('🔒 ============================================================');

  let boundaryViolation = false;
  const violations = [];
  const shmNotes = [];

  for (const item of targetFiles) {
    const before = beforeSnapshots.get(item.path);
    const after = captureSnapshot(item.path);

    const existsChanged = before.exists !== after.exists;
    const sizeChanged = before.size !== after.size;
    const hashChanged = before.hash !== after.hash;
    const mtimeChanged = before.mtimeMs !== after.mtimeMs;

    if (item.critical) {
      const is0ByteWal = item.path.endsWith('-wal') && before.size === 0 && after.size === 0;
      if (!is0ByteWal && (existsChanged || sizeChanged || hashChanged || mtimeChanged)) {
        boundaryViolation = true;
        const reason =
          `CRITICAL VIOLATION: ${item.label} (${item.path}) changed! ` +
          `[Exists: ${before.exists} -> ${after.exists}, Size: ${before.size} -> ${after.size}, ` +
          `Hash: ${before.hash} -> ${after.hash}, mtimeMs: ${before.mtimeMs} -> ${after.mtimeMs}]`;
        violations.push(reason);
        console.error(`❌ ${reason}`);
      } else {
        console.log(
          `✅ [POST] ${item.label.padEnd(16)} | Unchanged (Size: ${after.size}, Hash: ${after.hash ? after.hash.substring(0, 16) + '...' : 'none'})`
        );
      }
    } else {
      // SHM file (SQLite shared memory created/modified by read-only handles)
      if (existsChanged || sizeChanged || hashChanged || mtimeChanged) {
        shmNotes.push(
          `ℹ️ [SHM Info] ${item.label}: state changed (Exists: ${before.exists} -> ${after.exists}, Size: ${before.size} -> ${after.size}) [Normal SQLite connection shared-memory lifecycle]`
        );
        console.log(
          `ℹ️ [POST] ${item.label.padEnd(16)} | SHM Lifecycle active (Size: ${after.size})`
        );
      } else {
        console.log(`✅ [POST] ${item.label.padEnd(16)} | Unchanged (Size: ${after.size})`);
      }
    }
  }

  if (shmNotes.length > 0) {
    console.log('\n--- SQLite Shared-Memory (SHM) Activity ---');
    shmNotes.forEach((n) => console.log(n));
  }

  if (testError) {
    console.error('\n❌ Test suite execution failed:');
    console.error(testError.message);
    process.exit(1);
  }

  if (boundaryViolation) {
    console.error('\n❌ FATAL: Database boundary was violated during test execution!');
    violations.forEach((v) => console.error(v));
    process.exit(1);
  }

  console.log('\n🎯 SUCCESS: All tests passed with 100% Zero-DB-Mutation boundary protection.\n');
}

main().catch((err) => {
  console.error('Fatal Guard error:', err);
  process.exit(1);
});
