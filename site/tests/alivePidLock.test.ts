import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  acquireMigrationLock,
  releaseMigrationLock,
  isLockHeld,
  isProcessAlive,
} from '../backend/migrationLock.mjs';

describe('Alive PID File Lock & Concurrency Protection Suite', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-lock-test-'));
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('1. Acquires and releases lock cleanly for active process', () => {
    const lock = acquireMigrationLock(tempDir, 10_000);
    expect(lock.acquired).toBe(true);
    expect(lock.token).toBeDefined();
    expect(isLockHeld(tempDir)).toBe(true);

    const released = releaseMigrationLock(tempDir, lock.token);
    expect(released).toBe(true);
    expect(isLockHeld(tempDir)).toBe(false);
  });

  it('2. Refuses lock acquisition when held by an alive process (current PID)', () => {
    const lock1 = acquireMigrationLock(tempDir, 10_000);
    expect(lock1.acquired).toBe(true);

    // Second attempt must fail because lock1 holder (process.pid) is alive
    const lock2 = acquireMigrationLock(tempDir, 10_000);
    expect(lock2.acquired).toBe(false);
    expect(lock2.error).toContain('LOCKED_BY_ACTIVE_PROCESS');

    releaseMigrationLock(tempDir, lock1.token);
  });

  it('3. Cleans up stale lock if PID is verified dead (dead PID recovery)', () => {
    const lockFile = join(tempDir, 'migration.lock');
    const deadPid = 9999999; // Non-existent process
    expect(isProcessAlive(deadPid)).toBe(false);

    // Write a fake stale lock file with dead PID and expired TTL
    writeFileSync(
      lockFile,
      JSON.stringify({
        pid: deadPid,
        nonce: 'stale-nonce',
        acquiredAt: new Date(Date.now() - 30_000).toISOString(),
        expiresAt: new Date(Date.now() - 10_000).toISOString(),
        ttlMs: 5000,
      })
    );

    expect(isLockHeld(tempDir)).toBe(true);

    // Should detect dead PID, clean up stale lock, and acquire
    const lock = acquireMigrationLock(tempDir, 10_000);
    expect(lock.acquired).toBe(true);
    expect(lock.token).toBeDefined();

    releaseMigrationLock(tempDir, lock.token);
  });
});
