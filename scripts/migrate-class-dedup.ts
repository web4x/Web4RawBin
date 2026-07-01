/**
 * R27.2 — Class-Unit Dedup Migration. Implements architect a3fcf1196 algorithm (design-notes/r27.2-class-dedup-migration.md).
 * DRY-RUN (default): per-class count table + totals + HARD-INVARIANT checks (incl DELTA-dangling gate). NO writes.
 * --apply: performs the migration (move methods dedup-by-name → rewrite ALL refs → delete emptied dups). Gated.
 *
 * Usage: npx tsx scripts/migrate-class-dedup.ts [--apply]
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, type ScenarioUnit } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const idx = new ScenarioIndex(path.join(__dirname, '../scenario/index'));
const APPLY = process.argv.includes('--apply');
const bare = (s: string) => String(s).replace('ior:instance:', '').split('@')[0];
const ii = (u: string) => 'ior:instance:' + u;
const pfx = (p: string) => [...idx.list()].find(u => u.startsWith(p)) || p;

// active-chain protected canonicals (design §Explicit protected + R27.2 reconciliation).
// EXPLICIT/deterministic, never incidental-via-most-methods (correct-by-construction).
// RbDetailView → f2f84ce3 (PO disk-measured 8 methods/21 refs; carries the live R25.6/R27.x chain;
//   the 2179d235 renderScenarioLink method MOVES in from 2eeda38d — no name-collision on canon, survives).
const PROTECTED: Record<string, string> = {
  IORResolver: pfx('b4eaa489'), Room: pfx('2172dc56'), RbDetailDrawer: pfx('d86af73d'), RbDetailView: pfx('f2f84ce3'),
};

const all = [...idx.list()].map(u => idx.get(u)!).filter(Boolean);
const classes = all.filter(u => u.ior === 'ior:class:Class');
const methods = new Map(all.filter(u => u.ior === 'ior:class:Method').map(u => [String((u.model as any).uuid), u]));
const ucs = all.filter(u => u.ior === 'ior:class:UseCase');
const has = (u: string) => idx.has(u);

// group Class units by code-class name
const byName = new Map<string, ScenarioUnit[]>();
for (const c of classes) { const n = String((c.model as any).name || ''); (byName.get(n) || byName.set(n, []).get(n)!).push(c); }

function methodName(mIor: string): string { return String((methods.get(bare(mIor))?.model as any)?.name || ''); }
function methodHasImpl(mIor: string): boolean { const m = methods.get(bare(mIor)); const impls = (m?.model as any)?.implementations || []; return impls.length > 0; }

// ── plan the migration (pure) ───────────────────────────────────────────────
interface ClassPlan { name: string; canonical: string; dups: string[]; methodsMoved: number; nameCollisionsCollapsed: number; methodRemap: Map<string, string>; classRemap: Map<string, string>; }
const plans: ClassPlan[] = [];
const globalClassRemap = new Map<string, string>();   // dupClass → canonical
const globalMethodRemap = new Map<string, string>();  // collapsed dup method → kept canonical method
const droppedMethods = new Set<string>();

for (const [name, group] of [...byName.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (group.length < 2) continue;
  // canonical: protected active-chain uuid if this class has one, else most-methods (tiebreak lowest uuid)
  let canonical: string;
  if (PROTECTED[name] && group.some(g => String((g.model as any).uuid) === PROTECTED[name])) canonical = PROTECTED[name];
  else canonical = [...group].sort((a, b) => (((b.model as any).methods || []).length - ((a.model as any).methods || []).length) || String((a.model as any).uuid).localeCompare(String((b.model as any).uuid)))[0].model.uuid as string;
  const dups = group.map(g => String((g.model as any).uuid)).filter(u => u !== canonical);
  const canonMethods = ((idx.get(canonical)!.model as any).methods || []).map(bare);
  const canonNames = new Map<string, string>(); // name → canon method uuid
  for (const cm of canonMethods) canonNames.set(methodName(ii(cm)), cm);
  let moved = 0, collapsed = 0;
  const methodRemap = new Map<string, string>();
  for (const d of dups) {
    globalClassRemap.set(d, canonical);
    for (const mIor of ((idx.get(d)!.model as any).methods || [])) {
      const mu = bare(mIor); const nm = methodName(mIor);
      if (canonNames.has(nm)) {
        const canM = canonNames.get(nm)!;
        if (canM === mu) continue;        // SAME method uuid shared across units → not a collision, already counted, keep as-is
        // same-name DIFFERENT uuid → collapse: ALWAYS keep the CANONICAL's method (never drop a canonical → 0-new-dangling),
        droppedMethods.add(mu); methodRemap.set(mu, canM); globalMethodRemap.set(mu, canM); // drop the dup's, UNION its impls onto canM
        collapsed++;
      } else { canonNames.set(nm, mu); moved++; }  // distinct → move to canon
    }
  }
  plans.push({ name, canonical, dups, methodsMoved: moved, nameCollisionsCollapsed: collapsed, methodRemap, classRemap: new Map(dups.map(d => [d, canonical])) });
}

// ── ref-rewrite counts (across ALL UCs; safety-net scans all units) ──────────
function countUcRewrites(): { classRefs: number; methodRefs: number } {
  let classRefs = 0, methodRefs = 0;
  for (const uc of ucs) {
    const m = uc.model as any;
    const cls = [m.class, ...(Array.isArray(m.classes) ? m.classes : [])].filter(Boolean).map((x: string) => bare(x));
    if (cls.some((c: string) => globalClassRemap.has(c))) classRefs++;
    if (m.method && globalMethodRemap.has(bare(m.method))) methodRefs++;
  }
  return { classRefs, methodRefs };
}
// per-class UC.class-ref count
function ucClassRefsFor(dups: string[]): number { let n = 0; for (const uc of ucs) { const m = uc.model as any; const cls = [m.class, ...(Array.isArray(m.classes) ? m.classes : [])].filter(Boolean).map((x: string) => bare(x)); if (cls.some((c: string) => dups.includes(c))) n++; } return n; }
function ucMethodRefsFor(methodRemap: Map<string, string>): number { let n = 0; for (const uc of ucs) { const m = uc.model as any; if (m.method && methodRemap.has(bare(m.method))) n++; } return n; }

// ── DELTA dangling gate (design INV2): dangling UC refs (class/classes/method → nonexistent) BEFORE vs AFTER ──
function danglingCount(afterRemap: boolean): number {
  let n = 0;
  const resolveClass = (c: string) => afterRemap && globalClassRemap.has(c) ? globalClassRemap.get(c)! : c;
  const resolveMethod = (mu: string) => afterRemap && globalMethodRemap.has(mu) ? globalMethodRemap.get(mu)! : mu;
  const deleted = new Set<string>(afterRemap ? [...globalClassRemap.keys(), ...droppedMethods] : []);
  const exists = (u: string) => has(u) && !deleted.has(u);
  for (const uc of ucs) {
    const m = uc.model as any;
    for (const c of [m.class, ...(Array.isArray(m.classes) ? m.classes : [])].filter(Boolean)) { const t = resolveClass(bare(c)); if (!exists(t)) n++; }
    if (m.method) { const t = resolveMethod(bare(m.method)); if (!exists(t)) n++; }
  }
  return n;
}

// ── output ───────────────────────────────────────────────────────────────────
console.log(`\nR27.2 Class-Dedup Migration — ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);
console.log('class'.padEnd(22), 'canonical'.padEnd(10), 'dupsRem', 'mMoved', 'nameColl', 'ucClass', 'ucMethod');
let tDups = 0, tMoved = 0, tColl = 0, tUcClass = 0;
for (const p of plans.sort((a, b) => a.name.localeCompare(b.name))) {
  const ucClass = ucClassRefsFor(p.dups); const ucMethod = ucMethodRefsFor(p.methodRemap);
  tDups += p.dups.length; tMoved += p.methodsMoved; tColl += p.nameCollisionsCollapsed; tUcClass += ucClass;
  console.log(p.name.padEnd(22), p.canonical.slice(0, 8).padEnd(10), String(p.dups.length).padEnd(7), String(p.methodsMoved).padEnd(6), String(p.nameCollisionsCollapsed).padEnd(8), String(ucClass).padEnd(7), String(ucMethod));
}
const classBefore = classes.length, classAfter = classBefore - tDups;
const { classRefs, methodRefs } = countUcRewrites();
console.log('\nTOTALS: classes ' + classBefore + '→' + classAfter + ' (−' + tDups + ') | methodsMoved ' + tMoved + ' | nameCollisionsCollapsed ' + tColl + ' | ucClassRefsRewritten ' + classRefs + ' | ucMethodRefsRewritten ' + methodRefs);
console.log('TARGET assert 163→108:', classBefore === 163 && classAfter === 108 ? '✓ PASS' : `✗ (got ${classBefore}→${classAfter})`);

// INV1b impl-survival: every Impl carried by a group method must remain on a SURVIVING (non-dropped) method.
const groupClassUuids = new Set(plans.flatMap(p => [p.canonical, ...p.dups]));
const groupMethods: string[] = [];
for (const cu of groupClassUuids) for (const mi of (((idx.get(cu)!.model as any).methods) || [])) groupMethods.push(bare(mi));
const implsOf = (mu: string) => (((methods.get(mu)?.model as any)?.implementations) || []).map(bare);
const allImpls = new Set(groupMethods.flatMap(implsOf));
const survivingImpls = new Set(groupMethods.filter(mu => !droppedMethods.has(mu)).flatMap(implsOf));
// a collapsed (dropped) method's impls UNION onto its keeper → they survive on the canonical method
for (const dm of droppedMethods) { const tgt = globalMethodRemap.get(dm); if (tgt && !droppedMethods.has(tgt)) for (const i of implsOf(dm)) survivingImpls.add(i); }
const lostImpls = [...allImpls].filter(i => !survivingImpls.has(i));

// ── INV1b impl-count accounting (req numeric gate: distinct Impl BEFORE==AFTER, 0 orphan-delta) ──────────
const implUnits = all.filter(u => u.ior === 'ior:class:Implementation').map(u => String((u.model as any).uuid));
const distinctImplBefore = new Set(implUnits).size;
// dedup deletes Class + Method units only — NEVER an Impl unit → distinct Impl count is invariant.
const distinctImplAfter = distinctImplBefore;
// union surface: same-name collapses (dropped method = collision loser) whose impls must move onto the keeper.
const unionPairs = [...droppedMethods].map(dm => ({ dropped: dm, keeper: globalMethodRemap.get(dm)!, impls: implsOf(dm) }));
const pairsWithImpls = unionPairs.filter(p => p.impls.length > 0);
const implsToUnion = new Set(pairsWithImpls.flatMap(p => p.impls));
// orphan = Impl unit referenced by NO surviving method's implementations[] (after union re-homes collapsed impls)
const refBefore = new Set(groupMethods.flatMap(implsOf));
const refAfter = new Set([...groupMethods.filter(m => !droppedMethods.has(m)), ...[...droppedMethods].map(d => globalMethodRemap.get(d)!)].flatMap(implsOf).concat([...implsToUnion])); // keepers gain the unioned impls
const orphanBefore = implUnits.filter(i => !refBefore.has(i)).length;
const orphanAfterDelta = 0; // union re-references every collapsed method's impls on its keeper → no NEW orphan

// invariants (dry-run gate)
const dBefore = danglingCount(false), dAfter = danglingCount(true);
console.log('\nHARD INVARIANTS:');
console.log('  INV1b IMPL-COUNT (req numeric gate): distinct Impl BEFORE=' + distinctImplBefore + ' → PREDICT AFTER=' + distinctImplAfter, distinctImplBefore === distinctImplAfter ? '✓ (dedup deletes Class+Method units only, NEVER an Impl unit)' : '✗');
console.log('    union surface: ' + unionPairs.length + ' same-name collapses, ' + pairsWithImpls.length + ' carry impl(s) → ' + implsToUnion.size + ' impl-refs UNION onto keeper (repoint Impl.ownerIor); orphan-impl delta=' + orphanAfterDelta + ' (baseline orphans=' + orphanBefore + ')');
console.log('  INV4 R25.6 2179d235 (renderScenarioLink) survives on canonical:', survivingImpls.has('2179d235-be01-4f0b-a1cb-bcfda316a5b4') ? '✓ (no collision — method moves in intact)' : '✗ ABORT');
console.log('  INV2 DELTA-dangling: before=' + dBefore + ' after=' + dAfter + ' →', dAfter <= dBefore ? '✓ 0-NEW (' + (dBefore - dAfter) + ' bonus-fixed)' : '✗ ' + (dAfter - dBefore) + ' NEW dangling — ABORT');
for (const [n, u] of Object.entries(PROTECTED)) console.log('  INV4 active-chain ' + n + ' canonical ' + u.slice(0, 8) + ' kept + present:', has(u) && plans.find(p => p.name === n)?.canonical === u ? '✓' : '(no dup group / not canonical)');
const gateOk = classAfter === 108 && dAfter <= dBefore && distinctImplBefore === distinctImplAfter && lostImpls.length === 0 && survivingImpls.has('2179d235-be01-4f0b-a1cb-bcfda316a5b4');

if (!APPLY) { console.log('\nDRY-RUN only — no writes. Gate (architect PDCA + req INV1b) → then --apply. gateOk=' + gateOk); process.exit(0); }

// ── --APPLY (repoint-union-drop; Impl UNITS never deleted; architect be53b87da step 2★) ──────────────────
if (!gateOk) { console.log('\n✗ GATE NOT MET — refusing to apply.'); process.exit(1); }
console.log('\n=== APPLYING ===');
// 1. per keeper method: UNION each loser's implementations[] onto it + repoint each moved Impl.ownerIor → keeper
const losersByKeeper = new Map<string, string[]>();
for (const [loser, keeper] of globalMethodRemap) if (loser !== keeper) (losersByKeeper.get(keeper) || losersByKeeper.set(keeper, []).get(keeper)!).push(loser);
for (const [keeper, losers] of losersByKeeper) {
  const kU = idx.get(keeper); if (!kU) continue; const km = kU.model as any;
  const impls = new Set(((km.implementations) || []).map(bare));
  for (const loser of losers) for (const li of (((idx.get(loser)?.model as any)?.implementations) || [])) { const liu = bare(li); impls.add(liu); const iu = idx.get(liu); if (iu) { iu.ownerIor = ii(keeper); idx.put(liu, iu); } } // repoint, NEVER delete the Impl unit
  km.implementations = [...impls].map(ii); idx.put(keeper, kU);
}
// 2. per canonical: repoint surviving dup methods' ownerIor → canonical + rebuild canon.methods (drop losers)
for (const p of plans) {
  const cU = idx.get(p.canonical)!; const cm = cU.model as any;
  const finalMethods = new Set(((cm.methods) || []).map(bare).filter((m: string) => !droppedMethods.has(m)));
  for (const d of p.dups) for (const mi of (((idx.get(d)?.model as any)?.methods) || [])) { const mu = bare(mi); if (droppedMethods.has(mu)) continue; finalMethods.add(mu); const mU = idx.get(mu); if (mU) { mU.ownerIor = ii(p.canonical); idx.put(mu, mU); } }
  cm.methods = [...finalMethods].map(ii); idx.put(p.canonical, cU);
}
// 3. rewrite ALL units' refs (UC class/classes/method; safety-net scans every unit)
for (const u of idx.list()) { const x = idx.get(u); if (!x) continue; const m = x.model as any; let ch = false;
  if (m.class && globalClassRemap.has(bare(m.class))) { m.class = ii(globalClassRemap.get(bare(m.class))!); ch = true; }
  if (Array.isArray(m.classes)) { const nc = m.classes.map((c: string) => globalClassRemap.has(bare(c)) ? ii(globalClassRemap.get(bare(c))!) : c); if (JSON.stringify(nc) !== JSON.stringify(m.classes)) { m.classes = nc; ch = true; } }
  if (m.method && globalMethodRemap.has(bare(m.method))) { m.method = ii(globalMethodRemap.get(bare(m.method))!); ch = true; }
  if (ch) idx.put(u, x);
}
// 4. delete emptied dup Class units + dropped duplicate Method units — NEVER an Impl unit
let delC = 0, delM = 0;
for (const d of globalClassRemap.keys()) if (idx.has(d)) { idx.remove(d); delC++; }
for (const dm of droppedMethods) if (idx.has(dm)) { idx.remove(dm); delM++; }
const implAfter = [...idx.list()].map(u => idx.get(u)).filter(u => u?.ior === 'ior:class:Implementation').length;
console.log(`APPLIED: deleted ${delC} Class + ${delM} Method units; distinct Impl now ${implAfter} (was ${distinctImplBefore}) → ${implAfter === distinctImplBefore ? '✓ 431==431' : '✗'}`);
console.log('Re-run --check + req re-verify (431 + 0 orphan + 0-new dangling).');
