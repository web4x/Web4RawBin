/**
 * Precommit: regenerate the AFFECTED sprint(s)' per-sprint MD when their scenario units are staged — ITEM-1 HOLE FIX
 * (PO 2026-08-17), made SATISFIABLE (PO 2026-08-17 fix-1/fix-2).
 *
 * WHY: the precommit hook regenerated overview + board + approve on a staged unit, but the per-sprint planning/
 * requirements/task-MD were ONLY check:sprint-md POST-HOC (CI). So a UNIT-ONLY tick landed a credit while its sprint's
 * task-MD stayed STALE = "a credit landed and the board did not move". This regenerates the affected sprint views IN
 * THE SAME COMMIT — reusing the SAME generator check:sprint-md uses (generate-sprint-md.ts). One source, not a 2nd.
 *
 * SATISFIABLE (fix-1, the important one): the hook must distinguish drift THIS COMMIT introduces (BLOCK, fail-closed)
 * from PRE-EXISTING drift (REPORT loudly, DO NOT block) — a gate that is red-from-birth against legacy debt gets
 * --no-verify'd, and a bypassed gate is a deleted gate. So we:
 *   (1) SKIP frozen-legacy sprints (num <= 18, hand-authored, not generator-managed — same boundary as --check --all);
 *   (2) write + stage ONLY the files that RENDER a staged unit (the task's own MD + planning.md for a task, etc.) — we
 *       NEVER create/stage a sprint's OTHER (pre-existing-missing) files: that is reconciliation = PLANNER lane, and it
 *       would sweep unrelated debt into this commit and hide it;
 *   (3) BLOCK only on a CONVERGENCE failure — a file we JUST WROTE that still does not byte-match regen-of-units (a real
 *       generator bug); a commit can never introduce per-sprint-MD drift that survives our targeted write;
 *   (4) REPORT the sprint's remaining PRE-EXISTING drift LOUDLY and NAMING ALL THREE (missing / mismatched / extra) —
 *       never block on it (fix-2: the old fail message omitted `extra`, so an orphan read as a mysterious empty failure).
 *
 * Run: node --import tsx scripts/precommit-regen-sprint-md.ts [--bite]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { ScenarioUnit } from '../src/ts/scenario/index.js';
import {
  allUnits, buildSprintOutput, checkSprint, affectedSprintUuids, speakingSlug,
  SPRINTS_DIR, GENERATED_HEADER_PREFIX, isSprintMdOwnedName, type SprintOutput,
} from './generate-sprint-md.js';
import { guardedWrite } from './owned-output-guard.js';
import { sprintNumOf, isCurrentEra } from '../src/ts/scenario/sprint-pin-resolver.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bareRef = (r: unknown): string => String(r).replace('ior:instance:', '');
const fail = (m: string): never => { console.error(`FAIL precommit-regen-sprint-md: ${m}`); process.exit(1); };

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

// Which of a sprint's generated files RENDER a staged unit — so we touch ONLY the staged units' views, never the
// sprint's other (possibly pre-existing-drifted) files. Task -> planning.md + the task's own MD (the out.files entry
// embedding [task:uuid:<u>]); Requirement/UC -> requirements.md; the Sprint itself -> planning.md + requirements.md.
export function affectedFiles(staged: Set<string>, sprintUnit: ScenarioUnit, out: SprintOutput, units: Map<string, ScenarioUnit>): Set<string> {
  const files = new Set<string>();
  const m = sprintUnit.model as Record<string, unknown>;
  if (staged.has(String(m.uuid))) { files.add('planning.md'); files.add('requirements.md'); }
  for (const r of ((m.requirements as string[]) || [])) {
    const ru = bareRef(r);
    if (staged.has(ru)) files.add('requirements.md');
    const req = units.get(ru);
    if (req) for (const uc of (((req.model as Record<string, unknown>).useCases as string[]) || [])) if (staged.has(bareRef(uc))) files.add('requirements.md');
  }
  const seen = new Set<string>();
  const walk = (u: string): void => {
    if (seen.has(u)) return; seen.add(u);
    const tu = units.get(u);
    if (staged.has(u) && tu) {
      files.add('planning.md');                 // the task's row + status glyph live in planning.md
      const own = `${speakingSlug(tu)}.md`;     // the task's OWN MD (buildSprintOutput names it by slug) — NOT any file
      if (out.files.has(own)) files.add(own);    // that merely REFERENCES the uuid (a parent uuid appears in child MDs;
                                                 // matching that would touch siblings + could sweep THEIR pre-existing drift)
    }
    if (tu) for (const c of (((tu.model as Record<string, unknown>).children as string[]) || [])) walk(bareRef(c));
  };
  for (const t of ((m.tasks as string[]) || [])) walk(bareRef(t));
  return files;
}

// BLOCK-vs-REPORT split (fix-1). BLOCK only a CONVERGENCE failure: a file we JUST WROTE that still mismatches
// regen-of-units (a real generator bug). Everything else — orphaned `extra`, `missing` files we did NOT write, and
// `mismatched` files we did NOT write — is PRE-EXISTING debt this commit did not introduce: REPORT (all three), never
// block. Pure + exported so --bite proves it can both PASS (pre-existing -> report) and FAIL (convergence -> block).
export function classifyDrift(
  chk: { missing: string[]; extra: string[]; mismatched: string[] },
  written: Set<string>,
): { block: string[]; report: { missing: string[]; extra: string[]; mismatched: string[] } } {
  const block = chk.mismatched.filter((f) => written.has(f)); // wrote it, still wrong => generator did not converge
  return {
    block,
    report: {
      missing: chk.missing.slice(),                              // pre-existing (planner reconciles / prunes)
      extra: chk.extra.slice(),                                  // orphaned generated file (fix-2: NAME it)
      mismatched: chk.mismatched.filter((f) => !written.has(f)), // drifted but not ours to fix this commit
    },
  };
}

function bite(): void {
  const A: { ok: boolean; msg: string }[] = [];
  const assert = (ok: boolean, msg: string) => A.push({ ok, msg });

  // (fix-1 SATISFIABILITY) a sprint whose ONLY drift is a pre-existing orphan (`extra`) + a `missing` we did NOT write
  // must NOT block — block is empty, and BOTH are reported.
  const preExisting = classifyDrift({ missing: ['task-x.md'], extra: ['orphan.md'], mismatched: [] }, new Set());
  assert(preExisting.block.length === 0, 'SATISFIABLE: pre-existing extra+missing (not-written) does NOT block');
  // (fix-2) the report NAMES ALL THREE — the orphan `extra` is not swallowed into a mysterious empty failure.
  assert(preExisting.report.extra.includes('orphan.md') && preExisting.report.missing.includes('task-x.md'),
    'FIX-2: report names extra AND missing (all three surfaced, no mysterious empty failure)');
  // (fix-1 STRICT) a CONVERGENCE failure — a file we WROTE still mismatches — DOES block (the gate can still fail).
  const converge = classifyDrift({ missing: [], extra: [], mismatched: ['planning.md'] }, new Set(['planning.md']));
  assert(converge.block.includes('planning.md'), 'STRICT: a written file that did not converge BLOCKS (gate can fail)');
  // a mismatched file we did NOT write is pre-existing -> report, not block.
  const notOurs = classifyDrift({ missing: [], extra: [], mismatched: ['other-task.md'] }, new Set());
  assert(notOurs.block.length === 0 && notOurs.report.mismatched.includes('other-task.md'),
    'SATISFIABLE: a mismatched file we did NOT write is reported, not blocked');

  // (promise still holds) a staged task's affected files include planning.md AND the task's own MD, on REAL units.
  const units = allUnits();
  let promiseOk = false, taskLabel = '';
  for (const s of units.values()) {
    if (s.ior !== 'ior:class:Sprint' || !isCurrentEra(sprintNumOf(s))) continue;
    const out = buildSprintOutput(String(s.model.uuid), units);
    if (!out) continue;
    for (const t of (((s.model as Record<string, unknown>).tasks as string[]) || [])) {
      const tu = bareRef(t);
      const tuUnit = units.get(tu);
      if (!tuUnit) continue;
      const files = affectedFiles(new Set([tu]), s, out, units);
      const own = `${speakingSlug(tuUnit)}.md`; // the task's OWN MD — must be exactly the file affectedFiles targets
      if (files.has('planning.md') && out.files.has(own) && files.has(own) && files.size === 2) { promiseOk = true; taskLabel = `${out.sprintSlug}/${own}`; }
      break;
    }
    if (promiseOk) break;
  }
  assert(promiseOk, `PROMISE: a staged task's affected files = planning.md + its own task-MD (${taskLabel})`);

  const failed = A.filter((a) => !a.ok);
  for (const a of A) console.log(`  ${a.ok ? '✓' : '✗ FAIL'} ${a.msg}`);
  if (failed.length) { console.log(`\n✗ bite: ${failed.length}/${A.length} FAILED`); process.exit(1); }
  console.log(`\n✓ bite: ${A.length}/${A.length} — satisfiable (pre-existing REPORTED not blocked, all three named) + still strict (convergence failure BLOCKS) + promise holds (affected views move)`);
  process.exit(0);
}

function main(): void {
  if (process.argv.includes('--bite')) return bite();

  const staged = stagedUnitUuids();
  if (staged.size === 0) { console.log('OK precommit-regen-sprint-md: no staged scenario units — per-sprint MD unchanged.'); return; }
  const units = allUnits();
  const affected = affectedSprintUuids(staged, units);
  if (affected.length === 0) { console.log('OK precommit-regen-sprint-md: staged units render in no sprint MD — nothing to regen.'); return; }

  const toStage: string[] = [];
  const reports: { slug: string; missing: string[]; extra: string[]; mismatched: string[] }[] = [];
  for (const sprintUuid of affected) {
    const sprintUnit = units.get(sprintUuid);
    if (!sprintUnit) continue;
    if (!isCurrentEra(sprintNumOf(sprintUnit))) { console.log(`  · skip frozen-legacy ${sprintUuid.slice(0, 8)} (hand-authored, not generator-managed)`); continue; }
    const out = buildSprintOutput(sprintUuid, units);
    if (!out) continue;

    // (2) write ONLY the files that render a staged unit — never the sprint's other (pre-existing) files.
    const written = new Set<string>();
    for (const name of affectedFiles(staged, sprintUnit, out, units)) {
      const content = out.files.get(name);
      if (content === undefined) continue;
      if (guardedWrite(path.join(SPRINTS_DIR, out.sprintSlug, name), content, GENERATED_HEADER_PREFIX, isSprintMdOwnedName)) written.add(name);
    }

    // (3)+(4) block-vs-report split
    const { block, report } = classifyDrift(checkSprint(sprintUuid, units), written);
    if (block.length) fail(`sprint ${out.sprintSlug}: regen did NOT converge for [${block.join(', ')}] — a generator bug (a file we wrote still mismatches regen-of-units)`);
    for (const name of written) { // stage ONLY the owned/generated files we wrote
      const fp = path.join(SPRINTS_DIR, out.sprintSlug, name);
      try { if (fs.existsSync(fp) && fs.readFileSync(fp, 'utf-8').startsWith(GENERATED_HEADER_PREFIX)) toStage.push(path.relative(ROOT, fp)); } catch { /* skip */ }
    }
    if (report.missing.length || report.extra.length || report.mismatched.length) reports.push({ slug: out.sprintSlug, ...report });
  }

  if (toStage.length) {
    execFileSync('git', ['add', '--', ...toStage], { cwd: ROOT });
    console.log(`OK precommit-regen-sprint-md: regenerated + staged ${toStage.length} affected view(s) — the staged units' derived views moved IN THIS COMMIT (by construction).`);
  } else {
    console.log('OK precommit-regen-sprint-md: staged units\' affected views already current (nothing to stage).');
  }

  // (4) PRE-EXISTING debt: LOUD, all three, NEVER blocks (report-only-then-strict; planner lane reconciles/prunes).
  if (reports.length) {
    console.warn('\n⚠ PRE-EXISTING sprint-MD debt — NOT introduced by this commit, REPORTED not blocked (planner lane to reconcile/prune):');
    for (const r of reports) {
      console.warn(`  ${r.slug}:`);
      for (const f of r.missing) console.warn(`    missing:    ${f}`);
      for (const f of r.mismatched) console.warn(`    mismatched: ${f}`);
      for (const f of r.extra) console.warn(`    extra:      ${f}`);
    }
  }
}

main();
