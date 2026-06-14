// Planner driving tool (R20.13) — drive the WIP=1 chain THROUGH the live CurrentSprint instrument.
// Usage: npx tsx scripts/planner-drive.ts focus <task-uuid>     ← auto-derive chain from focused task (PREFERRED)
//        npx tsx scripts/planner-drive.ts setChain <req> <uc> <class> <method> <impl> <test> "<sprint>" "<task>"
//        npx tsx scripts/planner-drive.ts pin | advance | status
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CurrentSprint } from '../src/ts/scenario/CurrentSprint.js';
import { ScenarioIndex } from '../src/ts/scenario/index-store.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const cs = CurrentSprint.getInstance(new ScenarioIndex(path.join(REPO, 'scenario/index')) as any);
const [verb, ...a] = process.argv.slice(2);
if (verb === 'focus') {
  const ok = cs.setFocus(a[0]);
  console.log('focus ok=' + ok + ' task=' + a[0]);
}
if (verb === 'setChain') {
  const ok = (cs as any).setChain({ req: a[0], uc: a[1], class: a[2], method: a[3], impl: a[4], test: a[5] }, a[6], a[7]);
  console.log('setChain ok=' + ok);
}
if (verb === 'advance') (cs as any).advance();
console.log('pinCurrent:', JSON.stringify((cs as any).pinCurrent()));
console.log('getActiveChain:');
for (const h of (cs as any).getActiveChain()) console.log('  ' + h.status.padEnd(7) + ' ' + h.type.padEnd(7) + ' ' + h.uuid);
