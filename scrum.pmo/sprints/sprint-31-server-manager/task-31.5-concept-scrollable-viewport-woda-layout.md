<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.5: Responsive bar/compartment WODA scrollable-viewport layout (CONCEPT)

[task:uuid:3b60b587-9dac-48ee-b5f2-b3a25d296dc0]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Tron AUTHORIZED BUILD (2026-07-22) — was conceptOnly, now a BUILD task. Concept designed (refinement[x]: Tron spec woda-layout.md + architect architecture.md rb-compartment/rb-strip/rb-snap-nav/viewport). BUILD STARTING. req to formalize R31.5 as a build requirement + decompose the 7 facet-ACs into atomic build-ACs (Rule 10/11).

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.5 `[requirement:uuid:7bb01a7b-f5cd-4a84-a2dd-ca9b47ef8ef4]` (conceptOnly)
  - concept traceability (NO build chain yet — deferred until Tron authorizes build)
    - facet-ACs (decomposition candidates for the later build-requirements): AC-bar-compartment-model, AC-woda-layout, AC-editor-is-instance, AC-scrollable-viewport-snap, AC-scroll-snap-nav-bar, AC-drawer-positioning-not-function, AC-concept-not-code
    - design docs: [CONCEPT-scrollable-viewport-woda-layout.md](./CONCEPT-scrollable-viewport-woda-layout.md) (Tron spec) + [CONCEPT-scrollable-viewport-architecture.md](./CONCEPT-scrollable-viewport-architecture.md) (architect design)

## Task Description

CONCEPT / PLAN ONLY (Tron 2026-07-20 - do NOT implement; implementation is a later Tron-authorized step). A foundational responsive-layout architecture generalizing the app's viewports as BARS '|' and COMPARTMENTS '[]'. A bar is a thin strip of COLLAPSED content (a 'What' bar = itemView ICONS, an 'Actions' bar = object.verb no-parameter buttons, the 3-way editor's changebar); a compartment is EXPANDED full content (What / Overview / Details compartments; each diff editor). A bar EXPANDS into a compartment and a compartment COLLAPSES into a bar (the duality is the generalization). WODA layout = W|[O][D]|A (What bar | Overview + Details compartments | Actions bar). The 3-way diff editor is an INSTANCE of the same model: [L]|[C]|[R] (editors are compartments, changebars are bars). Responsive: landscape/16:9 shows all bars+compartments side-by-side; portrait uses a horizontally-scrollable viewport (~one compartment + inter-bar + a few chars of the next) freely scrollable left<->right WITH scroll-snap at compartment boundaries, plus a bottom scroll-snap NAV bar snapping to a compartment's left edge (buttons per instance: {Left,Center,Right} for the editor; {What,Overview,Details,Actions} for WODA). The drawer = the 'Details' compartment: landscape it becomes the inline [D] compartment, portrait it is the bottom drawer as today - and POSITIONING != FUNCTION (Tron's law): the two positions have IDENTICAL function, one component not two forks (same DRY root as the R31.4 /trace-detail-flow drawer reuse, which this concept GENERALIZES). Acceptance = a coherent CONCEPT (this captured model + architect component-architecture design + planner CONCEPT task), NOT code. This is PARALLEL/AFTER the current R31.1-R31.4 server-manager bug fixes (select->open / drawer / badge stay PRIORITY-1). Each acceptance facet below is a DECOMPOSITION CANDIDATE for atomic build-requirements when Tron authorizes implementation (Rule 10/11 - decompose then).

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
