<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 36.5: Scenario/Edit always open the correct base ScenarioUnit + usedIn[] usage-ref tracking [R36.5, FOUNDATION build FIRST]

[task:uuid:b5948931-5a36-4779-806d-abe60153aba8]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned — cluster FOUNDATION (build FIRST: typed-OOP-ext base + usedIn usage-ref + R36.5 Scenario/Edit-opens-correct-unit). Rides S35 onUniversalAction b8f284c6 + ensureViewUnit a09b474d; usedIn <-> Diagram.views bidirectional (reuse R32.11/R33.8). @390 real-WebKit gate (open-TARGET, bidirectional usedIn) + chain-complete-to-Test on ship.

## Traceability

  - up
    - [Sprint 36 Planning](./planning.md)
    - Requirement R36.5 `[requirement:uuid:a8663672-3522-4f0c-b313-d14d13dbba5f]`
  - down
    - None (atomic task)

## Task Description

For EVERY projected view/element, the Scenario + Edit buttons carry the info to open the CORRECT underlying BASE ScenarioUnit (the unit the view projects) in the editor — RIDES S35 universal-actions (onUniversalAction b8f284c6) + ensureViewUnit (a09b474d). Usage-reference tracking (NEW, cross-cutting, bidirectional): add usedIn:[{kind:'diagram'|'folder', ref}] on units <-> the existing Diagram.views[]/folder links; a resolver computes back-refs ('where is this used'). Bidirectional invariant: unit.usedIn <-> diagram.views (add-view/remove-view maintain BOTH, reuse R32.11/R33.8 add/remove-view). Cluster FOUNDATION (build first, underpins all projections).

## Acceptance Criteria

- [ ] (functional) For every projected view/element, Scenario opens /scenario?ior=<BASE-unit> + Edit opens the base unit's editor — the CORRECT underlying ScenarioUnit the view projects (rides S35 universal-actions + ensureViewUnit). Gate the actual open-TARGET, not button presence.
- [ ] (functional) Each unit carries usedIn:[{kind:'diagram'|'folder', ref}] tracking where it is placed/linked; a resolver answers 'where is this used' (back-refs).
- [ ] (functional) INVARIANT: unit.usedIn <-> Diagram.views bidirectional — add-view/remove-view maintain BOTH sides (reuse R32.11/R33.8 add/remove-view), never one-sided.
- [ ] (gate) GATE @390 real-WebKit: Scenario/Edit on a projected view open the CORRECT base unit (verify the open-target); usedIn is bidirectional (place on diagram -> unit.usedIn + diagram.views both updated; remove -> both cleared).

## Subtasks

None (atomic task).
