// T199: Two-pass scenario integrity backfill — ownerIor + unitLinks[]
// Pass 1: derive ownerIor from parent's forward array reverse-lookup
// Pass 2: populate unitLinks[] from forward/nav IOR refs
// Usage: npx tsx scripts/backfill-owner-and-links.ts [--apply]
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
function iorSingle(m: M, key: string): string {
  const v = m[key];
  if (!v || typeof v !== 'string') return '';
  return String(v).replace('ior:instance:', '');
}

// Load all units
const allUuids = idx.list();
const units = new Map<string, ScenarioUnit>();
for (const uuid of allUuids) { const u = idx.get(uuid); if (u) units.set(uuid, u); }
console.log(`Loaded ${units.size} units`);

// === PASS 1: ownerIor ===
// Build reverse maps: child → parent uuid
const sprintTaskMap = new Map<string, string>(); // taskUuid → sprintUuid
const implMethodMap = new Map<string, string>(); // implUuid → methodUuid
const testImplMap = new Map<string, string>();   // testUuid → implUuid
const classUcMap = new Map<string, string>();     // classUuid → ucUuid
const reqSprintMap = new Map<string, string>();   // reqUuid → sprintUuid
const taskReqMap = new Map<string, string>();     // taskUuid → reqUuid (from Req.tasks[])
const methodClassMap = new Map<string, string>(); // methodUuid → classUuid
const ucTaskMap = new Map<string, string>();       // ucUuid → taskUuid

for (const [uuid, unit] of units) {
  const type = getType(unit);
  const m = unit.model as M;
  if (type === 'Sprint') {
    for (const t of iorArr(m, 'tasks')) sprintTaskMap.set(t, uuid);
    for (const r of iorArr(m, 'requirements')) reqSprintMap.set(r, uuid);
  }
  if (type === 'Requirement') {
    for (const t of iorArr(m, 'tasks')) { if (!taskReqMap.has(t)) taskReqMap.set(t, uuid); }
  }
  // R18.8: Task.coveredRequirements[] → reverse map req→task (for Requirement.ownerIor)
  if (type === 'Task') {
    for (const r of iorArr(m, 'coveredRequirements')) { if (!reqSprintMap.has(r)) reqSprintMap.set(r, uuid); }
  }
  if (type === 'Task') {
    for (const uc of iorArr(m, 'useCases')) { if (!ucTaskMap.has(uc)) ucTaskMap.set(uc, uuid); }
  }
  if (type === 'UseCase') {
    for (const c of iorArr(m, 'classes')) { if (!classUcMap.has(c)) classUcMap.set(c, uuid); }
    const cls = iorSingle(m, 'class');
    if (cls) classUcMap.set(cls, uuid);
  }
  if (type === 'Class') {
    for (const mt of iorArr(m, 'methods')) { if (!methodClassMap.has(mt)) methodClassMap.set(mt, uuid); }
  }
  if (type === 'Method') {
    for (const im of iorArr(m, 'implementations')) implMethodMap.set(im, uuid);
    const impl = iorSingle(m, 'implementation');
    if (impl) implMethodMap.set(impl, uuid);
  }
  if (type === 'Implementation') {
    for (const t of iorArr(m, 'tests')) testImplMap.set(t, uuid);
  }
}

let ownerFilled = 0;
let ownerAlready = 0;
let parentFilled = 0;
for (const [uuid, unit] of units) {
  const type = getType(unit);
  const m = unit.model as M;

  // Derive owner from reverse lookup
  let owner: string | null = null;
  switch (type) {
    case 'Sprint': owner = null; break;
    case 'TraceLink': owner = null; break;
    case 'Skill': owner = null; break;
    case 'Requirement': owner = reqSprintMap.get(uuid) || null; break;
    case 'Task': owner = sprintTaskMap.get(uuid) || null; break;
    case 'UseCase': owner = ucTaskMap.get(uuid) || null; break;
    case 'Class': owner = classUcMap.get(uuid) || null; break;
    case 'Method': owner = methodClassMap.get(uuid) || null; break;
    case 'Implementation': owner = implMethodMap.get(uuid) || null; break;
    case 'Test': owner = testImplMap.get(uuid) || null; break;
  }

  // Use existing ownerIor if already set, otherwise use derived
  const existingOwner = unit.ownerIor ? String(unit.ownerIor).replace('ior:instance:', '') : '';
  const finalOwner = existingOwner || owner;
  const ownerIorVal = finalOwner ? `ior:instance:${finalOwner}` : null;

  if (!unit.ownerIor && (finalOwner || ['Sprint', 'TraceLink', 'Skill'].includes(type))) {
    unit.ownerIor = ownerIorVal;
    ownerFilled++;
  } else {
    ownerAlready++;
  }

  // model.parent: all non-Sprint units get parent IOR (Tron directive)
  if (type === 'Sprint') {
    m.parent = null;
  } else {
    const parentIor = unit.ownerIor || ownerIorVal;
    m.parent = parentIor || null;
  }
  parentFilled++;
}
console.log(`Pass 1 ownerIor: ${ownerFilled} filled, ${ownerAlready} already set, model.parent: ${parentFilled} set`);

// === PASS 2: unitLinks[] ===
// Collect forward/nav IOR refs per type
const LINK_FIELDS: Record<string, string[]> = {
  Sprint: ['tasks', 'requirements'],
  Task: ['useCases', 'coveredRequirements', 'children', 'subtasks'],
  Requirement: ['tasks'],
  UseCase: ['classes', 'class', 'method'],
  Class: ['methods'],
  Method: ['implementations', 'implementation'],
  Implementation: ['tests'],
  Test: [],
  TraceLink: ['source', 'target'],
  Skill: [],
};

let linksFilled = 0;
let linksAlready = 0;
for (const [uuid, unit] of units) {
  const m = unit.model as M;
  const existing = m.unitLinks;
  if (Array.isArray(existing) && existing.length >= 0) { linksAlready++; }

  const type = getType(unit);
  const fields = LINK_FIELDS[type] || [];
  const refs: string[] = [];
  for (const key of fields) {
    const v = m[key];
    if (Array.isArray(v)) {
      for (const r of v) {
        const clean = String(r).replace('ior:instance:', '');
        if (/^[0-9a-f]{8}-/.test(clean)) refs.push(clean);
      }
    } else if (typeof v === 'string') {
      const clean = v.replace('ior:instance:', '');
      if (/^[0-9a-f]{8}-/.test(clean)) refs.push(clean);
    }
  }

  // unitLinks = existing symlink paths (from backfill-unit-links) + forward IOR refs
  const existingLinks: string[] = Array.isArray(existing) ? (existing as string[]) : [];
  // Add forward refs as ior:instance: links (deduped with existing symlink paths)
  const refLinks = refs.map(r => `ior:instance:${r}`);
  const merged = [...existingLinks];
  for (const rl of refLinks) { if (!merged.includes(rl)) merged.push(rl); }
  m.unitLinks = merged;
  if (!Array.isArray(existing) || merged.length > existingLinks.length) linksFilled++;
}
console.log(`Pass 2 unitLinks[]: ${linksFilled} initialized, ${linksAlready} already had field`);

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
let missingOwner = 0;
let missingLinks = 0;
let missingParent = 0;
for (const [, unit] of units) {
  if (unit.ownerIor === undefined) missingOwner++;
  if (!Array.isArray((unit.model as M).unitLinks)) missingLinks++;
  const t = getType(unit);
  if (t !== 'Sprint' && !(unit.model as M).parent) missingParent++;
}
console.log(`\nVerify: ${missingOwner} missing ownerIor, ${missingLinks} missing unitLinks[], ${missingParent} non-Sprint missing model.parent`);
