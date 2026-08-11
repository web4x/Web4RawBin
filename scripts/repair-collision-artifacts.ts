/**
 * R37.3/repair — mechanical repair of the CONFIRMED collision-artifact corruption set (architect spec 1dfc71d1d).
 * scripts/repair-collision-artifacts.ts --dry-run(default) | --apply | --bite
 *
 * Fixes ONLY the confirmed set; NEVER touches: 89 same-name (R30.11 shared-impl review), 239 UC→Sprint/Task
 * (E convention debt), 18 prefix pairs. Full-uuid, fail-loud, idempotent, MOVE-not-drop (add to true owner BEFORE
 * removing from the false lister → no Impl ever orphaned). Runs on a clean tree (git IS the backup); one atomic commit.
 *
 * Categories:
 *   A  980  foreign Method.implementations[] entries  — X on M but X.ownerIor→M'≠M AND name-token(X)≠name-token(M)
 *   D  8    UC.class → non-Class                       — set UC.class = resolve(UC.method).ownerIor; SKIP if UC.method broken
 *   MO 5    Method.ownerIor → non-Class                — repoint to the Class listing this Method (or name-matched); else SKIP
 *   IO 10   Impl.ownerIor → non-Method                 — repoint to the Method listing this Impl (or name-matched); else SKIP
 * Untouched (assert unchanged): SN 89 same-name shared / EC 239 UC.owner→non-Req / PP 18 prefix pairs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index-store.js';
import type { ScenarioUnit } from '../src/ts/scenario/types.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODE = process.argv.includes('--apply') ? 'apply' : process.argv.includes('--bite') ? 'bite' : 'dry-run';
const bare = (r: unknown): string => String(r ?? '').replace('ior:instance:', '').split('@')[0];
const iorOf = (u: string) => 'ior:instance:' + u;
const nameToken = (name: unknown): string => String(name ?? '').split(' (')[0].split('.').pop()!.trim().toLowerCase();

interface Buckets { A: string[][]; D: string[]; MO: string[]; IO: string[]; SN: number; EC: number; PP: number; skipped: string[] }

function analyze(idx: ScenarioIndex) {
  const all = [...idx.list()];
  const get = (u: string) => idx.get(u);
  const iorClass = (u: string) => get(u)?.ior;
  const B: Buckets = { A: [], D: [], MO: [], IO: [], SN: 0, EC: 0, PP: 0, skipped: [] };

  for (const u of all) {
    const unit = get(u); if (!unit) continue;
    const m = unit.model as Record<string, unknown>;

    if (unit.ior === 'ior:class:Method') {
      // A / SN: scan implementations[] for foreign vs same-name-shared
      for (const implRef of (m.implementations as string[]) || []) {
        const x = bare(implRef); const xu = get(x); if (!xu) continue;
        const trueOwner = bare(xu.ownerIor);                         // ownerIor is a TOP-LEVEL ScenarioUnit field, NOT model.*
        if (!trueOwner || trueOwner === u) continue;                 // correct (true owner is this method) — not corruption
        if (get(trueOwner)?.ior !== 'ior:class:Method') continue;    // owner not a Method → that's an IO case, handled there
        const mismatch = nameToken((xu.model as any).name) !== nameToken(m.name);
        if (mismatch) B.A.push([u, x, trueOwner]);                   // foreign: move X off M onto its true owner
        else B.SN++;                                                 // same-name shared (R30.11) — LEAVE ALONE
      }
      // MO: Method.ownerIor → non-Class
      if (unit.ownerIor && iorClass(bare(unit.ownerIor)) !== 'ior:class:Class') B.MO.push(u);
    }

    if (unit.ior === 'ior:class:UseCase') {
      // D: UC.class → non-Class
      if (m.class && iorClass(bare(m.class as string)) !== 'ior:class:Class') B.D.push(u);
      // EC: UC.owner → non-Requirement (convention debt — count only, NEVER touch)
      if (unit.ownerIor && iorClass(bare(unit.ownerIor)) !== 'ior:class:Requirement') B.EC++;
    }

    if (unit.ior === 'ior:class:Implementation') {
      // IO: Impl.ownerIor → non-Method
      if (unit.ownerIor && iorClass(bare(unit.ownerIor)) !== 'ior:class:Method') B.IO.push(u);
    }
  }

  // PP: prefix pairs (first-8 hex shared by >1 unit — minted-sibling collision family)
  const byPrefix = new Map<string, number>();
  for (const u of all) byPrefix.set(u.slice(0, 8), (byPrefix.get(u.slice(0, 8)) || 0) + 1);
  for (const [, n] of byPrefix) if (n > 1) B.PP += n;
  return B;
}

// resolve the target Class for a Method (the Class whose methods[] lists it, else name-matched Foo for Foo.bar)
function classForMethod(idx: ScenarioIndex, methodUuid: string): string | null {
  for (const u of idx.list()) { const x = idx.get(u); if (x?.ior === 'ior:class:Class' && ((x.model as any).methods || []).some((r: string) => bare(r) === methodUuid)) return u; }
  const cn = String((idx.get(methodUuid)?.model as any)?.name || '').split('.')[0];
  const named = [...idx.list()].find((u) => idx.get(u)?.ior === 'ior:class:Class' && String((idx.get(u)!.model as any).name) === cn);
  return named || null;
}
function methodForImpl(idx: ScenarioIndex, implUuid: string): string | null {
  for (const u of idx.list()) { const x = idx.get(u); if (x?.ior === 'ior:class:Method' && ((x.model as any).implementations || []).some((r: string) => bare(r) === implUuid)) return u; }
  return null;
}

function applyRepair(idx: ScenarioIndex, B: Buckets): { moved: number; fixedD: number; fixedMO: number; fixedIO: number; skipped: string[] } {
  const skipped = [...B.skipped]; let moved = 0, fixedD = 0, fixedMO = 0, fixedIO = 0;
  // A — MOVE-not-drop: ADD X to true owner FIRST, THEN remove from false lister
  for (const [falseM, x, trueM] of B.A) {
    const tu = idx.get(trueM)!; const tm = tu.model as any;
    tm.implementations = tm.implementations || [];
    if (!tm.implementations.some((r: string) => bare(r) === x)) { tm.implementations.push(iorOf(x)); idx.put(trueM, tu); }
    const fu = idx.get(falseM)!; const fm = fu.model as any;
    fm.implementations = (fm.implementations || []).filter((r: string) => bare(r) !== x); idx.put(falseM, fu);
    moved++;
  }
  // D — UC.class = resolve(UC.method).ownerIor
  for (const uc of B.D) {
    const um = idx.get(uc)!.model as any; const mu = bare(um.method);
    const mUnit = mu ? idx.get(mu) : null;
    if (!mUnit || mUnit.ior !== 'ior:class:Method' || idx.get(bare((mUnit.model as any).ownerIor))?.ior !== 'ior:class:Class') { skipped.push(`D:${uc} needs-manual (UC.method broken)`); continue; }
    um.class = (mUnit.model as any).ownerIor; idx.put(uc, idx.get(uc)!); fixedD++;
  }
  // MO — Method.ownerIor = the Class listing it (or name-matched)
  for (const mth of B.MO) { const c = classForMethod(idx, mth); if (!c) { skipped.push(`MO:${mth} needs-manual (no owning/named Class)`); continue; } const mu = idx.get(mth)!; (mu.model as any).ownerIor = iorOf(c); idx.put(mth, mu); fixedMO++; }
  // IO — Impl.ownerIor = the Method listing it
  for (const impl of B.IO) { const mth = methodForImpl(idx, impl); if (!mth) { skipped.push(`IO:${impl} needs-manual (no listing Method)`); continue; } const iu = idx.get(impl)!; (iu.model as any).ownerIor = iorOf(mth); idx.put(impl, iu); fixedIO++; }
  return { moved, fixedD, fixedMO, fixedIO, skipped };
}

// ── main ──────────────────────────────────────────────────────────────────────
if (MODE === 'bite') { runBite(); }
else {
  const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index'));
  const totalBefore = [...idx.list()].length;
  const B = analyze(idx);
  console.log(`\nR37.3 repair-collision-artifacts — ${MODE.toUpperCase()} (total units=${totalBefore})\n`);
  console.log('CONFIRMED-CORRUPTION (to repair):');
  console.log(`  A  foreign Method.implementations[] : ${B.A.length}`);
  console.log(`  D  UC.class → non-Class             : ${B.D.length}`);
  console.log(`  MO Method.ownerIor → non-Class      : ${B.MO.length}`);
  console.log(`  IO Impl.ownerIor → non-Method       : ${B.IO.length}`);
  console.log(`  = total confirmed                   : ${B.A.length + B.D.length + B.MO.length + B.IO.length}`);
  console.log('UNTOUCHED (must stay unchanged):');
  console.log(`  SN same-name shared (R30.11)        : ${B.SN}`);
  console.log(`  EC UC.owner → non-Requirement       : ${B.EC}`);
  console.log(`  PP prefix pairs                     : ${B.PP}`);
  console.log(`\nSpec expects A=980 D=8 MO=5 IO=10 | SN≈89 EC≈239 PP≈18 — reconcile if different (measure, don't assume).`);

  if (MODE === 'dry-run') { console.log('\nDRY-RUN only — no writes. Report to PO for --apply authorization.'); process.exit(0); }

  // --apply (gated; only reached with explicit --apply)
  const r = applyRepair(idx, B);
  const after = analyze(idx); const totalAfter = [...idx.list()].length;
  const ok = after.A.length === 0 && after.D.length === 0 && after.MO.length === 0 && after.IO.length === 0
    && totalAfter === totalBefore && after.SN === B.SN && after.EC === B.EC && after.PP === B.PP;
  console.log(`\n=== APPLIED === moved=${r.moved} D=${r.fixedD} MO=${r.fixedMO} IO=${r.fixedIO} skipped=${r.skipped.length}`);
  for (const s of r.skipped) console.log(`  SKIP ${s}`);
  console.log(`POST: confirmed=${after.A.length + after.D.length + after.MO.length + after.IO.length} (→0) | units ${totalBefore}==${totalAfter} | SN ${after.SN}==${B.SN} EC ${after.EC}==${B.EC} PP ${after.PP}==${B.PP}`);
  console.log(ok ? '★ INVARIANTS GREEN' : '✗ INVARIANT FAIL — git checkout scenario/index and report');
}

function runBite() {
  // self-contained: temp index, plant (1) a foreign impl on the wrong method, (2) a legit same-name shared-impl.
  const DIR = path.join(ROOT, 'scratchpad-bite/index');
  fs.rmSync(path.join(ROOT, 'scratchpad-bite'), { recursive: true, force: true });
  fs.mkdirSync(DIR, { recursive: true });
  const idx = new ScenarioIndex(DIR);
  const put = (u: string, ior: string, model: any) => idx.put(u, { ior, model: { uuid: u, ...model }, ownerIor: model.ownerIor ?? null } as ScenarioUnit);
  const U = (h: string) => `${h}0000-0000-4000-8000-00000000000${h[0]}`;
  const mTrue = U('a'), mFalse = U('b'), implForeign = U('c'), mS1 = U('d'), mS2 = U('e'), implShared = U('f'), cls = U('9');
  put(cls, 'ior:class:Class', { name: 'Foo', methods: [] });
  put(mTrue, 'ior:class:Method', { name: 'Foo.trueMethod', ownerIor: iorOf(cls), implementations: [] });
  put(mFalse, 'ior:class:Method', { name: 'Foo.otherMethod', ownerIor: iorOf(cls), implementations: [iorOf(implForeign)] }); // foreign listing
  put(implForeign, 'ior:class:Implementation', { name: 'Foo.trueMethod (impl)', ownerIor: iorOf(mTrue) });                     // true owner = mTrue
  put(mS1, 'ior:class:Method', { name: 'Bar.shared', ownerIor: iorOf(cls), implementations: [iorOf(implShared)] });
  put(mS2, 'ior:class:Method', { name: 'Bar.shared', ownerIor: iorOf(cls), implementations: [iorOf(implShared)] });            // same-name shared (R30.11)
  put(implShared, 'ior:class:Implementation', { name: 'Bar.shared (impl)', ownerIor: iorOf(mS1) });

  const B0 = analyze(idx);
  const foreignDetected = B0.A.length === 1 && B0.A[0][1] === implForeign && B0.SN >= 1;
  applyRepair(idx, B0);
  const B1 = analyze(idx);
  const foreignMoved = !((idx.get(mFalse)!.model as any).implementations || []).some((r: string) => bare(r) === implForeign)
    && ((idx.get(mTrue)!.model as any).implementations || []).some((r: string) => bare(r) === implForeign);
  const sharedUntouched = ((idx.get(mS1)!.model as any).implementations || []).some((r: string) => bare(r) === implShared)
    && ((idx.get(mS2)!.model as any).implementations || []).some((r: string) => bare(r) === implShared);
  applyRepair(idx, analyze(idx)); const B2 = analyze(idx);
  const idempotent = B2.A.length === 0;
  fs.rmSync(path.join(ROOT, 'scratchpad-bite'), { recursive: true, force: true });
  console.log('R37.3 repair BITE:');
  console.log('  foreign detected (A=1, X=foreign):', foreignDetected);
  console.log('  foreign MOVED to true owner:', foreignMoved);
  console.log('  same-name shared LEFT ALONE (on both S1+S2):', sharedUntouched);
  console.log('  post-repair confirmed==0 + idempotent:', B1.A.length === 0 && idempotent);
  const pass = foreignDetected && foreignMoved && sharedUntouched && B1.A.length === 0 && idempotent;
  console.log(pass ? '★ BITE PASS' : '✗ BITE FAIL');
  process.exit(pass ? 0 : 1);
}
