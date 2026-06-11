/**
 * po.chainFollowUp — PO chain scoreboard tool.
 *
 * Walks the 6-step champagne chain per Requirement and produces a dispatch table.
 * Distinguishes REAL [impl:uuid:]/[test:uuid:] markers from stubs.
 *
 * Usage:
 *   npx tsx scripts/po-chain-follow-up.ts <uuid> [<uuid> ...]
 *   npx tsx scripts/po-chain-follow-up.ts --all
 *   npx tsx scripts/po-chain-follow-up.ts --sprint S19
 *
 * [impl:uuid:bf29a301-c4d5-4e6f-9a7b-8c0d1e2f3a4b] po.chainFollowUp
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, type ScenarioUnit } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
const SRC_DIR = path.join(__dirname, '../src');
const TEST_DIR = path.join(__dirname, '../test');

const idx = new ScenarioIndex(INDEX_DIR);

function resolveIor(ior: string): string {
  return String(ior || '').replace('ior:instance:', '').replace('ior:file:', '');
}

function getModel(uuid: string): Record<string, unknown> | null {
  const u = idx.get(uuid);
  return u ? u.model as Record<string, unknown> : null;
}

function hasRealMarker(dir: string, pattern: RegExp): boolean {
  try {
    return walkFiles(dir).some(f => {
      try { return pattern.test(fs.readFileSync(f, 'utf-8')); } catch { return false; }
    });
  } catch { return false; }
}

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkFiles(full));
    else if (ent.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

interface ChainNode { type: string; uuid: string; name: string; done: boolean; realMarker?: boolean; }
interface ChainRow { req: ChainNode; ucs: ChainNode[]; classes: ChainNode[]; methods: ChainNode[]; impls: ChainNode[]; tests: ChainNode[]; }

function walkReqChain(reqUuid: string): ChainRow {
  const reqModel = getModel(reqUuid);
  const reqName = String(reqModel?.altId || reqModel?.name || reqUuid.slice(0, 8));
  const row: ChainRow = {
    req: { type: 'Requirement', uuid: reqUuid, name: reqName, done: !!reqModel },
    ucs: [], classes: [], methods: [], impls: [], tests: [],
  };
  if (!reqModel) return row;

  const ucIors = (reqModel.useCases as string[]) || (reqModel.tasks as string[]) || [];
  // Walk through useCases (direct from Requirement per 6-step chain)
  for (const ucIor of ucIors) {
    const ucUuid = resolveIor(ucIor);
    const ucModel = getModel(ucUuid);
    if (!ucModel) continue;
    const ucType = idx.get(ucUuid)?.ior.replace('ior:class:', '') || '';
    if (ucType !== 'UseCase') continue;
    row.ucs.push({ type: 'UseCase', uuid: ucUuid, name: String(ucModel.name || ''), done: true });

    for (const clsIor of ((ucModel.classes as string[]) || [])) {
      const clsUuid = resolveIor(clsIor);
      const clsModel = getModel(clsUuid);
      if (!clsModel) { row.classes.push({ type: 'Class', uuid: clsUuid, name: '?', done: false }); continue; }
      row.classes.push({ type: 'Class', uuid: clsUuid, name: String(clsModel.name || ''), done: true });

      for (const methIor of ((clsModel.methods as string[]) || [])) {
        const methUuid = resolveIor(methIor);
        const methModel = getModel(methUuid);
        if (!methModel) { row.methods.push({ type: 'Method', uuid: methUuid, name: '?', done: false }); continue; }
        row.methods.push({ type: 'Method', uuid: methUuid, name: String(methModel.name || ''), done: true });

        for (const implIor of ((methModel.implementations as string[]) || [])) {
          const implUuid = resolveIor(implIor);
          const implModel = getModel(implUuid);
          if (!implModel) { row.impls.push({ type: 'Implementation', uuid: implUuid, name: '?', done: false }); continue; }
          const realImpl = hasRealMarker(SRC_DIR, new RegExp(`\\[impl:uuid:${implUuid}\\]`, 'i'));
          row.impls.push({ type: 'Implementation', uuid: implUuid, name: String(implModel.name || ''), done: true, realMarker: realImpl });

          for (const testIor of ((implModel.tests as string[]) || [])) {
            const testUuid = resolveIor(testIor);
            const testModel = getModel(testUuid);
            if (!testModel) { row.tests.push({ type: 'Test', uuid: testUuid, name: '?', done: false }); continue; }
            const realTest = hasRealMarker(TEST_DIR, new RegExp(`\\[test:uuid:${testUuid}\\]`, 'i'));
            row.tests.push({ type: 'Test', uuid: testUuid, name: String(testModel.name || ''), done: true, realMarker: realTest });
          }
        }
      }
    }
  }

  return row;
}

function mark(nodes: ChainNode[]): string {
  if (nodes.length === 0) return '◻';
  const allDone = nodes.every(n => n.done && (n.realMarker === undefined || n.realMarker));
  return allDone ? '✓' : '◻';
}

function nextOwner(row: ChainRow): string {
  if (row.ucs.length === 0) return 'architect (UC)';
  if (row.classes.length === 0 || row.classes.some(n => !n.done)) return 'architect (Class)';
  if (row.methods.length === 0 || row.methods.some(n => !n.done)) return 'architect (Method)';
  if (row.impls.length === 0 || row.impls.some(n => !n.done || !n.realMarker)) return 'expert (impl marker)';
  if (row.tests.length === 0 || row.tests.some(n => !n.done || !n.realMarker)) return 'tester (test marker)';
  return '✓ COMPLETE';
}

// --- Main ---

const args = process.argv.slice(2);
const allMode = args.includes('--all');
const sprintIdx = args.indexOf('--sprint');
const sprintFilter = sprintIdx !== -1 ? args[sprintIdx + 1] : null;

let reqUuids: string[] = [];

if (allMode) {
  reqUuids = idx.list().filter(uuid => {
    const u = idx.get(uuid);
    return u?.ior === 'ior:class:Requirement';
  });
} else if (sprintFilter) {
  reqUuids = idx.list().filter(uuid => {
    const u = idx.get(uuid);
    if (u?.ior !== 'ior:class:Requirement') return false;
    const name = String(u.model.name || u.model.altId || '');
    return name.toUpperCase().includes(sprintFilter.toUpperCase());
  });
} else {
  reqUuids = args.filter(a => !a.startsWith('--'));
}

if (reqUuids.length === 0) {
  console.log('Usage: npx tsx scripts/po-chain-follow-up.ts <uuid> [--all] [--sprint S19]');
  process.exit(1);
}

console.log(`\n# Chain Follow-Up Scoreboard (${reqUuids.length} requirements)\n`);
console.log('| Req | UC | Class | Method | Impl(marker) | Test | Next OPEN owner |');
console.log('|-----|----|-------|--------|---------------|------|-----------------|');

const dispatch: { num: number; node: string; req: string; action: string; owner: string }[] = [];
let num = 0;

for (const uuid of reqUuids) {
  const row = walkReqChain(uuid);
  const owner = nextOwner(row);
  console.log(`| ${row.req.name} ${mark([row.req])} | ${mark(row.ucs)} | ${mark(row.classes)} | ${mark(row.methods)} | ${mark(row.impls)} | ${mark(row.tests)} | ${owner === '✓ COMPLETE' ? '✓' : `**${owner}**`} |`);

  if (row.ucs.length === 0) dispatch.push({ num: ++num, node: 'UC', req: row.req.name, action: 'Create UseCase + wire to Req', owner: 'architect' });
  if (row.classes.some(n => !n.done)) dispatch.push({ num: ++num, node: 'Class', req: row.req.name, action: 'Create Class + wire to UC', owner: 'architect' });
  if (row.methods.some(n => !n.done)) dispatch.push({ num: ++num, node: 'Method', req: row.req.name, action: 'Create Method + wire to Class', owner: 'architect' });
  for (const impl of row.impls.filter(n => !n.done || !n.realMarker)) {
    dispatch.push({ num: ++num, node: 'Impl', req: row.req.name, action: `Add [impl:uuid:${impl.uuid.slice(0,8)}] marker in source`, owner: 'expert' });
  }
  if (row.impls.length > 0 && row.impls.every(n => n.done) && (row.tests.length === 0 || row.tests.some(n => !n.done || !n.realMarker))) {
    dispatch.push({ num: ++num, node: 'Test', req: row.req.name, action: 'Add [test:uuid:] marker in test file', owner: 'tester' });
  }
}

if (dispatch.length > 0) {
  console.log('\n## Dispatch List\n');
  console.log('| # | Node | Req | Action | Owner |');
  console.log('|---|------|-----|--------|-------|');
  for (const d of dispatch) {
    console.log(`| ${d.num} | ${d.node} | ${d.req} | ${d.action} | **${d.owner}** |`);
  }
}

const complete = reqUuids.filter(uuid => nextOwner(walkReqChain(uuid)) === '✓ COMPLETE').length;
console.log(`\n## Summary: ${complete}/${reqUuids.length} chains COMPLETE`);
if (complete === reqUuids.length) console.log('🎉 ALL CHAINS CLOSED');
