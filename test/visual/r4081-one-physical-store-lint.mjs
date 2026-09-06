// R40.81 ONE-PHYSICAL-UNIT-STORE LINT (Requirement be8ec6b6, gateRef check:one-physical-unit-store; Tron directive relayed
// 2026-09-05). THE PRINCIPLE: exactly ONE physical store of unit files — scenario/index — and every OTHER index/view tree
// (data/model-store model tree, room Files dirs, speaking-name trees) is a SYMLINK tree INTO it. A duplicate PHYSICAL store is
// forbidden: a SECOND tree that holds a REAL (non-symlink) *.scenario.json ⇒ RED.
//
// HAZARD (scan the hazard, not the actors): a REAL (non-symlink) *.scenario.json whose path is NOT under the ONE store
// (scenario/index — POSITIONAL by path, rename-safe). Symlinks are fine (they point INTO the one store). Count them, assert 0.
// RED-BASELINE NOW: data/model-store holds ~702 real unit files (the R40.81 duplicate) ⇒ RED. GREEN when the refactor
// (Unit.resolve convergence) makes every non-scenario/index unit file a SYMLINK into the one store (or removes the dup).
// FAILABLE: seed one real *.scenario.json outside scenario/index ⇒ the count rises ⇒ teeth. PAIR (behaviour-unchanged): the
// SAME units must still resolve byte-identical on /trace + /model after convergence — structural GREEN + behaviour GREEN together.
import fs from 'node:fs';
import path from 'node:path';
const R = (v) => console.log(v);
const ROOT = path.resolve('.');
const ONE_STORE = 'scenario/index'; // POSITIONAL: the one and only physical store, matched by path
const PRUNE = new Set(['node_modules', '.git', 'dist']);

function scan() {
  const perTree = {}; // top-level dir → { real, sym }
  let realOutside = 0; const outsideSamples = [];
  (function walk(dir) {
    let e = []; try { e = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const x of e) {
      if (PRUNE.has(x.name)) continue;
      const p = path.join(dir, x.name);
      const rel = p.replace(ROOT + '/', '');
      const top = rel.split('/')[0];
      if (x.isSymbolicLink()) { if (x.name.endsWith('.scenario.json')) { (perTree[top] = perTree[top] || { real: 0, sym: 0 }).sym++; } continue; } // symlink = OK (points into the one store)
      if (x.isDirectory()) { walk(p); continue; }
      if (x.name.endsWith('.scenario.json')) {
        (perTree[top] = perTree[top] || { real: 0, sym: 0 }).real++;
        if (!rel.includes(ONE_STORE)) { realOutside++; if (outsideSamples.length < 8) outsideSamples.push(rel); }
      }
    }
  })(ROOT);
  return { perTree, realOutside, outsideSamples };
}

const { perTree, realOutside, outsideSamples } = scan();
R(`═══ R40.81 ONE-PHYSICAL-UNIT-STORE — real unit files OUTSIDE ${ONE_STORE} ═══`);
R(`  per-tree *.scenario.json (real = a PHYSICAL unit file; symlink = a view INTO the store):`);
for (const top of Object.keys(perTree).sort()) { const t = perTree[top]; R(`    ${top}: real=${t.real} symlink=${t.sym}${t.real > 0 && top !== 'scenario' ? '   ← DUPLICATE PHYSICAL STORE' : ''}`); }
R(`  real unit files OUTSIDE the one store : ${realOutside}  ${realOutside === 0 ? 'GREEN' : 'RED'}`);
for (const s of outsideSamples) R(`      ${s}`);

// ── FAILABLE self-test (teeth): seed ONE real *.scenario.json OUTSIDE scenario/index → realOutside MUST rise, then remove it.
const probeDir = path.join(ROOT, `__r4081_probe_${process.pid}`);
let teeth = false;
try { fs.mkdirSync(probeDir, { recursive: true }); fs.writeFileSync(path.join(probeDir, 'rogue.scenario.json'), '{"ior":"ior:class:Test","model":{"uuid":"rogue"}}'); teeth = scan().realOutside === realOutside + 1; }
finally { try { fs.rmSync(probeDir, { recursive: true, force: true }); } catch {} }
R(`  FAILABLE self-test (seed a real unit file outside the one store → detected): ${teeth ? 'PASS (teeth — a new physical store cannot slip in)' : 'FAIL (toothless — fix before trusting green)'}`);

const green = realOutside === 0 && teeth;
R(`OVERALL: ${green ? 'GREEN — exactly ONE physical unit store; all else symlinks into it' : 'RED'}`);
R(`  RED-baseline expectation (pre-convergence): data/model-store holds real unit files (the duplicate) → RED. Flips GREEN when Unit.resolve convergence symlinks/removes them into scenario/index.`);
R(`  PAIR: behaviour-unchanged — the same units must resolve byte-identical on /trace + /model after convergence (structural GREEN alone is not sufficient).`);
process.exit(green ? 0 : 1);
