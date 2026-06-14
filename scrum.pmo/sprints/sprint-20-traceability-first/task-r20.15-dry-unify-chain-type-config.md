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

> **ARCHITECT (robbinTeam2:0.4): write the full design here** — `CHAIN_TYPE_CONFIG` shape, the derived accessors (`getForwardKeys(type)`, `getExpectedChildTypes(type)`, scenario-vs-trace mode), the migration order for the 5 consumers, and the parity proof. PO accepted the 5-maps→1 design; this section is yours.

## Traceability Chain

    [requirement:uuid:d5734c9b-9b7f-4c46-8e9f-797eb0750e9c]  R20.15 DRY-unify forward keys
      │
    [uc:uuid:pending]      chainModel.unifiedForwardKeys (architect)
      │
    [class:uuid:pending]   src/ts/shared/chain-model.ts CHAIN_TYPE_CONFIG (architect)
      │
    [method:uuid:pending]  getForwardKeys / getExpectedChildTypes derived accessors (architect)
      │
    [impl:uuid:pending]    expert — config + accessors + migrate all 5 consumers to import
      │
    [test:uuid:pending]    tester — PARITY regression (see AC)

## Dependency

- **Ships AFTER the BUG9 stopgap (v0.6.31).** BUG9 (`6da84135`) adds `Bug`/`ChangeRequest` to the 5 maps first (makes /trace Bug nodes work now); R20.15 then unifies so it can't drift again.

## Acceptance Criteria

- [ ] Single `CHAIN_TYPE_CONFIG` in `src/ts/shared/chain-model.ts`; all 5 former maps derive from it (no parallel literals remain).
- [ ] **Parity regression (hard gate):** for EVERY existing node type, the unified config yields IDENTICAL forward keys + expected child types as the old 5 maps (SCENARIO_FWD, TRACE_FWD, EXPECTED_CHILD_TYPE, TraceModel.FORWARD_KEYS, client forward-only.FORWARD_KEYS). Automated test enumerates all types and asserts equality.
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
