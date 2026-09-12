import { openSync, closeSync, writeFileSync, readFileSync, unlinkSync, existsSync, fsyncSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

export const JOURNAL_FILE_NAME = 'migration_journal.json';
export const JOURNAL_SCHEMA_VERSION = 1;

export const CutoverStates = {
  PREPARED: 'PREPARED',
  CONNECTIONS_CLOSED: 'CONNECTIONS_CLOSED',
  PUBLIC_SWAP_INTENT: 'PUBLIC_SWAP_INTENT',
  PUBLIC_SWAPPED: 'PUBLIC_SWAPPED',
  DRAFT_SWAP_INTENT: 'DRAFT_SWAP_INTENT',
  DRAFT_SWAPPED: 'DRAFT_SWAPPED',
  VERIFIED: 'VERIFIED',
  COMMITTED: 'COMMITTED',
  ROLLED_BACK: 'ROLLED_BACK',
};

/**
 * Atomically writes and fsyncs the migration journal to disk.
 */
export function writeJournalSync(stagingDir, journalData) {
  mkdirSync(stagingDir, { recursive: true });
  const journalPath = join(stagingDir, JOURNAL_FILE_NAME);
  const payload = {
    journal_schema_version: JOURNAL_SCHEMA_VERSION,
    updated_at: new Date().toISOString(),
    ...journalData,
  };

  const tempPath = `${journalPath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
  const fd = openSync(tempPath, 'w', 0o600);
  try {
    writeFileSync(fd, JSON.stringify(payload, null, 2), 'utf8');
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }

  renameSync(tempPath, journalPath);
  try {
    const dirFd = openSync(stagingDir, 'r');
    try {
      fsyncSync(dirFd);
    } finally {
      closeSync(dirFd);
    }
  } catch {
    // Directory fsync is not supported on some filesystem drivers
  }

  return payload;
}

export function readJournal(stagingDir) {
  const journalPath = join(stagingDir, JOURNAL_FILE_NAME);
  if (!existsSync(journalPath)) return null;
  try {
    const content = readFileSync(journalPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function deleteJournal(stagingDir) {
  const journalPath = join(stagingDir, JOURNAL_FILE_NAME);
  if (existsSync(journalPath)) {
    try {
      unlinkSync(journalPath);
    } catch {}
  }
}
