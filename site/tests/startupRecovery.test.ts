import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { executeStartupCrashRecovery, calculateFileSha256 } from '../backend/shadowCutover.mjs';
import { writeJournalSync, CutoverStates } from '../backend/migrationJournal.mjs';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';

describe('Durable Startup Crash Recovery & Hash Verification Suite', () => {
  let tempDir: string;
  let stagingDir: string;
  let publicOrig: string;
  let draftOrig: string;
  let publicBackup: string;
  let draftBackup: string;
  let stagedPublic: string;
  let stagedDraft: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-recovery-test-'));
    stagingDir = join(tempDir, '.migration-staging');
    publicOrig = join(tempDir, 'catalog.sqlite');
    draftOrig = join(tempDir, 'catalog-draft.sqlite');
    publicBackup = join(stagingDir, 'pre_cutover_catalog.sqlite');
    draftBackup = join(stagingDir, 'pre_cutover_catalog_draft.sqlite');
    stagedPublic = join(stagingDir, 'staged_catalog.sqlite');
    stagedDraft = join(stagingDir, 'staged_catalog_draft.sqlite');

    // Create original databases
    const pubDb = createCatalogDatabase(publicOrig);
    pubDb.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'Italy' }],
      categories: [{ id: 'cooktop', name: 'Cooktops', slug: 'cooktop', sortOrder: 1 }],
      products: [
        {
          id: 'p-orig',
          code: 'ORIG-01',
          title: 'Original Product',
          brandId: 'ardo',
          category: 'cooktop',
          status: 'published',
        },
      ],
    });
    pubDb.close();

    const draftDb = createCatalogDatabase(draftOrig);
    draftDb.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'Italy' }],
      categories: [{ id: 'cooktop', name: 'Cooktops', slug: 'cooktop', sortOrder: 1 }],
      products: [
        {
          id: 'p-draft',
          code: 'DRAFT-01',
          title: 'Original Draft',
          brandId: 'ardo',
          category: 'cooktop',
          status: 'draft',
        },
      ],
    });
    draftDb.close();

    mkdirSync(stagingDir, { recursive: true });

    // Create backups in staging
    copyFileSync(publicOrig, publicBackup);
    copyFileSync(draftOrig, draftBackup);

    // Create staged migrated databases
    const stPubDb = createCatalogDatabase(stagedPublic);
    stPubDb.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'Italy' }],
      categories: [{ id: 'cooktop', name: 'Cooktops', slug: 'cooktop', sortOrder: 1 }],
      products: [
        {
          id: 'p-migrated',
          code: 'MIG-01',
          title: 'Migrated Product',
          brandId: 'ardo',
          category: 'cooktop',
          status: 'published',
        },
      ],
    });
    stPubDb.close();

    const stDraftDb = createCatalogDatabase(stagedDraft);
    stDraftDb.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'Italy' }],
      categories: [{ id: 'cooktop', name: 'Cooktops', slug: 'cooktop', sortOrder: 1 }],
      products: [
        {
          id: 'p-migrated-draft',
          code: 'MIG-DRAFT-01',
          title: 'Migrated Draft Product',
          brandId: 'ardo',
          category: 'cooktop',
          status: 'draft',
        },
      ],
    });
    stDraftDb.close();
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('1. Early cutover interruption (PREPARED / CONNECTIONS_CLOSED) triggers deterministic rollback', () => {
    const journalData = {
      migration_id: '0008_pim_v2_additive_architecture',
      version: 8,
      checksum: 'test-checksum',
      paths: {
        public_original: publicOrig,
        public_backup: publicBackup,
        public_staged: stagedPublic,
        draft_original: draftOrig,
        draft_backup: draftBackup,
        draft_staged: stagedDraft,
      },
      hashes: {
        pre_public_sha256: calculateFileSha256(publicBackup),
        pre_draft_sha256: calculateFileSha256(draftBackup),
        staged_public_sha256: calculateFileSha256(stagedPublic),
        staged_draft_sha256: calculateFileSha256(stagedDraft),
      },
      completed_steps: ['CONNECTIONS_CLOSED'],
      state: CutoverStates.CONNECTIONS_CLOSED,
    };
    writeJournalSync(stagingDir, journalData);

    const result = executeStartupCrashRecovery(tempDir, stagingDir);
    expect(result.recovered).toBe(true);
    expect(result.action).toBe('rolled_back');
    expect(result.state).toBe(CutoverStates.ROLLED_BACK);
  });

  it('2. PUBLIC_SWAPPED crash triggers rollback restoring both databases to pre-cutover backups', () => {
    // Simulate public was swapped with staged, but draft was not
    copyFileSync(stagedPublic, publicOrig);

    const journalData = {
      migration_id: '0008_pim_v2_additive_architecture',
      version: 8,
      checksum: 'test-checksum',
      paths: {
        public_original: publicOrig,
        public_backup: publicBackup,
        public_staged: stagedPublic,
        draft_original: draftOrig,
        draft_backup: draftBackup,
        draft_staged: stagedDraft,
      },
      hashes: {
        pre_public_sha256: calculateFileSha256(publicBackup),
        pre_draft_sha256: calculateFileSha256(draftBackup),
        staged_public_sha256: calculateFileSha256(stagedPublic),
        staged_draft_sha256: calculateFileSha256(stagedDraft),
      },
      completed_steps: ['CONNECTIONS_CLOSED', 'PUBLIC_SWAPPED'],
      state: CutoverStates.PUBLIC_SWAPPED,
    };
    writeJournalSync(stagingDir, journalData);

    const result = executeStartupCrashRecovery(tempDir, stagingDir);
    expect(result.recovered).toBe(true);
    expect(result.action).toBe('rolled_back');

    // Verify public database is restored to original backup
    expect(calculateFileSha256(publicOrig)).toBe(journalData.hashes.pre_public_sha256);
  });

  it('3. DRAFT_SWAPPED with valid staged hashes on disk forward commits', () => {
    // Both databases swapped
    copyFileSync(stagedPublic, publicOrig);
    copyFileSync(stagedDraft, draftOrig);

    const journalData = {
      migration_id: '0008_pim_v2_additive_architecture',
      version: 8,
      checksum: 'test-checksum',
      paths: {
        public_original: publicOrig,
        public_backup: publicBackup,
        public_staged: stagedPublic,
        draft_original: draftOrig,
        draft_backup: draftBackup,
        draft_staged: stagedDraft,
      },
      hashes: {
        pre_public_sha256: calculateFileSha256(publicBackup),
        pre_draft_sha256: calculateFileSha256(draftBackup),
        staged_public_sha256: calculateFileSha256(stagedPublic),
        staged_draft_sha256: calculateFileSha256(stagedDraft),
      },
      completed_steps: ['CONNECTIONS_CLOSED', 'PUBLIC_SWAPPED', 'DRAFT_SWAPPED'],
      state: CutoverStates.DRAFT_SWAPPED,
    };
    writeJournalSync(stagingDir, journalData);

    const result = executeStartupCrashRecovery(tempDir, stagingDir);
    expect(result.recovered).toBe(true);
    expect(result.action).toBe('committed');
    expect(result.state).toBe(CutoverStates.COMMITTED);
  });

  it('4. DRAFT_SWAPPED with tampered/mismatched hash fails closed and rolls back to backups', () => {
    // Public is valid staged, but draft is corrupted
    copyFileSync(stagedPublic, publicOrig);
    writeFileSync(draftOrig, 'CORRUPTED FILE CONTENTS');

    const journalData = {
      migration_id: '0008_pim_v2_additive_architecture',
      version: 8,
      checksum: 'test-checksum',
      paths: {
        public_original: publicOrig,
        public_backup: publicBackup,
        public_staged: stagedPublic,
        draft_original: draftOrig,
        draft_backup: draftBackup,
        draft_staged: stagedDraft,
      },
      hashes: {
        pre_public_sha256: calculateFileSha256(publicBackup),
        pre_draft_sha256: calculateFileSha256(draftBackup),
        staged_public_sha256: calculateFileSha256(stagedPublic),
        staged_draft_sha256: calculateFileSha256(stagedDraft),
      },
      completed_steps: ['CONNECTIONS_CLOSED', 'PUBLIC_SWAPPED', 'DRAFT_SWAPPED'],
      state: CutoverStates.DRAFT_SWAPPED,
    };
    writeJournalSync(stagingDir, journalData);

    const result = executeStartupCrashRecovery(tempDir, stagingDir);
    expect(result.recovered).toBe(true);
    expect(result.action).toBe('rolled_back');
    expect(result.state).toBe(CutoverStates.ROLLED_BACK);

    // Verify both files are restored to backups
    expect(calculateFileSha256(publicOrig)).toBe(journalData.hashes.pre_public_sha256);
    expect(calculateFileSha256(draftOrig)).toBe(journalData.hashes.pre_draft_sha256);
  });
});
