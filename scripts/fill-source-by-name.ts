// R18.13 gap fill: match scenario units to .ts files by class/method name.
// For Class: grep for "class ClassName" in src/**/*.ts
// For Method: grep for "methodName(" in the class's sourceFile
// Usage: npx tsx scripts/fill-source-by-name.ts [--apply]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, type ScenarioUnit } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
const ROOT = path.join(__dirname, '..');
const apply = process.argv.includes('--apply');
const idx = new ScenarioIndex(INDEX_DIR);

function walkTs(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', 'dist', '.git'].includes(entry.name)) out.push(...walkTs(full));
    else if (entry.isFile() && entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

const allTs = [...walkTs(path.join(ROOT, 'src')), ...walkTs(path.join(ROOT, 'test')), ...walkTs(path.join(ROOT, 'scripts'))];
const fileCache = new Map<string, { lines: string[]; rel: string }>();
for (const f of allTs) {
  const rel = path.relative(ROOT, f);
  fileCache.set(f, { lines: fs.readFileSync(f, 'utf-8').split('\n'), rel });
}

function escRe(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function findClassInSource(className: string): { file: string; line: number } | null {
  const cn = escRe(className);
  const patterns = [
    new RegExp(`\\bclass\\s+${cn}\\b`),
    new RegExp(`\\bexport\\s+class\\s+${cn}\\b`),
    new RegExp(`\\bconst\\s+${cn}\\s*=`),
    new RegExp(`\\bexport\\s+const\\s+${cn}\\s*=`),
  ];
  for (const [, { lines, rel }] of fileCache) {
    if (rel.includes('/dist/')) continue;
    for (let i = 0; i < lines.length; i++) {
      for (const p of patterns) {
        if (p.test(lines[i])) return { file: rel, line: i + 1 };
      }
    }
  }
  return null;
}

function findMethodInFile(methodName: string, targetFile?: string): { file: string; line: number } | null {
  const shortName = escRe(methodName.includes('.') ? methodName.split('.').pop()! : methodName);
  if (!shortName || shortName.length < 2) return null;
  const patterns = [
    new RegExp(`\\b${shortName}\\s*\\(`),
    new RegExp(`\\b${shortName}\\s*=\\s*\\(`),
    new RegExp(`\\bfunction\\s+${shortName}\\b`),
  ];
  const searchFiles = targetFile ? [[targetFile, fileCache.get(path.join(ROOT, targetFile))]] : [...fileCache.entries()];
  for (const [, entry] of searchFiles as any) {
    if (!entry) continue;
    const { lines, rel } = entry;
    if (rel.includes('/dist/')) continue;
    for (let i = 0; i < lines.length; i++) {
      for (const p of patterns) {
        if (p.test(lines[i])) return { file: rel, line: i + 1 };
      }
    }
  }
  return null;
}

let filled = 0;
let skipped = 0;

for (const uuid of idx.list()) {
  const unit = idx.get(uuid);
  if (!unit) continue;
  const type = unit.ior.replace('ior:class:', '');
  const sf = (unit.model as Record<string, unknown>).sourceFile as string || '';
  if (sf && !sf.includes('.scenario.json')) continue;

  const name = String((unit.model as Record<string, unknown>).name || '');
  let found: { file: string; line: number } | null = null;

  if (type === 'Class') {
    const className = name.replace(/\s.*/, '');
    found = findClassInSource(className);
  } else if (type === 'Method') {
    const parts = name.split('.');
    const methodName = parts.length > 1 ? parts[parts.length - 1] : name;
    const className = parts.length > 1 ? parts[0] : '';
    if (className) {
      const classMatch = findClassInSource(className);
      if (classMatch) {
        found = findMethodInFile(methodName, classMatch.file) || classMatch;
      }
    }
    if (!found) found = findMethodInFile(methodName);
  } else if (type === 'Implementation') {
    if (name.includes(':')) {
      const implName = name.split(':').pop()!.trim().split(' ')[0];
      found = findMethodInFile(implName);
    }
  } else if (type === 'UseCase') {
    const verb = String((unit.model as Record<string, unknown>).verb || '');
    const obj = String((unit.model as Record<string, unknown>).object || '');
    if (obj && verb) {
      const classMatch = findClassInSource(obj);
      if (classMatch) found = findMethodInFile(verb, classMatch.file) || classMatch;
    }
    if (!found && verb) found = findMethodInFile(verb);
  }

  if (!found) { skipped++; continue; }

  if (apply) {
    (unit.model as Record<string, unknown>).sourceFile = `ior:file:${found.file}`;
    (unit.model as Record<string, unknown>).sourceLine = found.line;
    const dir = path.join(idx['basePath'], idx.prefixPath(uuid));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${uuid}.scenario.json`), JSON.stringify(unit, null, 2));
    filled++;
  } else {
    console.log(`  FILL ${type}: ${name.slice(0, 40)} ← ${found.file}:${found.line}`);
    filled++;
  }
}

console.log(`\nResults: ${filled} ${apply ? 'filled' : 'would fill'}, ${skipped} not found in source`);
if (!apply) console.log('Dry run. Use --apply to write.');
