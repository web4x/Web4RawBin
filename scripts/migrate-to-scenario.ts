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
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, defaultTemplateRegistry, ViewGenerator, type ScenarioUnit } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPRINTS_DIR = path.join(__dirname, '../scrum.pmo/sprints');
const SCENARIO_DIR = path.join(__dirname, '../scenario');
const INDEX_DIR = path.join(SCENARIO_DIR, 'index');
const JSON_TREE = path.join(SCENARIO_DIR, 'sprints.json');
const MD_TREE = path.join(SCENARIO_DIR, 'sprints.md');

const RE_UUID = /\[task:uuid:([0-9a-f-]{36})\]/i;
const RE_STATUS = /- \[(x| )\] Done/;

interface ParsedTask {
  uuid: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  children: string[];
  parentSlug?: string;
}

function parseTaskFile(filePath: string, slug: string): ParsedTask | null {
  const text = fs.readFileSync(filePath, 'utf-8');
  const uuidMatch = text.match(RE_UUID);
  if (!uuidMatch) return null;

  const titleMatch = text.match(/^#\s+(?:Task\s+)?(.+)$/m);
  const name = titleMatch ? titleMatch[1].trim() : slug;

  const descMatch = text.match(/## (?:Task )?Description\s*\n+([\s\S]*?)(?=\n## |\n---|\Z)/);
  const description = descMatch ? descMatch[1].trim().slice(0, 500) : '';

  const doneMatch = text.match(RE_STATUS);
  const status = doneMatch && doneMatch[1] === 'x' ? 'Done' : 'In Progress';

  const children: string[] = [];
  const childMatches = text.matchAll(/\[Task \d+\.\d+[^\]]*\]\(\.\/([^)]+)\.md\)/g);
  for (const cm of childMatches) children.push(cm[1]);

  return { uuid: uuidMatch[1].toLowerCase(), slug, name, description, status, children };
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
    const taskUnit: ScenarioUnit = {
      ior: 'ior:class:Task',
      model: {
        uuid: t.uuid,
        name: t.name,
        description: t.description,
        status: t.status,
        assigned: '',
        effort: '',
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
