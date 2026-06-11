/**
 * po.chainFollowUp — PO chain scoreboard tool.
 *
 * Walks the 6-step champagne chain per Requirement. Emits canonical table:
 * | Chain | Req | UC | Class | Method | Impl | Test |
 * check = done, open <owner> <ior-short> = gap. REAL marker = scanned from source.
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

function ior(s: string): string { return String(s || '').replace('ior:instance:', '').replace('ior:file:', ''); }
function short(uuid: string): string { return uuid.slice(0, 8); }
function model(uuid: string): Record<string, unknown> | null { const u = idx.get(uuid); return u ? u.model as Record<string, unknown> : null; }
function unitType(uuid: string): string { const u = idx.get(uuid); return u ? u.ior.replace('ior:class:', '') : ''; }

const srcFiles: string[] = [];
const testFiles: string[] = [];
function collectFiles(dir: string, out: string[]) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) collectFiles(full, out);
    else if (ent.name.endsWith('.ts')) out.push(full);
  }
}
collectFiles(SRC_DIR, srcFiles);
collectFiles(TEST_DIR, testFiles);

const srcContent = new Map<string, string>();
const testContent = new Map<string, string>();
for (const f of srcFiles) srcContent.set(f, fs.readFileSync(f, 'utf-8'));
for (const f of testFiles) testContent.set(f, fs.readFileSync(f, 'utf-8'));

function hasRealImplMarker(uuid: string): boolean {
  if (!idx.has(uuid)) return false; // Impl UNIT must exist on disk
  const re = new RegExp(`\\[impl:uuid:${uuid}\\]`, 'i');
  for (const [, content] of srcContent) { if (re.test(content)) return true; }
  return false;
}

function hasRealTestMarker(uuid: string): boolean {
  if (!idx.has(uuid)) return false; // Test UNIT must exist on disk
  const re = new RegExp(`\\[test:uuid:${uuid}\\]`, 'i');
  for (const [, content] of testContent) { if (re.test(content)) return true; }
  return false;
}

interface ChainResult {
  chainName: string;
  req: string; uc: string; cls: string; method: string; impl: string; test: string;
  complete: boolean;
  openNodes: { node: string; owner: string; action: string; iorShort: string }[];
}

function walkReq(reqUuid: string): ChainResult[] {
  const reqM = model(reqUuid);
  if (!reqM) return [{ chainName: short(reqUuid), req: 'open', uc: 'open', cls: 'open', method: 'open', impl: 'open', test: 'open', complete: false, openNodes: [] }];
  const reqName = String(reqM.altId || reqM.name || short(reqUuid));
  const ucIors = ((reqM.useCases as string[]) || []).filter(u => unitType(ior(u)) === 'UseCase');

  if (ucIors.length === 0) {
    return [{ chainName: reqName, req: 'check', uc: 'open architect', cls: 'open', method: 'open', impl: 'open', test: 'open', complete: false,
      openNodes: [{ node: 'UC', owner: 'architect', action: 'Create UC + wire to Req', iorShort: short(reqUuid) }] }];
  }

  const results: ChainResult[] = [];
  for (const ucIorStr of ucIors) {
    const ucUuid = ior(ucIorStr);
    const ucM = model(ucUuid);
    if (!ucM) continue;
    const clsIors = (ucM.classes as string[]) || [];
    if (clsIors.length === 0) {
      results.push({ chainName: `${reqName}`, req: 'check', uc: 'check', cls: 'open architect', method: 'open', impl: 'open', test: 'open', complete: false,
        openNodes: [{ node: 'Class', owner: 'architect', action: 'Wire Class to UC', iorShort: short(ucUuid) }] });
      continue;
    }

    // UC.method → specific method (preferred over Class.methods[0])
    const ucMethodIor = String((ucM as Record<string, unknown>).method || '');
    const ucMethodUuid = ucMethodIor ? ior(ucMethodIor) : '';

    for (const clsIorStr of clsIors) {
      const clsUuid = ior(clsIorStr);
      const clsM = model(clsUuid);
      if (!clsM) continue;
      // Use UC.method if set, otherwise fall back to Class.methods[]
      const methIors = ucMethodUuid ? [ucMethodIor] : ((clsM.methods as string[]) || []);
      if (methIors.length === 0) {
        results.push({ chainName: `${reqName}`, req: 'check', uc: 'check', cls: 'check', method: 'open architect', impl: 'open', test: 'open', complete: false,
          openNodes: [{ node: 'Method', owner: 'architect', action: 'Wire Method to Class', iorShort: short(clsUuid) }] });
        continue;
      }

      for (const methIorStr of methIors) {
        const methUuid = ior(methIorStr);
        const methM = model(methUuid);
        if (!methM) continue;
        const methName = String(methM.name || '').split('.').pop() || short(methUuid);
        const implIors = (methM.implementations as string[]) || [];

        if (implIors.length === 0) {
          // Check for Method→Test direct (incomplete — Impl node missing)
          const methTests = (methM.tests as string[]) || [];
          const testNote = methTests.length > 0 ? `open (Test ${methTests.map(t => short(ior(t))).join(',')} via Method — Impl missing)` : 'open';
          results.push({ chainName: `${reqName}`, req: 'check', uc: 'check', cls: 'check', method: methName, impl: `open expert ${short(methUuid)}`, test: testNote, complete: false,
            openNodes: [{ node: 'Impl', owner: 'expert', action: `Create Impl unit + add [impl:uuid:] for ${methName} + wire Method.implementations[]→Impl→tests[]`, iorShort: short(methUuid) }] });
          continue;
        }

        for (const implIorStr of implIors) {
          const implUuid = ior(implIorStr);
          const realImpl = hasRealImplMarker(implUuid);
          const implCell = realImpl ? `check ${short(implUuid)}` : `open expert ${short(implUuid)}`;
          const implM = model(implUuid);
          const testIors = implM ? ((implM.tests as string[]) || []) : [];
          const openNodes: ChainResult['openNodes'] = [];

          if (!realImpl) openNodes.push({ node: 'Impl', owner: 'expert', action: `Add real [impl:uuid:${short(implUuid)}] in source`, iorShort: short(implUuid) });

          if (testIors.length === 0) {
            results.push({ chainName: `${reqName}`, req: 'check', uc: 'check', cls: 'check', method: methName, impl: implCell, test: 'open tester', complete: false,
              openNodes: [...openNodes, { node: 'Test', owner: 'tester', action: 'Add [test:uuid:] marker', iorShort: '' }] });
            continue;
          }

          for (const testIorStr of testIors) {
            const testUuid = ior(testIorStr);
            const realTest = hasRealTestMarker(testUuid);
            const testCell = realTest ? `check ${short(testUuid)}` : `open tester ${short(testUuid)}`;
            const complete = realImpl && realTest;
            if (!realTest) openNodes.push({ node: 'Test', owner: 'tester', action: `Verify real [test:uuid:${short(testUuid)}] in test`, iorShort: short(testUuid) });
            results.push({ chainName: `${reqName}`, req: 'check', uc: 'check', cls: 'check', method: methName, impl: implCell, test: testCell, complete, openNodes });
          }
        }
      }
    }
  }

  return results.length > 0 ? results : [{ chainName: reqName, req: 'check', uc: 'open architect', cls: 'open', method: 'open', impl: 'open', test: 'open', complete: false,
    openNodes: [{ node: 'UC', owner: 'architect', action: 'Create UC', iorShort: short(reqUuid) }] }];
}

// --- Main ---
const args = process.argv.slice(2);
const allMode = args.includes('--all');
const sprintArgIdx = args.indexOf('--sprint');
const sprintFilter = sprintArgIdx !== -1 ? args[sprintArgIdx + 1] : null;

// Resolve a bare prefix (e.g. '2d4fefed') to the full UUID in the index
function resolvePrefix(prefix: string): string | null {
  if (idx.has(prefix)) return prefix;
  const all = idx.list();
  const match = all.find(u => u.startsWith(prefix));
  return match || null;
}

let reqUuids: string[] = [];
if (allMode) {
  reqUuids = idx.list().filter(u => unitType(u) === 'Requirement');
} else if (sprintFilter) {
  // S19 → match R19. in altId/name; S17 → match R17. etc.
  const num = sprintFilter.replace(/^S/i, '');
  reqUuids = idx.list().filter(u => {
    if (unitType(u) !== 'Requirement') return false;
    const m = model(u);
    const text = String(m?.name || '') + ' ' + String(m?.altId || '');
    return text.includes(`R${num}.`) || text.toUpperCase().includes(sprintFilter.toUpperCase());
  });
} else {
  reqUuids = args.filter(a => !a.startsWith('--')).map(a => resolvePrefix(a) || a);
}

if (reqUuids.length === 0) { console.log('Usage: npx tsx scripts/po-chain-follow-up.ts <uuid> [--all] [--sprint S19]'); process.exit(1); }

// Sort requirements deterministically by altId/name
reqUuids.sort((a, b) => {
  const ma = model(a), mb = model(b);
  const na = String(ma?.altId || ma?.name || a), nb = String(mb?.altId || mb?.name || b);
  return na.localeCompare(nb, undefined, { numeric: true });
});

// Check for orphanByDesign flag (boolean true or string truthy)
function isOrphanByDesign(reqUuid: string): boolean {
  const m = model(reqUuid);
  if (!m) return false;
  if (m.orphanByDesign === true || m.orphanByDesign === 'true') return true;
  const tags = String(m.tags || '');
  return tags.includes('orphanByDesign') || tags.includes('orphan-by-design');
}

// Canonical denominator: one row per requirement (not per method).
// Each req gets ONE summary row showing the FIRST break point.
// Excluded: orphanByDesign requirements.
const included = reqUuids.filter(u => !isOrphanByDesign(u));
const excluded = reqUuids.length - included.length;

console.log(`\n# Chain Follow-Up Scoreboard (${included.length} requirements, excluded: ${excluded} orphanByDesign)\n`);
console.log('| Chain | Req | UC | Class | Method | Impl | Test |');
console.log('|-------|-----|-----|-------|--------|------|------|');

const allDispatch: { num: number; node: string; chain: string; action: string; owner: string }[] = [];
let dispNum = 0;
let completeCount = 0;

for (const uuid of included) {
  const rows = walkReq(uuid);
  // Dedup by reqName+method deterministically
  const seen = new Set<string>();
  const dedupRows: typeof rows = [];
  for (const r of rows) {
    const key = `${r.method}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedupRows.push(r);
  }
  // One summary row per req: show the FIRST incomplete chain or the best complete one
  const complete = dedupRows.filter(r => r.complete);
  const incomplete = dedupRows.filter(r => !r.complete);

  if (complete.length > 0 && incomplete.length === 0) {
    // All chains for this req are complete — show one representative
    const r = complete[0];
    console.log(`| ${r.chainName} | ${r.req} | ${r.uc} | ${r.cls} | ${r.method} | ${r.impl} | ${r.test} |`);
    completeCount++;
  } else if (dedupRows.length === 0) {
    const reqM = model(uuid);
    const reqName = String(reqM?.altId || reqM?.name || short(uuid));
    console.log(`| ${reqName} | check | open architect | open | open | open | open |`);
    allDispatch.push({ num: ++dispNum, node: 'UC', chain: reqName, action: 'Create UC + wire chain', owner: 'architect' });
  } else {
    // Show first incomplete row as the representative
    const r = incomplete[0] || dedupRows[0];
    console.log(`| ${r.chainName} | ${r.req} | ${r.uc} | ${r.cls} | ${r.method} | ${r.impl} | ${r.test} |`);
    for (const o of r.openNodes) {
      allDispatch.push({ num: ++dispNum, node: o.node, chain: r.chainName, action: o.action, owner: o.owner });
    }
  }
}

if (allDispatch.length > 0) {
  console.log('\n## Dispatch List\n');
  console.log('| # | Node | Chain | Action | Owner |');
  console.log('|---|------|-------|--------|-------|');
  for (const d of allDispatch) console.log(`| ${d.num} | ${d.node} | ${d.chain} | ${d.action} | **${d.owner}** |`);
}

console.log(`\n## Summary: ${completeCount}/${included.length} COMPLETE (excluded: ${excluded} orphanByDesign)`)
if (completeCount === included.length && included.length > 0) console.log('ALL CHAINS CLOSED');
