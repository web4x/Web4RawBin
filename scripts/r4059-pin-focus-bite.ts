// R40.1 CR#86-3 + #86-4 BITE — pin single-focus + auto-advance-at-clean-QA (finishes T40.1). In-memory fake index, no
// disk (architect backstops on ship; tester @390-gates the Set-Current-A-then-B integration). Run: node --import tsx scripts/r4059-pin-focus-bite.ts
import { CurrentSprint } from '../src/ts/scenario/CurrentSprint.js';

const CL = {
  wip: '- [x] Planned\n- [x] In Progress\n- [ ] QA Review',
  cleanQa: '- [x] Planned\n- [x] In Progress\n- [x] QA Review',
  band: '- [x] Planned\n- [x] In Progress\n- [ ] QA Review\n  - [ ] processing change requests',
};
const CUR = 'current-sprint-singleton-0000-000000000001';
const mk = (uuid: string, name: string, cl: string, lastAdv: string) => ({ ior: 'ior:class:Task', model: { uuid, name, statusChecklist: cl, lastAdvancedAt: lastAdv } });
const build = (aCl: string, bCl: string, singleton: Record<string, unknown> = {}) => {
  const units: Record<string, any> = {
    a: mk('a', 'Task A', aCl, '2026-01-01T00:00:00Z'), b: mk('b', 'Task B', bCl, '2026-01-02T00:00:00Z'), // B ranks first by lastAdvancedAt
    s40: { ior: 'ior:class:Sprint', model: { uuid: 's40', name: 'Sprint 40', number: 40, tasks: ['ior:instance:a', 'ior:instance:b'] } },
    [CUR]: { ior: 'ior:class:CurrentSprint', model: { uuid: CUR, ...singleton } },
  };
  return { get: (u: string) => units[u.replace('ior:instance:', '')] || null, list: () => Object.keys(units) } as any;
};
const RS = { number: 40, uuid: 's40', name: 'Sprint 40' };
const cur = (s: any) => s.current?.taskUuid || null;
const nxt = (s: any) => s.nextBacklog?.taskUuid || null;
let pass = true;
const chk = (n: string, ok: boolean, got?: unknown) => { console.log(`${ok ? '✓' : '✗ FAIL'} ${n}${ok ? '' : ' — got ' + JSON.stringify(got)}`); pass = pass && ok; };

// #86-4 auto-advance at CLEAN QA (band stays)
chk('#86-4 A designated + CLEAN QA-Review → NOT held current (advances off clean QA)', cur(CurrentSprint.slotsFrom(build(CL.cleanQa, CL.wip, { currentTaskUuid: 'a' }), RS, 'a')) !== 'a');
chk('#86-4 A designated + BAND (open CR) → STAYS current (processing a CR IS working)', cur(CurrentSprint.slotsFrom(build(CL.band, CL.wip, { currentTaskUuid: 'a' }), RS, 'a')) === 'a');
chk('#86-4 A designated + In-Progress → STAYS current', cur(CurrentSprint.slotsFrom(build(CL.wip, CL.wip, { currentTaskUuid: 'a' }), RS, 'a')) === 'a');

// #86-3 single-focus: nextBacklogOverride=A demotes the displaced prior-current A to NEXT (B is the new current)
const demoted = CurrentSprint.slotsFrom(build(CL.wip, CL.wip, { currentTaskUuid: 'b', nextBacklogOverride: 'a' }), RS, 'b');
chk('#86-3 B current + nextBacklogOverride=A → current=B AND next=A (single-focus, prior demoted not lost)', cur(demoted) === 'b' && nxt(demoted) === 'a', { cur: cur(demoted), next: nxt(demoted) });
// STUB-MUST-FAIL: without the capture (no override) A is NOT surfaced as next
const noCapture = CurrentSprint.slotsFrom(build(CL.wip, CL.wip, { currentTaskUuid: 'b' }), RS, 'b');
chk('#86-3 STUB: no nextBacklogOverride (no demote wiring) → next != A (RED baseline)', nxt(noCapture) !== 'a', nxt(noCapture));

if (!pass) { console.log('\n✗ pin-focus bite FAILED'); process.exit(1); }
console.log('\n✓ CR#86-3/#86-4: clean-QA advances (band stays current) + Set-Current demotes prior→next (single-focus, never 2 currents)');
