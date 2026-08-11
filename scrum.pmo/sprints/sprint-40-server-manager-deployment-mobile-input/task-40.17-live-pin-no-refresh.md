<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.17: Live-pin no-refresh — pin-designate updates the sprint tree LIVE @390 (the shipped half of R40.17)

[task:uuid:50f51ac1-2f9a-46d4-8137-b4730b237e4f]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement `[requirement:uuid:b8c7fe29-b6bb-43bb-abe7-f985ad60eaf7]`
  - down
    - [UC](./planning.md) `[uc:uuid:201d1e58-241f-4669-8089-3c6e8fd13a74]`

## Task Description

The SHIPPED half of R40.17 (assign-as-current/next): when an owner designates a task CURRENT/NEXT, the sprint pin updates LIVE with NO page Refresh @390 (Tron's AC: actions happen LIVE in the tree). Consumer wiring over the pre-existing T103 ViewBus: handlePinDesignate fires ViewBus.notify on the CurrentSprint singleton ref after a 200 designate; RbTraceTree.connectedCallback subscribes -> re-fetches ONLY the 2-node pin (targeted, not flood). The assign-as-current/next FULL feature (owner-gated action units + resolveSprintPin explicit-override) stays design-required = a SEPARATE future task under R40.17.

## Context

Covers R40.17 (b8c7fe29) via UC pin.liveUpdateNoRefresh (201d1e58) -> handlePinDesignate PRIMARY Impl 9073d5fd (Test 9c2e7b41) + connectedCallback RECEIVER Impl c3951765 (R30.11). Chain-complete-to-Test (2f2984243); does NOT ride R37.12 ViewBus (consumer wiring). Gate r4017-live-pin-norefresh-gate.mjs GREEN DET-3x @390 real-WebKit (bus->view half).

## Intention

Make R40.17's shipped live-pin half a schedulable, QA-Review-able deliverable (it was credited via the chain but had NO task = invisible; mirror of the keybar reverse-credit-debt).

## Acceptance Criteria

- [ ] On a 200 /api/current-sprint/designate (assign current/next), ViewBus.notify fires on the CurrentSprint singleton ref (handlePinDesignate).
- [ ] The eager-lazy CurrentSprint subscriber (RbTraceTree.connectedCallback) re-fetches ONLY the 2-node pin (targeted, not a full-tree flood).
- [ ] The sprint tree updates LIVE @390 with NO page Refresh (Tron's AC: actions happen LIVE in the tree). [automatable bus->view half: r4017 gate GREEN DET-3x real-WebKit]
- [ ] The real owner-designate finger-tap on the action button = Tron device row (device-only, not headless).
- [ ] GATE: r4017-live-pin-norefresh-gate.mjs GREEN (bus->view half) + Test 9c2e7b41 two-keyed to Impl 9073d5fd.

## Implementation

SHIPPED (v0.8.89/90) + chain-complete-to-Test (2f2984243). PRIMARY Impl 9073d5fd (handlePinDesignate notify-add) + RECEIVER Impl c3951765 (connectedCallback subscribe, R30.11) both markerPending=false; Test 9c2e7b41 (pass) two-keyed to PRIMARY. Tester two-keyed GREEN DET-3x @390 real-WebKit (2ea899ffe) -> planner FLIPPED to QA-Review 2026-08-11 (verify-owner-first PASSED: Impl 9073d5fd distinct sharedByTasks=[50f51ac1]; Test is R40.17's OWN). AC-4 device finger-tap = Tron. 0 Done till Tron verdict.

## Subtasks

None (atomic — the live-pin half only; assign-current/next full feature is a separate design-required task).
