// R18.29 backfill: populate model.unitLinks[] from existing on-disk symlinks.
// Reads scenario/sprints.json symlinks, resolves target UUID,
// adds linkPath to unit's unitLinks[].
// Usage: npx tsx scripts/backfill-unit-links.ts [--apply]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
const SCENARIO_ROOT = path.join(__dirname, '../scenario');
const SPRINTS_JSON = path.join(SCENARIO_ROOT, 'sprints.json');

const apply = process.argv.includes('--apply');
const idx = new ScenarioIndex(INDEX_DIR);

function walkSymlinks(dir: string): { fullPath: string; linkPath: string }[] {
  const results: { fullPath: string; linkPath: string }[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkSymlinks(full));
    } else if (entry.isSymbolicLink()) {
      const rel = path.relative(SCENARIO_ROOT, full);
      results.push({ fullPath: full, linkPath: rel });
    }
  }
  return results;
}

const symlinks = walkSymlinks(SPRINTS_JSON);
console.log(`Found ${symlinks.length} symlinks in sprints.json/`);

let linked = 0;
let skipped = 0;
let alreadyHas = 0;

for (const { fullPath, linkPath } of symlinks) {
  const target = fs.readlinkSync(fullPath);
  const resolvedTarget = path.resolve(path.dirname(fullPath), target);
  const basename = path.basename(resolvedTarget, '.scenario.json');
  const uuid = basename;

  const unit = idx.get(uuid);
  if (!unit) { skipped++; continue; }

  const existing: string[] = ((unit.model as Record<string, unknown>).unitLinks as string[]) || [];
  if (existing.includes(linkPath)) { alreadyHas++; continue; }

  if (apply) {
    existing.push(linkPath);
    (unit.model as Record<string, unknown>).unitLinks = existing;
    const dir = path.join(idx['basePath'], idx.prefixPath(uuid));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${uuid}.scenario.json`), JSON.stringify(unit, null, 2));
    linked++;
  } else {
    console.log(`  WOULD ADD: ${uuid.slice(0, 8)} ← ${linkPath}`);
    linked++;
  }
}

console.log(`\nResults: ${linked} ${apply ? 'populated' : 'would populate'}, ${alreadyHas} already present, ${skipped} skipped (no unit)`);
if (!apply) console.log('Dry run. Use --apply to write.');
