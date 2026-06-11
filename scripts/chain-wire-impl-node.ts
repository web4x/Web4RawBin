/**
 * chain.wireImplNode — Method→Implementation→Test wiring (legacy entry point).
 *
 * THIN SHIM: all logic lives in Chain (src/ts/scenario/skill-classes.ts).
 * Equivalent Object.verb invocations:
 *   npx tsx scripts/objectVerb.ts Chain wireImplNode <method-uuid> [--dryRun]
 *   npx tsx scripts/objectVerb.ts Chain wireAllMissing [--dryRun]
 *   taskChain chain.wireImplNode <method-uuid>        (OOSH, Tab-completes)
 *
 * Legacy usage (preserved):
 *   npx tsx scripts/chain-wire-impl-node.ts <method-uuid> [--dry-run]
 *   npx tsx scripts/chain-wire-impl-node.ts --all-missing [--dry-run]
 *
 * [impl:uuid:d4e5f6a7-b8c9-4d0e-9f1a-2b3c4d5e6f7a] chain.wireImplNode
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Chain, type WireResult } from '../src/ts/scenario/skill-classes.js';
import { ScenarioIndex } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(path.join(__dirname, '..'));

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('--dryRun');
const allMissing = args.includes('--all-missing');
const uuids = args.filter(a => !a.startsWith('--'));

if (!allMissing && uuids.length === 0) {
  console.log('Usage: npx tsx scripts/chain-wire-impl-node.ts <method-uuid> [--dry-run]');
  console.log('       npx tsx scripts/chain-wire-impl-node.ts --all-missing [--dry-run]');
  process.exit(1);
}

const chain = new Chain(new ScenarioIndex(path.join(REPO, 'scenario/index')), path.join(REPO, 'src'), path.join(REPO, 'test'));
const results: WireResult[] = allMissing ? chain.wireAllMissing(dryRun) : uuids.map(u => chain.wireImplNode(u, dryRun));

console.log(`\n# chain.wireImplNode${dryRun ? ' (DRY RUN)' : ''}\n`);
console.log(`Methods to process: ${results.length}\n`);

let created = 0, wired = 0, skipped = 0;
for (const r of results) {
  if (r.action === 'created') {
    created++;
    console.log(`CREATE: ${r.methodName}`);
    console.log(`  Impl UUID: ${r.implUuid}`);
    console.log(`  Tests moved: ${r.testsMoved} (Method.tests[] → Impl.tests[])`);
    console.log(`  Source marker: Add [impl:uuid:${r.implUuid}] in ${r.sourceFile}`);
    console.log('');
  } else if (r.action === 'already-wired') {
    wired++;
    console.log(`SKIP (already wired): ${r.methodName} → impl ${(r.implUuid || '').slice(0, 8)}`);
  } else {
    skipped++;
    console.log(`SKIP (not a Method): ${r.methodUuid}`);
  }
}

console.log(`\n## Summary`);
console.log(`  Created: ${created}`);
console.log(`  Already wired: ${wired}`);
console.log(`  Skipped: ${skipped}`);
if (dryRun) console.log(`\nDry run — no files written. Remove --dry-run to apply.`);
else if (created > 0) console.log(`\nNext: expert adds [impl:uuid:] markers in source files listed above.`);
