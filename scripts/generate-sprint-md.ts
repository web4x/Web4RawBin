/**
 * T188 — Generate sprint planning.md + per-task .md from scenario units.
 * Writes INTO scrum.pmo/sprints/<sprint>/ replacing hand-authored files.
 * Each generated file starts with '<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->'
 *
 * Usage:
 *   npx tsx scripts/generate-sprint-md.ts <sprint-uuid>           # generate for one sprint
 *   npx tsx scripts/generate-sprint-md.ts --all                   # generate for all sprints
 *   npx tsx scripts/generate-sprint-md.ts --list                  # list available sprints
 *
 * [impl:uuid:8a31ba75-22b6-48ff-9532-d5da21458543] T188 ViewGenerator dogfood
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, type ScenarioUnit } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
const SPRINTS_DIR = path.join(__dirname, '../scrum.pmo/sprints');
const GENERATED_HEADER = '<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->\n\n';

const idx = new ScenarioIndex(INDEX_DIR);

function allUnits(): Map<string, ScenarioUnit> {
  const m = new Map<string, ScenarioUnit>();
  for (const uuid of idx.list()) {
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

function generateTaskMd(task: ScenarioUnit): string {
  const m = task.model as Record<string, unknown>;
  const lines = [
    GENERATED_HEADER,
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
  return lines.join('\n');
}

function generatePlanningMd(sprint: ScenarioUnit, units: Map<string, ScenarioUnit>): string {
  const m = sprint.model as Record<string, unknown>;
  const taskIors = (m.tasks as string[]) || [];

  const childUuids = new Set<string>();
  for (const ior of taskIors) {
    const uuid = String(ior).replace('ior:instance:', '');
    const task = units.get(uuid);
    if (task) for (const c of ((task.model.children as string[]) || [])) childUuids.add(String(c).replace('ior:instance:', ''));
  }

  const lines = [
    GENERATED_HEADER,
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

  return lines.join('\n');
}

function generateSprint(sprintUuid: string) {
  const sprint = idx.get(sprintUuid);
  if (!sprint || sprint.ior !== 'ior:class:Sprint') { console.log(`Not a Sprint: ${sprintUuid}`); return; }
  const m = sprint.model as Record<string, unknown>;
  const sprintSlug = speakingSlug(sprint);
  const sprintDir = path.join(SPRINTS_DIR, sprintSlug);
  const units = allUnits();

  console.log(`\nGenerating: ${m.name} → ${sprintDir}/`);

  if (!fs.existsSync(sprintDir)) fs.mkdirSync(sprintDir, { recursive: true });

  // planning.md
  const planningMd = generatePlanningMd(sprint, units);
  fs.writeFileSync(path.join(sprintDir, 'planning.md'), planningMd);
  console.log(`  ✓ planning.md`);

  // Per-task .md
  const taskIors = (m.tasks as string[]) || [];
  let taskCount = 0;
  function writeTask(uuid: string) {
    const task = units.get(uuid);
    if (!task) return;
    const slug = speakingSlug(task);
    const taskMd = generateTaskMd(task);
    fs.writeFileSync(path.join(sprintDir, `${slug}.md`), taskMd);
    taskCount++;
    for (const c of ((task.model.children as string[]) || [])) writeTask(String(c).replace('ior:instance:', ''));
  }
  for (const ior of taskIors) writeTask(String(ior).replace('ior:instance:', ''));
  console.log(`  ✓ ${taskCount} task .md files`);
}

// CLI
const args = process.argv.slice(2);
if (args[0] === '--list') {
  const units = allUnits();
  for (const [uuid, u] of units) {
    if (u.ior === 'ior:class:Sprint') console.log(`${uuid}  ${u.model.name}`);
  }
} else if (args[0] === '--all') {
  const units = allUnits();
  for (const [uuid, u] of units) {
    if (u.ior === 'ior:class:Sprint') generateSprint(uuid);
  }
} else if (args[0]) {
  generateSprint(args[0]);
} else {
  console.log('Usage: npx tsx scripts/generate-sprint-md.ts <sprint-uuid> | --all | --list');
}
