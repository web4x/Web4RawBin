// R40.18 self-verification (BITE 1-4) — in-memory fake index, no disk. Architect backstops the full 7.
import { CurrentSprint } from '../src/ts/scenario/CurrentSprint.js';

const CL = { planned: '- [ ] Planned', wip: '- [x] Planned\n- [x] In Progress\n- [ ] QA Review\n- [ ] Done', qa: '- [x] Planned\n- [x] In Progress\n- [x] QA Review\n- [ ] Done', done: '- [x] Planned\n- [x] In Progress\n- [x] QA Review\n- [x] Done' };
const mk = (uuid: string, name: string, checklist: string) => ({ ior: 'ior:class:Task', model: { uuid, name, statusChecklist: checklist, coveredRequirements: [`ior:instance:req-${uuid}`] } });
const build = (t1cl: string, t2cl: string) => {
  const units: Record<string, any> = {
    t1: mk('t1', 'Task 1', t1cl), t2: mk('t2', 'Task 2', t2cl),
    s40: { ior: 'ior:class:Sprint', model: { uuid: 's40', name: 'Sprint 40', number: 40, tasks: ['ior:instance:t1', 'ior:instance:t2'] } },
  };
  return { get: (u: string) => units[u.replace('ior:instance:', '')] || null, list: () => Object.keys(units) } as any;
};
const RS = { number: 40, uuid: 's40', name: 'Sprint 40' };
const cur = (s: any) => s.current?.taskUuid || null;
let pass = true; const chk = (n: string, ok: boolean, got?: any) => { console.log(`${ok ? '✓' : '✗'} ${n}${ok ? '' : ' — got ' + JSON.stringify(got)}`); pass = pass && ok; };

// BITE-2 QA-advances-current: t1 WIP, t2 planned → current=t1; flip t1→QA → current=t2
chk('BITE-2a current=t1 when t1 WIP', cur(CurrentSprint.slotsFrom(build(CL.wip, CL.planned), RS)) === 't1', cur(CurrentSprint.slotsFrom(build(CL.wip, CL.planned), RS)));
const afterQA = CurrentSprint.slotsFrom(build(CL.qa, CL.planned), RS);
chk('BITE-2b current advances to t2 after t1→QA-Review', cur(afterQA) === 't2', cur(afterQA));

// BITE-1 idempotent: derive twice, identical
const d1 = JSON.stringify(CurrentSprint.slotsFrom(build(CL.qa, CL.planned), RS));
const d2 = JSON.stringify(CurrentSprint.slotsFrom(build(CL.qa, CL.planned), RS));
chk('BITE-1 idempotent (derive twice equal)', d1 === d2);

// BITE-4 lastCompleted-follows-DONE-not-QA: t1→QA → lastCompleted null; t1→Done → lastCompleted=t1
const lcQA = CurrentSprint.slotsFrom(build(CL.qa, CL.planned), RS).lastCompleted?.taskUuid || null;
chk('BITE-4a lastCompleted NULL when t1 only QA-Review (not Done)', lcQA === null, lcQA);
const doneSlots = CurrentSprint.slotsFrom(build(CL.done, CL.planned), RS);
chk('BITE-4b lastCompleted=t1 after t1→Done', (doneSlots.lastCompleted?.taskUuid || null) === 't1', doneSlots.lastCompleted?.taskUuid);
chk('BITE-4c current=t2 after t1→Done', cur(doneSlots) === 't2', cur(doneSlots));

// BITE-3 explicit-wins-WHILE-valid: explicit t2 while t1 WIP → current=t2; t2→Done → stale → auto → current=t1
chk('BITE-3a explicit steer t2 wins while valid', cur(CurrentSprint.slotsFrom(build(CL.wip, CL.wip), RS, 't2')) === 't2', cur(CurrentSprint.slotsFrom(build(CL.wip, CL.wip), RS, 't2')));
const staleExplicit = CurrentSprint.slotsFrom(build(CL.wip, CL.done), RS, 't2'); // steered t2 now Done → stale
chk('BITE-3b stale explicit (t2 Done) → auto resumes → current=t1', cur(staleExplicit) === 't1', cur(staleExplicit));

console.log(pass ? '\n★ R40.18 BITE 1-4 ALL GREEN' : '\n✗ FAIL');
process.exit(pass ? 0 : 1);
