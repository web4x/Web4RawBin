<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 27.4: Graph integrity — resolve/prune dangling UC refs + orphan Methods

[task:uuid:cd974edc-1a71-4f47-80f0-966e6a252abd]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 27 Planning](./planning.md)
    - Requirement R27.4 `[requirement:uuid:e205f7c3-97d8-474a-a4e6-053a7a7f30aa]`
  - crossRef
    - R24.5 trace:audit:strict (the CI gate enforcing 0-dangling/0-orphan) + R27.2 (independent, 0 intersect)
  - down
    - [UC27.4: graph.repairIntegrity](./planning.md#uc27-4) `[uc:uuid:f7a06e18-5237-4640-a731-0575bc965917]`

## Task Description

Repair the PRE-EXISTING graph integrity debt: 12 dangling UC refs (class/classes[]/method pointing at units that don't exist) + 51 orphan Methods (Method units not owned by any Class's methods[]). Every UC ref must resolve; every Method must be owned by a Class that lists it. trace:audit:strict (R24.5) enforces it going forward.

## Context

PRE-EXISTING (NOT from R27.2 dedup). MEASURED INDEPENDENT: 0 of the 12 dangling intersect the R27.2 dedup set (all dead uuids: 10 dead-RbDetailView refs -> repoint to live canonical, 1 dead-method, 1 literal TODO-placeholder) -> R27.4 runs in EITHER order vs T27.2. crossRef R24.5 (trace:audit:strict is the CI gate) + R27.2 (independent, 0 intersect).

## Intention

Measurement-surfaced debt (req baseline verify_r27_2_migration.py): the graph carried 12 dangling UC refs + 51 orphan Methods BEFORE the R27.2 dedup — an absolute no-dangling gate would false-abort, so this is repaired separately.

## Acceptance Criteria

- [ ] (no-dangling) Every UseCase class / classes[] / method reference resolves to an existing unit - 0 dangling UC refs
- [ ] (no-orphan) Every Method unit is owned by a Class that lists it in methods[] - 0 orphan Methods
- [ ] (repair-dangling) The 12 dangling are repaired: the 10 dead-RbDetailView refs repointed to the live canonical RbDetailView, the 1 dead-method + 1 TODO-placeholder pruned
- [ ] (repair-orphan) The 51 orphan Methods triaged: attached to their owning Class OR pruned if truly dead - dry-run + count FIRST
- [ ] (ci-gate) trace:audit:strict (R24.5) FAILS on any dangling UC ref or orphan Method - recurrence prevented at the gate
- [ ] (verify) Post-cleanup re-measure: 0 dangling UC refs, 0 orphan Methods

## Implementation

GATED REPAIR MIGRATION (finalized w/ PO/req targets 2026-07-01; architect designing the repair body + wiring UC f7a06e18). CONCRETE TARGETS: (dangling, 12) repoint the 10 dead-bbbc* UC refs -> canonical RbDetailView f2f84ce3-6f8f (the R27.2-locked canonical, EXISTS); prune the 1 dead Method ref fcf6dae1 (no unit on disk) + the 1 literal TODO-string placeholder. (orphan, 51) triage the 51 orphan Methods -> attach each to its owning Class (add to Class.methods[]) OR prune if truly dead — PRESERVING IMPLS (0 impl lost, same INV1b discipline R27.2 used). DISCIPLINE (same as R27.2 18a8703e2): expert implements DRY-RUN+COUNT body -> gateOk self-assert -> planner delta-verify + req 3-point delta-verify (DUAL) -> ATOMIC + ROLLBACKABLE --apply -> post-apply re-verify (dangling->0, orphan->0, 0 impl lost). RECURRENCE-PREVENTION: trace:audit:strict (R24.5) FAILS CI on any dangling/orphan. INDEPENDENT of R27.2 (0/12 intersect; R27.2 DONE 18a8703e2 left the 12+51 unchanged). testing OPEN — expert runs, I verify the gate. Wire T27.4.useCases f7a06e18 once architect mints the UC.

## Subtasks

None (atomic gated-repair task).
