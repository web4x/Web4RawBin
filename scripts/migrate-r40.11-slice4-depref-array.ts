// [test:uuid:pending] R40.11 SLICE-4 — GATED scratch dry-run for the corrected 3-step migration (architect
// design-r40.11-slice4-backref-decision.md, option A): (i) mint deploymentNodeIor back-ref on the node's 5
// typed units, (ii) resolver scans by that back-ref (OtmuxBridge.buildServerManagerTree, already edited),
// (iii) remove the raw deploymentRefs array. GATE: INV-T byte-diff==0 — the rendered Server-Manager tree must
// be BYTE-IDENTICAL to the pre-migration baseline (captured by scripts/r4011-slice4-baseline.ts with the OLD
// array resolver) — same 5 ref rows in the SAME order. Also: grep-lint nothing reads deploymentRefs; 0-new
// dangling. Runs on a SCRATCH copy (cp -r, NOT -a → no hardlink write-through; PO lesson). Cleanup in finally
// (R40.31). DRY-RUN only — the LIVE put HOLDS for architect backstop (PIN-5). Never mutates live.
import { ScenarioIndex } from '../src/ts/scenario/index.js';
import { OtmuxBridge } from '../src/ts/server/OtmuxBridge.js';
import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const NODE = 'fc327458-03d1-4b90-847d-ab52a7d82237';
const NODE_REF = 'ior:instance:' + NODE;
const FIVE = ['0e6884ef-5631-4b8e-a528-5cff9ff1aabf', '71bd2de9-9819-4fde-a159-f75ff748888c', '9a67e869-9bcf-4107-8530-8f3935dda8ff', 'b49a18ff-54d0-4bf6-810b-5b4aab225124', 'fb4de69d-da69-484d-866e-f1c8dce06caa'];
const LIVE = path.join(REPO, 'scenario/index');
const SCRATCH_ROOT = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/27b4d618-4c8c-495b-a72b-518b683ccd63/scratchpad/r4011-slice4';
const SCRATCH = path.join(SCRATCH_ROOT, 'index');
const BASELINE_F = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/27b4d618-4c8c-495b-a72b-518b683ccd63/scratchpad/r4011-slice4-baseline.json';

const shard = (uuid: string) => path.join(SCRATCH, uuid[0], uuid[1], uuid[2], uuid[3], uuid[4], `${uuid}.scenario.json`);
const rowUuids = (tree: any[]): string[] => {
  const out: string[] = [];
  const walk = (rows: any[]) => { for (const r of rows) { if (r.type === 'deploymentUnit') out.push(String(r.uuid).slice(0, 8)); if (r.children) walk(r.children); } };
  walk(tree); return out;
};
const danglingCount = (idx: ScenarioIndex): number => {
  const has = (u: string) => !!idx.get(u.replace('ior:instance:', '').split('@')[0]);
  let n = 0;
  for (const k of idx.list()) { const u = idx.get(k); if (!u || u.ior !== 'ior:class:UseCase') continue; const m = u.model as any;
    for (const c of [m.class, ...(Array.isArray(m.classes) ? m.classes : [])].filter(Boolean)) if (!has(String(c))) n++;
    if (m.method && !has(String(m.method))) n++; }
  return n;
};

fs.rmSync(SCRATCH_ROOT, { recursive: true, force: true });
fs.mkdirSync(SCRATCH_ROOT, { recursive: true });
cp.execFileSync('cp', ['-r', LIVE, SCRATCH]); // -r NOT -a → independent copies, no hardlink write-through
try {
  const baseline = fs.readFileSync(BASELINE_F, 'utf8');
  const danglingBefore = danglingCount(new ScenarioIndex(SCRATCH));

  // (i) mint deploymentNodeIor back-ref on EXACTLY the node's 5 typed units
  let minted = 0;
  for (const uuid of FIVE) {
    const f = shard(uuid); const u = JSON.parse(fs.readFileSync(f, 'utf8'));
    u.model.deploymentNodeIor = NODE_REF; fs.writeFileSync(f, JSON.stringify(u, null, 2)); minted++;
  }
  // (iii) remove the raw deploymentRefs array from the node unit
  const nf = shard(NODE); const nu = JSON.parse(fs.readFileSync(nf, 'utf8'));
  const refsRemoved = Array.isArray(nu.model?.deploymentRefs) ? nu.model.deploymentRefs.length : 0;
  delete nu.model.deploymentRefs; fs.writeFileSync(nf, JSON.stringify(nu, null, 2));

  // (ii) render with the NEW back-ref resolver
  const idxAfter = new ScenarioIndex(SCRATCH);
  const candidate = JSON.stringify(OtmuxBridge.buildServerManagerTree([], idxAfter, NODE));
  const danglingAfter = danglingCount(idxAfter);

  const invT = candidate === baseline ? 0 : 1;
  const baseRows = rowUuids(JSON.parse(baseline));
  const candRows = rowUuids(JSON.parse(candidate));
  // grep-lint: nothing (in shipped src, excl the migration/baseline scripts + comments) reads .deploymentRefs
  const readers = cp.execSync(`grep -rn "\\.deploymentRefs" ${path.join(REPO, 'src')} --include=*.ts | grep -v "//" | wc -l`).toString().trim();

  console.log('===== R40.11 SLICE-4 corrected dry-run (scratch, INV-T vs baseline) =====');
  console.log(`back-refs minted    : ${minted}/5  (deploymentNodeIor=${NODE_REF.slice(0, 22)}…)`);
  console.log(`array refs removed  : ${refsRemoved}`);
  console.log(`baseline rows       : [${baseRows.join(', ')}]`);
  console.log(`candidate rows      : [${candRows.join(', ')}]`);
  console.log(`row order match     : ${JSON.stringify(baseRows) === JSON.stringify(candRows) ? '✓ same 5, same order' : '✗ ORDER/SET DIFFERS'}`);
  console.log(`grep-lint readers   : ${readers} shipped src line(s) read .deploymentRefs (0 = array truly dead)`);
  console.log(`dangling before/after: ${danglingBefore} / ${danglingAfter} (delta ${danglingAfter - danglingBefore})`);
  console.log(`INV-T byte-diff     : ${invT} ${invT === 0 ? '✓ PASS (tree byte-identical to baseline)' : '✗ FAIL'}`);
  if (invT) { let i = 0; while (i < baseline.length && baseline[i] === candidate[i]) i++;
    console.log('  baseline …', baseline.slice(Math.max(0, i - 40), i + 100));
    console.log('  candidate…', candidate.slice(Math.max(0, i - 40), i + 100)); }
  const gateOk = invT === 0 && JSON.stringify(baseRows) === JSON.stringify(candRows) && Number(readers) === 0 && danglingAfter === danglingBefore && minted === 5;
  console.log(`\ngateOk = ${gateOk}`);
} finally {
  fs.rmSync(SCRATCH_ROOT, { recursive: true, force: true }); // R40.31: cleanup survives failure
}
