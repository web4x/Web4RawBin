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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
const SPRINTS_DIR = path.join(__dirname, '../scrum.pmo/sprints');
const GENERATED_HEADER = '<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->';

const idx = new ScenarioIndex(INDEX_DIR);

function allUnits(): Map<string, ScenarioUnit> {
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
    `# Sprint ${m.number || '?'} Planning — ${m.name || '(untitled)'}`,
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
    const done = String(tm.status || '').toLowerCase() === 'done';
    const slug = speakingSlug(task);
    lines.push(`${'  '.repeat(depth)}- [${done ? 'x' : ' '}] [${tm.name || slug}](./${slug}.md)`);
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
    `# Sprint ${m.number || '?'} Requirements — ${m.name || '(untitled)'}`,
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

interface SprintOutput {
  sprintSlug: string;
  files: Map<string, string>; // filename → content
}

function buildSprintOutput(sprintUuid: string, units: Map<string, ScenarioUnit>): SprintOutput | null {
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
  // OWNED-OUTPUT GUARD (correct-by-construction, TRON via robbin-po 2026-07-19): the generator
  // OWNS only the files it emits — every generated file carries GENERATED_HEADER. NEVER clobber a
  // file that exists WITHOUT that header: it is hand-authored (diagnosis brief, design doc, *.png)
  // and lives outside the unit-derived output. This makes the DATA-LOSS hazard (a task slug colliding
  // with a hand-authored filename) structurally impossible — the generator can only overwrite its own prior output.
  // OWNED-OUTPUT CONFINEMENT (2026-07-26, robbin-po/req — protect diagrams + design notes from regen
  // data-loss): the generator's write set is a WHITELIST — only bare *.md files it emits (planning.md,
  // requirements.md, task-*.md). It NEVER writes (nor could delete) a path-escaping name, a diagrams/*.puml,
  // or a design-*.md brief. Combined with the GENERATED_HEADER overwrite-guard below, non-generated
  // artifacts are structurally protected — a future prune step also cannot escape this whitelist.
  const isOwnedOutput = (n: string): boolean =>
    !n.includes('/') && !n.includes('..') && n.endsWith('.md') &&
    !n.endsWith('.puml') && !/^design-.*\.md$/.test(n);
  let written = 0, skipped = 0;
  for (const [name, content] of out.files) {
    if (!isOwnedOutput(name)) {
      console.log(`  ⛔ REFUSE (not generator-owned output, protected artifact): ${name}`);
      skipped++;
      continue;
    }
    const fp = path.join(sprintDir, name);
    if (fs.existsSync(fp)) {
      const existing = fs.readFileSync(fp, 'utf-8');
      if (!existing.startsWith(GENERATED_HEADER)) {
        console.log(`  ⚠ SKIP (hand-authored, not generator-owned): ${name}`);
        skipped++;
        continue;
      }
    }
    fs.writeFileSync(fp, content);
    written++;
  }
  console.log(`  ✓ ${written} files${skipped ? ` (${skipped} hand-authored preserved)` : ''}`);
}

interface CheckResult { sprintSlug: string; missing: string[]; extra: string[]; mismatched: string[]; ok: boolean; }

function checkSprint(sprintUuid: string, units: Map<string, ScenarioUnit>): CheckResult {
  const out = buildSprintOutput(sprintUuid, units);
  if (!out) return { sprintSlug: sprintUuid, missing: [], extra: [], mismatched: [], ok: false };
  const result: CheckResult = { sprintSlug: out.sprintSlug, missing: [], extra: [], mismatched: [], ok: true };
  const sprintDir = path.join(SPRINTS_DIR, out.sprintSlug);

  // Walk on-disk files that start with GENERATED_HEADER
  const onDiskGenerated = new Set<string>();
  if (fs.existsSync(sprintDir)) {
    for (const f of fs.readdirSync(sprintDir).sort()) {
      if (!f.endsWith('.md')) continue;
      const fp = path.join(sprintDir, f);
      try {
        const content = fs.readFileSync(fp, 'utf-8');
        if (content.startsWith(GENERATED_HEADER)) onDiskGenerated.add(f);
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

// CLI
const args = process.argv.slice(2);
const isCheck = args.includes('--check');
const filtered = args.filter(a => a !== '--check');
const cmd = filtered[0];

if (cmd === '--list') {
  const units = allUnits();
  const sorted = [...units.entries()].filter(([, u]) => u.ior === 'ior:class:Sprint').sort((a, b) => a[0].localeCompare(b[0]));
  for (const [uuid, u] of sorted) console.log(`${uuid}  ${u.model.name}`);
} else if (cmd === '--all') {
  const units = allUnits();
  const sprintUuids = [...units.entries()].filter(([, u]) => u.ior === 'ior:class:Sprint').map(([uuid]) => uuid).sort();
  if (isCheck) {
    console.log('\n=== Sprint MD Round-Trip Check ===');
    let failed = 0;
    for (const uuid of sprintUuids) { const r = checkSprint(uuid, units); reportCheck(r); if (!r.ok) failed++; }
    console.log(`\nResult: ${sprintUuids.length - failed}/${sprintUuids.length} sprints byte-match`);
    if (failed > 0) process.exit(1);
  } else {
    for (const uuid of sprintUuids) generateSprint(uuid, units);
  }
} else if (cmd) {
  const units = allUnits();
  if (isCheck) {
    console.log('\n=== Sprint MD Round-Trip Check ===');
    const r = checkSprint(cmd, units); reportCheck(r);
    if (!r.ok) process.exit(1);
  } else {
    generateSprint(cmd, units);
  }
} else {
  console.log('Usage: npx tsx scripts/generate-sprint-md.ts [--check] <sprint-uuid|--all|--list>');
}
