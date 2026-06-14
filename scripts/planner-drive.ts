// Planner driving tool (R20.13) — drive the WIP=1 chain THROUGH the live CurrentSprint instrument.
// Usage: npx tsx scripts/planner-drive.ts focus <task-uuid>     ← auto-derive chain from focused task (PREFERRED)
//        npx tsx scripts/planner-drive.ts hop <hop> <status> [agent]  ← per-agent realtime hop update
//        npx tsx scripts/planner-drive.ts gate                ← check if task-switch gate is proven
//        npx tsx scripts/planner-drive.ts setChain <req> <uc> <class> <method> <impl> <test> "<sprint>" "<task>"
//        npx tsx scripts/planner-drive.ts pin | advance | status
// Hops: req|uc|class|method|impl|test   Statuses: pending|in-progress|done|gate-proven
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CurrentSprint } from '../src/ts/scenario/CurrentSprint.js';
import { ScenarioIndex } from '../src/ts/scenario/index-store.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const cs = CurrentSprint.getInstance(new ScenarioIndex(path.join(REPO, 'scenario/index')) as any);
const [verb, ...a] = process.argv.slice(2);
if (verb === 'focus') {
  const ok = cs.setFocus(a[0], a.includes('--force'));
  if (!ok && !a.includes('--force')) console.log('BLOCKED: current task test hop not gate-proven. Use --force to override.');
  console.log('focus ok=' + ok + ' task=' + a[0]);
}
if (verb === 'hop') {
  const ok = (cs as any).hopUpdate(a[0], a[1], a[2]);
  console.log('hopUpdate ok=' + ok + ' hop=' + a[0] + ' status=' + a[1] + ' agent=' + (a[2] || 'default'));
}
if (verb === 'gate') {
  const proven = (cs as any).isGateProven();
  console.log('gate-proven=' + proven);
  const states = (cs as any).getHopStates();
  for (const [k, v] of Object.entries(states)) console.log('  ' + k + ': ' + (v as any).status + ' (' + (v as any).owner + ' @ ' + (v as any).updatedAt + ')');
}
if (verb === 'setChain') {
  const ok = (cs as any).setChain({ req: a[0], uc: a[1], class: a[2], method: a[3], impl: a[4], test: a[5] }, a[6], a[7]);
  console.log('setChain ok=' + ok);
}
if (verb === 'advance') (cs as any).advance();
console.log('pinCurrent:', JSON.stringify((cs as any).pinCurrent()));
console.log('getActiveChain:');
for (const h of (cs as any).getActiveChain()) console.log('  ' + h.status.padEnd(7) + ' ' + h.type.padEnd(7) + ' ' + h.uuid);
