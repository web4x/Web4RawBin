<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 29.2: Chain-before-ship gate (no impl marker ships without a Requirement chain)

[task:uuid:b52ae918-6673-47ea-a7bf-0d632eebbe91]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 29 Planning](./planning.md)
    - Requirement R29.2 `[requirement:uuid:ad69dfa4-00a0-4874-b7e3-0075f6c6d927]`
  - crossRef
    - R27.5 (Axis-4 marker-has-chain detection, single-source) + RULE #126 (this ENFORCES it by construction)
  - down
    - [UC: buildGate.chainBeforeShip](./planning.md) `[uc:uuid:0ec831d0-3c6b-4fea-aa22-78be9e8f7151]`

## Task Description

trace:audit:strict + a pre-commit hook HARD-FAIL the build when a NEW [impl:uuid] marker ships with no Requirement chain. DELTA-scoped (only new chain-less impls fail; pre-existing legacy deferred, no false-red). Runs at pre-commit AND in CI. Detection REUSES R27.5's marker-has-chain audit (Axis 4). The by-construction END of the retroactive-#126 tax.

## Context

Reuses R27.5 (ref-slot registry) Axis-4 marker-has-chain detection — single-source, no duplicate audit logic. Delta-scoped like R27.2 INV2 / R27.4 (legacy pre-existing not false-red). 4 retroactive-#126 cases (9b97021dd R29.1, R27.3 per-task-MD, R27.4 repair, R26.x) as regression fixtures. Depends on R27.5 (S28).

## Intention

HIGH: make RULE #126 (scenario-first, never backfill) enforceable BY CONSTRUCTION — a chain-less impl marker cannot ship. Ends the retroactive-#126 reconciliation tax (9b97021dd/R27.3/R27.4/R26.x were all cured after-the-fact; this prevents the violation at commit).

## Acceptance Criteria

- [ ] (gate) trace:audit:strict + a pre-commit hook HARD-FAIL the build when a NEW [impl:uuid] marker on src has no linked Requirement chain (marker's Impl unit resolves AND is reachable Requirement->UseCase->Class->Method->Impl).
- [ ] (gate) DELTA not absolute: ONLY new chain-less impls fail; pre-existing legacy chain-less markers are deferred/reported (no false-red) - same delta-vs-absolute discipline as R27.2 INV2.
- [ ] (gate) The gate runs at PRE-COMMIT (block before the commit lands) AND in CI (ci:gates), so code-before-chain is caught at the earliest point.
- [ ] (gate) Detection REUSES R27.5's marker-has-chain audit (Axis 4) - no duplicate audit logic; R29.2 is the enforcement layer.
- [ ] (verify) A NEW impl marker with no Requirement chain -> RED build; a fully-chained impl -> GREEN; a legacy chain-less marker -> reported, not failed. Verified against the 4 retroactive-#126 cases as regression fixtures.

## Implementation

STOOD UP (planning) — status Planned; chain-build awaits architect design. HIGH priority. Reuses R27.5 Axis-4 (needs R27.5 landed).

## Subtasks

None (atomic task).
