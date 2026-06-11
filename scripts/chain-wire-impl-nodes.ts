/**
 * Chain-wire Impl nodes: scan source [impl:uuid:] markers → create Impl scenario
 * units with real sourceFile+line. Full-scan verified (not sampled).
 *
 * Usage:
 *   npx tsx scripts/chain-wire-impl-nodes.ts --report
 *   npx tsx scripts/chain-wire-impl-nodes.ts --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIRS = [
  path.join(__dirname, '../src/ts/server'),
  path.join(__dirname, '../src/public/ts'),
  path.join(__dirname, '../src/ts/scenario'),
  path.join(__dirname, '../src/ts/shared'),
];
const SCENARIO_INDEX = path.join(__dirname, '../scenario/index');
const mode = process.argv[2] || '--report';

interface ImplMarker {
  uuid: string;
  title: string;
  sourceFile: string;
  sourceLine: number;
}

function walkTs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') out.push(...walkTs(full));
    else if (entry.isFile() && entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

function prefixPath(uuid: string): string {
  const hex = uuid.replace(/-/g, '');
  return path.join(hex[0], hex[1], hex[2], hex[3], hex[4]);
}

function implExists(uuid: string): boolean {
  const fp = path.join(SCENARIO_INDEX, prefixPath(uuid), `${uuid}.scenario.json`);
  return fs.existsSync(fp);
}

const markers: ImplMarker[] = [];
for (const dir of SRC_DIRS) {
  for (const file of walkTs(dir)) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/\[impl:uuid:([0-9a-f-]{36})\]\s*(.*)/i);
      if (!m) continue;
      const relFile = path.relative(path.join(__dirname, '..'), file);
      markers.push({ uuid: m[1].toLowerCase(), title: m[2].trim() || relFile, sourceFile: relFile, sourceLine: i + 1 });
    }
  }
}

let created = 0, existed = 0, invalid = 0;
const seen = new Set<string>();

for (const mk of markers) {
  if (seen.has(mk.uuid)) continue;
  seen.add(mk.uuid);

  if (!mk.uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)) {
    console.log(`SKIP (invalid v4): ${mk.uuid} at ${mk.sourceFile}:${mk.sourceLine}`);
    invalid++;
    continue;
  }

  if (!fs.existsSync(path.join(__dirname, '..', mk.sourceFile))) {
    console.log(`SKIP (file missing): ${mk.sourceFile}`);
    invalid++;
    continue;
  }

  if (implExists(mk.uuid)) { existed++; continue; }

  const unit = {
    ior: 'ior:class:Implementation',
    model: {
      uuid: mk.uuid,
      name: mk.title || mk.sourceFile,
      sourceFile: mk.sourceFile,
      sourceLine: mk.sourceLine,
      unitLinks: [],
    },
    ownerIor: null,
  };

  if (mode === '--apply') {
    const dir = path.join(SCENARIO_INDEX, prefixPath(mk.uuid));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${mk.uuid}.scenario.json`), JSON.stringify(unit, null, 2));
  }
  console.log(`${mode === '--apply' ? 'CREATED' : 'WOULD CREATE'}: ${mk.uuid} ← ${mk.sourceFile}:${mk.sourceLine} ${mk.title}`);
  created++;
}

console.log(`\n${markers.length} markers scanned (${seen.size} unique). ${created} to create, ${existed} already exist, ${invalid} skipped.`);
if (mode !== '--apply') console.log('Dry run. Use --apply to write.');
