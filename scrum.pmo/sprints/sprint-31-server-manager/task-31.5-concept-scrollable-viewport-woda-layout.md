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
- [x] QA Review
- [x] Done

## Remaining Issues

CHAMPAGNE-COMPLETE (built + gated + 5 ACs met + Test-credited, triple disk-verified). /edit-swap live-host BUILT (edit.ts:169-177 ?layout=r31.5, dist 81ecf92f9 v0.7.130) + GATED (live-route r315composed-regression-gate.mjs GREEN DET-3x @390 4a3c4bcc7 + backstop 304e4c130) + 5 R31.5.5 ACs MET (req 1de99636e) + Test-CREDIT minted (Test 2b20035d <-> Impl 3b8e6c24, req ed879c489). All 7 piece-cores done-to-Test. NO pending build, NO pending Test-marker. ONLY Tron device visual on the composed WODA/editor remains -> DONE (flips umbrella + all 7 children).

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

- [ ] **(concept)** The concept defines the bar '|' / compartment '[]' duality: a bar is a thin strip of COLLAPSED content (What-bar = itemView icons; Actions-bar = object.verb no-parameter buttons; the diff changebar), a compartment is EXPANDED full content (What / Overview / Details; each editor); a bar EXPANDS into a compartment and a compartment COLLAPSES into a bar. This duality is the generalization.
- [ ] **(concept)** The concept specifies the WODA layout W|[O][D]|A - What(bar, expandable) | Overview[O] + Details[D] compartments | Actions(bar) - with a bottom nav of 4 buttons: What / Overview / Details / Actions.
- [ ] **(concept)** The concept shows the 3-way diff editor is an INSTANCE of the same model: [L]|[C]|[R] (left/center/right editors are compartments, framed by left/right changebars which are bars) with a bottom nav of 3 buttons Left / Center / Right; one bar/compartment machinery instantiates BOTH WODA and the editor.
- [ ] **(concept)** The concept defines responsive behavior: landscape/16:9 shows all bars+compartments side-by-side; portrait uses a horizontally-scrollable viewport (~one compartment + inter-bar + a few chars of the next), freely scrollable left<->right WITH scroll-snap at each compartment boundary (editor snaps: LEFT '[]|[', CENTER ']|[]|[', RIGHT ']|[]').
- [ ] **(concept)** The concept defines a bottom scroll-snap NAV bar that snaps the horizontal scroll to the LEFT edge of a compartment, with a button set that depends on the layout instance ({Left,Center,Right} for the editor; {What,Overview,Details,Actions} for WODA).
- [ ] **(concept)** The concept establishes drawer = the Details compartment with the POSITIONING != FUNCTION invariant (Tron's law): landscape - the drawer BECOMES the inline [D] Details compartment; portrait - the drawer is the bottom drawer as today; the two positions have IDENTICAL function via ONE component, not two forks (same DRY root as the R31.4 /trace-detail-flow reuse). This is the crux facet.
- [ ] **(concept)** Acceptance is a COHERENT CONCEPT (this captured model + the architect's component-architecture design of how bar<->compartment / scrollable viewport / scroll-snap / nav bar GENERALIZE, how the editor AND WODA both instantiate it, and how the drawer becomes the Details compartment in landscape with identical function via one component), NOT an implementation. Implementation is a LATER Tron-authorized step; each facet above then decomposes into atomic build-requirements.

## Implementation

PLAN-ONLY (no code). The concept 'implementation' is the design-artifact pair: Tron SPEC CONCEPT-scrollable-viewport-woda-layout.md (a8f7cfa91) + architect DESIGN companion CONCEPT-scrollable-viewport-architecture.md (5bce382b7 — rb-compartment/rb-strip/rb-snap-nav/viewport primitives, one-model-two-instances, drawer=Details position-only, presentation != function). Both cover Tron concept facets. Code implementation is a LATER Tron-authorized step (separate build task/sprint).

## Subtasks

None (atomic task).
