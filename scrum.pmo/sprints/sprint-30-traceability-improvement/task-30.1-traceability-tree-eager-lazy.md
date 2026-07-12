<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.1: Traceability tree — CurrentSprint top + eager-lazy Sprints collection

[task:uuid:5665a0dd-750d-486b-964c-1bd221163ae4]

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
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.1 `[requirement:uuid:6f796898-4dbb-47a3-ab8a-914b4c80b353]`
  - down
    - [UC30.1: traceabilityTree.eagerLazy](./planning.md) `[uc:uuid:e22113cd-022d-48f0-b434-9ec4636e2081]`

## Task Description

Render the traceability tree with exactly two top-level nodes: a 'CurrentSprint: Sprint <N>' node (3 eager children — Current/Last/Next task slots) and a 'Sprints 01-<N>' collection (collapsed, badge=sprint count). Eager-load sprint structure, lazy-load each sprint's tasks only on expand, so the tree scales as sprints grow.

## Context

Covers R30.1 (traceability tree). Eager-structure/lazy-payload = the R26 federation loading pattern. Ties the CurrentSprint pin (Current/Last/Next slots).

## Intention

Tron S30 Traceability Improvement: the traceability tree must scale (structure-eager/payload-lazy) + show the CurrentSprint pin (Current/Last/Next) at the top.

## Acceptance Criteria

- [ ] (tree) The top node is 'CurrentSprint: Sprint <N>' - the CURRENT sprint (not 'Current: Task X').
- [ ] (tree) The CurrentSprint node has 3 EAGER children: Current / Last Completed / Next Backlog (task) - loaded as-is.
- [ ] (tree) The 2nd top-level node = 'Sprints 01-<N>' COLLECTION parent, COLLAPSED, with a badge = sprint count.
- [ ] (scaling) EAGER-LAZY: the collection eager-loads all sprint NODES but LAZY-loads their TASKS - a sprint's tasks load ONLY when that sprint node is expanded.
- [ ] (tree) Exactly TWO top-level nodes (CurrentSprint + Sprints-collection); tasks never load until their sprint is expanded.
- [ ] (scaling) Structure-eager / payload-lazy so the tree scales as sprints grow - the same loading pattern as R26 federation (structure eager, payload lazy).

## Implementation

STOOD UP (planning) — status Planned; chain-build awaits architect UC-refine + expert impl.

## Subtasks

None (atomic task).
