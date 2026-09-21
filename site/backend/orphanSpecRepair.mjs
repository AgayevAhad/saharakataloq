import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createConsistentDatabaseSnapshot } from './catalogDatabase.mjs';

const orphanIds = (db) => db.prepare(`
  SELECT DISTINCT s.product_id AS id FROM product_specs s
  WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = s.product_id)
  ORDER BY s.product_id
`).all();

/** Exact-code repair only. Never infer a model from a filename, title fragment, or brand. */
export function planOrphanSpecRepair(referencePath, targetPath) {
  const reference = new DatabaseSync(referencePath, { readOnly: true });
  const target = new DatabaseSync(targetPath, { readOnly: true });
  try {
    const mapping = [];
    for (const { id } of orphanIds(target)) {
      const original = reference.prepare('SELECT id, code, title, brand_id, category_id FROM products WHERE id = ?').get(id);
      if (!original?.code) throw new Error(`Unmatched orphan product ID: ${id}`);
      const matches = target.prepare('SELECT id, code, title, brand_id, category_id FROM products WHERE code = ?').all(original.code);
      if (matches.length !== 1) throw new Error(`Non-unique or missing exact product code: ${original.code}`);
      const replacement = matches[0];
      if (replacement.title !== original.title || replacement.brand_id !== original.brand_id || replacement.category_id !== original.category_id) {
        throw new Error(`Product identity mismatch for exact code: ${original.code}`);
      }
      if (target.prepare('SELECT 1 FROM product_specs WHERE product_id = ? LIMIT 1').get(replacement.id)) {
        throw new Error(`Target product already has specs: ${replacement.id}`);
      }
      const count = target.prepare('SELECT COUNT(*) AS count FROM product_specs WHERE product_id = ?').get(id).count;
      mapping.push({ from: id, to: replacement.id, code: original.code, count });
    }
    const violations = target.prepare('PRAGMA foreign_key_check').all();
    const total = mapping.reduce((sum, item) => sum + item.count, 0);
    if (violations.length !== total || violations.some((row) => row.table !== 'product_specs')) {
      throw new Error(`Unexpected foreign-key violations: ${violations.length}; expected only ${total} orphan specs`);
    }
    return { mapping, products: mapping.length, specs: total };
  } finally {
    reference.close();
    target.close();
  }
}

export function applyOrphanSpecRepair(referencePath, targetPath, backupPath) {
  const plan = planOrphanSpecRepair(referencePath, targetPath);
  if (!plan.specs) return { ...plan, backupPath: null };
  mkdirSync(dirname(backupPath), { recursive: true });
  createConsistentDatabaseSnapshot(targetPath, backupPath);
  const target = new DatabaseSync(targetPath);
  try {
    target.exec('PRAGMA foreign_keys = ON; BEGIN IMMEDIATE;');
    try {
      const update = target.prepare('UPDATE product_specs SET product_id = ? WHERE product_id = ?');
      for (const item of plan.mapping) {
        const result = update.run(item.to, item.from);
        if (result.changes !== item.count) throw new Error(`Changed spec count mismatch for ${item.code}`);
      }
      if (orphanIds(target).length || target.prepare('PRAGMA foreign_key_check').all().length) {
        throw new Error('Foreign-key violations remain after exact-code repair');
      }
      target.exec('COMMIT');
    } catch (error) {
      target.exec('ROLLBACK');
      throw error;
    }
  } finally {
    target.close();
  }
  return { ...plan, backupPath };
}
