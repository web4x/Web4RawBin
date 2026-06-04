/**
 * T178 — Populate forward arrays in scenario index for the 4 downstream hops:
 *   UC→Class, Class→Method, Method→Implementation, Implementation→Test
 *
 * Creates Implementation + Test units from [impl:uuid:] and [test:uuid:] markers.
 * Links forward arrays by matching markers to existing units.
 * Idempotent: re-running produces same data.
 *
 * Usage:
 *   npx tsx scripts/populate-forward-refs.ts --dry-run
 *   npx tsx scripts/populate-forward-refs.ts --apply
 *
 * [impl:uuid:4bd33c18-a707-4ca3-8c87-9cc1a5c2f516] R-Q
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, type ScenarioUnit } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
const SRC_DIR = path.join(__dirname, '../src');
const TEST_DIR = path.join(__dirname, '../test');

const apply = process.argv.includes('--apply');
const idx = new ScenarioIndex(INDEX_DIR);

interface MarkerInfo { uuid: string; title: string; file: string; }

function scanMarkers(dir: string, pattern: RegExp): MarkerInfo[] {
  const results: MarkerInfo[] = [];
  function walk(d: string) {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      if (ent.isDirectory() && ent.name !== 'node_modules' && ent.name !== 'dist') walk(path.join(d, ent.name));
      else if (ent.isFile() && ent.name.endsWith('.ts')) {
        const text = fs.readFileSync(path.join(d, ent.name), 'utf-8');
        for (const m of text.matchAll(pattern)) {
          const uuid = m[1].toLowerCase();
          const title = m[2]?.trim().slice(0, 120) || ent.name;
          results.push({ uuid, title, file: path.relative(path.join(__dirname, '..'), path.join(d, ent.name)) });
        }
      }
    }
  }
  walk(dir);
  return results;
}

// Load all units by type
const allUuids = idx.list();
const unitsByType = new Map<string, ScenarioUnit[]>();
const unitByUuid = new Map<string, ScenarioUnit>();
for (const uuid of allUuids) {
  const u = idx.get(uuid);
  if (!u) continue;
  unitByUuid.set(uuid, u);
  const t = u.ior.replace('ior:class:', '');
  if (!unitsByType.has(t)) unitsByType.set(t, []);
  unitsByType.get(t)!.push(u);
}

console.log(`\nLoaded ${allUuids.length} units: ${[...unitsByType.entries()].map(([t, us]) => `${t}=${us.length}`).join(', ')}`);

// Step 1: Create Implementation units from [impl:uuid:] in src/
const implMarkers = scanMarkers(SRC_DIR, /\[impl:uuid:([0-9a-f-]{36})\]\s*(.*)/gi);
console.log(`\nImpl markers in src/: ${implMarkers.length}`);
let implCreated = 0;
for (const m of implMarkers) {
  if (!unitByUuid.has(m.uuid)) {
    const unit: ScenarioUnit = {
      ior: 'ior:class:Implementation',
      model: { uuid: m.uuid, name: m.title, sourceFile: `ior:file:${m.file}`, tests: [] },
      ownerIor: null,
    };
    if (apply) idx.put(m.uuid, unit);
    unitByUuid.set(m.uuid, unit);
    implCreated++;
  }
}
console.log(`  Created ${implCreated} new Implementation units`);

// Step 2: Create Test units from [test:uuid:] in test/
const testMarkers = scanMarkers(TEST_DIR, /\[test:uuid:([0-9a-f-]{36})\]\s*(.*)/gi);
console.log(`\nTest markers in test/: ${testMarkers.length}`);
let testCreated = 0;
for (const m of testMarkers) {
  if (!unitByUuid.has(m.uuid)) {
    const unit: ScenarioUnit = {
      ior: 'ior:class:Test',
      model: { uuid: m.uuid, name: m.title, file: `ior:file:${m.file}`, requirements: [], methods: [], status: 'PASS' },
      ownerIor: null,
    };
    if (apply) idx.put(m.uuid, unit);
    unitByUuid.set(m.uuid, unit);
    testCreated++;
  }
}
console.log(`  Created ${testCreated} new Test units`);

// Step 3: Link UC → Class (from Class.useCases[] reverse scan, or by matching UC.model.object to Class.model.name)
let ucClassLinks = 0;
for (const uc of (unitsByType.get('UseCase') || [])) {
  const ucModel = uc.model as Record<string, unknown>;
  const classes = (ucModel.classes as string[]) || [];
  if (classes.length > 0) continue; // already linked
  const objectName = String(ucModel.object || ucModel.name || '').split('.')[0];
  if (!objectName) continue;
  const matchedClasses: string[] = [];
  for (const cls of (unitsByType.get('Class') || [])) {
    const clsName = String(cls.model.name || '');
    if (clsName === objectName || clsName.includes(objectName)) {
      matchedClasses.push(`ior:instance:${cls.model.uuid}`);
    }
  }
  if (matchedClasses.length > 0) {
    ucModel.classes = matchedClasses;
    if (apply) idx.put(String(ucModel.uuid), uc);
    ucClassLinks += matchedClasses.length;
  }
}
console.log(`\nUC→Class links added: ${ucClassLinks}`);

// Step 4: Class → Method (already mostly populated from T172; verify/fill gaps)
let classMethodLinks = 0;
for (const cls of (unitsByType.get('Class') || [])) {
  const clsModel = cls.model as Record<string, unknown>;
  const methods = (clsModel.methods as string[]) || [];
  if (methods.length > 0) continue; // already linked
  const clsName = String(clsModel.name || '');
  const matchedMethods: string[] = [];
  for (const meth of (unitsByType.get('Method') || [])) {
    const methName = String(meth.model.name || '');
    if (methName.startsWith(clsName + '.')) {
      matchedMethods.push(`ior:instance:${meth.model.uuid}`);
    }
  }
  if (matchedMethods.length > 0) {
    clsModel.methods = matchedMethods;
    if (apply) idx.put(String(clsModel.uuid), cls);
    classMethodLinks += matchedMethods.length;
  }
}
console.log(`Class→Method links added: ${classMethodLinks}`);

// Step 5: Method → Implementation
// Strategy: find the impl marker whose file basename matches the class name of the method
// e.g. method "RbDetailDrawer.open" → class "RbDetailDrawer" → file "rb-detail-drawer.ts" → impl markers in that file
let methodImplLinks = 0;
const implByFile = new Map<string, string[]>();
for (const m of implMarkers) {
  if (!implByFile.has(m.file)) implByFile.set(m.file, []);
  implByFile.get(m.file)!.push(m.uuid);
}
// Build className → source files map: kebab match + grep for class/function/interface definition
const classToFiles = new Map<string, Set<string>>();
for (const cls of (unitsByType.get('Class') || [])) {
  const clsName = String(cls.model.name || '');
  const kebab = clsName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  for (const [file, _] of implByFile) {
    const base = path.basename(file, '.ts');
    if (base === kebab || base.includes(kebab) || file.toLowerCase().includes(clsName.toLowerCase())) {
      if (!classToFiles.has(clsName)) classToFiles.set(clsName, new Set());
      classToFiles.get(clsName)!.add(file);
    } else {
      // Fallback: check if file contains the class/interface/function definition
      try {
        const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf-8');
        if (content.includes(`class ${clsName}`) || content.includes(`interface ${clsName}`) ||
            content.includes(`function ${clsName}`) || content.includes(`export function ${clsName.charAt(0).toLowerCase() + clsName.slice(1)}`)) {
          if (!classToFiles.has(clsName)) classToFiles.set(clsName, new Set());
          classToFiles.get(clsName)!.add(file);
        }
      } catch { /* skip unreadable */ }
    }
  }
}
for (const meth of (unitsByType.get('Method') || [])) {
  const methModel = meth.model as Record<string, unknown>;
  const impls = (methModel.implementations as string[]) || [];
  if (impls.length > 0) continue;
  const methName = String(methModel.name || '');
  const clsName = methName.split('.')[0];
  const files = classToFiles.get(clsName);
  if (files) {
    const matchedImpls: string[] = [];
    for (const f of files) for (const u of (implByFile.get(f) || [])) matchedImpls.push(`ior:instance:${u}`);
    if (matchedImpls.length > 0) {
      methModel.implementations = matchedImpls;
      if (apply) idx.put(String(methModel.uuid), meth);
      methodImplLinks += matchedImpls.length;
    }
  }
}
console.log(`Method→Implementation links added: ${methodImplLinks}`);

// Step 6: Implementation → Test
// Strategy: match by shared task reference (T-number), AC reference, or component name in filename
let implTestLinks = 0;
const testByTaskRef = new Map<string, string[]>();
const testByComponent = new Map<string, string[]>();
for (const m of testMarkers) {
  const taskRefs = m.title.match(/T\d+/gi) || [];
  for (const ref of taskRefs) {
    const key = ref.toUpperCase();
    if (!testByTaskRef.has(key)) testByTaskRef.set(key, []);
    testByTaskRef.get(key)!.push(m.uuid);
  }
  // Index by component name from filename (e.g., test/vitest/scenario.test.ts → "scenario")
  const base = path.basename(m.file, '.test.ts').replace('.spec', '');
  if (!testByComponent.has(base)) testByComponent.set(base, []);
  testByComponent.get(base)!.push(m.uuid);
}
for (const m of implMarkers) {
  const implUnit = unitByUuid.get(m.uuid);
  if (!implUnit) continue;
  const implModel = implUnit.model as Record<string, unknown>;
  const tests = (implModel.tests as string[]) || [];
  if (tests.length > 0) continue;
  const matchedTests: string[] = [];
  // Match by T-number
  const taskRefs = m.title.match(/T\d+/gi) || [];
  for (const ref of taskRefs) {
    for (const testUuid of (testByTaskRef.get(ref.toUpperCase()) || [])) {
      const ior = `ior:instance:${testUuid}`;
      if (!matchedTests.includes(ior)) matchedTests.push(ior);
    }
  }
  // Match by component name (impl file basename ↔ test file basename)
  if (matchedTests.length === 0) {
    const implBase = path.basename(m.file, '.ts');
    const kebab = implBase.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    for (const [comp, testUuids] of testByComponent) {
      if (comp === implBase || comp === kebab || implBase.includes(comp) || comp.includes(kebab)) {
        for (const tu of testUuids) {
          const ior = `ior:instance:${tu}`;
          if (!matchedTests.includes(ior)) matchedTests.push(ior);
        }
      }
    }
  }
  if (matchedTests.length > 0) {
    implModel.tests = matchedTests;
    if (apply) idx.put(m.uuid, implUnit);
    implTestLinks += matchedTests.length;
  }
}
console.log(`Implementation→Test links added: ${implTestLinks}`);

// Summary
const total = idx.list().length;
console.log(`\n=== Summary ===`);
console.log(`Total units: ${total} (was ${allUuids.length})`);
console.log(`New: ${implCreated} Implementation + ${testCreated} Test`);
console.log(`Links: UC→Class=${ucClassLinks}, Class→Method=${classMethodLinks}, Method→Impl=${methodImplLinks}, Impl→Test=${implTestLinks}`);
if (!apply) console.log(`\nDry run. Use --apply to write.`);
