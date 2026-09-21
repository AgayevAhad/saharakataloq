import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { applyOrphanSpecRepair, planOrphanSpecRepair } from '../backend/orphanSpecRepair.mjs';

const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const reference = join(root, 'data', 'catalog.sqlite');
const siteData = join(root, 'site', 'data');
const targets = ['catalog.sqlite', 'catalog-draft.sqlite'];
const apply = process.argv.includes('--apply');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

for (const name of targets) {
  const target = join(siteData, name);
  const backup = join(siteData, 'backups', `${name}.${stamp}.before-orphan-spec-repair.sqlite`);
  const result = apply
    ? applyOrphanSpecRepair(reference, target, backup)
    : planOrphanSpecRepair(reference, target);
  console.log(
    `${name}: ${result.products} exact product codes, ${result.specs} specs${apply && result.backupPath ? `; backup: ${result.backupPath}` : ''}`
  );
}
if (!apply) console.log('Dry-run only. Pass --apply to back up and repair both site databases.');
