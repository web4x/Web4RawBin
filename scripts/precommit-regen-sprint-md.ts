/**
 * Precommit: regenerate the AFFECTED sprint(s)' per-sprint MD (planning.md / requirements.md / task-*.md) when their
 * scenario units are staged — ITEM-1 HOLE FIX (PO 2026-08-17).
 *
 * WHY: the precommit hook already regenerates the sprints.overview index + the campaign board + approve-queue on a
 * staged unit, but NOT the per-sprint MD — those were only check:sprint-md POST-HOC (CI). So a UNIT-ONLY tick-commit
 * (e.g. req advancing a task's statusChecklist, 1 file) landed a credit while the per-sprint task-MD stayed STALE
 * until the next manual regen = "a credit landed and the board did not move" — the exact promise item-1 makes
 * impossible. This closes it: staging a Task/Requirement/Sprint/UC unit regenerates its sprint's MD IN THE SAME COMMIT.
 *
 * ONE SOURCE, not a 2nd path: reuses generate-sprint-md.ts (the SAME generator check:sprint-md uses) —
 * affectedSprintUuids() resolves which sprint(s) render the staged units, generateSprint() writes via the C7/owned-
 * output guardedWrite (hand-authored preserved, NO deletion), checkSprint() self-verifies convergence. TARGETED (only
 * the affected sprint) so a commit never sweeps unrelated sprint drift in as a side effect.
 *
 * Run: node --import tsx scripts/precommit-regen-sprint-md.ts [--bite]   (default = regen staged; --bite = stub-must-fail)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  allUnits, buildSprintOutput, generateSprint, checkSprint, affectedSprintUuids,
  SPRINTS_DIR, GENERATED_HEADER_PREFIX,
} from './generate-sprint-md.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fail = (m: string): never => { console.error(`FAIL precommit-regen-sprint-md: ${m}`); process.exit(1); };

// Staged scenario-unit uuids (from the sharded path scenario/index/<h>/<h>/<h>/<h>/<h>/<uuid>.scenario.json).
function stagedUnitUuids(): Set<string> {
  const set = new Set<string>();
  let names: string[] = [];
  try { names = execFileSync('git', ['diff', '--cached', '--name-only'], { cwd: ROOT, encoding: 'utf-8' }).split('\n'); } catch { return set; }
  for (const n of names) {
    const m = /scenario\/index\/(?:[0-9a-z]\/){5,}([0-9a-f-]{36})\.scenario\.json$/.exec(n.trim());
    if (m) set.add(m[1]);
  }
  return set;
}

// [--bite] STUB-MUST-FAIL (the PO proof, in-memory over REAL units, no disk mutation): a UNIT-ONLY checklist advance
// must (a) make the resolver TARGET its sprint, (b) CHANGE the derived MD (so the regen is necessary + effective), and
// (c) make checkSprint on the UN-regenerated on-disk go RED. A hook/gate that cannot catch the unit-only case is
// exactly what we just lived through — so this asserts all three on a currently-CLEAN sprint (clean-before -> RED-after).
function bite(): void {
  const units = allUnits();
  const bare = (r: unknown): string => String(r).replace('ior:instance:', '');
  let picked: { sprint: string; task: string } | null = null;
  for (const s of units.values()) {
    if (s.ior !== 'ior:class:Sprint') continue;
    const sUuid = String(s.model.uuid);
    if (!checkSprint(sUuid, units).ok) continue; // need a CLEAN sprint so clean-before -> RED-after is unambiguous
    for (const t of (((s.model as Record<string, unknown>).tasks as string[]) || [])) {
      const tu = bare(t);
      const task = units.get(tu);
      const cl = String((task?.model as Record<string, unknown> | undefined)?.statusChecklist ?? '');
      if (task && /- \[ \]/.test(cl)) { picked = { sprint: sUuid, task: tu }; break; }
    }
    if (picked) break;
  }
  if (!picked) fail('bite: found no CLEAN current sprint with an unticked-checklist task to exercise the proof');
  const { sprint, task } = picked;

  const cleanBefore = checkSprint(sprint, units).ok === true;              // (pre) on-disk == regen-of-real-units
  const targeted = affectedSprintUuids(new Set([task]), units).includes(sprint); // (a) resolver targets the sprint

  const orig = units.get(task)!;
  const om = orig.model as Record<string, unknown>;
  const tickedCl = String(om.statusChecklist).replace('- [ ]', '- [x]');   // simulate a UNIT-ONLY tick, in memory
  const mod = new Map(units);
  mod.set(task, { ...orig, model: { ...om, statusChecklist: tickedCl } });

  const before = buildSprintOutput(sprint, units)!;
  const after = buildSprintOutput(sprint, mod)!;
  let mdChanged = false;                                                    // (b) the tick changes the derived MD
  for (const [name, content] of after.files) if (before.files.get(name) !== content) { mdChanged = true; break; }

  const redAfter = checkSprint(sprint, mod).ok === false;                   // (c) un-regenerated on-disk -> RED

  const ok = cleanBefore && targeted && mdChanged && redAfter;
  console.log(`bite: clean-before=${cleanBefore} resolver-targets-sprint=${targeted} unit-tick-changes-MD=${mdChanged} un-regenerated-goes-RED=${redAfter} => ${ok ? 'PASS (unit-only tick -> targeted regen necessary + un-regenerated RED; the promise a-credit-cannot-land-without-the-board-moving is enforceable)' : 'FAIL'}`);
  process.exit(ok ? 0 : 1);
}

function main(): void {
  if (process.argv.includes('--bite')) return bite();

  const staged = stagedUnitUuids();
  if (staged.size === 0) { console.log('OK precommit-regen-sprint-md: no staged scenario units — per-sprint MD unchanged.'); return; }
  const units = allUnits();
  const affected = affectedSprintUuids(staged, units);
  if (affected.length === 0) { console.log('OK precommit-regen-sprint-md: staged units render in no sprint MD (Class/Method/Impl/Test) — nothing to regen.'); return; }

  const toStage: string[] = [];
  for (const sprintUuid of affected) {
    const out = buildSprintOutput(sprintUuid, units);
    if (!out) continue;
    generateSprint(sprintUuid, units); // writes owned MD via guardedWrite (C7/hand-authored preserved; never deletes)
    const chk = checkSprint(sprintUuid, units); // self-verify tripwire: freshly-written MUST byte-match regen-of-units
    if (!chk.ok) fail(`sprint ${out.sprintSlug} did NOT converge after regen (missing=${chk.missing.join(',')} mismatched=${chk.mismatched.join(',')}) — a generator bug, not a race`);
    for (const name of out.files.keys()) { // stage ONLY owned/generated files (never a hand-authored file)
      const fp = path.join(SPRINTS_DIR, out.sprintSlug, name);
      try { if (fs.existsSync(fp) && fs.readFileSync(fp, 'utf-8').startsWith(GENERATED_HEADER_PREFIX)) toStage.push(path.relative(ROOT, fp)); } catch { /* skip */ }
    }
  }
  if (toStage.length) {
    execFileSync('git', ['add', '--', ...toStage], { cwd: ROOT });
    console.log(`OK precommit-regen-sprint-md: regenerated + staged ${toStage.length} MD file(s) across ${affected.length} affected sprint(s) — committed-MD == regen-of-units BY CONSTRUCTION.`);
  } else {
    console.log('OK precommit-regen-sprint-md: affected sprint MD already current (nothing to stage).');
  }
}

main();
