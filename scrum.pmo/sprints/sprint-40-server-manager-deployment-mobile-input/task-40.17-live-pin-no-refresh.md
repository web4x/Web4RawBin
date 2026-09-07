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

- [ ] **(action-units-on-task-R40.5-R40.10)** BOTH assign-as-NEXT and assign-as-CURRENT are ACTION UNITS on the universalActionBar (per R40.5 de-duplication — real action units, NOT bespoke buttons), living ON the task item (like R40.10's approve/decline). They SHIP TOGETHER (assign-next without assign-current leaves the main control missing).
- [ ] **(owner-gated-403)** BOTH owner-gated, non-owner => 403. Priority is Tron's call; nobody self-promotes their own work (same integrity as approve: if anyone can set current/next, they mean nothing).
- [ ] **(records-as-data-R40.10-pattern)** RECORDS the assignment as DATA on the unit — assign-next => assignedNextBy/assignedNextAt; assign-current => assignedCurrentBy/assignedCurrentAt (the R40.10 approvedBy/approvedAt pattern) — so the pin's current AND next slots are PROVABLE not remembered (trustworthy after a rewind).
- [ ] **(explicit-overrides-derived-SINGLE-SOURCE)** ★ DESIGN-REQUIRED: EXPLICIT-assigned OVERRIDES DERIVED, single-sourced INSIDE resolveSprintPin — current = explicit-if-set ELSE derived; next = explicit-if-set ELSE derived; decided in the resolver, NEVER in a view. No two-sources-of-one-truth (the disease killed this session: two depref builders / two marker counts / two fabricated-uuid figures).
- [ ] **(current-UNBLOCKS-ambiguous-pin)** ★ ESCAPE-HATCH (named AC): an explicit assigned-CURRENT resolves the pin EVEN WHEN multiple sprints have open work. resolveSprintPin currently THROWS on ambiguity (5 current-era Active: S19/20/21/25/37) -> R40.11's pin renders 'current: unresolved (pending A1 sign-off)' and T40.6 is coupled+parked. An explicit assigned-current ANSWERS the question the resolver cannot answer from data alone => the pin becomes RESOLVABLE IMMEDIATELY, WITHOUT first driving 40+ legacy tasks to terminal.
- [ ] **(honest-visible-ambiguity-R-C5)** ★ HONESTY CONDITION: the explicit-current must NOT silently MASK the ambiguity. The multi-Active condition stays VISIBLE and COUNTED — reported via R-C5's audit (the frozen-legacy pattern: EXCLUDED from the DECISION, NEVER hidden from the REPORT). An honest throw traded for a quiet lie is the exact disease we killed this session.
- [ ] **(uniqueness-3-slot)** 3-SLOT UNIQUENESS: only ONE current and ONE next. Assigning CURRENT to a task presently NEXT must rotate/clear the next slot; assigning either must not collide with lastCompleted. REUSE the pin's existing distinctness enforcement — do NOT reimplement.
- [ ] **(device-390)** @390 real-device PIXEL gate — both actions reachable AND fireable on his phone.
- [ ] **(fail-loud)** FAIL-LOUD: if the assignment cannot be recorded, show an EXPLICIT error — never a silently-unchanged pin.
- [ ] **(architect-flag-no-auto-transition)** ★ ARCHITECT FLAG: does assigning CURRENT also TRANSITION the task (Planned -> In Progress) or leave status untouched? PO instinct = must NOT auto-transition (status stays checklist-derived per R-C5; assigning ATTENTION is not claiming WORK was started). His call — flagged, not decided.
- [ ] **(stub-must-fail/honesty)** Any user-facing text (banner/tooltip/label) describing the pin/current mechanism MUST describe the ACTUAL shipped mechanism: a STORED DESIGNATION input (designatedTaskUuid) that overrides the derived current (per AC-explicit-overrides-derived-SINGLE-SOURCE). stub-must-fail: user-facing text asserting the pin follows the derivation / no stored pin (contradicting the shipped designation) => grep-lint / @390 RED. (Tron v0.8.121 defect D: banner still reads no-stored-pin, the opposite of what we shipped.)

## Implementation

SHIPPED (v0.8.89/90) + chain-complete-to-Test (2f2984243). PRIMARY Impl 9073d5fd (handlePinDesignate notify-add) + RECEIVER Impl c3951765 (connectedCallback subscribe, R30.11) both markerPending=false; Test 9c2e7b41 (pass) two-keyed to PRIMARY. Tester two-keyed GREEN DET-3x @390 real-WebKit (2ea899ffe) -> planner FLIPPED to QA-Review 2026-08-11 (verify-owner-first PASSED: Impl 9073d5fd distinct sharedByTasks=[50f51ac1]; Test is R40.17's OWN). AC-4 device finger-tap = Tron. 0 Done till Tron verdict.

## Subtasks

None (atomic — the live-pin half only; assign-current/next full feature is a separate design-required task).
