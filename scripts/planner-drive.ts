// Planner driving tool (R20.13) — drive the WIP=1 chain THROUGH the live CurrentSprint instrument.
// RUN VIA THE LAUNCHER (#102): `node scripts/drive.mjs <verb> [args…]` — self-heals to node18+ so it works from any
// default node. Do NOT run `npx tsx scripts/planner-drive.ts …` directly: on the repo default node16 that throws
// ERR_UNKNOWN_FILE_EXTENSION (tsx 4.x's loader needs node18+). The launcher runs this file under node18+ via the tsx CLI.
// Usage: node scripts/drive.mjs focus <task-uuid>     ← auto-derive chain from focused task (PREFERRED)
//        node scripts/drive.mjs hop <hop> <status> [agent]  ← per-agent realtime hop update (self-mark)
//        node scripts/drive.mjs gate                ← check if task-switch gate is proven
//        node scripts/drive.mjs setChain <req> <uc> <class> <method> <impl> <test> "<sprint>" "<task>"
//        node scripts/drive.mjs pin | advance | status
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
  // #111: focus advances NATURALLY — no --force (removed/forbidden). false only = the arg is not a Task unit.
  const ok = cs.setFocus(a[0]);
  if (!ok) console.log('focus FAILED: ' + a[0] + ' is not an ior:class:Task unit');
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
if (verb === 'setNextBacklog') {
  const ok = (cs as any).setNextBacklog(a[0]);
  console.log('setNextBacklog ok=' + ok + ' taskUuid=' + a[0]);
}
if (verb === 'clearNextBacklog') (cs as any).clearNextBacklogOverride();
console.log('pinCurrent:', JSON.stringify((cs as any).pinCurrent()));
console.log('getActiveChain:');
for (const h of (cs as any).getActiveChain()) console.log('  ' + h.status.padEnd(7) + ' ' + h.type.padEnd(7) + ' ' + h.uuid);
