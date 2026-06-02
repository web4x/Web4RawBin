/**
 * T169 — Remigration: fix orphans by linking UC→Class from PUML arrows.
 *
 * Usage:
 *   npx tsx scripts/trace-remigrate.ts --dry-run
 *   npx tsx scripts/trace-remigrate.ts --apply
 *
 * [impl:uuid:e43c24fe-a1d1-4d14-8e7a-55ea7edd616f] R-F remediation
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, type ScenarioUnit } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
const SPRINTS_DIR = path.join(__dirname, '../scrum.pmo/sprints');

const idx = new ScenarioIndex(INDEX_DIR);
const dryRun = !process.argv.includes('--apply');

// Build lookup maps
const ucByName = new Map<string, ScenarioUnit>();
const classByName = new Map<string, { uuid: string; unit: ScenarioUnit }>();

for (const uuid of idx.list()) {
  const unit = idx.get(uuid);
  if (!unit) continue;
  const type = unit.ior.replace('ior:class:', '');
  if (type === 'UseCase') ucByName.set(String(unit.model.name || ''), unit);
  if (type === 'Class') classByName.set(String(unit.model.name || ''), { uuid, unit });
}

// Parse PUML UC→Class "implements" arrows
let linksAdded = 0;
for (const sprint of fs.readdirSync(SPRINTS_DIR)) {
  const diagDir = path.join(SPRINTS_DIR, sprint, 'diagrams');
  if (!fs.existsSync(diagDir)) continue;
  for (const file of fs.readdirSync(diagDir)) {
    if (!file.endsWith('.puml')) continue;
    const text = fs.readFileSync(path.join(diagDir, file), 'utf-8');
    // Match: "ucName" --> ClassName : implements
    const arrowRe = /"([^"]+)"\s*-->\s*(\w+)\s*:\s*implements/g;
    for (const m of text.matchAll(arrowRe)) {
      const ucName = m[1];
      const classAlias = m[2];
      const ucUnit = ucByName.get(ucName);
      if (!ucUnit) continue;

      // Resolve alias to class name from PUML class definitions
      const aliasRe = new RegExp(`class\\s+"([^"]+)"\\s+as\\s+${classAlias}\\b`);
      const aliasMatch = text.match(aliasRe);
      const className = aliasMatch ? aliasMatch[1] : classAlias;
      const classEntry = classByName.get(className);
      if (!classEntry) continue;

      const classes = ((ucUnit.model as Record<string, unknown>).classes as string[]) || [];
      const classIor = `ior:instance:${classEntry.uuid}`;
      if (!classes.includes(classIor)) {
        classes.push(classIor);
        (ucUnit.model as Record<string, unknown>).classes = classes;
        if (!dryRun) idx.put(String(ucUnit.model.uuid), ucUnit);
        linksAdded++;
        console.log(`  UC "${ucName}" → Class "${className}" (${classEntry.uuid.slice(0, 8)})`);
      }
    }
  }
}

// Also link orphan Class units to UCs by matching UC.object field to class name
for (const uuid of idx.list()) {
  const unit = idx.get(uuid);
  if (!unit || unit.ior !== 'ior:class:UseCase') continue;
  const objName = String(unit.model.object || '');
  if (!objName) continue;
  const classEntry = classByName.get(objName);
  if (!classEntry) continue;
  const classes = ((unit.model as Record<string, unknown>).classes as string[]) || [];
  const classIor = `ior:instance:${classEntry.uuid}`;
  if (!classes.includes(classIor)) {
    classes.push(classIor);
    (unit.model as Record<string, unknown>).classes = classes;
    if (!dryRun) idx.put(String(unit.model.uuid), unit);
    linksAdded++;
    console.log(`  UC "${unit.model.name}" (object:${objName}) → Class "${classEntry.unit.model.name}" (${classEntry.uuid.slice(0, 8)})`);
  }
}

console.log(`\n${dryRun ? '[DRY RUN] Would add' : 'Added'} ${linksAdded} UC→Class links`);
if (dryRun) console.log('Use --apply to write changes.');
