/**
// [impl:uuid:811e9fa5-75a6-4d39-a750-545aacded4f2] migrate-to-scenario.ts:migrate
// [impl:uuid:7e895957-3b57-443f-83b1-4236ed61915f] MigrateToScenario.sprintToScenario
// [impl:uuid:d7abe1d3-d4bd-4384-8068-d3b64d450291] MigrateToScenario.convertLegacy
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
import { ScenarioIndex, defaultTemplateRegistry, ViewGenerator, createTraceLink, extractPumlUseCaseRanges, makeSource, type ScenarioUnit } from '../src/ts/scenario/index.js';
import { mintOrReuseClass } from '../src/ts/scenario/class-mint.js'; // R27.2 AC-canonical: single Class mint-or-reuse choke-point

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
      const blockLines = block.split('\n').map(s => s.trim()).filter(s => s.length > 0);
      let speakyName = '';
      const quoteLines: string[] = [];
      for (const line of blockLines) {
        if (line.startsWith('>')) { quoteLines.push(line); continue; }
        if (/^#{1,6}\s/.test(line)) continue;
        if (/^-{3,}$/.test(line)) continue;
        // Don't skip **R17.x** lines — they ARE the speaky names, just strip bold
        if (line.startsWith('[requirement:uuid:') || line.startsWith('[task:uuid:')) continue;
        if (line.startsWith('`[requirement:uuid:')) continue;
        if (line.startsWith('(') && line.includes('task-')) continue;
        if (line.startsWith('→') || line.startsWith('-&gt;')) continue;
        if (line.match(/^\[T\d+\]/) || line.match(/^\(\[task-/)) continue;
        if (!speakyName) {
          let clean = line.replace(/^[-*]\s*\[.\]\s*/, '').trim();
          clean = clean.replace(/^#{1,6}\s+/, '');
          clean = clean.replace(/\*\*/g, '');
          clean = clean.replace(/\s*\([^)]*\d{4}-\d{2}-\d{2}[^)]*\)\s*$/, '');
          clean = clean.replace(/\s*\(original directive\)\s*$/i, '');
          clean = clean.replace(/^["'>]+\s*/, '').replace(/["']+$/, '').trim();
          if (clean.length > 60) clean = clean.substring(0, 57) + '...';
          if (clean) speakyName = clean;
        }
      }
      if (!speakyName) {
        const um = block.match(/\[requirement:uuid:([^\]]{8})/);
        speakyName = um ? `REQ-${um[1]}` : 'Unnamed Requirement';
      }
      const tronQuote = quoteLines.join('\n');
      const reqUnit: ScenarioUnit = {
        ior: 'ior:class:Requirement',
        model: { uuid: reqUuid, name: speakyName, description: tronQuote || block.trim(), tronQuote, tasks: [], tests: [] },
        ownerIor: `ior:instance:${sprintUuid}`,
      };
      idx.put(reqUuid, reqUnit);
      reqUuids.push(reqUuid);
      console.log(`  Created requirement unit: ${reqUuid} — ${speakyName}`);

      const forwardTaskIors: string[] = [];
      const taskRefs = block.matchAll(/→\s*\[T?(\d+)[^\]]*\]\(\.\/task-[^)]+\)/gi);
      for (const tr of taskRefs) {
        const tUuid = taskNumToUuid.get(tr[1]);
        if (tUuid) {
          forwardTaskIors.push(`ior:instance:${tUuid}`);
          const linkId = crypto.createHash('sha256').update(reqUuid + tUuid + 'implements').digest('hex').slice(0, 8) + '-' + crypto.createHash('sha256').update(reqUuid + tUuid).digest('hex').slice(0, 4) + '-4' + crypto.createHash('sha256').update(tUuid + reqUuid).digest('hex').slice(0, 3) + '-a' + crypto.createHash('sha256').update(reqUuid + tUuid + 'x').digest('hex').slice(0, 3) + '-' + crypto.createHash('sha256').update(reqUuid + tUuid + 'link').digest('hex').slice(0, 12);
          if (!idx.has(linkId)) {
            const link = createTraceLink(reqUuid, 'requirement', tUuid, 'task', 'implements', { createdBy: 'migrate-to-scenario.ts' });
            (link.model as Record<string, unknown>).uuid = linkId;
            idx.put(linkId, link);
          }
        }
      }
      // T160: populate requirement.tasks[] with forward IOR refs
      if (forwardTaskIors.length > 0) {
        (reqUnit.model as Record<string, unknown>).tasks = forwardTaskIors;
        idx.put(reqUuid, reqUnit);
      }
    }
  }

  // T136+T140: migrate UseCases from diagrams/*.puml with source locations
  const diagDir = path.join(sprintDir, 'diagrams');
  const ucUuids: string[] = [];
  if (fs.existsSync(diagDir) && fs.statSync(diagDir).isDirectory()) {
    for (const file of fs.readdirSync(diagDir)) {
      if (!file.endsWith('.puml')) continue;
      const pumlFilePath = path.join(diagDir, file);
      const pumlText = fs.readFileSync(pumlFilePath, 'utf-8');
      const pumlRelPath = path.relative(path.join(__dirname, '..'), pumlFilePath);
      const ucRanges = extractPumlUseCaseRanges(pumlFilePath);
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
        const lineRange = ucRanges.get(ucName);
        const source = lineRange ? makeSource(pumlRelPath, lineRange, path.join(__dirname, '..')) : undefined;
        // T160: extract ALL T-number refs from UC body (handles both "task: T124" and freeform "T124.1 / T125")
        const ucTaskIors: string[] = [];
        for (const tm of body.matchAll(/T(\d+(?:\.\d+)?)/g)) {
          const tNum = tm[1].split('.')[0];
          const tUuid = taskNumToUuid.get(tNum);
          if (tUuid && !ucTaskIors.includes(`ior:instance:${tUuid}`)) ucTaskIors.push(`ior:instance:${tUuid}`);
        }
        const ucUnit: ScenarioUnit = {
          ior: 'ior:class:UseCase',
          model: { uuid: ucUuid, name: ucName, object: objM?.[1] || '', verb: verbM?.[1] || '', tasks: ucTaskIors, classes: [], ...(source ? { source } : {}) },
          ownerIor: `ior:instance:${sprintUuid}`,
        };
        idx.put(ucUuid, ucUnit);
        ucUuids.push(ucUuid);
        // T160: populate task.useCases[] forward ref for each referenced task
        for (const tIor of ucTaskIors) {
          const tUuid = tIor.replace('ior:instance:', '');
          if (tUuid) {
            const taskUnit = idx.get(tUuid);
            if (taskUnit) {
              const useCases = ((taskUnit.model as Record<string, unknown>).useCases as string[]) || [];
              const ucIor = `ior:instance:${ucUuid}`;
              if (!useCases.includes(ucIor)) {
                useCases.push(ucIor);
                (taskUnit.model as Record<string, unknown>).useCases = useCases;
                idx.put(tUuid, taskUnit);
              }
            }
          }
        }
        console.log(`  Created usecase unit: ${ucUuid} — ${ucName}`);
      }
    }
  }

  // T166: parse PUML implementing-class blocks → Class + Method scenario units
  const classUuids: string[] = [];
  const methodUuids: string[] = [];
  if (fs.existsSync(diagDir) && fs.statSync(diagDir).isDirectory()) {
    for (const file of fs.readdirSync(diagDir)) {
      if (!file.endsWith('.puml')) continue;
      const pumlText = fs.readFileSync(path.join(diagDir, file), 'utf-8');
      const classRe = /class\s+"([^"]+)"(?:\s+as\s+\w+)?\s*\{([^}]*)\}/g;
      for (const cm of pumlText.matchAll(classRe)) {
        const className = cm[1];
        if (pumlText.includes(`"${className}" <<UseCase>>`)) continue;
        const body = cm[2];
        const fileLine = body.split('\n').find(l => l.trim() && !l.trim().startsWith('+'));
        const sourcePath = fileLine?.trim() || '';
        const methodLines = body.split('\n').filter(l => l.trim().startsWith('+'));
        // R27.2 AC-canonical: route through the single mint-or-reuse choke-point (never a 2nd Class per name).
        const methodNames = methodLines.map(ml => ml.replace(/^\s*\+\s*/, '').trim()).filter(Boolean);
        const { classUuid, methodUuids: newMethodUuids, reused } = mintOrReuseClass(idx, className, `ior:instance:${sprintUuid}`, sourcePath, methodNames);
        methodUuids.push(...newMethodUuids);
        if (!classUuids.includes(classUuid)) classUuids.push(classUuid);
        console.log(`  ${reused ? 'REUSED' : 'Created'} class unit: ${classUuid} — ${className}`);
      }
    }
  }

  // Symlink tree: per-class subdirs under sprints.json/<sprint>/
  const sprintJsonDir = path.join(JSON_TREE, sprintSlug);
  fs.mkdirSync(sprintJsonDir, { recursive: true });
  const sprintRelPath = path.relative(sprintJsonDir, idx.filePath(sprintUuid));
  fs.symlinkSync(sprintRelPath, path.join(sprintJsonDir, 'sprint.json'));

  function emitClassSymlinks(classDir: string, units: { uuid: string; slug?: string; name?: string }[]): void {
    if (!units.length) return;
    const dir = path.join(sprintJsonDir, classDir);
    fs.mkdirSync(dir, { recursive: true });
    for (const u of units) {
      const slug = u.slug || speakSlug(u.name || u.uuid);
      const rel = path.relative(dir, idx.filePath(u.uuid));
      const linkPath = path.join(dir, `${slug}.json`);
      if (!fs.existsSync(linkPath)) fs.symlinkSync(rel, linkPath);
    }
  }
  function speakSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  }

  emitClassSymlinks('task', tasks.map(t => ({ uuid: t.uuid, slug: t.slug, name: t.name })));
  emitClassSymlinks('requirement', reqUuids.map(u => { const unit = idx.get(u); return { uuid: u, name: (unit?.model.name as string) || u }; }));
  emitClassSymlinks('usecase', ucUuids.map(u => { const unit = idx.get(u); return { uuid: u, name: (unit?.model.name as string) || u }; }));
  emitClassSymlinks('class', classUuids.map(u => { const unit = idx.get(u); return { uuid: u, name: (unit?.model.name as string) || u }; }));
  emitClassSymlinks('method', methodUuids.map(u => { const unit = idx.get(u); return { uuid: u, name: (unit?.model.name as string) || u }; }));

  // Collect TraceLinks from index for this sprint's units
  const sprintUnitUuids = new Set([sprintUuid, ...tasks.map(t => t.uuid), ...reqUuids, ...ucUuids, ...classUuids, ...methodUuids]);
  const traceLinkUnits: { uuid: string; name: string }[] = [];
  for (const uid of idx.list()) {
    const unit = idx.get(uid);
    if (unit?.ior === 'ior:class:TraceLink') {
      const from = String((unit.model as any).from || '').replace('ior:instance:', '');
      const to = String((unit.model as any).to || '').replace('ior:instance:', '');
      if (sprintUnitUuids.has(from) || sprintUnitUuids.has(to)) {
        traceLinkUnits.push({ uuid: uid, name: uid });
      }
    }
  }
  emitClassSymlinks('tracelink', traceLinkUnits);

  console.log(`  Symlink tree: ${sprintJsonDir}/ (task/${tasks.length} req/${reqUuids.length} uc/${ucUuids.length} link/${traceLinkUnits.length})`);

  // Generated MD views
  const gen = new ViewGenerator(idx, defaultTemplateRegistry(), MD_TREE);
  const result = gen.generateAll();
  console.log(`  Generated ${result.filesWritten} view files in ${MD_TREE}/`);
}

function deriveObjectVerb(name: string): { object: string; verb: string } {
  const dot = name.lastIndexOf('.');
  if (dot > 0 && dot < name.length - 1) return { object: name.slice(0, dot), verb: name.slice(dot + 1) };
  return { object: name, verb: '' };
}

function populateReqAltIds(idx: ScenarioIndex, dryRun: boolean): void {
  console.log('\n=== Populate Requirement altIds ===');
  let count = 0;
  const sprintsDir = path.join(__dirname, '../scrum.pmo/sprints');
  for (const sprint of fs.readdirSync(sprintsDir).filter(s => s.startsWith('sprint-'))) {
    const reqFile = path.join(sprintsDir, sprint, 'requirements.md');
    if (!fs.existsSync(reqFile)) continue;
    const text = fs.readFileSync(reqFile, 'utf-8');
    // Match patterns: **R17.1:** or **R17.1** or R14.1 before a [requirement:uuid:]
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const uuidM = lines[i].match(/\[requirement:uuid:([0-9a-f-]{36})\]/i);
      if (!uuidM) continue;
      const uuid = uuidM[1].toLowerCase();
      // Look for R-number in the current line, previous line, or 2 lines back
      const context = [lines[i], lines[i - 1] || '', lines[i - 2] || ''].join(' ');
      const rNumM = context.match(/(R\d+\.\d+)/);
      if (!rNumM) continue;
      const altId = rNumM[1];
      const unit = idx.get(uuid);
      if (!unit || unit.ior !== 'ior:class:Requirement') continue;
      if ((unit.model as any).altId === altId) continue;
      (unit.model as Record<string, unknown>).altId = altId;
      if (!dryRun) idx.put(uuid, unit);
      count++;
      console.log(`  ${altId} → ${uuid.slice(0, 8)}`);
    }
  }
  console.log(`${count} requirements ${dryRun ? 'would get' : 'got'} altId.`);
}

function fixUcDataQuality(idx: ScenarioIndex, dryRun: boolean): void {
  console.log('\n=== UC Data Quality Fix ===');
  console.log('UC | object | verb | reqs | tasks | status');
  console.log('---|--------|------|------|-------|-------');
  let fixed = 0;
  for (const uuid of idx.list()) {
    const unit = idx.get(uuid);
    if (!unit || unit.ior !== 'ior:class:UseCase') continue;
    const m = unit.model as Record<string, unknown>;
    let changed = false;

    if (!m.object || !m.verb) {
      const { object, verb } = deriveObjectVerb(String(m.name || ''));
      if (object) { m.object = object; changed = true; }
      if (verb) { m.verb = verb; changed = true; }
    }

    // Parse PUML refs from source if available (S17 free-form: R17.x, T124)
    if (m.source && !(m.tasks as string[])?.length) {
      const src = m.source as Record<string, unknown>;
      const srcFile = String(src.file || '');
      const lines = src.lines as number[] | undefined;
      if (srcFile && lines && fs.existsSync(path.join(__dirname, '..', srcFile))) {
        const pumlText = fs.readFileSync(path.join(__dirname, '..', srcFile), 'utf-8');
        const pumlLines = pumlText.split('\n');
        const blockLines = pumlLines.slice((lines[0] || 1) - 1, lines[1] || lines[0]);
        const taskRefs: string[] = [];
        const reqRefs: string[] = [];
        for (const line of blockLines) {
          for (const tm of line.matchAll(/T(\d+(?:\.\d+)?)/g)) {
            const tNum = tm[1];
            for (const tid of idx.list()) {
              const tu = idx.get(tid);
              if (tu?.ior === 'ior:class:Task' && String(tu.model.slug || '').match(new RegExp(`^task-${tNum.replace('.', '\\.')}`))) {
                const ior = `ior:instance:${tid}`;
                if (!taskRefs.includes(ior)) taskRefs.push(ior);
              }
            }
          }
          for (const rm of line.matchAll(/R(\d+\.\d+)/g)) {
            for (const rid of idx.list()) {
              const ru = idx.get(rid);
              if (ru?.ior === 'ior:class:Requirement' && String(ru.model.name || '').includes(rm[0])) {
                const ior = `ior:instance:${rid}`;
                if (!reqRefs.includes(ior)) reqRefs.push(ior);
              }
            }
          }
          // S16 structured: task: T110, requirement: R16.1
          const taskField = line.match(/^\s*task:\s*T(\d+)/i);
          if (taskField) {
            for (const tid of idx.list()) {
              const tu = idx.get(tid);
              if (tu?.ior === 'ior:class:Task' && String(tu.model.slug || '').match(new RegExp(`^task-${taskField[1]}`))) {
                const ior = `ior:instance:${tid}`;
                if (!taskRefs.includes(ior)) taskRefs.push(ior);
              }
            }
          }
        }
        if (taskRefs.length) { m.tasks = taskRefs; changed = true; }
        if (reqRefs.length) { m.requirement = reqRefs[0]; changed = true; }
      }
    }

    // T153: class refs from PUML arrows + S16 object: field
    if (!(m.classes as string[])?.length && m.source) {
      const src = m.source as Record<string, unknown>;
      const srcFile = String(src.file || '');
      if (srcFile && fs.existsSync(path.join(__dirname, '..', srcFile))) {
        const fullPuml = fs.readFileSync(path.join(__dirname, '..', srcFile), 'utf-8');
        const ucName = String(m.name || '');
        const classRefs: string[] = [];

        // S17: parse alias map (class "FullName" as Alias)
        const aliasMap = new Map<string, string>();
        for (const am of fullPuml.matchAll(/class\s+"([^"]+)"\s+as\s+(\w+)/g)) {
          if (!am[0].includes('<<UseCase>>')) aliasMap.set(am[2], am[1]);
        }
        // Find arrows: "ucName" --> Alias : implements
        for (const arrow of fullPuml.matchAll(/"([^"]+)"\s*-->\s*(\w+)/g)) {
          if (arrow[1] === ucName) {
            const target = aliasMap.get(arrow[2]) || arrow[2];
            if (!classRefs.includes(target)) classRefs.push(target);
          }
        }
        // S16: object: field as class ref
        const srcLines = src.lines as number[] | undefined;
        if (srcLines) {
          const blockLines = fullPuml.split('\n').slice((srcLines[0] || 1) - 1, srcLines[1] || srcLines[0]);
          for (const bl of blockLines) {
            const objField = bl.match(/^\s*object:\s*(\S+)/);
            if (objField && !classRefs.includes(objField[1])) classRefs.push(objField[1]);
          }
        }
        if (classRefs.length) { m.classes = classRefs; changed = true; }
      }
    }

    // T153: requirement refs (plural array) — scan PUML block for R-refs
    if (!(m.requirements as string[])?.length) {
      // Find this UC's block in any PUML file
      const ucName = String(m.name || '');
      const pumlDirs = fs.readdirSync(path.join(__dirname, '../scrum.pmo/sprints')).filter(s => s.startsWith('sprint-'));
      const reqArr: string[] = [];
      for (const sp of pumlDirs) {
        const dDir = path.join(__dirname, '../scrum.pmo/sprints', sp, 'diagrams');
        if (!fs.existsSync(dDir)) continue;
        for (const pf of fs.readdirSync(dDir).filter(f => f.endsWith('.puml'))) {
          const puml = fs.readFileSync(path.join(dDir, pf), 'utf-8');
          const ucRe = new RegExp(`class\\s+"${ucName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+<<UseCase>>\\s*\\{([^}]+)\\}`, 's');
          const blockMatch = puml.match(ucRe);
          if (!blockMatch) continue;
          for (const rm of blockMatch[1].matchAll(/R(\d+\.\d+)/g)) {
            const rNum = rm[0];
            for (const rid of idx.list()) {
              const ru = idx.get(rid);
              if (ru?.ior !== 'ior:class:Requirement') continue;
              const altId = String((ru.model as any).altId || '');
              const name = String(ru.model.name || '');
              if (altId === rNum || name.includes(rNum)) {
                const ior = `ior:instance:${rid}`;
                if (!reqArr.includes(ior)) reqArr.push(ior);
              }
            }
          }
        }
        if (reqArr.length) break;
      }
      if (reqArr.length) { m.requirements = reqArr; changed = true; }
    }

    // Migrate singular requirement → plural requirements[]
    if (m.requirement && !(m.requirements as string[])?.length) {
      m.requirements = [String(m.requirement)];
      changed = true;
    }
    const classCount = (m.classes as string[])?.length || 0;
    const reqCount = (m.requirements as string[])?.length || 0;
    const status = changed ? (dryRun ? 'would fix' : 'fixed') : 'ok';
    console.log(`${String(m.name || uuid.slice(0,8))} | ${m.object || '∅'} | ${m.verb || '∅'} | cls:${classCount} req:${reqCount} tsk:${(m.tasks as string[])?.length || 0} | ${status}`);

    if (changed && !dryRun) { idx.put(uuid, unit); fixed++; }
  }
  console.log(`\n${fixed} UCs ${dryRun ? 'would be' : ''} fixed.`);
}

function findTaskBySlug(idx: ScenarioIndex, slug: string): string | null {
  for (const uid of idx.list()) {
    const u = idx.get(uid);
    if (u?.ior !== 'ior:class:Task') continue;
    if (String(u.model.slug || '') === slug) return uid;
  }
  // Fallback: match by task number prefix (e.g. task-127-ior-resolver → task-127-*)
  const numMatch = slug.match(/^task-(\d+(?:\.\d+)?)/);
  if (numMatch) {
    const prefix = `task-${numMatch[1]}`;
    for (const uid of idx.list()) {
      const u = idx.get(uid);
      if (u?.ior === 'ior:class:Task' && String(u.model.slug || '').startsWith(prefix)) return uid;
    }
  }
  return null;
}

function fixRequirementDataQuality(idx: ScenarioIndex, dryRun: boolean): void {
  console.log('\n=== Requirement Data Quality Fix ===');
  console.log('AltId | Name (≤5w) | Desc len | MD fwd | JSON tasks | Match');
  console.log('------|------------|----------|--------|-----------|------');
  let fixed = 0; let mismatches = 0;
  const sprintsDir = path.join(__dirname, '../scrum.pmo/sprints');
  for (const sprint of fs.readdirSync(sprintsDir).filter(s => s.startsWith('sprint-'))) {
    const reqFile = path.join(sprintsDir, sprint, 'requirements.md');
    if (!fs.existsSync(reqFile)) continue;
    const text = fs.readFileSync(reqFile, 'utf-8');
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const uuidM = lines[i].match(/\[requirement:uuid:([0-9a-f-]{36})\]/i);
      if (!uuidM) continue;
      const uuid = uuidM[1].toLowerCase();
      const unit = idx.get(uuid);
      if (!unit || unit.ior !== 'ior:class:Requirement') continue;
      const m = unit.model as Record<string, unknown>;

      // (1) NAME: look back for **R17.1: Short Title**
      const context = [lines[i - 2] || '', lines[i - 1] || '', lines[i]].join('\n');
      const titleMatch = context.match(/\*\*R[\d.]+:\s*([^*]+)\*\*/);
      const shortName = titleMatch ? titleMatch[1].trim().slice(0, 60) : String(m.name || '');

      // (2) DESCRIPTION: look forward for > blockquote
      let description = '';
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].trim().startsWith('>')) {
          description = lines[j].trim();
          // Collect multi-line blockquote
          for (let k = j + 1; k < Math.min(j + 10, lines.length); k++) {
            if (lines[k].trim().startsWith('>')) description += ' ' + lines[k].trim().replace(/^>\s*/, '');
            else break;
          }
          break;
        }
      }

      // (3) TASKS: look forward for → forward links (stop at next entry or blank line)
      const taskRefs: string[] = [];
      let mdFwdCount = 0;
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        if (lines[j].match(/\[requirement:uuid:/i) || lines[j].match(/^\s*- \[[ x]\] \*\*R/)) break;
        const fwdMatch = lines[j].match(/→\s*(.+)/);
        if (!fwdMatch) continue;
        for (const tl of fwdMatch[1].matchAll(/\[T(\d+(?:\.\d+)?)[^\]]*\]\(\.\/task-([^)]+)\.md\)/g)) {
          mdFwdCount++;
          const taskSlug = 'task-' + tl[2];
          const taskUuid = findTaskBySlug(idx, taskSlug);
          if (taskUuid) taskRefs.push(`ior:instance:${taskUuid}`);
        }
      }

      const match = mdFwdCount === taskRefs.length;
      if (!match) mismatches++;
      const altId = String(m.altId || '');
      console.log(`${altId || uuid.slice(0,8)} | ${shortName.slice(0,30)} | ${description.length} | ${mdFwdCount} | ${taskRefs.length} | ${match ? '✓' : '✗'}`);

      if (!dryRun) {
        m.name = shortName;
        if (description) m.description = description;
        if (taskRefs.length) m.tasks = taskRefs;
        idx.put(uuid, unit);
        fixed++;
      }
    }
  }
  console.log(`\n${fixed} Requirements ${dryRun ? 'would be' : ''} fixed. Mismatches: ${mismatches}`);
}

function closureRequirementTasksAndTests(idx: ScenarioIndex, dryRun: boolean): void {
  console.log('\n=== Requirement Bidirectional Closure ===');
  console.log('AltId | T154 tasks | Reverse tasks | Merged | Tests | Status');
  console.log('------|-----------|--------------|--------|-------|-------');
  let fixed = 0;

  // Part 1: reverse-scan Task.links.up for requirement refs
  const reqToRevTasks = new Map<string, string[]>();
  for (const uid of idx.list()) {
    const u = idx.get(uid);
    if (u?.ior !== 'ior:class:Task') continue;
    const linksUp = ((u.model as any).links?.up as any[]) || [];
    for (const entry of linksUp) {
      if (!entry || typeof entry !== 'object') continue;
      if (entry.type !== 'requirement') continue;
      const ref = String(entry.ref || '');
      const reqUuid = ref.replace('ior:instance:', '');
      if (!reqUuid || reqUuid.length < 36 || !idx.get(reqUuid)) continue;
      if (!reqToRevTasks.has(reqUuid)) reqToRevTasks.set(reqUuid, []);
      const taskRef = `ior:instance:${uid}`;
      if (!reqToRevTasks.get(reqUuid)!.includes(taskRef)) reqToRevTasks.get(reqUuid)!.push(taskRef);
    }
  }

  // Part 2: scan for test coverage (3 strategies)
  const reqToTests = new Map<string, string[]>();
  // Build altId → reqUuid lookup
  const altIdToReqUuid = new Map<string, string>();
  for (const uid of idx.list()) {
    const u = idx.get(uid);
    if (u?.ior !== 'ior:class:Requirement') continue;
    const altId = String((u.model as any).altId || '');
    if (altId) altIdToReqUuid.set(altId, uid);
  }

  // Strategy 1: Test scenario units with requirement refs
  for (const uid of idx.list()) {
    const u = idx.get(uid);
    if (u?.ior !== 'ior:class:Test') continue;
    const reqs = ((u.model as any).requirements as string[]) || [];
    for (const ref of reqs) {
      const reqUuid = ref.replace('ior:instance:', '');
      if (!reqToTests.has(reqUuid)) reqToTests.set(reqUuid, []);
      const testRef = `ior:instance:${uid}`;
      if (!reqToTests.get(reqUuid)!.includes(testRef)) reqToTests.get(reqUuid)!.push(testRef);
    }
  }

  // Strategy 2: TraceLink with relation='tests'
  for (const uid of idx.list()) {
    const u = idx.get(uid);
    if (u?.ior !== 'ior:class:TraceLink') continue;
    const m = u.model as any;
    if (m.relation !== 'tests') continue;
    const fromUuid = String(m.from || '').replace('ior:instance:', '');
    const toUuid = String(m.to || '').replace('ior:instance:', '');
    if (m.fromType === 'test' && m.toType === 'requirement') {
      if (!reqToTests.has(toUuid)) reqToTests.set(toUuid, []);
      if (!reqToTests.get(toUuid)!.includes(`ior:instance:${fromUuid}`)) reqToTests.get(toUuid)!.push(`ior:instance:${fromUuid}`);
    }
  }

  // Strategy 3: Source scan test files for R-number via altId
  const testDir = path.join(__dirname, '../test');
  if (fs.existsSync(testDir)) {
    const scanDir = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name !== 'node_modules') scanDir(path.join(dir, entry.name));
        else if (entry.isFile() && entry.name.endsWith('.ts')) {
          const text = fs.readFileSync(path.join(dir, entry.name), 'utf-8');
          for (const rm of text.matchAll(/R(\d+\.\d+)/g)) {
            const reqUuid = altIdToReqUuid.get(rm[0]);
            if (!reqUuid) continue;
            const testRef = `ior:file:test/${path.relative(testDir, path.join(dir, entry.name))}`;
            if (!reqToTests.has(reqUuid)) reqToTests.set(reqUuid, []);
            if (!reqToTests.get(reqUuid)!.includes(testRef)) reqToTests.get(reqUuid)!.push(testRef);
          }
        }
      }
    };
    scanDir(testDir);
  }

  // Merge into requirements
  for (const uid of idx.list()) {
    const u = idx.get(uid);
    if (u?.ior !== 'ior:class:Requirement') continue;
    const m = u.model as Record<string, unknown>;
    const altId = String(m.altId || uid.slice(0, 8));
    let changed = false;

    const existingTasks = (m.tasks as string[]) || [];
    const revTasks = reqToRevTasks.get(uid) || [];
    const mergedTasks = [...new Set([...existingTasks, ...revTasks])];
    if (mergedTasks.length !== existingTasks.length) { m.tasks = mergedTasks; changed = true; }

    const existingTests = (m.tests as string[]) || [];
    const newTests = reqToTests.get(uid) || [];
    const mergedTests = [...new Set([...existingTests, ...newTests])];
    if (mergedTests.length !== existingTests.length) { m.tests = mergedTests; changed = true; }

    console.log(`${altId} | ${existingTasks.length} | ${revTasks.length} | ${mergedTasks.length} | ${mergedTests.length} | ${changed ? (dryRun ? 'would fix' : 'fixed') : 'ok'}`);
    if (changed && !dryRun) { idx.put(uid, u); fixed++; }
  }
  console.log(`\n${fixed} Requirements ${dryRun ? 'would be' : ''} fixed.`);
}

const args = process.argv.slice(2);
const sprintIdx = args.indexOf('--sprint');
const sprint = sprintIdx !== -1 ? args[sprintIdx + 1] : null;
const dryRun = !args.includes('--apply');

if (args.includes('--fix-req-closure')) {
  const idx = new ScenarioIndex(INDEX_DIR);
  closureRequirementTasksAndTests(idx, dryRun);
  if (dryRun) console.log('\nDry run complete. Use --apply to write.');
} else if (args.includes('--fix-req-quality')) {
  const idx = new ScenarioIndex(INDEX_DIR);
  fixRequirementDataQuality(idx, dryRun);
  if (dryRun) console.log('\nDry run complete. Use --apply to write.');
} else if (args.includes('--fix-uc-quality')) {
  const idx = new ScenarioIndex(INDEX_DIR);
  populateReqAltIds(idx, dryRun);
  fixUcDataQuality(idx, dryRun);
  if (dryRun) console.log('\nDry run complete. Use --apply to write.');
} else if (!sprint) {
  console.log('Usage:\n  npx tsx scripts/migrate-to-scenario.ts --sprint <slug> [--apply]\n  npx tsx scripts/migrate-to-scenario.ts --fix-uc-quality [--apply]');
  process.exit(1);
} else {
  migrateSprint(sprint, dryRun);
  if (dryRun) console.log('\nDry run complete. Use --apply to write files.');
}
