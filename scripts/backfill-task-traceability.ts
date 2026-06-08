// T199 Task traceability backfill — 3 idempotent passes
// Pass A: coveredRequirements from Requirement.tasks[] reverse
// Pass B: useCases from UC.ownerIor reverse
// Pass C: unitLinks cleanup — symlink paths only, move IOR refs out
// Usage: npx tsx scripts/backfill-task-traceability.ts [--apply]
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

// Load all units
const allUuids = idx.list();
const units = new Map<string, ScenarioUnit>();
for (const uuid of allUuids) { const u = idx.get(uuid); if (u) units.set(uuid, u); }
console.log(`Loaded ${units.size} units`);

// === PASS A: coveredRequirements ===
// Reverse-lookup: for each Requirement, find its tasks[] → add req to each Task.coveredRequirements
const taskReqs = new Map<string, Set<string>>(); // taskUuid → set of reqUuids
for (const [reqUuid, unit] of units) {
  if (getType(unit) !== 'Requirement') continue;
  const tasks = iorArr(unit.model as M, 'tasks');
  for (const taskUuid of tasks) {
    if (!taskReqs.has(taskUuid)) taskReqs.set(taskUuid, new Set());
    taskReqs.get(taskUuid)!.add(reqUuid);
  }
}

let passA = 0;
for (const [taskUuid, unit] of units) {
  if (getType(unit) !== 'Task') continue;
  const m = unit.model as M;
  const existing = iorArr(m, 'coveredRequirements');
  const fromReverse = taskReqs.get(taskUuid) || new Set<string>();
  const merged = new Set([...existing, ...fromReverse]);
  if (merged.size > existing.length) {
    m.coveredRequirements = [...merged].map(r => `ior:instance:${r}`);
    passA++;
  }
}
console.log(`Pass A coveredRequirements: ${passA} tasks updated`);

// === PASS B: useCases ===
// Reverse-lookup: find UCs whose ownerIor points to each Task
const taskUCs = new Map<string, Set<string>>(); // taskUuid → set of ucUuids
for (const [ucUuid, unit] of units) {
  if (getType(unit) !== 'UseCase') continue;
  const owner = String(unit.ownerIor || '').replace('ior:instance:', '');
  if (owner && /^[0-9a-f]{8}-/.test(owner)) {
    if (!taskUCs.has(owner)) taskUCs.set(owner, new Set());
    taskUCs.get(owner)!.add(ucUuid);
  }
}

let passB = 0;
for (const [taskUuid, unit] of units) {
  if (getType(unit) !== 'Task') continue;
  const m = unit.model as M;
  const existing = iorArr(m, 'useCases');
  const fromReverse = taskUCs.get(taskUuid) || new Set<string>();
  const merged = new Set([...existing, ...fromReverse]);
  if (merged.size > existing.length) {
    m.useCases = [...merged].map(u => `ior:instance:${u}`);
    passB++;
  }
}
console.log(`Pass B useCases: ${passB} tasks updated`);

// === PASS C: unitLinks cleanup ===
// Keep only symlink paths (sprints.json/...), remove ior:instance: refs
let passC = 0;
for (const [, unit] of units) {
  const m = unit.model as M;
  const links = m.unitLinks;
  if (!Array.isArray(links)) continue;
  const symlinkPaths = (links as string[]).filter(l => !String(l).startsWith('ior:'));
  const iorRefs = (links as string[]).filter(l => String(l).startsWith('ior:'));
  if (iorRefs.length > 0) {
    m.unitLinks = symlinkPaths;
    passC++;
  }
}
console.log(`Pass C unitLinks cleanup: ${passC} units cleaned (IOR refs removed)`);

// Write all
if (apply) {
  let written = 0;
  for (const [uuid, unit] of units) {
    const dir = path.join(idx['basePath'], idx.prefixPath(uuid));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${uuid}.scenario.json`), JSON.stringify(unit, null, 2));
    written++;
  }
  console.log(`\nWrote ${written} units`);
} else {
  console.log('\nDry run. Use --apply to write.');
}

// Verify
let crEmpty = 0; let ucEmpty = 0; let ulIor = 0;
for (const [, unit] of units) {
  if (getType(unit) !== 'Task') continue;
  const m = unit.model as M;
  if (!m.coveredRequirements || (m.coveredRequirements as string[]).length === 0) crEmpty++;
  if (!m.useCases || (m.useCases as string[]).length === 0) ucEmpty++;
  const ul = m.unitLinks;
  if (Array.isArray(ul) && (ul as string[]).some(l => String(l).startsWith('ior:'))) ulIor++;
}
console.log(`\nVerify: Tasks with empty coveredRequirements=${crEmpty}, empty useCases=${ucEmpty}, unitLinks with IOR refs=${ulIor}`);
