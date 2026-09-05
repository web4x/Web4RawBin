/**
 * S37 folder-unit repair — FAILABLE CHECK (architect design-folder-unit-model-repair.md). Three single numbers, each
 * must be 0 (the model DESCRIBES the fs it models; parent-truth in ONE place; folders in the one store). Self-biting.
 *   1. empty-model-nonempty-fs        — Folder units with children=[] while their fs location HAS entries.
 *   2. null-parent-while-nested       — Folder units with parent=null while location is nested (has a parent folder).
 *   3. folder-unit-outside-one-store  — Folder units NOT in scenario/index (still in data/model-store).
 * report-only until 0 (default), --strict = exit 1 on any non-zero (wire to ci:gates at 0). --selftest proves failable.
 * NOTE: rule details (Q1 nested-def / Q3 resolver) pending architect confirm — marked ★RULE so they are trivial to flip.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MS = path.join(ROOT, 'data/model-store');
const SI = path.join(ROOT, 'scenario/index');
const STRICT = process.argv.includes('--strict');
const SELFTEST = process.argv.includes('--selftest');

function folderUnitsIn(store) {
  let out = [];
  try { out = execSync(`grep -rl '"ior": "ior:class:Folder"' ${store} 2>/dev/null || true`).toString().trim().split('\n').filter(Boolean); } catch { out = []; }
  return out.map((f) => ({ f, m: JSON.parse(fs.readFileSync(f, 'utf8')).model }));
}

// ★RULE Q3: resolve a folder's `location` to an absolute fs dir (fs = source of truth). bare path → repo-join;
// dir:/rawbin: synthetic → the server resolver's mapping (rawbin:ts→src); roomcoll:/mof:/project: → no repo dir (skip).
function locToAbs(loc) {
  const s = String(loc || '');
  if (!s) return '';
  if (s.startsWith('dir:')) return path.join(ROOT, s.slice(4));
  if (s === 'rawbin:ts') return path.join(ROOT, 'src');
  if (/^(rawbin:|roomcoll:|mof-m1|mof-m2|project:|collection:)/.test(s)) return ''; // synthetic bucket, not a repo dir
  return path.join(ROOT, s); // bare repo-relative path (src/demo, public/ts, scrum.pmo/.../diagrams)
}
function fsHasEntries(loc) { const a = locToAbs(loc); try { return !!a && fs.existsSync(a) && fs.statSync(a).isDirectory() && fs.readdirSync(a).length > 0; } catch { return false; } }

// ★RULE Q1: "nested" = location has a parent path segment (a "/" that yields a non-empty parent). A true root
// (no "/", e.g. src, rawbin:ts, mof-m1) is legitimately parent=null. (If architect says nested:=parent-UNIT-exists, flip here.)
function isNested(loc) { const s = String(loc || ''); const i = s.lastIndexOf('/'); return i > 0; }

function counts(units) {
  let emptyModelNonemptyFs = 0, nullParentWhileNested = 0;
  for (const { m } of units) {
    const childrenEmpty = !Array.isArray(m.children) || m.children.length === 0;
    if (childrenEmpty && fsHasEntries(m.location)) emptyModelNonemptyFs++;
    if (m.parent == null && isNested(m.location)) nullParentWhileNested++;
  }
  return { emptyModelNonemptyFs, nullParentWhileNested };
}

const inStore = folderUnitsIn(MS);
const inIndex = folderUnitsIn(SI);
const all = [...inStore, ...inIndex];
const c = counts(all);
const outsideOneStore = inStore.length;

// SELF-BITE: the counters must be non-zero on the KNOWN-damaged current state (proves the check can fail).
if (SELFTEST) {
  const anyRed = c.emptyModelNonemptyFs > 0 || c.nullParentWhileNested > 0 || outsideOneStore > 0;
  if (!anyRed) { console.error('✗ SELF-TEST FAILED — all three counts are 0 on a state expected RED; the check is inert or already repaired. Verify manually before trusting green.'); process.exit(1); }
  console.log(`✓ SELF-TEST — check is failable (currently RED): empty-model-nonempty-fs=${c.emptyModelNonemptyFs}, null-parent-while-nested=${c.nullParentWhileNested}, outside-one-store=${outsideOneStore}.`);
  process.exit(0);
}

console.log('=== S37 folder-unit repair — model-describes-fs check ===');
console.log(`  1. empty-model-nonempty-fs      : ${c.emptyModelNonemptyFs}`);
console.log(`  2. null-parent-while-nested     : ${c.nullParentWhileNested}`);
console.log(`  3. folder-unit-outside-one-store: ${outsideOneStore}  (model-store ${inStore.length} / scenario-index ${inIndex.length})`);
const total = c.emptyModelNonemptyFs + c.nullParentWhileNested + outsideOneStore;
if (total === 0) { console.log('\n✓ GREEN — all three numbers are 0. The folder-unit class describes the fs, parent-truth is in the field, folders live in the one store.'); process.exit(0); }
console.error(`\n${STRICT ? '✗ RED' : '⚠ RED (report-only)'} — ${total} across the three numbers; repair not complete.`);
process.exit(STRICT ? 1 : 0);
