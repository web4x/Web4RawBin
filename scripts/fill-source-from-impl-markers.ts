// R18.13 gap fill: scan src/**/*.ts for [impl:uuid:] markers,
// match to scenario units (Impl/Method/Class/UC), set sourceFile+sourceLine.
// Usage: npx tsx scripts/fill-source-from-impl-markers.ts [--apply]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
const SRC_DIR = path.join(__dirname, '../src');
const apply = process.argv.includes('--apply');
const idx = new ScenarioIndex(INDEX_DIR);

function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') out.push(...walkTs(full));
    else if (entry.isFile() && entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

const RE = /\[impl:uuid:([0-9a-f-]{36})\]/gi;
let filled = 0;
let alreadyHas = 0;
let noUnit = 0;

for (const file of walkTs(SRC_DIR)) {
  const text = fs.readFileSync(file, 'utf-8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const m of lines[i].matchAll(RE)) {
      const uuid = m[1].toLowerCase();
      const unit = idx.get(uuid);
      if (!unit) { noUnit++; continue; }

      const sf = (unit.model as Record<string, unknown>).sourceFile as string || '';
      if (sf && !sf.includes('.scenario.json')) { alreadyHas++; continue; }

      const relFile = path.relative(path.join(__dirname, '..'), file);
      const lineNum = i + 1;

      if (apply) {
        (unit.model as Record<string, unknown>).sourceFile = `ior:file:${relFile}`;
        (unit.model as Record<string, unknown>).sourceLine = lineNum;
        const dir = path.join(idx['basePath'], idx.prefixPath(uuid));
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${uuid}.scenario.json`), JSON.stringify(unit, null, 2));
        filled++;
      } else {
        console.log(`  FILL: ${uuid.slice(0, 8)} (${(unit.ior || '').split(':')[2]}) ← ${relFile}:${lineNum}`);
        filled++;
      }
    }
  }
}

// Also scan test/ for [test:uuid:] and [impl:uuid:] markers
const TEST_DIR = path.join(__dirname, '../test');
const RE_TEST = /\[test:uuid:([0-9a-f-]{36})\]/gi;
for (const file of walkTs(TEST_DIR)) {
  const text = fs.readFileSync(file, 'utf-8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const re of [RE, RE_TEST]) {
      re.lastIndex = 0;
      for (const m of lines[i].matchAll(re)) {
        const uuid = m[1].toLowerCase();
        const unit = idx.get(uuid);
        if (!unit) { noUnit++; continue; }
        const sf = (unit.model as Record<string, unknown>).sourceFile as string || '';
        if (sf && !sf.includes('.scenario.json')) { alreadyHas++; continue; }
        const relFile = path.relative(path.join(__dirname, '..'), file);
        const lineNum = i + 1;
        if (apply) {
          (unit.model as Record<string, unknown>).sourceFile = `ior:file:${relFile}`;
          (unit.model as Record<string, unknown>).sourceLine = lineNum;
          const dir = path.join(idx['basePath'], idx.prefixPath(uuid));
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, `${uuid}.scenario.json`), JSON.stringify(unit, null, 2));
          filled++;
        } else {
          console.log(`  FILL: ${uuid.slice(0, 8)} (${(unit.ior || '').split(':')[2]}) ← ${relFile}:${lineNum}`);
          filled++;
        }
      }
    }
  }
}

console.log(`\nResults: ${filled} ${apply ? 'filled' : 'would fill'}, ${alreadyHas} already have source, ${noUnit} no unit found`);
if (!apply) console.log('Dry run. Use --apply to write.');
