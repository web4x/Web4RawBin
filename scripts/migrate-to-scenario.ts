/**
 * T128 — Migrate existing sprint/task markdown to scenario-unit model.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-scenario.ts --sprint sprint-1-rawbin-foundation --dry-run
 *   npx tsx scripts/migrate-to-scenario.ts --sprint sprint-1-rawbin-foundation --apply
 *
 * Reads scrum.pmo/sprints/<sprint>/, extracts task metadata, writes:
 *   scenario/index/<5char>/<uuid>.scenario.json
 *   scenario/sprints.json/<sprint>/<slug>.json → symlink to index
 *   scenario/sprints.md/<sprint>/<slug>.md     → generated view
 *
 * [impl:uuid:b94d2681-54f0-47e3-a431-f3d84e469b30] R17.14
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, defaultTemplateRegistry, ViewGenerator, createTraceLink, type ScenarioUnit } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPRINTS_DIR = path.join(__dirname, '../scrum.pmo/sprints');
const SCENARIO_DIR = path.join(__dirname, '../scenario');
const INDEX_DIR = path.join(SCENARIO_DIR, 'index');
const JSON_TREE = path.join(SCENARIO_DIR, 'sprints.json');
const MD_TREE = path.join(SCENARIO_DIR, 'sprints.md');

const RE_UUID = /\[task:uuid:([0-9a-f-]{36})\]/i;
interface ParsedTask {
  uuid: string;
  slug: string;
  name: string;
  sections: Record<string, string>;
  status: string;
  statusChecklist: string;
  children: string[];
}

function extractSection(text: string, heading: string): string {
  const re = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |\\n---\\s*$|$)`, 'i');
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

function parseTaskFile(filePath: string, slug: string): ParsedTask | null {
  const text = fs.readFileSync(filePath, 'utf-8');
  const uuidMatch = text.match(RE_UUID);
  if (!uuidMatch) return null;

  const titleMatch = text.match(/^#\s+(.+)$/m);
  const name = titleMatch ? titleMatch[1].trim() : slug;

  const statusBlock = extractSection(text, 'Status');
  const doneMatch = statusBlock.match(/- \[(x)\] Done/);
  const status = doneMatch ? 'Done' : (statusBlock.includes('[x] In Progress') ? 'In Progress' : 'Planned');

  const sections: Record<string, string> = {};
  const sectionNames = [
    'Status', 'Remaining Issues', 'Traceability', 'Task Description', 'Description',
    'Context', 'Intention', 'Role', 'QA Audit & User Feedback', 'QA Audit',
    'Acceptance Criteria', 'Subtasks', 'Assigned', 'Architect Design',
    'Dependencies', 'Definition of Done', 'Implementation', 'Test Scenarios',
  ];
  for (const s of sectionNames) {
    const content = extractSection(text, s);
    if (content) sections[s] = content;
  }

  const description = sections['Task Description'] || sections['Description'] || '';

  const children: string[] = [];
  const childMatches = text.matchAll(/\[(?:Task )?\d+\.\d+[^\]]*\]\(\.\/([^)]+)\.md\)/g);
  for (const cm of childMatches) children.push(cm[1]);

  const taskNum = slug.match(/^task-(\d+(?:\.\d+)*)/)?.[1] || '';

  return { uuid: uuidMatch[1].toLowerCase(), slug, name, sections, status, statusChecklist: statusBlock, description, children, taskNum } as ParsedTask & { description: string; taskNum: string };
}

function migrateSprint(sprintSlug: string, dryRun: boolean): void {
  const sprintDir = path.join(SPRINTS_DIR, sprintSlug);
  if (!fs.existsSync(sprintDir)) { console.log(`Sprint dir not found: ${sprintDir}`); return; }

  const taskFiles = fs.readdirSync(sprintDir).filter(f => f.startsWith('task-') && f.endsWith('.md'));
  const tasks: ParsedTask[] = [];

  for (const file of taskFiles) {
    const slug = file.replace('.md', '');
    const parsed = parseTaskFile(path.join(sprintDir, file), slug);
    if (parsed) tasks.push(parsed);
    else console.log(`  SKIP (no uuid): ${file}`);
  }

  // Infer parent-child by slug pattern: task-3 is parent of task-3.4
  for (const parent of tasks) {
    const pNum = (parent as any).taskNum as string;
    if (!pNum) continue;
    for (const child of tasks) {
      const cNum = (child as any).taskNum as string;
      if (!cNum || cNum === pNum) continue;
      if (cNum.startsWith(pNum + '.') && !cNum.slice(pNum.length + 1).includes('.')) {
        if (!parent.children.includes(child.slug)) parent.children.push(child.slug);
      }
    }
  }

  console.log(`\nSprint: ${sprintSlug}`);
  console.log(`  Tasks found: ${tasks.length} (${taskFiles.length} files)`);

  const sprintUuid = crypto.randomUUID();
  const sprintUnit: ScenarioUnit = {
    ior: 'ior:class:Sprint',
    model: {
      uuid: sprintUuid,
      name: sprintSlug.replace(/^sprint-\d+-/, 'Sprint ').replace(/-/g, ' '),
      number: parseInt(sprintSlug.match(/sprint-(\d+)/)?.[1] || '0'),
      goal: '',
      status: tasks.every(t => t.status === 'Done') ? 'Done' : 'In Progress',
      tasks: tasks.map(t => `ior:instance:${t.uuid}`),
      requirements: [],
    },
    ownerIor: null,
  };

  if (dryRun) {
    console.log(`\n  [DRY RUN] Would create:`);
    console.log(`    Sprint unit: ${sprintUuid}`);
    for (const t of tasks) {
      console.log(`    Task unit: ${t.uuid} — ${t.name} (${t.status})`);
    }
    return;
  }

  const idx = new ScenarioIndex(INDEX_DIR);

  idx.put(sprintUuid, sprintUnit);
  console.log(`  Created sprint unit: ${sprintUuid}`);

  for (const t of tasks) {
    const p = t as ParsedTask & { description: string };
    const taskUnit: ScenarioUnit = {
      ior: 'ior:class:Task',
      model: {
        uuid: t.uuid,
        name: t.name,
        slug: t.slug,
        description: p.description,
        status: t.status,
        statusChecklist: t.statusChecklist,
        remainingIssues: t.sections['Remaining Issues'] || '',
        traceability: t.sections['Traceability'] || '',
        context: t.sections['Context'] || '',
        intention: t.sections['Intention'] || '',
        role: t.sections['Role'] || '',
        acceptanceCriteria: t.sections['Acceptance Criteria'] || '',
        qaAudit: t.sections['QA Audit & User Feedback'] || t.sections['QA Audit'] || '',
        subtasks: t.sections['Subtasks'] || '',
        assigned: t.sections['Assigned'] || '',
        architectDesign: t.sections['Architect Design'] || '',
        dependencies: t.sections['Dependencies'] || '',
        definitionOfDone: t.sections['Definition of Done'] || '',
        implementation: t.sections['Implementation'] || '',
        testScenarios: t.sections['Test Scenarios'] || '',
        children: t.children.map(c => {
          const child = tasks.find(ct => ct.slug === c);
          return child ? `ior:instance:${child.uuid}` : '';
        }).filter(Boolean),
        requirements: [],
        useCases: [],
        implementations: [],
      },
      ownerIor: `ior:instance:${sprintUuid}`,
    };
    idx.put(t.uuid, taskUnit);
    console.log(`  Created task unit: ${t.uuid} — ${t.name}`);
  }

  // T136: migrate Requirements from requirements.md
  const taskBySlug = new Map<string, ParsedTask>();
  for (const t of tasks) taskBySlug.set(t.slug, t);
  const taskNumToUuid = new Map<string, string>();
  for (const t of tasks) {
    const m = t.slug.match(/^task-(\d+(?:\.\d+)*)/);
    if (m) taskNumToUuid.set(m[1], t.uuid);
  }

  const reqFile = path.join(sprintDir, 'requirements.md');
  const reqUuids: string[] = [];
  if (fs.existsSync(reqFile)) {
    const reqText = fs.readFileSync(reqFile, 'utf-8');
    const blocks = reqText.split(/(?=\[requirement:uuid:)/i);
    for (const block of blocks) {
      const rm = block.match(/\[requirement:uuid:([0-9a-f-]{36})\]/i);
      if (!rm) continue;
      const reqUuid = rm[1].toLowerCase();
      if (idx.has(reqUuid)) continue;
      const titleLine = block.split('\n').map(s => s.trim()).find(s => s && !s.startsWith('[requirement'));
      const title = (titleLine || 'requirement').replace(/^[-*]\s*\[.\]\s*/, '').slice(0, 120);
      const reqUnit: ScenarioUnit = {
        ior: 'ior:class:Requirement',
        model: { uuid: reqUuid, name: title, description: block.trim(), tasks: [], tests: [] },
        ownerIor: `ior:instance:${sprintUuid}`,
      };
      idx.put(reqUuid, reqUnit);
      reqUuids.push(reqUuid);
      console.log(`  Created requirement unit: ${reqUuid} — ${title}`);

      const taskRefs = block.matchAll(/→\s*\[T?(\d+)[^\]]*\]\(\.\/task-[^)]+\)/gi);
      for (const tr of taskRefs) {
        const tUuid = taskNumToUuid.get(tr[1]);
        if (tUuid) {
          const linkId = crypto.createHash('sha256').update(reqUuid + tUuid + 'implements').digest('hex').slice(0, 8) + '-' + crypto.createHash('sha256').update(reqUuid + tUuid).digest('hex').slice(0, 4) + '-4' + crypto.createHash('sha256').update(tUuid + reqUuid).digest('hex').slice(0, 3) + '-a' + crypto.createHash('sha256').update(reqUuid + tUuid + 'x').digest('hex').slice(0, 3) + '-' + crypto.createHash('sha256').update(reqUuid + tUuid + 'link').digest('hex').slice(0, 12);
          if (!idx.has(linkId)) {
            const link = createTraceLink(reqUuid, 'requirement', tUuid, 'task', 'implements', { createdBy: 'migrate-to-scenario.ts' });
            (link.model as Record<string, unknown>).uuid = linkId;
            idx.put(linkId, link);
          }
        }
      }
    }
  }

  // T136: migrate UseCases from diagrams/*.puml
  const diagDir = path.join(sprintDir, 'diagrams');
  const ucUuids: string[] = [];
  if (fs.existsSync(diagDir) && fs.statSync(diagDir).isDirectory()) {
    for (const file of fs.readdirSync(diagDir)) {
      if (!file.endsWith('.puml')) continue;
      const pumlText = fs.readFileSync(path.join(diagDir, file), 'utf-8');
      const ucRe = /class\s+"([^"]+)"\s+<<UseCase>>\s*\{([^}]+)\}/g;
      for (const m of pumlText.matchAll(ucRe)) {
        const ucName = m[1];
        const body = m[2];
        const ucUuidM = body.match(/\[uc:uuid:([0-9a-f-]{36})\]/i);
        if (!ucUuidM) continue;
        const ucUuid = ucUuidM[1].toLowerCase();
        if (idx.has(ucUuid)) continue;
        const objM = body.match(/object:\s*(\S+)/);
        const verbM = body.match(/verb:\s*(\S+)/);
        const taskM = body.match(/task:\s*T(\d+)/i);
        const ucUnit: ScenarioUnit = {
          ior: 'ior:class:UseCase',
          model: { uuid: ucUuid, name: ucName, object: objM?.[1] || '', verb: verbM?.[1] || '', tasks: [], classes: [], requirement: null },
          ownerIor: `ior:instance:${sprintUuid}`,
        };
        if (taskM) {
          const tUuid = taskNumToUuid.get(taskM[1]);
          if (tUuid) (ucUnit.model as Record<string, unknown>).tasks = [`ior:instance:${tUuid}`];
        }
        idx.put(ucUuid, ucUnit);
        ucUuids.push(ucUuid);
        console.log(`  Created usecase unit: ${ucUuid} — ${ucName}`);
      }
    }
  }

  // Symlink tree: scenario/sprints.json/<sprint>/<slug>.json → ../../index/<5char>/<uuid>.scenario.json
  const sprintJsonDir = path.join(JSON_TREE, sprintSlug);
  fs.mkdirSync(sprintJsonDir, { recursive: true });
  const sprintRelPath = path.relative(sprintJsonDir, idx.filePath(sprintUuid));
  fs.symlinkSync(sprintRelPath, path.join(sprintJsonDir, 'sprint.json'));
  for (const t of tasks) {
    const taskRelPath = path.relative(sprintJsonDir, idx.filePath(t.uuid));
    fs.symlinkSync(taskRelPath, path.join(sprintJsonDir, `${t.slug}.json`));
  }
  console.log(`  Symlink tree: ${sprintJsonDir}/`);

  // Generated MD views
  const gen = new ViewGenerator(idx, defaultTemplateRegistry(), MD_TREE);
  const result = gen.generateAll();
  console.log(`  Generated ${result.filesWritten} view files in ${MD_TREE}/`);
}

const args = process.argv.slice(2);
const sprintIdx = args.indexOf('--sprint');
const sprint = sprintIdx !== -1 ? args[sprintIdx + 1] : null;
const dryRun = !args.includes('--apply');

if (!sprint) {
  console.log('Usage: npx tsx scripts/migrate-to-scenario.ts --sprint <slug> [--apply]');
  process.exit(1);
}

migrateSprint(sprint, dryRun);
if (dryRun) console.log('\nDry run complete. Use --apply to write files.');
