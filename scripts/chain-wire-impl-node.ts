/**
 * chain.wireImplNode — ensure Method→Implementation→Test chain node.
 *
 * Given a Method UUID: creates Impl unit if missing, wires Method.implementations[],
 * moves Method.tests[] → Impl.tests[], reports where to add [impl:uuid:] marker.
 * Idempotent.
 *
 * Usage:
 *   npx tsx scripts/chain-wire-impl-node.ts <method-uuid> [--dry-run]
 *   npx tsx scripts/chain-wire-impl-node.ts --all-missing [--dry-run]
 *
 * [impl:uuid:d4e5f6a7-b8c9-4d0e-9f1a-2b3c4d5e6f7a] chain.wireImplNode
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, type ScenarioUnit } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
const idx = new ScenarioIndex(INDEX_DIR);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const allMissing = args.includes('--all-missing');

function ior(s: string): string { return String(s || '').replace('ior:instance:', ''); }
function short(uuid: string): string { return uuid.slice(0, 8); }

function resolvePrefix(prefix: string): string | null {
  if (idx.has(prefix)) return prefix;
  return idx.list().find(u => u.startsWith(prefix)) || null;
}

function findClassSourceFile(methodUuid: string): string {
  const methUnit = idx.get(methodUuid);
  if (!methUnit) return '';
  const methName = String(methUnit.model.name || '');
  const clsName = methName.split('.')[0];
  // Walk all Class units to find the parent
  for (const uuid of idx.list()) {
    const u = idx.get(uuid);
    if (!u || u.ior !== 'ior:class:Class') continue;
    const methods = (u.model as Record<string, unknown>).methods;
    if (Array.isArray(methods) && methods.some(m => ior(String(m)) === methodUuid)) {
      const sf = String((u.model as Record<string, unknown>).sourceFile || '');
      if (sf) return sf;
    }
  }
  // Fallback: infer from class name
  const kebab = clsName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return `ior:file:src/ts/server/${kebab}.ts`;
}

interface WireResult {
  methodUuid: string;
  methodName: string;
  action: 'created' | 'already-wired' | 'skipped';
  implUuid?: string;
  testsMoved: number;
  sourceFile: string;
}

function wireMethod(methodUuid: string): WireResult {
  const methUnit = idx.get(methodUuid);
  if (!methUnit || methUnit.ior !== 'ior:class:Method') {
    return { methodUuid, methodName: '?', action: 'skipped', testsMoved: 0, sourceFile: '' };
  }

  const methModel = methUnit.model as Record<string, unknown>;
  const methName = String(methModel.name || methodUuid);
  const impls = (methModel.implementations as string[]) || [];

  // Check if already wired
  if (impls.length > 0) {
    const allValid = impls.every(i => idx.has(ior(i)));
    if (allValid) {
      return { methodUuid, methodName: methName, action: 'already-wired', implUuid: ior(impls[0]), testsMoved: 0, sourceFile: '' };
    }
  }

  // Create Implementation unit
  const implUuid = crypto.randomUUID();
  const sourceFile = findClassSourceFile(methodUuid);
  const methTests = (methModel.tests as string[]) || [];

  const implUnit: ScenarioUnit = {
    ior: 'ior:class:Implementation',
    model: {
      uuid: implUuid,
      name: methName,
      sourceFile: sourceFile,
      tests: [...methTests],
    },
    ownerIor: null,
  };

  if (!dryRun) {
    // Write Impl unit
    idx.put(implUuid, implUnit);

    // Wire Method.implementations[]
    methModel.implementations = [...impls, `ior:instance:${implUuid}`];

    // Move tests from Method to Impl (chain goes Method→Impl→Test, not Method→Test)
    methModel.tests = [];

    // Save Method
    idx.put(methodUuid, methUnit);
  }

  return {
    methodUuid,
    methodName: methName,
    action: 'created',
    implUuid,
    testsMoved: methTests.length,
    sourceFile: sourceFile.replace('ior:file:', ''),
  };
}

// --- Main ---

let methodUuids: string[] = [];

if (allMissing) {
  methodUuids = idx.list().filter(uuid => {
    const u = idx.get(uuid);
    if (!u || u.ior !== 'ior:class:Method') return false;
    const impls = ((u.model as Record<string, unknown>).implementations as string[]) || [];
    return impls.length === 0;
  });
} else {
  methodUuids = args.filter(a => !a.startsWith('--')).map(a => resolvePrefix(a) || a);
}

if (methodUuids.length === 0) {
  console.log('Usage: npx tsx scripts/chain-wire-impl-node.ts <method-uuid> [--dry-run]');
  console.log('       npx tsx scripts/chain-wire-impl-node.ts --all-missing [--dry-run]');
  process.exit(1);
}

console.log(`\n# chain.wireImplNode${dryRun ? ' (DRY RUN)' : ''}\n`);
console.log(`Methods to process: ${methodUuids.length}\n`);

let created = 0, wired = 0, skipped = 0;

for (const uuid of methodUuids) {
  const result = wireMethod(uuid);
  switch (result.action) {
    case 'created':
      created++;
      console.log(`CREATE: ${result.methodName}`);
      console.log(`  Impl UUID: ${result.implUuid}`);
      console.log(`  Tests moved: ${result.testsMoved} (Method.tests[] → Impl.tests[])`);
      console.log(`  Source marker: Add [impl:uuid:${result.implUuid}] in ${result.sourceFile}`);
      console.log('');
      break;
    case 'already-wired':
      wired++;
      console.log(`SKIP (already wired): ${result.methodName} → impl ${short(result.implUuid || '')}`);
      break;
    case 'skipped':
      skipped++;
      console.log(`SKIP (not a Method): ${result.methodUuid}`);
      break;
  }
}

console.log(`\n## Summary`);
console.log(`  Created: ${created}`);
console.log(`  Already wired: ${wired}`);
console.log(`  Skipped: ${skipped}`);
if (dryRun) console.log(`\nDry run — no files written. Remove --dry-run to apply.`);
else if (created > 0) console.log(`\nNext: expert adds [impl:uuid:] markers in source files listed above.`);
