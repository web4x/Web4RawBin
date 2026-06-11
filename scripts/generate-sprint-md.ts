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

function generateSprint(sprintUuid: string, units: Map<string, ScenarioUnit>) {
  const out = buildSprintOutput(sprintUuid, units);
  if (!out) { console.log(`Not a Sprint: ${sprintUuid}`); return; }
  const sprintDir = path.join(SPRINTS_DIR, out.sprintSlug);
  if (!fs.existsSync(sprintDir)) fs.mkdirSync(sprintDir, { recursive: true });
  console.log(`\nGenerating: ${out.sprintSlug}`);
  for (const [name, content] of out.files) {
    fs.writeFileSync(path.join(sprintDir, name), content);
  }
  console.log(`  ✓ ${out.files.size} files`);
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
