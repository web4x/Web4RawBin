// Build #86-4 ROLLED-STATUS READ BITE — the shared recursive rollup READ (rolledTaskStatus) used at the /api/ior,
// trace-node and pin-slot read boundaries. Proves a coordination-root reads the WEAKEST-LINK rollup of its children,
// NOT its lying leaf/stored status. This is the READ-side twin of the pure rollupParentStatus bite (task-status.ts
// --rollup-bite): here the recursion resolves children through an injected getUnit getter (an in-memory index stand-in
// for ScenarioIndex.get) exactly as server.ts wires it. Node-testable (pure, injected getter). Run:
//   /opt/node22/bin/node --import tsx scripts/r86-4-rolled-status-read-bite.ts
import { rolledTaskStatus, deriveStatusEnum } from '../src/ts/scenario/task-status.js';

// A tiny in-memory unit store mirroring ScenarioIndex.get's contract: uuid → { ior, model } | null.
type Unit = { ior: string; model: Record<string, unknown> };
const units: Record<string, Unit> = {};
const mkTask = (uuid: string, checklist: string, childUuids: string[] = []): void => {
  // 37.4's REAL on-disk shape: children referenced via legacy `[task:uuid:]` prose markers in the `subtasks` TEXT field,
  // and the parent's OWN checklist LIES (derives a lower status than the rollup). status is stored but must be IGNORED.
  const subtasks = childUuids.length
    ? 'root of decomposition:\n' + childUuids.map((c, i) => `- [Task ${i}](./x.md) \`[task:uuid:${c}]\``).join('\n')
    : '';
  units[uuid] = { ior: 'ior:class:Task', model: { uuid, name: uuid, status: 'Planned', statusChecklist: checklist, subtasks } };
};
const getUnit = (u: string): Unit | null => units[u] ?? null;

const PLANNED = '- [x] Planned\n- [ ] In Progress\n- [ ] QA Review\n- [ ] Done';
const INPROG  = '- [x] Planned\n- [x] In Progress\n- [ ] QA Review';
const QAREVIEW = '- [x] Planned\n- [x] In Progress\n- [x] QA Review';
const DONE    = '- [x] Planned\n- [x] In Progress\n- [x] QA Review\n- [x] Done';

// Coordination-root T37.4: OWN checklist derives 'Planned', all 3 children are 'QA Review'.
const ROOT = '79fd2164-3f1a-4a60-b91f-87fbaa5f8a2d';
const K1 = '236918e9-6369-450f-aec3-b741451be147', K2 = 'fe6b4379-f116-4bf5-8b81-dd7d41d1bdba', K3 = '1b8ebc9a-7b94-468c-a0a9-f40f648e4cad';
mkTask(ROOT, PLANNED, [K1, K2, K3]);
mkTask(K1, QAREVIEW); mkTask(K2, QAREVIEW); mkTask(K3, QAREVIEW);

let pass = true;
const chk = (name: string, ok: boolean) => { console.log(`${ok ? '✓' : '✗ FAIL'} ${name}`); pass = pass && ok; };

// (1) THE FIX: the coordination-root READS the rollup (QA Review), not its leaf/stored 'Planned'.
chk("coordination-root T37.4 reads 'QA Review' via rolledTaskStatus (rollup of children)", rolledTaskStatus(getUnit, ROOT) === 'QA Review');

// (2) STUB-MUST-FAIL: the OLD leaf-only read (deriveStatusEnum of the root's own checklist) returns 'Planned' = the bug.
chk("STUB (RED baseline): the leaf-only read returns 'Planned' for the coordination-root — a read that shows that is the bug", deriveStatusEnum(String(units[ROOT].model.statusChecklist)) === 'Planned');
chk('and the rollup read DISAGREES with the leaf read (Planned≠QA Review) — the fix is observable', rolledTaskStatus(getUnit, ROOT) !== deriveStatusEnum(String(units[ROOT].model.statusChecklist)));

// (3) WEAKEST-LINK: one In-Progress child pins the parent to 'In Progress' (never past its least-advanced child).
mkTask(K2, INPROG); // demote one child
chk("weakest-link: one In-Progress child ⇒ parent rolls up 'In Progress' (not QA Review)", rolledTaskStatus(getUnit, ROOT) === 'In Progress');
mkTask(K2, QAREVIEW); // restore

// (4) ALL DONE ⇒ Done.
mkTask(K1, DONE); mkTask(K2, DONE); mkTask(K3, DONE);
chk("all children Done ⇒ parent rolls up 'Done'", rolledTaskStatus(getUnit, ROOT) === 'Done');
mkTask(K1, QAREVIEW); mkTask(K2, QAREVIEW); mkTask(K3, QAREVIEW);

// (5) REAL LEAF (no children) reads its OWN deriveStatusEnum — unaffected by the rollup.
const LEAF = 'aaaaaaaa-0000-0000-0000-000000000001';
mkTask(LEAF, INPROG);
chk("a real leaf (no children) reads its own deriveStatusEnum ('In Progress') — unaffected", rolledTaskStatus(getUnit, LEAF) === 'In Progress');

// (6) RECURSION: a grandparent whose only child is the (QA-Review-rollup) coordination-root rolls up 'QA Review'.
const GRAND = 'bbbbbbbb-0000-0000-0000-000000000002';
mkTask(GRAND, PLANNED, [ROOT]);
chk('recursion: grandparent over the QA-Review-rollup root rolls up QA Review (a child may itself be a parent)', rolledTaskStatus(getUnit, GRAND) === 'QA Review');

// (7) CYCLE-GUARD: a self/mutual reference does not infinite-loop (returns a floor, no throw).
const CYC = 'cccccccc-0000-0000-0000-000000000003';
mkTask(CYC, PLANNED, [CYC]); // references itself
let noThrow = true; try { rolledTaskStatus(getUnit, CYC); } catch { noThrow = false; }
chk('cycle-guard: a self-referencing task does not infinite-loop (no throw)', noThrow);

// (8) DEFENSIVE: an unresolvable uuid returns a floor ('Planned'), never throws.
chk("unresolvable uuid → 'Planned' floor (defensive, no throw)", rolledTaskStatus(getUnit, 'dddddddd-0000-0000-0000-000000000004') === 'Planned');

if (!pass) { console.log('\n✗ rolled-status read bite FAILED'); process.exit(1); }
console.log('\n✓ rolled-status read: a coordination-root reads the weakest-link rollup of its children (not its lying leaf/stored status); leaf unaffected; recursive + cycle-guarded — the READ-boundary twin of rollupParentStatus');
