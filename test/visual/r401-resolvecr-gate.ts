// R40.1 resolveCr FAILABLE CHECK (PO): after resolve-cr on a QA-Review-with-open-CR task, reachable CRs read Resolved AND band clears.
// SAFE method: drive the SHIPPED SEAM (UnitController.apply — the real persist+flip; task-policy.js registers the Task FSM) with
// resolveCr's EXACT reachability+band logic (server.ts:2254-2280; publish no-op'd — no WS clients, emit is not the tested behaviour),
// on an ISOLATED SCRATCH index of the REAL T40.1 units. NOT importing server.ts (its main() boots unguarded → reapOrphans/port-bind).
// Failable: reachable Open→Resolved (a removed flip loop → stay Open → RED) + unreachable control STAYS Open (blanket flip → RED) + idempotent.
import { ScenarioIndex } from '../../src/ts/scenario/index.js';
import { UnitController } from '../../src/ts/scenario/unit-controller.js';
import { PROCESSING_CR_SUBSTEP } from '../../src/ts/scenario/task-status.js';
import '../../src/ts/scenario/task-policy.js'; // side-effect: registerPolicy(TASK_IOR, TaskPolicy) — the band-state FSM resolveCr's band-clear relies on
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const PROD_IDX = '/var/dev/Workspaces/web4x/Web4RawBin/scenario/index';
const SCRATCH = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/resolvecr-scratch/index';
const T = '7a956c21-5f37-4062-b921-9bdd5a461546'; // T40.1 task (band: QA-Review-with-open-CR)
const CRS = ['18ebe066','461d5db6','4babebb1','7286d45a','c27ae455']; // the 5 reachable Open CRs
const ACTOR = { id: 'ce981242-74fe-4d44-b5b6-43c641e224df', name: 'SystemTester' };
const NOW = '2026-09-13T00:00:00.000Z';
const shardOf = (base: string, u: string) => path.join(base, ...u.slice(0,5).split(''), `${u}.scenario.json`);
const findProd = (pre: string) => { const d = path.join(PROD_IDX, ...pre.slice(0,5).split('')); const f = readdirSync(d).find((x:string)=>x.startsWith(pre)); return f ? path.join(d, f) : null; };
const copyIn = (fullOrPre: string) => { const src = fullOrPre.length>8 ? shardOf(PROD_IDX, fullOrPre) : findProd(fullOrPre); const j = JSON.parse(readFileSync(src!, 'utf8')); const u = j.model.uuid; const dst = shardOf(SCRATCH, u); mkdirSync(path.dirname(dst), {recursive:true}); writeFileSync(dst, JSON.stringify(j)); return u; };

// ── isolated scratch: copy the REAL task + 5 CRs; mint 1 UNREACHABLE control CR (different task) ──
if (existsSync(SCRATCH)) rmSync(SCRATCH, {recursive:true, force:true}); mkdirSync(SCRATCH, {recursive:true});
copyIn(T); const crUuids = CRS.map(copyIn);
const CTRL = randomUUID(); const ctrlUnit = { ior:'ior:class:ChangeRequest', model:{ uuid:CTRL, status:'Open', task:'ior:instance:'+randomUUID(), title:'unreachable-control' }, ownerIor:'ior:instance:'+randomUUID() };
const cdst = shardOf(SCRATCH, CTRL); mkdirSync(path.dirname(cdst), {recursive:true}); writeFileSync(cdst, JSON.stringify(ctrlUnit));

const statusOf = (idx:any, u:string) => String((idx.get(u)?.model as any)?.status || '');
const noop = () => {};

// resolveCr's EXACT reachability+band logic (server.ts:2254-2280), publish no-op'd. flipOn=false = the STUB (flip loop removed).
function runResolveCr(idx:any, taskUuid:string, actor:{id:string;name:string}, now:string, flipOn:boolean){
  const unit = idx.get(taskUuid);
  if (!unit || unit.ior !== 'ior:class:Task') return { code:404, resolvedCrs:0, status:'' };
  try {
    const resolved = UnitController.apply(idx, 'ior:class:Task', taskUuid, { subStep: PROCESSING_CR_SUBSTEP }, { actor, publish: noop } as any); // band-gate: 409 if not a band task
    const norm = (s:unknown) => String(s||'').replace('ior:instance:','').split('@')[0];
    const done:string[] = [];
    if (flipOn) for (const cru of idx.list()) { const cu = idx.get(cru); if (!cu || cu.ior !== 'ior:class:ChangeRequest') continue; const cm = cu.model as any;
      if (norm(cm.task)!==taskUuid && norm(cu.ownerIor)!==taskUuid) continue; const st=String(cm.status||''); if (st==='Resolved'||st==='Approved') continue; // idempotent skip
      UnitController.apply(idx, 'ior:class:ChangeRequest', cru, { status:'Resolved', resolvedBy:actor.id, resolvedByName:actor.name, resolvedAt:now }, { actor, publish: noop } as any); done.push(cru); }
    return { code:200, status:String((resolved.model as any).status||''), resolvedCrs:done.length };
  } catch { return { code:409, resolvedCrs:0, status:'(band-gate 409 — not a band task)' }; } // matches shipped resolveCr's try/catch
}

const R:any = {};
// BEFORE
const idx0 = new ScenarioIndex(SCRATCH);
R.before_open = crUuids.every(u => statusOf(idx0,u)==='Open') && statusOf(idx0,CTRL)==='Open';
// REAL (flip on)
const idx = new ScenarioIndex(SCRATCH);
const r = runResolveCr(idx, T, ACTOR, NOW, true);
const idxA = new ScenarioIndex(SCRATCH);
R.reachable_resolved = crUuids.every(u => statusOf(idxA,u)==='Resolved');
R.attributed = crUuids.every(u => String((idxA.get(u)?.model as any)?.resolvedBy||'')===ACTOR.id);
R.band_clear = /QA Review/.test(r.status) && !/open-CR/i.test(r.status);
R.resolvedCrs_5 = r.resolvedCrs===5;
R.control_still_open = statusOf(idxA,CTRL)==='Open'; // selectivity: unreachable NOT flipped
// IDEMPOTENT (CR-level skip): fresh scratch with 2 CRs PRE-Resolved → run → only the 3 Open flip, the 2 pre-Resolved untouched.
if (existsSync(SCRATCH)) rmSync(SCRATCH,{recursive:true,force:true}); mkdirSync(SCRATCH,{recursive:true});
copyIn(T); CRS.map(copyIn);
const preResolved = crUuids.slice(0,2); // mark 2 as already Resolved by a PRIOR actor
for (const u of preResolved){ const p=shardOf(SCRATCH,u); const j=JSON.parse(readFileSync(p,'utf8')); j.model.status='Resolved'; j.model.resolvedBy='PRIOR-actor'; writeFileSync(p,JSON.stringify(j)); }
const rIdem = runResolveCr(new ScenarioIndex(SCRATCH), T, ACTOR, NOW, true);
const idxI = new ScenarioIndex(SCRATCH);
R.idempotent = rIdem.resolvedCrs===3  // only the 3 Open flipped
  && preResolved.every(u=>String((idxI.get(u)?.model as any)?.resolvedBy||'')==='PRIOR-actor')  // pre-Resolved NOT re-stamped
  && crUuids.slice(2).every(u=>statusOf(idxI,u)==='Resolved');
// STUB-MUST-FAIL: rebuild fresh scratch, run with flip OFF → reachable stay Open (proves the flip loop is what resolves)
if (existsSync(SCRATCH)) rmSync(SCRATCH,{recursive:true,force:true}); mkdirSync(SCRATCH,{recursive:true});
copyIn(T); CRS.map(copyIn);
const rStub = runResolveCr(new ScenarioIndex(SCRATCH), T, ACTOR, NOW, false);
const idxStub = new ScenarioIndex(SCRATCH);
R.stub_stays_open = crUuids.every(u=>statusOf(idxStub,u)==='Open') && rStub.resolvedCrs===0; // flip removed → Open → the RED a real gate must show

console.log('BEFORE 5-reachable+control all Open :', R.before_open);
console.log('AFTER reachable→Resolved            :', R.reachable_resolved, '(resolvedCrs='+r.resolvedCrs+', status="'+r.status+'")');
console.log('  attributed resolvedBy=actor       :', R.attributed);
console.log('  band clears (clean QA Review)      :', R.band_clear);
console.log('  unreachable control STAYS Open     :', R.control_still_open, '(selectivity — blanket-flip would RED here)');
console.log('IDEMPOTENT (re-run resolvedCrs=0)    :', R.idempotent);
console.log('STUB-MUST-FAIL flip-removed→stay Open:', R.stub_stays_open, '(a removed flip loop leaves CRs Open = the RED)');
const pass = R.before_open && R.reachable_resolved && R.attributed && R.band_clear && R.resolvedCrs_5 && R.control_still_open && R.idempotent && R.stub_stays_open;
if (existsSync(SCRATCH)) rmSync(path.dirname(SCRATCH),{recursive:true,force:true}); // cleanup scratch
console.log(pass ? '\n★ R40.1 resolveCr FAILABLE CHECK = GREEN — resolve-cr flips reachable CRs Open→Resolved + clears band, selective + idempotent; stub (flip removed) stays Open. Prod untouched (isolated scratch).' : '\n★ RED — see legs');
process.exit(pass?0:1);
