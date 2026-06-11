/**
 * po.chainFollowUp — CANONICAL chain completion scoreboard (legacy entry point).
 *
 * THIN SHIM: all logic lives in Chain (src/ts/scenario/skill-classes.ts).
 * Equivalent Object.verb invocations:
 *   npx tsx scripts/objectVerb.ts Chain scoreboard [--sprint S19]
 *   taskChain chain.scoreboard --sprint S19          (OOSH, Tab-completes)
 *   taskChain chain.listComplete                     (diffable COMPLETE set)
 *
 * Legacy usage (preserved):
 *   npx tsx scripts/po-chain-follow-up.ts <uuid> [<uuid> ...]
 *   npx tsx scripts/po-chain-follow-up.ts --all
 *   npx tsx scripts/po-chain-follow-up.ts --sprint S19
 *
 * [impl:uuid:bf29a301-c4d5-4e6f-9a7b-8c0d1e2f3a4b] po.chainFollowUp
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Chain } from '../src/ts/scenario/skill-classes.js';
import { ScenarioIndex } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(path.join(__dirname, '..'));

const args = process.argv.slice(2);
const allMode = args.includes('--all');
const sprintArgIdx = args.indexOf('--sprint');
const sprint = sprintArgIdx !== -1 ? args[sprintArgIdx + 1] : undefined;
const uuids = args.filter((a, i) => !a.startsWith('--') && i !== sprintArgIdx + 1);

if (!allMode && !sprint && uuids.length === 0) {
  console.log('Usage: npx tsx scripts/po-chain-follow-up.ts <uuid> [--all] [--sprint S19]');
  process.exit(1);
}

const chain = new Chain(new ScenarioIndex(path.join(REPO, 'scenario/index')), path.join(REPO, 'src'), path.join(REPO, 'test'));
console.log(chain.scoreboard(allMode ? [] : uuids, sprint));
