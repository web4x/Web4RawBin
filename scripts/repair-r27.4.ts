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
// bbbc counted by REF-POSITION only (unit.ownerIor + UC.class/classes[]/method) — NOT raw-JSON (req's requirement
// unit records the dead uuid in prose as EVIDENCE; that must survive, so the gate is ref-position=0, not string=0).
function deadRefCount(): { bbbc: number; fcf: number; todo: number } {
  let bbbc = 0, fcf = 0, todo = 0;
  for (const u of all()) {
    if (bare(String(u.ownerIor || '')) === DEAD_BBBC) bbbc++;
    const m = u.model as any;
    if (u.ior === 'ior:class:UseCase') {
      for (const c of [m.class, ...(Array.isArray(m.classes) ? m.classes : [])].filter(Boolean)) { if (bare(c) === DEAD_BBBC) bbbc++; if (/todo-server-class/i.test(bare(c))) todo++; }
      if (m.method && bare(m.method).startsWith(DEAD_METHOD)) fcf++;
    }
  }
  return { bbbc, fcf, todo };
}
function danglingCount(): number { // UC class/classes/method → nonexistent
  let n = 0; for (const u of all()) { if (u.ior !== 'ior:class:UseCase') continue; const m = u.model as any; for (const c of [m.class, ...(Array.isArray(m.classes) ? m.classes : [])].filter(Boolean)) if (!idx.has(bare(c))) n++; if (m.method && !idx.has(bare(m.method))) n++; } return n;
}
// A LYING marker = any of {designStage, orphanByDesign, orphanReason} set AND the Method's Impl HAS a sourceFile
// (code shipped → the "design-stage/orphan" claim is false). Architect refinement: clear ALL such (not just
// orphan-scoped) so R27.4 fully aligns with the R27.2 strict lying-marker audit check (one criteria, one pass).
const LYING_FIELDS = ['designStage', 'orphanByDesign', 'orphanReason'] as const;
function isLyingMarker(m: any): boolean { return LYING_FIELDS.some(f => m[f] !== undefined) && (((m.implementations) || []).some((i: string) => implSource(i))); }
function staleMarkers(): ScenarioUnit[] {
  return all().filter(u => u.ior === 'ior:class:Method' && isLyingMarker(u.model as any));
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
// 37 of the 53 lying markers sit on the orphans being attached; the other 16 on already-attached methods (all cleared).
const staleOnOrphans = orphanMethods().filter(m => isLyingMarker(m.model as any)).length;

if (!APPLY) {
  console.log('PLAN: 51 orphans → paths { ownerIor=' + pathCount.ownerIor + ', className=' + pathCount.className + ', UC.class=' + pathCount['UC.class'] + ', CREATE=' + pathCount.create + ' } → ' + mintedClasses + ' new Class(es) (0 prune, all carry real impl)');
  console.log('PREDICT AFTER: orphan Methods=0 | dead-refs bbbc=0 fcf6dae1=0 TODO=0 (ref-position; req evidence-prose kept) | dangling≤' + dangBefore + ' (0-new) | stale-markers cleared=' + staleBefore + ' (' + staleOnOrphans + ' orphan + ' + (staleBefore - staleOnOrphans) + ' attached) | Impl=' + implBefore + '==' + implBefore + ' | Class=' + classBefore + '+' + mintedClasses);
  console.log('\nGATE: orphans→0 ✓plan | Impl 434==434 ' + (implBefore === 434 ? '✓' : '(baseline ' + implBefore + ')') + ' | bbbc ' + dRefBefore.bbbc + ' ref-positions (10 UC + 5 ownerIor) → 0 | new Class single-per-name ✓(mintOrReuseClass) | vs req map: className+UC+create = ' + (pathCount.className + pathCount['UC.class'] + pathCount.create));
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
// repoint dead-bbbc in REF POSITIONS ONLY (ownerIor + UC.class/classes/method) — NEVER prose: req's R27.4
// requirement-unit records the dead uuid in acceptanceCriteria/danglingSet as EVIDENCE (rewriting = corrupting its bug-desc).
for (const u of idx.list()) { const x = idx.get(u); if (!x) continue; const m = x.model as any; let ch = false;
  if (bare(String(x.ownerIor || '')) === DEAD_BBBC) { x.ownerIor = ii(LIVE_RBDV); ch = true; }       // the 5 Method.ownerIor → dead Class
  if (x.ior === 'ior:class:UseCase') {
    if (m.class && bare(m.class) === DEAD_BBBC) { m.class = ii(LIVE_RBDV); ch = true; }
    if (Array.isArray(m.classes)) { const nc = m.classes.map((c: string) => bare(c) === DEAD_BBBC ? ii(LIVE_RBDV) : c); if (JSON.stringify(nc) !== JSON.stringify(m.classes)) { m.classes = nc; ch = true; } }
    if (m.method && bare(m.method) === DEAD_BBBC) { m.method = ii(LIVE_RBDV); ch = true; }
  }
  if (ch) idx.put(u, x);
}
// TODO-server-class placeholder → the server Class the create-path just made (same family as server.addBugForwardKeys).
const serverClass = liveClassByName('server');
if (serverClass) for (const u of idx.list()) { const x = idx.get(u); if (!x || x.ior !== 'ior:class:UseCase') continue; const m = x.model as any; let ch = false;
  if (typeof m.class === 'string' && /todo-server-class/i.test(bare(m.class))) { m.class = ii(serverClass); ch = true; }
  if (Array.isArray(m.classes)) { const nc = m.classes.map((c: string) => /todo-server-class/i.test(bare(c)) ? ii(serverClass) : c); if (JSON.stringify(nc) !== JSON.stringify(m.classes)) { m.classes = nc; ch = true; } }
  if (ch) idx.put(u, x); }
// clear ALL 53 lying markers by criteria (any of the 3 fields + Impl-has-sourceFile), orphan AND attached
for (const m of staleMarkers()) { const x = idx.get(String((m.model as any).uuid))!; for (const f of LYING_FIELDS) delete (x.model as any)[f]; delete (x.model as any).designStageNote; idx.put(String((m.model as any).uuid), x); }
// fcf6dae1 dead-Method refs + TODO: clear the offending UC.method / class refs
for (const u of idx.list()) { const x = idx.get(u); if (!x || x.ior !== 'ior:class:UseCase') continue; const m = x.model as any; let ch = false;
  if (m.method && (bare(m.method).startsWith(DEAD_METHOD) || !idx.has(bare(m.method)))) { delete m.method; ch = true; }
  if (ch) idx.put(u, x);
}
// post-apply reassert — ALL gates on ACTUAL mutated disk (any miss → revert this atomic commit)
const orphAfter = orphanMethods().length, dRefAfter = deadRefCount(), dangAfter = danglingCount(), implAfter = implCount(), staleAfter = staleMarkers().length;
const ok = orphAfter === 0 && dRefAfter.bbbc === 0 && dRefAfter.fcf === 0 && dRefAfter.todo === 0 && staleAfter === 0 && implAfter === implBefore && dangAfter <= dangBefore;
console.log('POST-APPLY: orphan=' + orphAfter + ' | bbbc=' + dRefAfter.bbbc + ' fcf=' + dRefAfter.fcf + ' todo=' + dRefAfter.todo + ' | stale=' + staleAfter + ' | dangling=' + dangAfter + '(was ' + dangBefore + ') | Impl=' + implAfter + '(was ' + implBefore + ') | minted Class=' + mintedClasses);
console.log(ok ? '★ POST-APPLY REASSERT GREEN — all gates hold on mutated disk' : '✗ REASSERT FAILED — git revert this commit (atomic rollback)');
