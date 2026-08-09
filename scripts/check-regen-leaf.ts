/**
 * T36.3 (d1) leaf-gate — the local generate-project trigger scripts/regen-model.ts MUST stay a LEAF: nothing may
 * import it. If a request-serving module ever imported it, that code path could reach the network WITHOUT the owner-gate
 * (the whole point of keeping the trigger local + the HTTP route strict). This FAILS the build the moment any file under
 * src/ or scripts/ imports regen-model — so the leaf property cannot silently drift. Enforce, don't assume.
 * Run: /opt/node22/bin/node --import tsx scripts/check-regen-leaf.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = path.join(ROOT, 'scripts/regen-model.ts');
const IMPORTS_REGEN = /(from\s+['"][^'"]*regen-model(\.js)?['"]|import\s*\(\s*['"][^'"]*regen-model)/;
const CODE = /\.(ts|mjs|js)$/;
const importers: string[] = [];
const walk = (d: string): void => {
  let ents: fs.Dirent[]; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (CODE.test(e.name) && p !== SELF && IMPORTS_REGEN.test(fs.readFileSync(p, 'utf-8'))) importers.push(path.relative(ROOT, p));
  }
};
for (const d of ['src', 'scripts']) walk(path.join(ROOT, d));

if (importers.length) {
  console.error(`\n✗ check-regen-leaf FAIL — scripts/regen-model.ts is a LOCAL non-HTTP trigger and must be a LEAF, but it is imported by:`);
  for (const f of importers) console.error(`  - ${f}  (an importer could reach the un-gated generate-project path through the network — forbidden)`);
  process.exit(1);
}
console.log('✓ check-regen-leaf — regen-model.ts is a leaf (no importers); the local trigger cannot drift into a served route.');
