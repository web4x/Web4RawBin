/**
 * team.velocity — team velocity dashboard (legacy entry point).
 *
 * THIN SHIM: all logic lives in Velocity (src/ts/scenario/skill-classes.ts);
 * completion numerator sourced IN-PROCESS from canonical Chain.followUp (no execSync).
 * Equivalent Object.verb invocations:
 *   npx tsx scripts/objectVerb.ts Velocity dashboard [--hours 5] [--sprint S19]
 *   taskChain velocity.dashboard --hours 5            (OOSH, Tab-completes)
 *
 * Legacy usage (preserved):
 *   npx tsx scripts/team-velocity.ts [--since 2026-06-10] [--hours 5] [--sprint S19]
 *
 * [impl:uuid:e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8901] team.velocity
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Chain, Velocity } from '../src/ts/scenario/skill-classes.js';
import { ScenarioIndex } from '../src/ts/scenario/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(path.join(__dirname, '..'));

const args = process.argv.slice(2);
const sinceIdx = args.indexOf('--since');
const hoursIdx = args.indexOf('--hours');
const sprintIdx = args.indexOf('--sprint');
const since = sinceIdx !== -1 ? args[sinceIdx + 1] : undefined;
const hours = hoursIdx !== -1 ? parseFloat(args[hoursIdx + 1]) : undefined;
const sprint = sprintIdx !== -1 ? args[sprintIdx + 1] : undefined;

const chain = new Chain(new ScenarioIndex(path.join(REPO, 'scenario/index')), path.join(REPO, 'src'), path.join(REPO, 'test'));
const velocity = new Velocity(REPO, chain);
console.log(velocity.dashboard(since, hours, sprint));
