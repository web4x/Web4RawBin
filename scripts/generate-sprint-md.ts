// [test:uuid:9dbf5538-4c27-4591-8d91-051b487c3924]
/**
 * T188 — Generate sprint planning.md + per-task .md from scenario units.
 * Writes INTO scrum.pmo/sprints/<sprint>/ replacing hand-authored files.
 * Each generated file starts with '<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->'
 *
 * Usage:
 *   npx tsx scripts/generate-sprint-md.ts <sprint-uuid>           # generate for one sprint
 *   npx tsx scripts/generate-sprint-md.ts --all                   # generate for all sprints
 *   npx tsx scripts/generate-sprint-md.ts --list                  # list available sprints
 *   npx tsx scripts/generate-sprint-md.ts --check --all           # byte-diff vs on-disk (CI)
 *   npx tsx scripts/generate-sprint-md.ts --check <sprint-uuid>   # byte-diff one sprint
 *
 * Determinism: sort all map/set iteration by uuid/slug; LF only; single
 * trailing newline; no timestamps or locale formatting.
 *
 * [impl:uuid:8a31ba75-22b6-48ff-9532-d5da21458543] T188 ViewGenerator dogfood
 * [impl:uuid:ee738f5f-ad04-4435-a38b-ccf1d124332f] T188 checkRoundTrip
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, type ScenarioUnit } from '../src/ts/scenario/index.js';
import { sprintPrefix } from '../src/ts/scenario/sprint-label.js'; // R40.4 single-source sprint-number atom
import { guardedWrite, guardedDelete } from './owned-output-guard.js'; // shared owned-output chokepoint (architect 38ba4a160)
import { sprintNumOf, isCurrentEra } from '../src/ts/scenario/sprint-pin-resolver.js'; // ONE frozen-legacy boundary (num>18)
import { statusSymbol, deriveStatusEnum } from '../src/ts/scenario/task-status.js'; // Tron#1: at-a-glance status glyph + checklist-derived Done (single-source, no stored status field)

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
export const SPRINTS_DIR = path.join(__dirname, '../scrum.pmo/sprints');
export const GENERATED_HEADER = '<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->';

// OWNERSHIP = the stable PREFIX, the ONE definition of "generator-owned" (PO ruling 2026-08-11). The full header's
// punctuation once drifted (em-dash — vs hyphen -), and an EXACT-string guard treated a drifted file as hand-authored
// and refused to update it FOREVER = two-representations-of-one-header (a mini two-sources bug). Matching the prefix
// (everything BEFORE the punctuation) means a header punctuation change never orphans an owned file; a file carrying
// this prefix is DECLARING itself generated (the marker's intent). Used for write/delete/check/prune ownership alike.
export const GENERATED_HEADER_PREFIX = '<!-- GENERATED FROM SCENARIO UNITS';

// The generator's owned-output NAME whitelist: bare *.md it emits (planning.md, requirements.md, task-*.md);
// never a diagrams/*.puml or a design-*.md brief. (Path-escape is handled by the guard's isConfinedName.)
// Exported so the owned-output-guard call and the tester's B2 static check share ONE definition (DRY).
export const isSprintMdOwnedName = (n: string): boolean =>
  n.endsWith('.md') && !n.endsWith('.puml') && !/^design-.*\.md$/.test(n);

const idx = new ScenarioIndex(INDEX_DIR);

export function allUnits(): Map<string, ScenarioUnit> {
  const m = new Map<string, ScenarioUnit>();
  const uuids = [...idx.list()].sort();
  for (const uuid of uuids) {
    const u = idx.get(uuid);
    if (u) m.set(String(u.model.uuid || uuid), u);
  }
  return m;
}

function speakingSlug(unit: ScenarioUnit): string {
  const slug = unit.model.slug as string;
  if (slug) return slug;
  const name = String(unit.model.name || '');
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function normalize(s: string): string {
  return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/g, '') + '\n';
}

// [impl:uuid:88744d89-4520-471e-b732-2d2d2504f817] R27.3 generateTaskMd — per-task-MD (slug-drift + planning.md-collapse fix)
function generateTaskMd(task: ScenarioUnit): string {
  const m = task.model as Record<string, unknown>;
  const lines = [
    GENERATED_HEADER,
    '',
    `[Back to Planning](./planning.md)`,
    '',
    `# ${m.name || '(untitled)'}`,
    '',
    `[task:uuid:${m.uuid || ''}]`,
    '',
    '## Status',
    String(m.statusChecklist || `- [ ] Planned\n- [ ] In Progress\n- [ ] Done`),
    '',
  ];
  if (m.remainingIssues) lines.push('## Remaining Issues', '', String(m.remainingIssues), '');
  if (m.traceability) lines.push('## Traceability', '', String(m.traceability), '');
  if (m.description) lines.push('## Task Description', '', String(m.description), '');
  if (m.context) lines.push('## Context', '', String(m.context), '');
  if (m.intention) lines.push('## Intention', '', String(m.intention), '');
  if (m.acceptanceCriteria) lines.push('## Acceptance Criteria', '', String(m.acceptanceCriteria), '');
  if (m.architectDesign) lines.push('## Architect Design', '', String(m.architectDesign), '');
  if (m.implementation) lines.push('## Implementation', '', String(m.implementation), '');
  if (m.dependencies) lines.push('## Dependencies', '', String(m.dependencies), '');
  if (m.definitionOfDone) lines.push('## Definition of Done', '', String(m.definitionOfDone), '');
  if (m.qaAudit) lines.push('## QA Audit & User Feedback', '', String(m.qaAudit), '');
  if (m.subtasks) lines.push('## Subtasks', '', String(m.subtasks), '');
  return normalize(lines.join('\n'));
}

function generatePlanningMd(sprint: ScenarioUnit, units: Map<string, ScenarioUnit>): string {
  const m = sprint.model as Record<string, unknown>;
  const taskIors = ((m.tasks as string[]) || []).slice();

  const childUuids = new Set<string>();
  for (const ior of taskIors) {
    const uuid = String(ior).replace('ior:instance:', '');
    const task = units.get(uuid);
    if (task) for (const c of ((task.model.children as string[]) || [])) childUuids.add(String(c).replace('ior:instance:', ''));
  }

  const lines = [
    GENERATED_HEADER,
    '',
    `[Back to Sprints](../sprints.overview.md)`,
    '',
    `# ${sprintPrefix(m.number)} Planning — ${m.name || '(untitled)'}`,
    '',
    '## Sprint Goal',
    '',
    String(m.goal || ''),
    '',
    `**Status:** ${m.status || 'PLANNED'}`,
    '',
    // [impl:uuid:72c57f72-9609-4272-8738-d7548659ceb3] R30.18 SprintViewGenerator — Task Ordering header (planning.md, folded under R30.18 per PO); emits ONLY when sprint.orderingRationale is set (no-op for other sprints). Chain-to-Test PENDING (tester 0.5, low-pri, after R30.35/R30.36 gates).
    ...(m.orderingRationale ? ['## Task Ordering', '', String(m.orderingRationale), ''] : []),
    '## Tasks',
    '',
  ];

  function renderTask(uuid: string, depth: number) {
    const task = units.get(uuid);
    if (!task) { lines.push(`${'  '.repeat(depth)}- [ ] *${uuid} (not found)*`); return; }
    const tm = task.model as Record<string, unknown>;
    // Tron#1 (law#100 regression fix): derive BOTH the Done checkbox AND the at-a-glance glyph from the CHECKLIST
    // (single-source, R37.5) — NOT the stored status field. The glyph makes QA-Review/In-Progress advances visible;
    // the checkbox flips to [x] only when the checklist has Done checked (never invents a Done — guardrail #4).
    const cl = String(tm.statusChecklist || '');
    const done = deriveStatusEnum(cl) === 'Done';
    const sym = statusSymbol(cl);
    const slug = speakingSlug(task);
    lines.push(`${'  '.repeat(depth)}- [${done ? 'x' : ' '}] ${sym} [${tm.name || slug}](./${slug}.md)`);
    for (const c of ((tm.children as string[]) || [])) renderTask(String(c).replace('ior:instance:', ''), depth + 1);
  }

  for (const ior of taskIors) {
    const uuid = String(ior).replace('ior:instance:', '');
    if (childUuids.has(uuid)) continue;
    renderTask(uuid, 0);
  }

  return normalize(lines.join('\n'));
}

// [impl:uuid:72c57f72-9609-4272-8738-d7548659ceb3] R30.18 SprintViewGenerator.generateRequirementsMd
// Emit requirements.md as a GENERATED VIEW from the sprint's Requirement units (by-construction fix for
// invisible plannings — Tron's 'where is R30.10-17'). Deterministic: requirements[] order, LF, single trailing NL.
function generateRequirementsMd(sprint: ScenarioUnit, units: Map<string, ScenarioUnit>): string {
  const m = sprint.model as Record<string, unknown>;
  const reqIors = ((m.requirements as string[]) || []).slice();
  const lines = [
    GENERATED_HEADER,
    '',
    `[Back to Planning](./planning.md)`,
    '',
    `# ${sprintPrefix(m.number)} Requirements — ${m.name || '(untitled)'}`,
    '',
    '## Requirements',
    '',
  ];
  for (const ior of reqIors) {
    const uuid = String(ior).replace('ior:instance:', '');
    const req = units.get(uuid);
    if (!req) { lines.push(`- [ ] *${uuid} (not found)*`, ''); continue; }
    const rm = req.model as Record<string, unknown>;
    const done = String(rm.status || '').toLowerCase() === 'done';
    const alt = rm.altId ? `${rm.altId} — ` : '';
    lines.push(`- [${done ? 'x' : ' '}] **${alt}${rm.name || '(untitled)'}**`);
    lines.push(`  [requirement:uuid:${rm.uuid || uuid}]`);
    if (rm.tronQuote) lines.push(`  ${String(rm.tronQuote).replace(/\n/g, '\n  ')}`);
    if (rm.description) lines.push(`  ${String(rm.description).replace(/\n/g, '\n  ')}`);
    const acs = (rm.acceptanceCriteria as Array<Record<string, unknown>>) || [];
    if (acs.length) {
      lines.push('  **Acceptance criteria:**');
      // R31 traceability-honesty: render the REAL checkbox from ac.status (met => [x]) instead of
      // always [ ] — a status-blind [ ] made Tron read every AC as unmet (false 'all-unmet' signal).
      for (const ac of acs) lines.push(`  - [${ac.status === 'met' ? 'x' : ' '}] **(${ac.group || ac.id || ''})** ${ac.text || ''}`);
    }
    for (const uc of ((rm.useCases as string[]) || [])) {
      const ucu = String(uc).replace('ior:instance:', '');
      const ucUnit = units.get(ucu);
      const ucLabel = ucUnit ? String((ucUnit.model as Record<string, unknown>).altId || (ucUnit.model as Record<string, unknown>).name || ucu.slice(0, 8)) : ucu.slice(0, 8);
      lines.push(`  -> ${ucLabel} [uc:uuid:${ucu}]`);
    }
    lines.push('');
  }
  return normalize(lines.join('\n'));
}

export interface SprintOutput {
  sprintSlug: string;
  files: Map<string, string>; // filename → content
}

export function buildSprintOutput(sprintUuid: string, units: Map<string, ScenarioUnit>): SprintOutput | null {
  const sprint = idx.get(sprintUuid);
  if (!sprint || sprint.ior !== 'ior:class:Sprint') return null;
  const sprintSlug = speakingSlug(sprint);
  const files = new Map<string, string>();
  files.set('planning.md', generatePlanningMd(sprint, units));
  files.set('requirements.md', generateRequirementsMd(sprint, units)); // R30.18: requirements.md = generated view

  const m = sprint.model as Record<string, unknown>;
  const taskIors = ((m.tasks as string[]) || []).slice();
  function collectTask(uuid: string) {
    const task = units.get(uuid);
    if (!task) return;
    const slug = speakingSlug(task);
    files.set(`${slug}.md`, generateTaskMd(task));
    for (const c of ((task.model.children as string[]) || [])) collectTask(String(c).replace('ior:instance:', ''));
  }
  for (const ior of taskIors) collectTask(String(ior).replace('ior:instance:', ''));

  return { sprintSlug, files };
}

// [impl:uuid:41c86206-87ee-4e91-b563-a3c41c54819e] R24.4 generateSprint (sprint view generator)
function generateSprint(sprintUuid: string, units: Map<string, ScenarioUnit>) {
  const out = buildSprintOutput(sprintUuid, units);
  if (!out) { console.log(`Not a Sprint: ${sprintUuid}`); return; }
  const sprintDir = path.join(SPRINTS_DIR, out.sprintSlug);
  if (!fs.existsSync(sprintDir)) fs.mkdirSync(sprintDir, { recursive: true });
  console.log(`\nGenerating: ${out.sprintSlug}`);
  // OWNED-OUTPUT GUARD (correct-by-construction; TRON via robbin-po 2026-07-19 → confinement 2026-07-26 →
  // shared chokepoint 2026-08-09, architect design 38ba4a160). The generator OWNS only the files it emits —
  // every generated file carries GENERATED_HEADER. Route EVERY write through the shared helper
  // (scripts/owned-output-guard.ts): create/replace ONLY a path-confined, name-whitelisted *.md whose content
  // carries GENERATED_HEADER, and NEVER clobber a file that exists WITHOUT it (hand-authored: diagnosis brief,
  // design-*.md, diagrams/*.puml, *.png). The inline whitelist was intentionally REMOVED — an inline confinement
  // can silently revert (Option-1, 2026-08-09); the single helper + the tester's B2 anti-regression BITE make the
  // protection impossible to drop undetected. A future prune step routes through guardedRemove (marker-only delete).
  let written = 0, skipped = 0;
  for (const [name, content] of out.files) {
    const wrote = guardedWrite(path.join(sprintDir, name), content, GENERATED_HEADER_PREFIX, isSprintMdOwnedName);
    if (wrote) written++;
    else { console.log(`  ⚠ SKIP (not owned-output or hand-authored, preserved): ${name}`); skipped++; }
  }
  console.log(`  ✓ ${written} files${skipped ? ` (${skipped} hand-authored preserved)` : ''}`);
}

// [impl:uuid:b31ae393-0701-46a8-9296-4ed965e00fc2] SprintViewGenerator.generateAll (Method eddf2836, Class
// SprintViewGenerator 93f9afc7, UC bf1cf902 sprintBoard.reconcileAll) — R37.2 one-time reconcile-all: regenerate
// EVERY sprint's board MD from its units in ONE pass. Pure extraction of the prior inline --all loop (SAME
// behavior, no new logic): units→md only (INV-C1 units untouched), idempotent byte-stable (INV-C2), generated-only
// (INV-C3, OWNED-OUTPUT whitelist in generateSprint), reflects fields never invents status (INV-C4).
function generateAll(sprintUuids: string[], units: Map<string, ScenarioUnit>): void {
  for (const uuid of sprintUuids) generateSprint(uuid, units);
}

interface CheckResult { sprintSlug: string; missing: string[]; extra: string[]; mismatched: string[]; ok: boolean; }

function checkSprint(sprintUuid: string, units: Map<string, ScenarioUnit>): CheckResult {
  const out = buildSprintOutput(sprintUuid, units);
  if (!out) return { sprintSlug: sprintUuid, missing: [], extra: [], mismatched: [], ok: false };
  const result: CheckResult = { sprintSlug: out.sprintSlug, missing: [], extra: [], mismatched: [], ok: true };
  const sprintDir = path.join(SPRINTS_DIR, out.sprintSlug);

  // Walk on-disk files that carry the generated-header PREFIX (the ONE ownership definition — a punctuation-drifted
  // header still counts as generated, so a hyphen/em-dash difference is a mismatch to reconcile, never an orphan to miss).
  const onDiskGenerated = new Set<string>();
  if (fs.existsSync(sprintDir)) {
    for (const f of fs.readdirSync(sprintDir).sort()) {
      if (!f.endsWith('.md')) continue;
      const fp = path.join(sprintDir, f);
      try {
        const content = fs.readFileSync(fp, 'utf-8');
        if (content.startsWith(GENERATED_HEADER_PREFIX)) onDiskGenerated.add(f);
      } catch { /* skip */ }
    }
  }

  // Compare each generated file against on-disk
  const expectedNames = [...out.files.keys()].sort();
  for (const name of expectedNames) {
    const expected = out.files.get(name)!;
    const fp = path.join(sprintDir, name);
    if (!fs.existsSync(fp)) { result.missing.push(name); result.ok = false; continue; }
    const onDisk = normalize(fs.readFileSync(fp, 'utf-8'));
    if (onDisk !== expected) {
      result.mismatched.push(name);
      result.ok = false;
    }
    onDiskGenerated.delete(name);
  }
  // Anything left in onDiskGenerated is an "extra" generated file no longer produced
  for (const name of [...onDiskGenerated].sort()) result.extra.push(name);
  if (result.extra.length > 0) result.ok = false;

  return result;
}

function reportCheck(r: CheckResult): void {
  if (r.ok) { console.log(`  ✓ ${r.sprintSlug} — byte-match`); return; }
  console.log(`  ✗ ${r.sprintSlug} — DRIFT`);
  for (const f of r.missing) console.log(`    missing:    ${f}`);
  for (const f of r.extra) console.log(`    extra:      ${f}`);
  for (const f of r.mismatched) console.log(`    mismatched: ${f}`);
}

interface PruneResult { sprintSlug: string; pruned: string[]; kept: number; }

// PRUNE orphaned generated views (PO-approved 2026-08-11, TIGHTLY GUARDED — generate-sprint-md once rm'd unowned
// design-*.md + diagrams/*.puml as regen collateral, which is why the C8 guard exists). Delete ONLY a file that is
// (a) NOT in the current buildSprintOutput (orphan = its task was removed/superseded), (b) passes isSprintMdOwnedName
// so it is a bare *.md view — NEVER a .puml, NEVER a design-*.md, (c) carries the generated-header PREFIX — enforced by
// guardedDelete, so NEVER an unmarked/hand-authored file. Every delete routes through guardedDelete. dryRun reports
// what WOULD be pruned and deletes nothing.
function pruneSprintOrphans(sprintUuid: string, units: Map<string, ScenarioUnit>, dryRun: boolean): PruneResult {
  const out = buildSprintOutput(sprintUuid, units);
  if (!out) return { sprintSlug: sprintUuid, pruned: [], kept: 0 };
  // FROZEN LEGACY (num ≤ 18) is hand-authored and NOT generator-managed — NEVER prune it (same ONE boundary as the
  // resolver + --check; a generated-header on a frozen-era file is out of the generated-view scope and is left alone).
  const sprintUnit = units.get(sprintUuid);
  if (!sprintUnit || !isCurrentEra(sprintNumOf(sprintUnit))) return { sprintSlug: out.sprintSlug, pruned: [], kept: 0 };
  const sprintDir = path.join(SPRINTS_DIR, out.sprintSlug);
  const res: PruneResult = { sprintSlug: out.sprintSlug, pruned: [], kept: 0 };
  if (!fs.existsSync(sprintDir)) return res;
  const expected = new Set(out.files.keys());
  for (const f of fs.readdirSync(sprintDir).sort()) {
    if (!isSprintMdOwnedName(f)) continue;      // ONLY the sprint .md view set — never .puml, never design-*.md
    if (expected.has(f)) { res.kept++; continue; } // still generated → keep
    const fp = path.join(sprintDir, f);
    if (dryRun) {
      // orphan candidate — count ONLY if it carries the generated-header prefix (never a hand-authored file)
      let owned = false;
      try { owned = fs.readFileSync(fp, 'utf-8').startsWith(GENERATED_HEADER_PREFIX); } catch { owned = false; }
      if (owned) res.pruned.push(f);
    } else if (guardedDelete(fp, GENERATED_HEADER_PREFIX)) { // guardedDelete refuses anything unmarked
      res.pruned.push(f);
    }
  }
  return res;
}

function reportPrune(results: PruneResult[], dryRun: boolean): number {
  console.log(`\n=== Prune orphaned generated views ${dryRun ? '(DRY-RUN — nothing deleted)' : '(REAL DELETE)'} ===`);
  let total = 0;
  for (const r of results) {
    if (!r.pruned.length) continue;
    console.log(`  ${r.sprintSlug}: ${r.pruned.length} orphan(s) ${dryRun ? 'WOULD prune' : 'PRUNED'}`);
    for (const f of r.pruned) console.log(`    - ${f}`);
    total += r.pruned.length;
  }
  console.log(`\nTotal: ${total} orphaned generated .md ${dryRun ? 'WOULD be pruned' : 'pruned'} — guarded: prefix-marked + .md view-set only, NEVER .puml/design-*/unmarked.`);
  return total;
}

// CLI — guarded so importing this module (e.g. from migrate-boards.ts) does NOT execute the generator on load.
if (process.argv[1] && process.argv[1].endsWith('generate-sprint-md.ts')) {
const args = process.argv.slice(2);
const isCheck = args.includes('--check');
const isPrune = args.includes('--prune');
const isDryRun = args.includes('--dry-run');
const filtered = args.filter(a => a !== '--check' && a !== '--prune' && a !== '--dry-run');
const cmd = filtered[0];

if (cmd === '--list') {
  const units = allUnits();
  const sorted = [...units.entries()].filter(([, u]) => u.ior === 'ior:class:Sprint').sort((a, b) => a[0].localeCompare(b[0]));
  for (const [uuid, u] of sorted) console.log(`${uuid}  ${u.model.name}`);
} else if (cmd === '--all') {
  const units = allUnits();
  const sprintUuids = [...units.entries()].filter(([, u]) => u.ior === 'ior:class:Sprint').map(([uuid]) => uuid).sort();
  if (isPrune) {
    reportPrune(sprintUuids.map(u => pruneSprintOrphans(u, units, isDryRun)), isDryRun);
  } else if (isCheck) {
    console.log('\n=== Sprint MD Round-Trip Check (honest-metric scoping — Tron ruling) ===');
    // IN-SCOPE = S19-S37 (incl the S21-29 backfill targets) → MUST byte-match, counted in the metric. FROZEN LEGACY
    // = S01-S18 (hand-authored, NOT generated) → EXCLUDED from the metric but EXPLICITLY LISTED (never a silent
    // exclusion). The G5 design-doc planning.md (S01-09) fall under this frozen exclusion. The printed number is REAL
    // (N/N in-scope + K frozen legacy), never a fake 37/37.
    // Authoritative sprint number = model.number (the generator's own field); fall back to a sprint-NN in the
    // sourceFile/slug. NEVER regex the free-text name (e.g. S36 "…M2…" would falsely parse as 2).
    const sprintNumOf = (u: string): number => {
      const mdl = units.get(u)?.model as Record<string, unknown> | undefined;
      const n = Number(mdl?.number);
      if (Number.isFinite(n) && n > 0) return n;
      const m = /sprint-(\d+)/i.exec(String(mdl?.sourceFile || mdl?.slug || ''));
      return m ? parseInt(m[1], 10) : -1;
    };
    const inScope = sprintUuids.filter(u => sprintNumOf(u) >= 19).sort((a, b) => sprintNumOf(a) - sprintNumOf(b));
    const frozen = sprintUuids.filter(u => { const n = sprintNumOf(u); return n >= 1 && n <= 18; }).sort((a, b) => sprintNumOf(a) - sprintNumOf(b));
    let failed = 0;
    for (const uuid of inScope) { const r = checkSprint(uuid, units); reportCheck(r); if (!r.ok) failed++; }
    console.log('\n--- FROZEN LEGACY (S1-S18, hand-authored, NOT generated — EXCLUDED from the metric, listed for visibility) ---');
    for (const uuid of frozen) console.log(`  frozen legacy: ${String(units.get(uuid)?.model.name || uuid)}`);
    console.log(`\nResult: ${inScope.length - failed}/${inScope.length} IN-SCOPE (S19-S37) byte-match + ${frozen.length} frozen legacy (excluded, hand-authored)`);
    if (failed > 0) process.exit(1);
  } else {
    generateAll(sprintUuids, units);
  }
} else if (cmd) {
  const units = allUnits();
  if (isPrune) {
    reportPrune([pruneSprintOrphans(cmd, units, isDryRun)], isDryRun);
  } else if (isCheck) {
    console.log('\n=== Sprint MD Round-Trip Check ===');
    const r = checkSprint(cmd, units); reportCheck(r);
    if (!r.ok) process.exit(1);
  } else {
    generateSprint(cmd, units);
  }
} else {
  console.log('Usage: npx tsx scripts/generate-sprint-md.ts [--check | --prune [--dry-run]] <sprint-uuid|--all|--list>');
}
} // end CLI guard
