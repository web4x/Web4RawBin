<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.5 (CONCEPT): Responsive scrollable viewport + WODA bar/compartment layout — DESIGN ARTIFACT, not a build

[task:uuid:3b60b587-9dac-48ee-b5f2-b3a25d296dc0]

## Status
- [x] Planned
- [x] In Progress (CONCEPT — design artifact only, NO build)
  - [x] req captures the concept scenario-first (requirement R31.5 7bb01a7b, canonical, facet-ACs)
  - [x] architect designs the component architecture (CONCEPT-scrollable-viewport-architecture.md, commit 5bce382b7 — rb-compartment/rb-strip/rb-snap-nav/viewport, one-model-two-instances, drawer=Details position-only; presentation!=function)
  - [x] concept design artifact consolidated + coherent (COMPANION: Tron spec woda-layout.md + architect architecture.md cover all concept facets §1-7)
- [ ] QA Review (Tron ratifies the concept)
- [ ] Done (Tron-authorizes implementation as a LATER step)

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.5 (CONCEPT) `[requirement:uuid:7bb01a7b-f5cd-4a84-a2dd-ca9b47ef8ef4]` (canonical, robbin-req)
  - artifact (CONCEPT deliverable — companion pair)
    - [CONCEPT-scrollable-viewport-woda-layout.md](./CONCEPT-scrollable-viewport-woda-layout.md) — Tron SPEC (committed a8f7cfa91)
    - [CONCEPT-scrollable-viewport-architecture.md](./CONCEPT-scrollable-viewport-architecture.md) — architect DESIGN companion (committed 5bce382b7)
  - down
    - implementation DEFERRED — LATER Tron-authorized step (separate build task/sprint)

## Task Description

CONCEPT/design task (Tron 2026-07-20): PLAN a detailed, coherent concept for the responsive bar `|` / compartment `[]` layout model — WODA `W|[O][D]|A`, the 3-way diff editor `[L]|[C]|[R]` as an instance of the same model, portrait horizontally-scrollable viewport with scroll-snap at compartment boundaries, bottom scroll-snap nav bar, and drawer=Details-compartment where POSITIONING must NOT change FUNCTION (one function, two positions). Deliverable = a coherent CONCEPT design artifact (req scenario-first capture + architect component-architecture design, consolidated into CONCEPT-scrollable-viewport-woda-layout.md). This is NOT a build task — implementation is a LATER Tron-authorized step. Kept SEPARATE from the priority-1 R31.1-R31.4 server-manager work.

## Context

Motivated by the full-width-drawer regression: a positioning-format change wrongly changed drawer FUNCTION. The concept must guarantee one function across landscape (Details compartment `[D]`) and portrait (bottom drawer) positions.

## Intention

Tron: "PLAN a detailed CONCEPT (req + architect + planner). DO NOT IMPLEMENT yet. Sprint 31." Generalizes the in-flight R31.4 DRY drawer fix (terminal via shared /trace detail flow) into a layout architecture.

## Acceptance Criteria

- [ ] A coherent CONCEPT is captured (req) + designed (architect) — NOT code
- [ ] Concept covers the bar `|` / compartment `[]` model and bar<->compartment duality
- [ ] WODA `W|[O][D]|A` and the 3-way editor `[L]|[C]|[R]` are both shown as instances of the ONE model
- [ ] Portrait scrollable viewport + scroll-snap at compartment boundaries + bottom nav bar are specified
- [ ] Drawer=Details-compartment: landscape inline vs portrait bottom-drawer with IDENTICAL function (positioning != function invariant) is specified
- [ ] The concept is a design artifact only; NO implementation in this task (deferred to a later Tron-authorized step)

## Subtasks

Role deliverables (per concept doc): req (0.4) captures scenario-first requirement(s); architect (0.3) designs the component architecture; planner (0.6) structures this CONCEPT task + keeps R31.x separate. Not sub-Task-units — tracked as the In Progress hops above.
