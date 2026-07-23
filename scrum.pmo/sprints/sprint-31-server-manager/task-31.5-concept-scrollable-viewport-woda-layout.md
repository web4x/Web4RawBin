<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.5: Responsive bar/compartment WODA scrollable-viewport layout (CONCEPT)

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

## Remaining Issues

ROLLUP CONDITION MET -> QA-Review (architect disk-assess + req 21f981311 R31.5 BOARD COMPLETE): all 7 children (5.1-5.7) chain-complete-to-Test + GREEN DET-3x @390, per-piece AC-INV-PRESENTATION gated (portrait scroll-snap + landscape side-by-side). UMBRELLA -> DONE gated on: (1) COMPOSED-INTEGRATION live-wiring — <rb-woda> mounted nowhere / /edit still pre-R31.5 panels; TRON RULING 87f741e23 = swap /edit to R31.5 [L]|[C]|[R] with HARD guardrail (preserve R30 diff/merge/spline/alignment/folding/deep-link, positioning!=function, no rewrite); route architect->expert->tester@390(composed+diff-merge-regression)->Tron; (2) Tron device VISUAL on the composed WODA/editor. Children QA-Review (Tron composed-visual pending).

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.5 `[requirement:uuid:7bb01a7b-f5cd-4a84-a2dd-ca9b47ef8ef4]` (conceptOnly)
  - concept traceability (NO build chain yet — deferred until Tron authorizes build)
    - facet-ACs (decomposition candidates for the later build-requirements): AC-bar-compartment-model, AC-woda-layout, AC-editor-is-instance, AC-scrollable-viewport-snap, AC-scroll-snap-nav-bar, AC-drawer-positioning-not-function, AC-concept-not-code
    - design docs: [CONCEPT-scrollable-viewport-woda-layout.md](./CONCEPT-scrollable-viewport-woda-layout.md) (Tron spec) + [CONCEPT-scrollable-viewport-architecture.md](./CONCEPT-scrollable-viewport-architecture.md) (architect design)

## Task Description

UMBRELLA — the R31.5 WODA bar/compartment layout concept, decomposed into 7 ATOMIC build tasks (req decomposition bf73baec2, architect-confirmed b3f30491f; Tron AUTHORIZED BUILD 2026-07-22). Each child is its own chain-root (Req->UC->Class->Method->Impl->Test). BUILD ORDER (dependency metadata, NOT chain): FOUNDATION 5.1 rb-compartment + 5.2 rb-strip + 5.4 viewport-mode -> 5.7 drawer=Details (CRUX, early, rides the R31.4 DRY drawer fix) -> 5.3 rb-snap-nav -> 5.5 editor-instance + 5.6 WODA-instance. AC-INV-PRESENTATION (5.8 positioning!=function) cross-cuts EVERY piece (not a separate task).

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
