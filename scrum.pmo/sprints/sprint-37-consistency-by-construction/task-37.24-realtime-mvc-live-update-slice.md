<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.24: Realtime-MVC live-update slice — a routed write appears live in item + detail + pin @390

[task:uuid:5acdcc4c-3f6c-4aea-95ad-3ab19b14ff40]

## Status
- [x] Planned
- [ ] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

The realtime-MVC live-update slice Tron is tracking ('the pixel gate at 390 passes'): route unit mutations through the ONE controller (UnitController.apply) so a change through ANY routed write path is reflected LIVE in the item view, the detail view, and the current/next pin — no reload. Slice-1 = the seam foundation (committed: 3c15eabd0/075273c97/b5c0e35d8/2617f22ab, decided routing list cd797ff27); the routing pass over the ~15 bypass sites is next on the fresh expert.

## Context

R37.11 ONE CONTROLLER (cfe02f4b) via UC mvc.applyMutation (3ee364a5) + Impl e3729f51 (UnitController.apply route-all-writes-through-seam). Seam already exists at unit-controller.ts:41; ~15 sites bypass it (server.ts idx.put x10 / EmailIndex.ts:68,71 / agent-message.ts:68,77,103 / skills.ts:59) so emit never fires + views go stale.

## Intention

Prove Tron's realtime-MVC ask on-device: a write is visible everywhere at once, @390, with no reload.

## Acceptance Criteria

**AC (the exact thing Tron is tracking):** A unit change made through ANY routed write path appears in the ITEM view AND the DETAIL view AND the current/next pin WITHOUT a reload — verified by SCREENSHOT+PIXEL on real WebKit @390 (NEVER a DOM count). PLUS **no-write-outside-the-seam lint** at 0-unallowed with STUB-MUST-FAIL: a graph-write / idx.put OUTSIDE UnitController.apply -> RED. PLUS **INV-T byte-diff==0 per routed site**: rendering never mutates the model (the unit is byte-identical before==after any render). Gate procedure: robbin-tester/r37-slice1-gate-spec.md.

## Implementation

ior:instance:e3729f51-3df6-4f6d-96e3-924c37e3c3c9

## Subtasks
