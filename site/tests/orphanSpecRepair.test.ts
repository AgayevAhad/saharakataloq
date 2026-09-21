import { afterEach, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyOrphanSpecRepair, planOrphanSpecRepair } from '../backend/orphanSpecRepair.mjs';

const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const fixture = (mismatched = false) => {
  const dir = mkdtempSync(join(tmpdir(), 'sahara-spec-repair-'));
  dirs.push(dir);
  const reference = join(dir, 'reference.sqlite');
  const target = join(dir, 'target.sqlite');
  for (const [path, productId] of [
    [reference, 'original-model'],
    [target, 'renamed-model'],
  ]) {
    const db = new DatabaseSync(path);
    db.exec(
      'CREATE TABLE products(id TEXT PRIMARY KEY, code TEXT, title TEXT, brand_id TEXT, category_id TEXT); CREATE TABLE product_specs(id TEXT PRIMARY KEY, product_id TEXT REFERENCES products(id), name TEXT, value TEXT);'
    );
    db.prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?)').run(
      productId,
      'MODEL-123',
      mismatched && path === target ? 'Wrong title' : 'Exact product',
      'ardo',
      'ovens'
    );
    if (path === target) {
      // Reproduce a legacy import that disabled FK checks while renaming IDs.
      db.exec('PRAGMA foreign_keys = OFF');
      db.prepare('INSERT INTO product_specs VALUES (?, ?, ?, ?)').run(
        'spec-1',
        'original-model',
        'Power',
        '1000W'
      );
    }
    db.close();
  }
  return { reference, target, backup: join(dir, 'backup', 'target.sqlite') };
};

describe('exact orphan specification repair', () => {
  it('backs up then reattaches specs without changing their values or product records', () => {
    const { reference, target, backup } = fixture();
    expect(planOrphanSpecRepair(reference, target)).toMatchObject({ products: 1, specs: 1 });
    expect(applyOrphanSpecRepair(reference, target, backup).backupPath).toBe(backup);
    expect(existsSync(backup)).toBe(true);
    const db = new DatabaseSync(target, { readOnly: true });
    expect(db.prepare('SELECT product_id, name, value FROM product_specs').get()).toMatchObject({
      product_id: 'renamed-model',
      name: 'Power',
      value: '1000W',
    });
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    db.close();
    const archived = new DatabaseSync(backup, { readOnly: true });
    expect(archived.prepare('SELECT product_id FROM product_specs').get()).toMatchObject({
      product_id: 'original-model',
    });
    archived.close();
  });

  it('refuses identity mismatches before writing or creating a backup', () => {
    const { reference, target, backup } = fixture(true);
    expect(() => applyOrphanSpecRepair(reference, target, backup)).toThrow(
      'Product identity mismatch'
    );
    expect(existsSync(backup)).toBe(false);
  });
});
