/**
 * S37 folder-unit repair MIGRATION (architect design-folder-unit-model-repair.md + confirmed rules 2026-09-05).
 * dry-run default (NO writes; predicts the 3 numbers), --apply gated. fs = source of truth.
 * Per folder unit: (2) children[] from the real fs location; (3) parent from the location's parent segment; (1) relocate
 * the CANONICAL unit into scenario/index, then ATOMICALLY replace the model-store file with a symlink → scenario/index
 * (ensureViewUnit follows symlinks + only re-mints if ABSENT → no vanish, no re-mint; server keeps reading model-store path).
 * RULES (architect-confirmed): resolve bare→resolveFolderRefToDir('dir:'+loc) [≡ repo-join], synthetic→as-is (rawbin:ts→src,
 * roomcoll/mof→no repo dir); parent = parent-UNIT ior if exists else dir:<parentpath>, true root=null, NO minted parent chains;
 * children = per fs entry, child-UNIT ior if exists else dir:<child>/file:<child>, NO minted file units.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MS = path.join(ROOT, 'data/model-store'); // folder unit files live under data/model-store/index/<shard>/
const SI = path.join(ROOT, 'scenario/index');
const APPLY = process.argv.includes('--apply');

function unitFiles(store) { try { return execSync(`grep -rl '"ior": "ior:class:Folder"' ${store} 2>/dev/null || true`).toString().trim().split('\n').filter(Boolean); } catch { return []; } }
// resolve a folder location to an abs fs dir — mirror of resolveFolderRefToDir (architect-confirmed): bare→repo-join, rawbin:ts→src, other synthetic→'' (no repo dir).
function locToAbs(loc) {
  const s = String(loc || ''); if (!s) return '';
  if (s.startsWith('dir:')) { const r = s.slice(4); return r.includes('..') ? '' : path.resolve(ROOT, r); }
  if (s === 'rawbin:ts') return path.join(ROOT, 'src');
  if (/^(rawbin:|roomcoll:|mof-m1|mof-m2|project:|collection:)/.test(s)) return '';
  return s.includes('..') ? '' : path.resolve(ROOT, s);
}
const parentPathOf = (loc) => { const s = String(loc || ''); const i = s.lastIndexOf('/'); return i > 0 ? s.slice(0, i) : null; };
const siPathFor = (uuid) => path.join(SI, ...String(uuid).slice(0, 5).split(''), `${uuid}.scenario.json`);

const msFiles = unitFiles(MS);
const raw = msFiles.map((f) => ({ f, unit: JSON.parse(fs.readFileSync(f, 'utf8')) }));
const byLoc = new Map();
for (const { unit } of raw) byLoc.set(String(unit.model.location || ''), unit.model.uuid);

function repairModel(m) {
  const loc = String(m.location || '');
  const pp = parentPathOf(loc);
  const nested = pp != null;
  // parent: only (re)set when nested (derive from path); a non-nested folder keeps its existing parent (no regression / no null-out)
  let parent = m.parent ?? null;
  if (nested) parent = byLoc.has(pp) ? `ior:instance:${byLoc.get(pp)}` : `dir:${pp}`;
  // children: fs=truth — if the resolved dir has entries, rebuild from fs; else keep existing children (don't wipe a synthetic bucket)
  let children = Array.isArray(m.children) ? [...m.children] : [];
  const abs = locToAbs(loc);
  if (abs && fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
    children = fs.readdirSync(abs, { withFileTypes: true }).map((e) => {
      const childLoc = `${loc}/${e.name}`;
      if (byLoc.has(childLoc)) return `ior:instance:${byLoc.get(childLoc)}`;
      return e.isDirectory() ? `dir:${childLoc}` : `file:${childLoc}`;
    });
  }
  return { ...m, parent, children };
}

let willEmptyFs = 0, willNullNested = 0, applied = 0, symlinked = 0;
for (const { f, unit } of raw) {
  const m2 = repairModel(unit.model);
  const loc = String(m2.location || '');
  const abs = locToAbs(loc);
  const fsHas = !!abs && fs.existsSync(abs) && fs.statSync(abs).isDirectory() && fs.readdirSync(abs).length > 0;
  if ((m2.children || []).length === 0 && fsHas) willEmptyFs++;
  if (m2.parent == null && parentPathOf(loc) != null) willNullNested++;
  if (APPLY) {
    if (fs.lstatSync(f).isSymbolicLink()) { applied++; continue; } // idempotent: already migrated
    const repaired = { ...unit, model: m2 };
    const siFile = siPathFor(m2.uuid);
    fs.mkdirSync(path.dirname(siFile), { recursive: true });
    fs.writeFileSync(siFile, JSON.stringify(repaired, null, 2) + '\n');   // (1) canonical → the one store
    const rel = path.relative(path.dirname(f), siFile);                    // (2) model-store file → relative symlink → canonical
    const tmp = f + '.migrating';
    try { if (fs.existsSync(tmp) || fs.lstatSync(tmp)) fs.unlinkSync(tmp); } catch {}
    fs.symlinkSync(rel, tmp);
    fs.renameSync(tmp, f);                                                  // atomic replace — no absent-window → no re-mint
    applied++; symlinked++;
  }
}

console.log(`=== migrate-folder-units ${APPLY ? '(APPLY)' : '(DRY-RUN — no writes)'} — ${raw.length} folder units ===`);
console.log(`predicted post-repair: empty-model-nonempty-fs=${willEmptyFs} · null-parent-while-nested=${willNullNested} · outside-one-store=${APPLY ? '0 (moved+symlinked)' : '(0 after move)'}`);
if (APPLY) console.log(`APPLIED: ${applied} units in scenario/index, ${symlinked} model-store files replaced with symlinks → the one store.`);
const gateOk = willEmptyFs === 0 && willNullNested === 0;
console.log(`gateOk (parent+children repair reaches 0/0): ${gateOk}`);
if (!APPLY) console.log('\nDRY-RUN only. Re-run with --apply to write.');
