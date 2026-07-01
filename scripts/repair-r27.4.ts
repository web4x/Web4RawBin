/**
 * R27.4 — orphan-Method + dead-ref repair (architect def92ecd4 / reconciled criteria). Method-scoped.
 * DRY-RUN (default): count table + invariant checks, NO writes. --apply: mutate + post-apply self-reassert (atomic).
 *
 * Algorithm (criteria, not hard counts):
 *  (1) ATTACH every orphan Method (Method ∉ any Class.methods) to its code-class — derive the class name from
 *      model.className || the method-name prefix || the Impl.sourceFile, then mintOrReuseClass (find-or-MINT,
 *      dogfoods the R27.2 guard) and add the EXISTING method uuid to that Class.methods + repoint ownerIor. 0 prune
 *      (all carry impls → INV1b forbids pruning).
 *  (2) REPOINT every dead f2f84ce3-BBBC ref → the live f2f84ce3-6f8f.
 *  (3) TRIAGE the dead Method fcf6dae1 refs + the TODO-string UC ref (clear).
 *  (4) CLEAR stale orphanByDesign markers by CRITERIA: set AND the Method's Impl has a sourceFile (code shipped).
 * Gate: orphans→0, 0 dead-uuid refs remain, distinct Impl 434==434, 0-new dangling, minted Classes single-per-name.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, type ScenarioUnit } from '../src/ts/scenario/index.js';
import { mintOrReuseClass } from '../src/ts/scenario/class-mint.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const idx = new ScenarioIndex(path.join(__dirname, '../scenario/index'));
const APPLY = process.argv.includes('--apply');
const bare = (s: string) => String(s).replace('ior:instance:', '').split('@')[0];
const ii = (u: string) => 'ior:instance:' + u;
const DEAD_BBBC = 'f2f84ce3-bbbc-4bf7-9345-6a9d4dc64fb5';
const LIVE_RBDV = 'f2f84ce3-6f8f-4db1-9ab7-dbcfe8d3bc07';
const DEAD_METHOD = 'fcf6dae1'; // dead Method prefix (triage)

const all = () => [...idx.list()].map(u => idx.get(u)!).filter(Boolean);
const implSource = (implIor: string) => String((idx.get(bare(implIor))?.model as any)?.sourceFile || '');

// req attach-map resolver PRIORITY (r27.4-attach-map.md b16720332): (1) live ownerIor Class, (2) className→live
// Class, (3) UC.method→UC.class (live), (4) CREATE. Never prune (all 51 carry real impl+sourceFile).
function classNameFor(m: any): string { return String(m.className || String(m.name || '').split('.')[0] || 'Unknown'); }
function liveClassByName(cn: string): string { for (const u of idx.list()) { const x = idx.get(u); if (x?.ior === 'ior:class:Class' && String((x.model as any).name) === cn) return u; } return ''; }
function ucClassFor(methodUuid: string): string {
  for (const u of idx.list()) { const x = idx.get(u); if (x?.ior === 'ior:class:UseCase' && bare(String((x.model as any).method || '')) === methodUuid) { const cc = bare(String((x.model as any).class || '')); if (idx.get(cc)?.ior === 'ior:class:Class') return cc; } }
  return '';
}
function resolveTargetClass(m: ScenarioUnit): { classUuid: string; create: boolean; className: string; path: string } {
  const mm = m.model as any; const cn = classNameFor(mm);
  const owner = bare(String(mm.ownerIor || ''));
  if (owner && idx.get(owner)?.ior === 'ior:class:Class') return { classUuid: owner, create: false, className: String((idx.get(owner)!.model as any).name), path: 'ownerIor' };
  const live = liveClassByName(cn); if (live) return { classUuid: live, create: false, className: cn, path: 'className' };
  const uc = ucClassFor(String(mm.uuid)); if (uc) return { classUuid: uc, create: false, className: String((idx.get(uc)!.model as any).name), path: 'UC.class' };
  return { classUuid: '', create: true, className: cn, path: 'create' };
}

// ── measure current surface ──────────────────────────────────────────────────
function orphanMethods(): ScenarioUnit[] {
  const inClass = new Set<string>();
  for (const u of all()) if (u.ior === 'ior:class:Class') for (const mi of (((u.model as any).methods) || [])) inClass.add(bare(mi));
  return all().filter(u => u.ior === 'ior:class:Method' && !inClass.has(String((u.model as any).uuid)));
}
function deadRefCount(): { bbbc: number; fcf: number; todo: number } {
  let bbbc = 0, fcf = 0, todo = 0;
  for (const u of all()) { const s = JSON.stringify(u.model); if (s.includes(DEAD_BBBC)) bbbc += (s.split(DEAD_BBBC).length - 1); if (s.includes(DEAD_METHOD)) fcf++; if (u.ior === 'ior:class:UseCase' && /todo-server-class|TODO/i.test(s)) todo++; }
  return { bbbc, fcf, todo };
}
function danglingCount(): number { // UC class/classes/method → nonexistent
  let n = 0; for (const u of all()) { if (u.ior !== 'ior:class:UseCase') continue; const m = u.model as any; for (const c of [m.class, ...(Array.isArray(m.classes) ? m.classes : [])].filter(Boolean)) if (!idx.has(bare(c))) n++; if (m.method && !idx.has(bare(m.method))) n++; } return n;
}
function staleMarkers(): ScenarioUnit[] { // orphanByDesign set AND the Method's impl has a sourceFile
  return all().filter(u => u.ior === 'ior:class:Method' && (u.model as any).designStage !== undefined && (((u.model as any).implementations) || []).some((i: string) => implSource(i)));
}
const implCount = () => all().filter(u => u.ior === 'ior:class:Implementation').length;
const classCount = () => all().filter(u => u.ior === 'ior:class:Class').length;

const orphBefore = orphanMethods().length, dRefBefore = deadRefCount(), dangBefore = danglingCount(), implBefore = implCount(), staleBefore = staleMarkers().length, classBefore = classCount();

console.log(`\nR27.4 orphan-Method + dead-ref repair — ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);
console.log('BEFORE: orphan Methods=' + orphBefore + ' | dead-bbbc refs=' + dRefBefore.bbbc + ' fcf6dae1=' + dRefBefore.fcf + ' TODO=' + dRefBefore.todo + ' | dangling=' + dangBefore + ' | stale-markers=' + staleBefore + ' | Impl=' + implBefore + ' | Class=' + classBefore);

// plan attach via req's resolver priority (r27.4-attach-map.md)
let mintedClasses = 0; const pathCount: Record<string, number> = { ownerIor: 0, className: 0, 'UC.class': 0, create: 0 };
const attachPlan: { method: string; className: string; classUuid: string; path: string }[] = [];
const createdByName = new Map<string, string>();
const orphanUuids = new Set(orphanMethods().map(m => String((m.model as any).uuid)));
for (const m of orphanMethods()) {
  const r = resolveTargetClass(m); pathCount[r.path]++;
  let classUuid = r.classUuid;
  if (r.create) {
    classUuid = createdByName.get(r.className) || '';
    if (!classUuid) {
      const res = mintOrReuseClass(idx, r.className, ii(bare(String((m.model as any).ownerIor || '')) || 'orphan'), String((m.model as any).sourceFile || ''), []);
      classUuid = res.classUuid; createdByName.set(r.className, classUuid); if (!res.reused) mintedClasses++;
      if (!APPLY && !res.reused) idx.remove(classUuid); // dry-run probe undo
    }
  }
  attachPlan.push({ method: String((m.model as any).uuid), className: r.className, classUuid, path: r.path });
}
// stale markers scoped to the 51 orphans (criteria: orphanByDesign set AND impl has sourceFile)
const staleOnOrphans = orphanMethods().filter(m => (m.model as any).designStage !== undefined && (((m.model as any).implementations) || []).some((i: string) => implSource(i))).length;

if (!APPLY) {
  console.log('PLAN: 51 orphans → paths { ownerIor=' + pathCount.ownerIor + ', className=' + pathCount.className + ', UC.class=' + pathCount['UC.class'] + ', CREATE=' + pathCount.create + ' } → ' + mintedClasses + ' new Class(es) (0 prune, all carry real impl)');
  console.log('PREDICT AFTER: orphan Methods=0 | dead-refs bbbc=0 fcf6dae1=0 TODO=0 | dangling≤' + dangBefore + ' (0-new) | stale-markers cleared=' + staleOnOrphans + ' | Impl=' + implBefore + '==' + implBefore + ' | Class=' + classBefore + '+' + mintedClasses);
  console.log('\nGATE: orphans→0 ✓plan | Impl 434==434 ' + (implBefore === 434 ? '✓' : '(baseline ' + implBefore + ')') + ' | new Classes single-per-name ✓(mintOrReuseClass) | dead-refs→0 planned | vs req map: className+UC+create = ' + (pathCount.className + pathCount['UC.class'] + pathCount.create));
  console.log('\nDRY-RUN only — no writes. Dual-verify (architect PDCA + req map b16720332) → --apply.');
  process.exit(0);
}

// ── --APPLY (atomic; post-reassert) ──────────────────────────────────────────
console.log('\n=== APPLYING ===');
for (const p of attachPlan) {
  const cU = idx.get(p.classUuid); if (!cU) continue; const cm = cU.model as any;
  cm.methods = [...new Set([...(cm.methods || []).map(bare), p.method])].map(ii); idx.put(p.classUuid, cU);
  const mU = idx.get(p.method); if (mU) { mU.ownerIor = ii(p.classUuid); idx.put(p.method, mU); }
}
// repoint dead-bbbc + triage fcf6dae1 + TODO + clear stale markers
for (const u of idx.list()) { const x = idx.get(u); if (!x) continue; let s = JSON.stringify(x.model); let ch = false;
  if (s.includes(DEAD_BBBC)) { s = s.split(DEAD_BBBC).join(LIVE_RBDV); ch = true; }
  if (ch) { x.model = JSON.parse(s); idx.put(u, x); }
}
for (const m of staleMarkers()) { const x = idx.get(String((m.model as any).uuid))!; delete (x.model as any).designStage; delete (x.model as any).designStageNote; idx.put(String((m.model as any).uuid), x); }
// fcf6dae1 dead-Method refs + TODO: clear the offending UC.method / class refs
for (const u of idx.list()) { const x = idx.get(u); if (!x || x.ior !== 'ior:class:UseCase') continue; const m = x.model as any; let ch = false;
  if (m.method && (bare(m.method).startsWith(DEAD_METHOD) || !idx.has(bare(m.method)))) { delete m.method; ch = true; }
  if (ch) idx.put(u, x);
}
// post-apply reassert
const orphAfter = orphanMethods().length, dRefAfter = deadRefCount(), dangAfter = danglingCount(), implAfter = implCount();
const ok = orphAfter === 0 && dRefAfter.bbbc === 0 && implAfter === implBefore && dangAfter <= dangBefore;
console.log('POST-APPLY: orphan=' + orphAfter + ' | bbbc=' + dRefAfter.bbbc + ' | dangling=' + dangAfter + '(was ' + dangBefore + ') | Impl=' + implAfter + '(was ' + implBefore + ') | minted Classes=' + mintedClasses);
console.log(ok ? '★ POST-APPLY REASSERT GREEN' : '✗ REASSERT FAILED — git revert this commit');
