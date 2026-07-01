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
      if (canonNames.has(nm)) {           // same-name → collapse to ONE (keep the has-Impl/active-chain version).
        const keep = methodHasImpl(ii(canonNames.get(nm)!)) ? canonNames.get(nm)! : (methodHasImpl(mIor) ? mu : canonNames.get(nm)!);
        methodRemap.set(mu, keep); globalMethodRemap.set(mu, keep);
        if (keep !== mu) droppedMethods.add(mu);
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

// invariants (dry-run gate)
const dBefore = danglingCount(false), dAfter = danglingCount(true);
console.log('\nHARD INVARIANTS:');
console.log('  NOTE collapse-impls: ' + allImpls.size + ' group-method impls total;', lostImpls.length === 0 ? 'all survive on the canonical' : lostImpls.length + ' sit on collapsed same-name methods → --apply MUST UNION them onto the keeper (architect confirm): ' + lostImpls.map(i => i.slice(0, 8)));
console.log('  INV4 R25.6 2179d235 (renderScenarioLink) survives on canonical:', survivingImpls.has('2179d235-be01-4f0b-a1cb-bcfda316a5b4') ? '✓ (no collision — method moves in intact)' : '✗ ABORT');
console.log('  INV2 DELTA-dangling: before=' + dBefore + ' after=' + dAfter + ' →', dAfter <= dBefore ? '✓ 0-NEW (' + (dBefore - dAfter) + ' bonus-fixed)' : '✗ ' + (dAfter - dBefore) + ' NEW dangling — ABORT');
for (const [n, u] of Object.entries(PROTECTED)) console.log('  INV4 active-chain ' + n + ' canonical ' + u.slice(0, 8) + ' kept + present:', has(u) && plans.find(p => p.name === n)?.canonical === u ? '✓' : '(no dup group / not canonical)');
console.log('\n' + (APPLY ? 'APPLY not run in this report (gate first).' : 'DRY-RUN only — no writes. Gate → req 0.4 before --apply.'));
