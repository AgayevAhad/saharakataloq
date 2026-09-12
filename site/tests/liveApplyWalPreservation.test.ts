import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync, existsSync, copyFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { executeShadowCutover } from '../backend/shadowCutover.mjs';
import { applyPimV2Schema, migrateDataToPimV2 } from '../backend/pimV2Migration.mjs';
import { ScheduledPublicationWorker } from '../backend/scheduledPublicationJob.mjs';

describe('Live Apply WAL Preservation, Worker Reconnection & Rollback Integrity Suite', () => {
  let tempDir: string;
  let publicPath: string;
  let draftPath: string;
  let stagedPublicPath: string;
  let stagedDraftPath: string;
  let auditLogPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-wal-apply-test-'));
    publicPath = join(tempDir, 'catalog.sqlite');
    draftPath = join(tempDir, 'catalog-draft.sqlite');
    stagedPublicPath = join(tempDir, 'catalog.staged.sqlite');
    stagedDraftPath = join(tempDir, 'catalog-draft.staged.sqlite');
    auditLogPath = join(tempDir, 'migration-audit.log');
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function setupBaselineDatabases() {
    for (const p of [publicPath, draftPath]) {
      const db = new DatabaseSync(p);
      db.exec(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE brands (
          id TEXT PRIMARY KEY,
          name TEXT,
          slug TEXT,
          logo_url TEXT,
          description TEXT,
          is_active INTEGER DEFAULT 1,
          sort_order INTEGER DEFAULT 0,
          country TEXT,
          created_at TEXT,
          updated_at TEXT
        );
        CREATE TABLE products (
          id TEXT PRIMARY KEY,
          code TEXT,
          title TEXT,
          category TEXT,
          brand_id TEXT,
          price REAL,
          status TEXT,
          created_at TEXT,
          updated_at TEXT
        );
        INSERT INTO brands (id, name, slug, is_active) VALUES ('b1', 'TestBrand', 'test-brand', 1);
        INSERT INTO products (id, code, title, category, brand_id, price, status) 
        VALUES ('p1', 'CODE1', 'Product 1', 'Oven', 'b1', 500, 'active');
      `);
      db.close();
    }
  }

  it('1. Proves WAL data is safely checkpointed/preserved, worker stopped & recreated during cutover', async () => {
    setupBaselineDatabases();

    // 1. Open active DB handles with WAL mode and insert in-flight records
    let publicDb = new DatabaseSync(publicPath);
    let draftDb = new DatabaseSync(draftPath);

    publicDb.exec('PRAGMA journal_mode = WAL;');
    draftDb.exec('PRAGMA journal_mode = WAL;');

    // Insert live WAL records
    draftDb.exec(
      "INSERT INTO products (id, code, title, category, brand_id, price, status) VALUES ('p2_wal', 'CODE2', 'WAL Draft Item', 'Oven', 'b1', 600, 'draft');"
    );

    // Initialize scheduled worker with current DB handles
    let worker = new ScheduledPublicationWorker(publicDb, draftDb, { pollIntervalMs: 10000 });
    worker.start();
    expect(worker.isRunning()).toBe(true);

    // 2. Simulate active request drain & graceful worker pause
    worker.stop();
    expect(worker.isRunning()).toBe(false);

    // Flushes in-flight WAL transactions to database pages
    publicDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    draftDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    publicDb.close();
    draftDb.close();

    // Prepare staged databases with migrated PIM v2 schema
    copyFileSync(publicPath, stagedPublicPath);
    copyFileSync(draftPath, stagedDraftPath);

    const stagedPublicDb = new DatabaseSync(stagedPublicPath);
    applyPimV2Schema(stagedPublicDb);
    migrateDataToPimV2(stagedPublicDb);
    stagedPublicDb.close();

    const stagedDraftDb = new DatabaseSync(stagedDraftPath);
    applyPimV2Schema(stagedDraftDb);
    migrateDataToPimV2(stagedDraftDb);
    stagedDraftDb.close();

    // 3. Perform atomic cutover
    const cutoverResult = await executeShadowCutover({
      livePublicPath: publicPath,
      liveDraftPath: draftPath,
      stagedPublicPath: stagedPublicPath,
      stagedDraftPath: stagedDraftPath,
      auditLogPath,
      adminId: 'admin_test',
    });

    expect(cutoverResult.success).toBe(true);
    expect(cutoverResult.reopenedCleanly).toBe(true);

    // 4. Reopen fresh database connections and verify WAL data survived intact
    publicDb = new DatabaseSync(publicPath);
    draftDb = new DatabaseSync(draftPath);

    const p2InDraft = draftDb.prepare("SELECT * FROM products WHERE id = 'p2_wal'").get() as any;
    expect(p2InDraft).toBeDefined();
    expect(p2InDraft.title).toBe('WAL Draft Item');
    expect(p2InDraft.publication_status).toBe('draft');

    // 5. Recreate scheduled worker with new DB handles and verify it is operational
    worker = new ScheduledPublicationWorker(publicDb, draftDb, { pollIntervalMs: 10000 });
    worker.start();
    expect(worker.isRunning()).toBe(true);
    worker.stop();

    publicDb.close();
    draftDb.close();
  });

  it('2. Records CORRUPT_REQUIRES_MANUAL_INTERVENTION and sets fail-closed on reopen failure during rollback', async () => {
    setupBaselineDatabases();

    // Create corrupted staged files that will fail verification
    writeFileSync(stagedPublicPath, 'corrupted content not sqlite');
    writeFileSync(stagedDraftPath, 'corrupted content not sqlite');

    // Reopen validator that intentionally fails on rollback reopen
    let reopenAttempted = false;
    const failingReopenValidator = () => {
      reopenAttempted = true;
      throw new Error('Simulated disk I/O lock prevent reopen');
    };

    const cutoverResult = await executeShadowCutover({
      livePublicPath: publicPath,
      liveDraftPath: draftPath,
      stagedPublicPath: stagedPublicPath,
      stagedDraftPath: stagedDraftPath,
      auditLogPath,
      adminId: 'admin_test',
      reopenValidator: failingReopenValidator,
    });

    expect(cutoverResult.success).toBe(false);
    expect(cutoverResult.error).toContain('CRITICAL_FAIL_CLOSED');
    expect(cutoverResult.reopenedCleanly).toBe(false);
    expect(cutoverResult.reopenError).toContain('Simulated disk I/O lock');
    expect(reopenAttempted).toBe(true);
  });
});
