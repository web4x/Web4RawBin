/**
 * T126 — One-shot view regeneration from scenario index.
 *
 * Usage:
 *   npx tsx scripts/regenerate-views.ts                    # regenerate all
 *   npx tsx scripts/regenerate-views.ts --uuid <uuid>      # regenerate one
 *
 * [impl:uuid:6315a667-59c4-420b-90db-f60bca2d315d] R17.8
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex, ViewGenerator, defaultTemplateRegistry } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = path.join(__dirname, '../scenario/index');
const OUTPUT_DIR = path.join(__dirname, '../scenario/sprints.md');

const index = new ScenarioIndex(INDEX_DIR);
const registry = defaultTemplateRegistry();
const generator = new ViewGenerator(index, registry, OUTPUT_DIR);

const uuidArg = process.argv.indexOf('--uuid');
if (uuidArg !== -1 && process.argv[uuidArg + 1]) {
  const uuid = process.argv[uuidArg + 1];
  const result = generator.generateOne(uuid);
  if (result) {
    console.log(`Generated views for ${uuid}`);
    console.log(`MD:\n${result.md}\n\nHTML:\n${result.html}`);
  } else {
    console.log(`UUID ${uuid} not found in index`);
    process.exit(1);
  }
} else {
  const result = generator.generateAll();
  console.log(`Generated ${result.filesWritten} files`);
  if (result.errors.length) {
    console.log(`Errors: ${result.errors.join(', ')}`);
  }
}
