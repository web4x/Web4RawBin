<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.19: Protect history back-navigation — an EXECUTI

[task:uuid:c53bc75d-e0c3-4510-8a16-617759dae643]

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

Deliver + verify requirement R40.19 (Protect history back-navigation — an EXECUTI). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.19; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(regression-gate-behavioural-390)** A REGRESSION GATE for history back-navigation (R40.7's historyBack + pathLabelNav on RbEditorToolbar) that verifies BEHAVIOUR @390 on a REAL DEVICE: tap Back LANDS on the correct previous view, and path-label nav RESOLVES. Pixel/behavioural — NEVER a DOM count (a rendered control that does nothing passes a count).
- [ ] **(stub-must-fail)** STUB-MUST-FAIL: deliberately break historyBack and the gate MUST go RED. A gate that still passes when the behaviour is broken certifies NOTHING.
- [ ] **(in-gate-device-live)** ADDED TO gate:device:live (d5148b7d3) so it RUNS alongside the other device gates (it must actually execute, not just exist).
- [ ] **(depends-device-gate-trigger)** DEPENDS ON the post-deploy DEVICE-GATE TRIGGER (top of the post-reset work order — visual/device gates currently run NOWHERE, which is exactly why Tron's bugs arrive as screenshots). Until the trigger runs the gate, back-nav is unprotected.
- [ ] **(no-refactor-without-green)** NO REFACTOR may touch the nav path without this gate GREEN. Proof: the music player died to a unification refactor that dropped an eager call nobody re-checked; the S23 audio player silently regressed a whole sprint because its AC was headless-only and never re-ran. Back-nav meets the same fate unless an EXECUTING gate pins it.

## Subtasks
