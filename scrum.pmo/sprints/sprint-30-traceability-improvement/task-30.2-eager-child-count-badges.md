<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.2: Eager child-count badges

[task:uuid:fc744c38-1c7f-4855-a8fe-b48a5545285f]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.2 `[requirement:uuid:15c8fe45-b1ff-4c08-b589-be741ae95d85]`
  - down
    - [UC](./planning.md) `[uc:uuid:fe0d394c-5f2e-4003-8941-ad2f390f59a5]`

## Task Description

Render an EAGER child-count badge on each collapsed sprint node in the traceability tree — show the number of tasks/children as a badge WITHOUT expanding (loading) the node, so counts are visible at a glance while the payload stays lazy (structure-eager/count-eager, task-payload-lazy).

## Context

Covers R30.2 (15c8fe45, canonical after req dedup b2f473634). S30 traceability-tree track. v0.7.11 deployed (retroactive).

## Intention

S30 Traceability Improvement — keep the traceability tree scaling + navigable. Stood up scenario-first on req's R30.2/R30.3 mint.

## Acceptance Criteria

- [ ] (badge) Every tree node child-count BADGE shows the correct count from when its PARENT loads (eager) - NOT 0-until-expand.
- [ ] (badge) The count comes from the PARENT /children response metadata (childCount per child), not a per-node prefetch.
- [ ] (loading) Lazy level-by-level: expanding a node loads its children WITH their own child-counts (next level badges correct); deeper content on further expand.
- [ ] (bug) THE BUG: all sprint nodes showed badge=0 initially - must show the real task-count before expand.
- [ ] (loading) Still PAYLOAD-LAZY: children CONTENT loads on expand; only COUNTS are eager (structure+count eager / payload lazy - R26 pattern).

## Implementation

CODE DEPLOYED (per PO signal — R30.2 built+deployed, prod). status In Progress: implementing[x]; testing[ ] pending tester gate; ACs [ ] pending verification. Awaiting PO's next hop-signal (tester GREEN -> testing[x] -> QA Review).

## Subtasks

None (atomic task).
