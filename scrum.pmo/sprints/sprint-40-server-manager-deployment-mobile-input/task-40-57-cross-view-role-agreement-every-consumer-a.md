<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.57: Cross-view role AGREEMENT — every consumer a

[task:uuid:0f1df43c-106e-4afd-8b93-359db9fa1120]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.57 (Cross-view role AGREEMENT — every consumer a). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.57; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(by-construction/no-copy)** RETIRE pinRole from the served payload: a derived role is a pure fn of (thisTaskUuid, currentSlotUuid), both already live on the client; no copy = nothing to go stale = the disagreement class ELIMINATED, not mitigated. attachTaskPinRole retired as a payload field (server.ts:2901).
- [ ] **(by-construction/atomic)** ONE-EVENT ATOMIC AGREEMENT: the drawer subscribes the SAME viewBusKey({type:CurrentSprint,uuid:singleton}) the tree uses (ONE builder both sides, R37.12 Q3 — a raw-uuid subscribe is exactly why the tree once went stale) and derives taskRole AT RENDER by comparing its shown task's uuid to the ONE live current-slot uuid. A pin move = one event = ALL consumers re-derive = 'derived-role and pin-slot change atomically for all consumers' IS the invariant.
- [ ] **(cross-view/NEW-gate-class)** ★ CROSS-VIEW AGREEMENT (a NEW gate class: consumer-vs-consumer on the RENDERED artifact). On ONE rendered screen @390, for the SAME task, the pin/tree role and the action-bar's offered verbs MUST agree: current => Set-as-Current ABSENT; not-current => PRESENT. Asserted by SCREENSHOT, the two views checked against EACH OTHER — NOT each against the model. Every other gate we own compares an artifact to a model; THIS compares two artifacts (the gate Tron's eye is). [[assert-the-rendered-artifact-not-a-proxy]]
- [ ] **(cross-view/dynamic)** DYNAMIC-POST-BROADCAST IS MANDATORY (written INTO the AC so nobody later 'simplifies' it): the agreement assertion MUST be made AFTER a live make-current on a DIFFERENT task via the LIVE path (broadcast, NO drawer re-fetch), THEN screenshot. An initial-load check would PASS and MISS this bug entirely — the STATE UNDER TEST (post-broadcast, no re-fetch) IS PART OF THE ASSERTION. Initial-fetch agreement is trivial + would false-pass.
- [ ] **(enumerate-not-universal)** ENUMERATE the role-consumers on a screen (pin badge · tree highlight · action-bar verbs · drawer · scoreboard) + a DIVERGENCE check: a NEW role-consumer must be added to the agreement set or the gate flags it (a consumer outside the cross-check can silently disagree). FAIL-CLOSED: if any enumerated consumer's role can't be read for the comparison, RED — never skip-as-pass.
- [ ] **(stub-must-fail)** STUB-MUST-FAIL: inject a disagreement — re-bake a stale pinRole into the payload OR suppress the drawer's broadcast subscription -> a screen where the tree shows current but the drawer offers Set-as-Current -> the gate MUST RED. A gate that can't be made to fail by injecting a disagreement is not asserting agreement. This IS the R40.56-defect specimen at the RENDER layer (the strongest baseline).

## Subtasks
