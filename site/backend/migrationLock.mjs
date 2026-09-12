import { openSync, closeSync, writeFileSync, readFileSync, unlinkSync, existsSync, lstatSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { join } from 'node:path';

export const LOCK_FILE_NAME = 'migration.lock';
export const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Checks if a PID is alive on the operating system.
 * Returns true if process exists; false if ESRCH.
 */
export function isPidAlive(pid) {
  if (typeof pid !== 'number' || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    if (err && err.code === 'ESRCH') {
      return false;
    }
    // EPERM means process exists but we don't have permission to signal it (still alive)
    return true;
  }
}

/**
 * Attempts to acquire an atomic migration lock.
 * Uses atomic openSync with O_CREAT | O_EXCL ('wx') and restrictive permissions (0o600).
 */
export function acquireMigrationLock(dataDir, customTtlMs) {
  const effectiveTtl = typeof customTtlMs === 'number' && customTtlMs > 0 ? customTtlMs : LOCK_TTL_MS;
  mkdirSync(dataDir, { recursive: true });
  const lockPath = join(dataDir, LOCK_FILE_NAME);
  const nonce = randomUUID();
  const lockPayload = {
    pid: process.pid,
    nonce,
    hostname: hostname(),
    timestamp: Date.now(),
    createdAt: new Date().toISOString(),
  };

  // 1. Try atomic create
  try {
    const fd = openSync(lockPath, 'wx', 0o600);
    try {
      writeFileSync(fd, JSON.stringify(lockPayload, null, 2), 'utf8');
    } finally {
      closeSync(fd);
    }
    return {
      acquired: true,
      token: nonce,
      lockPath,
      nonce,
      lockPayload,
    };
  } catch (err) {
    if (!err || err.code !== 'EEXIST') {
      throw new Error(`Failed to create migration lock file: ${err?.message || err}`);
    }
  }

  // 2. Lock file exists: Inspect if stale
  try {
    // Check symlink rejection
    const lstat = lstatSync(lockPath);
    if (lstat.isSymbolicLink()) {
      throw new Error('SECURITY VIOLATION: migration.lock is a symbolic link. Acquisition aborted.');
    }

    const content = readFileSync(lockPath, 'utf8');
    const existing = JSON.parse(content);
    const existingPid = existing.pid;
    const existingTime = existing.timestamp || (existing.acquiredAt ? new Date(existing.acquiredAt).getTime() : 0);
    const age = Date.now() - existingTime;

    // Check if the process holding lock is still alive
    const alive = isPidAlive(existingPid);

    if (!alive && age > effectiveTtl) {
      // Process is DEAD (ESRCH) AND TTL has passed -> Safe stale lock recovery
      try {
        unlinkSync(lockPath);
      } catch (unlinkErr) {
        if (unlinkErr.code !== 'ENOENT') throw unlinkErr;
      }
      // Retry atomic acquisition once after clearing dead stale lock
      const fd = openSync(lockPath, 'wx', 0o600);
      try {
        writeFileSync(fd, JSON.stringify(lockPayload, null, 2), 'utf8');
      } finally {
        closeSync(fd);
      }
      return {
        acquired: true,
        token: nonce,
        lockPath,
        nonce,
        lockPayload,
        recoveredFromStalePid: existingPid,
      };
    }

    // Process is ALIVE or age <= TTL -> Fail-Closed
    const reason = alive
      ? `LOCKED_BY_ACTIVE_PROCESS: Migration lock is actively held by live process PID ${existingPid}`
      : `Lock is still within safety TTL (${Math.round((effectiveTtl - age) / 1000)}s remaining)`;
    return {
      acquired: false,
      lockPath,
      reason,
      error: reason,
      activePid: existingPid,
      isAlive: alive,
    };
  } catch (inspectErr) {
    const reason = `Cannot safely inspect migration lock: ${inspectErr.message}`;
    return {
      acquired: false,
      lockPath,
      reason,
      error: reason,
      isAlive: true,
    };
  }
}

export const isProcessAlive = isPidAlive;

export function isLockHeld(dataDir) {
  const lockPath = join(dataDir, LOCK_FILE_NAME);
  return existsSync(lockPath);
}

/**
 * Releases the migration lock only if the nonce matches.
 */
export function releaseMigrationLock(arg1, arg2) {
  let lockPath;
  let nonce;

  if (typeof arg1 === 'string' && typeof arg2 === 'string') {
    lockPath = join(arg1, LOCK_FILE_NAME);
    nonce = arg2;
  } else if (arg1 && typeof arg1 === 'object') {
    lockPath = arg1.lockPath || join(arg1.dataDir || '', LOCK_FILE_NAME);
    nonce = arg1.nonce || arg1.token;
  }

  if (!lockPath || !nonce) return false;
  try {
    if (!existsSync(lockPath)) return true;
    const content = readFileSync(lockPath, 'utf8');
    const existing = JSON.parse(content);
    if (existing.nonce === nonce) {
      unlinkSync(lockPath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

