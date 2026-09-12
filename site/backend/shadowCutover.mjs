import { DatabaseSync } from 'node:sqlite';
import { existsSync, openSync, closeSync, fsyncSync, mkdirSync, readFileSync, renameSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { writeJournalSync, readJournal, CutoverStates } from './migrationJournal.mjs';

export function calculateFileSha256(filePath) {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

export function fsyncDirectory(dirPath) {
  try {
    const fd = openSync(dirPath, 'r');
    try {
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
  } catch {
    // Directory fsync may not be supported by some OS/filesystems
  }
}

export function fsyncFile(filePath) {
  if (!existsSync(filePath)) return;
  try {
    const fd = openSync(filePath, 'r');
    try {
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
  } catch {}
}

/**
 * Executes a verified startup crash recovery before database connections are opened or server listens.
 * If recovery detects corrupted or unrecoverable state, throws error for fail-closed behavior.
 */
export function executeStartupCrashRecovery(dataDir, stagingDir) {
  const journal = readJournal(stagingDir);
  if (!journal || !journal.state) {
    return { recovered: false, status: 'clean' };
  }

  const { state, paths, hashes } = journal;

  // Already cleanly committed or rolled back
  if (state === CutoverStates.COMMITTED || state === CutoverStates.ROLLED_BACK) {
    return { recovered: false, status: state };
  }

  const publicOrig = paths?.public_original || join(dataDir, 'catalog.sqlite');
  const draftOrig = paths?.draft_original || join(dataDir, 'catalog-draft.sqlite');
  const publicBackup = paths?.public_backup || join(stagingDir, 'pre_cutover_catalog.sqlite');
  const draftBackup = paths?.draft_backup || join(stagingDir, 'pre_cutover_catalog_draft.sqlite');

  // Case 1: Early swap intent stages -> Deterministic Atomic Rollback to backups
  if (
    state === CutoverStates.PREPARED ||
    state === CutoverStates.CONNECTIONS_CLOSED ||
    state === CutoverStates.PUBLIC_SWAP_INTENT ||
    state === CutoverStates.PUBLIC_SWAPPED ||
    state === CutoverStates.DRAFT_SWAP_INTENT
  ) {
    try {
      if (existsSync(publicBackup)) {
        renameSync(publicBackup, publicOrig);
        fsyncFile(publicOrig);
      }
      if (existsSync(draftBackup)) {
        renameSync(draftBackup, draftOrig);
        fsyncFile(draftOrig);
      }
      fsyncDirectory(dataDir);
      fsyncDirectory(stagingDir);

      writeJournalSync(stagingDir, {
        ...journal,
        state: CutoverStates.ROLLED_BACK,
        recovered_at: new Date().toISOString(),
        recovery_action: 'rolled_back_to_backup_via_atomic_rename',
      });
      return { recovered: true, action: 'rolled_back', state: CutoverStates.ROLLED_BACK };
    } catch (rbErr) {
      throw new Error(`CRITICAL_STARTUP_RECOVERY_FAILED: Could not rollback early swap: ${rbErr.message}`);
    }
  }

  // Case 2: DRAFT_SWAPPED or VERIFIED -> Verify on-disk hashes
  if (state === CutoverStates.DRAFT_SWAPPED || state === CutoverStates.VERIFIED) {
    const currentPublicHash = calculateFileSha256(publicOrig);
    const currentDraftHash = calculateFileSha256(draftOrig);

    const publicMatches = currentPublicHash === hashes?.staged_public_sha256;
    const draftMatches = currentDraftHash === hashes?.staged_draft_sha256;

    if (publicMatches && draftMatches) {
      let integrityPass = false;
      try {
        const dbPub = new DatabaseSync(publicOrig);
        const dbDraft = new DatabaseSync(draftOrig);
        try {
          const resP = dbPub.prepare('PRAGMA integrity_check').all();
          const resD = dbDraft.prepare('PRAGMA integrity_check').all();
          const fkP = dbPub.prepare('PRAGMA foreign_key_check').all();
          const fkD = dbDraft.prepare('PRAGMA foreign_key_check').all();
          integrityPass =
            resP[0]?.integrity_check === 'ok' &&
            resD[0]?.integrity_check === 'ok' &&
            fkP.length === 0 &&
            fkD.length === 0;
        } finally {
          dbPub.close();
          dbDraft.close();
        }
      } catch {
        integrityPass = false;
      }

      if (integrityPass) {
        // Forward Commit
        writeJournalSync(stagingDir, {
          ...journal,
          state: CutoverStates.COMMITTED,
          recovered_at: new Date().toISOString(),
          recovery_action: 'forward_committed',
        });
        return { recovered: true, action: 'committed', state: CutoverStates.COMMITTED };
      }
    }

    // Integrity check failed or hash mismatch -> Atomic Rollback to backups
    try {
      if (existsSync(publicBackup)) {
        renameSync(publicBackup, publicOrig);
        fsyncFile(publicOrig);
      }
      if (existsSync(draftBackup)) {
        renameSync(draftBackup, draftOrig);
        fsyncFile(draftOrig);
      }
      fsyncDirectory(dataDir);
      fsyncDirectory(stagingDir);

      writeJournalSync(stagingDir, {
        ...journal,
        state: CutoverStates.ROLLED_BACK,
        recovered_at: new Date().toISOString(),
        recovery_action: 'rolled_back_due_to_failed_verification',
      });
      return { recovered: true, action: 'rolled_back', state: CutoverStates.ROLLED_BACK };
    } catch (rbErr) {
      throw new Error(`CRITICAL_STARTUP_RECOVERY_FAILED: Could not rollback verified swap: ${rbErr.message}`);
    }
  }

  return { recovered: false, status: state };
}

/**
 * Performs a coordinated two-phase staging cutover with durable journal and same-filesystem atomic renames.
 */
export function performCoordinatedCutover({
  dataDir,
  stagingDir,
  stagedPublicPath,
  stagedDraftPath,
  migrationChecksum,
  closeConnectionsFn,
  reopenConnectionsFn,
}) {
  mkdirSync(stagingDir, { recursive: true });

  const publicOrig = join(dataDir, 'catalog.sqlite');
  const draftOrig = join(dataDir, 'catalog-draft.sqlite');
  const publicBackup = join(stagingDir, 'pre_cutover_catalog.sqlite');
  const draftBackup = join(stagingDir, 'pre_cutover_catalog_draft.sqlite');

  const prePublicHash = calculateFileSha256(publicOrig);
  const preDraftHash = calculateFileSha256(draftOrig);
  const stagedPublicHash = calculateFileSha256(stagedPublicPath);
  const stagedDraftHash = calculateFileSha256(stagedDraftPath);

  if (!stagedPublicHash || !stagedDraftHash) {
    throw new Error('Staged migration database files do not exist or are unreadable.');
  }

  const journalData = {
    migration_id: '0008_pim_v2_additive_architecture',
    version: 8,
    checksum: migrationChecksum,
    paths: {
      public_original: publicOrig,
      public_backup: publicBackup,
      public_staged: stagedPublicPath,
      draft_original: draftOrig,
      draft_backup: draftBackup,
      draft_staged: stagedDraftPath,
    },
    hashes: {
      pre_public_sha256: prePublicHash,
      pre_draft_sha256: preDraftHash,
      staged_public_sha256: stagedPublicHash,
      staged_draft_sha256: stagedDraftHash,
      post_public_sha256: null,
      post_draft_sha256: null,
    },
    completed_steps: [],
    state: CutoverStates.PREPARED,
  };

  // Step 1: PREPARED
  writeJournalSync(stagingDir, journalData);

  try {
    // Step 2: CONNECTIONS_CLOSED
    if (typeof closeConnectionsFn === 'function') {
      closeConnectionsFn();
    }
    journalData.state = CutoverStates.CONNECTIONS_CLOSED;
    journalData.completed_steps.push('CONNECTIONS_CLOSED');
    writeJournalSync(stagingDir, journalData);

    // Create safe backups in staging via atomic rename or link/move
    if (existsSync(publicOrig)) {
      renameSync(publicOrig, publicBackup);
      fsyncFile(publicBackup);
    }
    if (existsSync(draftOrig)) {
      renameSync(draftOrig, draftBackup);
      fsyncFile(draftBackup);
    }
    fsyncDirectory(dataDir);
    fsyncDirectory(stagingDir);

    // Step 3: PUBLIC_SWAP_INTENT
    journalData.state = CutoverStates.PUBLIC_SWAP_INTENT;
    journalData.completed_steps.push('PUBLIC_SWAP_INTENT');
    writeJournalSync(stagingDir, journalData);

    // Swap public atomically
    renameSync(stagedPublicPath, publicOrig);
    fsyncFile(publicOrig);
    fsyncDirectory(dataDir);

    // Step 4: PUBLIC_SWAPPED
    journalData.state = CutoverStates.PUBLIC_SWAPPED;
    journalData.completed_steps.push('PUBLIC_SWAPPED');
    writeJournalSync(stagingDir, journalData);

    // Step 5: DRAFT_SWAP_INTENT
    journalData.state = CutoverStates.DRAFT_SWAP_INTENT;
    journalData.completed_steps.push('DRAFT_SWAP_INTENT');
    writeJournalSync(stagingDir, journalData);

    // Swap draft atomically
    renameSync(stagedDraftPath, draftOrig);
    fsyncFile(draftOrig);
    fsyncDirectory(dataDir);

    // Step 6: DRAFT_SWAPPED
    journalData.state = CutoverStates.DRAFT_SWAPPED;
    journalData.completed_steps.push('DRAFT_SWAPPED');
    writeJournalSync(stagingDir, journalData);

    // Step 7: VERIFIED - Integrity checks
    const dbPub = new DatabaseSync(publicOrig);
    const dbDraft = new DatabaseSync(draftOrig);
    try {
      const resP = dbPub.prepare('PRAGMA integrity_check').all();
      const resD = dbDraft.prepare('PRAGMA integrity_check').all();
      const fkP = dbPub.prepare('PRAGMA foreign_key_check').all();
      const fkD = dbDraft.prepare('PRAGMA foreign_key_check').all();

      if (resP[0]?.integrity_check !== 'ok' || resD[0]?.integrity_check !== 'ok' || fkP.length > 0 || fkD.length > 0) {
        throw new Error('Integrity check or foreign key check failed on swapped databases.');
      }
    } finally {
      dbPub.close();
      dbDraft.close();
    }

    journalData.state = CutoverStates.VERIFIED;
    journalData.completed_steps.push('VERIFIED');
    journalData.hashes.post_public_sha256 = calculateFileSha256(publicOrig);
    journalData.hashes.post_draft_sha256 = calculateFileSha256(draftOrig);
    writeJournalSync(stagingDir, journalData);

    // Step 8: COMMITTED
    journalData.state = CutoverStates.COMMITTED;
    journalData.completed_steps.push('COMMITTED');
    writeJournalSync(stagingDir, journalData);

    if (typeof reopenConnectionsFn === 'function') {
      reopenConnectionsFn();
    }

    return {
      success: true,
      journal: journalData,
    };
  } catch (cutoverErr) {
    // Fail-Closed Atomic Rollback
    let rollbackFailed = false;
    let rollbackError = null;

    try {
      if (existsSync(publicBackup)) {
        if (existsSync(publicOrig)) {
          try { unlinkSync(publicOrig); } catch {}
        }
        renameSync(publicBackup, publicOrig);
        fsyncFile(publicOrig);
      }
      if (existsSync(draftBackup)) {
        if (existsSync(draftOrig)) {
          try { unlinkSync(draftOrig); } catch {}
        }
        renameSync(draftBackup, draftOrig);
        fsyncFile(draftOrig);
      }
      fsyncDirectory(dataDir);
      fsyncDirectory(stagingDir);
    } catch (rbErr) {
      rollbackFailed = true;
      rollbackError = rbErr;
      console.error('Fatal rollback error:', rbErr);
    }

    if (rollbackFailed) {
      globalThis.__SAHARA_FAIL_CLOSED__ = true;
      journalData.state = 'CORRUPT_REQUIRES_MANUAL_INTERVENTION';
      journalData.completed_steps.push(`ROLLBACK_FAILED_${rollbackError?.message || rollbackError}`);
      writeJournalSync(stagingDir, journalData);
      throw new Error(
        `CRITICAL_FAIL_CLOSED: Cutover failed and atomic rollback also failed: ${rollbackError?.message || rollbackError}`
      );
    }

    // Attempt to reopen database connections before marking journal as ROLLED_BACK
    if (typeof reopenConnectionsFn === 'function') {
      try {
        reopenConnectionsFn();
      } catch (reopenErr) {
        globalThis.__SAHARA_FAIL_CLOSED__ = true;
        journalData.state = 'CORRUPT_REQUIRES_MANUAL_INTERVENTION';
        journalData.completed_steps.push(`REOPEN_FAILED_${reopenErr.message}`);
        writeJournalSync(stagingDir, journalData);
        console.error('Fatal database reopen error after rollback:', reopenErr);
        throw new Error(
          `CRITICAL_FAIL_CLOSED: Rollback succeeded on disk but reopening database connections failed: ${reopenErr.message}`
        );
      }
    }

    // Only record ROLLED_BACK once disk rollback and connection reopening succeed cleanly
    journalData.state = CutoverStates.ROLLED_BACK;
    journalData.completed_steps.push(`ROLLBACK_DUE_TO_${cutoverErr.message}`);
    writeJournalSync(stagingDir, journalData);

    throw new Error(`Cutover failed and was safely rolled back: ${cutoverErr.message}`);
  }
}

/**
 * Async wrapper for performCoordinatedCutover compatible with integration test fixtures.
 */
export async function executeShadowCutover({
  dataDir,
  stagingDir,
  livePublicPath,
  liveDraftPath: _liveDraftPath,
  stagedPublicPath,
  stagedDraftPath,
  auditLogPath: _auditLogPath,
  adminId: _adminId,
  migrationChecksum,
  closeConnectionsFn,
  reopenConnectionsFn,
  reopenValidator,
}) {
  const dir = dataDir || (livePublicPath ? dirname(livePublicPath) : process.cwd());
  const stageDir = stagingDir || (stagedPublicPath ? dirname(stagedPublicPath) : join(dir, '.staging'));

  try {
    const result = performCoordinatedCutover({
      dataDir: dir,
      stagingDir: stageDir,
      stagedPublicPath: stagedPublicPath || join(stageDir, 'catalog.staged.sqlite'),
      stagedDraftPath: stagedDraftPath || join(stageDir, 'catalog-draft.staged.sqlite'),
      migrationChecksum: migrationChecksum || 'manifest_test',
      closeConnectionsFn,
      reopenConnectionsFn: reopenValidator || reopenConnectionsFn,
    });
    return { success: true, reopenedCleanly: true, journal: result.journal };
  } catch (err) {
    const isReopenFailure = err.message.includes('REOPEN_FAILED') || err.message.includes('reopening database connections failed');
    return {
      success: false,
      error: err.message,
      reopenedCleanly: !isReopenFailure,
      reopenError: isReopenFailure ? err.message : null,
    };
  }
}

