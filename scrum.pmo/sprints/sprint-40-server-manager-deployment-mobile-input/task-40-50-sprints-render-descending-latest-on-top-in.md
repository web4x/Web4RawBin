<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.50: Sprints render descending (latest on top) in

[task:uuid:38609d01-f989-4970-85e9-0887bd5fdb24]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.50 (Sprints render descending (latest on top) in). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.50; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(by-construction)** Sprints render DESCENDING by sprint number (Sprint 40 on top) in BOTH the /trace overview AND the model tree, via ONE shared comparator (DRY — the two surfaces cannot disagree).
- [ ] **(device)** Verified at 390px on real WebKit (Tron's device viewport): Sprint 40 is the first sprint rendered in each surface.
- [ ] **(realtime)** Order updates LIVE via the ONE VIEW BUS where applicable — a newly-created sprint appears on top with NO reload.
- [ ] **(stub-must-fail)** A surface rendering ASCENDING (Sprint 1 on top), OR the two surfaces disagreeing on order => RED.
- [ ] **(source)** The ONE canonical comparator is bySprintDisplayOrder (home: sprint-pin-resolver / Class SprintPinResolver, sprintNumOf), applied in the SHARED source and consumed by every surface - NOT a per-surface client re-sort. Measured root: sprintOverviewNodes:1524 sorts ASC; v0.8.118 added a /trace client re-sort on top instead of fixing the shared source, so /model stayed ASC.
- [ ] **(source)** The comparator covers the FULL family: 6 display surfaces; pin-sorts are EXCLUDED (2 pin-hop sorts exempt by an EXPLICIT allow-list). Every sprint-DISPLAY surface consumes the one comparator; the 2 pin-ordering hops are the only sanctioned exceptions (detail in design abf7ea526 / be3174ef2).
- [ ] **(stub-must-fail/by-construction)** INVARIANT-GATE (PO L17), NOT a value-gate: the gate asserts (1) exactly ONE comparator (bySprintDisplayOrder) EXISTS, (2) EVERY display site IMPORTS it, (3) ZERO ad-hoc sprint sort anywhere - the 2 pin-hop sorts exempt by an explicit allow-list. stub-must-fail: an ad-hoc sprint sort re-introduced on ANY surface => RED. WHY: the old R40.50 value-gate (does /trace render DESC) PASSED with the duplicate client re-sort present - a value-gate cannot see a second sort source; only an invariant-gate (one-source, every-site-imports, zero-ad-hoc) catches the DRY violation BY CONSTRUCTION. This is the gate that failed us on v0.8.118.

## Subtasks
