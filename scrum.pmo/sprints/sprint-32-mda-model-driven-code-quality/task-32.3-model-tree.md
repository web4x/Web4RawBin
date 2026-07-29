<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.3: Model tree = traceability-tree UX reused over the MDA units (drag source)

[task:uuid:6b479dec-4c0d-4322-a7ed-b1eeab10c0af]

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
    - [Sprint 32 Planning](./planning.md)
    - Requirement R32.3 `[requirement:uuid:d07b2dc0-7499-4877-952c-655170a7a99a]`
  - down
    - None (atomic task)

## Task Description

The Model tree is conceptually the SAME as the traceability tree - REUSE the rb-trace-tree components + functionality (skill-expert lane, NO re-fork) to render the MDA scenario units; it is the drag SOURCE for diagram views. ★ ACs are INITIAL (scenario-first per #126); the MDA-specific invariants (same-UUID-across-M-levels, PUML no-dup round-trip, action-sync) FINALIZE on architect (0.3) MDA-structure design - coordinating now. Chain (UC->Class->Method->Impl->Test) mints onto the built fix per the build order.

## Context

designRef: scrum.pmo/sprints/sprint-32-mda-model-driven-code-quality/PO-vision.md + design-mda-model.md

## Acceptance Criteria

- [ ] The model tree renders the MDA units via the SHARED rb-trace-tree component (same expand/collapse/icons/badges), NOT a new tree - generic tree mechanics solved once.
- [ ] Each MDA unit itemView in the model tree is a drag SOURCE (draggable into a diagram surface).
- [ ] INITIAL ACs (scenario-first #126); the MDA-structure invariants finalize on architect (0.3) design; chain mints onto built fix per the build order (R32.0->R32.8).

## Subtasks

None (atomic task).
