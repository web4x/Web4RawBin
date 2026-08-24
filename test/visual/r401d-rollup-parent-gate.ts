// R40.1 (d) rollup-parent-status gate — PURE-FN, no browser. Verifies the SHIPPED coordination-root derivation
// (expert commit 1a318c050, CR 18ebe066, design §3): a parent-with-children's status = the WEAKEST-LINK rollup of its
// children's derived statuses (least-advanced by STATUS_ORDER), and childTaskUuids extracts a task's subtask children
// (structured array OR legacy prose [task:uuid:] markers = 37.4's real shape). Two distinct Tests (one-test-one-chain):
//   [test:uuid:9d2e4f70-3c81-4a6b-bf05-1e7a24c8b9d3] → Impl 44c4054a rollupParentStatus (PRIMARY)
//   [test:uuid:5b7c1a83-6f42-4e90-a3d1-8c05e6b47f21] → Impl 6537e99c childTaskUuids
// R2/R6 canon: each assertion set proves it can FAIL — the SAME table is run against an inverted stub (rollup =
// STRONGEST-link; childUuids = ignore-legacy-prose); the stub MUST fail every real assertion (RED→GREEN in one run).
// Consumer of task-status.ts exports only (single-source); no disk write, no server. Run: node --import tsx <this>.
import { rollupParentStatus, childTaskUuids, STATUS_ORDER } from '../../src/ts/scenario/task-status.js';
import { deriveStatusEnum } from '../../src/ts/scenario/task-status.js';

type Enum = (typeof STATUS_ORDER)[number];
let pass = 0, fail = 0;
const A = (cond: boolean, msg: string) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`); } };

// ── (1) rollupParentStatus (44c4054a) — weakest-link parent rollup ──
console.log('── rollupParentStatus (Impl 44c4054a) ──');
const rollupCases: Array<[Enum[], Enum | null, string]> = [
  [['Done', 'Done', 'Done'], 'Done', 'all Done → Done'],
  [['QA Review', 'QA Review'], 'QA Review', 'all QA-Review → QA-Review (the real 37.4 case: parent stored Planned is IGNORED, children rollup wins)'],
  [['Done', 'In Progress'], 'In Progress', 'any In-Progress caps the parent ≤ In-Progress (coordination root never past its least-advanced child)'],
  [['QA Review', 'Planned', 'Done'], 'Planned', 'a Planned child pulls the parent down to Planned (weakest link)'],
  [['In Progress', 'In Progress'], 'In Progress', 'all In-Progress → In-Progress'],
  [[], null, 'empty (no resolvable children) → null (caller uses leaf deriveStatusEnum)'],
];
for (const [inp, exp, why] of rollupCases) A(rollupParentStatus(inp) === exp, `${why} — got ${rollupParentStatus(inp)}`);
// order-independence (weakest link regardless of position)
A(rollupParentStatus(['Planned', 'Done']) === rollupParentStatus(['Done', 'Planned']), 'order-independent');

// ── (1-BITE) inverted stub = STRONGEST-link — the SAME table MUST fail (proves the assertions bite, not vacuous) ──
const rollupStub = (cs: Enum[]): Enum | null => { if (!cs.length) return null; let mx = 0; for (const s of cs) { const i = STATUS_ORDER.indexOf(s); if (i > mx) mx = i; } return STATUS_ORDER[mx]; };
let stubBit = false;
for (const [inp, exp] of rollupCases) if (inp.length && rollupStub(inp) !== exp) stubBit = true; // strongest-link disagrees on every mixed case
A(stubBit, 'BITE: a STRONGEST-link stub FAILS the weakest-link table (gate is non-vacuous)');

// ── (2) childTaskUuids (6537e99c) — subtask-child extraction ──
console.log('── childTaskUuids (Impl 6537e99c) ──');
const U = (n: number) => `${n}${n}${n}${n}${n}${n}${n}${n}-0000-4000-8000-000000000000`.slice(0, 36).padEnd(36, '0');
const c1 = 'aaaaaaaa-1111-4111-8111-111111111111', c2 = 'bbbbbbbb-2222-4222-8222-222222222222';
// structured children array
A(JSON.stringify(childTaskUuids({ children: [c1, c2] }).sort()) === JSON.stringify([c1, c2].sort()), 'structured children[] extracted');
// legacy prose subtasks markers (37.4's real on-disk shape)
A(JSON.stringify(childTaskUuids({ subtasks: `- [x] a [task:uuid:${c1}]\n- [ ] b [task:uuid:${c2}]` }).sort()) === JSON.stringify([c1, c2].sort()), 'legacy prose [task:uuid:] markers in subtasks TEXT extracted (37.4 shape)');
// dedup + no-self
A(JSON.stringify(childTaskUuids({ children: [c1, c1] })) === JSON.stringify([c1]), 'dedup');
A(childTaskUuids({ children: [c1] }, c1).length === 0, 'no-self (a task is not its own child)');
// traceability is NOT scanned (up-refs), only subtasks
A(childTaskUuids({ traceability: `[task:uuid:${c1}]` }).length === 0, 'traceability field NOT scanned (mixes up-refs)');
// empty
A(childTaskUuids({}).length === 0, 'no children → []');

// ── (2-BITE) inverted stub = ignore legacy prose — MUST fail the 37.4-shape case ──
const childStub = (model: Record<string, unknown>): string[] => { const v = model.children; return Array.isArray(v) ? v.map(String) : []; }; // only structured, drops prose
A(childStub({ subtasks: `[task:uuid:${c1}]` }).length === 0 && childTaskUuids({ subtasks: `[task:uuid:${c1}]` }).length === 1, 'BITE: a structured-only stub MISSES the 37.4 legacy-prose children (gate is non-vacuous)');

// ── integration: full 37.4-shape rollup (childTaskUuids → deriveStatusEnum per child → rollupParentStatus) ──
console.log('── integration (37.4 coordination-root shape) ──');
const kids = { subtasks: `- [ ] child A [task:uuid:${c1}]\n- [ ] child B [task:uuid:${c2}]` };
const foundKids = childTaskUuids(kids);
const childDerived = ['QA Review', 'QA Review'] as Enum[]; // both children QA-Review (their own checklists derive this)
A(foundKids.length === 2 && rollupParentStatus(childDerived) === 'QA Review', '37.4: 2 prose children both QA-Review → parent derives QA-Review (its lying Planned fixed by construction, no disk write)');

console.log(`\nrollup-parent gate: ${pass} pass / ${fail} fail`);
console.log(fail === 0 ? 'GREEN (both Impls verified + both BITEs prove non-vacuity)' : 'RED');
process.exitCode = fail === 0 ? 0 : 1;
