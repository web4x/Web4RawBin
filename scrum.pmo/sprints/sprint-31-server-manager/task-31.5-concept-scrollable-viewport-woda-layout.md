<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.5: Responsive scrollable viewport + WODA bar/compartment layout (CONCEPT — plan only, no build)

[task:uuid:3b60b587-9dac-48ee-b5f2-b3a25d296dc0]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement `[requirement:uuid:7bb01a7b-f5cd-4a84-a2dd-ca9b47ef8ef4]`
  - down
    - None (atomic task)

## Task Description

PLAN a coherent CONCEPT for the responsive bar '|' / compartment '[]' layout model — WODA W|[O][D]|A, the 3-way diff editor [L]|[C]|[R] as an instance of the same model, portrait horizontally-scrollable viewport with scroll-snap at compartment boundaries, a bottom scroll-snap nav bar, and drawer=Details-compartment where POSITIONING must NOT change FUNCTION (one function, two positions). Deliverable = a coherent concept (Tron spec + architect component-architecture design), NOT code. This is PLAN-only; implementation is a LATER Tron-authorized step, and is kept SEPARATE from the priority-1 R31.1-R31.4 server-manager work.

## Context

Motivated by the full-width-drawer regression: a positioning-format change wrongly changed drawer FUNCTION. The concept must guarantee one function across landscape (Details compartment [D] inline) and portrait (bottom drawer) positions. Tron SPEC: CONCEPT-scrollable-viewport-woda-layout.md (a8f7cfa91).

## Intention

Tron directive (2026-07-20): PLAN a detailed CONCEPT (req + architect + planner). DO NOT IMPLEMENT yet. Generalizes the R31.4 DRY drawer fix (positioning != function) across the whole responsive layout.

## Acceptance Criteria

- [ ] A coherent CONCEPT is captured (req) + designed (architect) — a plan, NOT code.
- [ ] The concept defines the bar '|' / compartment '[]' duality (a bar expands into a compartment and back; one component, presentation attribute — not a fork).
- [ ] WODA W|[O][D]|A and the 3-way editor [L]|[C]|[R] are shown as instances of the ONE model (differ only by the segment-descriptor array).
- [ ] Portrait scrollable viewport + scroll-snap at compartment boundaries + bottom scroll-snap nav bar are specified.
- [ ] Drawer = Details compartment: landscape [D] inline vs portrait bottom-drawer, IDENTICAL function, position-only (positioning != function invariant).
- [ ] No implementation in this task — code is deferred to a later Tron-authorized build (facet-ACs decompose into atomic build-requirements then).

## Implementation

PLAN-ONLY (no code). The concept 'implementation' is the design-artifact pair: Tron SPEC CONCEPT-scrollable-viewport-woda-layout.md (a8f7cfa91) + architect DESIGN companion CONCEPT-scrollable-viewport-architecture.md (5bce382b7 — rb-compartment/rb-strip/rb-snap-nav/viewport primitives, one-model-two-instances, drawer=Details position-only, presentation != function). Both cover Tron concept facets. Code implementation is a LATER Tron-authorized step (separate build task/sprint).

## Subtasks

None (atomic task).
