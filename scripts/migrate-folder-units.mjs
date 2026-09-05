/**
 * S37 folder-unit repair MIGRATION (architect design-folder-unit-model-repair.md) — dry-run default (NO writes; reports
 * the 3 resulting numbers), --apply gated (writes only after gateOk + architect confirm). fs = source of truth.
 * Per folder unit: (2) populate children[] from the real fs location; (3) set parent from the location's parent segment;
 * (1) relocate the unit into scenario/index (the one store). ★RULE Q1/Q2/Q3 = best-interpretation, pending architect.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MS = path.join(ROOT, 'data/model-store');
const SI = path.join(ROOT, 'scenario/index');
const APPLY = process.argv.includes('--apply');

function unitsIn(store) {
  let out = [];
  try { out = execSync(`grep -rl '"ior": "ior:class:Folder"' ${store} 2>/dev/null || true`).toString().trim().split('\n').filter(Boolean); } catch {}
  return out.map((f) => ({ f, unit: JSON.parse(fs.readFileSync(f, 'utf8')) }));
}
function locToAbs(loc) {
  const s = String(loc || ''); if (!s) return '';
  if (s.startsWith('dir:')) return path.join(ROOT, s.slice(4));
  if (s === 'rawbin:ts') return path.join(ROOT, 'src');
  if (/^(rawbin:|roomcoll:|mof-m1|mof-m2|project:|collection:)/.test(s)) return '';
  return path.join(ROOT, s);
}
const all = unitsIn(MS);
const byLoc = new Map();               // location → uuid (existing folder units)
for (const { unit } of all) byLoc.set(String(unit.model.location || ''), unit.model.uuid);
const parentPathOf = (loc) => { const s = String(loc || ''); const i = s.lastIndexOf('/'); return i > 0 ? s.slice(0, i) : null; };

let willEmptyFs = 0, willNullNested = 0, willOutside = 0;
const plan = [];
for (const { unit } of all) {
  const m = unit.model;
  const loc = String(m.location || '');
  // (3) parent — parent folder UNIT ior if it exists, else a synthetic dir: ref to the parent path (never null while nested), root=null. ★RULE Q1=b
  const pp = parentPathOf(loc);
  let parent = null;
  if (pp != null) parent = byLoc.has(pp) ? `ior:instance:${byLoc.get(pp)}` : `dir:${pp}`;
  // (2) children — one ref per real fs entry: existing child folder-unit ior, else dir:/file: synthetic ref. ★RULE Q2
  const abs = locToAbs(loc);
  let children = Array.isArray(m.children) ? [...m.children] : [];
  if (abs && fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
    const ents = fs.readdirSync(abs, { withFileTypes: true });
    children = ents.map((e) => { const childLoc = `${loc}/${e.name}`; if (byLoc.has(childLoc)) return `ior:instance:${byLoc.get(childLoc)}`; return e.isDirectory() ? `dir:${childLoc}` : `file:${childLoc}`; });
  }
  // resulting-state counts (simulate the repaired unit, in scenario/index)
  const childrenEmpty = children.length === 0;
  const nested = pp != null;
  const fsHas = !!abs && fs.existsSync(abs) && fs.statSync(abs).isDirectory() && fs.readdirSync(abs).length > 0;
  if (childrenEmpty && fsHas) willEmptyFs++;
  if (parent == null && nested) willNullNested++;
  // willOutside: after apply every unit is in scenario/index → 0
  plan.push({ uuid: m.uuid, loc, parent, childrenCount: children.length, repaired: { ...unit, model: { ...m, parent, children } } });
}

console.log(`=== migrate-folder-units ${APPLY ? '(APPLY)' : '(DRY-RUN — no writes)'} — ${all.length} folder units ===`);
console.log(`PREDICTED post-repair counts: empty-model-nonempty-fs=${willEmptyFs} · null-parent-while-nested=${willNullNested} · outside-one-store=${APPLY ? 0 : '(would be 0 after move)'}`);
const gateOk = willEmptyFs === 0 && willNullNested === 0;
console.log(`gateOk (children+parent repair reaches 0/0): ${gateOk}`);
// sample a few for eyeballing
for (const p of plan.filter((x) => ['src/demo', 'src', 'src/ts', 'scrum.pmo/sprints/sprint-02-identity-ssh/diagrams', 'rawbin:ts', 'roomcoll:3231db71-d834-435a-a7f9-a801680ccd62:files/Trash'].includes(x.loc))) {
  console.log(`  ${p.loc}  parent=${p.parent}  children=${p.childrenCount}`);
}
if (!APPLY) { console.log('\nDRY-RUN only. --apply writes the repaired models + relocates to scenario/index (HELD for architect confirm on Q1/Q2/Q3 + the become-a-unit store-move/symlink mechanism).'); process.exit(0); }
console.error('APPLY path intentionally not implemented yet — store-move must go through the become-a-unit path (architect), not a raw file move that the running server would not see. Aborting.');
process.exit(2);
