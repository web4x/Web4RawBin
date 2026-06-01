/**
 * T159 — Strip back-ref fields from scenario JSON units (forward-only chain).
 *
 * Usage:
 *   npx tsx scripts/strip-back-refs.ts --dry-run    # audit only
 *   npx tsx scripts/strip-back-refs.ts --apply       # strip + write
 *
 * [impl:uuid:13e644f4-8a89-44bf-a71c-cad66d12c539] R17 forward-only
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
const idx = new ScenarioIndex(INDEX_DIR);
const apply = process.argv.includes('--apply');

const BACK_REF_FIELDS: Record<string, string[]> = {
  Task: ['requirements', 'links.up', 'chain.requirements'],
  UseCase: ['requirement', 'requirements'],
  Method: ['requirement'],
  Test: ['requirements'],
};

interface StripResult { class: string; uuid: string; field: string; }
const stripped: StripResult[] = [];
const perClass: Record<string, { before: number; after: number }> = {};

for (const uuid of idx.list()) {
  const unit = idx.get(uuid);
  if (!unit) continue;
  const className = unit.ior.replace('ior:class:', '');
  const fields = BACK_REF_FIELDS[className];
  if (!fields) continue;

  if (!perClass[className]) perClass[className] = { before: 0, after: 0 };
  const m = unit.model as Record<string, unknown>;
  let changed = false;

  for (const field of fields) {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      const obj = m[parent] as Record<string, unknown> | undefined;
      if (obj && child in obj) {
        const val = obj[child];
        if (val && (Array.isArray(val) ? val.length > 0 : val !== null)) {
          perClass[className].before++;
          stripped.push({ class: className, uuid, field });
        }
        delete obj[child];
        changed = true;
      }
    } else if (field in m) {
      const val = m[field];
      if (val && (Array.isArray(val) ? val.length > 0 : val !== null)) {
        perClass[className].before++;
        stripped.push({ class: className, uuid, field });
      }
      delete m[field];
      changed = true;
    }
  }

  if (changed && apply) idx.put(uuid, unit);
}

console.log('\n=== T159 Back-Ref Strip Audit ===');
console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);
console.log('\nPer-class audit:');
console.log('| Class | Back-refs before | Back-refs after | Target |');
console.log('|-------|-----------------|-----------------|--------|');
for (const [cls, counts] of Object.entries(perClass)) {
  console.log(`| ${cls} | ${counts.before} | ${apply ? 0 : counts.before} | 0 |`);
}
if (Object.keys(perClass).length === 0) {
  console.log('| (none) | 0 | 0 | 0 |');
}
console.log(`\nFields stripped: ${stripped.length}`);
for (const s of stripped) console.log(`  ${s.class}:${s.uuid.slice(0, 8)} — ${s.field}`);
if (!apply) console.log('\nDry run. Use --apply to write.');
