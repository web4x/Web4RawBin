/**
 * R18.13 — Fill source.file+line on ALL scenario units missing them.
 *
 * Usage:
 *   npx tsx scripts/fill-source-locations.ts --dry-run
 *   npx tsx scripts/fill-source-locations.ts --apply
 *
 * [impl:uuid:675cc8e3-0646-4fb7-a6a5-b2c8400747c6] R18.13
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, type ScenarioUnit } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
const ROOT = path.join(__dirname, '..');
const idx = new ScenarioIndex(INDEX_DIR);
const apply = process.argv.includes('--apply');

function findFileByKebab(name: string, dirs: string[]): string | undefined {
  const kebab = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  for (const dir of dirs) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) continue;
    for (const f of walkFiles(full, '.ts')) {
      const base = path.basename(f, '.ts');
      if (base === kebab || base === name.toLowerCase() || base.includes(kebab)) return path.relative(ROOT, f);
    }
  }
  return undefined;
}

function findLineInFile(filePath: string, pattern: string): number {
  const abs = path.join(ROOT, filePath);
  if (!fs.existsSync(abs)) return 0;
  const lines = fs.readFileSync(abs, 'utf-8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(pattern)) return i + 1;
  }
  return 0;
}

function walkFiles(dir: string, ext: string): string[] {
  const out: string[] = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory() && ent.name !== 'node_modules' && ent.name !== 'dist' && ent.name !== '.git')
      out.push(...walkFiles(path.join(dir, ent.name), ext));
    else if (ent.isFile() && ent.name.endsWith(ext))
      out.push(path.join(dir, ent.name));
  }
  return out;
}

function grepFile(dir: string, pattern: RegExp, ext: string): { file: string; line: number } | null {
  for (const f of walkFiles(path.join(ROOT, dir), ext)) {
    const text = fs.readFileSync(f, 'utf-8');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) return { file: path.relative(ROOT, f), line: i + 1 };
    }
  }
  return null;
}

const allUuids = idx.list();
const stats: Record<string, { filled: number; total: number }> = {};
let totalFilled = 0;

for (const uuid of allUuids) {
  const unit = idx.get(uuid);
  if (!unit) continue;
  const type = unit.ior.replace('ior:class:', '');
  const m = unit.model as Record<string, unknown>;
  if (!stats[type]) stats[type] = { filled: 0, total: 0 };
  stats[type].total++;

  const hasSource = !!(m.sourceFile || m.file);
  if (hasSource) continue;

  let sourceFile = '';
  let sourceLine = 0;

  switch (type) {
    case 'Sprint': {
      const slug = String(m.slug || '');
      const num = Number(m.number || 0);
      // Try slug first, then scan for sprint-N-* directories
      if (slug) {
        const planPath = `scrum.pmo/sprints/${slug}/planning.md`;
        if (fs.existsSync(path.join(ROOT, planPath))) { sourceFile = planPath; sourceLine = 1; }
      }
      if (!sourceFile && num > 0) {
        const sprintsBase = path.join(ROOT, 'scrum.pmo/sprints');
        if (fs.existsSync(sprintsBase)) {
          for (const d of fs.readdirSync(sprintsBase)) {
            if (d.startsWith(`sprint-${num}-`)) {
              const planPath = `scrum.pmo/sprints/${d}/planning.md`;
              if (fs.existsSync(path.join(ROOT, planPath))) { sourceFile = planPath; sourceLine = 1; break; }
            }
          }
        }
      }
      break;
    }
    case 'Task': {
      const slug = String(m.slug || '');
      if (slug) {
        // Find the task .md in any sprint dir
        const hit = grepFile('scrum.pmo/sprints', new RegExp(`\\[task:uuid:${uuid}\\]`, 'i'), '.md');
        if (hit) { sourceFile = hit.file; sourceLine = hit.line; }
      }
      break;
    }
    case 'Requirement': {
      const hit = grepFile('scrum.pmo/sprints', new RegExp(`requirement:uuid:${uuid}`, 'i'), '.md')
        || grepFile('scrum.pmo', new RegExp(uuid, 'i'), '.md');
      if (hit) { sourceFile = hit.file; sourceLine = hit.line; }
      else { sourceFile = path.relative(ROOT, idx.filePath(uuid)); sourceLine = 1; }
      break;
    }
    case 'UseCase': {
      const hit = grepFile('scrum.pmo/sprints', new RegExp(`uc:uuid:${uuid}`, 'i'), '.puml')
        || grepFile('scrum.pmo/sprints', new RegExp(uuid, 'i'), '.puml')
        || grepFile('scrum.pmo/sprints', new RegExp(`uc:uuid:${uuid}`, 'i'), '.md');
      if (hit) { sourceFile = hit.file; sourceLine = hit.line; }
      else { sourceFile = path.relative(ROOT, idx.filePath(uuid)); sourceLine = 1; }
      break;
    }
    case 'Class': {
      const clsName = String(m.name || '');
      const file = findFileByKebab(clsName, ['src/public/ts', 'src/ts', 'src/public/ts/trace', 'src/public/ts/components', 'src/ts/server', 'src/ts/scenario', 'src/ts/shared']);
      if (file) {
        sourceFile = file;
        sourceLine = findLineInFile(file, `class ${clsName}`) || findLineInFile(file, `export class ${clsName}`) || 1;
      }
      break;
    }
    case 'Method': {
      const methName = String(m.name || '');
      const dotIdx = methName.indexOf('.');
      if (dotIdx > 0) {
        const clsName = methName.slice(0, dotIdx);
        const methPart = methName.slice(dotIdx + 1).split('(')[0].trim();
        const file = findFileByKebab(clsName, ['src/public/ts', 'src/ts', 'src/public/ts/trace', 'src/public/ts/components', 'src/ts/server', 'src/ts/scenario', 'src/ts/shared']);
        if (file) {
          sourceFile = file;
          sourceLine = findLineInFile(file, methPart) || 1;
        }
      }
      break;
    }
    case 'Implementation': {
      const hit = grepFile('src', new RegExp(`impl:uuid:${uuid}`, 'i'), '.ts');
      if (hit) { sourceFile = hit.file; sourceLine = hit.line; }
      break;
    }
    case 'Test': {
      const f = String(m.file || '').replace('ior:file:', '');
      if (f && fs.existsSync(path.join(ROOT, f))) { sourceFile = f; sourceLine = 1; }
      break;
    }
  }

  if (!sourceFile) {
    sourceFile = path.relative(ROOT, idx.filePath(uuid));
    sourceLine = 1;
  }
  m.sourceFile = `ior:file:${sourceFile}`;
  if (sourceLine) m.sourceLine = sourceLine;
  if (apply) idx.put(uuid, unit);
  stats[type].filled++;
  totalFilled++;
}

console.log('\n=== Source Location Fill ===');
for (const [type, s] of Object.entries(stats).sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`  ${type}: +${s.filled}/${s.total - s.filled} gap (${s.total} total)`);
}
console.log(`\nTotal filled: ${totalFilled}`);
if (!apply) console.log('Dry run. Use --apply to write.');
