<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.4: Interactive SVG diagram surface in the details drawer (responsive, pan/zoom)

[task:uuid:6a946cd2-7c78-4d9f-a720-2894b14ae0a3]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 32 Planning](./planning.md)
    - Requirement R32.4 `[requirement:uuid:496936cb-d0ea-4c0e-a6d3-b6e9c7189fc7]`
  - down
    - None (atomic task)

## Task Description

Interactive SVG diagrams live in the DETAILS DRAWER (rb-detail-drawer reuse), all responsive sizes, with pan + pinch-zoom (RbPanZoom reuse) like any other svg/image/html viewer in the details compartment. A blank diagram is a drop TARGET. ★ ACs are INITIAL (scenario-first per #126); the MDA-specific invariants (same-UUID-across-M-levels, PUML no-dup round-trip, action-sync) FINALIZE on architect (0.3) MDA-structure design - coordinating now. Chain (UC->Class->Method->Impl->Test) mints onto the built fix per the build order.

## Context

designRef: scrum.pmo/sprints/sprint-32-mda-model-driven-code-quality/PO-vision.md + design-mda-model.md

## Acceptance Criteria

- [ ] The SVG diagram surface renders inside the shared rb-detail-drawer (details compartment), responsive at all sizes.
- [ ] The diagram supports pan + pinch-zoom via the shared RbPanZoom viewer-base (NO re-fork).
- [ ] A blank diagram is a valid drop target for MDA-unit itemViews.
- [ ] INITIAL ACs (scenario-first #126); the MDA-structure invariants finalize on architect (0.3) design; chain mints onto built fix per the build order (R32.0->R32.8).

## Subtasks

None (atomic task).
