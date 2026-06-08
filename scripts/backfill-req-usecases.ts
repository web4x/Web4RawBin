// LAYER 4: Populate Req.useCases[] — for each Req R, find Tasks T where
// R.uuid in T.coveredRequirements[], collect all T.useCases[] → R.useCases[]
// Usage: npx tsx scripts/backfill-req-usecases.ts [--apply]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, type ScenarioUnit } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
const apply = process.argv.includes('--apply');
const idx = new ScenarioIndex(INDEX_DIR);

type M = Record<string, unknown>;
function getType(u: ScenarioUnit): string { return u.ior.replace('ior:class:', ''); }
function iorArr(m: M, key: string): string[] {
  const v = m[key];
  if (!Array.isArray(v)) return [];
  return v.map(x => String(x).replace('ior:instance:', '')).filter(x => /^[0-9a-f]{8}-/.test(x));
}

const allUuids = idx.list();
const units = new Map<string, ScenarioUnit>();
for (const uuid of allUuids) { const u = idx.get(uuid); if (u) units.set(uuid, u); }
console.log(`Loaded ${units.size} units`);

// Build: reqUuid → set of UC UUIDs (via covering Tasks)
const reqUCs = new Map<string, Set<string>>();
for (const [, unit] of units) {
  if (getType(unit) !== 'Task') continue;
  const m = unit.model as M;
  const coveredReqs = iorArr(m, 'coveredRequirements');
  const taskUCs = iorArr(m, 'useCases');
  for (const reqUuid of coveredReqs) {
    if (!reqUCs.has(reqUuid)) reqUCs.set(reqUuid, new Set());
    for (const uc of taskUCs) reqUCs.get(reqUuid)!.add(uc);
  }
}

let filled = 0;
let alreadyHas = 0;
let noUCs = 0;
for (const [uuid, unit] of units) {
  if (getType(unit) !== 'Requirement') continue;
  const m = unit.model as M;
  const existing = iorArr(m, 'useCases');
  const derived = reqUCs.get(uuid) || new Set<string>();
  const merged = new Set([...existing, ...derived]);

  if (merged.size === 0) { noUCs++; continue; }
  if (merged.size === existing.length && [...merged].every(u => existing.includes(u))) {
    alreadyHas++;
    continue;
  }

  m.useCases = [...merged].map(u => `ior:instance:${u}`);
  filled++;

  if (apply) {
    const dir = path.join(idx['basePath'], idx.prefixPath(uuid));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${uuid}.scenario.json`), JSON.stringify(unit, null, 2));
  }
}

const totalReqs = [...units.values()].filter(u => getType(u) === 'Requirement').length;
const withUCs = filled + alreadyHas;
console.log(`\nRequirements: ${totalReqs} total`);
console.log(`  ${filled} ${apply ? 'populated' : 'would populate'} with useCases[]`);
console.log(`  ${alreadyHas} already had useCases[]`);
console.log(`  ${noUCs} have no covering Task with UCs (gap remains)`);
console.log(`  ${withUCs}/${totalReqs} have useCases[] after`);
if (!apply) console.log('\nDry run. Use --apply to write.');
