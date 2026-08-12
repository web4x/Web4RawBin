// [test:uuid:pending] R40.11 SLICE-4 — GATED dry-run+count migration: remove the raw `deploymentRefs`
// string-array from the WODA.prod node unit (fc327458). GATE: INV-T byte-diff==0 — the rendered
// Server-Manager tree JSON (OtmuxBridge.buildServerManagerTree, the SAME fn the server route + gate call)
// must be BYTE-IDENTICAL before/after the array removal (the real slice-1 typed units must reproduce the
// same ref rows). Runs on a SCRATCH copy (cp -r, NOT -a → no hardlink write-through to live; PO lesson).
// sessions held constant ([]) so the diff isolates the ref-row effect (INV-T scoped to the parts that
// must not move). Cleanup in finally (survives failure — R40.31). DRY-RUN default; never mutates live.
import { ScenarioIndex } from '../src/ts/scenario/index.js';
import { OtmuxBridge } from '../src/ts/server/OtmuxBridge.js';
import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const NODE = 'fc327458-03d1-4b90-847d-ab52a7d82237';
const LIVE = path.join(REPO, 'scenario/index');
const SCRATCH_ROOT = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/27b4d618-4c8c-495b-a72b-518b683ccd63/scratchpad/r4011-slice4';
const SCRATCH = path.join(SCRATCH_ROOT, 'index');
const APPLY = process.argv.includes('--apply'); // put-based → PIN-5: HOLD for architect confirm; dry-run never applies

const countRefRows = (tree: any[]): number => {
  let n = 0;
  const walk = (rows: any[]) => { for (const r of rows) { if (r.type === 'deploymentUnit') n++; if (r.type === 'notice' && /unresolved/.test(r.name)) n = -1000; if (r.children) walk(r.children); } };
  walk(tree); return n;
};

fs.rmSync(SCRATCH_ROOT, { recursive: true, force: true });
fs.mkdirSync(SCRATCH_ROOT, { recursive: true });
cp.execFileSync('cp', ['-r', LIVE, SCRATCH]); // -r NOT -a → independent copies, no hardlink write-through
try {
  const sessions: any[] = []; // deterministic: hold sessions constant so the diff isolates the array-removal effect
  const idxA = new ScenarioIndex(SCRATCH);
  const nodeName = String((idxA.get(NODE)?.model as any)?.name || '');
  const before = JSON.stringify(OtmuxBridge.buildServerManagerTree(sessions, idxA, NODE));
  const beforeRows = countRefRows(JSON.parse(before));

  // remove the raw deploymentRefs array from the scratch node unit
  const f = path.join(SCRATCH, 'f/c/3/2/7', `${NODE}.scenario.json`);
  const u = JSON.parse(fs.readFileSync(f, 'utf8'));
  const refsRemoved = Array.isArray(u.model?.deploymentRefs) ? u.model.deploymentRefs.length : 0;
  delete u.model.deploymentRefs;
  fs.writeFileSync(f, JSON.stringify(u, null, 2));

  const idxB = new ScenarioIndex(SCRATCH); // fresh instance (bypass any ctor caching)
  const after = JSON.stringify(OtmuxBridge.buildServerManagerTree(sessions, idxB, NODE));
  const afterRows = countRefRows(JSON.parse(after));
  const byteDiff = before === after ? 0 : 1;

  const syntheticSrc = cp.execSync(`grep -rn "'depref:'" ${path.join(REPO, 'src')} --include=*.ts | grep -v "//" | wc -l`).toString().trim();

  console.log('===== R40.11 SLICE-4 dry-run (scratch, INV-T) =====');
  console.log(`node               : ${NODE.slice(0, 8)} name="${nodeName}"`);
  console.log(`refs removed        : ${refsRemoved} (raw deploymentRefs entries)`);
  console.log(`ref rows BEFORE     : ${beforeRows} deploymentUnit rows`);
  console.log(`ref rows AFTER      : ${afterRows} deploymentUnit rows`);
  console.log(`synthetic emitter   : ${syntheticSrc} live 'depref:' construction sites (0 = clean; comments excluded)`);
  console.log(`INV-T byte-diff     : ${byteDiff} ${byteDiff === 0 ? '✓ PASS (tree byte-identical)' : '✗ FAIL (tree MOVED — array is NOT dead)'}`);
  if (byteDiff) {
    console.log('\n--- WHY (first divergence) ---');
    let i = 0; while (i < before.length && before[i] === after[i]) i++;
    console.log('BEFORE …', before.slice(Math.max(0, i - 40), i + 120));
    console.log('AFTER  …', after.slice(Math.max(0, i - 40), i + 120));
  }
  console.log(`\ngateOk = ${byteDiff === 0 && afterRows === beforeRows && Number(syntheticSrc) === 0}`);
  if (APPLY) console.log('\n!! --apply requested but this script is DRY-RUN ONLY (PIN-5: put-based mutation HOLDS for architect confirm). No live write performed.');
} finally {
  fs.rmSync(SCRATCH_ROOT, { recursive: true, force: true }); // R40.31: cleanup survives failure
}
