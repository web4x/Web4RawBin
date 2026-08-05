<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 36.5: Scenario/Edit always open the correct base ScenarioUnit + usedIn[] usage-ref tracking [R36.5, FOUNDATION build FIRST]

[task:uuid:b5948931-5a36-4779-806d-abe60153aba8]

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

DONE: R36.5 FOUNDATION built (Scenario/Edit open the CORRECT base unit - rides S35 onUniversalAction b8f284c6/005dbd3e + ensureViewUnit a09b474d; usedIn[] bidirectional usage-ref <-> Diagram.views) + chain-complete-to-Test (chain R36.5 a8663672 -> UC usedInResolver e46c6407 + openBaseUnit 2d58e144 -> server c0a0921d -> Method resolveUsedIn e48832b2 -> Impl 2f44e112 tests[]=[91a10db8], markerPending=false, req mint 33f9fe6de, two-key) + REAL-WEBKIT @390 GREEN DET-3x (r365-usedin-webkit-gate.mjs gate 2ab54eb53 v0.8.52, served==HEAD 0.8.52; verified INV-T byte-diff==0 + usedIn bidirectional + Scenario/Edit->base open-target). Team-gated at Tron real engine -> Done. ★ FORWARD-DEP (R36.2 GUARDRAIL, architect ca49f1826/19b6217be): when R36.2 ships, usedIn moves from on-element to a MODEL_STORE side-index (transparent backend swap of addUsedIn/removeUsedIn/resolveUsedIn) — R36.5 MUST be RE-GATED on the side-index backend + Test 91a10db8 re-verified/re-pointed (element file PRISTINE INV-RM1, /api/ior still shows usedIn, INV-T byte-diff==0). T36.5 stays Done on the CURRENT on-element mechanism; re-verify on R36.2 ship (like R35.4-DRY-reopen).

## Traceability

  - up
    - [Sprint 36 Planning](./planning.md)
    - Requirement R36.5 `[requirement:uuid:a8663672-3522-4f0c-b313-d14d13dbba5f]`
  - down
    - None (atomic task)

## Task Description

For EVERY projected view/element, the Scenario + Edit buttons carry the info to open the CORRECT underlying BASE ScenarioUnit (the unit the view projects) in the editor — RIDES S35 universal-actions (onUniversalAction b8f284c6) + ensureViewUnit (a09b474d). Usage-reference tracking (NEW, cross-cutting, bidirectional): add usedIn:[{kind:'diagram'|'folder', ref}] on units <-> the existing Diagram.views[]/folder links; a resolver computes back-refs ('where is this used'). Bidirectional invariant: unit.usedIn <-> diagram.views (add-view/remove-view maintain BOTH, reuse R32.11/R33.8 add/remove-view). Cluster FOUNDATION (build first, underpins all projections).

## Acceptance Criteria

- [x] (functional) For every projected view/element, Scenario opens /scenario?ior=<BASE-unit> + Edit opens the base unit's editor — the CORRECT underlying ScenarioUnit the view projects (rides S35 universal-actions + ensureViewUnit). Gate the actual open-TARGET, not button presence.
- [x] (functional) Each unit carries usedIn:[{kind:'diagram'|'folder', ref}] tracking where it is placed/linked; a resolver answers 'where is this used' (back-refs).
- [x] (functional) INVARIANT: unit.usedIn <-> Diagram.views bidirectional — add-view/remove-view maintain BOTH sides (reuse R32.11/R33.8 add/remove-view), never one-sided.
- [x] (gate) GATE @390 real-WebKit: Scenario/Edit on a projected view open the CORRECT base unit (verify the open-target); usedIn is bidirectional (place on diagram -> unit.usedIn + diagram.views both updated; remove -> both cleared).

## Subtasks

None (atomic task).
