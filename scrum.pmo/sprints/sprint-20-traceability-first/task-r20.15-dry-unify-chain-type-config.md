# R20.15: DRY-unify trace forward-key maps → single CHAIN_TYPE_CONFIG

[requirement:uuid:d5734c9b-9b7f-4c46-8e9f-797eb0750e9c] R20.15 — DRY-unify forward-key maps (eliminates BUG9-class by construction)

## Problem (root cause this makes impossible)

Five PARALLEL forward-key maps must be hand-synced today:

| # | Map | File |
|---|-----|------|
| 1 | `TraceModel.FORWARD_KEYS` | trace model |
| 2 | `SCENARIO_FWD` | server.ts:712 |
| 3 | `TRACE_FWD` | server.ts:717 |
| 4 | `EXPECTED_CHILD_TYPE` | server.ts:785 |
| 5 | client `FORWARD_KEYS` | src/public/ts/trace/forward-only.ts:17 |

A missing entry in ANY ONE silently breaks /trace children. **This is exactly BUG9 / BUG12** (`Bug` absent from maps 2–4 → Bug nodes returned `children:[]`). The stopgap (BUG9, v0.6.31) adds the `Bug`/`ChangeRequest` entries to the 5 maps by hand — but the drift can recur for the next type.

## Durable fix

Collapse all 5 maps into ONE shared source of truth `src/ts/shared/chain-model.ts` → `CHAIN_TYPE_CONFIG` + derived accessors. Every consumer imports it. Adding a node type becomes a single-place edit → the BUG9 class of defect is eliminated **by construction**.

## Architect design

### File: `src/ts/shared/chain-model.ts`

```typescript
export interface ChainTypeConfig {
  scenarioForwardKeys: string[];   // replaces SCENARIO_FWD
  traceForwardKeys: string[];      // replaces TRACE_FWD
  expectedChildTypes: string[];    // replaces EXPECTED_CHILD_TYPE
  primaryForwardKey: string;       // replaces TraceModel.FORWARD_KEYS (singular)
  detailViewForwardKeys: string[]; // replaces client forward-only.ts FORWARD_KEYS
}

export const CHAIN_TYPE_CONFIG: Record<string, ChainTypeConfig> = {
  Requirement:    { scenarioForwardKeys: ['useCases'], traceForwardKeys: ['useCases'], expectedChildTypes: ['UseCase', 'Task'], primaryForwardKey: 'useCases', detailViewForwardKeys: ['useCases'] },
  Bug:            { scenarioForwardKeys: ['useCases', 'tasks'], traceForwardKeys: ['useCases', 'tasks'], expectedChildTypes: ['UseCase', 'Task'], primaryForwardKey: 'useCases', detailViewForwardKeys: ['useCases', 'tasks'] },
  ChangeRequest:  { scenarioForwardKeys: ['useCases', 'tasks'], traceForwardKeys: ['useCases', 'tasks'], expectedChildTypes: ['UseCase', 'Task'], primaryForwardKey: 'useCases', detailViewForwardKeys: ['useCases', 'tasks'] },
  Task:           { scenarioForwardKeys: ['subtasks', 'useCases', 'coveredRequirements', 'children'], traceForwardKeys: ['useCases', 'coveredRequirements'], expectedChildTypes: ['Task', 'UseCase', 'Requirement'], primaryForwardKey: 'useCases', detailViewForwardKeys: ['useCases'] },
  UseCase:        { scenarioForwardKeys: ['classes'], traceForwardKeys: ['class'], expectedChildTypes: ['Class', 'Method'], primaryForwardKey: 'classes', detailViewForwardKeys: ['classes'] },
  Class:          { scenarioForwardKeys: ['methods'], traceForwardKeys: ['methods'], expectedChildTypes: ['Method'], primaryForwardKey: 'methods', detailViewForwardKeys: ['methods'] },
  Method:         { scenarioForwardKeys: ['implementations'], traceForwardKeys: ['implementations'], expectedChildTypes: ['Implementation'], primaryForwardKey: 'implementations', detailViewForwardKeys: ['implementations'] },
  Implementation: { scenarioForwardKeys: ['tests'], traceForwardKeys: ['tests'], expectedChildTypes: ['Test'], primaryForwardKey: 'tests', detailViewForwardKeys: ['tests'] },
  Test:           { scenarioForwardKeys: [], traceForwardKeys: [], expectedChildTypes: [], primaryForwardKey: '', detailViewForwardKeys: [] },
  Sprint:         { scenarioForwardKeys: ['tasks'], traceForwardKeys: ['tasks'], expectedChildTypes: ['Task'], primaryForwardKey: 'tasks', detailViewForwardKeys: ['tasks'] },
  Room:           { scenarioForwardKeys: ['files', 'members'], traceForwardKeys: ['files', 'members'], expectedChildTypes: [], primaryForwardKey: 'files', detailViewForwardKeys: ['files', 'members'] },
};

// Derived accessors (replace all 5 maps):
export function scenarioFwd(type: string): string[] {
  return CHAIN_TYPE_CONFIG[type]?.scenarioForwardKeys || [];
}
export function traceFwd(type: string): string[] {
  return CHAIN_TYPE_CONFIG[type]?.traceForwardKeys || [];
}
export function expectedChildTypes(type: string): string[] {
  return CHAIN_TYPE_CONFIG[type]?.expectedChildTypes || [];
}
export function primaryFwd(type: string): string {
  return CHAIN_TYPE_CONFIG[type]?.primaryForwardKey || '';
}
export function detailViewFwd(type: string): string[] {
  return CHAIN_TYPE_CONFIG[type]?.detailViewForwardKeys || [];
}
// Mode-aware accessor (replaces the queryMode === 'trace' ternary):
export function forwardKeysForMode(type: string, mode: 'scenario' | 'trace'): string[] {
  return mode === 'trace' ? traceFwd(type) : scenarioFwd(type);
}
```

### Bug/ChangeRequest canonical value: `['useCases', 'tasks']`

**Evidence (15 Bug/ChangeRequest units on disk, 2026-06-14):**
- useCases populated: 3/15 (chain entry — Bug→UC starts the 6-step chain)
- tasks populated: 4/15 (navigation — Bug→Task links the bug to its fixing task)
- tests populated: 0/15 (chain walks Impl→Test instead; direct tests redundant)

**Rationale:** `useCases` = chain, `tasks` = navigation. Both are load-bearing. `tests` omitted (0 populated, chain provides test access via Impl.tests[]).

### Preserved discrepancy: UseCase trace=['class'] vs scenario=['classes']

The UseCase traceForwardKeys=['class'] (singular — resolves UC.class field) while scenarioForwardKeys=['classes'] (plural — resolves UC.classes array). Both are correct for their modes. CHAIN_TYPE_CONFIG preserves this exactly.

### 5-consumer migration order

| Order | Consumer | File | Deletes | Imports |
|-------|----------|------|---------|---------|
| 1 | `SCENARIO_FWD` | server.ts:712 | inline map literal | `scenarioFwd(type)` |
| 2 | `TRACE_FWD` | server.ts:717 | inline map literal | `traceFwd(type)` |
| 3 | `EXPECTED_CHILD_TYPE` | server.ts:785 | inline map literal | `expectedChildTypes(type)` |
| 4 | `TraceModel.FORWARD_KEYS` | src/ts/shared/TraceModel.ts:24 | exported const | `primaryFwd(type)` |
| 5 | client `FORWARD_KEYS` | src/public/ts/trace/forward-only.ts:9 | const map | `detailViewFwd(type)` |

Server consumers (1-3) migrate first (same runtime, one file). Then shared model (4). Then client (5). Each step: delete local map, import accessor, verify tests pass.

### Parity proof (regression AC)

```typescript
// test/parity-chain-type-config.test.ts
import { scenarioFwd, traceFwd, expectedChildTypes, primaryFwd, detailViewFwd } from '../../src/ts/shared/chain-model.js';

// Frozen reference from v0.6.31 (the 5 maps' exact values before unification):
const PARITY = {
  Requirement:    { scenario: ['useCases'], trace: ['useCases'], expected: ['UseCase','Task'], primary: 'useCases', detail: ['useCases'] },
  Bug:            { scenario: ['useCases','tasks'], trace: ['useCases','tasks'], expected: ['UseCase','Task'], primary: 'useCases', detail: ['useCases','tasks'] },
  ChangeRequest:  { scenario: ['useCases','tasks'], trace: ['useCases','tasks'], expected: ['UseCase','Task'], primary: 'useCases', detail: ['useCases','tasks'] },
  Task:           { scenario: ['subtasks','useCases','coveredRequirements','children'], trace: ['useCases','coveredRequirements'], expected: ['Task','UseCase','Requirement'], primary: 'useCases', detail: ['useCases'] },
  UseCase:        { scenario: ['classes'], trace: ['class'], expected: ['Class','Method'], primary: 'classes', detail: ['classes'] },
  Class:          { scenario: ['methods'], trace: ['methods'], expected: ['Method'], primary: 'methods', detail: ['methods'] },
  Method:         { scenario: ['implementations'], trace: ['implementations'], expected: ['Implementation'], primary: 'implementations', detail: ['implementations'] },
  Implementation: { scenario: ['tests'], trace: ['tests'], expected: ['Test'], primary: 'tests', detail: ['tests'] },
  Test:           { scenario: [], trace: [], expected: [], primary: '', detail: [] },
  Sprint:         { scenario: ['tasks'], trace: ['tasks'], expected: ['Task'], primary: 'tasks', detail: ['tasks'] },
  Room:           { scenario: ['files','members'], trace: ['files','members'], expected: [], primary: 'files', detail: ['files','members'] },
};

for (const [type, ref] of Object.entries(PARITY)) {
  assert.deepEqual(scenarioFwd(type), ref.scenario, type + ' scenarioFwd');
  assert.deepEqual(traceFwd(type), ref.trace, type + ' traceFwd');
  assert.deepEqual(expectedChildTypes(type), ref.expected, type + ' expectedChildTypes');
  assert.equal(primaryFwd(type), ref.primary, type + ' primaryFwd');
  assert.deepEqual(detailViewFwd(type), ref.detail, type + ' detailViewFwd');
}
```

This test FREEZES the v0.6.31 values and asserts the unified config reproduces them EXACTLY. If any accessor yields a different value for any type, the test fails. The refactor provably changes ONLY the duplication, not the behavior.

## Traceability Chain

    [requirement:uuid:d5734c9b-9b7f-4c46-8e9f-797eb0750e9c]  R20.15 DRY-unify forward keys
      │
    [uc:uuid:56f0648b-a13c-46b5-942d-c2247bae4642]  chainModel.unifiedForwardKeys
      │
    [class:uuid:a0c492d6-fd8e-4c24-89db-0c1f980d02a8]  ChainTypeConfig (src/ts/shared/chain-model.ts)
      │
    [method:uuid:7dc79987-d6f6-4409-90c2-bbee701ac246]  forwardKeysForMode / scenarioFwd / traceFwd / expectedChildTypes
      │
    [impl:uuid:pending]    expert — config + accessors + migrate all 5 consumers to import
      │
    [test:uuid:pending]    tester — PARITY regression (see AC)

## Dependency

- **Ships AFTER the BUG9 stopgap (v0.6.31).** BUG9 (`6da84135`) adds `Bug`/`ChangeRequest` to the 5 maps first (makes /trace Bug nodes work now); R20.15 then unifies so it can't drift again.

## Planner Audit — canonical keys + parity carve-out (2026-06-14, PO-directed, ground-truthed v0.6.31)

**CANONICAL `Bug`/`ChangeRequest` forward keys = `['useCases','tasks']`** ✓ (architect's CHAIN_TYPE_CONFIG already encodes this; evidence: of 15 Bug units, useCases 3/15 = chain entry, tasks 4/15 = nav link).

⚠ **STOPGAP (BUG9, v0.6.31) is INCOMPLETE-for-nav.** Ground-truth of shipped server.ts:
| Map | line | shipped v0.6.31 | canonical | gap |
|-----|------|-----------------|-----------|-----|
| SCENARIO_FWD | 717 | `Bug:['useCases']` | `['useCases','tasks']` | ⚠ tasks not fetched |
| TRACE_FWD | 724 | `Bug:['useCases']` | `['useCases','tasks']` | ⚠ tasks not fetched |
| EXPECTED_CHILD_TYPE | 789 | `Bug:['UseCase','Task']` | `['UseCase','Task']` | ✓ (but Task never fetched → dead allowance) |

→ A Bug node's **Task children are allowed (789) but never fetched (717/724)** → they don't navigate on /trace. The stopgap made Bug→UseCase work; Bug→Task is still broken until canonical `['useCases','tasks']` lands.

⚠ **PARITY-PROOF CARVE-OUT (the AC must not contradict itself):** the parity reference above uses the **corrected** `Bug/ChangeRequest:['useCases','tasks']`, which is NOT what v0.6.31 shipped (`['useCases']`). So Bug/ChangeRequest are a **DELIBERATE DIVERGENCE** — R20.15 intentionally fixes the stopgap, it does NOT reproduce it. The parity test must (a) freeze v0.6.31 for the 9 unchanged types AND (b) assert the **corrected** `['useCases','tasks']` for Bug/ChangeRequest, explicitly flagged as the fix (not a regression). Claiming "reproduces v0.6.31 EXACTLY" is wrong for these 2 rows.

## Acceptance Criteria

- [ ] Single `CHAIN_TYPE_CONFIG` in `src/ts/shared/chain-model.ts`; all 5 former maps derive from it (no parallel literals remain).
- [ ] **Parity regression (hard gate):** for the 9 UNCHANGED node types, the unified config yields IDENTICAL keys to the old 5 maps. For **Bug/ChangeRequest**, it yields the CORRECTED `['useCases','tasks']` (deliberate fix of the v0.6.31 stopgap's missing `tasks`), asserted explicitly. Test enumerates all types.
- [ ] Adding a node type is a one-place edit (demonstrated).
- [ ] No /trace regression (Bug/Req/Task/UC/Class/Method/Impl/Sprint/Room all still expand correctly).

## Status
- [ ] Architect design + parity-AC written into this file
- [ ] UC / Class / Method nodes minted (architect)
- [ ] Impl (expert) — config + accessors + 5-consumer migration
- [ ] Parity regression test (tester)
- [ ] Ships after v0.6.31 stopgap

## Cross-ref
- DURABLE fix for [BUG9 6da84135](./../sprint-29-radical-forward-planning/bug8-trace/task-bug9-bug-forward-keys.md) (+ BUG12 merged).
- OOP rationale: R20.4 (`ea212274`) — Bug/ChangeRequest extend Requirement.
